const affirm = require('affirm.js')
const median = require('median')
const logger = require("@leverj/logger")
const RestIndex = require('./restIndex')
const Price = require('./price')

module.exports = function (config, emitter) {
  const index = {}
  const TOPIC = config.topic
  const prices = {}
  let priceIndex = {}
  let restIndex
  let oldPrice

  let startTime

  function configureRest(providerName, provider) {
    restIndex = RestIndex(provider)
    restIndex.on('price', function (data) {
      const changed = prices[providerName].setRestPrice(data)
      if (changed) index.priceChanged(providerName)
    })
  }

  index.init = function () {
    for (const provider of config.providers) {
      const providerName = provider.name
      prices[providerName] = Price(providerName)
      configureRest(providerName, provider)
    }
    logger.log('started', startTime = Date.now(), TOPIC)
    emitter.on('connection', function (socket) {
      if (priceIndex.price) socket.emit(TOPIC, {price: priceIndex.price, used: priceIndex.used})
    })
  }

  function getActivePriceList() {
    const priceList = Object.keys(prices).map(providerName => prices[providerName].getPrice())
    return priceList.filter(price => price !== undefined)
  }

  function publishFeed(priceList, providerName) {
    const minExternalProviders = config.minExternalProviders || 1
    const unExpired = priceList.filter(x => !x.expired)
    const price = unExpired.length < minExternalProviders ? undefined : median(unExpired.map(inverted)).toFixed(config.ticksize) - 0
    if (!price) return
    if (oldPrice === price) return
    oldPrice = price
    priceIndex = {price: price, lastProvider: providerName, used: unExpired.length, providers: priceList}
    if (config.logExternalPrice) logger.log(TOPIC, prettyPrint(priceIndex))
    if (emitter) emitter.emit(TOPIC, {price: price, used: unExpired.length})
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
    const priceList = getActivePriceList()
    const readyToSendPrice = delayedResponder.isReadyToSendPrice(providerName, priceList.length, timeoutMessage)
    if (readyToSendPrice) publishFeed(priceList, providerName)
  }

  index.getIndex = function () {
    return priceIndex
  }
  index.reset = function () {
    priceIndex = {}
  }

  index.stop = function () {
    restIndex.stop()
  }
  index.init()

  return index
}
