#!/usr/bin/env node

import program from 'commander'
import manager from './lib/manager'
import server from './lib/server'
import * as defaults from './lib/defaults'

program
  .option('-p, --port <port>', 'Set port. Default: ' + defaults.port)
  .option('-a, --action <action>', 'Set action. Default: ' + defaults.action)
  .option('-r, --record', 'Save missing endpoints when serving')

program
  .command('init')
  .description('Initialize a project in current directory')
  .action(manager.init)

program
  .command('add [url]')
  .description('Add a new endpoint')
  .action(manager.add)

program
  .command('list')
  .description('List all endpoint versions')
  .action(manager.list)

program
  .command('fetch')
  .description('Fetch and store a new version for each endpoint')
  .action(manager.fetch)

program
  .command('rollback [endpoint]')
  .description("Rollback the endpoint's current version")
  .action(manager.rollback)

program
  .command('remove [endpoint]')
  .description('Remove the endpoint and all its versions')
  .action(manager.remove)

program
  .command('diff [endpoint] [v1] [v2]')
  .description('Diff versions. With no version numbers, \n' +
               'diffs the current version with the previous')
  .action(manager.diff)

program
  .command('serve')
  .description('Serve local versions')
  .action(server)

program.parse(process.argv)

if (!process.argv.slice(2).length) {
  program.outputHelp()
}
