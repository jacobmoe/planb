import fs from 'fs'
import utils from '../utils'

export default function (storagePath) {

  function checkForDataDir(cb) {
    utils.fileExists(storagePath, cb)
  }

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

  return {
    checkForDataDir: checkForDataDir,
    createDataDir: createDataDir
  }

}
