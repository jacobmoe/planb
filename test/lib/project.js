import fs from 'fs-extra'
import path from 'path'
import nock from 'nock'

// variables in ES6 imports. how?
const srcPath = '../../' + SRC_DIR
const project = require(srcPath + '/lib/project')
const configFactory = require(srcPath + '/lib/config')
const storageFactory = require(srcPath + '/lib/storage')
const utils = require(srcPath + '/lib/utils')

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
    const testUrl = 'http://www.someurl.com/api/v1/stuff'

    context('project not initialized', () => {
      it('returns an error', done => {
        project.addEndpoint('', {}, err => {
          assert.isObject(err)
          done()
        })
      })
    })

    context('project is initialized', () => {
      beforeEach(project.init)
      const config = configFactory.default(process.cwd())

      it('updates config and creates directory with default options', done => {
        project.addEndpoint(testUrl, {}, err => {
          assert.notOk(err)

          config.read((err, configData) => {
            assert.notOk(err)
            assert.equal(configData.endpoints['5000'].get.length, 1)
            assert.equal(configData.endpoints['5000'].get[0], utils.cleanUrl(testUrl))

            const projectPath = path.join(process.cwd(), storageFactory.dataDirName)
            const name = utils.endpointNameFromPath(testUrl)
            const filePath = path.join(projectPath, '5000', 'get', name)

            assert.fileExists(filePath)
            done()
          })
        })
      })

      it('updates config and creates directory with supplied options', done => {
        const testUrl = 'http://www.someurl.com/api/v1/stuff'
        const opts = {port: '1234', action: 'post'}

        project.addEndpoint(testUrl, opts, err => {
          assert.notOk(err)

          config.read((err, configData) => {
            assert.notOk(err)
            assert.equal(configData.endpoints['5000'].get.length, 0)
            assert.equal(configData.endpoints[opts.port][opts.action].length, 1)
            assert.equal(configData.endpoints[opts.port][opts.action][0], utils.cleanUrl(testUrl))

            const projectPath = path.join(process.cwd(), storageFactory.dataDirName)
            const name = utils.endpointNameFromPath(testUrl)
            const filePath = path.join(projectPath, opts.port, opts.action, name)

            assert.fileExists(filePath)
            done()
          })
        })
      })
    })
  })

  describe('removeEndpoint', () => {
    beforeEach(project.init)
    const config = configFactory.default(process.cwd())

    it('updates config and removes directory with default options', done => {
      const testUrl = 'http://www.someurl.com/api/v1/stuff'

      project.addEndpoint(testUrl, {}, err => {
        assert.notOk(err)

        config.read((err, configData) => {
          assert.notOk(err)
          assert.equal(configData.endpoints['5000'].get.length, 1)

          const projectPath = path.join(process.cwd(), storageFactory.dataDirName)
          const name = utils.endpointNameFromPath(testUrl)
          const filePath = path.join(projectPath, '5000', 'get', name)

          assert.fileExists(filePath)

          project.removeEndpoint(testUrl, {}, err => {
            assert.notOk(err)

            config.read((err, configData) => {
              assert.notOk(err)
              assert.equal(configData.endpoints['5000'].get.length, 0)

              assert.fileDoesNotExist(filePath)
              done()
            })
          })
        })
      })
    })

    it('updates config and removes directory with supplied options', done => {
      const testUrl = 'http://www.someurl.com/api/v1/stuff'
      const opts = {port: '1234', action: 'post'}

      project.addEndpoint(testUrl, opts, err => {
        assert.notOk(err)

        config.read((err, configData) => {
          assert.notOk(err)
          assert.equal(configData.endpoints[opts.port][opts.action].length, 1)

          const projectPath = path.join(process.cwd(), storageFactory.dataDirName)
          const name = utils.endpointNameFromPath(testUrl)
          const filePath = path.join(projectPath, opts.port, opts.action, name)

          assert.fileExists(filePath)

          project.removeEndpoint(testUrl, opts, err => {
            assert.notOk(err)

            config.read((err, configData) => {
              assert.notOk(err)
              assert.equal(configData.endpoints[opts.port][opts.action].length, 0)

              assert.fileDoesNotExist(filePath)
              done()
            })
          })
        })
      })
    })

  })

  describe('fetchVersions', () => {
    const testUrl1 = 'http://www.test.com/api/path'
    const testUrl2 = 'http://www.test.com/api/path/2'

    beforeEach(project.init)

    it('adds a new version to each existing endpoint', done => {
      nock('http://www.test.com')
      .get('/api/path')
      .reply(200, {content: 'some content'})
      .get('/api/path/2')
      .reply(200, {content: 'some more content'})

      project.addEndpoint(testUrl1, {}, err => {
        assert.notOk(err)

        project.addEndpoint(testUrl2, {}, err => {
          assert.notOk(err)

          project.fetchVersions(err => {
            assert.notOk(err)

            const testName1 = utils.endpointNameFromPath(testUrl1)
            const testName2 = utils.endpointNameFromPath(testUrl2)
            const projectPath = path.join(process.cwd(), storageFactory.dataDirName)
            const endpointPath1 = path.join(projectPath, '5000', 'get', testName1)
            const endpointPath2 = path.join(projectPath, '5000', 'get', testName2)

            utils.readJsonFile(path.join(endpointPath1, '0'), (err, data) => {
              assert.notOk(err)
              assert.deepEqual(data, {content: "some content"})

              utils.readJsonFile(path.join(endpointPath2, '0'), (err, data) => {
                assert.notOk(err)
                assert.deepEqual(data, {content: "some more content"})

                done()
              })
            })
          })
        })
      })
    })
  })

})
