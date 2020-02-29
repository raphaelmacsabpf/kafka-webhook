const WebhookService = require('../../services/webhook');

class WebhookController {
    constructor() {
        this.webHookservice = new WebhookService();
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
