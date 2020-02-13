'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var secret = 'clave_secreta_curso';

exports.ensureAuth = function(req, res, next){

    if(!req.headers.authorization){
        return res.status(403).send({message: 'La petición no tiene la cabecera de autenticación'});
    }
    var token = req.headers.authorization.replace(/['"]+/g,'');// se remplaza cualquier comilla simple o doble y obtener el token limpio de la peticion

    try {
        var payload = jwt.decode(token, secret);

        if(payload.exp <= moment().unix()){
            return res.status(401).send({message: 'El token ha expirado'});
        }
    } catch (error) {
        return res.status(404).send({message: 'El token no es valido'});
    }

    req.user = payload;

    next();

}