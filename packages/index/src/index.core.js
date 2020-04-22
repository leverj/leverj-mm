const affirm    = require('affirm.js')
const mangler   = require('mangler')
const median    = require('median')
const logger    = require("@leverj/logger")
const RestIndex = require('./restIndex')
const Price     = require('./price')

module.exports = function (config, io) {
  const index         = {}
  const TOPIC         = config.topic
  const prices        = {}
  const feedProviders = index.components = {}
  // var restPrices    = {}
  let priceIndex      = {}
  let oldPrice

  let startTime


  function configureSocket(providerName, socketModule) {
    if (!socketModule) return
    feedProviders[providerName] = require(socketModule)(providerName)
    feedProviders[providerName].on('price', function (data) {
      const changed = prices[providerName].setSocketPrice(data)
      if (changed) index.priceChanged(providerName)
    })
  }

  function configureRest(providerName, provider) {
    const restIndex = RestIndex(provider)
    restIndex.on('price', function (data) {
      const changed = prices[providerName].setRestPrice(data)
      if (changed) index.priceChanged(providerName)
    })
  }

  index.init = function () {
    for (const provider of config.providers) {
      const providerName   = provider.name
      prices[providerName] = Price(providerName)
      // configureSocket(name, component.socketModule)
      configureRest(providerName, provider)
    }
    logger.log('started', startTime = Date.now(), TOPIC)
    io.on('connection', function (socket) {
      if (priceIndex.price) socket.emit(TOPIC, {price: priceIndex.price, used: priceIndex.used})
    })
  }

  function getActivePriceList() {
    const priceList = Object.keys(prices).map(providerName => prices[providerName].getPrice())
    return priceList.filter(price => price !== undefined)
  }

  function publishFeed(priceList, providerName) {
    const minExternalProviders = config.minExternalProviders || 1
    const unExpired            = priceList.filter(x => !x.expired)
    const price                = unExpired.length < minExternalProviders ? undefined : median(unExpired.map(inverted)).toFixed(config.ticksize) - 0
    if (!price) return
    if (oldPrice === price) return
    oldPrice   = price
    priceIndex = {price: price, lastProvider: providerName, used: unExpired.length, providers: priceList}
    if (config.logExternalPrice) logger.log(TOPIC, prettyPrint(priceIndex))
    if (io) io.emit(TOPIC, {price: price, used: unExpired.length})
  }

  function inverted(price) {
    return providerFromConfig(price.name).inverse ? 1 / price.price : price.price
  }

  function prettyPrint(priceIndex) {
    const result = {}
    priceIndex.providers.forEach(p => result[p.name + "." + p.type] = p.price)
    return [priceIndex.price, priceIndex.used, priceIndex.lastProvider, JSON.stringify(result)].join(" ")
  }

  const delayedResponder = (function () {
    const responder = {}
    let timer

    responder.isReadyToSendPrice = function (providerName, count, timeoutMessage) {
      if (timer) clearTimeout(timer)
      if (timeoutMessage) logger.log(timeoutMessage)
      if (count === config.providers.length || isWaitTimeDone()) return true
      timer = setTimeout(function () {
        index.priceChanged(providerName, 'called after wait')
      }, config.startupDelay - (Date.now() - startTime))
      return false
    }

    function isWaitTimeDone() {
      return Date.now() - startTime > config.startupDelay
    }

    return responder
  })()

  function providerFromConfig(providerName) {
    let provider = config.providers.filter(provider => provider.name === providerName)
    affirm(provider.length === 1, `provider ${providerName} not found in ${config.providers}`)
    return provider.length === 0 ? undefined : provider[0]
  }

  index.priceChanged = function (providerName, timeoutMessage) {
    const priceList        = getActivePriceList()
    const readyToSendPrice = delayedResponder.isReadyToSendPrice(providerName, priceList.length, timeoutMessage)
    if (readyToSendPrice) publishFeed(priceList, providerName)
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
