// createDevice from
// https://github.com/kripken/emscripten/blob/1.29.12/src/library_fs.js#L1461

// in read() we probably have to sleep() to allow
// self.onmessage() to be called by the browser and thus
// receives data from outside the web worker
// https://github.com/kripken/emscripten/blob/1.29.12/src/library_browser.js#L747
var Path = require('path');
var ERRNO_CODES = require('./errno');
var debug = require('debug')('iostreams');

module.exports = function createDevice(m, parent, name, input, output) {
    var path = Path.join(typeof parent === 'string' ? parent : m.FS_getPath(parent), name);
    var mode = m.FS_getMode(!!input, !!output);
    if (!m.FS_createDevice.major) m.FS_createDevice.major = 64;
    var dev = m.FS_makedev(m.FS_createDevice.major++, 0);
    // Create a fake device that a set of stream ops to emulate
    // the old behavior.
    m.FS_registerDevice(dev, {
        open: function(stream) {
                  stream.seekable = false;
              },
        close: function(stream) {
                   // flush any pending line data
               },
        read: function(stream, buffer, offset, length, pos /* ignored */) {
                  var bytesRead = 0;
                  for (var i = 0; i < length; i++) {
                      var result;
                      try {
                          result = input();
                      } catch (e) {
                          throw new m.FS_ErrnoError(ERRNO_CODES.EIO);
                      }
                      if (result === undefined && bytesRead === 0) {
                          throw new m.FS_ErrnoError(ERRNO_CODES.EAGAIN);
                      }
                      if (result === null || result === undefined) break;
                      bytesRead++;
                      buffer[offset+i] = result;
                  }
                  if (bytesRead) {
                      stream.node.timestamp = Date.now();
                  }
                  return bytesRead;
              },
        write: function(stream, buffer, offset, length, pos) {
                   //debug('write', buffer);
                   for (var i = 0; i < length; i++) {
                       try {
                           output(buffer[offset+i]);
                       } catch (e) {
                           debug('caught exception from output');
                           throw new m.FS_ErrnoError(ERRNO_CODES.EIO);
                       }
                   }
                   if (length) {
                       stream.node.timestamp = Date.now();
                   }
                   return i;
               }
    });
    return m.FS_mkdev(path, mode, dev);
};
