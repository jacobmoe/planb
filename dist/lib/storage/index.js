'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _endpoints = require('./endpoints');

var endpoints = _interopRequireWildcard(_endpoints);

var _versions = require('./versions');

var versions = _interopRequireWildcard(_versions);

exports['default'] = {
  endpoints: endpoints,
  versions: versions
};
module.exports = exports['default'];