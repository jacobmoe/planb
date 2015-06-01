import fs from 'fs'
import path from 'path'

// variables in ES6 imports. how?
const srcPath = '../../' + SRC_DIR
const project = require(srcPath + '/lib/project')
const config = require(srcPath + '/lib/config')
const storage = require(srcPath + '/lib/storage')

describe('controller: project', () => {
  before(cleanup)
  afterEach(cleanup)

  describe('init', () => {
    context('project not initialized', () => {
      it('creates data dir and config in current directory', done => {
        fs.readdir(process.cwd(), (err, files) => {
          assert.notOk(err)
          assert.equal(files.indexOf(storage.projects.dataDirName), -1)
          assert.equal(files.indexOf(config.configName), -1)

          project.init(initErr => {
            fs.readdir(process.cwd(), (err, files) => {
              assert.notOk(initErr)
              assert.notOk(err)
              assert.notEqual(files.indexOf(storage.projects.dataDirName), -1)
              assert.notEqual(files.indexOf(config.configName), -1)

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
              "get": [],
              "default": true
            }
          ]
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

  describe('addEndpoint', () => {
    beforeEach(project.init)

    it('accepts a url and creates an endpoint directory', done => {
      const testUrl = 'http://www.someurl.com/api/v1/stuff'

      project.addEndpoint(testUrl, err => {
        assert.notOk(err)

        storage.projects.getRoot((err, rootPath) => {
          assert.isNull(err)

          const filePath = path.join(
            rootPath,
            storage.projects.dataDirName,
            'www.someurl.com:api:v1:stuff'
          )

          assert.fileExists(filePath)
          done()
        })
      })
    })

  })

})
