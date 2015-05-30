var fs = require('fs')
var async = require('async')

var utils = require('./utils')

function create(endpointUrl, data, cb) {
  var name = utils.endpointNameFromPath(endpointUrl)
  var fileNum;

  fs.readdir(utils.dataPath + name, function(err, files) {
    if (err) { cb(err); return }

    if (!files.length) {
      fileNum = 0;
    } else {
      fileNum = utils.largest(files) + 1
    }

    var fileName = utils.dataPath + name + '/' + fileNum

    fs.writeFile(fileName, data, function(err) {
      if (err) { cb(err); return }

      cb()
    });
  })
}

function all(endpointUrl, callback) {
  var data = []
  var name = utils.endpointNameFromPath(endpointUrl)

  fs.readdir(utils.dataPath + name, function(err, versions) {
    if (err) { callback(err); return }

    var jobs = versions.reduce(function(collection, file) {
      collection.push(function(cb) {
        var versionPath = utils.dataPath + name + '/' + file
        fs.stat(versionPath, function(err, stats) {
          if (err) { cb(err); return }

          cb(null, {name: file, modifiedAt: stats.mtime})
        })
      })

      return collection
    }, [])

    async.parallel(jobs, function(err, res) {
      callback(err, res)
    })
  })
}

function current(endpointUrl, cb) {
  var name = utils.endpointNameFromPath(endpointUrl)

  fs.readdir(utils.dataPath + name, function(err, versions) {
    if (err) { cb(err); return }

    cb(null, utils.largest(versions))
  })
}

function getData(endpointUrl, version, cb) {
  var name = utils.endpointNameFromPath(endpointUrl)

  var filePath = utils.dataPath + name + '/' + version

  fs.readFile(filePath, 'utf8', function (err, data) {
    if (err) { cb(err); return }

    cb(null, data)
  })
}

function remove(endpointUrl, version, cb) {
  var name = utils.endpointNameFromPath(endpointUrl)

  var versionPath = utils.dataPath + name + '/' + version
  fs.unlink(versionPath, function(err) {
    if (err) { cb(err); return }

    cb()
  })
}

module.exports = {
  create: create,
  all: all,
  getData: getData,
  remove: remove,
  current: current
}
