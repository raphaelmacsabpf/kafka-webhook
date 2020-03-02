'use strict';
const axios = require('axios').default;
const kafkaConfig = require('../../config/kafka');
const KafkaWebhookService = require('../services/kafka-webhook');

module.exports.handler = async (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;

    const kafkaWebhook = new KafkaWebhookService(
        kafkaConfig.PENDING_WEBHOOKS_TOPIC,
        data => {
            const webhook = data.webhook;
            return axios.post(webhook.path, webhook.body, {
                headers: webhook.headers,
            });
        },
    );

    kafkaWebhook.on('closed', () => {
        callback(null, { success: true });
    });
};
