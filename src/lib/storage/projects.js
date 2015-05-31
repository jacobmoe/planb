import fs from 'fs'
import fsExtra from 'fs-extra'
import path from 'path'

import packageJson from '../../../package'
import utils from './utils'

const name = packageJson.name

let configName = '.' + name + '.json'
let dataDirName = '.' + name + '.d'

if (process.env.NODE_ENV === 'test') {
  configName = configName + '.test'
  dataDirName = dataDirName + '.test'
}

const defaultConfigPath = path.join(
  __dirname,
  '../../../assets/json/defaultConfig.json'
)

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

function checkPwdConfig(cb) {
  const configPath = process.cwd() + '/' + configName

  utils.fileExists(configPath, cb)
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

/*
 * Create project config file
 *
 * Nothing is returned is file created successfully,
 * or if file already exists
*/
function createConfig(cb) {
  const configPath = process.cwd() + '/' + configName

  checkPwdConfig(function(err, exists) {
    if (exists) {
      cb()
    } else if (err) {
      cb({message: "Error creating project config", data: err})
    } else {
      fsExtra.copy(defaultConfigPath, configPath, err => {
        if (err) {
          cb({message: 'Error creating project config', data: err})
        } else {
          cb()
        }
      })
    }
  })
}

export default {
  dataDirName: dataDirName,
  configName: configName,
  getRoot: getRoot,
  checkPwdDataDir: checkPwdDataDir,
  checkPwdConfig: checkPwdConfig,
  createDataDir: createDataDir,
  createConfig: createConfig
}
