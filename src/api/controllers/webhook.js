const WebhookService = require('../../services/webhook');

class WebhookController {
    constructor() {
        this.webhookService = new WebhookService('pending-webhooks');
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
