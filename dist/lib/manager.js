'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var _arguments = arguments;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _asciiTable = require('ascii-table');

var _asciiTable2 = _interopRequireDefault(_asciiTable);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _prompt = require('prompt');

var _prompt2 = _interopRequireDefault(_prompt);

var _storage = require('./storage');

var _storage2 = _interopRequireDefault(_storage);

exports['default'] = {
  add: function add(url, opts, cb) {
    if (typeof cb !== 'function') cb = function () {};
    if (typeof url !== 'string') return;

    _storage2['default'].endpoints.create(url, function (err) {
      if (err) {
        console.log('error adding endpoint', err);
        cb(err);
        return;
      }

      console.log('endpoint added');
      cb();
    });
  },

  fetch: function fetch(opts, callback) {
    if (typeof callback !== 'function') callback = function () {};

    _storage2['default'].endpoints.all(function (err, endpoints) {
      if (err || !endpoints) {
        console.log('add an endpoint first');
        callback();
        return;
      }

      var jobs = endpoints.reduce(function (collection, endpoint) {
        collection.push(function (cb) {
          var url = 'http://' + endpoint;
          (0, _request2['default'])(url, function (error, response, body) {
            if (error) {
              cb({ endpoint: endpoint, error: error });
              return;
            }

            if (response.statusCode != 200) {
              cb({ endpoint: endpoint, status: response.statusCode });
              return;
            }

            console.log('updating ' + endpoint);
            _storage2['default'].versions.create(endpoint, body, cb);
          });
        });

        return collection;
      }, []);

      _async2['default'].parallel(jobs, function (err, res) {
        if (err) {
          console.log('could not fetch data from ' + err.endpoint);
        }

        callback();
      });
    });
  },

  list: function list(opts, cb) {
    if (typeof cb !== 'function') cb = function () {};

    _storage2['default'].endpoints.all(function (err, endpoints) {
      if (err || !endpoints) {
        console.log('add an endpoint first');
        cb();
        return;
      }

      endpoints.forEach(function (endpoint) {
        var table = new _asciiTable2['default']();

        table.setHeading(null, endpoint);

        _storage2['default'].versions.all(endpoint, function (versionsErr, versions) {
          if (!versions.length) {
            table.addRow('-', 'no versions yet. use "fetch" to add one');
          } else {
            versions.forEach(function (version) {
              table.addRow(version.name, version.modifiedAt);
            });
          }

          console.log(table.toString());
          cb();
        });
      });
    });
  },

  rollback: function rollback(endpoint, opts, cb) {
    if (typeof cb !== 'function') cb = function () {};

    if (!endpoint) {
      console.log('missing endpoint. try the list command');
      cb({ message: 'missing endpoint' });
      return;
    }

    _storage2['default'].versions.current(endpoint, function (err, num) {
      if (err || !num) {
        console.log('no versions for that endpoint');
        cb(err);
        return;
      }

      _storage2['default'].versions.remove(endpoint, num, function (removeError) {
        if (removeError) {
          console.log('error rolling back', removeError);
          cb(removeError);
          return;
        }

        cb();
      });
    });
  },

  remove: function remove(endpoint, opts, cb) {
    if (typeof cb !== 'function') cb = function () {};

    if (typeof _arguments[0] === 'function') {
      cb = _arguments[0];
      endpoint = null;
    }

    if (!endpoint) {
      console.log('missing endpoint. try the list command');
      cb({ message: 'missing endpoint' });
      return;
    }

    var schema = {
      properties: {
        confirm: {
          message: 'Are you sure? (y/n)'
        }
      }
    };

    _prompt2['default'].start();

    _prompt2['default'].get(schema, function (err, result) {
      if (err) {
        console.log('invalid response');
        cb({ message: 'invalid response' });
        return;
      }

      if (result.confirm === 'yes' || result.confirm === 'y') {
        _storage2['default'].endpoints.remove(endpoint, function (removeError) {
          if (removeError) {
            var message = 'endpoint not found';
            console.log(message);
            cb({ message: message });
            return;
          }

          console.log('endpoint removed');
          cb();
        });
      }
    });
  }

};
module.exports = exports['default'];