import fs from 'fs'
import async from 'async'

import utils from './utils'

export function create(path, cb) {
  const name = utils.endpointNameFromPath(path)

  utils.checkDataDir(err => {
    if (err) { cb(err); return }

    utils.createDir(utils.dataPath + name, createDirErr => {
      if (createDirErr) { cb(createDirErr); return }

     cb()
    })
  })
}

export function all(cb) {
  fs.readdir(utils.dataPath, (err, files) => {
    if (err) { cb(err); return }

    cb(null, files.map(file => {
      return utils.pathFromEndpointName(file)
    }))
  })
}

export function remove(endpoint, callback) {
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
