module.exports = function (name) {
  var util     = require('util')
  var config   = require('config')
  var Emitter  = require('events').EventEmitter;
  var emitter  = new Emitter();
  var _        = require('lodash')
  var feeder   = {}
  var lastTime = Date.now()
  feeder.on    = emitter.on.bind(emitter)
  feeder.once  = emitter.once.bind(emitter)
  var feed     = {}
  var timer

  feeder.resetClockToClearPrice = function () {
    lastTime = Date.now()
    if (timer) clearTimeout(timer)
    timer = setTimeout(feeder.clearPrice.bind(feeder), config.expiryTime * 60 * 1000)
  }

  feeder.heartbeat = function () {
    feeder.resetClockToClearPrice()
  }

  feeder.priceReceived = function (price) {
    price = price - 0
    if (!price || isNaN(price)) return util.log(name, " invalid price ", price)
    feed = {
      type : "socket",
      name : name,
      price: price,
      time : Date.now()
    }
    emitter.emit('price', feed)
    feeder.resetClockToClearPrice()
  }

  feeder.clearPrice = function () {
    feed         = _.cloneDeep(feed)
    feed.expired = true
    util.log('clearPrice', feed)
    emitter.emit('price', feed)
  }

  feeder.getFeed = function () {
    return feed
  }

  setInterval(function () {
    if (Date.now() - lastTime > 150000) {
      util.log('Reconnecting', name)
      feeder.reconnect()
    }
  }, 100000)

  return feeder
}
