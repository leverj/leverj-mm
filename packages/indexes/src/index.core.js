var mangler   = require('mangler')
var median    = require('median')
var util      = require("util")
var RestIndex = require('./restIndex')
var Price     = require('./price')

module.exports = function (config) {
  var index = {}
  var TOPIC = "coinpit-index#BTCUSD"
  var io    = require('socket.io')(config.port)

  var prices        = {}
  var feedProviders = index.components = {}
  // var restPrices    = {}
  var priceIndex    = {}
  var current       = {}

  var startTime


  function configureSocket(name, socketModule) {
    if(!socketModule) return
    feedProviders[name] = require(socketModule)(name)
    feedProviders[name].on('price', function (data) {
      var changed = prices[name].setSocketPrice(data)
      if(changed) index.priceChanged(name)
    })
  }

  function configureRest(name, config) {
    if(!config.url) return
    var restIndex = RestIndex(config)
    restIndex.on('price', function(data) {
      var changed = prices[name].setRestPrice(data)
      if(changed) index.priceChanged(name)
    })
  }

  index.init = function() {
    config.components.forEach(component => {
      var name = component.name
      prices[name] = Price(name)
      configureSocket(name, component.socketModule)
      configureRest(name, component)
    })
    util.log('started', startTime = Date.now())
    io.on('connection', function (socket) {
      socket.emit(TOPIC, priceIndex)
    })
  }

  function getActivePriceList() {
    var list = []
    config.components.forEach(component => {
      var indexPrice = prices[component.name].getPrice()
      if (indexPrice !== undefined) list.push(indexPrice)
    })
    return list
  }

  function publishFeed(list, feedProvider) {
    var minExternalProviders = config.minExternalProviders || 1
    var unExpired = list.filter(x => !x.expired)
    var price = unExpired.length < minExternalProviders ? undefined : median(unExpired.map(x=>x.price)).toFixed(config.ticksize) - 0
    priceIndex     = { price: price, lastProvider: feedProvider, used: unExpired.length, providers: list }
    if (config.logExternalPrice) util.log('coinpit-index:', prettyPrint(priceIndex))
    if (io) io.emit(TOPIC, priceIndex)
  }

  function prettyPrint(priceIndex) {
    var result = {}
    priceIndex.providers.forEach(p => result[p.name+"."+p.type] = p.price)
    return [priceIndex.price, priceIndex.used, priceIndex.lastProvider, JSON.stringify(result)].join(" ")
  }

  var delayedResponder = (function () {
    var responder = {}
    var timer

    responder.isReadyToSendPrice = function (feedProvider, count, timeoutMessage) {
      if (timer) clearTimeout(timer)
      if (timeoutMessage) util.log(timeoutMessage)
      if (count === config.components.length || isWaitTimeDone()) return true
      timer = setTimeout(function () {
        index.priceChanged(feedProvider, 'called after wait')
      }, config.startupDelay -(Date.now() - startTime))
      return false
    }

    function isWaitTimeDone() {
      return Date.now() - startTime > config.startupDelay
    }

    return responder
  })()

  index.priceChanged = function(feedProvider, timeoutMessage) {
    var list             = getActivePriceList()
    var readyToSendPrice = delayedResponder.isReadyToSendPrice(feedProvider, list.length, timeoutMessage)
    if (readyToSendPrice) publishFeed(list, feedProvider)
  }

  index.getIndex = function () {
    return priceIndex
  }
  index.reset    = function () {
    priceIndex = {}
  }

  index.init()

  return index
}
