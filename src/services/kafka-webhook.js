'use strict';

const kafka = require('kafka-node');
const webhookService = require('../services/webhook');

class KafkaWebhookService {
    constructor(topic, executeJob) {
        const kafkaDefaultOptions = {
            kafkaHost: '127.0.0.1:9092',
            groupId: '123456', /* All consumers with same groupId will fetch messages from different partitions */
            autoCommit: true,
            ssl: false,
            autoCommitIntervalMs: 1000,
            sessionTimeout: 30000,
            protocol: ['roundrobin'],
            fromOffset: 'latest',
            outOfRangeOffset: 'earliest' ,
            fetchMaxBytes: 1024
        };

        this.kafkaConsumer = new kafka.ConsumerGroup(kafkaDefaultOptions, topic);
        this.closed = false;
        this.messageCount = 0;
        this.finishedMessages = 0;
        this.successMessages = 0;
        this.lastMessage = Date.now();
        this.executeJob = executeJob;

        handleConsumerState.call(this);
        addKafkaListeners.call(this);
    }
}

function addKafkaListeners() {
    this.kafkaConsumer.on('connect', () => console.log('>>>>[CONNECT]<<<<'));
    this.kafkaConsumer.on('error', (err) => console.log('>>>>[ERROR]<<<<'));
    this.kafkaConsumer.on('offsetOutOfRange', (err) => console.log('>>>>[OFFSET_OUT_OF_RANGE]<<<<'));
    this.kafkaConsumer.on('rebalancing', () => console.log('>>>>[REBALANCING]<<<<'));
    this.kafkaConsumer.on('rebalanced', (message) => console.log('>>>>[REBALANCED]<<<<'));
    this.kafkaConsumer.on('message', onMessage.bind(this));
}

async function onMessage(message) {
    this.lastMessage = Date.now();
    if(this.closed) {
        console.log(`Closed received [${this.messageCount}], partition: ${message.partition}`);
    }
    this.messageCount ++;
    console.log(`Received message[${this.messageCount}], partition: ${message.partition}, offset: ${message.offset}`);
    if(this.messageCount % 100 == 0 && this.closed == false) {
        this.closed = true;
        setTimeout(() => {
            this.kafkaConsumer.pause();
        }, 1);
    }

    await this.executeJob().catch(async () => {
        console.log(`Error, reenqueueing partition: ${message.partition}, offset: ${message.offset}`);
        await webhookService.enqueueWebhook(message.value.path, message.value.body, message.value.headers);
    });

    console.log(`Finished, partition: ${message.partition}, offset: ${message.offset}`);
    this.successMessages ++;
    this.finishedMessages ++;
}

function handleConsumerState() {
    const interval = setInterval(() => {
        const now = Date.now();
        if(this.closed && this.messageCount > 0 && now - this.lastMessage > 1000 && this.messageCount == this.finishedMessages) {
            this.closed = false;
            this.kafkaConsumer.resume();
            console.log(`Resumed, but the total success is: ${this.successMessages}`);
            if(now - this.lastMessage > 60000) {
                console.log(`Strategic close, lastMessage: ${now}`);
                this.kafkaConsumer.close(true, consumerCloseError => {
                    console.log(`Done, with finishedMessages: ${this.finishedMessages}, success: ${this.successMessages}`);
                    this.kafkaConsumer.client.close(clientCloseError => {
                        console.log(`Kafka client closed: ${JSON.stringify(clientCloseError)}`);
                        clearInterval(interval);
                    });
                });
            }
       }
    }, 100);
}

module.exports = function(topic, executeJob) {
    return new KafkaWebhookService(topic, executeJob);
};