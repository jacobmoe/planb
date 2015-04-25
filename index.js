#!/usr/bin/env node

var program = require('commander')
var manager = require('./lib/manager')
var server = require('./lib/server')

program
  .command('add [url]')
  .description('add')
  .action(manager.add)

program
  .command('list')
  .description('list')
  .action(manager.list)

program
  .command('fetch')
  .description('fetch')
  .action(manager.fetch)

program
  .command('serve')
  .description('serve')
  .action(server)

program.parse(process.argv)

if (!process.argv.slice(2).length) {
  program.outputHelp()
}
