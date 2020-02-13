'use strict'

var bcrypt = require('bcrypt-nodejs');
var User = require('../models/user');
var Follow = require('../models/follow');
var Publication = require('../models/publication');
var jwt = require('../services/jwt');
var mongoosePagintate = require('mongoose-pagination');
var fs = require('fs');
var path = require('path');
 

function home(req, res){

    res.status(200).send({
        message: 'hola mundo desde servidor NodeJS'
    });
}

// Registro de Usuario
function saveUser(req, res){

    var params = req.body;
    var user = new User();

    if(params.name && params.surname && params.nick 
        && params.email && params.password){

            user.name = params.name;
            user.surname = params.surname;
            user.nick = params.nick;
            user.email = params.email;
            user.role = 'ROLE_USER';
            user.image = null;
            // Validar usuarios Duplicados
            User.find({ $or: 
                        [
                            {email: user.email.toLowerCase()},
                            {nick: user.nick.toLowerCase()}
                        ]}).exec((err, users) => {
                            if(err) return res.status(500).send({message: 'Error en la peticion de Usuarios'}); 
                            if(users && users.length >= 1){
                                return res.status(200).send({message: 'El Usuario ya existe'}); 
                            }else{
                                // Cifro la password y guardo los datos               
                                bcrypt.hash(params.password, null, null, (err,hash) => {

                                user.password = hash;
                                user.save((err, userStored) => {
                                    if(err) return res.status(500).send({message: 'Error al guardar usuario'}); 

                                    if(userStored){
                                        res.status(200).send({user: userStored});
                                    }else{
                                        res.status(404).send({ message: 'No se ha registrado el usuario'});
                                    }
                                });
                                });
                            }
                        });
        

    }else{

        res.status(200).send({
                message: 'Llene todo los campos requeridos'
        });
    }
}
// Login
function loginUser(req, res){

    var params = req.body;
    var email = params.email;
    var password = params.password;

    User.findOne({email:email}, (err, user) => {
    
        if(err) return res.status(500).send({message: 'Error en la petición'});

        if(user){
            bcrypt.compare(password, user.password, (err, check) => {
                
                if(check){
                    // devolver datos del usuario
                    if(params.gettoken){

                        return res.status(200).send({
                            token: jwt.createToken(user)
                        });

                    }else{
                        user.password = undefined;
                        return res.status(200).send({user});
                    }
                    

                }else{
                    return res.status(404).send({message: 'El Usuario nose a podido identificar'});
                }
            });
        }else{
            return res.status(404).send({message: 'El Usuario no existe ¡¡'});
        }
    } );
}

// conseguir los dato de un usuario

function getUser(req, res){

    var userId = req.params.id;

    User.findById(userId, (err, user) => {
        if(err) return res.status(500).send({message: 'Error en la petición'});

        if(!user) return res.status(404).send({message: 'El Usuario no exite'}); 

        //Follow.findOne({user: req.user.sub, followed: userId }).exec((err, follow) => {

            //if(err) return res.status(500).send({message: 'Error al comprobar el siguimiento'});
            //return res.status(200).send({user, follow});
        //});
        
        followThisUser(req.user.sub, userId).then( (value) => {
            return res.status(200).send({user, value});
        });

        


    });

}

// async function followThisUser(identity_user_id, user_id){
//     console.log(identity_user_id);
//     const following = await Follow.findOne({user: identity_user_id, followed: user_id }).exec((err, follow) => {

//         if(err) return handleError(err);
//         console.log(follow);
//         return follow;
//     });
//     const followed = await Follow.findOne({user: user_id, followed: identity_user_id }).exec((err, follow) => {

//         if(err) return handleError(err);
//         return follow;
//     });

//     console.log(following);

//     return {
//         'following': following, 
//         'followed': followed
//     }
// }

const followThisUser = async (identity_user_id, user_id) => {
    try{
        // Lo hice de dos formas. "following" con callback de countDocuments y "followed" con una promesa
        let following = await Follow.findOne({user: identity_user_id, followed: user_id },(err, result) => { return result });
        let followed = await Follow.findOne({user: user_id, followed: identity_user_id }).then(result => result);

        return { following, followed }
        
    } catch(e){
        console.log("error hola");
        console.log(e);
    }
 
    
}
// Devolver un Listado de Usuario paginados

