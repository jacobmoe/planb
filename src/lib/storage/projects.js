import fs from 'fs'
import path from 'path'

import packageJson from '../../../package'

const name = packageJson.name

let configName = '.' + name + '.json'
let dataDirName = '.' + name + '.d'

if (process.env.NODE_ENV === 'test') {
  configName = configName + '.test'
  dataDirName = dataDirName + '.test'
}

const defaultConfigPath = path.join(
  __dirname,
  '../../../assets/json/defaultConfig.json'
)

function getProjectRoot(cb, dots) {
  dots = dots || '.'

  var currentPath = path.join(process.cwd(), dots)
  var projectPath = currentPath + '/' + dataDirName

  fs.stat(projectPath, (err, stat) => {
    if (err) {
      if (currentPath === '/') {
        cb(null)
      } else {
        if (dots === '.') {
          dots = '..'
        } else {
          dots = dots + '/..'
        }

        getProjectRoot(cb, dots)
      }
    } else {
      cb(currentPath)
    }
  })
}

function init(cb) {
  fs.mkdir(process.cwd() + '/' + dataDirName, err => {
    if (err) { cb(err); return }

    const configPath = process.cwd() + '/' + configName

    fs.createReadStream(defaultConfigPath)
      .pipe(fs.createWriteStream(configPath))
      .on('error', streamError => {
        cb(streamError)
      })
      .on('end', () => {
        cb()
      })
  })
}

export default {
  dataDirName: dataDirName,
  configName: configName,
  getProjectRoot: getProjectRoot,
  init: init
}
