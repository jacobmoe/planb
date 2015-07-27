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

exports['default'] = function (opts) {
  _project2['default'].getRoot(function (err, projectRoot) {
    if (err || !projectRoot) {
      console.log('Project not initialized, probably');
    }

    _project2['default'].itemize(function (err, projItems) {
      if (err || !projItems || !projItems.length) {
        console.log('Add an endpoint first');
        return;
      }

      var itemsByPort = _utils2['default'].groupBy(projItems, 'port');

      Object.keys(itemsByPort).forEach(function (port) {
        var app = (0, _express2['default'])();

        app.all('*', function (req, res) {
          var action = req.method.toLowerCase();
          var items = _utils2['default'].groupBy(itemsByPort[port], 'action')[action];

          var item = findItemByPath(items, req.path);

          if (item) {
            respondForItem(req, res, projectRoot, item);
          } else {
            res.status(404).send('not found');
          }
        });

        app.set('port', port);

        servers.push(app.listen(port, function () {
          console.log('Listening on port', port);
        }));
      });
    });
  });
};

function respondForItem(req, res, projectRoot, item) {
  var parsedUrl = _url2['default'].parse('http://' + _utils2['default'].cleanUrl(item.url));

  var vPath = versionPath(_path2['default'].join(projectRoot, _storage.dataDirName), _path2['default'].join(parsedUrl.host, req.url), item);

  _utils2['default'].fileExists(vPath, function (err, exists) {
    if (err || !exists) {
      res.status(404).send('not found');
    } else {
      res.sendFile(vPath);
    }
  });
}

function findItemByPath(items, path) {
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
  if (!item) return null;

  var epName = _utils2['default'].endpointNameFromPath(url);
  var epPath = _path2['default'].join(storagePath, item.port, item.action, epName);

  return _path2['default'].join(epPath, item.current);
}

function close() {
  servers.forEach(function (server) {
    server.close();
  });
}