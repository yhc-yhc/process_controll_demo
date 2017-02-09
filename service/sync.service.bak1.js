var async = require('async');
var photoModel = require('../models/photoModel');
var fs = require('fs-extra');
var fsw = require('fs');
var config = require('../config.js');
var request = require('request');
var cloudAPIUrl = config.cloudAPIUrl + config.syncPhotos;

exports.uploadPhotoCloud = function (photos, fn) {
    var count = 0;
    var uploadOriginal = config.uploadOriginal || false;

    async.each(photos, function (photo, cb) {
        async.auto({
            updateUploadCount: function (callback) {
                console.warn('>>>', new Date(photo.receivedOn));
                photoModel.update({_id: photo._id}, {$inc: {uploadCount: 1}}, function (err) {
                    if (err) {
                        console.error(' *** update uploadCount ERROR\r\n', photo._id);
                        return callback('errInfo.errSavePhoto');
                    }
                    return callback(null, 1);
                })
            },

            uploadToCloud: ["updateUploadCount", function (callback, results) {
                if(uploadOriginal) {
                    var OData = fs.readFileSync(photo.originalInfo.path); // Johnny: Stop original file upload but upload data as usual
                    var OBase64str = new Buffer(OData).toString('base64');

                    //console.log('>> Original >>', photo.locationId, photo.extractOn, photo.receivedOn);
                    //console.time('Upload Original Post');
                    request.post({
                         url: config.cloudAPIUrl + config.syncOriginalPhoto,
                         body: {
                             relativePath: photo.originalInfo.url,
                             O: OBase64str,
                             oLength: OBase64str.length,
                             appID: config.appID
                         },
                         headers: {   
                            'Content-Type':'application/x-www-form-urlencoded',
                            'Content-Length': data.length  
                          },
                         json: true
                    },
                    function (e, r, reply) {
                         if (e) {
                            console.error('uploadOriginal >>>>> ', photo.name, config.cloudAPIUrl, config.syncOriginalPhoto, '\n', e);
                            return callback('errInfo.errUploadImage');
                         } else {
                             //console.log(reply);
                             //console.timeEnd('Upload Original Post');
                             return callback(null, 1);
                         }
                     });
                }

                async.auto({
                    LBase64str: function(readCallback){
                        fs.readFile(photo.thumbnail.x1024.path, function(err, LData){
                            if (err) {
                                readCallback(err);
                            } else {
                                var LBase64str = new Buffer(LData).toString('base64');
                                readCallback(null, LBase64str)
                            }
                        })
                    },
                    MBase64str: function(readCallback){
                        fs.readFile(photo.thumbnail.x512.path, function(err, MData){
                            if (err) {
                                readCallback(err);
                            } else {
                                var MBase64str = new Buffer(MData).toString('base64');
                                readCallback(null, MBase64str)
                            }
                        })
                    },
                    SBase64str: function(readCallback){
                        fs.readFile(photo.thumbnail.x128.path, function(err, SData){
                            if (err) {
                                readCallback(err);
                            } else {
                                var SBase64str = new Buffer(SData).toString('base64');
                                readCallback(null, SBase64str)
                            }
                        })
                    },
                    WBase64str: function(readCallback){
                        if (photo.thumbnail.w512) {
                            fs.readFile(photo.thumbnail.w512.path, function(err, WData){
                                if (err) {
                                    readCallback(err);
                                } else {
                                    var WBase64str = new Buffer(WData).toString('base64');
                                    readCallback(null, WBase64str)
                                }
                            })
                        } else {
                            console.fatal('NO WATERMARK DATA: ', photo.thumbnail.x1024.path);
                            readCallback(null, '')
                        }
                    }
                }, function(err, rsData){
                    if (err) {

                    } else {
                        request.post({
                        url: cloudAPIUrl,
                        body: {
                            photo: photo,
                            L: rsData.LBase64str,
                            M: rsData.MBase64str,
                            S: rsData.SBase64str,
                            O: rsData.OBase64str || '',
                            W: rsData.WBase64str,
                            appID: config.appID
                        },
                        json: true
                    }
                    , function (e, r, reply) {
                        if (e) {
                            console.error(' *** upload Thumbnail ERROR \r\n', photo.name, e.code, e.path);
                            return callback('errInfo.errUploadImage');
                        } else {
                            //console.log(reply);
                            //console.timeEnd('Upload Thumbnail Post');
                            return callback(null, 1);
                        }
                    });
                    }
                    
                })
                try {
                    
                    request.post(
                        {
                            url: cloudAPIUrl,
                            body: {
                                photo: photo,
                                L: LBase64str,
                                M: MBase64str,
                                S: SBase64str,
                                O: OBase64str,
                                W: WBase64str,
                                appID: config.appID
                            },
                            json: true
                        }
                        , function (e, r, reply) {
                            if (e) {
                                console.error(' *** upload Thumbnail ERROR \r\n', photo.name, e.code, e.path);
                                return callback('errInfo.errUploadImage');
                            } else {
                                //console.log(reply);
                                //console.timeEnd('Upload Thumbnail Post');
                                return callback(null, 1);
                            }
                        });
                    //}
                } catch (e) {
                    console.error(' *** read photos data ERROR\r\n', photo.name, e.code, e.path)
                    return callback('errInfo.errUploadImage');
                }
            }],
            updateIsUpload: ["uploadToCloud", function (callback, results) {
                // console.time('updateIsUpload');
                photoModel.update({_id: photo._id}, {$set: {isUpload: true}}, function (err, i) {
                    // console.timeEnd('updateIsUpload');
                    if (err) {
                        console.error(' *** isUpload DB.UPDATE', photo.name, '\n', err);
                        return callback('errInfo.errSavePhoto');
                    }
                    //console.warn('<<<upload is success', photo.name);
                    return callback(null, 1);
                })
            }]
        }, function (err, result) {
            count++;
            if (count == photos.length) {
                console.warn('all photos success');
                return cb(1);
            } else {
                //console.error('>>>>>>>>>>>>>>',count);
            }
        })
    }, function (err) {
        fn();
    })
}