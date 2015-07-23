import fs from 'fs-extra'
import path from 'path'

import utils from '../utils.js'
import * as defaults from '../defaults'

export default function (storagePath) {

  function checkEndpoint(url, opts, cb) {
    utils.fileExists(getEndpointPath(url, opts), cb)
  }

  function create(url, opts, cb) {
    utils.createDirs(getEndpointPath(url, opts), cb)
  }

  function remove(endpoint, opts, cb) {
    const endpointPath = getEndpointPath(endpoint, opts)

    utils.fileExists(endpointPath, (err, exists) => {
      if (err) { cb(err); return }

      if (exists) {
        fs.remove(endpointPath, err => {
          if (err) { cb(err); return }

          cb()
        })
      } else {
        cb()
      }
    })
  }

  function getEndpointPath(endpoint, opts) {
    opts = opts || {}
    const port = opts.port || defaults.port
    const action = opts.action || defaults.action
    const name = utils.endpointNameFromPath(endpoint, opts)
    return path.join(storagePath, port, action, name)
  }

  return {
    create: create,
    remove: remove,
    checkEndpoint: checkEndpoint
  }

}
