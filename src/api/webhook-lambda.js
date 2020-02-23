const serverless = require('serverless-http');
const express = require('express');
const WebhookController = require('./controllers/webhook');

const app = express();
const router = express.Router();

router.post('/webhook', WebhookController.post);

app.use(router);

module.exports.handler = serverless(app);