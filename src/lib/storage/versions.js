import fs from 'fs'
import async from 'async'
import path from 'path'

import utils from '../utils'

export default function(endpointPath) {

  function create(data, ext, cb) {
    if (arguments.length < 3) {
      cb = arguments[1]
      ext = null
    }

    let fileNum = 0

    fs.readdir(endpointPath, (err, files) => {
      if (err) { cb(err); return }

      if (files.length) {
        const fileNums = files.map(name => {
          return name.replace(/\..*/, '')
        })

        fileNum = utils.largest(fileNums) + 1
      }

      const fileName = ext ? fileNum + '.' + ext : fileNum.toString()
      const filePath = path.join(endpointPath, fileName)

      fs.writeFile(filePath, data, err => {
        if (err) { cb(err); return }

        cb()
      })
    })
  }

  function all(endpointUrl, callback) {
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

  function current(endpointUrl, cb) {
    const name = utils.endpointNameFromPath(endpointUrl)

    fs.readdir(utils.dataPath + name, (err, versions) => {
      if (err) { cb(err); return }

      cb(null, utils.largest(versions))
    })
  }

  function getData(endpointUrl, version, cb) {
    const name = utils.endpointNameFromPath(endpointUrl)

    const filePath = utils.dataPath + name + '/' + version

    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) { cb(err); return }

      cb(null, data)
    })
  }

  function remove(endpointUrl, version, cb) {
    const name = utils.endpointNameFromPath(endpointUrl)

    const versionPath = utils.dataPath + name + '/' + version
    fs.unlink(versionPath, err => {
      if (err) { cb(err); return }

      cb()
    })
  }

  return {
    create: create,
    all: all,
    current: current,
    getData: getData,
    remove: remove
  }

}
