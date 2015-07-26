'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _mimeTypes = require('mime-types');

var _mimeTypes2 = _interopRequireDefault(_mimeTypes);

var _jsonDiff = require('json-diff');

var _jsonDiff2 = _interopRequireDefault(_jsonDiff);

var _storage = require('./storage');

var _storage2 = _interopRequireDefault(_storage);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

function init(cb) {
  var storage = (0, _storage2['default'])(process.cwd());
  var config = (0, _config2['default'])(process.cwd());

  storage.checkForDataDir(function (err, dataDirExists) {
    if (err) {
      cb({ message: 'Error initializing project', data: err });
      return;
    }

    config.checkForConfigFile(function (err, configExists) {
      if (err) {
        cb({ message: 'Error initializing project', data: err });
        return;
      }

      if (dataDirExists && configExists) {
        cb({ message: 'Project already initialized' });
      } else {
        storage.createDataDir(function (err) {
          if (err) {
            cb(err);return;
          }

          config.create(function (err) {
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

function getRoot(cb, dots) {
  dots = dots || '.';

  var currentPath = _path2['default'].join(process.cwd(), dots);
  var configPath = _path2['default'].join(currentPath, _config.configName);

  _utils2['default'].fileExists(configPath, function (err, exists) {
    if (err) {
      cb({ message: 'Error getting root', data: err });
    } else if (exists) {
      cb(null, currentPath);
    } else {
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
    }
  });
}

function addEndpoint(url, opts, cb) {
  if (!validOptions(opts)) {
    cb({ message: 'Invalid port or action' });
    return;
  }

  buildConfigStorage(function (config, storage) {
    config.addEndpoint(url, opts, function (err, info) {
      if (err) {
        cb(err);return;
      }

      storage.endpoints.create(info.url, info, function (err) {
        if (err) {
          cb(err);return;
        }

        cb();
      });
    });
  }, cb);
}

function removeEndpoint(url, opts, cb) {
  buildConfigStorage(function (config, storage) {
    config.removeEndpoint(url, opts, function (err, info) {
      if (err) {
        cb(err);return;
      }

      storage.endpoints.remove(info.url, info, function (err) {
        if (err) {
          cb(err);return;
        }

        cb();
      });
    });
  }, cb);
}

/*
 * Make request against all GET endpoints and create a new version
 */
function fetchVersions(callback, reqCallback, reqErrCallback) {
  var transform = configTransformer(function (storage, item, cb) {
    if (item.action !== 'get') return;
    var url = item.url;
    var opts = { port: item.port, action: item.action };

    ensureEndpointExistance(storage, url, opts, function (err) {
      if (err) {
        callback(err);return;
      }

      if (!url.match(/^https?:\/\/.*/)) url = 'http://' + url;

      (0, _request2['default'])(url, function (error, response, body) {
        if (error) {
          cb({ url: item.url, data: error });return;
        }

        var versions = storage.versions(item.url, opts);
        var ext = _mimeTypes2['default'].extension(response.headers['content-type']);

        if (!ext) {
          cb({ url: item.url, data: { message: 'Unsupported content type' } });
          return;
        }

        if (response.statusCode != 200) {
          cb({ url: item.url, status: response.statusCode });
          return;
        }

        if (reqCallback) reqCallback(item);

        versions.create(body, ext, cb);
      });
    });
  }, function (err, res) {
    if (err && reqErrCallback) reqErrCallback(err.url);
  });

  transform(callback);
}

function ensureEndpointExistance(storage, url, opts, cb) {
  storage.endpoints.checkEndpoint(url, opts, function (err, exists) {
    if (err) {
      cb(err);return;
    }

    if (exists) {
      cb();
    } else {
      storage.endpoints.create(url, opts, cb);
    }
  });
}

/*
 * Returns an array to represent each item in storage
 *
 * Items include url, port, action, versions info array
 * and name of current version
 */
function itemize(callback) {
  var transform = configTransformer(function (storage, item, cb) {
    var opts = { port: item.port, action: item.action };
    var versions = storage.versions(item.url, opts);

    versions.all(function (err, res) {
      if (err) {
        cb(err);return;
      }
      item.versions = res;

      versions.current(function (err, current) {
        if (!err && current) item.current = current;

        cb(null, item);
      });
    });
  });

  transform(callback);
}

/* Remove current version from endpoint */
function rollbackVersion(url, opts, cb) {
  buildConfigStorage(function (config, storage) {
    var versions = storage.versions(url, opts);

    versions.current(function (err, currentVersion) {
      if (err) {
        cb(err);return;
      }

      versions.remove(currentVersion, cb);
    });
  }, cb);
}

function diff(url, v1, v2, opts, cb) {
  var v1Num = parseInt(v1, 10);
  var v2Num = parseInt(v2, 10);

  if ((v1Num === 0 || v1Num) && (v2Num === 0 || v2Num)) {
    diffVersions(url, v1Num, v2Num, opts, cb);
  } else {
    diffCurrentVersion(url, v1Num || v2Num, opts, cb);
  }
}

function diffCurrentVersion(url, versionNum, opts, cb) {
  buildConfigStorage(function (config, storage) {
    var versions = storage.versions(url, opts);

    versions.current(function (err, current) {
      if (err) {
        cb(err);return;
      }

      var currentNum = versions.numFromFileName(current);

      if (currentNum == 0) {
        cb({ message: 'Only one version for this endpoint' });
        return;
      }

      if (!currentNum) {
        cb({ message: 'Current version not found' });
        return;
      }

      if (versionNum === 0 || versionNum) {
        if (versionNum < currentNum && versionNum >= 0) {
          getVersionDiffs(versions, currentNum, versionNum, cb);
        } else {
          cb({ message: 'Invalid version number' });
          return;
        }
      } else {
        getVersionDiffs(versions, currentNum, currentNum - 1, cb);
      }
    });
  }, cb);
}

function diffVersions(url, v1, v2, opts, cb) {
  buildConfigStorage(function (config, storage) {
    var versions = storage.versions(url, opts);

    getVersionDiffs(versions, v1, v2, cb);
  }, cb);
}

function getVersionDiffs(versions, v1, v2, cb) {
  versions.getData(v1.toString(), function (err, v1Data) {
    if (err) {
      cb(err);return;
    }

    versions.getData(v2, function (err, v2Data) {
      if (err) {
        cb(err);return;
      }

      var diff = _jsonDiff2['default'].diffString(v1Data, v2Data);

      // for some reason, when json-diff doesn't find a diff,
      // it returns a string that looks like "undefined  "
      if (!diff || typeof diff === 'string' && diff.trim() === 'undefined') {
        diff = null;
      }

      cb(null, diff);
    });
  });
}

/*
 * Convenience method to get rootPath and build config
 * and storage instances
 */
function buildConfigStorage(success, fail) {
  getRoot(function (err, rootPath) {
    if (err || !rootPath) {
      fail(err || { message: 'Project root not found' });
    } else {
      var config = (0, _config2['default'])(rootPath);
      var storage = (0, _storage2['default'])(rootPath);

      success(config, storage);
    }
  });
}

/*
 * Convenience method for modifying the flattened config.
 * Accepts two hooks - the first processes the flattened
 * config item. The second is called after all items are
 * processed.
 *
 * Returns a function that accepts a callback
 */
function configTransformer(itemHook, endHook) {
  return function (callback) {
    buildConfigStorage(function (config, storage) {
      config.flattened(function (err, arr) {
        if (err) {
          callback(err);return;
        }

        var jobs = arr.reduce(function (collection, item) {
          collection.push(function (cb) {
            itemHook(storage, item, cb);
          });

          return collection;
        }, []);

        _async2['default'].parallel(jobs, function (err, res) {
          if (endHook) endHook(err, res);

          callback(null, res);
        });
      });
    }, callback);
  };
}

function validOptions(opts) {
  opts = opts || {};

  if (opts.action && !_utils2['default'].validAction(opts.action)) {
    return false;
  }

  if (opts.port && !_utils2['default'].validPort(opts.port)) {
    return false;
  }

  return true;
}

exports['default'] = {
  init: init,
  getRoot: getRoot,
  addEndpoint: addEndpoint,
  removeEndpoint: removeEndpoint,
  fetchVersions: fetchVersions,
  itemize: itemize,
  rollbackVersion: rollbackVersion,
  diff: diff
};
module.exports = exports['default'];