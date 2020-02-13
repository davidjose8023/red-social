'use strict'

const express = require('express');
const PublicationController = require('../controllers/publicationController');

const api = express.Router();
const md_auth = require('../middleware/authenticated');
var multipart = require('connect-multiparty');
var md_upload = multipart({uploadDir: './upload/publications'} );// se le indica al multipart donde se debe guardar los archivos

api.get('/probando-pub', md_auth.ensureAuth, PublicationController.probando);
api.post('/add-publication', md_auth.ensureAuth, PublicationController.savePublication);
api.get('/publications/:page?', md_auth.ensureAuth, PublicationController.getPublications);
api.get('/publication/:id', md_auth.ensureAuth, PublicationController.getPublication);
api.delete('/publication/:id', md_auth.ensureAuth, PublicationController.deletePublication);
api.post('/upload-image-pub/:id', [md_auth.ensureAuth, md_upload ], PublicationController.uploadImagePublication );
api.get('/get-image-pub/:imageFile',  PublicationController.getImageFile);
 



module.exports= api;