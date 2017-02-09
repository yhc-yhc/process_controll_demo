/**
 * Created by tianlisa on 14-8-18.
 */
var config=require('../config');
var mongoose=require('mongoose');
var conn=config.mongoConn;
var options=config.mongoOptions;

//连接mongodb
mongoose.connect(conn,options,function(err){
    if(err){
        console.log('failed to connect '+conn);
        console.log(err);
    }else{
        console.log('succeed to connect '+conn);
    }
})

module.exports=mongoose;
