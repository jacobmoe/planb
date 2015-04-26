var express = require('express')
var app = express()
var url = require('url')

var storage = require('./storage')
var server

module.exports = function(callback) {
  if (typeof callback !== 'function') callback = function() {}

  storage.endpoints.all(function(err, endpoints) {
    if (err || !endpoints) {
      console.log('add an endpoint first')
      callback({message: 'no endpoints'})
      return
    }

    endpoints.forEach(function(endpoint) {
      var parsedEndpoint = url.parse('http://' + endpoint)

      app.get(parsedEndpoint.pathname, function(req, res) {
        var endpointDirName = parsedEndpoint.host + req.url

        storage.versions.current(endpointDirName, function(err, version) {
          if (err) { console.log('no versions found'); return }

          storage.versions.getData(endpointDirName, version, function(err, data) {
            try {
              res.json(JSON.parse(data))
            } catch (error) {
              res.status(415).send('Only JSON APIs are supported ATM');
            }
          })
        })
      })
    })

    app.set('port', process.env.PORT || 5555)

    server = app.listen(app.get('port'), function() {
      console.log('Listening on port %d', server.address().port)
      callback()
    })
  })
}

module.exports.close = function() {
  if (server) server.close()
}
