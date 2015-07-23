'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _defaults$port;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _utils = require('../utils');

var _utils2 = _interopRequireDefault(_utils);

var _defaults = require('../defaults');

var defaults = _interopRequireWildcard(_defaults);

var defaultConfigData = {
  "endpoints": _defineProperty({}, defaults.port, (_defaults$port = {}, _defineProperty(_defaults$port, defaults.action, []), _defineProperty(_defaults$port, "default", true), _defaults$port))
};

exports.defaultConfigData = defaultConfigData;
var configName = _utils2['default'].getProjectFileName('json');

exports.configName = configName;

exports['default'] = function (projectPath) {

  /* get config file object */
  function read(cb) {
    var configPath = _path2['default'].join(projectPath, configName);
    _utils2['default'].readJsonFile(configPath, function (err, data) {
      if (err && err.code === 'ENOENT') {
        cb({ message: 'Config file not found' });
      } else if (err) {
        cb(err);
      } else {
        cb(null, data);
      }
    });
  }

  function checkForConfigFile(cb) {
    _utils2['default'].fileExists(_path2['default'].join(projectPath, configName), cb);
  }

  /*
  * Create project config file
  *
  * Nothing is returned if file created successfully,
  * or if file already exists. Otherwise, an error is returned.
  */
  function create(cb) {
    var configPath = _path2['default'].join(projectPath, configName);

    checkForConfigFile(function (err, exists) {
      if (exists) {
        cb();
      } else if (err) {
        cb({ message: "Error creating project config", data: err });
      } else {
        _utils2['default'].writeJsonFile(configPath, defaultConfigData, function (err) {
          if (err) {
            cb({ message: 'Error creating project config', data: err });
          } else {
            cb();
          }
        });
      }
    });
  }

  function update(data, cb) {
    var configPath = _path2['default'].join(projectPath, configName);

    _utils2['default'].writeJsonFile(configPath, data, function (err) {
      if (err) {
        cb({ message: 'Error updating project config', data: err });
      } else {
        cb(null, data);
      }
    });
  }

  function defaultEndpointPort(endpoints) {
    var port = _utils2['default'].findKeyBy(endpoints, { 'default': true });

    if (!port && endpoints[defaults.port]) {
      port = defaults.port;
    }

    return port;
  }

  function newEndpoint(opts) {
    var action = _utils2['default'].validAction(opts.action) ? opts.action : defaults.action;

    return _defineProperty({}, action, []);
  }

  function addEndpointToAction(endpoint, action, url) {
    url = _utils2['default'].cleanUrl(url);

    if (!endpoint[action]) {
      endpoint[action] = [];
    }

    var urls = endpoint[action].map(function (item) {
      return _utils2['default'].cleanUrl(item);
    });

    if (urls.indexOf(url) < 0) {
      endpoint[action].push(url);
    }

    return endpoint;
  }

  function addEndpointForPort(endpoints, url, port, opts) {
    var action = _utils2['default'].validAction(opts.action) ? opts.action : defaults.action;

    if (!endpoints[port]) {
      endpoints[port] = newEndpoint(opts);
    }

    addEndpointToAction(endpoints[port], action, url);

    return { port: port, action: action, url: url };
  }

  function addEndpointForDefault(endpoints, url, opts) {
    var action = _utils2['default'].validAction(opts.action) ? opts.action : defaults.action;
    var port = undefined;

    if (Object.keys(endpoints).length) {
      port = defaultEndpointPort(endpoints);

      if (!port) {
        endpoints[defaults.port] = newEndpoint(opts);
        port = defaults.port;
      }
    } else {
      endpoints[defaults.port] = newEndpoint(opts);
      port = defaults.port;
    }

    addEndpointToAction(endpoints[port], action, url);

    return { port: port, action: action, url: url };
  }

  /*
  * addEndpoint
  *
  * Accepts a url and options. Adds the url to the config file
  *
  * Options: action, port
  *
  * First try to add the url to the config item that matches the
  * supplied port number. If not found, a new config item is created.
  * Once we have the config item, first try to add the url to the
  * given action. If it doesn't exist, create a new one.
  * The updated data is then written back to the file
  *
  * Returns an info object describing new endpoint
  * Includes port, action and url
  */
  function addEndpoint(url, opts, cb) {
    opts = opts || {};

    read(function (err, configData) {
      if (err) {
        cb(err);return;
      }

      var endpoints = configData.endpoints || [];
      var info = undefined;
      url = _utils2['default'].cleanUrl(url);

      if (opts.port) {
        info = addEndpointForPort(endpoints, url, opts.port, opts);
      } else {
        info = addEndpointForDefault(endpoints, url, opts);
      }

      update(configData, function (err) {
        if (err) {
          cb(err);return;
        }

        cb(null, info);
      });
    });
  }

  function removeEndpointFromAction(endpoint, action, url) {
    var urls = endpoint[action];

    if (!urls || !urls.length) return null;

    urls = urls.map(function (item) {
      return _utils2['default'].cleanUrl(item);
    });

    var urlIndex = urls.indexOf(_utils2['default'].cleanUrl(url));

    if (urlIndex < 0) return urls;

    urls.splice(urlIndex, 1);

    return urls;
  }

  /*
  * removeEndpoint
  *
  * Accepts a url and options. Removes the url from the config file.
  *
  * Options: action, port
  *
  * Remove url from the default config item and action if options
  * not supplied. Otherwise, by port and/or action and remove.
  */
  function removeEndpoint(url, opts, cb) {
    opts = opts || {};

    read(function (err, configData) {
      if (err) {
        cb(err);return;
      }

      var endpoints = configData.endpoints;
      var action = opts.action || defaults.action;
      var port = opts.port;

      if (!endpoints || !Object.keys(endpoints).length) {
        cb({ message: 'No endpoints in config' });
        return;
      }

      url = _utils2['default'].cleanUrl(url);

      if (!port) {
        port = defaultEndpointPort(endpoints);
      }

      if (!port || !endpoints[port]) {
        cb({ message: 'Endpoint not found in config' });
        return;
      }

      var urls = removeEndpointFromAction(endpoints[port], action, url);
      configData.endpoints[port][action] = urls;

      update(configData, function (err) {
        if (err) {
          cb(err);return;
        }

        cb(null, { port: port, action: action, url: url });
      });
    });
  }

  function getDefaultPort(cb) {
    read(function (err, configData) {
      if (err) {
        cb(err);return;
      }

      var endpoints = configData.endpoints || [];

      cb(null, defaultEndpointPort(endpoints));
    });
  }

  function setDefaultPort(port, cb) {
    if (!_utils2['default'].validPort(port)) {
      cb({ message: 'Not a valid port' });
      return;
    }

    read(function (err, configData) {
      if (err) {
        cb(err);return;
      }

      var endpoints = configData.endpoints || [];
      var current = defaultEndpointPort(endpoints);

      if (current && endpoints[current]) {
        delete endpoints[current]['default'];
      }

      if (!endpoints[port]) {
        endpoints[port] = newEndpoint({ port: port });
      }

      endpoints[port]['default'] = true;

      update(configData, cb);
    });
  }

  /*
   * Returns a convenient array of config items that include
   * url, port and action
   */
  function flattened(cb) {
    var result = [];

    read(function (err, configData) {
      if (err) {
        cb({ message: "JSON config is invalid." });
        return;
      }

      var endpoints = configData.endpoints || [];

      Object.keys(endpoints).forEach(function (port) {
        if (!_utils2['default'].validPort(port)) return;

        Object.keys(endpoints[port]).forEach(function (action) {
          if (!_utils2['default'].validAction(action)) return;
          var urls = endpoints[port][action] || [];

          urls.forEach(function (url) {
            result.push({
              url: url,
              port: port,
              action: action
            });
          });
        });
      });

      cb(null, result);
    });
  }

  return {
    create: create,
    read: read,
    checkForConfigFile: checkForConfigFile,
    configName: configName,
    addEndpoint: addEndpoint,
    removeEndpoint: removeEndpoint,
    getDefaultPort: getDefaultPort,
    setDefaultPort: setDefaultPort,
    flattened: flattened
  };
};