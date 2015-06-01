'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _package = require('../../../package');

var _package2 = _interopRequireDefault(_package);

var _utils = require('../utils');

var _utils2 = _interopRequireDefault(_utils);

var name = _package2['default'].name;

var dataDirName = '.' + name + '.d';

if (process.env.NODE_ENV === 'test') {
  dataDirName = dataDirName + '.test';
}

function getRoot(cb, dots) {
  dots = dots || '.';

  var currentPath = _path2['default'].join(process.cwd(), dots);
  var projectPath = currentPath + '/' + dataDirName;

  _fs2['default'].stat(projectPath, function (err, stat) {
    if (err && err.code === 'ENOENT') {
      if (currentPath === '/') {
        cb({ message: 'Project not initialized' });
      } else {
        if (dots === '.') {
          dots = '..';
        } else {
          dots = dots + '/..';
        }

        getRoot(cb, dots);
      }
    } else if (err) {
      cb({ message: 'Error getting root', data: err });
    } else {
      cb(null, currentPath);
    }
  });
}

function checkPwdDataDir(cb) {
  var dataDirPath = _path2['default'].join(process.cwd(), dataDirName);

  _utils2['default'].fileExists(dataDirPath, cb);
}

/*
 * Create project data directory
 *
 * Nothing is returned is directory created successfully,
 * or if directory already exists
*/
function createDataDir(cb) {
  var dataDirPath = _path2['default'].join(process.cwd(), dataDirName);

  _fs2['default'].mkdir(dataDirPath, function (err) {
    if (err && err.code !== 'EXIST') {
      cb({ message: 'Error creating data directory', data: err });
    } else {
      cb();
    }
  });
}

exports['default'] = {
  dataDirName: dataDirName,
  getRoot: getRoot,
  checkPwdDataDir: checkPwdDataDir,
  createDataDir: createDataDir
};
module.exports = exports['default'];