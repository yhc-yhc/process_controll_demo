/**
 * Created by tianlisa on 14-8-21.
 */
var mongoose = require('../databases/mongodb');
var ObjectId = mongoose.Schema.ObjectId;

var PhotoSchema = new mongoose.Schema({
    isUpload:{type:Boolean,default:false,index:true},//是否已经上传到线上

    uploadCount:{type:Number,default:0,index:true},//上传次数

   receivedOn:{type:Date,default:Date.now,index:true},

    justForOriginal:{type:Boolean,default:false,index:true},//是否只上传原图
   
    siteId:{type: String},//服务器ID

    photoId: {type: String, index: true}, //照片Id（siteIdyyyymmddxxxxx）

    photoCode: {type: String},   //照片code

    shootOn: {type: Date, index: true},  //拍摄时间

    extractOn: {type: Date, index: true},    //提取时间

    presetName:{type: String},//模版名称

    presetId: {type: String}, //模版ID

    //pp或ep的信息

    customerIds: [

        mongoose.Schema(

            {

                code: {type:String},  //pp或ep的code

                cType: String, //标示类型为pp还是ep

                userIds:{type: [String],default:[]} //用户Id列表

            },{_id:false})

    ],

    userIds: {type: [String]}, //照片所属的用户Ids

    name: {type: String}, //照片名称

    description: {type: String},  //描述

    downloadCount: {type: Number, default: 0},  //下载次数

    visitedCount: {type: Number, default: 0},   //访问次数

    shareInfo: [

        {
            sourceId:String,//分享源id
            sourceSecret:String,//分享源密钥
            channel: String, //分享渠道
            count: Number   //分享次数

        }

    ],



    editCount: {type: Number, default: 0},  //编辑次数

    likeCount: {type: Number, default: 0},  //点赞次数

    favoriteCount:{type: Number, default: 0},  //被收藏的次数

    orderHistory: [

        { //购买信息

            customerId: {type:String},  //pp或ep的code

            productId: String,  //对应产品Id（照片，杯子，钥匙扣）

            prepaidId: {type:String},  //pp+的code

            userId: {type:String},  //用户Id

            createdOn: Date  //创建时间



        }

    ],

    comments: [

        { //评论信息

            comment: String, //评论内容

            userId: String, //评论者Id可以为空

            userIP: String, //用户IP

            lastEditTime: Date //评论时间

        }

    ],

    albumId: {type: String}, //相册Id

    tagBy: [String], //相片包含的人员

    originalInfo: { //原图信息

        originalName: {type: String}, //原图名称

        editHistorys: {type: [String]}, //edit 编辑的历史记录

        path: {type: String}, //物理路径

        width:{type: Number}, //宽

        height: {type: Number}, //高

        url: {type: String} //url

    },

    thumbnailType: [], //缩略图类型

    thumbnail: {}, //缩略图信息{x1024:{path:路径, width:宽, height:高， url:url},x512:{},x128:{}}

    GPS: { //GPS信息

        ImageUniqueID: String,

        GPSInfo: String,

        GPSLatitudeRef: String,

        GPSLatitude: String,

        GPSLongitudeRef: String,

        GPSLongitude: String,

        GPSAltitudeRef: String,

        GPSAltitude: String,

        GPSTimeStamp: String,

        GPSDateStamp: String

    },

    locationId: {type: String}, //拍摄点Id

    parentId: {type: String}, //原始图片Id

    disabled: {type: Boolean, default: false}, //图片是否有效

    rawFileName: {type: String}, //相机内照片原始名称

    originalFileName: {type: String}, //生成的图片名称  用于判断是否重复上传 全部小写存入数据库

    isFree:{type: Boolean, default: false}, //是否免费

    isVip: {type: Boolean, default: false}, //是否VIP

    targetPoint: String, // 拍摄照片后送达的地点信息

    allowDownload:{type:Boolean,default:true},//是否允许下载

    //engine信息

    engineInfo:{

        chroma:{type: Boolean, default: false},

        width:{type: Number}, //宽

        height: {type: Number}, //高

        Orientation:{type:String,default:'-1'},

        rawPath:{type: String},

        rawUrl:{type: String},

        imageJson:{type: String},

        imageJsonUrl:{type: String},

        originalPath:{type: String},

        originalFileSize:{type:Number},

        originalUrl:{type: String},

        ticketNum:{type: String},

        ticketPrefix:{type: String},

        deleted:{type: Boolean, default: false}



    },//照片引擎信息

    tokenBy:{type: String}, //摄影师

    photoSource:{type: String, default:'engine'} ,//照片来源

    faces:{

        "image":[],

        "faces":[]

    },//脸部数据

    photoStatus:{type:String,default:'init',index:true},

    createdOn: {type: Date},//创建时间

    modifiedOn: {type: Date,index:true},//修改时间

    createdBy:  {type: String,default:'system'},//创建者ID

    modifiedBy:  {type: String,default:'system'} ,//创建者ID
    mimeType:{type: String},//jpg/mp4
    editHistorys: [], //edit  originalInfo,thumbnail
    appServerIP:{type:String},//localserver的api地址，http://192.168.8.3:3000
    storageServerIP:{type:String},//图片的存储url,http://192.168.8.3:4000
    mobileEditActive:{type: Boolean, default: true},
    videoStatus:{type:String,default:'init',index: true},//init generating generated uploading uploaded   合成中 已完成  上传中(in redis)  已上传
    photo_id:{type:String},//照片转成视频前的_id
    adInfo:{
        originalName: {type: String, index: true}, //原图名称
        path: {type: String}, //物理路径
        width:{type: Number}, //宽
        height: {type: Number}, //高
        url: {type: String} //url
    },
    bundleWithPPP:{type: Boolean, default: false} //如果为true,不能单独购买,只能买了pp+之后才能拥有

});

module.exports = mongoose.model('Photo', PhotoSchema);

