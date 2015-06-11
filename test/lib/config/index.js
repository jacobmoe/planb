import fs from 'fs'

// variables in ES6 imports. how?
const srcPath = '../../../' + SRC_DIR
const configFactory = require(srcPath + '/lib/config')
const defaults = require(srcPath + '/lib/defaults')
const project = require(srcPath + '/lib/project')
const utils = require(srcPath + '/lib/utils')

const config = configFactory.default(process.cwd())

describe('config/index', () => {
  before(cleanup)
  afterEach(cleanup)

  describe('configName', () => {
    it('returns the test config file name', done => {
      assert.equal(config.configName, '.planb.json.test')
      done()
    })
  })

  describe('create', () => {
    it('creates a config file in current directory', done => {
      fs.readdir(process.cwd(), (err, files) => {
        assert.notOk(err)
        assert.equal(files.indexOf(config.configName), -1)

        config.create(err => {
          assert.notOk(err)

          fs.readdir(process.cwd(), (err, files) => {
            assert.notOk(err)
            assert.isAbove(files.indexOf(config.configName), -1)
            done()
          })
        })
      })
    })
  })

  describe('checkForConfigFile', () => {
    it('checks if given directory has a config file', done => {
      config.checkForConfigFile((err, exists) => {
        assert.isNull(err)
        assert.isFalse(exists)

        config.create(err => {
          assert.notOk(err)

          config.checkForConfigFile((err, exists) => {
            assert.isNull(err)
            assert.isTrue(exists)
            done()
          })
        })
      })
    })
  })

  describe('read', () => {
    context('project not initialized', () => {
      it('returns an error', done => {
        config.read((err, data) => {
          assert.isObject(err)
          assert.notOk(data)
          done()
        })
      })
    })

    context('project is initialized', () => {
      beforeEach(project.init)

      it('returns the config file data', done => {
        config.read((err, data) => {
          assert.isNull(err)
          assert.deepEqual(data, configFactory.defaultConfigData)
          done()
        })
      })
    })
  })

  describe('addEndpoint', () => {
    const url = 'http://test-endpoint.com/api/v1/stuff/43'
    const opts = {port: "1234", action: 'put'}

    context('project not initialized', () => {
      it('returns an error', done => {
        config.addEndpoint(url, opts, err => {
          assert.isObject(err)
          done()
        })
      })
    })

    context('project is initialized', () => {
      beforeEach(project.init)

      it('accepts a url and updates the config file', done => {
        config.addEndpoint(url, opts, err => {
          assert.notOk(err)

          config.read((err, configData) => {
            assert.notOk(err)

            const item = configData.endpoints[opts.port]

            assert.include(item[opts.action], utils.cleanUrl(url))

            done()
          })
        })
      })

      it('adds url to existing item if port present', done => {
        opts.port = '5000'
        opts.action = 'get'

        config.addEndpoint(url, opts, err => {
          assert.notOk(err)

          config.read((err, configData) => {
            assert.notOk(err)

            assert.equal(Object.keys(configData.endpoints).length, 1)
            assert.isObject(configData.endpoints[opts.port])
            assert.equal(configData.endpoints[opts.port][opts.action].length, 1)
            assert.equal(configData.endpoints[opts.port][opts.action][0], utils.cleanUrl(url))

            config.addEndpoint(url + '/more-stuff', opts, err => {
              assert.notOk(err)

              config.read((err, configData) => {
                assert.notOk(err)

                assert.equal(Object.keys(configData.endpoints).length, 1)
                assert.isObject(configData.endpoints[opts.port])
                assert.equal(configData.endpoints[opts.port][opts.action].length, 2)
                assert.include(configData.endpoints[opts.port][opts.action], utils.cleanUrl(url))
                assert.include(
                  configData.endpoints[opts.port][opts.action],
                  utils.cleanUrl(url + '/more-stuff')
                )

                done()
              })
            })
          })
        })
      })

      it('adds url to existing item and sets new action', done => {
        let opts = { port: "5000", action: "get" }

        config.addEndpoint(url, opts, err => {
          assert.notOk(err)

          opts = { port: "5000", action: "put" }
          config.addEndpoint(url + '/more', opts, err => {
            assert.notOk(err)

            config.read((err, configData) => {
              assert.notOk(err)

              assert.equal(Object.keys(configData.endpoints).length, 1)
              assert.isObject(configData.endpoints[opts.port])

              assert.equal(configData.endpoints[opts.port].get.length, 1)
              assert.equal(configData.endpoints[opts.port].put.length, 1)

              assert.include(configData.endpoints[opts.port].get[0], utils.cleanUrl(url))
              assert.include(
                configData.endpoints[opts.port].put[0],
                utils.cleanUrl(url + '/more')
              )

              done()
            })
          })
        })
      })

      it('will not add the same endpoint to the same port/action item', done => {
        let opts = { port: "5000", action: "get" }

        config.addEndpoint(url, opts, err => {
          assert.notOk(err)

          config.addEndpoint(url, opts, (err, response) => {
            assert.notOk(err)

            config.read((err, configData) => {
              assert.notOk(err)

              assert.equal(Object.keys(configData.endpoints).length, 1)
              assert.isObject(configData.endpoints[opts.port])

              assert.equal(configData.endpoints[opts.port][opts.action].length, 1)

              assert.include(
                configData.endpoints[opts.port][opts.action][0],
                utils.cleanUrl(url)
              )

              done()
            })
          })
        })
      })

      it('creates a new config item if port not present', done => {
        let opts = { port: "1234", action: "post" }

        config.addEndpoint(url, opts, err => {
          assert.notOk(err)

          config.read((err, configData) => {
            assert.notOk(err)

            assert.equal(Object.keys(configData.endpoints).length, 2)

            assert.isObject(configData.endpoints["5000"])
            assert.equal(configData.endpoints["5000"].get.length, 0)

            assert.isObject(configData.endpoints["1234"])
            assert.equal(configData.endpoints["1234"].post.length, 1)
            assert.include(
              configData.endpoints["1234"][opts.action][0],
              utils.cleanUrl(url)
            )

            done()
          })
        })
      })

      it('uses default port if port option not supplied', done => {
        let opts = { action: "post" }

        config.addEndpoint(url, opts, err => {
          assert.notOk(err)

          config.read((err, configData) => {
            assert.notOk(err)

            assert.equal(Object.keys(configData.endpoints).length, 1)

            assert.isObject(configData.endpoints["5000"])
            assert.equal(configData.endpoints["5000"].get.length, 0)
            assert.equal(configData.endpoints["5000"].post.length, 1)

            done()
          })
        })
      })

      it('uses default action if action option not supplied', done => {
        config.addEndpoint(url, {}, err => {
          assert.notOk(err)

          config.read((err, configData) => {
            assert.notOk(err)

            assert.equal(Object.keys(configData.endpoints).length, 1)

            assert.isObject(configData.endpoints["5000"])
            assert.equal(configData.endpoints["5000"].get.length, 1)

            done()
          })
        })
      })

      it('returns an info object describing new endpoint', done => {
        config.addEndpoint(url, {}, (err, info) => {
          assert.notOk(err)

          assert.deepEqual(info, {
            url: utils.cleanUrl(url),
            port: "5000",
            action: "get"
          })

          const opts = {port: '1234', action: 'post'}
          config.addEndpoint(url + '/other', opts, (err, info) => {
            assert.notOk(err)

            assert.deepEqual(info, {
              url: utils.cleanUrl(url + '/other'),
              port: "1234",
              action: "post"
            })

            done()
          })
        })
      })
    })
  })

  describe('removeEndpoint', () => {
    const url = 'http://test-endpoint.com/api/v1/stuff/43'

    context('project not initialized', () => {
      it('returns an error', done => {
        config.removeEndpoint(url, {}, err => {
          assert.isObject(err)
          done()
        })
      })
    })

    context('project is initialized', () => {
      beforeEach(project.init)

      it('returns error if no endpoint found for given port', done => {
        config.removeEndpoint(url, {port: "1234"}, err => {
          assert.isObject(err)
          done()
        })
      })

      it('removes url from default port and action if not supplied', done => {
        config.addEndpoint(url, null, err => {
          assert.notOk(err)
          config.addEndpoint(url + '/other', null, err => {
            assert.notOk(err)

            config.read((err, configData) => {
              assert.notOk(err)
              assert.equal(configData.endpoints["5000"].get.length, 2)

              config.removeEndpoint(url, null, err => {
                assert.notOk(err)

                config.read((err, configData) => {
                  assert.notOk(err)
                  assert.equal(configData.endpoints["5000"].get.length, 1)
                  assert.equal(
                    configData.endpoints["5000"].get[0],
                    utils.cleanUrl(url + '/other')
                  )
                  done()
                })
              })
            })
          })

        })
      })

      it('removes url from given port and action', done => {
        const opts = {port: '1234', action: 'post'}

        config.addEndpoint(url, opts, err => {
          assert.notOk(err)

          config.addEndpoint(url + '/other', opts, err => {
            assert.notOk(err)

            config.addEndpoint(url + '/yet-another', null, err => {
              assert.notOk(err)

              config.read((err, configData) => {
                assert.notOk(err)
                assert.isObject(configData.endpoints["5000"])
                assert.equal(configData.endpoints["5000"].get.length, 1)
                assert.isObject(configData.endpoints["1234"])
                assert.equal(configData.endpoints["1234"].post.length, 2)

                config.removeEndpoint(url, opts, err => {
                  assert.notOk(err)

                  config.read((err, configData) => {
                    assert.notOk(err)

                    assert.equal(configData.endpoints["5000"].get.length, 1)
                    assert.equal(configData.endpoints["1234"].post.length, 1)

                    done()
                  })
                })
              })
            })
          })
        })
      })

      it('returns an info object describing removed endpoint', done => {
        const opts = {port: '1234', action: 'post'}

        config.addEndpoint(url, opts, err => {
          assert.notOk(err)

          config.removeEndpoint(url, opts, (err, info) => {
            assert.notOk(err)

            assert.deepEqual(info, {
              port: opts.port,
              action: opts.action,
              url: utils.cleanUrl(url)
            })

            done()
          })
        })
      })
    })
  })

  describe('setDefaultPort', () => {
    context('project is not initialized', () => {
      it('returns an error', done => {
        config.setDefaultPort("1234", (err, port) => {
          assert.isObject(err)
          assert.notOk(port)
          done()
        })
      })
    })

    context('project is initialized', () => {
      beforeEach(project.init)

      it('unsets current default and sets new default', done => {
        config.setDefaultPort("1234", err => {
          assert.notOk(err)

          config.read((err, configData) => {
            assert.isNull(err)
            assert.isTrue(configData.endpoints["1234"].default)
            assert.isUndefined(configData.endpoints["5000"].default)

            done()
          })
        })
      })

      it('returns an error for an invalid port', done => {
        config.setDefaultPort("abcd", err => {
          assert.isObject(err)

          config.read((err, configData) => {
            assert.isNull(err)
            assert.isTrue(configData.endpoints["5000"].default)
            assert.isUndefined(configData.endpoints.abcd)

            done()
          })
        })
      })
    })
  })

  describe('getDefaultPort', () => {
    context('project is not initialized', () => {
      it('returns an error', done => {
        config.getDefaultPort((err, port) => {
          assert.isObject(err)
          assert.notOk(port)
          done()
        })
      })
    })

    context('project is initialized', () => {
      beforeEach(project.init)

      it('returns the default port', done => {
        config.getDefaultPort((err, port) => {
          assert.isNull(err)
          assert.equal(port, "5000")
          done()
        })
      })
    })

  })


})
