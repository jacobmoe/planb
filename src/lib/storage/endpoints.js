var fs = require('fs')
var async = require('async')

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

function remove(endpoint, callback) {
  var name = utils.endpointNameFromPath(endpoint)

  var endpointPath = utils.dataPath + name

  fs.readdir(endpointPath, function(err, files) {
    if (err) { callback(err); return }

    var jobs = files.reduce(function(collection, file) {
      collection.push(function(cb) {

        var versionPath = endpointPath + '/' + file
        fs.unlink(versionPath, function(err) {
          if (err) { cb(err); return }

          cb()
        })
      })

      return collection
    }, [])

    async.parallel(jobs, function(err) {
      if (err) { callback(err); return }

      fs.rmdir(endpointPath, function(err) {
        if (err) { callback(err); return }

        callback()
      })
    })
  })
}

module.exports = {
  create: create,
  all: all,
  remove: remove
}
