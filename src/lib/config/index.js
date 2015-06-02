import path from 'path'

import packageJson from '../../../package.json'
import utils from '../utils'
import projects from '../storage/projects'

import * as defaults from './defaults'

const name = packageJson.name
let configName = '.' + name + '.json'

if (process.env.NODE_ENV === 'test') {
  configName = configName + '.test'
}

/* get config file object */
function read(cb) {
  projects.getRoot((err, rootPath) => {
    if (err) { cb(err); return }
    if (!rootPath) { cb({message: 'No project root found'}); return }

    const configPath = path.join(rootPath, configName)
    utils.readJsonFile(configPath, cb)
  })
}

/* check if config file exists in current directory */
function checkPwd(cb) {
  const configPath = path.join(process.cwd(), configName)

  utils.fileExists(configPath, cb)
}

/*
 * Create project config file
 *
 * Nothing is returned is file created successfully,
 * or if file already exists
 */
function create(cb) {
  const configPath = path.join(process.cwd(), configName)

  checkPwd(function(err, exists) {
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

/*
 * Return an endpoint from configData
 *
 * Find
 */
function getEndpoint(port, configData) {
  const endpoints = configData.endpoints
  let endpoint

  if (port) {
    endpoints.forEach(ep => {
      if (ep.port === port) {
        endpoint = ep
        return
      }
    })
  }

  if (!endpoints || !endpoints.length) {
    return getDefaultEndpoint(configData)
  }


  if (!endpoint) {
    endpoint = getDefaultEndpoint(configData)
  }

  return endpoint
}

/*
 * Return default endpoint
 *
 * Check config data for endpoint with the default flag
 * If not set, check for the first endpoint
 * If no endpoints, return the default
*/
function getDefaultEndpoint(configData) {
  const endpoints = configData.endpoints
  let defaultEp

  if (!endpoints || !endpoints.length) {
    return defaults.endpoint
  }

  endpoints.forEach(ep => {
    if (ep.default) {
      defaultEp = ep
      return
    }
  })

  if (!defaultEp) {
    const endpoint = endpoints[0] || {}
    defaultEp = endpoint.port
  }

  if (!defaultEp) {
    defaultEp = defaults.endpoint
  }

  return defaultEp
}

function validAction(action) {
  return defaults.allowedActions.indexOf(action) > -1
}

function addEndpointForPort(endpoints, url, opts) {
  let endpointIndex

  endpoints.forEach((ep, index) => {
    if (ep.port === opts.port) {
      endpointIndex = ep
      return
    }
  })

  if (!endpointIndex) {
    endpoints.push()
  }

  return endpoints
}

function addEndpoint(url, opts, cb) {
  read((err, configData) => {
    if (err) { cb(err); return }

    const endpoints = configData.endpoints || []

    if (opts.port) {
      endpoints = addEndpointForPort(endpoints, url, opts)
    } else {

    }

    if (!validAction(action)) action = defaultAction

    if (!endpoint[action] || !Array.isArray(endpoint[action])) {
      endpoint[action] = []
    }

    endpoint[action].push(url)
  })
}

export default {
  create: create,
  checkPwd: checkPwd,
  configName: configName,
  read: read
}
