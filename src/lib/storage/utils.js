var fs = require('fs')

var dataDirName = '.planb.d'

if (process.env.NODE_ENV === 'test')
  dataDirName = dataDirName + '.test'

var dataPath = process.env.HOME + '/' + dataDirName + '/'

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

function endpointNameFromPath(path) {
  var name = path.replace(/^https?:\/\//, '')

  return name.replace(/\//g, ':')
}

function pathFromEndpointName(name) {
  return name.replace(/:/g, '/')
}

function largest(arr) {
  if (arr.length) {
    return Math.max.apply(Math, arr)
  } else {
    return null
  }
}

module.exports = {
  dataPath: dataPath,
  createDir: createDir,
  checkDataDir: checkDataDir,
  endpointNameFromPath: endpointNameFromPath,
  pathFromEndpointName: pathFromEndpointName,
  largest: largest
}
