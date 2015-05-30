import fs from 'fs'
import async from 'async'

import utils from './utils'

export function create(endpointUrl, data, cb) {
  var name = utils.endpointNameFromPath(endpointUrl)
  var fileNum

  fs.readdir(utils.dataPath + name, (err, files) => {
    if (err) { cb(err); return }

    if (!files.length) {
      fileNum = 0
    } else {
      fileNum = utils.largest(files) + 1
    }

    var fileName = utils.dataPath + name + '/' + fileNum

    fs.writeFile(fileName, data, writeErr => {
      if (writeErr) { cb(writeErr); return }

      cb()
    })
  })
}

export function all(endpointUrl, callback) {
  var name = utils.endpointNameFromPath(endpointUrl)

  fs.readdir(utils.dataPath + name, (err, versions) => {
    if (err) { callback(err); return }

    var jobs = versions.reduce((collection, file) => {
      collection.push(cb => {
        var versionPath = utils.dataPath + name + '/' + file
        fs.stat(versionPath, (statErr, stats) => {
          if (statErr) { cb(statErr); return }

          cb(null, {name: file, modifiedAt: stats.mtime})
        })
      })

      return collection
    }, [])

    async.parallel(jobs, (allErr, res) => {
      callback(allErr, res)
    })
  })
}

export function current(endpointUrl, cb) {
  var name = utils.endpointNameFromPath(endpointUrl)

  fs.readdir(utils.dataPath + name, (err, versions) => {
    if (err) { cb(err); return }

    cb(null, utils.largest(versions))
  })
}

export function getData(endpointUrl, version, cb) {
  var name = utils.endpointNameFromPath(endpointUrl)

  var filePath = utils.dataPath + name + '/' + version

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) { cb(err); return }

    cb(null, data)
  })
}

export function remove(endpointUrl, version, cb) {
  var name = utils.endpointNameFromPath(endpointUrl)

  var versionPath = utils.dataPath + name + '/' + version
  fs.unlink(versionPath, err => {
    if (err) { cb(err); return }

    cb()
  })
}
