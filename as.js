var _as = require('./lib/_llvm-as');
var decorate = require('./decorate');

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
    as.stderr.on('data', function(text) {
        var m = text.match(/llvm-as:\sllvm\.ll:(\d+):(\d+):\s([a-z]+):\s*(.*)/);
        if (m) {
            parsedMessages.push({
                line: m[1],
                column: m[2],
                severity: m[3],
                text: m[4]
            });
        }
        messages.push(text);
    });
};
