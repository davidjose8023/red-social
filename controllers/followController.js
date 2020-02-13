'use strict'

// const  path = require('path');
// const fs = require();
const mongoosePaginate = require('mongoose-pagination');

var UserModel = require('../models/user');
var FollowModel = require('../models/follow');

function saveFollow(req, res) {

    const params = req.body;
    var  follow = new FollowModel();
    follow.user = req.user.sub;
    follow.followed = params.followed;

    follow.save((err, followStored) => {

        if(err) return res.status(500).send({message: 'Error en la petición'});

        if(!followStored) return res.status(404).send({message: 'El Seguimiento no se ha guardado'});

        return res.status(200).send({follow: followStored});
    });

 
}

function deleteFollow(req, res){
    
    const userId = req.user.sub;
    const followId = req.params.id;

    FollowModel.find({ user: userId, followed: followId }).deleteMany(err => {
        if(err) return res.status(500).send({message: 'Error al dejar seguir'}); 

        res.status(200).send({message: 'El follow a sido eliminado'}); 


    });
}
// Lista de los que sigue
function getFollowingUsers(req, res){

    const userId = (req.params.id ? req.params.id : req.user.sub );
    const page = (req.params.page ? req.params.page : 1 );

    var itemsPerPage = 4;
    FollowModel.find({user: userId}).populate({path: 'followed'}).paginate(page, itemsPerPage, (err, follows, total) => {

        if(err) return res.status(500).send({message: 'Error en la petición'});

        if(!follows) return res.status(404).send({message: 'No estas siguiendo a ningun usuario'});

        return res.status(200).send({ total, pages: Math.ceil(total/itemsPerPage), follows });


    });
}
// Lista de los seguidores
function getFollowedUsers(req, res){

    const userId = (req.params.id ? req.params.id : req.user.sub );
    const page = (req.params.page ? req.params.page : 1 );

    var itemsPerPage = 4;

    // El populate es como un join y al colocar los nombre del campo buscara por el campo donde en el modelo este configurado
    FollowModel.find({followed: userId}).populate('user followed').paginate(page, itemsPerPage, (err, follows, total) => {

        if(err) return res.status(500).send({message: 'Error en la petición'});

        if(!follows) return res.status(404).send({message: 'No te sigue ningun usuario'});

        return res.status(200).send({ total, pages: Math.ceil(total/itemsPerPage), follows });


    });
}

function getMyFollows(req, res){

    const userId =  req.user.sub ;
 

    // El populate es como un join y al colocar los nombre del campo buscara por el campo donde en el modelo este configurado
    var find = (req.params.followed ? FollowModel.find({user: req.params.followed}) : FollowModel.find({user: userId}) );

    find.populate('user followed').exec((err, follows) => {

        if(err) return res.status(500).send({message: 'Error en la petición'});

        if(!follows) return res.status(404).send({message: 'No estas siguiendo a ningun usuario'});

        return res.status(200).send({  follows });


    });

}


module.exports = {
    saveFollow,
    deleteFollow,
    getFollowingUsers,
    getFollowedUsers,
    getMyFollows
    
}