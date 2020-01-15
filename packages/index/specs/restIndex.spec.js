var expect    = require('expect.js')
var rest      = require('axios')
var sinon     = require('sinon')
var bluebird  = require('bluebird')
var restIndex = require('../src/restIndex')
var fixtures  = require("./fixtures/restIndex.spec.json")

describe.skip('Index using rest', function () {

  afterEach(function () {
    if (rest.get.restore) rest.get.restore()
  })

  fixtures.forEach(function (test, index) {
    it('should get the price from ' + test.provider.name + ' using rest call', async function() {
      sinon.stub(rest, 'get').callsFake(async ()=> ({ data: test.data }))
      var provider = restIndex(test.provider)
      var price  = await provider.getPrice()
      expect(price).to.equal(test.price)
    })
  })
})
