var express = require('express')
var app = express()
var url = require('url')

var storage = require('./storage')

module.exports = function() {
  storage.endpoints.all(function(err, endpoints) {
    if (err || !endpoints) { console.log('add an endpoint first'); return }

    endpoints.forEach(function(endpoint) {
      var path = url.parse('http://' + endpoint).pathname

      app.get(path, function(req, res) {
        storage.versions.getData(endpoint, null, function(err, data) {
          res.send(data);
        })
      });
    })

    app.set('port', process.env.PORT || 5555)

    var server = app.listen(app.get('port'), function() {
      console.log('Listening on port %d', server.address().port)
    })
  })
}
