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

function registerProjectItem(app, item, storagePath) {
  if (!item.url) return;
  var parsedUrl = _url2['default'].parse('http://' + _utils2['default'].cleanUrl(item.url));

  app[item.action](parsedUrl.pathname, function (req, res) {
    if (!item.current) {
      res.status(404).send('No versions found for ' + item.url);
      return;
    }

    res.sendFile(versionPath(storagePath, _path2['default'].join(parsedUrl.host, req.url), item));
  });
}

exports['default'] = function () {
  _project2['default'].getRoot(function (err, projectRoot) {
    if (err || !projectRoot) {
      console.log('Project not initialized, probably');
    }

    _project2['default'].itemize(function (err, items) {
      if (err || !items || !items.length) {
        console.log('Add an endpoint first');
        return;
      }

      var itemsByPort = projectItemsByPort(items);

      Object.keys(itemsByPort).forEach(function (port) {
        var app = (0, _express2['default'])();

        itemsByPort[port].forEach(function (item) {
          registerProjectItem(app, item, _path2['default'].join(projectRoot, _storage.dataDirName));
        });

        app.set('port', port);

        servers.push(app.listen(port, function () {
          console.log('Listening on port', port);
        }));
      });
    });
  });
};

function projectItemsByPort(items) {
  items = items || [];

  return items.reduce(function (result, item) {
    if (!result[item.port]) result[item.port] = [];
    result[item.port].push(item);

    return result;
  }, {});
}

function versionPath(storagePath, url, item) {
  var epName = _utils2['default'].endpointNameFromPath(url);
  var epPath = _path2['default'].join(storagePath, item.port, item.action, epName);

  return _path2['default'].join(epPath, item.current);
}

function close() {
  servers.forEach(function (server) {
    server.close();
  });
}