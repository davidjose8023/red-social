'use strict'

var express = require('express');
var UserController = require('../controllers/userController');

var api = express.Router();
var md_auth = require('../middleware/authenticated');
var multipart = require('connect-multiparty');
var md_upload = multipart({uploadDir: './upload/users'} );

api.get('/home', UserController.home);
api.get('/pruebas',md_auth.ensureAuth,  UserController.pruebas);
api.post('/register', UserController.saveUser);
api.post('/login', UserController.loginUser);
api.get('/user/:id', md_auth.ensureAuth, UserController.getUser);
api.get('/users/:page?', md_auth.ensureAuth, UserController.getUsers);// ? significa que el paraetro page es opcional
api.put('/update-user/:id', md_auth.ensureAuth, UserController.updateUser); // put para actualizar recursos en el api
api.post('/upload-image-user/:id', [md_auth.ensureAuth, md_upload ], UserController.uploadImage );
api.get('/get-image-user/:imageFile',  UserController.getImageFile);
api.get('/get-counters/:id?',md_auth.ensureAuth, UserController.getCounters);
module.exports = api;   