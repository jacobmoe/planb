import fs from 'fs'
import testConsole from 'test-console'

const stdout = testConsole.stdout

// variables in ES6 imports. how?
var srcPath = '../../../' + SRC_DIR
var projects = require(srcPath + '/lib/storage/projects')

describe('projects', function(){
  afterEach(cleanup)

  describe('dataDirName', function () {
    it('returns the test data directory name', function(done) {
      assert.equal(projects.dataDirName, '.planb.d.test')
      done()
    })
  })

  describe('configName', function () {
    it('returns the test config file name', function(done) {
      assert.equal(projects.configName, '.planb.json.test')
      done()
    })
  })

  describe('getProjectRoot', function () {
    context('project not initialized', function() {
      it('returns a null path', function(done) {
        projects.getProjectRoot(function(path) {
          console.log("==========", path)
          assert.isNull(path)
          done()
        })
      })
    })

    context('project initialized', function() {
      afterEach(cleanup)

      beforeEach(projects.init)

      it('returns the path to the project root', function (done) {
        projects.getProjectRoot(function(path) {
          assert.equal(path, process.cwd())
          done()
        })
      })
    })
  })

  describe('init', function() {
    afterEach(cleanup)

    context('project not initialized', function() {
      it('creates data dir and config in current directory', function(done) {
        fs.readdir(process.cwd(), function(err, files) {
          assert.equal(files.indexOf(projects.dataDirName), -1)
          assert.equal(files.indexOf(projects.configName), -1)

          projects.init(function(err) {
            fs.readdir(process.cwd(), function(err, files) {
              assert.notEqual(files.indexOf(projects.dataDirName), -1)
              assert.notEqual(files.indexOf(projects.configName), -1)

              done()
            })
          })
        })
      })

      it('add default config content', function(done) {

      })

    })

    context('project initialized', function() {
      it('returns a warning', function(done) {

      })
    })
  })


})
