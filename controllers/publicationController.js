'use strict'

var path = require('path');
var fs = require('fs');
var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var Publication = require('../models/publication');
var User = require('../models/user');
var Follow = require('../models/follow');

function probando(req, res){
    return res.status(200).send({message: 'Probando desde publicacion'});
}

function savePublication(req, res){
    var params = req.body;
    var publication = new Publication();

    if(!params.text) return res.status(200).send({message: 'Debes enviar un texto'});

    publication.user = req.user.sub;
    publication.text = params.text;
    publication.file = 'null';  
    publication.created_at = moment().unix();
    publication.save((err, publicationStored) => {
        if(err) return res.status(500).send({message: 'Error al guardar la publicacion'}); 

        if(publicationStored){
            return res.status(200).send({publication: publicationStored});
        }else{
            return res.status(404).send({ message: 'No se ha registrado de la publicacion'});
        }
    });

}
function getPublications(req, res){
    //const userId = (req.params.id ? req.params.id : req.user.sub );
    const page = (req.params.page ? req.params.page : 1 );

    var itemsPerPage = 4;

    Follow.find({user: req.user.sub}).populate('followed').exec( (err, follow) =>{
        if(err) return res.status(500).send({message: 'Error'});
        var follow_clean = [];
        follow.forEach(element => {
            follow_clean.push(element.followed);
        });
        follow_clean.push(req.user.sub);// para mostrar nuestas publicaciones
        // $in se utiliza para buscar informacion de un documento en un array las considencia son las que saldran
        // buscar todos los documentos cuyo usuario este contenido dentro del array follow_clean
        Publication.find({user: {'$in': follow_clean }}).sort('-created_at').populate('user').paginate(page, itemsPerPage, (err, publications, total) =>{
            if(err) return res.status(500).send({message: 'Error al devolver publicaciones'});

            if(!publications) return res.status(404).send({message: 'No hay publicaciones Disponibles'});

            return res.status(200).send({
                total_items : total,
                publications,
                itemsPerPage,
                page: Math.ceil(total/itemsPerPage),
            });

        })
    });
}

function getPublication(req, res){
    //const userId = (req.params.id ? req.params.id : req.user.sub );

    Publication.find({_id: req.params.id}).sort('-created_at').populate('user').exec((err, publication) =>{
        if(err) return res.status(500).send({message: 'Error al devolver publicaciones'});

        if(!publication) return res.status(404).send({message: 'No hay publicaciones Disponibles'});

        return res.status(200).send({
        
            publication,
          
        });

    });
    
}

function deletePublication(req, res){
    console.log(req.user.sub);
    Publication.find({_id : req.params.id, user: req.user.sub}).deleteOne((err, publicationsRemove)=>{
        if(err) return res.status(500).send({message: 'Error al eliminar la  publicacion'});

        if(!publicationsRemove) return res.status(404).send({message: 'No se ha borrado la publicacion'});

        return res.status(200).send({
        
            message: 'Publicacion eliminada',
          
        });
    });

}

function uploadImagePublication(req, res){
    var publicacionId = req.params.id;

    if(req.files){
        var file_path = req.files.image.path;
        console.log(file_path);

        var file_split = file_path.split('\\');
        console.log(file_split);

        var file_name = file_split[2];

        var ext_split = file_name.split('\.');
        var file_ext = ext_split[1];
        var allowedExtensions = /(.jpg|.jpeg|.png|.gif)$/i;

        if(allowedExtensions.exec(file_path)){
            //Actualizar documento de la publicacion
            Publication.findOne({user: req.user.sub, _id: publicacionId }).exec((err, publication) =>{
                console.log(Publication);
                if(err) return res.status(500).send({message: 'Error en la petición'});
                if(publication){
                    Publication.findByIdAndUpdate(publicacionId, {file: file_name }, {new:true}, (err, publicactionUpdate) => {
                        if(err) return res.status(500).send({message: 'Error en la petición'});
                
                        if(!publicactionUpdate) return res.status(404).send({message: 'No se ha podido actualizar'});
                
                        return res.status(200).send({publicacion: publicactionUpdate});
                    });
                }else{
                    
                    fs.unlink(file_path, (err) => {// borrar el archivo en el directorio
                        return res.status(200).send({message: 'No tienes permiso para actualizar esta publicacion'});
                    });
                }
            });
            
        }else{
            fs.unlink(file_path, (err) => {// borrar el archivo en el directorio
                return res.status(200).send({message: 'Extensión no valida'});
            });
            
        }

    }else{

        return res.status(200).send({message: 'No se han subido imagenes'});
    }
}

function getImageFile(req, res){

    const image_file = req.params.imageFile;
    const path_file = './upload/publications/'+image_file;

    fs.exists(path_file, (exists) => {
        if(exists){
            res.sendFile(path.resolve(path_file));
        }else{
            res.status(200).send({message: 'No se han subido imagenes'});
        }
    });

}

module.exports = {
    probando,
    savePublication,
    getPublications,
    getPublication,
    deletePublication,
    uploadImagePublication,
    getImageFile
}