const config = require("./config")
const zka = require("@leverj/zka")(config.baseUrl, config.apiPath, "NONCE", {path: config.socketPath})
const adapter = require("@leverj/adapter/src/OrderAdapter")
const _ = require('lodash')
const collarStrategy = require('./collarStrategy')
const io = require('socket.io-client')
const logger = require("@leverj/logger")
const BigNumber = require('bignumber.js')
const adaptor = require('@leverj/adapter/src/OrderAdapter')
const orderAdaptor = require('@leverj/adapter/src/DerivativesOrderAdaptor')
const OrderAdapter = require("@leverj/adapter/src/OrderAdapter")
let i = 1

module.exports = (async function () {
  const SKEW = 0.2
  let instruments = {}
  let leverjConfig = {}
  let collarWorking, lastPrice, lastSide, indexPrice
  let orders = {}
  let ema
  let timestamp = Date.now()

  const emaMultiplier = 2 / (10 + 1)
  const isSpot = config.app === 'spot'
  const strategy = {
    COLLAR: doCollarStrategy,
    RANDOM: doRandomStrategy,
    EMA: doEMAStrategy,
  }

  const toMakerSide = side => side === "buy" ? "sell" : "buy"

  async function start() {
    printConfig()
    zka.init(config.accountId, config.apiKey, config.secret)
    zka.socket.register()
    let allConfig = await zka.rest.get('/all/config')
    leverjConfig = allConfig.config
    instruments = allConfig.instruments
    const allOrders = await zka.rest.get("/order")
    allOrders.forEach(order => {
      if (order.instrument === config.instrumentId)
        orders[order.uuid] = order
    })
    listen()
    await setLastPriceAndSide()
    strategy[config.strategy]()
  }

  function newOrder(side, price, quantity) {
    console.log('Order:', side, price, quantity)
    return isSpot ? spotOrder(side, price, quantity) : futuresOrder(side, price, quantity)
  }

  function getMarginPerFraction(side, price) {
    const maxLeverage = instrument().maxLeverage - 1
    const estimatedEntryPrice = side === 'buy' ? price : indexPrice ? Math.max(indexPrice, price) : price
    let baseSignificantDigits = instrument().baseSignificantDigits
    let decimals = instrument().quote.decimals
    return BigNumber(estimatedEntryPrice).shiftedBy(decimals - baseSignificantDigits).div(maxLeverage).integerValue().shiftedBy(baseSignificantDigits).toFixed()
  }

  function futuresOrder(side, price, quantity) {
    if (price % instrument().tickSize !== 0) price = price - (price % instrument().tickSize) + instrument().tickSize
    let order = {
      accountId: config.accountId,
      originator: config.apiKey,
      instrument: config.instrumentId,
      price: price.toFixed(instrument().quoteSignificantDigits) - 0,
      // triggerPrice: order.triggerPrice,
      quantity: quantity.toFixed(instrument().baseSignificantDigits) - 0,
      marginPerFraction: getMarginPerFraction(side, price),
      side: side,
      orderType: 'LMT',
      timestamp: Date.now() * 1e3,
      quote: instrument().quote.address,
      isPostOnly: false,
      reduceOnly: false,
      // clientOrderId: BigNumber(nodeUUID.v4().toString().split("-").join(''), 16).toFixed()
      clientOrderId: i++
    }
    order.signature = orderAdaptor.sign(order, instrument(), config.secret)
    return order
  }

  function spotOrder(side, price, quantity) {
    let order = {
      orderType: 'LMT',
      side,
      price: price.toFixed(instrument().quoteSignificantDigits) - 0,
      quantity: quantity.toFixed(instrument().baseSignificantDigits) - 0,
      timestamp: Date.now() * 1e3,
      accountId: config.accountId,
      token: instrument().address,
      instrument: instrument().id
    }
    order.signature = adaptor.sign(order, instrument(), config.secret)
    return order

  }

  async function setLastPriceAndSide() {
    const trades = await zka.rest.get(`/instrument/${config.instrumentId}/trade`)
    if (trades.length)
      setPriceAndSide(trades[0].price, trades[0].side)
    else
      setPriceAndSide(config.startPrice, config.startSide)
  }

  function formattedDate() {
    let date = new Date()
    return date.toJSON()
  }

  function setPriceAndSide(price, side) {
    lastSide = toMakerSide(side)
    lastPrice = price
    logger.log('last price and side', price, side)
  }

  // EMA strategy
  async function doEMAStrategy() {
    setInterval(function() {
      const price = isSpot ? lastPrice : indexPrice
      ema = ema && price ? (price * emaMultiplier + ema * (1 - emaMultiplier)) : price
    }, 10000)
  }

// collar strategy ##########################################################################################


  async function doCollarStrategy() {
    collarStrategy.setConfig(config)
    setInterval(delayedRemoveAndAddOrders, 20000)
  }

  function onTrade({instrument, price, side}) {
    if (instrument !== config.instrumentId) return
    setPriceAndSide(price, side)
    delayedRemoveAndAddOrders()
  }

  function onIndex({topic, price}) {
    if (!instrument().topic || topic !== instrument().topic) return console.log('Ignoring ', topic, price, instrument().topic)
    indexPrice = price
  }

  function onExecution(accountExecution) {
    // setPriceAndSide(accountExecution.price, accountExecution.side)
    // delayedRemoveAndAddOrders()
  }

  let collarTimer

  function delayedRemoveAndAddOrders() {
    try {
      if (config.strategy !== "COLLAR") return
      clearTimeout(collarTimer)
      collarTimer = setTimeout(() => removeAndAddOrders().catch(logger.log), 500)
    } catch (e) {
      logger.log(e)
    }
  }

  async function removeAndAddOrders() {
    if (collarWorking) return
    collarWorking = true
    try {
      logger.log("removeAndAddOrders", {indexPrice, lastPrice, lastSide})
      let {toBeAdded, toBeRemoved} = getOrdersToBeAddedAndDeleted()
      const newOrders = toBeAdded.filter(each => each.price > 0).map(each => newOrder(each.side, each.price, config.quantity))
      let patch = []
      if (toBeRemoved.length) patch.push({op: 'remove', value: toBeRemoved.map(order => order.uuid)})
      if (newOrders.length) patch.push({op: 'add', value: newOrders})
      if (patch.length) {
        logger.log("sending patch", "add", newOrders.map(order => order.price), "remove", toBeRemoved.map(order => order.uuid))
        zka.socket.send({method: "PATCH", uri: "/order", body: patch})
        // await zka.rest.patch("/order", {}, patch)
      }
    } catch (e) {
      logger.log(e)
    }
    collarWorking = false
  }

  function sendOrders(patch) {
    if (patch && patch.length) {
      logger.log("sending patch", patch)
      zka.socket.send({method: "PATCH", uri: "/order", body: patch})
    }
  }

  function getOrdersToBeAddedAndDeleted() {
    if (instrument().topic) {
      if (indexPrice) return collarStrategy.getOrdersToBeAddedAndDeleted(Object.values(orders), indexPrice)
      else return {toBeAdded: [], toBeRemoved: []}
    } else {
      return collarStrategy.getOrdersToBeAddedAndDeleted(Object.values(orders), lastPrice, lastSide)
    }
  }

// socket connections ##########################################################################################
  function listen() {
    const eventMap = {
      config: onConfig,
      reconnect: onReconnect,
      connect_error: onConnectEvent,
      connect_timeout: onConnectEvent,
      disconnect: onConnectEvent,
      reconnect_error: onConnectEvent,
      reconnect_failed: onConnectEvent,
      order_error: onError,
      order_add: onOrderAdd,
      order_del: onOrderDel,
      order_patch: onOrderPatch,
      account: myMessageReceived,
      server_time: onNtp,
      instruments: updateInstruments,
      order_execution: onExecution,
      trade: onTrade,
      index: onIndex,
      difforderbook: onDiffOrderBook,
    }
    Object.keys(eventMap).forEach(function (event) {
      zka.socket.removeAllListeners(event)
      zka.socket.on(event, eventMap[event])
    })
  }

  function onDiffOrderBook(difforderbook) {
    if(difforderbook.instrument !== instrument().id) return
    if(Date.now() < timestamp + 30000) return
    timestamp = Date.now()
    console.log('ema', ema, ', bid', difforderbook.bid, ', ask', difforderbook.ask, ', qty', config.quantity)
    if (!ema || config.strategy != 'EMA') return console.log('Returning ema:', ema, ', strategy:', config.strategy)
    setTimeout(() => sendEMAOrders(difforderbook), 100)
  }

  function sendEMAOrders(difforderbook) {
    const qty = config.quantity + ((Math.random()*config.quantity/10).toFixed(2) - 0)
    let patch = []
    if(Object.keys(orders).length > 0) patch.push({op: 'remove', value: Object.keys(orders)})
    if (difforderbook.bid > ema) patch.push({op: 'add', value: [newOrder('sell', difforderbook.bid, qty)]})
    if (difforderbook.ask < ema) patch.push({op: 'add', value: [newOrder('buy', difforderbook.ask, qty)]})
    sendOrders(patch)
  }

  function onOrderAdd(response) {
    const resultOrders = response.result
    for (let i = 0; i < resultOrders.length; i++) {
      const order = resultOrders[i]
      if (order.instrument !== config.instrumentId) continue
      orders[order.uuid] = order
    }
  }

  function onOrderDel(response) {
    delete orders[response.result]
  }

  const PATCH_OPS = {
    remove: onOrderDel,
    add: onOrderAdd,
  }

  function onOrderPatch(response) {
    const result = response.result
    for (let i = 0; i < result.length; i++) {
      const eachResponse = result[i]
      if (eachResponse.error) return logger.log(eachResponse.error)
      PATCH_OPS[eachResponse.op]({result: eachResponse.response})
    }
  }

  function onConfig(data) {
    leverjConfig = data
  }

  function onReconnect(data) {
    logger.log('exchange', 'reconnected')
    zka.socket.register()
  }

  function onConnectEvent(data) {
    logger.log('exchange', 'onConnectEvent', data instanceof Error ? data.message : data)
  }

  function onError(data) {

  }

  function myMessageReceived(data) {
    if (!data.accountDetails || !data.accountDetails.orders) return
    orders = data.accountDetails.orders[config.instrumentId]
  }

  function onNtp(data) {
  }

  function updateInstruments(data) {
  }

  function doNothing() {
  }

  function printConfig() {
    let config1 = Object.assign({}, config)
    config1.secret = "##############################"
    logger.log(config1)
  }

  // Random Strategy ##########################################################################################
  function doRandomStrategy() {
    setInterval(createRandomOrders, config.createInterval)
    setInterval(cancelRandomOrders, config.cancelInterval)
  }

  async function createRandomOrders() {
    if (leverjConfig.maintenance || leverjConfig.tradingDisabled) return
    try {
      let bid = randomPrice(indexPrice || lastPrice, 1)
      let ask = randomPrice(indexPrice || lastPrice , -1)
      let buy = newOrder('buy', applyRange(bid, config.priceRange), randomQty(config.quantity))
      let sell = newOrder('sell', applyRange(ask, config.priceRange), randomQty(config.quantity))
      zka.rest.post('/order', {}, [buy, sell]).catch(logger.log)
    } catch (e) {
      logger.log(e)
    }
  }

  function randomPrice(price, sign) {
    sign = sign || Math.random() < 0.5 ? -1 : +1
    let delta = price * (1 + sign * Math.random() * SKEW)
    delta = Math.round(delta * 1000000) / 1000000
    return delta
  }

  function randomQty(qty) {
    let sign = Math.random() < 0.5 ? -1 : +1
    return qty * (1 + sign * Math.random() * 2 * SKEW)
  }

  function applyRange(number, range) {
    let sign = Math.random() >= 0.5 ? 1 : -1
    let randomRange = Math.random() * range
    return number + sign * randomRange
  }

  async function cancelRandomOrders() {
    let orderList = await zka.rest.get('/order')
    logger.log('total orders', orderList.length)
    if (orderList.length > config.max) {
      let toBeRemoved = orderList.slice(config.min, config.min + 100)
      await zka.rest.patch("/order", {}, [{op: 'remove', value: toBeRemoved.map(order => order.uuid)}])
    }
  }


  function instrument() {
    return instruments[config.instrumentId]
  }

  start().catch(logger.log)
})().catch(logger.log)
