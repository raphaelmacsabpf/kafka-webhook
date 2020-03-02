const kafkaConfig = require('../../../config/kafka');
const WebhookService = require('../../services/webhook');

class WebhookController {
    constructor() {
        this.webhookService = new WebhookService(
            kafkaConfig.PENDING_WEBHOOKS_TOPIC,
        );
    }

    async post(req, res) {
        const path = req.body.path;
        const body = req.body.body;
        const headers = req.body.headers;

        await this.webhookService.enqueueWebhook(path, body, headers);

        return res.json({ ok: true });
    }
}

module.exports = new WebhookController();
