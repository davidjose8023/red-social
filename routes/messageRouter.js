'use strict'

var express = require('express');
var messageController = require('../controllers/messageController');

var api = express.Router();
var md_auth = require('../middleware/authenticated');


api.post('/message', md_auth.ensureAuth, messageController.saveMessage);
api.get('/my-message/:page?', md_auth.ensureAuth, messageController.getReceiverMessage);
api.get('/message/:page?', md_auth.ensureAuth, messageController.getReceiverMessage);
api.get('/unviewed-messages', md_auth.ensureAuth, messageController.getUnViewedMessage);
api.put('/set-viewed-messages', md_auth.ensureAuth, messageController.setViewedMessages);

module.exports = api;  