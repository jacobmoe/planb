import fs from 'fs'
import path from 'path'

import endpointsFactory from './endpoints'
import versionsFactory from './versions'
import utils from '../utils'
import defaults from '../defaults'

export const dataDirName = utils.getProjectFileName('d')

export default function (projectPath) {
  const storagePath = path.join(projectPath, dataDirName)

  /*
  * Create project data directory
  *
  * Nothing is returned is directory created successfully,
  * or if directory already exists
  */
  function createDataDir(cb) {
    fs.mkdir(storagePath, err => {
      if (err && err.code !== 'EXIST') {
        cb({message: 'Error creating data directory', data: err})
      } else {
        cb()
      }
    })
  }

  function checkForDataDir(cb) {
    utils.fileExists(storagePath, cb)
  }

  function versions(endpoint, opts) {
    const port = opts.port || defaults.port
    const action = opts.action || defaults.action
    const name = utils.endpointNameFromPath(endpoint)

    return versionsFactory(path.join(storagePath, port, action, name))
  }

  return {
    endpoints: endpointsFactory(storagePath),
    versions: versions,
    createDataDir: createDataDir,
    checkForDataDir: checkForDataDir,
    storagePath: storagePath
  }

}
