import fs from 'fs'
import path from 'path'

import packageJson from '../../../package'
import utils from '../utils'

const name = packageJson.name

let dataDirName = '.' + name + '.d'

if (process.env.NODE_ENV === 'test') {
  dataDirName = dataDirName + '.test'
}

function getRoot(cb, dots) {
  dots = dots || '.'

  const currentPath = path.join(process.cwd(), dots)
  const projectPath = currentPath + '/' + dataDirName

  fs.stat(projectPath, (err, stat) => {
    if (err && err.code === 'ENOENT') {
      if (currentPath === '/') {
        cb({message: 'Project not initialized'})
      } else {
        if (dots === '.') {
          dots = '..'
        } else {
          dots = dots + '/..'
        }

        getRoot(cb, dots)
      }
    } else if (err) {
      cb({message: 'Error getting root', data: err})
    } else {
      cb(null, currentPath)
    }
  })
}

function checkPwdDataDir(cb) {
  const dataDirPath = path.join(process.cwd(), dataDirName)

  utils.fileExists(dataDirPath, cb)
}

/*
 * Create project data directory
 *
 * Nothing is returned is directory created successfully,
 * or if directory already exists
*/
function createDataDir(cb) {
  const dataDirPath = path.join(process.cwd(), dataDirName)

  fs.mkdir(dataDirPath, err => {
    if (err && err.code !== 'EXIST') {
      cb({message: 'Error creating data directory', data: err})
    } else {
      cb()
    }
  })
}

export default {
  dataDirName: dataDirName,
  getRoot: getRoot,
  checkPwdDataDir: checkPwdDataDir,
  createDataDir: createDataDir
}
