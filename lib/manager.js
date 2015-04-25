var AsciiTable = require('ascii-table')
var async = require('async')
var request = require('request')

var storage = require('./storage')

module.exports = {
  add: function(url) {
    storage.endpoints.create(url, function(err) {
      if (err) {
        console.log("error adding endpoint", err)
      }
    })
  },

  fetch: function() {
    storage.endpoints.all(function(err, endpoints) {
      if (err || !endpoints) {
        console.log("add an endpoint first")
        return
      }

      var jobs = endpoints.reduce(function(collection, endpoint) {
        collection.push(function(cb) {
          var url = 'http://' + endpoint

          request(url, function (error, response, body) {
            if (error) cb(error)
            if (response.statusCode != 200) cb({status: response.statusCode})

            console.log('updating ' + endpoint)
            storage.versions.create(endpoint, body, cb)
          })
        })

        return collection
      }, [])

      async.parallel(jobs, function(err, res) {
        if (err) console.log("error fetching", err)
      })

    })
  },

  list: function() {
    storage.endpoints.all(function(err, endpoints) {
      if (err || !endpoints) {
        console.log("add an endpoint first")
        return
      }

      endpoints.forEach(function(endpoint) {
        var table = new AsciiTable()

        table.setHeading(null, endpoint)

        storage.versions.all(endpoint, function(err, versions) {
          versions.forEach(function(version) {
            table.addRow(version.name, version.modifiedAt)
          })

          console.log(table.toString())
        })
      })
    })
  }

}
