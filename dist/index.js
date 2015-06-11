#!/usr/bin/env node
'use strict';

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _libManager = require('./lib/manager');

var _libManager2 = _interopRequireDefault(_libManager);

var _libServer = require('./lib/server');

var _libServer2 = _interopRequireDefault(_libServer);

var _libDefaults = require('./lib/defaults');

var defaults = _interopRequireWildcard(_libDefaults);

_commander2['default'].option('-p, --port <port>', 'Set port. Default: ' + defaults.port).option('-a, --action <action>', 'Set action. Default: ' + defaults.action);

_commander2['default'].command('init').description('Initialize a project in current directory').action(_libManager2['default'].init);

_commander2['default'].command('add [url]').description('Add a new endpoint').action(_libManager2['default'].add);

_commander2['default'].command('list').description('List all endpoint versions').action(_libManager2['default'].list);

_commander2['default'].command('fetch').description('Fetch and store a new version for each endpoint').action(_libManager2['default'].fetch);

_commander2['default'].command('rollback [endpoint]').description('Rollback the endpoint\'s current version').action(_libManager2['default'].rollback);

_commander2['default'].command('remove [endpoint]').description('Remove the endpoint and all its versions').action(_libManager2['default'].remove);

_commander2['default'].command('diff [endpoint] [v1] [v2]').description('Diff versions. With no version numbers, \n' + 'diffs the current version with the previous').action(_libManager2['default'].diff);

_commander2['default'].command('serve').description('Serve local versions').action(_libServer2['default']);

_commander2['default'].parse(process.argv);

if (!process.argv.slice(2).length) {
  _commander2['default'].outputHelp();
}