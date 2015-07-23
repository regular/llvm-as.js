var f = require('./llvm-as');
var fs = require('fs');
var source = fs.readFileSync(__dirname + '/test.ll', 'utf-8');

f(function(as) {
    for(var i=0; i<3; ++i) {
        var result;
        if (i===2) {
            result = as('hello world');
        } else {
            result = as(source);
        }
        var err = result[0];
        var data = result[1];
        console.log('---');
        console.log('error', err);
        if (data !== null) {
            data = data.length;
        }
        console.log('data', data);
    }
});
