import fs from 'fs'

let dataDirName = '.planb.d'

if (process.env.NODE_ENV === 'test') {
  dataDirName = dataDirName + '.test'
}

const dataPath = process.env.HOME + '/' + dataDirName + '/'

function createDir(path, cb) {
  fs.mkdir(path, err => {
    if (!err) { cb(null); return }

    if (err.code == 'EEXIST') cb(null)
    else cb(err)
  })
}

function checkDataDir(cb) {
  createDir(dataPath, cb)
}

function endpointNameFromPath(path) {
  const name = path.replace(/^https?:\/\//, '')

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

export default {
  dataPath: dataPath,
  createDir: createDir,
  checkDataDir: checkDataDir,
  endpointNameFromPath: endpointNameFromPath,
  pathFromEndpointName: pathFromEndpointName,
  largest: largest
}
