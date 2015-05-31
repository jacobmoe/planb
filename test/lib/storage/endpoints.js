import fs from 'fs'
import path from 'path'

// variables in ES6 imports. how?
const srcPath = '../../../' + SRC_DIR
const controller = require(srcPath + '/lib/project')
const projects = require(srcPath + '/lib/storage/projects')
const endpoints = require(srcPath + '/lib/storage/endpoints')

describe('storage/endpoints', () => {
  before(cleanup)
  afterEach(cleanup)

  describe('create', () => {
    beforeEach(controller.init)

    it('accepts a path, a url and creats an endpoint directory', done => {
      projects.getRoot((err, rootPath) => {
        assert.isNull(err)

        const dataPath = path.join(rootPath, projects.dataDirName)
        const testUrl = 'http://www.someurl.com/api/v1/stuff'
        endpoints.create(dataPath, testUrl, err => {
          assert.notOk(err)

          fs.readdir(dataPath, (err, files) => {
            assert.notOk(err)
            assert.equal(files[0], 'www.someurl.com:api:v1:stuff')
            done()
          })
        })
      })
    })
  })
})
