asyncTest()
function asyncTest() {
    setTimeout(function () {
        return finished1()
    }, 1000)

    setTimeout(function () {
        return finished2()
    }, 1200)
}

function finished1() {
    console.log('finished 1')
}
function finished2() {
    console.log('finished 2')
}