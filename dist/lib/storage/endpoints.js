'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.create = create;
exports.all = all;
exports.remove = remove;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

function create(path, cb) {
  var name = _utils2['default'].endpointNameFromPath(path);

  _utils2['default'].checkDataDir(function (err) {
    if (err) {
      cb(err);return;
    }

    _utils2['default'].createDir(_utils2['default'].dataPath + name, function (createDirErr) {
      if (createDirErr) {
        cb(createDirErr);return;
      }

      cb();
    });
  });
}

function all(cb) {
  _fs2['default'].readdir(_utils2['default'].dataPath, function (err, files) {
    if (err) {
      cb(err);return;
    }

    cb(null, files.map(function (file) {
      return _utils2['default'].pathFromEndpointName(file);
    }));
  });
}

function remove(endpoint, callback) {
  var name = _utils2['default'].endpointNameFromPath(endpoint);

  var endpointPath = _utils2['default'].dataPath + name;

  _fs2['default'].readdir(endpointPath, function (err, files) {
    if (err) {
      callback(err);return;
    }

    var jobs = files.reduce(function (collection, file) {
      collection.push(function (cb) {

        var versionPath = endpointPath + '/' + file;
        _fs2['default'].unlink(versionPath, function (unlinkErr) {
          if (unlinkErr) {
            cb(unlinkErr);return;
          }

          cb();
        });
      });

      return collection;
    }, []);

    _async2['default'].parallel(jobs, function (unlinkAllErr) {
      if (unlinkAllErr) {
        callback(unlinkAllErr);return;
      }

      _fs2['default'].rmdir(endpointPath, function (rmErr) {
        if (rmErr) {
          callback(rmErr);return;
        }

        callback();
      });
    });
  });
}