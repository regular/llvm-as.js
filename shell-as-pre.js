module.exports = function(assembly, callback) {
    var messages;
    var parsedMessages;
    // remove first and last argument
    var additionalArguments = [].slice.call(arguments, 1, arguments.length - 1);
    var args = ['llvm.ll'].concat(additionalArguments);
    console.log('calling process with args', args);

    var Module = {
        thisProgram: 'llvm-as',
        arguments: args,
        preRun: function() {
            console.log('prerun');
            messages = [];
            parsedMessages = [];
            FS.createDataFile('/', 'llvm.ll', intArrayFromString(assembly), true, false);
        },
        postRun: function() {
            console.log('llvm-as exited with code', EXITSTATUS);
            FS.unlink('/llvm.ll');

            var data = null;
            var error = null;
            var outputFile = FS.root.contents['llvm.bc'];
            if (outputFile) {
                data = new Uint8Array(outputFile.contents);
                FS.unlink('/llvm.bc');
            } 
            if (EXITSTATUS !== 0) {
                error = new Error('llvm-as exited with code' + EXITSTATUS);
            }
            callback(error, data, messages, parsedMessages);
        },
        printErr: function(text) {
            console.log(text);
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
        }
    };

