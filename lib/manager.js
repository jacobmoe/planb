var AsciiTable = require('ascii-table')
var async = require('async')
var request = require('request')
var prompt = require('prompt')

var storage = require('./storage')

module.exports = {
  add: function(url, cb) {
    if (typeof cb !== 'function') cb = function() {}
    if (typeof url !== 'string') return

    storage.endpoints.create(url, function(err) {
      if (err) {
        console.log("error adding endpoint", err)
        cb(err)
        return
      }

      console.log('endpoint added')
      cb()
    })
  },

  fetch: function(cb) {
    if (typeof cb !== 'function') cb = function() {}

    storage.endpoints.all(function(err, endpoints) {
      if (err || !endpoints) {
        console.log("add an endpoint first")
        cb()
        return
      }

      var jobs = endpoints.reduce(function(collection, endpoint) {
        collection.push(function(cb) {
          var url = 'http://' + endpoint
          request(url, function (error, response, body) {
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

      async.parallel(jobs, function(err, res) {
        if (err)
          console.log("could not fetch data from " + err.endpoint)

        cb()
      })

    })
  },

  list: function(cb) {
    if (typeof cb !== 'function') cb = function() {}

    storage.endpoints.all(function(err, endpoints) {
      if (err || !endpoints) {
        console.log("add an endpoint first")
        cb()
        return
      }

      endpoints.forEach(function(endpoint) {
        var table = new AsciiTable()

        table.setHeading(null, endpoint)

        storage.versions.all(endpoint, function(err, versions) {
          if (!versions.length) {
            table.addRow('-', 'no versions yet. use "fetch" to add one')
          } else {
            versions.forEach(function(version) {
              table.addRow(version.name, version.modifiedAt)
            })
          }

          console.log(table.toString())
          cb()
        })
      })
    })
  },

  rollback: function(endpoint, cb) {
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

    storage.versions.current(endpoint, function(err, num) {
      if (err || !num) {
        console.log("no versions for that endpoint")
        cb(err)
        return
      }

      storage.versions.remove(endpoint, num, function(err) {
        if (err) {
          console.log('error rolling back', err)
          cb(err)
          return
        }

        cb()
      })
    })
  },

  remove: function(endpoint, cb) {
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

    var schema = {
      properties: {
        confirm: {
          message: 'Are you sure? (y/n)'
        }
      }
    }

    prompt.start();

    prompt.get(schema, function (err, result) {
      if (err) {
        console.log('invalid response')
        cb({message: 'invalid response'})
        return
      }

      if (result.confirm == 'yes' || result.confirm == 'y') {
        storage.endpoints.remove(endpoint, function(err) {
          if (err) {
            var message = 'endpoint not found'
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
