'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.create = create;
exports.all = all;
exports.current = current;
exports.getData = getData;
exports.remove = remove;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

function create(endpointUrl, data, cb) {
  var name = _utils2['default'].endpointNameFromPath(endpointUrl);
  var fileNum = undefined;

  _fs2['default'].readdir(_utils2['default'].dataPath + name, function (err, files) {
    if (err) {
      cb(err);return;
    }

    if (!files.length) {
      fileNum = 0;
    } else {
      fileNum = _utils2['default'].largest(files) + 1;
    }

    var fileName = _utils2['default'].dataPath + name + '/' + fileNum;

    _fs2['default'].writeFile(fileName, data, function (writeErr) {
      if (writeErr) {
        cb(writeErr);return;
      }

      cb();
    });
  });
}

function all(endpointUrl, callback) {
  var name = _utils2['default'].endpointNameFromPath(endpointUrl);

  _fs2['default'].readdir(_utils2['default'].dataPath + name, function (err, versions) {
    if (err) {
      callback(err);return;
    }

    var jobs = versions.reduce(function (collection, file) {
      collection.push(function (cb) {
        var versionPath = _utils2['default'].dataPath + name + '/' + file;
        _fs2['default'].stat(versionPath, function (statErr, stats) {
          if (statErr) {
            cb(statErr);return;
          }

          cb(null, { name: file, modifiedAt: stats.mtime });
        });
      });

      return collection;
    }, []);

    _async2['default'].parallel(jobs, function (allErr, res) {
      callback(allErr, res);
    });
  });
}

function current(endpointUrl, cb) {
  var name = _utils2['default'].endpointNameFromPath(endpointUrl);

  _fs2['default'].readdir(_utils2['default'].dataPath + name, function (err, versions) {
    if (err) {
      cb(err);return;
    }

    cb(null, _utils2['default'].largest(versions));
  });
}

function getData(endpointUrl, version, cb) {
  var name = _utils2['default'].endpointNameFromPath(endpointUrl);

  var filePath = _utils2['default'].dataPath + name + '/' + version;

  _fs2['default'].readFile(filePath, 'utf8', function (err, data) {
    if (err) {
      cb(err);return;
    }

    cb(null, data);
  });
}

function remove(endpointUrl, version, cb) {
  var name = _utils2['default'].endpointNameFromPath(endpointUrl);

  var versionPath = _utils2['default'].dataPath + name + '/' + version;
  _fs2['default'].unlink(versionPath, function (err) {
    if (err) {
      cb(err);return;
    }

    cb();
  });
}