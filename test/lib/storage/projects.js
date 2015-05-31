import fs from 'fs'
import fsExtra from 'fs-extra'
import testConsole from 'test-console'

const stdout = testConsole.stdout

// variables in ES6 imports. how?
const srcPath = '../../../' + SRC_DIR
const projects = require(srcPath + '/lib/storage/projects')

describe('projects', () => {
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
      beforeEach(projects.init)

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

      beforeEach(projects.init)

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

  describe('init', () => {
    context('project not initialized', () => {
      it('creates data dir and config in current directory', done => {
        fs.readdir(process.cwd(), (err, files) => {
          assert.notOk(err)
          assert.equal(files.indexOf(projects.dataDirName), -1)
          assert.equal(files.indexOf(projects.configName), -1)

          projects.init(initErr => {
            fs.readdir(process.cwd(), (err, files) => {
              assert.notOk(initErr)
              assert.notOk(err)
              assert.notEqual(files.indexOf(projects.dataDirName), -1)
              assert.notEqual(files.indexOf(projects.configName), -1)

              done()
            })
          })
        })
      })

      it('adds default config content', done => {
        const expected = {
          "endpoints": [
            {
              "port": 5000,
              "urls": [],
              "default": true
            }
          ]
        }

        projects.init(initErr => {
          fs.readFile(projects.configName, 'utf8', (err, data) => {
            assert.notOk(err)

            assert.deepEqual(JSON.parse(data), expected)
            done()
          })
        })
      })
    })

    context('project initialized', () => {
      beforeEach(projects.init)

      it('returns a warning', done => {
        projects.init(initErr => {
          assert.equal(initErr.message, 'Project already initialized')
          done()
        })
      })
    })
  })


})
