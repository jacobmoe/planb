// variables in ES6 imports. how?
const srcPath = '../../' + SRC_DIR
const utils = require(srcPath + '/lib/utils')

describe('utils', () => {
  describe('findKeyBy', () => {
    it('returns key for object with properties matching opts', () => {
      let obj = { "100": {get: [], default: true}, "200": {get: []} }
      assert.equal(utils.findKeyBy(obj, {default: true}), "100")

      obj = { "100": {get: []}, "200": {get: [], default: true} }
      assert.equal(utils.findKeyBy(obj, {default: true}), "200")

      obj = {
        100: {a: "a", b: "b", c: "c"},
        200: {d: "d", e: "e", f: "f"},
        300: {g: "g", h: "h", i: "i"}
      }

      assert.equal(utils.findKeyBy(obj, {a: "a"}), 100)
      assert.equal(utils.findKeyBy(obj, {a: "a", c: "c"}), 100)
      assert.equal(utils.findKeyBy(obj, {d: "d", e: "e"}), 200)
      assert.equal(utils.findKeyBy(obj, {h: "h"}), 300)
      assert.equal(utils.findKeyBy(obj, {a: "a", b: "b", c: "c"}), 100)

      assert.isNull(utils.findKeyBy(obj, {a: "a", b: "b", c: "nope"}))
      assert.isNull(utils.findKeyBy(obj, {f: "g"}))
    })

    it('returns null if nothing found', () => {
      let obj = { "100": {get: []}, "200": {get: [], default: true} }

      assert.isNull(utils.findKeyBy(obj, {default: false}))
      assert.isNull(utils.findKeyBy(obj, {notathing: "thing"}))
      assert.isNull(utils.findKeyBy({}, {notathing: "thing"}))
      assert.isNull(utils.findKeyBy(obj, {}))
    })

    it('returns first when multiple matches found', () => {
      let obj = {
        100: {same: "same", a: "a", b: "b", c: "c"},
        200: {same: "same", d: "d", e: "e", f: "f"},
        300: {same: "same", g: "g", h: "h", i: "i"}
      }

      assert.equal(utils.findKeyBy(obj, {same: "same"}), 100)
    })
  })
})
