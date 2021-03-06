var sc = require('./service/sync.service.js')

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
  } ],  
  //"levels":{ "logInfo": "DEBUG"},        // 设置记录器的默认显示级别，低于这个级别的日志，不会输出  
  replaceConsole: true
});
//var logger = log4js.getLogger('normal');
var logger = log4js.getLogger();
//logger.setLevel('INFO');

process.on('message', function  (m) {

	sync(m.data, function(){
		process.send({
			flag: m.flag,
			err: null, 
			data: 0,
			pid: process.pid,
			memoryUsage: process.memoryUsage().heapUsed
		})
	})

	
})

function sync(photos, cb) {
	sc.uploadPhotoCloud(photos, function () {
		cb(0)
	})
}