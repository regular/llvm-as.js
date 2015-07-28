var EventEmitter = require('events').EventEmitter;
var extend = require('xtend');
var debug = require('debug')('decorator');
var through = require('through');

// returns a function that returns an EventEmitter
// that behaves somewhat similar to Node's child_process.ChildProcess.
// options:
// - name: name of the executable
// - arguments: command line argument list to be inserted in front of
//   regular arguments
// - preRun: function called immediately before the emscriptified 'process' runs.
//   Arguments are:
//      - emscripten Module instance
//      - emscripten filesystem root object
// - postRun: function called immediately after the emscriptified 'process' runs.
//   Arguments are:
//      - emscripten Module instance
//      - emscripten filesystem root object
//      - exit code of the process
var id = 0;
module.exports = function(_em, options, cb) {
    var initialArguments = options.arguments || [];
    var name = options.name || 'unnamed';
    var Module = {
        thisProgram: name,
        id: id++
    };

    return function() {
        var additionalArguments = [].slice.call(arguments,0);
        var args = initialArguments.concat(additionalArguments);
        debug('calling process with args', args);
        var fs_root;
        var ee = new EventEmitter();
        ee.stdout = through();
        ee.stderr = through();
        var myModule = extend(Module, {
            arguments: args,
            print: function(text) {
                debug('stdout: %s', text);
                ee.stdout.emit('data', text + '\n');
            },
            printErr: function(text) {
                debug('stderr %d: %s', myModule.id, text);
                ee.stderr.emit('data', text + '\n');
            },
            preRun: function() {
                debug('preRun called on module %d', myModule.id);
                var f = myModule.FS_createDataFile('/', '.child_process', myModule.intArrayFromString('just ignore me'), true, false);
                fs_root = f.mount.root;
                if (typeof options.preRun === 'function') {
                    debug('calling options.preRun');
                    options.preRun(myModule, fs_root);
                }
            },
            onExit: function(exitCode) {
                debug('exited module %d with code %d', myModule.id, exitCode);
                if (typeof options.postRun === 'function') {
                    options.postRun(myModule, fs_root, exitCode);
                }
                ee.stdout.push(null);
                ee.stderr.push(null);
                ee.emit('close', exitCode);
            },
        });
        process.nextTick(function(){
            _em(myModule);
        });
        return ee;
    };
};
