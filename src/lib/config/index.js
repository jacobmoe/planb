import path from 'path'

import packageJson from '../../../package.json'
import utils from '../utils'

import * as defaults from './defaults'

const name = packageJson.name
let configName = '.' + name + '.json'

if (process.env.NODE_ENV === 'test') {
  configName = configName + '.test'
}

export default function (projectPath) {

  /* get config file object */
  function read(cb) {
    const configPath = path.join(projectPath, configName)
    utils.readJsonFile(configPath, (err, data) => {
      if (err && err.code === 'ENOENT') {
        cb({message: 'Config file not found'})
      } else if (err) {
        cb(err)
      } else {
        cb(null, data)
      }
    })
  }

  function checkForConfigFile(cb) {
    utils.fileExists(path.join(projectPath, configName), cb)
  }

  /*
  * Create project config file
  *
  * Nothing is returned if file created successfully,
  * or if file already exists. Otherwise, an error is returned.
  */
  function create(cb) {
    const configPath = path.join(projectPath, configName)

    checkForConfigFile((err, exists) => {
      if (exists) {
        cb()
      } else if (err) {
        cb({message: "Error creating project config", data: err})
      } else {
        utils.writeJsonFile(configPath, defaults.configData, err => {
          if (err) {
            cb({message: 'Error creating project config', data: err})
          } else {
            cb()
          }
        })
      }
    })
  }

  function update(data, cb) {
    const configPath = path.join(projectPath, configName)

    utils.writeJsonFile(configPath, data, err => {
      if (err) {
        cb({message: 'Error updating project config', data: err})
      } else {
        cb()
      }
    })
  }

  function validAction(action) {
    return defaults.allowedActions.indexOf(action) > -1
  }

  function defaultEndpointIndex(endpoints) {
    let index = utils.findIndexBy(endpoints, {default: true})

    return index || 0
  }

  function newEndpoint(opts) {
    const port = opts.port || defaults.port
    const action = validAction(opts.action) ? opts.action : defaults.action

    return { port: port, [action]: [] }
  }

  function addEndpointToAction(endpoints, index, action, url) {
    if (!endpoints[index][action]) {
      endpoints[index][action] = []
    }

    if (endpoints[index][action].indexOf(url) < 0) {
      endpoints[index][action].push(url)
    }

    return endpoints
  }

  function addEndpointForPort(endpoints, url, port, opts) {
    const action = validAction(opts.action) ? opts.action : defaults.action

    let endpointIndex = utils.findIndexBy(endpoints, item => {
      return item.port == port
    })

    if (endpointIndex !== 0 && !endpointIndex) {
      endpoints.push(newEndpoint(opts))
      endpointIndex = endpoints.length - 1
    }

    return addEndpointToAction(endpoints, endpointIndex, action, url)
  }

  function addEndpointForDefault(endpoints, url, opts) {
    const action = validAction(opts.action) ? opts.action : defaults.action
    let endpointIndex

    if (!endpoints.length) {
      endpoints.push(newEndpoint(opts))
      endpointIndex = 0
    } else {
      endpointIndex = defaultEndpointIndex(endpoints)
    }

    return addEndpointToAction(endpoints, endpointIndex, action, url)
  }

  /*
  * addEndpoint
  *
  * Accepts a url and options. Adds the url to the config file
  *
  * Options: action, port
  *
  * First try to add the url to the config item that matches the
  * supplied port number. If not found, a new config item is created.
  * Once we have the config item, first try to add the url to the
  * given action. If it doesn't exist, create a new one.
  * The udpated data is then written back to the file
  */
  function addEndpoint(url, opts, cb) {
    opts = opts || {}

    read((err, configData) => {
      if (err) { cb(err); return }

      let endpoints = configData.endpoints || []
      url = utils.cleanUrl(url)

      if (opts.port) {
        endpoints = addEndpointForPort(endpoints, url, opts.port, opts)
      } else {
        endpoints = addEndpointForDefault(endpoints, url, opts)
      }

      configData.endpoints = endpoints

      update(configData, cb)
    })
  }

  function removeEndpointFromAction(endpoints, index, action, url) {
    let urls = endpoints[index][action]

    if (!urls || !urls.length) return null

    urls = urls.map(item => {
      return utils.cleanUrl(item)
    })

    const urlIndex = urls.indexOf(utils.cleanUrl(url))

    if (urlIndex < 0) return null

    urls.splice(urlIndex, 1)

    return urls
  }

  /*
  * removeEndpoint
  *
  * Accepts a url and options. Removes the url from the config file.
  *
  * Options: action, port
  *
  * Remove url from the default config item and action if options
  * not supplied. Otherwise, by port and/or action and remove.
  */
  function removeEndpoint(url, opts, cb) {
    opts = opts || {}

    read((err, configData) => {
      if (err) { cb(err); return }

      const endpoints = configData.endpoints
      const action = opts.action || defaults.action
      let epIndex

      if (!endpoints || !endpoints.length) {
        cb({message: 'No endpoints in config'})
        return
      }

      url = utils.cleanUrl(url)

      if (opts.port) {
        epIndex = utils.findIndexBy(endpoints, item => {
          return item.port == opts.port
        })
      } else {
        epIndex = defaultEndpointIndex(endpoints)
      }

      if (epIndex !== 0 && !epIndex) {
        cb({message: 'Endpoint not found in config'})
        return
      }

      const urls = removeEndpointFromAction(endpoints, epIndex, action, url)
      configData.endpoints[epIndex][action] = urls

      update(configData, cb)
    })
  }

  return {
    create: create,
    read: read,
    checkForConfigFile: checkForConfigFile,
    configName: configName,
    addEndpoint: addEndpoint,
    removeEndpoint: removeEndpoint
  }

}
