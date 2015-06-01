'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function createDir(path, cb) {
  _fs2['default'].mkdir(path, function (err) {
    if (!err) {
      cb(null);return;
    }

    if (err.code == 'EEXIST') cb(null);else cb(err);
  });
}

function endpointNameFromPath(path) {
  var name = path.replace(/^https?:\/\//, '');

  return name.replace(/\//g, ':');
}

function pathFromEndpointName(name) {
  return name.replace(/:/g, '/');
}

function largest(arr) {
  if (arr.length) {
    return Math.max.apply(Math, arr);
  } else {
    return null;
  }
}

function fileExists(path, cb) {
  _fs2['default'].stat(path, function (err) {
    if (err && err.code === 'ENOENT') {
      cb(null, false);
    } else if (err) {
      cb(err);
    } else {
      cb(null, true);
    }
  });
}

exports['default'] = {
  createDir: createDir,
  endpointNameFromPath: endpointNameFromPath,
  pathFromEndpointName: pathFromEndpointName,
  largest: largest,
  fileExists: fileExists
};
module.exports = exports['default'];