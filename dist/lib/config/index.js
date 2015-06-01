'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _defaultEndpoint;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _defineProperty(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); }

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _packageJson = require('../../../package.json');

var _packageJson2 = _interopRequireDefault(_packageJson);

var _utils = require('../utils');

var _utils2 = _interopRequireDefault(_utils);

var name = _packageJson2['default'].name;
var configName = '.' + name + '.json';

var defaultPort = 5000;
var defaultAction = 'get';
var actions = ['get', 'post', 'put', 'delete'];

var defaultEndpoint = (_defaultEndpoint = {
  'port': defaultPort }, _defineProperty(_defaultEndpoint, defaultAction, []), _defineProperty(_defaultEndpoint, 'default', true), _defaultEndpoint);

if (process.env.NODE_ENV === 'test') {
  configName = configName + '.test';
}

var defaultConfigPath = _path2['default'].join(__dirname, '../../../assets/json/defaultConfig.json');

function checkPwd(cb) {
  var configPath = process.cwd() + '/' + configName;

  _utils2['default'].fileExists(configPath, cb);
}

/*
 * Create project config file
 *
 * Nothing is returned is file created successfully,
 * or if file already exists
*/
function create(cb) {
  var configPath = process.cwd() + '/' + configName;

  checkPwd(function (err, exists) {
    if (exists) {
      cb();
    } else if (err) {
      cb({ message: 'Error creating project config', data: err });
    } else {
      _fsExtra2['default'].copy(defaultConfigPath, configPath, function (err) {
        if (err) {
          cb({ message: 'Error creating project config', data: err });
        } else {
          cb();
        }
      });
    }
  });
}

function getEndpoint(port) {
  var endpoints = _packageJson2['default'].endpoints;
  var endpoint = undefined;

  if (!endpoints || !endpoints.length) {
    return getDefaultEndpoint();
  }

  if (port) {
    endpoints.forEach(function (ep) {
      if (ep.port === port) {
        endpoint = ep;
        return;
      }
    });
  }

  if (!endpoint) {
    endpoint = getDefaultEndpoint();
  }

  return endpoint;
}

/*
 * Return default endpoint
 *
 * Check config file for endpoint with the default flag
 * If not set, check for the first endpoint
 * If no endpoints, return the default
*/
function getDefaultEndpoint() {
  var endpoints = _packageJson2['default'].endpoints;
  var defaultEp = undefined;

  if (!endpoints || !endpoints.length) {
    return defaultEndpoint;
  }

  endpoints.forEach(function (ep) {
    if (ep['default']) {
      defaultEp = ep;
      return;
    }
  });

  if (!defaultEp) {
    var endpoint = endpoints[0] || {};
    defaultEp = endpoint.port;
  }

  if (!defaultEp) {
    defaultEp = defaultEndpoint;
  }

  return defaultEp;
}

function validAction(action) {
  return actions.indexOf(action) > -1;
}

function addEndpoint(url, opts, cb) {
  var endpoint = getEndpoint(opts.port);
  var action = opts.action || defaultAction;

  if (!validAction(action)) action = defaultAction;

  if (!endpoint[action] || !Array.isArray(endpoint[action])) {
    endpoint[action] = [];
  }

  endpoint[action].push(url);
}

exports['default'] = {
  create: create,
  checkPwd: checkPwd,
  configName: configName
};
module.exports = exports['default'];