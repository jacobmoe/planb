var fs = require('fs')

var utils = require('./utils')

function create(path, cb) {
  var name = utils.endpointNameFromPath(path)

  utils.checkDataDir(function(err) {
    if (err) { cb(err); return }

    utils.createDir(utils.dataPath + name, function(err) {
      if (err) { cb(err); return }

      cb()
    })
  })
}

function all(cb) {
  fs.readdir(utils.dataPath, function(err, files) {
    if (err) { cb(err); return }

    cb(null, files.map(function(file) {
      return utils.pathFromEndpointName(file)
    }))
  })
}

module.exports = {
  create: create,
  all: all
}
