import fs from 'fs'
import fsExtra from 'fs-extra'
import path from 'path'

import packageJson from '../../../package'

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

function init(cb) {
  const dataDirPath = path.join(process.cwd(), dataDirName)
  const configPath = process.cwd() + '/' + configName

  let dataDirExists

  fs.mkdir(dataDirPath, err => {
    if (err) {
      if (err.code === 'EEXIST') {
        dataDirExists = true
      } else {
        cb({message: 'Error creating data directory', data: err})
        return
      }
    }

    fs.stat(configPath, (existsError, stat) => {
      if (existsError && existsError.code === 'ENOENT') {
        // config doesn't exist already. copy default config
        fsExtra.copy(defaultConfigPath, configPath, copyErr => {
          if (copyErr) {
            cb({message: 'Error creating project config', data: copyErr})
          } else {
            cb()
          }
        })
      } else if (existsError) {
        // error checking config file existance
        cb({message: 'Error creating project config', data: existsError})
      } else {
        // config file exists
        if (dataDirExists) {
          cb({message: 'Project already initialized'})
        } else {
          // created a data directory, but not the config file
          cb()
        }
      }
    })
  })
}

export default {
  dataDirName: dataDirName,
  configName: configName,
  getRoot: getRoot,
  init: init
}
