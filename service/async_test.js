var async = require('async');

var ary = [1, 2, 3, 4, 5];

async.each(ary, function  (item, cb) {
	if (item ==3) {
			setTimeout(function(){
				console.log('error', item)
				cb(item)
			}, item * 1000)
	} else {
			setTimeout(function(){
				console.log(item)
				cb(null, item)
			}, item * 1000)
	}
}, function(err, rs){
	console.log(err, rs)
})


