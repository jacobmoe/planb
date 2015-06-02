import fs from 'fs'

// variables in ES6 imports. how?
const srcPath = '../../../' + SRC_DIR
const config = require(srcPath + '/lib/config')
const defaults = require(srcPath + '/lib/config/defaults')
const project = require(srcPath + '/lib/project')

describe('config/index', () => {
  before(cleanup)
  afterEach(cleanup)

  describe('configName', () => {
    it('returns the test config file name', done => {
      assert.equal(config.configName, '.planb.json.test')
      done()
    })
  })

  describe('create', () => {
    it('creates a config file in current directory', done => {
      fs.readdir(process.cwd(), (err, files) => {
        assert.notOk(err)
        assert.equal(files.indexOf(config.configName), -1)

        config.create(err => {
          assert.notOk(err)

          fs.readdir(process.cwd(), (err, files) => {
            assert.notOk(err)
            assert.isAbove(files.indexOf(config.configName), -1)
            done()
          })
        })
      })
    })
  })

  describe('checkPwd', () => {
    it('checks if current directory has a config file', done => {
      config.checkPwd((err, exists) => {
        assert.isNull(err)
        assert.isFalse(exists)

        config.create(err => {
          assert.notOk(err)

          config.checkPwd((err, exists) => {
            assert.isNull(err)
            assert.isTrue(exists)
            done()
          })
        })
      })
    })
  })

  describe('read', () => {
    context('project not initialized', () => {
      it('returns an error', done => {
        config.read((err, data) => {
          assert.isObject(err)
          assert.notOk(data)
          done()
        })
      })
    })

    context('project is initialized', () => {
      beforeEach(project.init)

      it('returns the config file data', done => {
        config.read((err, data) => {
          assert.isNull(err)
          assert.deepEqual(data, defaults.configData)
          done()
        })
      })
    })
  })
})
