const serverless = require('serverless-http');
const express = require('express');
const bodyParser = require('body-parser');
const webhookController = require('./controllers/webhook');

const app = express();
const router = express.Router();
app.use(bodyParser.json());

router.post('/webhook', webhookController.post);

app.use(router);

module.exports.handler = serverless(app);
