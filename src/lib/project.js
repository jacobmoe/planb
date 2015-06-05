import path from 'path'

import storage from './storage'
import configFactory from './config'

const projects = storage.projects
const endpoints = storage.endpoints

function init(cb) {
  const config = configFactory(process.cwd())

  projects.checkForDataDir(process.cwd(), (err, dataDirExists) => {
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
        projects.createDataDir(function(err) {
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

function addEndpoint(url, cb) {
  projects.getRoot((err, rootPath) => {
    if (err || !rootPath) {
      cb(err || {message: 'Project root not found'})
    } else {
      const dirPath = path.join(rootPath, projects.dataDirName)

      // TODO add endpoint to config
      endpoints.create(dirPath, url, err => {
        if (err) {cb(err); return}

        cb()
      })
    }
  })
}

export default {
  init: init,
  addEndpoint: addEndpoint
}
