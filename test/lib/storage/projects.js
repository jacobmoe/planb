import fs from 'fs'

// variables in ES6 imports. how?
const srcPath = '../../../' + SRC_DIR
const projects = require(srcPath + '/lib/storage/projects')(process.cwd())

describe('storage/projects', () => {
  before(cleanup)
  afterEach(cleanup)

  describe('dataDirName', () => {
    it('returns the test data directory name', done => {
      assert.equal(projects.dataDirName, '.planb.d.test')
      done()
    })
  })

  describe('createDataDir', () => {
    it('creates a data directory in current directory', done => {
      fs.readdir(process.cwd(), (err, files) => {
        assert.notOk(err)
        assert.equal(files.indexOf(projects.dataDirName), -1)

        projects.createDataDir(err => {
          assert.notOk(err)

          fs.readdir(process.cwd(), (err, files) => {
            assert.notOk(err)
            assert.isAbove(files.indexOf(projects.dataDirName), -1)
            done()
          })
        })
      })
    })
  })

  describe('checkForDataDir', () => {
    it('checks if current directory has a data dir', done => {
      projects.checkForDataDir((err, exists) => {
        assert.isNull(err)
        assert.isFalse(exists)

        projects.createDataDir(err => {
          assert.notOk(err)

          projects.checkForDataDir((err, exists) => {
            assert.isNull(err)
            assert.isTrue(exists)
            done()
          })
        })
      })
    })
  })

})
