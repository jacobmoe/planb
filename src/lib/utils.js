import fs from 'fs-extra'

import packageJson from '../../package'

function createDirs(path, cb) {
  fs.mkdirs(path, err => {
    if (!err) { cb(null); return }

    if (err.code == 'EEXIST') cb(null)
    else cb(err)
  })
}

function cleanUrl(url) {
  url = url || ''

  return url.replace(/^https?:\/\//, '')
}

function endpointNameFromPath(path) {
  return cleanUrl(path).replace(/\//g, ':')
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
  fs.readFile(path, 'utf8', (err, json) => {
    if (err) {
      cb(err)
      return
    }

    let data

    try {
      data = JSON.parse(json)
    } catch (err) {
      cb({message: 'Must be a valid JSON file'})
      return
    }

    cb(null, data)
  })
}

function findIndexBy(arr, opts) {
  const keys = Object.keys(opts)

  function match(item) {
    if (typeof opts === 'function') {
      return opts(item)
    } else {
      let doesMatch = keys.length > 0

      keys.forEach(key => {
        if (opts[key] !== item[key]) {
          doesMatch = false
          return
        }
      })

      return doesMatch
    }
  }

  for (let i = 0; i < arr.length; i++) {
    if (match(arr[i])) return i
  }

  return null
}

function findBy(arr, opts) {
  const index = findIndexBy(arr, opts)

  if (index) {
    return arr[index]
  } else {
    return null
  }
}

/*
 * findKeyBy(obj, opts)
 *
 * Accepts an object and returns the key whose value is an object
 * matching the opts object
 *
 * Usage:
 *
 * const obj = { "5000": {get: [], default: true}, "5001": {get: []} }
 * findKeyBy(obj, {default: true}) // returns "5000"
 */
function findKeyBy(obj, opts) {
  obj = obj || {}
  opts = opts || {}
  let key = null

  const objKeys = Object.keys(obj)

  for (let i = 0; i < objKeys.length; i++) {
    const objKey = objKeys[i]
    let keyMatch = true

    if (obj[objKey] && typeof obj[objKey] === 'object') {
      const optKeys = Object.keys(opts)
      if (!optKeys.length) { keyMatch = false; break }

      for (let j = 0; j < optKeys.length; j++) {
        const optKey = optKeys[j]

        if (obj[objKey][optKey] !== opts[optKey]) {
          keyMatch = false
          break
        }
      }
    } else {
      keyMatch = false
    }

    if (keyMatch) {
      key = objKey
      break
    }
  }

  return key
}

function getProjectFileName(ext) {
  const name = packageJson.name

  let fileName = '.' + name + '.' + ext

  if (process.env.NODE_ENV === 'test') {
    fileName = fileName + '.test'
  }

  return fileName
}

export default {
  createDirs: createDirs,
  endpointNameFromPath: endpointNameFromPath,
  pathFromEndpointName: pathFromEndpointName,
  cleanUrl: cleanUrl,
  largest: largest,
  fileExists: fileExists,
  writeJsonFile: writeJsonFile,
  readJsonFile: readJsonFile,
  findIndexBy: findIndexBy,
  findKeyBy: findKeyBy,
  findBy: findBy,
  getProjectFileName: getProjectFileName
}
