import AsciiTable from 'ascii-table'
import async from 'async'
import request from 'request'
import prompt from 'prompt'

import storage from './storage'

export default {
  add: (url, opts, cb) => {
    if (typeof cb !== 'function') cb = function() {}
    if (typeof url !== 'string') return

    storage.endpoints.create(url, err => {
      if (err) {
        console.log("error adding endpoint", err)
        cb(err)
        return
      }

      console.log('endpoint added')
      cb()
    })
  },

  fetch: (opts, callback) => {
    if (typeof callback !== 'function') callback = function() {}

    storage.endpoints.all((err, endpoints) => {
      if (err || !endpoints) {
        console.log("add an endpoint first")
        callback()
        return
      }

      const jobs = endpoints.reduce((collection, endpoint) => {
        collection.push(cb => {
          const url = `http://${endpoint}`
          request(url, (error, response, body) => {
            if (error) {
              cb({endpoint: endpoint, error: error})
              return
            }

            if (response.statusCode != 200) {
              cb({endpoint: endpoint, status: response.statusCode})
              return
            }

            console.log('updating ' + endpoint)
            storage.versions.create(endpoint, body, cb)
          })
        })

        return collection
      }, [])

      async.parallel(jobs, (err, res) => {
        if (err) {
          console.log("could not fetch data from " + err.endpoint)
        }

        callback()
      })

    })
  },

  list: (opts, cb) => {
    if (typeof cb !== 'function') cb = function() {}

    storage.endpoints.all((err, endpoints) => {
      if (err || !endpoints) {
        console.log("add an endpoint first")
        cb()
        return
      }

      endpoints.forEach(endpoint => {
        const table = new AsciiTable()

        table.setHeading(null, endpoint)

        storage.versions.all(endpoint, (versionsErr, versions) => {
          if (!versions.length) {
            table.addRow('-', 'no versions yet. use "fetch" to add one')
          } else {
            versions.forEach(version => {
              table.addRow(version.name, version.modifiedAt)
            })
          }

          console.log(table.toString())
          cb()
        })
      })
    })
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
