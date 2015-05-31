process.env.NODE_ENV = 'test'

require("babel/register")()

var fs = require('fs')
var rimraf = require('rimraf')

global.SRC_DIR = 'dist'
global.assert = require('chai').assert

var srcPath = '../' + SRC_DIR
var projects = require(srcPath + '/lib/storage/projects')

global.assert.fileExists = function(path) {
  try {
    fs.statSync(path)
    return global.assert(true)
  } catch (error) {
    var message = 'fileExists asserted, but it does not: ' + path
    return global.assert(false, message)
  }
}

global.assert.fileDoesNotExist = function(path) {
  var message = 'fileDoesNotExist asserted, but it does: ' + path
  var pass

  try {
    fs.statSync(path)
    pass = false
  } catch (error) {
    pass = true
  }

  return global.assert(pass, message)
}

global.assert.fileHasContent = function(path, expected) {
  var content, pass

  try {
    content = fs.readFileSync(path, 'utf8')

    if (content === expected) pass = true
    else pass = false

  } catch (error) {
    pass = true
    global.assert(false, "expected file to have content but file does't exist")
  }

  var message =  [
    'expected file contents',
    content,
    'to equal',
    expected
  ].join(' ')

  global.assert(pass, message)
}

global.cleanup = function (done) {
  if (!projects.dataDirName || !projects.configName) {
    console.log('error cleaning up')
    done()
    return
  }

  projects.getProjectRoot(function(rootPath) {
    if (rootPath) {
      var dataDirPath = rootPath + '/' + projects.dataDirName
      var configPath = rootPath + '/' + projects.configName

      rimraf(dataDirPath, function(err) {
        if (err) console.log('error removing data directory', err)

        rimraf(configPath, function(configErr) {
          if (configErr) {
            console.log('error removing config file', configErr)
          }

          done()
        })
      })
    } else {
      done()
    }
  })
}
