'use strict';

const kafkaConfig = require('../../config/kafka');
const EventEmitter = require('events');
const Kafka = require('kafka-node');
const WebhookService = require('../services/webhook');

class KafkaWebhookService extends EventEmitter {
    constructor(topic, executeJob) {
        super();
        const kafkaDefaultOptions = {
            kafkaHost: kafkaConfig.KAFKA_BROKER_HOST,
            groupId:
                '123456' /* All consumers with same groupId will fetch messages from different partitions */,
            autoCommit: true,
            ssl: false,
            autoCommitIntervalMs: 1000,
            sessionTimeout: 30000,
            protocol: ['roundrobin'],
            fromOffset: 'latest',
            outOfRangeOffset: 'earliest',
            fetchMaxBytes: 1024,
        };

        this.webhookService = new WebhookService(topic);
        this.kafkaConsumer = new Kafka.ConsumerGroup(kafkaDefaultOptions, [
            topic,
            'retry-webhooks',
        ]);
        this.consumerPaused = false;
        this.pendingMessages = 0;
        this.lastMessageTimestamp = Date.now();
        this.executeJob = executeJob;

        handleConsumerState.call(this);
        addKafkaListeners.call(this);
    }
}

function addKafkaListeners() {
    this.kafkaConsumer.on('connect', () => console.log('>>>>[CONNECT]<<<<'));
    this.kafkaConsumer.on('error', () => console.log('>>>>[ERROR]<<<<'));
    this.kafkaConsumer.on('offsetOutOfRange', () =>
        console.log('>>>>[OFFSET_OUT_OF_RANGE]<<<<'),
    );
    this.kafkaConsumer.on('rebalancing', () =>
        console.log('>>>>[REBALANCING]<<<<'),
    );
    this.kafkaConsumer.on('rebalanced', () =>
        console.log('>>>>[REBALANCED]<<<<'),
    );
    this.kafkaConsumer.on('message', onMessage.bind(this));
}

async function onMessage(message) {
    this.lastMessageTimestamp = Date.now();
    this.pendingMessages++;
    console.log(
        `Received message, partition: ${message.partition}, offset: ${message.offset}`,
    );

    const consumerHasToPauseWork =
        this.pendingMessages >= 100 && this.consumerPaused == false;

    if (consumerHasToPauseWork) {
        console.log('Consumer paused');
        this.consumerPaused = true;
        setTimeout(() => {
            this.kafkaConsumer.pause();
        }, 1);
    }

    const messageValue = JSON.parse(message.value);
    let errorTryingReenqueue = false;
    await this.executeJob(messageValue).catch(async reason => {
        if (reason.response) {
            console.log(
                `Request failed to: ${messageValue.webhook.path}, statusCode: ${reason.response.status}, remainingTries: ${messageValue.remainingTries}`,
            );
        } else {
            console.log(
                `Request error to: ${messageValue.webhook.path}, error: ${reason}}, remainingTries: ${messageValue.remainingTries}`,
            );
        }

        if (messageValue.remainingTries > 0) {
            this.webhookService.enqueueWebhook(
                messageValue.remainingTries - 1,
                messageValue.webhook.path,
                messageValue.webhook.body,
                messageValue.webhook.headers,
            );
            console.log('Webhook reenqueued');
        } else {
            errorTryingReenqueue = true;
            console.log('Max attempts reached');
        }
    });

    this.pendingMessages--;
    if (errorTryingReenqueue == false) {
        console.log(
            `Finished, partition: ${message.partition}, offset: ${message.offset}`,
        );
    }
}

function handleConsumerState() {
    const checkIntervalRef = setInterval(() => {
        const consumerHasToResumeWork =
            this.consumerPaused &&
            Date.now() - this.lastMessageTimestamp > 1000 &&
            this.pendingMessages <= 50;

        if (consumerHasToResumeWork) {
            this.consumerPaused = false;
            this.kafkaConsumer.resume();
            console.log('Consumer resumed');
        }

        handleConsumerClosingStrategy.call(this, checkIntervalRef);
    }, 100);
}

function handleConsumerClosingStrategy(checkIntervalRef) {
    const consumerHasToCloseWorker =
        Date.now() - this.lastMessageTimestamp > 60000;

    if (consumerHasToCloseWorker) {
        console.log('Closing worker');
        this.kafkaConsumer.close(true, consumerCloseError => {
            this.kafkaConsumer.client.close(clientCloseError => {
                console.log(
                    `Kafka client consumerPaused: ${JSON.stringify(
                        clientCloseError,
                    )}`,
                );
                clearInterval(checkIntervalRef);
                this.emit('closed');
            });
        });
    }
}

module.exports = KafkaWebhookService;
