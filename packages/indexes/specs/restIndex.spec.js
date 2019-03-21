var expect    = require('expect.js')
var rest      = require('rest.js')
var sinon     = require('sinon')
var bluebird  = require('bluebird')
var restIndex = require('../src/restIndex')
var fixtures  = require("./fixtures/restIndex.spec.json")

describe.skip('Index using rest', function () {

  afterEach(function () {
    if (rest.get.restore) rest.get.restore()
  })

  fixtures.forEach(function (test, index) {
    it('should get the price from ' + test.provider.name + ' using rest call', function*() {
      sinon.stub(rest, 'get').callsFake(async ()=> ({ body: test.body }))
      var provider = restIndex(test.provider)
      var price  = yield provider.getPrice()
      expect(price).to.equal(test.price)
    })
  })
})
