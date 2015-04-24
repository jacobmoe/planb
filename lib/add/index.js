var storage = require('../storage')

module.exports = function(url) {
  var name = url.replace(/^https?:\/\//, '')

  name = name.replace(/\//g, ':')

  storage.newEndpoint(name, function(err) {
    console.log("added endpoint ==>", err)
  })
}
