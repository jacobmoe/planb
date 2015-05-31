#!/usr/bin/env node

import program from 'commander'
import manager from './lib/manager'
import server from './lib/server'

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
  .description("Remove the endpoint and all its versions")
  .action(manager.remove)

program
  .command('serve')
  .description('Serve local versions')
  .action(server)

program.parse(process.argv)

if (!process.argv.slice(2).length) {
  program.outputHelp()
}
