var fs = require('fs')
var async = require('async')

var dataPathName = '.planb.d'
var dataPath = process.env.HOME + '/' + dataPathName + '/'

function createDir(path, cb) {
  fs.mkdir(path, function(err) {
    if (!err) { cb(null); return }

    if (err.code == 'EEXIST') cb(null)
    else cb(err)
  })
}

function checkDataDir(cb) {
  createDir(dataPath, cb)
}

function versionNumsFromFileNames(names) {
  return names.reduce(function(nums, file) {
    if (file.match(/\.json$/)) {
      nums.push(file.replace(/\.json$/, ''))
    }

    return nums
  }, [])
}

function endpointNameFromPath(path) {
  var name = path.replace(/^https?:\/\//, '')

  return name.replace(/\//g, ':')
}

function pathFromEndpointName(name) {
  return name.replace(/:/g, '/')
}

function largest(arr) {
  return Math.max.apply(Math, arr)
}

function newEndpoint(path, cb) {
  var name = endpointNameFromPath(path)

  checkDataDir(function(err) {
    if (err) { cb(err); return }

    createDir(dataPath + name, function(err) {
      if (err) { cb(err); return }

      cb()
    })
  })
}

function addVersion(endpointName, data, cb) {
  var fileNum;

  fs.readdir(dataPath + endpointName, function(err, files) {
    if (err) { cb(err); return }

    if (!files.length) {
      fileNum = 0;
    } else {
      fileNum = largest(versionNumsFromFileNames(files)) + 1
    }

    var fileName = dataPath + endpointName + '/' + fileNum + '.json'

    fs.writeFile(fileName, data, function(err) {
      if (err) { cb(err); return }

      cb()
    });
  })
}

function all(cb) {
  fs.readdir(dataPath, function(err, files) {
    if (err) { cb(err); return }

    cb(files.map(function(file) {
      return file.replace(/:/g, '/')
    }))
  })
}

function versions(endpointUrl, callback) {
  var data = []
  var name = endpointNameFromPath(endpointUrl)

  fs.readdir(dataPath + name, function(err, versions) {
    if (err) { callback(err); return }

    var jobs = versions.reduce(function(collection, file) {
      collection.push(function(cb) {
        var versionPath = dataPath + name + '/' + file
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

module.exports = {
  newEndpoint: newEndpoint,
  addVersion: addVersion,
  all: all,
  versions: versions
}
