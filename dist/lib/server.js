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

var _storage = require('./storage');

var _storage2 = _interopRequireDefault(_storage);

var app = (0, _express2['default'])();
var server = undefined;

function registerGet(parsedEndpoint) {
  app.get(parsedEndpoint.pathname, function (req, res) {
    var endpointDirName = parsedEndpoint.host + req.url;

    _storage2['default'].versions.current(endpointDirName, function (err, version) {
      if (err) {
        res.status(404).send('No versions found for ' + endpointDirName);
        return;
      }

      _storage2['default'].versions.getData(endpointDirName, version, function (getDataErr, data) {
        try {
          res.json(JSON.parse(data));
        } catch (error) {
          res.status(415).send('Only JSON APIs are supported ATM');
        }
      });
    });
  });
}

exports['default'] = function (callback) {
  if (typeof callback !== 'function') callback = function () {};

  _storage2['default'].endpoints.all(function (err, endpoints) {
    if (err || !endpoints) {
      console.log('add an endpoint first');
      callback({ message: 'no endpoints' });
      return;
    }

    endpoints.forEach(function (endpoint) {
      registerGet(_url2['default'].parse('http://' + endpoint));
    });

    app.set('port', process.env.PORT || 5555);

    server = app.listen(app.get('port'), function () {
      console.log('Listening on port %d', server.address().port);
      callback();
    });
  });
};

function close() {
  if (server) server.close();
}