process.env.NODE_ENV = 'test'

var fs = require('fs')
var rimraf = require('rimraf')

var utils = require('../src/lib/storage/utils')

global.SRC_DIR = 'dist';
global.assert = require('chai').assert

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
  var pass;

  try {
    fs.statSync(path)
    pass = false
  } catch (error) {
    pass = true
  }

  return global.assert(pass, message)
}

global.assert.fileHasContent = function(path, expected) {
  var content;
  var pass;

  try {
    content = fs.readFileSync(path, 'utf8')

    if (content === expected) pass = true
    else pass = false

  } catch (error) {
    pass = true;
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
  rimraf(utils.dataPath, function(err) {
    if (err) console.log('error removing data directory', err)

    done()
  })
}
