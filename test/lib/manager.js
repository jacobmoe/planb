var stdout = require('test-console').stdout
var nock = require('nock')
var fs = require('fs')

var srcPath = '../../' + SRC_DIR
var manager = require(srcPath + '/lib/manager.js')
var utils = require(srcPath + '/lib/storage/utils')

describe('manager', function() {
  afterEach(cleanup)

  describe('add', function() {
    it('creates a data directory, if not present', function(done) {
      var inspect = stdout.inspect()

      manager.add('http://www.test.com/api/path', null, function(err) {
        inspect.restore()

        assert.fileExists(utils.dataPath)
        assert.deepEqual(inspect.output, ['endpoint added\n'])
        done()
      })
    })

    it('adds an endpoint directory', function(done) {
      var inspect = stdout.inspect()

      manager.add('http://www.test.com/api/path', null, function(err) {
        manager.add('http://www.test.com/api/path/2', null, function(err) {
          inspect.restore()

          assert.fileExists(utils.dataPath + 'www.test.com:api:path')
          assert.fileExists(utils.dataPath + 'www.test.com:api:path:2')
          done()
        })
      })
    })
  })

  describe('fetch', function() {
    it('outputs a warning if no data directory exist', function(done) {
      var inspect = stdout.inspect()

      manager.fetch(null, function() {
        inspect.restore()
        assert.deepEqual(inspect.output, [ "add an endpoint first\n"])
        done()
      })
    })

    it('adds a new version to each existing endpoint', function(done) {
      nock('http://www.test.com')
      .get('/api/path')
      .reply(200, {content: 'some content'})
      .get('/api/path/2')
      .reply(200, {content: 'some more content'})

      var inspect = stdout.inspect()

      manager.add('http://www.test.com/api/path', null, function(err) {
        manager.add('http://www.test.com/api/path/2', null, function(err) {
          assert.fileExists(utils.dataPath + 'www.test.com:api:path')
          assert.fileExists(utils.dataPath + 'www.test.com:api:path:2')

          manager.fetch(null, function() {
            inspect.restore()

            var expectedOutput = [
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

    it('increments version number', function(done) {
      nock('http://www.test.com')
      .get('/api/path')
      .reply(200, {content: 'version 0 content'})

      nock('http://www.test.com')
      .get('/api/path')
      .reply(200, {content: 'version 1 content'})

      var inspect = stdout.inspect()

      manager.add('http://www.test.com/api/path', null, function(err) {
        assert.fileExists(utils.dataPath + 'www.test.com:api:path')

        manager.fetch(null, function() {
          assert.fileExists(utils.dataPath + 'www.test.com:api:path/0')

          assert.fileHasContent(
            utils.dataPath + 'www.test.com:api:path/0',
            '{"content":"version 0 content"}'
          )

          manager.fetch(null, function() {
            inspect.restore()

            var expectedOutput = [
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

  describe('list', function() {
    context('data directory not present', function() {
      it('outputs a warning', function(done) {
        var inspect = stdout.inspect()

        manager.list(null, function() {
          inspect.restore()
          assert.deepEqual(inspect.output, [ "add an endpoint first\n"])
          done()
        })
      })
    })

    context('existing endpoint and versions', function() {
      var mtime0, mtime1

      beforeEach(function () {
        nock('http://www.test.com')
        .get('/api/path')
        .reply(200, {content: 'version 0 content'})

        nock('http://www.test.com')
        .get('/api/path')
        .reply(200, {content: 'version 1 content'})
      })

      beforeEach(function (done) {
        var inspect = stdout.inspect()
        manager.add('http://www.test.com/api/path', null, function() {
          inspect.restore()
          done()
        })
      })

      beforeEach(function (done) {
        var inspect = stdout.inspect()
        manager.fetch(null, function() {
          assert.fileExists(utils.dataPath + 'www.test.com:api:path/0')

          manager.fetch(null, function() {
            assert.fileExists(utils.dataPath + 'www.test.com:api:path/1')
            inspect.restore()
            done()
          })
        })
      })

      beforeEach(function (done) {
        var path = utils.dataPath + 'www.test.com:api:path/0'
        fs.stat(path, function(err, stats) {

          mtime0 = stats.mtime
          done()
        })
      })

      beforeEach(function (done) {
        var path = utils.dataPath + 'www.test.com:api:path/1'
        fs.stat(path, function(err, stats) {

          mtime1 = stats.mtime
          done()
        })
      })

      it('outputs endpoints and versions as a table', function(done) {
        var inspect = stdout.inspect()

        assert.fileExists(utils.dataPath + 'www.test.com:api:path')

        manager.list(null, function() {
          inspect.restore()

          var expected = [
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

  describe('rollback', function () {
    context('missing argument', function() {
      it('outputs a warning', function(done) {
        var inspect = stdout.inspect()

        manager.rollback(null, null, function() {
          inspect.restore()

          var expected = ['missing endpoint. try the list command\n']

          assert.deepEqual(inspect.output, expected)
          done()
        })
      })
    })

    context('no existing versions for endpoint', function() {
      var endpoint = 'http://www.test.com/api/path'

      beforeEach(function (done) {
        var inspect = stdout.inspect()
        manager.add(endpoint, null, function() {
          inspect.restore()
          done()
        })
      })

      it('outputs a warning', function(done) {
        var inspect = stdout.inspect()

        manager.rollback(endpoint, null, function() {
          inspect.restore()

          var expected = ['no versions for that endpoint\n']

          assert.deepEqual(inspect.output, expected)
          done()
        })
      })

    })

    context('existing versions', function() {
      var endpoint = 'http://www.test.com/api/path'

      beforeEach(function () {
        nock('http://www.test.com')
        .get('/api/path')
        .reply(200, {content: 'version 0 content'})

        nock('http://www.test.com')
        .get('/api/path')
        .reply(200, {content: 'version 1 content'})
      })

      beforeEach(function (done) {
        var inspect = stdout.inspect()
        manager.add(endpoint, null, function() {
          inspect.restore()
          done()
        })
      })

      beforeEach(function (done) {
        var inspect = stdout.inspect()
        manager.fetch(null, function() {
          manager.fetch(null, function() {
            inspect.restore()
            done()
          })
        })
      })

      it('removes the current version', function(done) {
        assert.fileExists(utils.dataPath + 'www.test.com:api:path/0')
        assert.fileExists(utils.dataPath + 'www.test.com:api:path/1')

        var inspect = stdout.inspect()

        manager.rollback(endpoint, null, function() {
          inspect.restore()

          assert.fileExists(utils.dataPath + 'www.test.com:api:path/0')
          assert.fileDoesNotExist(utils.dataPath + 'www.test.com:api:path/1')

          done()
        })
      })
    })

  })

})
