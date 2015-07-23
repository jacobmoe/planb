'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _package = require('../../package');

var _package2 = _interopRequireDefault(_package);

var _defaults = require('./defaults');

var defaults = _interopRequireWildcard(_defaults);

function createDirs(path, cb) {
  _fsExtra2['default'].mkdirs(path, function (err) {
    if (!err) {
      cb(null);return;
    }

    if (err.code == 'EEXIST') cb(null);else cb(err);
  });
}

function cleanUrl(url) {
  url = url || '';

  return url.replace(/^https?:\/\//, '');
}

function endpointNameFromPath(path) {
  return _crypto2['default'].createHash('sha256').update(cleanUrl(path)).digest('hex');
}

function largest(arr) {
  if (arr.length) {
    return Math.max.apply(Math, arr);
  } else {
    return null;
  }
}

function fileExists(path, cb) {
  _fsExtra2['default'].stat(path, function (err) {
    if (err && err.code === 'ENOENT') {
      cb(null, false);
    } else if (err) {
      cb(err);
    } else {
      cb(null, true);
    }
  });
}

function writeJsonFile(path, data, cb) {
  var json = JSON.stringify(data, null, 2);

  _fsExtra2['default'].writeFile(path, json, 'utf8', cb);
}

function readJsonFile(path, cb) {
  _fsExtra2['default'].readFile(path, 'utf8', function (err, json) {
    if (err) {
      cb(err);return;
    }

    var data = undefined;

    try {
      data = JSON.parse(json);
    } catch (err) {
      cb({ message: 'Must be a valid JSON file' });
      return;
    }

    cb(null, data);
  });
}

function findIndexBy(arr, opts) {
  var keys = Object.keys(opts);

  function match(item) {
    if (typeof opts === 'function') {
      return opts(item);
    } else {
      var doesMatch = keys.length > 0;

      keys.forEach(function (key) {
        if (opts[key] !== item[key]) {
          doesMatch = false;
          return;
        }
      });

      return doesMatch;
    }
  }

  for (var i = 0; i < arr.length; i++) {
    if (match(arr[i])) return i;
  }

  return null;
}

function findBy(arr, opts) {
  var index = findIndexBy(arr, opts);

  if (index) {
    return arr[index];
  } else {
    return null;
  }
}

/*
 * findKeyBy(obj, opts)
 *
 * Accepts an object and returns the key whose value is an object
 * matching the opts object
 *
 * Usage:
 *
 * const obj = { "5000": {get: [], default: true}, "5001": {get: []} }
 * findKeyBy(obj, {default: true}) // returns "5000"
 */
function findKeyBy(obj, opts) {
  obj = obj || {};
  opts = opts || {};
  var key = null;

  var objKeys = Object.keys(obj);

  for (var i = 0; i < objKeys.length; i++) {
    var objKey = objKeys[i];
    var keyMatch = true;

    if (obj[objKey] && typeof obj[objKey] === 'object') {
      var optKeys = Object.keys(opts);
      if (!optKeys.length) {
        keyMatch = false;break;
      }

      for (var j = 0; j < optKeys.length; j++) {
        var optKey = optKeys[j];

        if (obj[objKey][optKey] !== opts[optKey]) {
          keyMatch = false;
          break;
        }
      }
    } else {
      keyMatch = false;
    }

    if (keyMatch) {
      key = objKey;
      break;
    }
  }

  return key;
}

function getProjectFileName(ext) {
  var name = _package2['default'].name;

  var fileName = '.' + name + '.' + ext;

  if (process.env.NODE_ENV === 'test') {
    fileName = fileName + '.test';
  }

  return fileName;
}

function validAction(action) {
  return defaults.allowedActions.indexOf(action) > -1;
}

function validPort(port) {
  var portMin = 1024;
  var portMax = 65535;

  var isNumber = !isNaN(port);
  var validPortRange = port > portMin && port < portMax;

  return isNumber && validPortRange;
}

function getProp(obj, propPath) {
  if (typeof propPath === 'string') {
    propPath = propPath.split('.');
  }
  var result = obj;

  try {
    propPath.forEach(function (name) {
      result = result[name];
    });

    return result;
  } catch (e) {

    return null;
  }
}

exports['default'] = {
  createDirs: createDirs,
  endpointNameFromPath: endpointNameFromPath,
  cleanUrl: cleanUrl,
  largest: largest,
  fileExists: fileExists,
  writeJsonFile: writeJsonFile,
  readJsonFile: readJsonFile,
  findIndexBy: findIndexBy,
  findKeyBy: findKeyBy,
  findBy: findBy,
  getProjectFileName: getProjectFileName,
  validAction: validAction,
  validPort: validPort,
  getProp: getProp
};
module.exports = exports['default'];