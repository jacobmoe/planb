var fs = require('fs')

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

function largest(arr) {
  return Math.max.apply(Math, arr)
}

function newEndpoint(name, cb) {
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

module.exports = {
  newEndpoint: newEndpoint,
  addVersion: addVersion
}
