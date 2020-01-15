var expect = require('expect.js')
var fixtures = require('fixtures.js')(__filename)

var mocksock  = require('./mocksock')
var IndexCore = require('../src/index.core')
var axios    = require('axios')
var sinon     = require('sinon')
var bluebird  = require('bluebird')
var config    = require('config')
var clock

describe.skip('Coinpit Index', function() {
  var MINUTE = 60 * 1000

  beforeEach(function() {
    mocksock.mock()
    sinon.stub(axios, "get").callsFake(async (url) => fixtures.get[url])
  })

  afterEach(function() {
    mocksock.stop()
    if(axios.get.restore) axios.get.restore()
    if(clock && clock.restore) clock.restore()
  })

  it('should return price from socket.io if socket connected', function() {
    var feed = IndexCore(fixtures.connected)
    feed.components[fixtures.connected.provider].priceReceived(fixtures.connected.price)
    var price = feed.getIndex()
    expect(price.price).to.equal(fixtures.connected.price)
  })

  it('should return price from REST if socket is unconnected', async function() {
    var feed = IndexCore(fixtures.unconnected)
    await bluebird.delay(5)
    var price = feed.getIndex()
    expect(price.price).to.equal(fixtures.connected.price)
  })

  it.skip('should return rest price when socket price expires', async function() {
    var feed = IndexCore(fixtures.expiredsocket)
    feed.components[fixtures.expiredsocket.name].priceReceived(fixtures.expiredsocket.socketPrice)
    clock = sinon.useFakeTimers()
    clock.tick(config.startupDelay + config.expiryTime * MINUTE + 1)
    var index = feed.getIndex()
    clock.tick(100)
    clock.restore()
    await bluebird.delay(1)
    console.log(index)
    expect(index.price).to.equal(fixtures.expiredsocket.restPrice)
  })

  it('should drop provider price after configured minutes of no updated prices')
  it('should send undefined price if number of providers online less than configured min')
  it('should wait for configured startup time to get as many providers online as practical')
  it('should return median price of all online providers')
})
