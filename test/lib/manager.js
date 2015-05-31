import testConsole from 'test-console'
import nock from 'nock'
import fs from 'fs'

// can't use variable import names for ES6 import statements?
const srcPath = '../../' + SRC_DIR
const manager = require(srcPath + '/lib/manager.js')
const utils = require(srcPath + '/lib/storage/utils')

const stdout = testConsole.stdout

describe('manager', () => {
  afterEach(cleanup)

  describe('add', () => {
    it('creates a data directory, if not present', done => {
      const inspect = stdout.inspect()

      manager.add('http://www.test.com/api/path', null, err => {
        inspect.restore()

        assert.notOk(err)
        assert.fileExists(utils.dataPath)
        assert.deepEqual(inspect.output, ['endpoint added\n'])
        done()
      })
    })

    it('adds an endpoint directory', done => {
      const inspect = stdout.inspect()

      manager.add('http://www.test.com/api/path', null, err => {
        assert.notOk(err)

        manager.add('http://www.test.com/api/path/2', null, err2 => {
          inspect.restore()

          assert.notOk(err2)
          assert.fileExists(utils.dataPath + 'www.test.com:api:path')
          assert.fileExists(utils.dataPath + 'www.test.com:api:path:2')
          done()
        })
      })
    })
  })

  describe('fetch', () => {
    it('outputs a warning if no data directory exist', done => {
      const inspect = stdout.inspect()

      manager.fetch(null, () => {
        inspect.restore()
        assert.deepEqual(inspect.output, [ "add an endpoint first\n"])
        done()
      })
    })

    it('adds a new version to each existing endpoint', done => {
      nock('http://www.test.com')
      .get('/api/path')
      .reply(200, {content: 'some content'})
      .get('/api/path/2')
      .reply(200, {content: 'some more content'})

      const inspect = stdout.inspect()

      manager.add('http://www.test.com/api/path', null, err => {
        manager.add('http://www.test.com/api/path/2', null, err => {
          assert.fileExists(utils.dataPath + 'www.test.com:api:path')
          assert.fileExists(utils.dataPath + 'www.test.com:api:path:2')

          manager.fetch(null, () => {
            inspect.restore()

            const expectedOutput = [
              'endpoint added\n',
              'endpoint added\n',
              'updating www.test.com/api/path\n',
              'updating www.test.com/api/path/2\n'
            ]

            assert.deepEqual(inspect.output, expectedOutput)

            assert.fileExists(utils.dataPath + 'www.test.com:api:path/0')
            assert.fileExists(utils.dataPath + 'www.test.com:api:path:2/0')

            assert.fileHasContent(
              utils.dataPath + 'www.test.com:api:path/0',
              '{"content":"some content"}'
            )

            assert.fileHasContent(
              utils.dataPath + 'www.test.com:api:path:2/0',
              '{"content":"some more content"}'
            )

            done()
          })
        })
      })
    })

    it('increments version number', done => {
      nock('http://www.test.com')
      .get('/api/path')
      .reply(200, {content: 'version 0 content'})

      nock('http://www.test.com')
      .get('/api/path')
      .reply(200, {content: 'version 1 content'})

      const inspect = stdout.inspect()

      manager.add('http://www.test.com/api/path', null, err => {
        assert.fileExists(utils.dataPath + 'www.test.com:api:path')

        manager.fetch(null, () => {
          assert.fileExists(utils.dataPath + 'www.test.com:api:path/0')

          assert.fileHasContent(
            utils.dataPath + 'www.test.com:api:path/0',
            '{"content":"version 0 content"}'
          )

          manager.fetch(null, () => {
            inspect.restore()

            const expectedOutput = [
              'endpoint added\n',
              'updating www.test.com/api/path\n',
              'updating www.test.com/api/path\n'
            ]

            assert.deepEqual(inspect.output, expectedOutput)

            assert.fileExists(utils.dataPath + 'www.test.com:api:path/1')

            assert.fileHasContent(
              utils.dataPath + 'www.test.com:api:path/1',
              '{"content":"version 1 content"}'
            )

            done()
          })

        })
      })
    })
  })

  describe('list', () => {
    context('data directory not present', () => {
      it('outputs a warning', done => {
        const inspect = stdout.inspect()

        manager.list(null, () => {
          inspect.restore()
          assert.deepEqual(inspect.output, [ "add an endpoint first\n"])
          done()
        })
      })
    })

    context('existing endpoint and versions', () => {
      let mtime0, mtime1

      beforeEach(() => {
        nock('http://www.test.com')
        .get('/api/path')
        .reply(200, {content: 'version 0 content'})

        nock('http://www.test.com')
        .get('/api/path')
        .reply(200, {content: 'version 1 content'})
      })

      beforeEach(done => {
        const inspect = stdout.inspect()
        manager.add('http://www.test.com/api/path', null, () => {
          inspect.restore()
          done()
        })
      })

      beforeEach(done => {
        const inspect = stdout.inspect()
        manager.fetch(null, () => {
          assert.fileExists(utils.dataPath + 'www.test.com:api:path/0')

          manager.fetch(null, () => {
            assert.fileExists(utils.dataPath + 'www.test.com:api:path/1')
            inspect.restore()
            done()
          })
        })
      })

      beforeEach(done => {
        const path = utils.dataPath + 'www.test.com:api:path/0'
        fs.stat(path, function(err, stats) {

          mtime0 = stats.mtime
          done()
        })
      })

      beforeEach(done => {
        const path = utils.dataPath + 'www.test.com:api:path/1'
        fs.stat(path, function(err, stats) {

          mtime1 = stats.mtime
          done()
        })
      })

      it('outputs endpoints and versions as a table', done => {
        const inspect = stdout.inspect()

        assert.fileExists(utils.dataPath + 'www.test.com:api:path')

        manager.list(null, () => {
          inspect.restore()

          const expected = [
            '.---------------------------------------------.\n',
            '|   |          www.test.com/api/path          |\n',
            '|---|-----------------------------------------|\n',
            '| 0 | '            + mtime0 +               ' |\n',
            '| 1 | '            + mtime1 +               ' |\n',
            '\'---------------------------------------------\'\n'
          ].join('')

          assert.equal(inspect.output, expected)

          done()
        })
      })

    })
  })

  describe('rollback', () => {
    context('missing argument', () => {
      it('outputs a warning', done => {
        const inspect = stdout.inspect()

        manager.rollback(null, null, () => {
          inspect.restore()

          const expected = ['missing endpoint. try the list command\n']

          assert.deepEqual(inspect.output, expected)
          done()
        })
      })
    })

    context('no existing versions for endpoint', () => {
      const endpoint = 'http://www.test.com/api/path'

      beforeEach(done => {
        const inspect = stdout.inspect()
        manager.add(endpoint, null, () => {
          inspect.restore()
          done()
        })
      })

      it('outputs a warning', done => {
        const inspect = stdout.inspect()

        manager.rollback(endpoint, null, () => {
          inspect.restore()

          const expected = ['no versions for that endpoint\n']

          assert.deepEqual(inspect.output, expected)
          done()
        })
      })

    })

    context('existing versions', () => {
      const endpoint = 'http://www.test.com/api/path'

      beforeEach(() => {
        nock('http://www.test.com')
        .get('/api/path')
        .reply(200, {content: 'version 0 content'})

        nock('http://www.test.com')
        .get('/api/path')
        .reply(200, {content: 'version 1 content'})
      })

      beforeEach(done => {
        const inspect = stdout.inspect()
        manager.add(endpoint, null, () => {
          inspect.restore()
          done()
        })
      })

      beforeEach(done => {
        const inspect = stdout.inspect()
        manager.fetch(null, () => {
          manager.fetch(null, () => {
            inspect.restore()
            done()
          })
        })
      })

      it('removes the current version', done => {
        assert.fileExists(utils.dataPath + 'www.test.com:api:path/0')
        assert.fileExists(utils.dataPath + 'www.test.com:api:path/1')

        const inspect = stdout.inspect()

        manager.rollback(endpoint, null, () => {
          inspect.restore()

          assert.fileExists(utils.dataPath + 'www.test.com:api:path/0')
          assert.fileDoesNotExist(utils.dataPath + 'www.test.com:api:path/1')

          done()
        })
      })
    })

  })

})
