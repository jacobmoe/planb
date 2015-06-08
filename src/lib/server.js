import express from 'express'
import url from 'url'
import path from 'path'

import project from './project'
import utils from './utils'
import { dataDirName } from './storage'

const servers = []

function registerProjectItem(app, item, storagePath) {
  if (!item.url) return
  const parsedUrl = url.parse('http://' + utils.cleanUrl(item.url))

  app[item.action](parsedUrl.pathname, (req, res) => {
    if (!item.current) {
      res.status(404).send('No versions found for ' + item.url)
      return
    }

    res.sendFile(versionPath(storagePath, item))
  })
}

export default function() {
  project.getRoot((err, projectRoot) => {
    if (err || !projectRoot) {
      console.log('Project not initialized, probably')
    }

    project.itemize((err, items) => {
      if (err || !items || !items.length) {
        console.log('Add an endpoint first')
        return
      }

      const itemsByPort = projectItemsByPort(items)

      Object.keys(itemsByPort).forEach(port => {
        const app = express()

        itemsByPort[port].forEach(item => {
          registerProjectItem(app, item, path.join(projectRoot, dataDirName))
        })

        app.set('port', port)

        servers.push(app.listen(port, function() {
          console.log('Listening on port', port)
        }))
      })
    })
  })
}

function projectItemsByPort(items) {
  items = items || []

  return items.reduce((result, item) => {
    if (!result[item.port]) result[item.port] = []
    result[item.port].push(item)

    return result
  }, {})
}

function versionPath(storagePath, item) {
  const epName = utils.endpointNameFromPath(item.url)
  const epPath = path.join(storagePath, item.port, item.action, epName)

  return path.join(epPath, item.current)
}

export function close() {
  servers.forEach(server => {
    server.close()
  })
}
