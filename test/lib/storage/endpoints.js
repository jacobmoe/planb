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

    it('accepts a url, options and creates an endpoint directory', done => {
      const testUrl = 'http://www.someurl.com/api/v1/stuff'
      const opts = {port: '1234', action: 'get'}

      endpoints.create(testUrl, opts, err => {
        assert.notOk(err)

        fs.readdir(path.join(storagePath, opts.port, opts.action), (err, files) => {
          assert.notOk(err)
          assert.equal(files[0], 'www.someurl.com:api:v1:stuff')
          done()
        })
      })
    })
  })

  describe('remove', () => {
    beforeEach(project.init)

    it('accepts a path, a url, options and creates an endpoint directory', done => {
      const testUrl = 'http://www.someurl.com/api/v1/stuff'
      const opts = {port: '1234', action: 'get'}

      endpoints.create(testUrl, opts, err => {
        assert.notOk(err)

        fs.readdir(path.join(storagePath, opts.port, opts.action), (err, files) => {
          assert.notOk(err)
          assert.equal(files[0], 'www.someurl.com:api:v1:stuff')

          endpoints.remove(testUrl, opts, err => {
            assert.notOk(err)

            fs.readdir(path.join(storagePath, opts.port, opts.action), (err, files) => {
              assert.notOk(err)
              assert.equal(files.length, 0)
              done()
            })
          })
        })
      })
    })
  })
})
