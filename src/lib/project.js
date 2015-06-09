import path from 'path'
import request from 'request'
import async from 'async'
import mimeTypes from 'mime-types'

import storageFactory from './storage'
import configFactory, { configName } from './config'
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
  const configPath = path.join(currentPath, configName)

  utils.fileExists(configPath, (err, exists) => {
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
  if (!validOptions(opts)) {
    cb({message: 'Invalid port or action'})
    return
  }

  buildConfigStorage((config, storage) => {
    config.addEndpoint(url, opts, (err, info) => {
      if (err) { cb(err); return }

      storage.endpoints.create(info.url, info, err => {
        if (err) { cb(err); return }

        cb()
      })
    })
  }, cb)
}

function removeEndpoint(url, opts, cb) {
  buildConfigStorage((config, storage) => {
    config.removeEndpoint(url, opts, (err, info) => {
      if (err) { cb(err); return }

      storage.endpoints.remove(info.url, info, err => {
        if (err) { cb(err); return }

        cb()
      })
    })
  }, cb)
}

/*
 * Make request against all GET endpoints and create a new version
 */
function fetchVersions(callback, reqCallback, reqErrCallback) {
  const transform = configTransformer((storage, item, cb) => {
    if (item.action !== 'get') return
    let url = item.url
    const opts = { port: item.port, action: item.action }

    ensureEndpointExistance(storage, url, opts, err => {
      if (err) { callback(err); return }

      if (!url.match(/^https?:\/\/.*/)) url = `http://${url}`

      request(url, (error, response, body) => {
        if (error) { cb({url: item.url, data: error}); return }

        const versions = storage.versions(item.url, opts)
        const ext = mimeTypes.extension(response.headers['content-type'])

        if (!ext) {
          cb({url: item.url, data: {message: 'Unsupported content type'}})
          return
        }

        if (response.statusCode != 200) {
          cb({url: item.url, status: response.statusCode})
          return
        }

        if (reqCallback) reqCallback(item)

        versions.create(body, ext, cb)
      })
    })
  }, (err, res) => {
    if (err && reqErrCallback) reqErrCallback(err.url)
  })

  transform(callback)
}

function ensureEndpointExistance(storage, url, opts, cb) {
  storage.endpoints.checkEndpoint(url, opts, (err, exists) => {
    if (err) { cb(err); return }

    if (exists) {
      cb()
    } else {
      storage.endpoints.create(url, opts, cb)
    }
  })
}

/*
 * Returns an array to represent each item in storage
 *
 * Items include url, port, action, versions info array
 * and name of current version
 */
function itemize(callback) {
  const transform = configTransformer((storage, item, cb) => {
    const opts = { port: item.port, action: item.action }
    const versions = storage.versions(item.url, opts)

    versions.all((err, res) => {
      if (err) { cb(err); return }
      item.versions = res

      versions.current((err, current) => {
        if (!err && current) item.current = current

        cb(null, item)
      })

    })
  })

  transform(callback)
}

/* Remove current version from endpoint */
function rollbackVersion(url, opts, cb) {
  buildConfigStorage((config, storage) => {
    const versions = storage.versions(url, opts)

    versions.current((err, currentVersion) => {
      if (err) { cb(err); return }

      versions.remove(currentVersion, cb)
    })
  }, cb)
}

/*
 * Convenience method to get rootPath and build config
 * and storage instances
 */
function buildConfigStorage(success, fail) {
  getRoot((err, rootPath) => {
    if (err || !rootPath) {
      fail(err || { message: 'Project root not found' })
    } else {
      const config = configFactory(rootPath)
      const storage = storageFactory(rootPath)

      success(config, storage)
    }
  })
}

/*
 * Convenience method for modifying the flattened config.
 * Accepts two hooks - the first processes the flattened
 * config item. The second is called after all items are
 * processed.
 *
 * Returns a function that accepts a callback
 */
function configTransformer(itemHook, endHook) {
  return function (callback) {
    buildConfigStorage((config, storage) => {
      config.flattened((err, arr) => {
        if (err) { callback(err); return }

        const jobs = arr.reduce((collection, item) => {
          collection.push(cb => {
            itemHook(storage, item, cb)
          })

          return collection
        }, [])

        async.parallel(jobs, (err, res) => {
          if (endHook) endHook(err, res)

          callback(null, res)
        })
      })
    }, callback)
  }
}

function validOptions(opts) {
  opts = opts || {}

  if (opts.action && !utils.validAction(opts.action)) {
    return false
  }

  if (opts.port && !utils.validPort(opts.port)) {
    return false
  }

  return true
}

export default {
  init: init,
  getRoot: getRoot,
  addEndpoint: addEndpoint,
  removeEndpoint: removeEndpoint,
  fetchVersions: fetchVersions,
  itemize: itemize,
  rollbackVersion: rollbackVersion
}
