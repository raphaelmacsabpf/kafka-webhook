const kafka = require('kafka-node');

const kafkaClient = new kafka.KafkaClient({
    kafkaHost: process.env.KAFKA_HOST,
});
const kafkaProducer = new kafka.Producer(kafkaClient, {
    partitionerType: 2 /* cyclic partitioner */,
});

class WebhookService {
    constructor(kafkaTopic) {
        this.kafkaTopic = kafkaTopic;
    }

    async enqueueWebhook(path, body, headers) {
        const payload = {
            topic: this.kafkaTopic,
            messages: JSON.stringify({ id: Date.now(), path, body, headers }),
        };

        return new Promise((resolve, reject) => {
            kafkaProducer.send([payload], (err, data) => {
                if (err) {
                    console.log(err);
                    reject();
                } else {
                    console.log(data);
                    resolve();
                }
            });
        });
    }
}

module.exports = WebhookService;
