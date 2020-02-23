const kafka = require('kafka-node');
const kafkaClient = new kafka.KafkaClient({kafkaHost: process.env.KAFKA_HOST});
const kafkaProducer = new kafka.Producer(kafkaClient);

const KAFKA_TOPIC = 'pending-webhooks';

class WebhookService {
    async enqueueWebhook(path, body, headers) {
        const payload = {
            topic: KAFKA_TOPIC,
            messages: {path, body, headers}
        };
        
        return new Promise((resolve, reject) => {
            kafkaProducer.send([payload], (err, data) => {
                if(err) {
                    console.log(err);
                    reject();
                }
                else  {
                    console.log(data);
                    resolve();
                }
            });
        });
    }
}

module.exports = new WebhookService();