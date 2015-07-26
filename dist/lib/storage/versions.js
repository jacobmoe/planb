'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _utils = require('../utils');

var _utils2 = _interopRequireDefault(_utils);

exports['default'] = function (endpointPath) {

  /*
   * create(data, ext, cb) / create(data, cb)
   *
   * Write data to a version file.
   *
   * Version names are a sequence of integers with an optional
   * file extension. Finds the current version number, increments by one
   * to get the name of the next version.
   */
  function create(data, ext, cb) {
    if (arguments.length < 3) {
      cb = arguments[1];
      ext = null;
    }

    current(function (err, currentVersion) {
      if (err) {
        cb(err);return;
      }

      var currentNum = numFromFileName(currentVersion);
      var firstVersion = currentNum !== 0 && !currentNum;

      var fileNum = firstVersion ? 0 : currentNum + 1;
      var fileName = ext ? fileNum + '.' + ext : fileNum.toString();
      var filePath = _path2['default'].join(endpointPath, fileName);

      _fs2['default'].writeFile(filePath, data, function (err) {
        if (err) {
          cb(err);return;
        }

        cb();
      });
    });
  }

  /*
   * Returns a data object for each version
   *
   * Return object: name, modifiedAt
   */
  function all(callback) {
    _fs2['default'].readdir(endpointPath, function (err, versions) {
      if (err && err.code === 'ENOENT') {
        callback(null, []);return;
      }
      if (err) {
        callback(err);return;
      }

      var jobs = versions.reduce(function (collection, file) {
        collection.push(function (cb) {
          var versionPath = _path2['default'].join(endpointPath, file);

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

  function numFromFileName(name) {
    if (typeof name !== 'string') return null;

    var num = name.replace(/\..*/, '');
    return isNaN(num) ? null : parseInt(num, 10);
  }

  function fileNameFromNum(num, cb) {
    if (typeof num === 'string') num = parseInt(num, 10);

    _fs2['default'].readdir(endpointPath, function (err, versions) {
      if (err) {
        cb(err);return;
      }

      var versionNums = versions.map(function (version) {
        return numFromFileName(version);
      });

      var versionIndex = versionNums.indexOf(num);

      if (versionIndex === -1) {
        cb();
      } else {
        cb(null, versions[versionIndex]);
      }
    });
  }

  /*
   * Returns name of most recently added version
   */
  function current(cb) {
    _fs2['default'].readdir(endpointPath, function (err, versions) {
      if (err && err.code === 'ENOENT') {
        cb({ message: 'Endpoint not found.' });
        return;
      }

      if (err) {
        cb(err);return;
      }

      var versionNums = versions.map(function (name) {
        return numFromFileName(name);
      });

      var largest = _utils2['default'].largest(versionNums);
      var largestIndex = versionNums.indexOf(largest);

      if (largestIndex > -1) {
        cb(null, versions[largestIndex]);
      } else {
        cb();
      }
    });
  }

  /*
   * Accepts a version number and returns file contents
   */
  function getData(versionNum, cb) {
    fileNameFromNum(versionNum, function (err, versionName) {
      if (err) {
        cb(err);return;
      }
      if (!versionName) {
        cb({ message: 'Version not found' });return;
      }

      var filePath = _path2['default'].join(endpointPath, versionName);

      _utils2['default'].readJsonFile(filePath, function (err, data) {
        if (err) {
          cb(err);return;
        }

        cb(null, data);
      });
    });
  }

  function remove(versionFileName, cb) {
    var versionPath = _path2['default'].join(endpointPath, versionFileName);

    _fs2['default'].unlink(versionPath, function (err) {
      if (err) {
        cb(err);return;
      }

      cb();
    });
  }

  return {
    create: create,
    all: all,
    current: current,
    getData: getData,
    remove: remove,
    numFromFileName: numFromFileName
  };
};

module.exports = exports['default'];