const serverless = require('serverless-http');
const express = require('express');
const webhookController = require('./controllers/webhook');

const app = express();
const router = express.Router();

router.post('/webhook', webhookController.post);

app.use(router);

module.exports.handler = serverless(app);