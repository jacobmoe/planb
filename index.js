#!/usr/bin/env node

var program = require('commander')

program
  .command('project')
  .description('project')
  .action(require('./lib/project'))
