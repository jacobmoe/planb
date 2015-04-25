#!/usr/bin/env node

var program = require('commander')
var endpoints = require('./lib/endpoints')

program
  .command('add [url]')
  .description('add')
  .action(endpoints.add)

program
  .command('list')
  .description('list')
  .action(endpoints.list)

program
  .command('fetch')
  .description('fetch')
  .action(endpoints.fetch)

program.parse(process.argv)

if (!process.argv.slice(2).length) {
  program.outputHelp()
}
