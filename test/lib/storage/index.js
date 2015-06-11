import fs from 'fs'

// variables in ES6 imports. how?
const srcPath = '../../../' + SRC_DIR
const storageFactory = require(srcPath + '/lib/storage')

const storage = storageFactory.default(process.cwd())

describe('storage/index', () => {
  before(cleanup)
  afterEach(cleanup)

  describe('dataDirName', () => {
    it('returns the test data directory name', done => {
      assert.equal(storageFactory.dataDirName, '.planb.d.test')
      done()
    })
  })

  describe('createDataDir', () => {
    it('creates a data directory in current directory', done => {
      fs.readdir(process.cwd(), (err, files) => {
        assert.notOk(err)
        assert.equal(files.indexOf(storageFactory.dataDirName), -1)

        storage.createDataDir(err => {
          assert.notOk(err)

          fs.readdir(process.cwd(), (err, files) => {
            assert.notOk(err)
            assert.isAbove(files.indexOf(storageFactory.dataDirName), -1)
            done()
          })
        })
      })
    })
  })

  describe('checkForDataDir', () => {
    it('checks if current directory has a data dir', done => {
      storage.checkForDataDir((err, exists) => {
        assert.isNull(err)
        assert.isFalse(exists)

        storage.createDataDir(err => {
          assert.notOk(err)

          storage.checkForDataDir((err, exists) => {
            assert.isNull(err)
            assert.isTrue(exists)
            done()
          })
        })
      })
    })
  })

})
