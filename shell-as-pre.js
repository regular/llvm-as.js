module.exports = function(callback) {
    var errorMessage;
    var api = function(assembly) {
        var additionalArguments = [].slice.call(arguments, 1);
        var args = ['llvm.ll'].concat(additionalArguments);
        console.log('calling process with args', args);
        FS.createDataFile('/', 'llvm.ll', intArrayFromString(assembly), true, false);
        errorMessage = '';
        var exitCode = Module.callMain(args);
        console.log('llvm-as exited with code', exitCode);

        FS.unlink('/llvm.ll');

        var data = null;
        var error = null;
        var outputFile = FS.root.contents['llvm.bc'];
        if (outputFile) {
            data = new Uint8Array(outputFile.contents);
            FS.unlink('/llvm.bc');
        } 
        if (errorMessage.length !== 0) {
            error = new Error(errorMessage);
        }
        return [error, data];
    };

    var Module = {
        noInitialRun: true,
        noExitRuntime: true,
        onRuntimeInitialized: function() {
            callback(api);
        },
        printErr: function(text) {
            if (text === "Calling stub instead of sigaction()") return;
            errorMessage += text + '\n'; 
        }
    };

