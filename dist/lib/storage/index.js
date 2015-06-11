'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _endpoints = require('./endpoints');

var _endpoints2 = _interopRequireDefault(_endpoints);

var _versions = require('./versions');

var _versions2 = _interopRequireDefault(_versions);

var _utils = require('../utils');

var _utils2 = _interopRequireDefault(_utils);

var _defaults = require('../defaults');

var defaults = _interopRequireWildcard(_defaults);

var dataDirName = _utils2['default'].getProjectFileName('d');

exports.dataDirName = dataDirName;

exports['default'] = function (projectPath) {
  var storagePath = _path2['default'].join(projectPath, dataDirName);

  /*
  * Create project data directory
  *
  * Nothing is returned is directory created successfully,
  * or if directory already exists
  */
  function createDataDir(cb) {
    _fs2['default'].mkdir(storagePath, function (err) {
      if (err && err.code !== 'EEXIST') {
        cb({ message: 'Error creating data directory', data: err });
      } else {
        cb();
      }
    });
  }

  function checkForDataDir(cb) {
    _utils2['default'].fileExists(storagePath, cb);
  }

  function versions(endpoint, opts) {
    var port = opts.port || defaults.port;
    var action = opts.action || defaults.action;
    var name = _utils2['default'].endpointNameFromPath(endpoint);

    return (0, _versions2['default'])(_path2['default'].join(storagePath, port, action, name));
  }

  return {
    endpoints: (0, _endpoints2['default'])(storagePath),
    versions: versions,
    createDataDir: createDataDir,
    checkForDataDir: checkForDataDir,
    storagePath: storagePath
  };
};