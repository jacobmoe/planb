'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.close = close;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _project = require('./project');

var _project2 = _interopRequireDefault(_project);

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

var _storage = require('./storage');

var servers = [];
var projectItems = undefined;

exports['default'] = function (opts) {
  _project2['default'].getRoot(function (err, projectRoot) {
    if (err || !projectRoot) {
      console.log('Project not initialized, probably');
    }

    _project2['default'].itemize(function (err, projItems) {
      if (err || !projItems) {
        console.log('Is the config file malformed?', err);
        return;
      }

      if (!projItems.length && !options(opts).record) {
        console.log('Add an endpoint first');
        return;
      }

      projectItems = projItems;

      _project2['default'].getPorts(function (err, ports) {
        if (err || !projItems) {
          console.log('Is the config file malformed?', err);
          return;
        }

        registerPorts(ports, projectRoot, options(opts));
      });
    });
  });
};

function registerPorts(ports, projectRoot, opts) {
  ports = ports || [];

  ports.forEach(function (port) {
    var app = (0, _express2['default'])();

    app.all('*', function (req, res) {
      var itemsByPort = _utils2['default'].groupBy(projectItems, 'port');
      portHandler(req, res, port, itemsByPort[port], projectRoot, opts);
    });

    app.set('port', port);

    servers.push(app.listen(port, function () {
      console.log('Listening on port', port);
    }));
  });
}

function portHandler(req, res, port, portItems, projectRoot, opts) {
  _project2['default'].getBase(port, function (err, base) {
    if (err) {
      res.status(404).send('error getting base url');
      return;
    }

    var action = req.method.toLowerCase();
    var items = _utils2['default'].groupBy(portItems, 'action')[action];

    var item = findItemByPath(items, req.url);

    if (item) {
      respondForItem(req, res, projectRoot, base, item);
    } else {
      if (opts.record) {
        recordRequest(req, port, projectRoot, base, function (err, item) {
          if (err) {
            res.status(err.code || 404).send(err.message || 'not found');
          } else {
            respondForItem(req, res, projectRoot, base, item);
          }
        });
      } else {
        res.status(404).send('not found');
      }
    }
  });
}

function recordRequest(req, port, projectRoot, base, cb) {
  if (!base || !base.length) {
    cb({ message: 'base is not set', code: 401 });
    return;
  }

  if (!base.match(/^https?:\/\/.*/)) base = 'http://' + base;
  if (base.slice(-1) === '/') base = base.slice(0, -1);

  var parsedUrl = _url2['default'].parse(req.url);
  var endpointUrl = base + parsedUrl.path;

  var action = req.method.toLowerCase();
  var opts = { port: port, action: action };

  addAndFetchEndpoint(endpointUrl, opts, function (err) {
    if (err) {
      cb(err);
    } else {
      _project2['default'].getCurrentVersion(endpointUrl, opts, function (err, current) {
        if (err) {
          cb({ message: 'fetching error', code: 404 });
        } else {
          opts.url = endpointUrl;
          opts.current = current;

          projectItems.push(opts);
          cb(null, opts);
        }
      });
    }
  });
}

function addAndFetchEndpoint(url, opts, cb) {
  _project2['default'].addEndpoint(url, opts, function (err) {
    if (err) {
      cb({ message: 'error adding endpoint', code: 404 });
    } else {
      _project2['default'].fetchVersion(url, opts, function (err) {
        if (err) {
          cb({ message: 'fetching error', code: 404 });
        } else {
          cb();
        }
      });
    }
  });
}

function respondForItem(req, res, projectRoot, base, item) {
  var parsedUrl = _url2['default'].parse('http://' + _utils2['default'].cleanUrl(item.url));

  var host = parsedUrl.host || base;

  var vPath = versionPath(_path2['default'].join(projectRoot, _storage.dataDirName), _path2['default'].join(host, req.url), item);

  if (!vPath) {
    res.status(404).send('version file not found');
    return;
  }

  _utils2['default'].fileExists(vPath, function (err, exists) {
    if (err || !exists) {
      res.status(404).send('version file not found');
    } else {
      res.sendFile(vPath);
    }
  });
}

function findItemByPath(items, path) {
  if (!items) return null;

  for (var i = 0; i < items.length; i++) {
    var parsedUrl = _url2['default'].parse('http://' + _utils2['default'].cleanUrl(items[i].url));

    if (parsedUrl.path === path) {
      items[i].parsedUrl = parsedUrl;
      return items[i];
    }
  }

  return null;
}

function versionPath(storagePath, url, item) {
  if (!item || !item.current) return null;

  var epName = _utils2['default'].endpointNameFromPath(url);
  var epPath = _path2['default'].join(storagePath, item.port, item.action, epName);

  return _path2['default'].join(epPath, item.current);
}

function close() {
  servers.forEach(function (server) {
    server.close();
  });
}

function options(opts) {
  opts = opts || {};

  var result = {};
  var parent = opts.parent || {};

  if (typeof parent.record === 'boolean') {
    result.record = parent.record;
  }

  return result;
}