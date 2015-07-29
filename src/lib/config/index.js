import path from 'path'

import utils from '../utils'
import * as defaults from '../defaults'

export const defaultConfigData = {
  'endpoints': {
    [defaults.port]: {
      [defaults.action]: [],
      'default': true
    }
  }
}

export const configName = utils.getProjectFileName('json')

export default function (projectPath) {

  /* get config file object */
  function read (cb) {
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

  function checkForConfigFile (cb) {
    utils.fileExists(path.join(projectPath, configName), cb)
  }

  /*
  * Create project config file
  *
  * Nothing is returned if file created successfully,
  * or if file already exists. Otherwise, an error is returned.
  */
  function create (cb) {
    const configPath = path.join(projectPath, configName)

    checkForConfigFile((err, exists) => {
      if (exists) {
        cb()
      } else if (err) {
        cb({message: 'Error creating project config', data: err})
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

  function update (data, cb) {
    const configPath = path.join(projectPath, configName)

    utils.writeJsonFile(configPath, data, err => {
      if (err) {
        cb({message: 'Error updating project config', data: err})
      } else {
        cb(null, data)
      }
    })
  }

  function defaultEndpointPort (endpoints) {
    let port = utils.findKeyBy(endpoints, {default: true})

    if (!port && endpoints[defaults.port]) {
      port = defaults.port
    }

    return port
  }

  function newEndpoint (opts) {
    const action = utils.validAction(opts.action) ? opts.action : defaults.action

    return { [action]: [] }
  }

  function addEndpointToAction (endpoint, action, url) {
    url = utils.cleanUrl(url)

    if (!endpoint[action]) {
      endpoint[action] = []
    }

    const urls = endpoint[action].map(item => {
      return utils.cleanUrl(item)
    })

    if (urls.indexOf(url) < 0) {
      endpoint[action].push(url)
    }

    return endpoint
  }

  function addEndpointForPort (endpoints, url, port, opts) {
    const action = utils.validAction(opts.action) ? opts.action : defaults.action

    if (!endpoints[port]) {
      endpoints[port] = newEndpoint(opts)
    }

    addEndpointToAction(endpoints[port], action, url)

    return {port: port, action: action, url: url}
  }

  function addEndpointForDefault (endpoints, url, opts) {
    const action = utils.validAction(opts.action) ? opts.action : defaults.action
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

    addEndpointToAction(endpoints[port], action, url)

    return {port: port, action: action, url: url}
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
  * The updated data is then written back to the file
  *
  * Returns an info object describing new endpoint
  * Includes port, action and url
  */
  function addEndpoint (url, opts, cb) {
    opts = opts || {}

    read((err, configData) => {
      if (err) { cb(err); return }

      let endpoints = configData.endpoints || []
      let info
      url = utils.cleanUrl(url)

      if (opts.port) {
        info = addEndpointForPort(endpoints, url, opts.port, opts)
      } else {
        info = addEndpointForDefault(endpoints, url, opts)
      }

      update(configData, err => {
        if (err) { cb(err); return }

        cb(null, info)
      })
    })
  }

  function removeEndpointFromAction (endpoint, action, url) {
    let urls = endpoint[action]

    if (!urls || !urls.length) return null

    urls = urls.map(item => {
      return utils.cleanUrl(item)
    })

    const urlIndex = urls.indexOf(utils.cleanUrl(url))

    if (urlIndex < 0) return urls

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
  function removeEndpoint (url, opts, cb) {
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

      update(configData, err => {
        if (err) { cb(err); return }

        cb(null, {port: port, action: action, url: url})
      })
    })
  }

  function getDefaultPort (cb) {
    read((err, configData) => {
      if (err) { cb(err); return }

      const endpoints = configData.endpoints || []

      cb(null, defaultEndpointPort(endpoints))
    })
  }

  function setDefaultPort (port, cb) {
    if (!utils.validPort(port)) {
      cb({message: 'Not a valid port'})
      return
    }

    read((err, configData) => {
      if (err) { cb(err); return }

      const endpoints = configData.endpoints || []
      let current = defaultEndpointPort(endpoints)

      if (current && endpoints[current]) {
        delete endpoints[current].default
      }

      if (!endpoints[port]) {
        endpoints[port] = newEndpoint({port: port})
      }

      endpoints[port].default = true

      update(configData, cb)
    })
  }

  /*
   * Returns a convenient array of config items that include
   * url, port and action
   */
  function flattened (cb) {
    let result = []

    getPorts((err, ports, configData) => {
      if (err) { cb(err); return }

      const endpoints = configData.endpoints || []

      ports.forEach(port => {
        if (!utils.validPort(port)) return

        Object.keys(endpoints[port]).forEach(action => {
          if (!utils.validAction(action)) return
          const urls = endpoints[port][action] || []

          urls.forEach(url => {
            result.push({
              url: url,
              port: port,
              action: action
            })
          })
        })
      })

      cb(null, result)
    })
  }

  function getPorts (cb) {
    read((err, configData) => {
      if (err) {
        cb({message: 'JSON config is invalid.'})
        return
      }

      const endpoints = configData.endpoints || []

      cb(null, Object.keys(endpoints), configData)
    })
  }

  /*
   * Sets a base URL for a port (or default)
   */
  function setBase (port, base, cb) {
    read((err, configData) => {
      if (err) { cb(err); return }

      const endpoints = configData.endpoints || {}

      if (!utils.validPort(port)) {
        port = defaultEndpointPort(endpoints)
      }

      if (!endpoints[port]) endpoints[port] = {}

      endpoints[port].base = base

      update(configData, cb)
    })
  }

  /*
   * Gets a base URL for a port (or default)
   */
  function getBase (port, cb) {
    read((err, configData) => {
      if (err) { cb(err); return }

      const endpoints = configData.endpoints || {}

      if (!utils.validPort(port)) {
        port = defaultEndpointPort(endpoints)
      }

      if (!endpoints[port]) cb({message: 'port not found'})

      cb(null, endpoints[port].base)
    })
  }

  /*
   * Returns a list of bases with their ports
   */
  function listBases (cb) {
    read((err, configData) => {
      if (err) { cb(err); return }

      const endpoints = configData.endpoints || {}

      cb(null, Object.keys(endpoints).map(function (port) {
        return {port: port, base: endpoints[port].base}
      }))
    })
  }

  return {
    create: create,
    read: read,
    checkForConfigFile: checkForConfigFile,
    configName: configName,
    addEndpoint: addEndpoint,
    removeEndpoint: removeEndpoint,
    getDefaultPort: getDefaultPort,
    setDefaultPort: setDefaultPort,
    flattened: flattened,
    setBase: setBase,
    getBase: getBase,
    listBases: listBases,
    getPorts: getPorts
  }

}
