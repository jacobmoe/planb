import fs from 'fs'
import path from 'path'

import endpoints from './endpoints'
import versions from './versions'
import utils from '../utils'

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

  return {
    endpoints: endpoints(storagePath),
    versions: versions,
    createDataDir: createDataDir,
    checkForDataDir: checkForDataDir
  }

}
