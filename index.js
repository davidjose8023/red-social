'use strict'

var mongoose = require('mongoose'); // libreria para poder conectarse y trabajar con mongo Db
var app = require('./app');
var port = 3800;

// Concexion bajo promesa a mongo db
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/curso_mean_social', {useNewUrlParser: true})
                .then(() =>{
                    console.log("Excelente conexion a la BD curso_mean_social satisfactoria");

                    // crear servidor
                    app.listen(port, () => {
                        console.log("Servidor Corriendo en http://localhost:3800");
                    });
                }).catch(err => console.log(err));
