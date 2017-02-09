module.exports = {
	mongoConn: 'mongodb://172.16.164.19:828/pictureAir,172.16.164.19:827/pictureAir',//Master的数据库  
    mongoOptions: {
           //"server": {"native_parser":true,"poolSize":10,"auto_reconnect": true,"socketOptions":{"keepAlive":600,connectTimeoutMS: 10000, socketTimeoutMS: 10000},"reconnectTries":30,"haInterval":1000},
            //"db":{"native_parser":true,"strategy": "ping","readPreference":"primary","bufferMaxEntries":5},
            //"replset":{"rs_name":"pictureWorks","readPreference":"primary","strategy":"ping","poolSize":10,"connectWithNoPrimary":false,"haInterval":1000,"socketOptions":{"keepAlive":600}}
    },
    uploadOriginal: false,
    cloudAPIUrl :'http://10.10.30.26:3000',
    syncPhotos:'/sync/syncToCloud',
    syncOriginalPhoto:'/sync/syncFile',
}