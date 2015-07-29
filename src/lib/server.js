import express from 'express'
import url from 'url'
import path from 'path'

import project from './project'
import utils from './utils'
import { dataDirName } from './storage'

const servers = []
let projectItems

export default function (opts) {
  project.getRoot((err, projectRoot) => {
    if (err || !projectRoot) {
      console.log('Project not initialized, probably')
    }

    project.itemize((err, projItems) => {
      if (err || !projItems) {
        console.log('Is the config file malformed?', err)
        return
      }

      if (!projItems.length && !options(opts).record) {
        console.log('Add an endpoint first')
        return
      }

      projectItems = projItems

      project.getPorts(function (err, ports) {
        if (err || !projItems) {
          console.log('Is the config file malformed?', err)
          return
        }

        registerPorts(ports, projectRoot, options(opts))
      })
    })
  })
}

function registerPorts (ports, projectRoot, opts) {
  ports = ports || []

  ports.forEach(function (port) {
    const app = express()

    app.all('*', function (req, res) {
      const itemsByPort = utils.groupBy(projectItems, 'port')
      portHandler(req, res, port, itemsByPort[port], projectRoot, opts)
    })

    app.set('port', port)

    servers.push(app.listen(port, function () {
      console.log('Listening on port', port)
    }))
  })
}

function portHandler (req, res, port, portItems, projectRoot, opts) {
  project.getBase(port, function (err, base) {
    if (err) {
      res.status(404).send('error getting base url')
      return
    }

    const action = req.method.toLowerCase()
    const items = utils.groupBy(portItems, 'action')[action]

    const item = findItemByPath(items, req.url)

    if (item) {
      respondForItem(req, res, projectRoot, base, item)
    } else {
      if (opts.record) {
        recordRequest(req, port, projectRoot, base, function (err, item) {
          if (err) {
            res.status(err.code || 404).send(err.message || 'not found')
          } else {
            respondForItem(req, res, projectRoot, base, item)
          }
        })
      } else {
        res.status(404).send('not found')
      }
    }
  })
}

function recordRequest (req, port, projectRoot, base, cb) {
  if (!base || !base.length) {
    cb({message: 'base is not set', code: 401})
    return
  }

  if (!base.match(/^https?:\/\/.*/)) base = `http://${base}`
  if (base.slice(-1) === '/') base = base.slice(0, -1)

  const parsedUrl = url.parse(req.url)
  const endpointUrl = base + parsedUrl.path

  const action = req.method.toLowerCase()
  const opts = {port: port, action: action}

  addAndFetchEndpoint(endpointUrl, opts, function (err) {
    if (err) {
      cb(err)
    } else {
      project.getCurrentVersion(endpointUrl, opts, function (err, current) {
        if (err) {
          cb({message: 'fetching error', code: 404})
        } else {
          opts.url = endpointUrl
          opts.current = current

          projectItems.push(opts)
          cb(null, opts)
        }
      })
    }
  })
}

function addAndFetchEndpoint (url, opts, cb) {
  project.addEndpoint(url, opts, function (err) {
    if (err) {
      cb({message: 'error adding endpoint', code: 404})
    } else {
      project.fetchVersion(url, opts, function (err) {
        if (err) {
          cb({message: 'fetching error', code: 404})
        } else {
          cb()
        }
      })
    }
  })
}

function respondForItem (req, res, projectRoot, base, item) {
  const parsedUrl = url.parse('http://' + utils.cleanUrl(item.url))

  const host = parsedUrl.host || base

  const vPath = versionPath(
    path.join(projectRoot, dataDirName),
    path.join(host, req.url),
    item
  )

  if (!vPath) {
    res.status(404).send('version file not found')
    return
  }

  utils.fileExists(vPath, function (err, exists) {
    if (err || !exists) {
      res.status(404).send('version file not found')
    } else {
      res.sendFile(vPath)
    }
  })
}

function findItemByPath (items, path) {
  if (!items) return null

  for (var i = 0; i < items.length; i++) {
    const parsedUrl = url.parse('http://' + utils.cleanUrl(items[i].url))

    if (parsedUrl.path === path) {
      items[i].parsedUrl = parsedUrl
      return items[i]
    }
  }

  return null
}

function versionPath (storagePath, url, item) {
  if (!item || !item.current) return null

  const epName = utils.endpointNameFromPath(url)
  const epPath = path.join(storagePath, item.port, item.action, epName)

  return path.join(epPath, item.current)
}

export function close () {
  servers.forEach(server => {
    server.close()
  })
}

function options (opts) {
  opts = opts || {}

  let result = {}
  const parent = opts.parent || {}

  if (typeof parent.record === 'boolean') {
    result.record = parent.record
  }

  return result
}
