#!/usr/bin/env node

var program = require('commander')

program
  .command('add [url]')
  .description('add')
  .action(require('./lib/add'))

program.parse(process.argv)

if (!process.argv.slice(2).length) {
  program.outputHelp()
}
