import AsciiTable from 'ascii-table'
import prompt from 'prompt'

import project from './project'

export default {
  init: function() {
    project.init(err => {
      if (err) {
        console.log("Error initializing project.", err.message)
      } else {
        console.log("Project initialized")
      }
    })
  },

  add: function(url, opts) {
    if (!url || !url.length) return

    project.addEndpoint(url, options(opts), err => {
      if (err) {
        console.log("Error adding endpoint.", err.message)
      } else {
        console.log('Endpoint added')
      }
    })
  },

  fetch: function() {
    project.fetchVersions(err => {
      if (err) {
        console.log("Error fetching new versions.", err.message)
      }
    }, item => {
      console.log("Updating", item.url, "for port", item.port)
    }, url => {
      console.log("Could not update", url)
    })
  },

  list: function() {
    project.itemize((err, items) => {
      if (err) {
        console.log("Error getting list.", err.message)
      } else {
        items.forEach(item => {
          if (!item) return

          const table = new AsciiTable()
          table.setHeading(null, item.port + ' | ' + item.action + ' | ' + item.url)

          if (!item.versions.length) {
            if (item.action === 'get') {
              table.addRow('-', 'No versions yet. Use "fetch" to add one')
            } else {
              const message = 'not supported by fetch. Add a version manually.'
              table.addRow('-', item.action.toUpperCase() + ' ' + message)
            }
          } else {
            item.versions.forEach(version => {
              const name = version.name.replace(/\..*/, '')
              table.addRow(name, version.modifiedAt)
            })
          }

          console.log(table.toString())
        })
      }
    })
  },

  rollback: function(endpoint, opts) {
    if (!endpoint || !endpoint.length) {
      console.log('Missing endpoint. Try the list command')
      return
    }

    project.rollbackVersion(endpoint, options(opts), err => {
      if (err) {
        console.log("Error rolling back.", err.message)
        return
      }

      console.log("Rolled back endpoint")
    })
  },

  remove: function(endpoint, opts) {
    if (!endpoint) {
      console.log('Missing endpoint. Try the list command')
      return
    }

    const schema = {
      properties: {
        confirm: {
          message: 'Are you sure? (y/n)'
        }
      }
    }

    prompt.start()

    prompt.get(schema, (err, result) => {
      if (err) {
        console.log('Invalid response')
        return
      }

      if (result.confirm === 'yes' || result.confirm === 'y') {
        project.removeEndpoint(endpoint, options(opts), err => {
          if (err) {
            console.log('Endpoint not found')
            return
          }

          console.log('Endpoint removed')
        })
      }
    })
  },

  diff: function(endpoint, v1, v2, opts) {
    if (!endpoint) {
      console.log('Missing endpoint. Try the list command')
      return
    }

    project.diff(endpoint, v1, v2, options(opts), (err, diff) => {
      if (err) {
        console.log('Problem getting diff.', err.message)
      } else {
        if (diff) {
          console.log(diff)
        } else {
          console.log('No diff')
        }
      }
    })
  }
}


function options(opts) {
  opts = opts || {}

  let result = {}
  const parent = opts.parent || {}

  if (typeof parent.action === 'string') {
    result.action = parent.action.toLowerCase()
  }

  if (typeof parent.port === 'string') {
    result.port = parent.port
  }

  return result
}
