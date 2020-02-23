const webhookService = require('../services/webhook');

class WebhookController {
    async post(req, res) {
        await webhookService.enqueueWebhook();
        res.json({ok: true});
    }
}

module.exports = new WebhookController();