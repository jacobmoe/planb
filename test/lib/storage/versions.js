import fs from 'fs'
import path from 'path'

// variables in ES6 imports. how?
const srcPath = '../../../' + SRC_DIR
const project = require(srcPath + '/lib/project')
const storageFactory = require(srcPath + '/lib/storage')
const utils = require(srcPath + '/lib/utils')

const storage = storageFactory.default(process.cwd())

describe('storage/versions', () => {
  before(cleanup)
  afterEach(cleanup)

  describe('create', () => {
    beforeEach(project.init)

    it('creates a data file', done => {
      const testUrl = 'http://www.someurl.com/api/v1/stuff'
      const opts = {port: '1234', action: 'get'}
      const inputData = "some test data"

      storage.endpoints.create(testUrl, opts, err => {
        assert.notOk(err)

        const versions = storage.versions(testUrl, opts)
        versions.create(inputData, err => {
          assert.notOk(err)

          const name = utils.endpointNameFromPath(testUrl)
          const epPath = path.join(storage.storagePath, opts.port, opts.action, name)
          fs.readdir(epPath, (err, files) => {
            assert.notOk(err)

            assert.equal(files.length, 1)
            fs.readFile(path.join(epPath, files[0]), 'utf8', (err, data) => {
              assert.notOk(err)
              assert.equal(inputData, data)
              done()
            })
          })
        })
      })
    })

    it('increments the file number', done => {
      const testUrl = 'http://www.someurl.com/api/v1/stuff'
      const opts = {port: '1234', action: 'get'}
      const inputData = "some test data"

      storage.endpoints.create(testUrl, opts, err => {
        assert.notOk(err)

        const versions = storage.versions(testUrl, opts)
        versions.create(inputData, err => {
          assert.notOk(err)
          versions.create(inputData, err => {
            assert.notOk(err)
            versions.create(inputData, err => {
              assert.notOk(err)

              const name = utils.endpointNameFromPath(testUrl)
              const epPath = path.join(storage.storagePath, opts.port, opts.action, name)
              fs.readdir(epPath, (err, files) => {
                assert.notOk(err)

                assert.equal(files.length, 3)
                assert.deepEqual(files, ['0', '1', '2'])
                done()
              })
            })
          })
        })
      })
    })

    it('accepts an optional file extension', done => {
      const testUrl = 'http://www.someurl.com/api/v1/stuff'
      const opts = {port: '1234', action: 'get'}
      const inputData = "some test data"

      storage.endpoints.create(testUrl, opts, err => {
        assert.notOk(err)

        const versions = storage.versions(testUrl, opts)
        versions.create(inputData, 'json', err => {
          assert.notOk(err)
          versions.create(inputData, 'json', err => {
            assert.notOk(err)
            versions.create(inputData, 'html', err => {
              assert.notOk(err)

              const name = utils.endpointNameFromPath(testUrl)
              const epPath = path.join(storage.storagePath, opts.port, opts.action, name)
              fs.readdir(epPath, (err, files) => {
                assert.notOk(err)

                assert.equal(files.length, 3)
                assert.deepEqual(files, ['0.json', '1.json', '2.html'])
                done()
              })
            })
          })
        })
      })
    })
  })

  // describe('remove', () => {
  //   beforeEach(project.init)

  //   it('accepts a path, a url, options and creates an endpoint directory', done => {
  //     const testUrl = 'http://www.someurl.com/api/v1/stuff'
  //     const opts = {port: '1234', action: 'get'}

  //     endpoints.create(testUrl, opts, err => {
  //       assert.notOk(err)

  //       fs.readdir(path.join(storagePath, opts.port, opts.action), (err, files) => {
  //         assert.notOk(err)
  //         assert.equal(files[0], 'www.someurl.com:api:v1:stuff')

  //         endpoints.remove(testUrl, opts, err => {
  //           assert.notOk(err)

  //           fs.readdir(path.join(storagePath, opts.port, opts.action), (err, files) => {
  //             assert.notOk(err)
  //             assert.equal(files.length, 0)
  //             done()
  //           })
  //         })
  //       })
  //     })
  //   })
  // })
})
