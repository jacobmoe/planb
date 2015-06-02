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

function validAction(action) {
  return defaults.allowedActions.indexOf(action) > -1
}

function newEndpoint(opts) {
  const port = opts.port || defaults.port
  const action = validAction(opts.action) ? opts.action : defaults.action

  return { port: port, [action]: [] }
}

function addEndpointForPort(endpoints, url, port, opts) {
  const action = validAction(opts.action) ? opts.action : defaults.action
  let endpointIndex

  endpoints.forEach((ep, index) => {
    if (ep.port === port) {
      endpointIndex = index
      return
    }
  })

  if (!endpointIndex) {
    endpoints.push(newEndpoint(opts))
    endpointIndex = endpoints.length - 1
  }

  endpoints[endpointIndex][action].push(url)

  return endpoints
}

function addEndpointForDefault(endpoints, url, opts) {
  const action = validAction(opts.action) ? opts.action : defaults.action
  let endpointIndex

  endpoints.forEach((ep, index) => {
    if (ep.default) {
      endpointIndex = index
      return
    }
  })

  if (!endpointIndex && endpoints.length) {
    endpointIndex = 0
  } else {
    endpoints.push(newEndpoint(opts))
    endpointIndex = 0
  }

  endpoints[endpointIndex][action].push(url)

  return endpoints
}

function addEndpoint(url, opts, cb) {
  read((err, configData) => {
    if (err) { cb(err); return }

    const endpoints = configData.endpoints || []

    if (opts.port) {
      endpoints = addEndpointForPort(endpoints, url, opts.port, opts)
    } else {
      endpoints = addEndpointForDefault(endpoints, url, opts)
    }

  })
}

export default {
  create: create,
  checkPwd: checkPwd,
  configName: configName,
  read: read
}
