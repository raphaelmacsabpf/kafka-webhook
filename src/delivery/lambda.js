'use strict';

const KafkaWebhookService = require('../services/kafka-webhook');

module.exports.handler = async (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;

    const kafkaWebhook = new KafkaWebhookService(
        'pending-webhooks',
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
