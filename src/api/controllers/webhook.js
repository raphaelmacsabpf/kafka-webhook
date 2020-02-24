const webhookService = require('../../services/webhook');

class WebhookController {
    async post(req, res) {
        const path = req.body.path;
        const body = req.body.body;
        const headers = req.body.headers;

        await webhookService.enqueueWebhook(path, body, headers);
        res.json({ok: true});
    }
}

module.exports = new WebhookController();