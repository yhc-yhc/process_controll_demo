// created by josh to make the photo upload to line faster
// create three workers
// give task to worker what to do 
// if the worker do finished give another task

var photoModel = require('./models/photoModel.js');
var sm = require('./syncPhotoToCloud.master.js');

var numPhotoPerUpload = 400 //will give 10 process to work, do not change
var numPohtoPerWorker = 80 //one process upload
var finishedFlag = 0; //do not change , process finished work
var createWorker = 0;
var delayLoop = 20000;

var log4js = require('log4js');
log4js.configure({
    "appenders": [
        // 下面一行应该是用于跟express配合输出web请求url日志的
        {"type": "console", "category": "console"},
        // 定义一个日志记录器
        {
            "type": "dateFile",                 // 日志文件类型，可以使用日期作为文件名的占位符
            "filename": "logs/",     // 日志文件名，可以设置相对路径或绝对路径
            "pattern": "/yyyyMMddhh.txt",  // 占位符，紧跟在filename后面
            "absolute": true,                   // filename是否绝对路径
            "alwaysIncludePattern": true,       // 文件名是否始终包含占位符
            "category": "logInfo"               // 记录器名
        }],
    //"levels":{ "logInfo": "DEBUG"},        // 设置记录器的默认显示级别，低于这个级别的日志，不会输出
    replaceConsole: true
});
//var logger = log4js.getLogger('normal');
var logger = log4js.getLogger();
//logger.setLevel('INFO');


function queryUpload(callback) {
    console.time('loop')
    var now = new Date();
    var query = {
        isUpload: false,
        uploadCount: {'$lte': 2},
        disabled: false,
        customerIds: {$ne: null},
        receivedOn: {$gt: new Date(now.getTime() - 24 * 60 * 60 * 1000), $lt: now}
        //,justForOriginal: false
    }

    console.time('getPhotos')
    photoModel.find(
        query, {}, {
            limit: numPhotoPerUpload,
            sort: {'receivedOn': 1}
        }, function (err, photos) {
            console.timeEnd('getPhotos')
            callback(err, photos)
        }
    )
}

function blanceWork(err, photos) {
    if (err) {
        setTimeout(function () {
            queryUpload(blanceWork)
        }, 4 * delayLoop)
    } else {
        if (photos.length > 0) {
            createWorker = Math.ceil(photos.length / numPohtoPerWorker)
            console.debug('---> require worker num: ', createWorker, photos.length, photos[photos.length - 1].receivedOn, '\r\n')
            for (var i = 0; i < createWorker; i++) {
                var ary = photos.slice(i * numPohtoPerWorker, (i + 1) * numPohtoPerWorker);
                var flag = 'work_' + i
                sm({flag: flag, data: ary}, function (err, data) {
                    doNext()
                })
            }
        } else {
            setTimeout(function () {
                queryUpload(blanceWork)
            }, 3 * delayLoop)
        }
    }
}

function doNext() {
    finishedFlag++;
    console.debug('<--- finishedFlag', finishedFlag, '\r\n')
    if (finishedFlag == createWorker) {
        finishedFlag = 0;
        console.timeEnd('loop')
        console.debug('=====>  next loop\r\n\r\n');

        var delayLoop_ = null;
        createWorker == numPhotoPerUpload / numPohtoPerWorker ? delayLoop_ = delayLoop : delayLoop_ = delayLoop / 2;
        setTimeout(function () {
            queryUpload(blanceWork)
        }, delayLoop_)

    }
}

queryUpload(blanceWork);