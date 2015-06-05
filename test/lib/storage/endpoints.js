import fs from 'fs'
import path from 'path'

// variables in ES6 imports. how?
const srcPath = '../../../' + SRC_DIR
const project = require(srcPath + '/lib/project')
const storageFactory = require(srcPath + '/lib/storage')
const endpointsFactory = require(srcPath + '/lib/storage/endpoints')

const storagePath = path.join(process.cwd(), storageFactory.dataDirName)
const endpoints = endpointsFactory(storagePath)

describe('storage/endpoints', () => {
  before(cleanup)
  afterEach(cleanup)

  describe('create', () => {
    beforeEach(project.init)

    it('accepts a path, a url and creats an endpoint directory', done => {
      project.getRoot((err, rootPath) => {
        assert.isNull(err)

        const dataPath = path.join(rootPath, storageFactory.dataDirName)
        const testUrl = 'http://www.someurl.com/api/v1/stuff'

        endpoints.create(testUrl, {}, err => {
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
