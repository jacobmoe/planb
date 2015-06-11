'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _utilsJs = require('../utils.js');

var _utilsJs2 = _interopRequireDefault(_utilsJs);

var _defaults = require('../defaults');

var defaults = _interopRequireWildcard(_defaults);

exports['default'] = function (storagePath) {

  function checkEndpoint(url, opts, cb) {
    _utilsJs2['default'].fileExists(getEndpointPath(url, opts), cb);
  }

  function create(url, opts, cb) {
    _utilsJs2['default'].createDirs(getEndpointPath(url, opts), cb);
  }

  function remove(endpoint, opts, cb) {
    var endpointPath = getEndpointPath(endpoint, opts);

    _utilsJs2['default'].fileExists(endpointPath, function (err, exists) {
      if (err) {
        cb(err);return;
      }

      if (exists) {
        _fsExtra2['default'].remove(endpointPath, function (err) {
          if (err) {
            cb(err);return;
          }

          cb();
        });
      } else {
        cb();
      }
    });
  }

  function getEndpointPath(endpoint, opts) {
    opts = opts || {};
    var port = opts.port || defaults.port;
    var action = opts.action || defaults.action;
    var name = _utilsJs2['default'].endpointNameFromPath(endpoint);

    return _path2['default'].join(storagePath, port, action, name);
  }

  return {
    create: create,
    remove: remove,
    checkEndpoint: checkEndpoint
  };
};

module.exports = exports['default'];