import express from 'express'
import url from 'url'
import path from 'path'

import project from './project'
import utils from './utils'
import { dataDirName } from './storage'

const servers = []

export default function (opts) {
  project.getRoot((err, projectRoot) => {
    if (err || !projectRoot) {
      console.log('Project not initialized, probably')
    }

    project.itemize((err, projItems) => {
      if (err || !projItems || !projItems.length) {
        console.log('Add an endpoint first')
        return
      }

      const itemsByPort = utils.groupBy(projItems, 'port')

      Object.keys(itemsByPort).forEach(port => {
        const app = express()

        app.all('*', function (req, res) {
          const action = req.method.toLowerCase()
          const items = utils.groupBy(itemsByPort[port], 'action')[action]

          const item = findItemByPath(items, req.path)

          if (item) {
            respondForItem(req, res, projectRoot, item)
          } else {
            res.status(404).send('not found')
          }
        })

        app.set('port', port)

        servers.push(app.listen(port, function () {
          console.log('Listening on port', port)
        }))
      })
    })
  })
}

function respondForItem (req, res, projectRoot, item) {
  const parsedUrl = url.parse('http://' + utils.cleanUrl(item.url))

  const vPath = versionPath(
    path.join(projectRoot, dataDirName),
    path.join(parsedUrl.host, req.url),
    item
  )

  utils.fileExists(vPath, function (err, exists) {
    if (err || !exists) {
      res.status(404).send('not found')
    } else {
      res.sendFile(vPath)
    }
  })
}

function findItemByPath (items, path) {
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
  if (!item) return null

  const epName = utils.endpointNameFromPath(url)
  const epPath = path.join(storagePath, item.port, item.action, epName)

  return path.join(epPath, item.current)
}

export function close () {
  servers.forEach(server => {
    server.close()
  })
}
