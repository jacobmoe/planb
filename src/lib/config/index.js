import fs from 'fs-extra'
import path from 'path'
import packageJson from '../../../package.json'
import utils from '../utils'

const name = packageJson.name
let configName = '.' + name + '.json'

const defaultPort = 5000
const defaultAction = "get"
const actions = ["get", "post", "put", "delete"]

const defaultEndpoint = {
  "port": defaultPort,
  [defaultAction]: [],
  "default": true
}

if (process.env.NODE_ENV === 'test') {
  configName = configName + '.test'
}

const defaultConfigPath = path.join(
  __dirname,
  '../../../assets/json/defaultConfig.json'
)

function checkPwd(cb) {
  const configPath = process.cwd() + '/' + configName

  utils.fileExists(configPath, cb)
}

/*
 * Create project config file
 *
 * Nothing is returned is file created successfully,
 * or if file already exists
*/
function create(cb) {
  const configPath = process.cwd() + '/' + configName

  checkPwd(function(err, exists) {
    if (exists) {
      cb()
    } else if (err) {
      cb({message: "Error creating project config", data: err})
    } else {
      fs.copy(defaultConfigPath, configPath, err => {
        if (err) {
          cb({message: 'Error creating project config', data: err})
        } else {
          cb()
        }
      })
    }
  })
}

function getEndpoint(port) {
  const endpoints = packageJson.endpoints
  let endpoint

  if (!endpoints || !endpoints.length) {
    return getDefaultEndpoint()
  }

  if (port) {
    endpoints.forEach(ep => {
      if (ep.port === port) {
        endpoint = ep
        return
      }
    })
  }

  if (!endpoint) {
    endpoint = getDefaultEndpoint()
  }

  return endpoint
}

/*
 * Return default endpoint
 *
 * Check config file for endpoint with the default flag
 * If not set, check for the first endpoint
 * If no endpoints, return the default
*/
function getDefaultEndpoint() {
  const endpoints = packageJson.endpoints
  let defaultEp

  if (!endpoints || !endpoints.length) {
    return defaultEndpoint
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
    defaultEp = defaultEndpoint
  }

  return defaultEp
}

function validAction(action) {
  return actions.indexOf(action) > -1
}

function addEndpoint(url, opts, cb) {
  const endpoint = getEndpoint(opts.port)
  let action = opts.action || defaultAction

  if (!validAction(action)) action = defaultAction

  if (!endpoint[action] || !Array.isArray(endpoint[action])) {
    endpoint[action] = []
  }

  endpoint[action].push(url)
}

export default {
  create: create,
  checkPwd: checkPwd,
  configName: configName
}
