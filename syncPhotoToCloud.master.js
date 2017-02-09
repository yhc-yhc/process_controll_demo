// created by josh to make the photo upload to line faster
// create three workers
// give task to worker what to do 
// if the worker do finished give another task

var cp = require('child_process')
var workers = [];
flag_obj = {};

var events = require('events');
var ev = new events.EventEmitter();
ev.setMaxListeners(0);

var workerCount = process.env.workerCount || 6;
for (var i = 0; i < workerCount; i++) {
    var worker = cp.fork('./syncPhotoToCloud.worker.js');

    workers.push(worker)
}

workers.forEach(function (worker) {
    worker.busy = 0;
    worker.memoryUsage = 0;
    worker.on('message', function (m) {
        var pid = m.pid;
        worker.memoryUsage = m.memoryUsage;
        ev.emit(m.flag, m.error, m.data);
        delete flag_obj[m.flag];

        workers.push(worker)
    })
})

function getMostFreeWork() {
    var b = workers.every(function (e) {
        return e.memoryUsage == 0;
    });
    if (b) {
        //workers = workers.sort(function (c, p) {
        //	return (c.busy || 0) - (p.busy || 0);
        //})
        return workers.shift()
    } else {
        //workers = workers.sort(function (c, p) {
        //	return (c.memoryUsage || 0) - (p.memoryUsage || 0)
        //})
        return workers.shift();
    }
}

module.exports = function (opt, fn) {
    var flag = opt.flag;
    var data = opt.data;
    //var flag = _flag + '___' + JSON.stringify(data);

    if (!flag_obj[flag]) {
        flag_obj[flag] = 1;
        var worker = getMostFreeWork();
        console.debug('--->woking pid:', worker.pid, '\r\n')
        worker.send({flag: flag, data: data})
    }

    ev.once(flag, function (err, data) {
        //workers.forEach(function(e){console.log(e.pid, e.memoryUsage)})
        return fn(err, data);
    })
}

