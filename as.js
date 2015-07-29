var _as = require('./lib/_llvm-as');
var decorate = require('./decorate');
var split = require('split');
var through = require('through');

module.exports = function(assembly, callback) {
    var messages = [];
    var parsedMessages = [];
    var data = null;

    var as = decorate(_as, {
        name: 'llvm-as',
        arguments: ['llvm.ll'],
        preRun: function(Module, root) {
            Module.FS_createDataFile('/', 'llvm.ll', Module.intArrayFromString(assembly), true, false);
        },
        postRun: function(Module, root, exitCode) {
            Module.FS_unlink('/llvm.ll');
            var outputFile = root.contents['llvm.bc'];
            if (outputFile) {
                data = new Buffer(outputFile.contents);
                Module.FS_unlink('/llvm.bc');
            } 
        },
    });
    
    as = as.apply(null, [].slice(arguments,1,arguments.length-1));
    as.on('close', function(exitCode) {
        var error = null;
        if (exitCode !== 0) {
            error = new Error('llvm-as exited with code' + exitCode);
        }
        callback(error, data, messages, parsedMessages);
    });
    as.stderr.pipe(split(/\r?\n/, null, {trailing: false})).pipe(through(function(text) {
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
};
