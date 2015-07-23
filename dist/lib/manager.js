'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _asciiTable = require('ascii-table');

var _asciiTable2 = _interopRequireDefault(_asciiTable);

var _prompt = require('prompt');

var _prompt2 = _interopRequireDefault(_prompt);

var _project = require('./project');

var _project2 = _interopRequireDefault(_project);

exports['default'] = {
  init: function init() {
    _project2['default'].init(function (err) {
      if (err) {
        console.log("Error initializing project.", err.message);
      } else {
        console.log("Project initialized");
      }
    });
  },

  add: function add(url, opts) {
    if (!url || !url.length) return;

    var addOptions = options(opts);
    addOptions.key = opts.key;

    _project2['default'].addEndpoint(url, addOptions, function (err) {
      if (err) {
        console.log("Error adding endpoint.", err.message);
      } else {
        console.log('Endpoint added');
      }
    });
  },

  fetch: function fetch() {
    _project2['default'].fetchVersions(function (err) {
      if (err) {
        console.log("Error fetching new versions.", err.message);
      }
    }, function (item) {
      console.log("Updating", item.url, "for port", item.port);
    }, function (url) {
      console.log("Could not update", url);
    });
  },

  list: function list() {
    _project2['default'].itemize(function (err, items) {
      if (err) {
        console.log("Error getting list.", err.message);
      } else {
        items.forEach(function (item) {
          if (!item) return;

          var table = new _asciiTable2['default']();
          table.setHeading(null, item.port + ' | ' + item.action + ' | ' + item.url);

          if (!item.versions.length) {
            if (item.action === 'get') {
              table.addRow('-', 'No versions yet. Use "fetch" to add one');
            } else {
              var message = 'not supported by fetch. Add a version manually.';
              table.addRow('-', item.action.toUpperCase() + ' ' + message);
            }
          } else {
            item.versions.forEach(function (version) {
              var name = version.name.replace(/\..*/, '');
              table.addRow(name, version.modifiedAt);
            });
          }

          console.log(table.toString());
        });
      }
    });
  },

  rollback: function rollback(endpoint, opts) {
    if (!endpoint || !endpoint.length) {
      console.log('Missing endpoint. Try the list command');
      return;
    }

    _project2['default'].rollbackVersion(endpoint, options(opts), function (err) {
      if (err) {
        console.log("Error rolling back.", err.message);
        return;
      }

      console.log("Rolled back endpoint");
    });
  },

  remove: function remove(endpoint, opts) {
    if (!endpoint) {
      console.log('Missing endpoint. Try the list command');
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
        console.log('Invalid response');
        return;
      }

      if (result.confirm === 'yes' || result.confirm === 'y') {
        _project2['default'].removeEndpoint(endpoint, options(opts), function (err) {
          if (err) {
            console.log('Endpoint not found');
            return;
          }

          console.log('Endpoint removed');
        });
      }
    });
  },

  diff: function diff(endpoint, v1, v2, opts) {
    if (!endpoint) {
      console.log('Missing endpoint. Try the list command');
      return;
    }

    _project2['default'].diff(endpoint, v1, v2, options(opts), function (err, diff) {
      if (err) {
        console.log('Problem getting diff.', err.message);
      } else {
        if (diff) {
          console.log(diff);
        } else {
          console.log('No diff');
        }
      }
    });
  }
};

function options(opts) {
  opts = opts || {};

  var result = {};
  var parent = opts.parent || {};

  if (typeof parent.action === 'string') {
    result.action = parent.action.toLowerCase();
  }

  if (typeof parent.port === 'string') {
    result.port = parent.port;
  }

  return result;
}
module.exports = exports['default'];