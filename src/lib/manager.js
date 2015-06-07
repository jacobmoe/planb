import AsciiTable from 'ascii-table'
import prompt from 'prompt'

import storage from './storage'
import project from './project'

export default {
  init: function() {
    project.init(err => {
      if (err) {
        console.log("Error initializing project", err)
      } else {
        console.log("Project initialized")
      }
    })
  },

  add: function(url, opts) {
    project.addEndpoint(url, err => {
      if (err) {
        console.log("Error adding endpoint", err)
      } else {
        console.log('Endpoint added')
      }
    })
  },

  fetch: function(opts) {
    project.fetchVersions(err => {
      if (err) {
        console.log("Error fetching new versions", err)
      } else {
        console.log("New versions added")
      }
    }, url => {
      console.log("Updating", url)
    }, url => {
      console.log("Could not update", url)
    })
  },

  list: function(opts) {
    project.itemize((err, items) => {
      if (err) {
        console.log("Error getting list", err)
      } else {
        items.forEach(item => {
          const table = new AsciiTable()

          table.setHeading(null, endpoint)

        })
      }
    })

    // storage.endpoints.all((err, endpoints) => {
    //   if (err || !endpoints) {
    //     console.log("add an endpoint first")
    //     cb()
    //     return
    //   }

    //   endpoints.forEach(endpoint => {
    //     const table = new AsciiTable()

    //     table.setHeading(null, endpoint)

    //     storage.versions.all(endpoint, (versionsErr, versions) => {
    //       if (!versions.length) {
    //         table.addRow('-', 'no versions yet. use "fetch" to add one')
    //       } else {
    //         versions.forEach(version => {
    //           table.addRow(version.name, version.modifiedAt)
    //         })
    //       }

    //       console.log(table.toString())
    //       cb()
    //     })
    //   })
    // })
  },

  rollback: (endpoint, opts, cb) => {
    if (typeof cb !== 'function') cb = function() {}

    if (!endpoint) {
      console.log('missing endpoint. try the list command')
      cb({message: 'missing endpoint'})
      return
    }

    storage.versions.current(endpoint, (err, num) => {
      if (err || !num) {
        console.log("no versions for that endpoint")
        cb(err)
        return
      }

      storage.versions.remove(endpoint, num, removeError => {
        if (removeError) {
          console.log('error rolling back', removeError)
          cb(removeError)
          return
        }

        cb()
      })
    })
  },

  remove: (endpoint, opts, cb) => {
    if (typeof cb !== 'function') cb = function() {}

    if (typeof arguments[0] === 'function') {
      cb = arguments[0]
      endpoint = null
    }

    if (!endpoint) {
      console.log('missing endpoint. try the list command')
      cb({message: 'missing endpoint'})
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
        console.log('invalid response')
        cb({message: 'invalid response'})
        return
      }

      if (result.confirm === 'yes' || result.confirm === 'y') {
        storage.endpoints.remove(endpoint, removeError => {
          if (removeError) {
            const message = 'endpoint not found'
            console.log(message)
            cb({message: message})
            return
          }

          console.log('endpoint removed')
          cb()
        })
      }
    })
  }

}
