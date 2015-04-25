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
        storage.versions.current(endpoint, function(err, version) {
          if (err) { console.log('no versions found'); return }

          storage.versions.getData(endpoint, version, function(err, data) {
            try {
              res.json(JSON.parse(data))
            } catch (error) {
              res.status(415).send('Only JSON APIs are supported ATM');
            }
          })
        })
      });
    })

    app.set('port', process.env.PORT || 5555)

    var server = app.listen(app.get('port'), function() {
      console.log('Listening on port %d', server.address().port)
    })
  })
}
