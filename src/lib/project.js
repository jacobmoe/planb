import path from 'path'
import request from 'request'
import async from 'async'

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

function addEndpoint(url, opts, cb) {
  getRoot((err, rootPath) => {
    if (err || !rootPath) {
      cb(err || { message: 'Project root not found' })
    } else {
      const config = configFactory(rootPath)
      const storage = storageFactory(rootPath)
      const endpoints = storage.endpoints

      config.addEndpoint(url, opts, (err, info) => {
        if (err) { cb(err); return }

        endpoints.create(info.url, info, err => {
          if (err) { cb(err); return }

          cb()
        })
      })
    }
  })
}

function removeEndpoint(url, opts, cb) {
  getRoot((err, rootPath) => {
    if (err || !rootPath) {
      cb(err || { message: 'Project root not found' })
    } else {
      const config = configFactory(rootPath)
      const storage = storageFactory(rootPath)
      const endpoints = storage.endpoints

      config.removeEndpoint(url, opts, (err, info) => {
        if (err) { cb(err); return }

        endpoints.remove(info.url, info, err => {
          if (err) { cb(err); return }

          cb()
        })
      })
    }
  })
}

function fetchVersions(callback, reqCallback, reqErrCallback) {
  getRoot((err, rootPath) => {
    if (err || !rootPath) {
      callback(err || { message: 'Project root not found' })
    } else {
      const config = configFactory(rootPath)
      const storage = storageFactory(rootPath)

      flattenedConfig(config, (err, arr) => {
        if (err) { callback(err); return }

        const jobs = arr.reduce((collection, item) => {
          collection.push(cb => {
            const versions = storage.versions(item.url, item.opts)
            let url = item.url

            if (!url.match(/^https?:\/\/.*/)) url = `http://${url}`

            request(url, (error, response, body) => {
              if (error) { cb({url: item.url, data: error}); return }

              if (response.statusCode != 200) {
                cb({url: item.url, status: response.statusCode})
                return
              }

              if (reqCallback) reqCallback(item.url)

              versions.create(body, cb)
            })
          })

          return collection
        }, [])

        async.parallel(jobs, (err, res) => {
          if (err && reqErrCallback) reqErrCallback(err.url)

          callback()
        })
      })
    }
  })
}

function flattenedConfig(config, cb) {
  let result = []

  config.read((err, configData) => {
    if (err) { cb(err); return }

    const endpoints = configData.endpoints || []

    Object.keys(endpoints).forEach(port => {
      if (!utils.validPort(port)) return

      Object.keys(endpoints[port]).forEach(action => {
        if (action !== 'get') return

        const urls = endpoints[port][action] || []

        urls.forEach(url => {
          result.push({
            url: url,
            opts: {port: port, action: action}
          })
        })
      })
    })

    cb(null, result)
  })
}

export default {
  init: init,
  getRoot: getRoot,
  addEndpoint: addEndpoint,
  removeEndpoint: removeEndpoint,
  fetchVersions: fetchVersions
}
