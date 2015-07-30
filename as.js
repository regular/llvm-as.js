var _as = require('./lib/_llvm-as');
var decorate = require('./decorate');
var split = require('split');
var through = require('through');
var bl = require('bl');
var debug = require('debug')('as');

module.exports = function(assembly, callback) {
    var messages = [];
    var parsedMessages = [];
    var data = bl();

    var as = decorate('llvm-as', _as);
    
    as = as.apply(null, [].slice(arguments,1,arguments.length-1));
    as.on('close', function(exitCode) {
        var error = null;
        if (exitCode !== 0) {
            error = new Error('llvm-as exited with code' + exitCode);
        }
        if (data.length===0) {
            data = null;
        } else {
            // turn bufferlist into Buffer
            data = data.slice();
        }
        callback(error, data, messages, parsedMessages);
    });
    as.stdout.pipe(data);
    as.stderr.pipe(split(/\r?\n/, null, {trailing: false})).pipe(through(function(text) {
        debug('line on stderr: %s', text);
        var m = text.match(/llvm-as:\s([^:])+:(\d+):(\d+):\s([a-z]+):\s*(.*)/);
        if (m) {
            parsedMessages.push({
                path: m[1],
                line: parseInt(m[2], 10),
                column: parseInt(m[3], 10),
                severity: m[4],
                text: m[5]
            });
        }
        messages.push(text);
    }));
    as.stdin.write(new Buffer(assembly, 'utf8'));
    as.stdin.end();
};
