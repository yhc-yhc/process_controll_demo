var async = require('async');
var crypto = require('crypto')
var photoModel = require('../models/photoModel');
var fs = require('fs-extra');
var fsw = require('fs');
var path = require('path');
var config = require('../config.js');
var request = require('request');


var hashDatas = [];
hashDatas.push(fs.readFileSync(__dirname + '/hash1.jpg'));
hashDatas.push(fs.readFileSync(__dirname + '/hash2.jpg'));
hashDatas.push(fs.readFileSync(__dirname + '/hash3.jpg'));
var hashRandom = 0;


exports.uploadPhotoCloud = function (photos, fn) {
    var count = 0,
        self = this,
        LBase64str = '',
        MBase64str = '',
        SBase64str = '',
        WBase64str = '',
        body = null,
        cloudAPIUrl = config.cloudAPIUrl + config.syncPhotos;

    async.each(photos, function (photo, cb) {
        async.auto({
            updateUploadCount: function (callback) {
                console.warn('>>>', photo.receivedOn);
                photoModel.update({_id: photo._id}, {$inc: {uploadCount: 1}}, function (err) {
                    if (err) {
                        console.error(' *** update uploadCount ERROR\r\n', photo._id);
                        return callback('errInfo.errSavePhoto');
                    }
                    return callback(null, 1);
                })
            },

            uploadToCloud: ["updateUploadCount", function (callback, results) {
                if (config.uploadOriginal) {
                    var OData = fs.readFileSync(photo.originalInfo.path); // Johnny: Stop original file upload but upload data as usual
                    var OBase64str = new Buffer(OData).toString('base64');

                    self.syncOriginalPhoto(photo, callback)
                }

                if (config.uploadThumbnail) {
                    try {

                        var LData = fs.readFileSync(photo.thumbnail.x1024.path);
                        LBase64str = new Buffer(LData).toString('base64');
                        var MData = fs.readFileSync(photo.thumbnail.x512.path);
                        MBase64str = new Buffer(MData).toString('base64');
                        var SData = fs.readFileSync(photo.thumbnail.x128.path);
                        SBase64str = new Buffer(SData).toString('base64');
                        if (photo.thumbnail.w512) {
                            var WData = fsw.readFileSync(photo.thumbnail.w512.path);
                            WBase64str = new Buffer(WData).toString('base64');
                        } else {
                            console.fatal('NO WATERMARK DATA: ', photo.thumbnail.x1024.path);
                        }
                    } catch (e) {
                        console.error(' *** read photos data ERROR\r\n', photo.name, e.code, e.path)
                        return callback('errInfo.errUploadImage');
                    }
                    body = {
                        photo: photo,
                        L: LBase64str,
                        M: MBase64str,
                        S: SBase64str,
                        W: WBase64str,
                        appID: config.appID
                    }
                    request.post(
                        {
                            url: cloudAPIUrl,
                            body: body,
                            json: true
                        }
                        , function (e, r, reply) {
                            if (e) {
                                console.error(' *** upload Thumbnail ERROR \r\n', photo.name, e.code, e.path);
                                return callback('errInfo.errUploadImage');
                            } else {
                                //console.log(reply);
                                return callback(null, 1);
                            }
                        });
                } else {
                    //改变photo的url
                    photo.thumbnailType.forEach(function (type) {
                        if (type != 'x1024') {
                            photo.thumbnail[type].path = config.photosFolder + photo.thumbnail[type].url;
                            photo.thumbnail[type].url = self.enUrl(photo.thumbnail[type].url);
                        }
                    })
                    photo.thumbnailType.forEach(function (type) {
                        if (type == 'x1024') {
                            var dataBuffer = fs.readFileSync(photo.thumbnail.x1024.path);
                            photo.thumbnail[type].path = config.photosFolder + photo.thumbnail[type].url

                            photo.thumbnail.en1024 = {
                                path: photo.thumbnail[type].path.replace('preview', 'enPreview'),
                                width: photo.thumbnail[type].width,
                                height: photo.thumbnail[type].height,
                                url: self.enUrl(photo.thumbnail[type].url.replace('preview', 'enPreview')),
                            };
                            photo.thumbnail[type].url = self.enUrl(photo.thumbnail[type].url);
                            if (hashRandom == 0) {
                                hashRandom = 1;
                            } else if (hashRandom == 1) {
                                hashRandom = 2;
                            } else if (hashRandom == 2) {
                                hashRandom = 0;
                            }
                            fs.ensureDir(path.dirname(photo.thumbnail.en1024.path), function (err) {
                                if (err) {
                                    console.error('error create enPreview dir', err);
                                    return callback('errInfo.errCreateFolder');
                                }
                                fsw.writeFile(photo.thumbnail.en1024.path, Buffer.concat([hashDatas[hashRandom], dataBuffer], hashDatas[hashRandom].length + dataBuffer.length), function (err) {
                                        if (err) {

                                            console.error('error create enPreview', err);
                                            return callback('error create enPreview');
                                        } else {
                                            cloudAPIUrl = config.cloudAPIUrl + config.syncPhotos_new;
                                            body = {
                                                photo: photo,
                                                appID: config.appID
                                            }
                                            request.post(
                                                {
                                                    url: cloudAPIUrl,
                                                    body: body,
                                                    json: true
                                                }
                                                , function (e, r, reply) {
                                                    if (e) {
                                                        console.error(' *** upload Thumbnail ERROR \r\n', photo.name, e.code, e.path);
                                                        return callback('errInfo.errUploadImage');
                                                    } else {
                                                        //console.log(reply);
                                                        return callback(null, 1);
                                                    }
                                                });
                                        }
                                    }
                                )
                            })
                        }
                    })
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

exports.syncToLine = function (photo, cb) {
    var self = this;
    self.addUpCount(photo, function (err) {
        if (err) {
            cb(err)
        } else {
            self.sendData(photo, function (err) {
                if (err) {
                    cb(err)
                } else {
                    self.changeUpFlag(photo, function (err) {
                        if (err) {
                            cb(err)
                        } else {
                            cb(null, photo)
                        }
                    })
                }
            })
        }
    })
}

exports.batchSyncToLine = function (photos, cb) {
    var self = this, count = 0, errs = [], suceess = [];

    if (photos.length == 0) {
        cb(errs, suceess)
    }
    photos.forEach(function (photo) {
        self.syncToLine(photo, function (err) {
            if (err) {
                next(err)
            } else {
                next(null, photo)
            }
        })
    })
    function next(err, photo) {
        count++;
        if (err) {
            errs.push(photo)
        } else {
            suceess.push(photo)
        }
        if (count == photos.length) {
            cb(errs, suceess)
        }
    }
}

exports.syncOriginalPhoto = function (photo, callback) {
    var OData = fs.readFileSync(photo.originalInfo.path); // Johnny: Stop original file upload but upload data as usual
    var OBase64str = new Buffer(OData).toString('base64');

    request.post({
            url: config.cloudAPIUrl + config.syncOriginalPhoto,
            body: {
                relativePath: photo.originalInfo.url,
                O: OBase64str,
                oLength: OBase64str.length,
                appID: config.appID
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

exports.addUpCount = function (photo, next) {
    photoModel.update({_id: photo._id}, {$inc: {uploadCount: 1}}, function (err) {
        if (err) {
            console.log('up upload count err')
            next(err)
        } else {
            next(null)
        }
    })
}

exports.sendData = function (photo, next) {
    photo.thumbnailType.forEach(function (type) {
        if (type != 'x1024') {
            photo.thumbnail[type].path = config.photosFolder + photo.thumbnail[type].url;
            photo.thumbnail[type].url = self.enUrl(photo.thumbnail[type].url);
        }
    })
    photo.thumbnailType.forEach(function (type) {
        if (type == 'x1024') {
            var dataBuffer = fs.readFileSync(photo.thumbnail.x1024.path);
            photo.thumbnail[type].path = config.photosFolder + photo.thumbnail[type].url

            photo.thumbnail.en1024 = {
                path: photo.thumbnail[type].path.replace('preview', 'enPreview'),
                width: photo.thumbnail[type].width,
                height: photo.thumbnail[type].height,
                url: self.enUrl(photo.thumbnail[type].url.replace('preview', 'enPreview')),
            };
            photo.thumbnail[type].url = self.enUrl(photo.thumbnail[type].url);
            if (hashRandom == 0) {
                hashRandom = 1;
            } else if (hashRandom == 1) {
                hashRandom = 2;
            } else if (hashRandom == 2) {
                hashRandom = 0;
            }
            fs.ensureDir(path.dirname(photo.thumbnail.en1024.path), function (err) {
                if (err) {
                    console.error('error create enPreview dir', err);
                    next(err);
                }
                fsw.writeFile(photo.thumbnail.en1024.path, Buffer.concat([hashDatas[hashRandom], dataBuffer], hashDatas[hashRandom].length + dataBuffer.length), function (err) {
                        if (err) {

                            console.error('error create enPreview', err);
                            next(err);
                        } else {
                            cloudAPIUrl = config.cloudAPIUrl + config.syncPhotos_new;
                            body = {
                                photo: photo,
                                appID: config.appID
                            }
                            request.post(
                                {
                                    url: cloudAPIUrl,
                                    body: body,
                                    json: true
                                }
                                , function (e, r, reply) {
                                    if (e) {
                                        console.error(' *** upload Thumbnail ERROR \r\n', photo.name, e.code, e.path);
                                        next(e);
                                    } else {
                                        //console.log(reply);
                                        next(null);
                                    }
                                });
                        }
                    }
                )
            })
        }
    })
}

exports.changeUpFlag = function (photo, next) {
    photoModel.update({_id: photo._id}, {$set: {isUpload: true}}, function (err, i) {
        if (err) {
            console.error(' *** change uppload flag err, DB.UPDATE', photo.name, '\n', err);
            next(err);
        } else {
            next(null)
        }
    })
}

exports.enUrl = function (strUrl) {
    var KEY = "PICTUREAIR082816";
    var IV = "PICTUREAIR082816";
    var self = this;

    return "media/" + self.AesEn(KEY, IV, "/" + strUrl);
};

exports.AesEn = function (cryptkey, iv, cleardata) {
    try {
        var encipher = crypto.createCipheriv('aes-128-cbc', cryptkey, iv),
            encoded = encipher.update(cleardata, 'utf8', 'hex');
        encoded += encipher.final('hex');
        return encoded;
    } catch (err) {
        return null;
    }
}