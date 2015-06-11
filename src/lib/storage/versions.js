import fs from 'fs'
import async from 'async'
import path from 'path'

import utils from '../utils'

export default function(endpointPath) {

  /*
   * create(data, ext, cb) / create(data, cb)
   *
   * Write data to a version file.
   *
   * Version names are a sequence of integers with an optional
   * file extension. Finds the current version number, increments by one
   * to get the name of the next version.
   */
  function create(data, ext, cb) {
    if (arguments.length < 3) {
      cb = arguments[1]
      ext = null
    }

    current((err, currentVersion) => {
      if (err) { cb(err); return }

      const currentNum = numFromFileName(currentVersion)
      const firstVersion = currentNum !== 0 && !currentNum

      const fileNum = firstVersion ? 0 : currentNum + 1
      const fileName = ext ? fileNum + '.' + ext : fileNum.toString()
      const filePath = path.join(endpointPath, fileName)

      fs.writeFile(filePath, data, err => {
        if (err) { cb(err); return }

        cb()
      })
    })
  }

  /*
   * Returns a data object for each version
   *
   * Return object: name, modifiedAt
   */
  function all(callback) {
    fs.readdir(endpointPath, (err, versions) => {
      if (err && err.code === 'ENOENT') { callback(null, []); return }
      if (err) { callback(err); return }

      const jobs = versions.reduce((collection, file) => {
        collection.push(cb => {
          const versionPath = path.join(endpointPath, file)

          fs.stat(versionPath, (statErr, stats) => {
            if (statErr) { cb(statErr); return }

            cb(null, {name: file, modifiedAt: stats.mtime})
          })
        })

        return collection
      }, [])

      async.parallel(jobs, (allErr, res) => {
        callback(allErr, res)
      })
    })
  }

  function numFromFileName(name) {
    if (typeof name !== 'string') return null

    const num = name.replace(/\..*/, '')
    return isNaN(num) ? null : parseInt(num)
  }

  function fileNameFromNum(num, cb) {
    if (typeof num === 'string') num = parseInt(num)

    fs.readdir(endpointPath, (err, versions) => {
      if (err) { cb(err); return }

      const versionNums = versions.map(version => {
        return numFromFileName(version)
      })

      const versionIndex = versionNums.indexOf(num)

      if (versionIndex === -1) {
        cb()
      } else {
        cb(null, versions[versionIndex])
      }
    })
  }

  /*
   * Returns name of most recently added version
   */
  function current(cb) {
    fs.readdir(endpointPath, (err, versions) => {
      if (err && err.code === 'ENOENT') {
        cb({message: 'Endpoint not found.'})
        return
      }

      if (err) { cb(err); return }

      const versionNums = versions.map(name => {
        return numFromFileName(name)
      })

      const largest = utils.largest(versionNums)
      const largestIndex = versionNums.indexOf(largest)

      if (largestIndex > -1) {
        cb(null, versions[largestIndex])
      } else {
        cb()
      }
    })
  }

  /*
   * Accepts a version number and returns file contents
   */
  function getData(versionNum, cb) {
    fileNameFromNum(versionNum, (err, versionName) => {
      if (err) { cb(err); return }
      if (!versionName) { cb({message: 'Version not found'}); return }

      const filePath = path.join(endpointPath, versionName)

      utils.readJsonFile(filePath, (err, data) => {
        if (err) { cb(err); return }

        cb(null, data)
      })
    })
  }

  function remove(versionFileName, cb) {
    const versionPath = path.join(endpointPath, versionFileName)

    fs.unlink(versionPath, err => {
      if (err) { cb(err); return }

      cb()
    })
  }

  return {
    create: create,
    all: all,
    current: current,
    getData: getData,
    remove: remove,
    numFromFileName: numFromFileName
  }

}
