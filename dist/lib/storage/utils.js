'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var dataDirName = '.planb.d';

if (process.env.NODE_ENV === 'test') {
  dataDirName = dataDirName + '.test';
}

function getUserHome() {
  return process.env[process.platform == 'win32' ? 'USERPROFILE' : 'HOME'];
}

var dataPath = getUserHome() + '/' + dataDirName + '/';

function createDir(path, cb) {
  _fs2['default'].mkdir(path, function (err) {
    if (!err) {
      cb(null);return;
    }

    if (err.code == 'EEXIST') cb(null);else cb(err);
  });
}

function checkDataDir(cb) {
  createDir(dataPath, cb);
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

exports['default'] = {
  dataPath: dataPath,
  createDir: createDir,
  checkDataDir: checkDataDir,
  endpointNameFromPath: endpointNameFromPath,
  pathFromEndpointName: pathFromEndpointName,
  largest: largest
};
module.exports = exports['default'];