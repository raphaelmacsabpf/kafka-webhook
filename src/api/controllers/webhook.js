class WebhookController {
    post(req, res) {
        res.json({ok: true});
    }
}

module.exports = new WebhookController();