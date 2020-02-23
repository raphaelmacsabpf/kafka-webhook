const kafka = require('kafka-node');
const kafkaClient = kafka.kafkaClient({kafkaHost: process.env.KAFKA_HOST});
const kafkaProducer = new kafka.Producer(kafkaClient);

const KAFKA_TOPIC = 'pending-webhooks';

class WebhookService {
    async enqueueWebhook(path, body, headers) {
        const payload = {
            topic: KAFKA_TOPIC,
            messages: {path, body, headers}
        };
        
        return new Promise((resolve) => {
            kafkaProducer.send([payload], (err, data) => {
                resolve();
            });
        });
    }
}

module.exports = new WebhookService();