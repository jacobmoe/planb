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

function findBy(arr, opts) {
  const keys = Object.keys(opts)

  function match(item) {
    let doesMatch = keys.length > 0

    keys.forEach(key => {
      if (opts[key] !== item[key]) {
        doesMatch = false
        return
      }
    })

    return doesMatch
  }

  for (let i = 0; i < arr.length; i++) {
    if (match(arr[i])) return arr[i]
  }

  return null
}

export default {
  createDir: createDir,
  endpointNameFromPath: endpointNameFromPath,
  pathFromEndpointName: pathFromEndpointName,
  largest: largest,
  fileExists: fileExists,
  writeJsonFile: writeJsonFile,
  readJsonFile: readJsonFile,
  findBy: findBy
}
