var AsciiTable = require('ascii-table')

var storage = require('./storage')

module.exports = {
  add: function(url) {
    storage.newEndpoint(url, function(err) {
      if (err) {
        console.log("error adding endpoint", err)
      }
    })
  },

  fetch: function() {

  },

  list: function() {
    var table = new AsciiTable()

    storage.all(function(endpoints) {
      endpoints.forEach(function(endpoint) {
        table.setHeading(endpoint)

        storage.versions(endpoint, function(err, versions) {
          versions.forEach(function(version) {
            table.addRow(version.name, version.modifiedAt)
          })

          console.log(table.toString())
        })
      })
    })
  }

}
