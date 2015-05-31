import express from 'express'
import url from 'url'
import storage from './storage'

const app = express()
let server

function registerGet(parsedEndpoint) {
  app.get(parsedEndpoint.pathname, (req, res) => {
    const endpointDirName = parsedEndpoint.host + req.url

    storage.versions.current(endpointDirName, (err, version) => {
      if (err) {
        res.status(404).send('No versions found for ' + endpointDirName)
        return
      }

      storage.versions.getData(endpointDirName, version, (getDataErr, data) => {
        try {
          res.json(JSON.parse(data))
        } catch (error) {
          res.status(415).send('Only JSON APIs are supported ATM')
        }
      })
    })
  })
}

export default function(callback) {
  if (typeof callback !== 'function') callback = function() {}

  storage.endpoints.all((err, endpoints) => {
    if (err || !endpoints) {
      console.log('add an endpoint first')
      callback({message: 'no endpoints'})
      return
    }

    endpoints.forEach(endpoint => {
      registerGet(url.parse('http://' + endpoint))
    })

    app.set('port', process.env.PORT || 5555)

    server = app.listen(app.get('port'), function() {
      console.log('Listening on port %d', server.address().port)
      callback()
    })
  })
}

export function close() {
  if (server) server.close()
}
