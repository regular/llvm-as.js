var EventEmitter = require('events').EventEmitter;
var extend = require('xtend');
var debug = require('debug')('decorator');
var through = require('through');
var assert = require('assert');

var createDevice = require('./iostreams');

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
        noFSInit: true,
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
            preRun: function() {
                debug('creating devices');
                createDevice(myModule, '/dev', 'stdin', null, null);

                createDevice(myModule, '/dev', 'stdout', null, function(code) {
                    var text = String.fromCharCode(code);
                    //debug('new stdout %d: %s', myModule.id, text);
                    ee.stdout.emit('data', text);
                });

                createDevice(myModule, '/dev', 'stderr', null, function(code) {
                    var text = String.fromCharCode(code);
                    debug('new stderr %d: %s', myModule.id, text);
                    ee.stderr.emit('data', text);
                });

                // open default streams for the stdin, stdout and stderr devices
                (function openStandardStreams(FS_open) {
                    var stdin = FS_open('/dev/stdin', 'r');
                    assert(stdin.fd === 0, 'invalid handle for stdin (' + stdin.fd + ')');

                    var stdout = FS_open('/dev/stdout', 'w');
                    assert(stdout.fd === 1, 'invalid handle for stdout (' + stdout.fd + ')');

                    var stderr = FS_open('/dev/stderr', 'w');
                    assert(stderr.fd === 2, 'invalid handle for stderr (' + stderr.fd + ')');
                })(myModule.FS_open);
                //console.log(Object.keys(myModule));
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
