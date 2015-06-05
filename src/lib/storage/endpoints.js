import fs from 'fs'
import path from 'path'
import async from 'async'

import utils from '../utils.js'

export default function (storagePath) {

  function create(url, cb) {
    const name = utils.endpointNameFromPath(url)

    utils.createDir(path.join(storagePath, name), err => {
      if (err) { cb(err); return }

      cb()
    })
  }

  function all(cb) {
    fs.readdir(utils.dataPath, (err, files) => {
      if (err) { cb(err); return }

      cb(null, files.map(file => {
        return utils.pathFromEndpointName(file)
      }))
    })
  }

  function remove(endpoint, callback) {
    const name = utils.endpointNameFromPath(endpoint)

    const endpointPath = utils.dataPath + name

    fs.readdir(endpointPath, (err, files) => {
      if (err) { callback(err); return }

      const jobs = files.reduce((collection, file) => {
        collection.push(function(cb) {

          const versionPath = endpointPath + '/' + file
          fs.unlink(versionPath, unlinkErr => {
            if (unlinkErr) { cb(unlinkErr); return }

            cb()
          })
        })

        return collection
      }, [])

      async.parallel(jobs, unlinkAllErr => {
        if (unlinkAllErr) { callback(unlinkAllErr); return }

        fs.rmdir(endpointPath, rmErr => {
          if (rmErr) { callback(rmErr); return }

          callback()
        })
      })
    })
  }

  return {
    create: create,
    all: all,
    remove: remove
  }

}
