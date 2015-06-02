import fs from 'fs'
import async from 'async'

import utils from '../utils'

export function create(endpointUrl, data, cb) {
  const name = utils.endpointNameFromPath(endpointUrl)
  let fileNum

  fs.readdir(utils.dataPath + name, (err, files) => {
    if (err) { cb(err); return }

    if (!files.length) {
      fileNum = 0
    } else {
      fileNum = utils.largest(files) + 1
    }

    const fileName = utils.dataPath + name + '/' + fileNum

    fs.writeFile(fileName, data, writeErr => {
      if (writeErr) { cb(writeErr); return }

      cb()
    })
  })
}

export function all(endpointUrl, callback) {
  const name = utils.endpointNameFromPath(endpointUrl)

  fs.readdir(utils.dataPath + name, (err, versions) => {
    if (err) { callback(err); return }

    const jobs = versions.reduce((collection, file) => {
      collection.push(cb => {
        const versionPath = utils.dataPath + name + '/' + file
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
  const name = utils.endpointNameFromPath(endpointUrl)

  fs.readdir(utils.dataPath + name, (err, versions) => {
    if (err) { cb(err); return }

    cb(null, utils.largest(versions))
  })
}

export function getData(endpointUrl, version, cb) {
  const name = utils.endpointNameFromPath(endpointUrl)

  const filePath = utils.dataPath + name + '/' + version

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) { cb(err); return }

    cb(null, data)
  })
}

export function remove(endpointUrl, version, cb) {
  const name = utils.endpointNameFromPath(endpointUrl)

  const versionPath = utils.dataPath + name + '/' + version
  fs.unlink(versionPath, err => {
    if (err) { cb(err); return }

    cb()
  })
}
