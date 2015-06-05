import path from 'path'

import storageFactory, { dataDirName } from './storage'
import configFactory from './config'
import utils from './utils'

function init(cb) {
  const storage = storageFactory(process.cwd())

  const config = configFactory(process.cwd())

  storage.checkForDataDir((err, dataDirExists) => {
    if (err) {
      cb({message: 'Error initializing project', data: err})
      return
    }

    config.checkForConfigFile((err, configExists) => {
      if (err) {
        cb({message: 'Error initializing project', data: err})
        return
      }

      if (dataDirExists && configExists) {
        cb({message: 'Project already initialized'})
      } else {
        storage.createDataDir(function(err) {
          if (err) {cb(err); return}

          config.create(function(err) {
            if (err) {cb(err); return}

            cb()
          })
        })
      }
    })
  })
}

function getRoot(cb, dots) {
  dots = dots || '.'

  const currentPath = path.join(process.cwd(), dots)
  const projectPath = currentPath + '/' + dataDirName

  utils.fileExists(projectPath, (err, exists) => {
    if (err) {
      cb({message: 'Error getting root', data: err})
    } else if (exists) {
      cb(null, currentPath)
    } else {
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
    }
  })
}

function addEndpoint(url, cb) {
  getRoot((err, rootPath) => {
    const storage = storageFactory(rootPath)
    const endpoints = storage.endpoints

    if (err || !rootPath) {
      cb(err || {message: 'Project root not found'})
    } else {

      // TODO add endpoint to config
      endpoints.create(url, err => {
        if (err) {cb(err); return}

        cb()
      })
    }
  })
}

export default {
  init: init,
  addEndpoint: addEndpoint,
  getRoot: getRoot
}
