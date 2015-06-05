import path from 'path'

import utils from '../utils'
import * as defaults from '../defaults'

const portMin = 1024
const portMax = 65535

export const defaultConfigData = {
  "endpoints": {
    [defaults.port]: {
      [defaults.action]: [],
      "default": true
    }
  }
}

export const configName = utils.getProjectFileName('json')

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
        utils.writeJsonFile(configPath, defaultConfigData, err => {
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

  function validPort(port) {
    const isNumber = !isNaN(port)
    const validPortRange = port > portMin && port < portMax

    return isNumber && validPortRange
  }

  function defaultEndpointPort(endpoints) {
    let port = utils.findKeyBy(endpoints, {default: true})

    if (!port && endpoints[defaults.port]) {
      port = defaults.port
    }

    return port
  }

  function newEndpoint(opts) {
    const action = validAction(opts.action) ? opts.action : defaults.action

    return { [action]: [] }
  }

  function addEndpointToAction(endpoint, action, url) {
    if (!endpoint[action]) {
      endpoint[action] = []
    }

    if (endpoint[action].indexOf(url) < 0) {
      endpoint[action].push(url)
    }

    return endpoint
  }

  function addEndpointForPort(endpoints, url, port, opts) {
    const action = validAction(opts.action) ? opts.action : defaults.action

    if (!endpoints[port]) {
      endpoints[port] = newEndpoint(opts)
    }

    return addEndpointToAction(endpoints[port], action, url)
  }

  function addEndpointForDefault(endpoints, url, opts) {
    const action = validAction(opts.action) ? opts.action : defaults.action
    let port

    if (Object.keys(endpoints).length) {
      port = defaultEndpointPort(endpoints)

      if (!port) {
        endpoints[defaults.port] = newEndpoint(opts)
        port = defaults.port
      }
    } else {
      endpoints[defaults.port] = newEndpoint(opts)
      port = defaults.port
    }

    return addEndpointToAction(endpoints[port], action, url)
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
        addEndpointForPort(endpoints, url, opts.port, opts)
      } else {
        addEndpointForDefault(endpoints, url, opts)
      }

      update(configData, cb)
    })
  }

  function removeEndpointFromAction(endpoint, action, url) {
    let urls = endpoint[action]

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
      let port = opts.port

      if (!endpoints || !Object.keys(endpoints).length) {
        cb({message: 'No endpoints in config'})
        return
      }

      url = utils.cleanUrl(url)

      if (!port) {
        port = defaultEndpointPort(endpoints)
      }

      if (!port || !endpoints[port]) {
        cb({message: 'Endpoint not found in config'})
        return
      }

      const urls = removeEndpointFromAction(endpoints[port], action, url)
      configData.endpoints[port][action] = urls

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
