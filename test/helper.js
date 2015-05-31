process.env.NODE_ENV = 'test'

require("babel/register")()

var fs = require('fs')
var fsExtra = require('fs-extra')
var path = require('path')

global.SRC_DIR = 'dist'
global.assert = require('chai').assert

global.assert.fileExists = function(filePath) {
  try {
    fs.statSync(filePath)
    return global.assert(true)
  } catch (error) {
    var message = 'fileExists asserted, but it does not: ' + filePath
    return global.assert(false, message)
  }
}

global.assert.fileDoesNotExist = function(filePath) {
  var message = 'fileDoesNotExist asserted, but it does: ' + filePath
  var pass

  try {
    fs.statSync(filePath)
    pass = false
  } catch (error) {
    pass = true
  }

  return global.assert(pass, message)
}

global.assert.fileHasContent = function(filePath, expected) {
  var content, pass

  try {
    content = fs.readFileSync(filePath, 'utf8')

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
  // hardcoded paths rather than using the projects module
  // it's too scary rimrafing from a variable
  var dataDirPath = path.join(process.cwd(), '.planb.d.test')
  var configPath = path.join(process.cwd(), '.planb.json.test')

  fsExtra.remove(dataDirPath, function(err) {
    if (err) console.log('error removing data directory', err)

    fsExtra.remove(configPath, function(configErr) {
      if (configErr) {
        console.log('error removing config file', configErr)
      }

      done()
    })
  })
}
