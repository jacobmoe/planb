var express = require('express')
var app = express()
var url = require('url')

var storage = require('./storage')
var server

function registerGet(parsedEndpoint) {
  app.get(parsedEndpoint.pathname, function(req, res) {
    var endpointDirName = parsedEndpoint.host + req.url

    storage.versions.current(endpointDirName, function(err, version) {
      if (err) {
        res.status(404).send('No versions found for ' + endpointDirName);
        return
      }

      storage.versions.getData(endpointDirName, version, function(err, data) {
        try {
          res.json(JSON.parse(data))
        } catch (error) {
          res.status(415).send('Only JSON APIs are supported ATM');
        }
      })
    })
  })
}

module.exports = function(callback) {
  var PORT = callback.port || 5555;

  if (typeof callback !== 'function') callback = function() {}

  if(typeof PORT != "number"){
      console.log('port should be a valid number')
      callback({message: 'invalid port'})
      return
  }

  storage.endpoints.all(function(err, endpoints) {
    if (err || !endpoints) {
      console.log('add an endpoint first')
      callback({message: 'no endpoints'})
      return
    }

    endpoints.forEach(function(endpoint) {
      registerGet(url.parse('http://' + endpoint))
    })

    app.set('port', process.env.PORT || PORT)

    server = app.listen(app.get('port'), function() {
      console.log('Listening on port %d', server.address().port)
      callback()
    })
  })
}

module.exports.close = function() {
  if (server) server.close()
}
