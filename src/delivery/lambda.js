'use strict';

const kafkaWebhookService = require('../services/kafka-webhook');

module.exports.handler = async event => {
    kafkaWebhookService('pending-webhooks', function() {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, 2000);
        });
    });
};