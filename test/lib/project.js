import fs from 'fs-extra'
import path from 'path'

// variables in ES6 imports. how?
const srcPath = '../../' + SRC_DIR
const project = require(srcPath + '/lib/project')
const configFactory = require(srcPath + '/lib/config')
const storageFactory = require(srcPath + '/lib/storage')

const dataDirName = storageFactory.dataDirName

describe('controller: project', () => {
  before(cleanup)
  afterEach(cleanup)

  describe('init', () => {
    const config = configFactory.default(process.cwd())

    context('project not initialized', () => {
      it('creates data dir and config in current directory', done => {
        fs.readdir(process.cwd(), (err, files) => {
          assert.notOk(err)
          assert.equal(files.indexOf(dataDirName), -1)
          assert.equal(files.indexOf(config.configName), -1)

          project.init(initErr => {
            fs.readdir(process.cwd(), (err, files) => {
              assert.notOk(initErr)
              assert.notOk(err)
              assert.notEqual(files.indexOf(dataDirName), -1)
              assert.notEqual(files.indexOf(config.configName), -1)

              done()
            })
          })
        })
      })

      it('adds default config content', done => {
        const expected = {
          "endpoints": {
            "5000": {
              "get": [],
              "default": true
            }
          }
        }

        project.init(initErr => {
          fs.readFile(config.configName, 'utf8', (err, data) => {
            assert.notOk(err)

            assert.deepEqual(JSON.parse(data), expected)
            done()
          })
        })
      })
    })

    context('project initialized', () => {
      beforeEach(project.init)

      it('returns a warning', done => {
        project.init(initErr => {
          assert.equal(initErr.message, 'Project already initialized')
          done()
        })
      })
    })
  })

  describe('getRoot', () => {
    context('project not initialized', () => {
      it('returns a null path', done => {
        project.getRoot((err, path) => {
          assert.equal(err.message, 'Project not initialized')
          assert.notOk(path)
          done()
        })
      })
    })

    context('project initialized', () => {
      beforeEach(project.init)

      it('returns the path to the project root', done => {
        project.getRoot((err, path) => {
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

        fs.remove(tempDirName, done)
      }

      beforeEach(project.init)

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

        project.getRoot((err, projectPath) => {
          assert.isNull(err)
          assert.equal(projectPath, originalDir)
          done()
        })
      })
    })
  })

  describe('addEndpoint', () => {
    beforeEach(project.init)

    it('accepts a url and creates an endpoint directory', done => {
      const testUrl = 'http://www.someurl.com/api/v1/stuff'

      project.addEndpoint(testUrl, err => {
        assert.notOk(err)

        project.getRoot((err, rootPath) => {
          assert.isNull(err)

          const filePath = path.join(
            rootPath,
            dataDirName,
            'www.someurl.com:api:v1:stuff'
          )

          assert.fileExists(filePath)
          done()
        })
      })
    })

  })


})
