'use strict'

var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var User = require('../models/user');
var Follow = require('../models/follow');
var Message = require('../models/message');

function saveMessage(req, res){
    var params = req.body;
    

    if(!params.text || !params.receiver ) return res.status(200).send({message: 'Debes enviar un texto'});

    var message = new Message();
    message.emmiter = req.user.sub;
    message.receiver = params.receiver;
    message.text = params.text;  
    message.created_at = moment().unix();
    message.viewed = 'false';
    message.save((err, messageStored) => {
        if(err) return res.status(500).send({message: 'Error al guardar el mensaje'}); 

        if(messageStored){
            return res.status(200).send({message: messageStored});
        }else{
            return res.status(404).send({ message: 'No se ha registrado el mensaje'});
        }
    });

}

function getReceiverMessage(req, res){

    const page = (req.params.page ? req.params.page : 1 );

    var itemsPerPage = 4;


    // $in se utiliza para buscar informacion de un documento en un array las considencia son las que saldran

    Message.find({receiver: req.user.sub} ).populate('emmiter', 'name surname _id image').paginate(page, itemsPerPage, (err, messages, total) =>{
        if(err) return res.status(500).send({message: 'Error al devolver publicaciones'});

        if(!messages) return res.status(404).send({message: 'No hay mensajes Disponibles'});

        return res.status(200).send({
            total_items : total,
            messages,
            page: Math.ceil(total/itemsPerPage),
        });

    });
 
}

function getEmitterMessage(req, res){

    const page = (req.params.page ? req.params.page : 1 );

    var itemsPerPage = 4;


    // $in se utiliza para buscar informacion de un documento en un array las considencia son las que saldran

    Message.find({emitter: req.user.sub} ).populate('receiver emitter', 'name surname _id image').paginate(page, itemsPerPage, (err, messages, total) =>{
        if(err) return res.status(500).send({message: 'Error al devolver publicaciones'});

        if(!messages) return res.status(404).send({message: 'No hay mensajes Disponibles'});

        return res.status(200).send({
            total_items : total,
            messages,
            page: Math.ceil(total/itemsPerPage),
        });

    });
 
}

function getUnViewedMessage(req, res){

    Message.count({receiver: req.user.sub, viewed: 'false'}).exec((err, count)=>{
        if(err) return res.status(500).send({message: 'Error al devolver publicaciones'});
 

        return res.status(200).send({
            
            unviewed: count
            
        });
    });
}

function setViewedMessages(req, res){

    Message.update({receiver: req.user.sub, viewed: 'false'}, {viewed: 'true'}, {'multi':true}, (err, mesageUpdate)=>{
        if(err) return res.status(500).send({message: 'Error en la peticion'});

        return res.status(200).send({
            
            messages: mesageUpdate
            
        });
    });

}
module.exports = {
    saveMessage,
    getReceiverMessage,
    getEmitterMessage,
    getUnViewedMessage,
    setViewedMessages
}