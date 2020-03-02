const kafka = require('kafka-node');
const kafkaConfig = require('../../config/kafka');

class WebhookService {
    constructor(kafkaTopic) {
        this.kafkaTopic = kafkaTopic;

        const kafkaClient = new kafka.KafkaClient({
            kafkaHost: kafkaConfig.KAFKA_BROKER_HOST,
        });
        this.kafkaProducer = new kafka.Producer(kafkaClient, {
            partitionerType: 2 /* cyclic partitioner */,
        });
    }

    async enqueueWebhook(remainingTries, path, body, headers) {
        const payload = {
            topic: this.kafkaTopic,
            messages: JSON.stringify({
                remainingTries,
                webhook: { path, body, headers },
            }),
        };

        return new Promise((resolve, reject) => {
            this.kafkaProducer.send([payload], (err, data) => {
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