function getUsers(req, res){

    var identity_user_id = req.user.sub;

    var page = 1;
    if(req.params.page){ // verificar si viene la pagina del paginado

        page = req.params.page;
    }
    var itemsPerPage = 5;
    // page numero de pagina que estamo actualmente
    //itemsPerPage cantidad de registro que hay por pagina
    User.find().sort('_id').paginate(page, itemsPerPage, (err, users, total) => {

        if(err) return res.status(500).send({message: 'Error en la petición'});

        if(!users) return res.status(404).send({message: 'No hay Usuarios Disponibles'});
        
        followUserIds(identity_user_id).then((value) => {
            return res.status(200).send(
                {
                    users, 
                    total, 
                    pages: Math.ceil(total/itemsPerPage),
                    user_following : value.following,
                    user_followed : value.followed
                }
            );
        });

        


    });
}
function getCounters(req, res){
    console.log(req.user.sub);
    if(req.params.id){
        
        getCountFollow(req.params.id).then(value => {
            
            return  res.status(200).send(value);
        });

    }else{
        getCountFollow(req.user.sub).then(value => {
            
            return  res.status(200).send(value);
        });
    }
}
const getCountFollow = async (userId) => {
    try{
        let following = await Follow.count({user: userId}).then((count) => {
            
            return count;
        });
        let followed = await Follow.count({followed: userId}).then((count) => {
            
            return count;
        });

        let publications = await Publication.count({user: userId}).then(count => count );

        return {following, followed, publications}
    } catch(e){
        console.log("error hola");
        console.log(e);
    }
}
// ids de usuario que sigo y los que me siguen en un array
const followUserIds = async (userId) =>  {

    try{
    let following = await Follow.find({user: userId}).select({'_id': 0, '__v': 0, 'user': 0}).then( follow => {
        let follows_clean = [];

        follow.forEach(element => {
            follows_clean.push(element.followed);
        });
        return follows_clean;
    });

    let followed = await Follow.find({followed: userId}).select({'_id': 0, '__v': 0, 'followed': 0}).then( follow => {
        let followed_clean = [];

        follow.forEach(element => {
            followed_clean.push(element.user);
        });
        return followed_clean;
    });
    console.log(following);
    console.log(followed);
    return { following, followed };
} catch(e){
    console.log("error hola");
    console.log(e);
}
}


// Edición de datos de usuarios

function updateUser(req, res){
    var userId = req.params.id;
    var update = req.body;

    // Borrar propiedad Password
    delete update.password;

    //console.log('usuario logeado :'+ req.user.sub);
    //console.log('usuario Editado :'+ userId);
    if(userId != req.user.sub){
        return res.status(500).send({message: 'No tienes permiso para actualizar los datos del Usuario'});
    }

    User.findById(userId, (err, user) => {
        if(err) return res.status(500).send({message: 'Error en la petición'});

        if(!user) return res.status(404).send({message: 'El Usuario no exite'}); 
        // validar nick y email duplicados y preguntando si el email es diferente al del usuario actual
        User.find({ $or: 
            [
                {email: update.email.toLowerCase()},
                {nick: update.nick.toLowerCase()}
            ],email: {'$ne' :user.email }}).exec((err, users) => {// '$ne' es diferente
                if(err) return res.status(500).send({message: 'Error en la peticion de Usuarios'}); 
                if(users && users.length >= 1){
                    return res.status(200).send({status : 'fail', message: 'El nick ó el email se encuentran en uso por otro'}); 
                }else{
                
                    // este metodo recibe id, los datos a actualizar y  {new:true} para decirle que devuelva userUpdate con los datos actualizados
                    User.findByIdAndUpdate(userId, update, {new:true}, (err, userUpdate) => {
                        if(err) return res.status(500).send({message: 'Error en la petición'});

                        if(!userUpdate) return res.status(404).send({message: 'No se ha podido actualizar'});

                        return res.status(200).send({user: userUpdate});
                    });
                }
            });
    });

    

    

}

// Subir imagen/Avatar de usuario

function uploadImage(req, res){
    var userId = req.params.id;

    if(req.files){
        var file_path = req.files.image.path;
        console.log(file_path);

        var file_split = file_path.split('\\');
        console.log(file_split);

        var file_name = file_split[2];

        var ext_split = file_name.split('\.');
        var file_ext = ext_split[1];

        if(userId != req.user.sub){
            fs.unlink(file_path, (err) => {
                return res.status(500).send({message: 'No tienes permiso para actualizar los datos del Usuario'});
            });
            
        }
        var allowedExtensions = /(.jpg|.jpeg|.png|.gif)$/i;
        if(allowedExtensions.exec(file_path)){
            //Actualizar documento de usuario logeado
            User.findByIdAndUpdate(userId, {image: file_name }, {new:true}, (err, userUpdate) => {
                if(err) return res.status(500).send({message: 'Error en la petición'});
        
                if(!userUpdate) return res.status(404).send({message: 'No se ha podido actualizar'});
                
                // console.log(userUpdate);
                return res.status(200).send({user: userUpdate});
            });
        }else{
            fs.unlink(file_path, (err) => {
                return res.status(200).send({message: 'Extensión no valida'});
            });
            
        }

    }else{

        return res.status(200).send({message: 'No se han subido imagenes'});
    }
}

function getImageFile(req, res){

    const image_file = req.params.imageFile;
    const path_file = './upload/users/'+image_file;

    fs.exists(path_file, (exists) => {
        if(exists){
            res.sendFile(path.resolve(path_file));
        }else{
            res.status(200).send({message: 'No se han subido imagenes'});
        }
    });

}

// Metodo de Prueba
function pruebas(req, res){
    res.status(200).send({
        message: 'Acción de pruebas en el servidor de NodeJS'
    });
}


module.exports = {
    home,
    pruebas,
    saveUser,
    loginUser,
    getUser,
    getUsers,
    updateUser,
    uploadImage,
    getImageFile,
    getCounters
}