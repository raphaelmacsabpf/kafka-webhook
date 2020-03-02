'use strict';

const kafkaConfig = require('../../config/kafka');
const KafkaWebhookService = require('../services/kafka-webhook');

module.exports.handler = async (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;

    const kafkaWebhook = new KafkaWebhookService(
        kafkaConfig.PENDING_WEBHOOKS_TOPIC,
        function() {
            return new Promise((resolve, reject) => {
                setTimeout(resolve, 2000);
            });
        },
    );

    kafkaWebhook.on('closed', () => {
        callback(null, { success: true });
    });
};
