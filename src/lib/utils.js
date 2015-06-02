import fs from 'fs'

function createDir(path, cb) {
  fs.mkdir(path, err => {
    if (!err) { cb(null); return }

    if (err.code == 'EEXIST') cb(null)
    else cb(err)
  })
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

function fileExists(path, cb) {
  fs.stat(path, err => {
    if (err && err.code === 'ENOENT') {
      cb(null, false)
    } else if (err) {
      cb(err)
    } else {
      cb(null, true)
    }
  })
}

function writeJsonFile(path, data, cb) {
  const json = JSON.stringify(data, null, 2)

  fs.writeFile(path, json, 'utf8', cb)
}

function readJsonFile(path, cb) {
  fs.readFile(path, 'utf8', (err, data) => {
    if (err) {
      cb(err)
      return
    }

    try {
      cb(null, JSON.parse(data))
    } catch (err) {
      cb({message: 'Must be a JSON file'})
    }
  })
}

export default {
  createDir: createDir,
  endpointNameFromPath: endpointNameFromPath,
  pathFromEndpointName: pathFromEndpointName,
  largest: largest,
  fileExists: fileExists,
  writeJsonFile: writeJsonFile,
  readJsonFile: readJsonFile
}
