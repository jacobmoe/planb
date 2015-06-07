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

  describe('current', () => {
    const inputData = "some test data"
    let versions
    let endpointPath

    beforeEach(project.init)

    beforeEach(done => {
      const testUrl = 'http://www.someurl.com/api/v1/stuff'
      const epName = utils.endpointNameFromPath(testUrl)
      const opts = {port: '1234', action: 'get'}

      endpointPath = path.join(storage.storagePath, opts.port, opts.action, epName)
      storage.endpoints.create(testUrl, opts, err => {
        assert.notOk(err)

        versions = storage.versions(testUrl, opts)
        done()
      })

    })

    context('nothing in directory', () => {
      it('returns nothing', done => {
        versions.current((err, fileName) => {
          assert.notOk(err)
          assert.notOk(fileName)

          done()
        })
      })
    })

    context('directory has contents', () => {
      beforeEach(done => {
        fs.writeFile(path.join(endpointPath, '0'), inputData, err => {
          assert.notOk(err)

          fs.writeFile(path.join(endpointPath, '1'), inputData, err => {
            assert.notOk(err)

            fs.writeFile(path.join(endpointPath, '2'), inputData, err => {
              assert.notOk(err)
              done()
            })
          })
        })
      })

      it('returns the largest version', done => {
        versions.current((err, fileName) => {
          assert.notOk(err)

          assert.equal(fileName, '2')
          done()
        })
      })
    })

    context('directory has contents with file extensions', () => {
      beforeEach(done => {
        fs.writeFile(path.join(endpointPath, '0.json'), inputData, err => {
          assert.notOk(err)

          fs.writeFile(path.join(endpointPath, '1.json'), inputData, err => {
            assert.notOk(err)

            fs.writeFile(path.join(endpointPath, '2.json'), inputData, err => {
              assert.notOk(err)
              done()
            })
          })
        })
      })

      it('returns the largest version', done => {
        versions.current((err, fileName) => {
          assert.notOk(err)

          assert.equal(fileName, '2.json')
          done()
        })
      })
    })
  })

  describe('all', () => {
    const inputData = "some test data"
    let versions
    let endpointPath

    beforeEach(project.init)

    beforeEach(done => {
      const testUrl = 'http://www.someurl.com/api/v1/stuff'
      const epName = utils.endpointNameFromPath(testUrl)
      const opts = {port: '1234', action: 'get'}

      endpointPath = path.join(storage.storagePath, opts.port, opts.action, epName)
      storage.endpoints.create(testUrl, opts, err => {
        assert.notOk(err)

        versions = storage.versions(testUrl, opts)
        done()
      })

    })

    context('nothing in directory', () => {
      it('returns empty array', done => {
        versions.all((err, data) => {
          assert.notOk(err)
          assert.isArray(data)
          assert.equal(data.length, 0)

          done()
        })
      })
    })

    context('directory has contents', () => {
      beforeEach(done => {
        fs.writeFile(path.join(endpointPath, '0.json'), inputData, err => {
          assert.notOk(err)

          fs.writeFile(path.join(endpointPath, '1.json'), inputData, err => {
            assert.notOk(err)

            fs.writeFile(path.join(endpointPath, '2.json'), inputData, err => {
              assert.notOk(err)
              done()
            })
          })
        })
      })

      it('returns data for file contents', done => {
        versions.all((err, data) => {
          assert.notOk(err)
          assert.isArray(data)
          assert.equal(data.length, 3)
          assert.equal(data[0].name, '0.json')
          assert.equal(data[1].name, '1.json')
          assert.equal(data[2].name, '2.json')

          done()
        })
      })
    })

  })

  describe('getData', () => {
    const inputData = "some test data"
    let versions
    let endpointPath

    beforeEach(project.init)

    beforeEach(done => {
      const testUrl = 'http://www.someurl.com/api/v1/stuff'
      const epName = utils.endpointNameFromPath(testUrl)
      const opts = {port: '1234', action: 'get'}

      endpointPath = path.join(storage.storagePath, opts.port, opts.action, epName)
      storage.endpoints.create(testUrl, opts, err => {
        assert.notOk(err)

        versions = storage.versions(testUrl, opts)
        done()
      })

    })

    beforeEach(done => {
      fs.writeFile(path.join(endpointPath, '0.json'), inputData + '0', err => {
        assert.notOk(err)

        fs.writeFile(path.join(endpointPath, '1.json'), inputData + '1', err => {
          assert.notOk(err)

          fs.writeFile(path.join(endpointPath, '2.json'), inputData + '2', err => {
            assert.notOk(err)
            done()
          })
        })
      })
    })

    it('accepts a version number and returns data', done => {
      versions.getData(0, (err, data) => {
        assert.notOk(err)
        assert.equal(data, inputData + '0')

        versions.getData("1", (err, data) => {
          assert.notOk(err)
          assert.equal(data, inputData + '1')

          versions.getData("2", (err, data) => {
            assert.notOk(err)
            assert.equal(data, inputData + '2')

            done()
          })
        })
      })
    })

    it('responds with error if version not found ', done => {
      versions.getData("5", (err, data) => {
        assert.isObject(err)
        assert.notOk(data)
        done()
      })
    })
  })

  describe('remove', () => {
    const inputData = "some test data"
    let versions
    let endpointPath

    beforeEach(project.init)

    beforeEach(done => {
      const testUrl = 'http://www.someurl.com/api/v1/stuff'
      const epName = utils.endpointNameFromPath(testUrl)
      const opts = {port: '1234', action: 'get'}

      endpointPath = path.join(storage.storagePath, opts.port, opts.action, epName)
      storage.endpoints.create(testUrl, opts, err => {
        assert.notOk(err)

        versions = storage.versions(testUrl, opts)
        done()
      })

    })

    beforeEach(done => {
      fs.writeFile(path.join(endpointPath, '0.json'), inputData + '0', err => {
        assert.notOk(err)

        fs.writeFile(path.join(endpointPath, '1.json'), inputData + '1', err => {
          assert.notOk(err)

          fs.writeFile(path.join(endpointPath, '2.json'), inputData + '2', err => {
            assert.notOk(err)
            done()
          })
        })
      })
    })

    it('removes the given version file name', done => {
      versions.all((err, versionData) => {
        assert.notOk(err)

        assert.equal(versionData.length, 3)
        assert.deepEqual(
          versionData.map(v => { return v.name }),
          ['0.json', '1.json', '2.json']
        )

        versions.remove('1.json', err => {
          assert.notOk(err)

          versions.all((err, versionData) => {
            assert.notOk(err)

            assert.equal(versionData.length, 2)
            assert.deepEqual(
              versionData.map(v => { return v.name }),
              ['0.json', '2.json']
            )

            versions.remove('2.json', err => {
              assert.notOk(err)

              versions.all((err, versionData) => {
                assert.notOk(err)

                assert.equal(versionData.length, 1)
                assert.deepEqual(
                  versionData.map(v => { return v.name }),
                  ['0.json']
                )

                done()
              })
            })
          })
        })
      })
    })

    it('returns an error if version not found', done => {
      versions.remove('5.json', err => {
        assert.isObject(err)
        done()
      })
    })

  })

})
