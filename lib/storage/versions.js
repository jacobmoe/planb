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

function getData(endpointUrl, versionNum, cb) {
  // TODO: should accept versionNum to fetch data from a
  // particular version, not just the largest

  var name = utils.endpointNameFromPath(endpointUrl)

  fs.readdir(utils.dataPath + name, function(err, versions) {
    if (err) { cb(err); return }

    var current = utils.largest(versions)
    var filePath = utils.dataPath + name + '/' + current

    fs.readFile(filePath, 'utf8', function (err, data) {
      if (err) { cb(err); return }

      cb(null, JSON.parse(data))
    })
  })
}

module.exports = {
  create: create,
  all: all,
  getData: getData
}
