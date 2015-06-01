'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _storage = require('./storage');

var _storage2 = _interopRequireDefault(_storage);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var projects = _storage2['default'].projects;
var endpoints = _storage2['default'].endpoints;

function init(cb) {
  projects.checkPwdDataDir(function (err, dataDirExists) {
    if (err) {
      cb({ message: 'Error initializing project', data: err });
      return;
    }

    _config2['default'].checkPwd(function (err, configExists) {
      if (err) {
        cb({ message: 'Error initializing project', data: err });
        return;
      }

      if (dataDirExists && configExists) {
        cb({ message: 'Project already initialized' });
      } else {
        projects.createDataDir(function (err) {
          if (err) {
            cb(err);return;
          }

          _config2['default'].create(function (err) {
            if (err) {
              cb(err);return;
            }

            cb();
          });
        });
      }
    });
  });
}

function addEndpoint(url, cb) {
  projects.getRoot(function (err, rootPath) {
    if (err || !rootPath) {
      cb(err || { message: 'Project root not found' });
    } else {
      var dirPath = _path2['default'].join(rootPath, projects.dataDirName);

      // TODO add endpoint to config
      endpoints.create(dirPath, url, function (err) {
        if (err) {
          cb(err);return;
        }

        cb();
      });
    }
  });
}

exports['default'] = {
  init: init,
  addEndpoint: addEndpoint
};
module.exports = exports['default'];