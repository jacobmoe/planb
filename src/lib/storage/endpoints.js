import fs from 'fs-extra'
import path from 'path'

import utils from '../utils.js'
import * as defaults from '../defaults'

export default function (storagePath) {

  function create(url, opts, cb) {
    opts = opts || {}
    const port = opts.port || defaults.port
    const action = opts.action || defaults.action
    const name = utils.endpointNameFromPath(url)

    const namePath = path.join(storagePath, port, action, name)
    utils.createDirs(namePath, err => {
      if (err) { cb(err); return }

      cb()
    })
  }

  function remove(endpoint, opts, cb) {
    opts = opts || {}
    const port = opts.port || defaults.port
    const action = opts.action || defaults.action
    const name = utils.endpointNameFromPath(endpoint)

    const endpointPath = path.join(storagePath, port, action, name)

    utils.fileExists(endpointPath, (err, exists) => {
      if (err) { cb(err); return }

      if (exists) {
        fs.remove(endpointPath, err => {
          if (err) { cb(err); return }

          cb()
        })
      } else {
        cb({message: 'Endpoint not found'})
      }
    })
  }

  return {
    create: create,
    remove: remove
  }

}
