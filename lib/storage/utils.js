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

module.exports = {
  dataPathName: dataPathName,
  dataPath: dataPath,
  createDir: createDir,
  checkDataDir: checkDataDir,
  versionNumsFromFileNames: versionNumsFromFileNames,
  endpointNameFromPath: endpointNameFromPath,
  pathFromEndpointName: pathFromEndpointName,
  largest: largest
}
