import fs from 'fs'

// variables in ES6 imports. how?
const srcPath = '../../../' + SRC_DIR
const config = require(srcPath + '/lib/config')

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

})
