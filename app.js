'use strict'

//importando el framework express
var express = require('express');
var bodyParser = require('body-parser');

var app = express();

// cargar rutas
var user_routes = require('./routes/userRouter');
var follow_routes = require('./routes/followRouter');
var publication_routes = require('./routes/publicationRouter');
var message_routes = require('./routes/messageRouter');
// middlewares

app.use(bodyParser.urlencoded({extended:false})); // configuracion necesario para body-parser
app.use(bodyParser.json()); // esta configuracion se hace para convertir cualquier peticion a json

// cors
// esto es una configuracion para estableceer las cabeceras necesario al momento de hacer peticiones ajax desde el frontend
// y no tener ningun problema
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
 
    next();
});


// rutas

app.use('/api', user_routes);
app.use('/api', follow_routes);
app.use('/api', publication_routes);
app.use('/api', message_routes);

//exportar

module.exports = app ;