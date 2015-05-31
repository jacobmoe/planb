import fs from 'fs'
import fsExtra from 'fs-extra'

// variables in ES6 imports. how?
const srcPath = '../../../' + SRC_DIR
const controller = require(srcPath + '/lib/project')
const projects = require(srcPath + '/lib/storage/projects')

describe('storage/projects', () => {
  before(cleanup)
  afterEach(cleanup)

  describe('dataDirName', () => {
    it('returns the test data directory name', done => {
      assert.equal(projects.dataDirName, '.planb.d.test')
      done()
    })
  })

  describe('configName', () => {
    it('returns the test config file name', done => {
      assert.equal(projects.configName, '.planb.json.test')
      done()
    })
  })

  describe('getRoot', () => {
    context('project not initialized', () => {
      it('returns a null path', done => {
        projects.getRoot((err, path) => {
          assert.equal(err.message, 'Project not initialized')
          assert.notOk(path)
          done()
        })
      })
    })

    context('project initialized', () => {
      beforeEach(controller.init)

      it('returns the path to the project root', done => {
        projects.getRoot((err, path) => {
          assert.isNull(err)
          assert.equal(path, process.cwd())
          done()
        })
      })
    })

    context('project not in current directory', () => {
      const originalDir = process.cwd()
      const tempDirName = '.planb-temp.d.test'

      function revert(done) {
        process.chdir(originalDir)

        fsExtra.remove(tempDirName, done)
      }

      beforeEach(controller.init)

      beforeEach(done => {
        fs.mkdir(tempDirName, (err) => {
          if (err) {revert(done); return}

          process.chdir(tempDirName)

          fs.mkdir(tempDirName, (err) => {
            if (err) {revert(done); return}

            process.chdir(tempDirName)
            done()
          })
        })
      })

      afterEach(revert)

      it('looks up until finding the data directory', done => {
        assert.equal(
          process.cwd(),
          originalDir + '/' + tempDirName + '/' + tempDirName
        )

        projects.getRoot((err, projectPath) => {
          assert.isNull(err)
          assert.equal(projectPath, originalDir)
          done()
        })
      })
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

  describe('createConfig', () => {
    it('creates a config file in current directory', done => {
      fs.readdir(process.cwd(), (err, files) => {
        assert.notOk(err)
        assert.equal(files.indexOf(projects.configName), -1)

        projects.createConfig(err => {
          assert.notOk(err)

          fs.readdir(process.cwd(), (err, files) => {
            assert.notOk(err)
            assert.isAbove(files.indexOf(projects.configName), -1)
            done()
          })
        })
      })
    })
  })


  describe('checkPwdDataDir', () => {
    it('checks if current directory has a data dir', done => {
      projects.checkPwdDataDir((err, exists) => {
        assert.isNull(err)
        assert.isFalse(exists)

        projects.createDataDir(err => {
          assert.notOk(err)

          projects.checkPwdDataDir((err, exists) => {
            assert.isNull(err)
            assert.isTrue(exists)
            done()
          })
        })
      })
    })
  })

  describe('checkPwdConfig', () => {
    it('checks if current directory has a config file', done => {
      projects.checkPwdConfig((err, exists) => {
        assert.isNull(err)
        assert.isFalse(exists)

        projects.createConfig(err => {
          assert.notOk(err)

          projects.checkPwdConfig((err, exists) => {
            assert.isNull(err)
            assert.isTrue(exists)
            done()
          })
        })
      })
    })
  })


})
