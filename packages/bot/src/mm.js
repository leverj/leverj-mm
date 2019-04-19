const config = require("./config")
const zka = require("@leverj/zka")(config.baseUrl, "/api/v1")
const adapter = require("@leverj/adapter/src/OrderAdapter")
const _ = require('lodash')
const collarStrategy = require('./collarStrategy')
const io = require('socket.io-client');
const logger = require("@leverj/logger")

module.exports = (async function () {
  const SKEW = 0.2
  let instruments = {}
  let leverjConfig = {}
  let readOnly = false
  let collarWorking, lastPrice, lastSide
  let indexPrice
  let orders = {}
  const strategy = {
    COLLAR: doCollarStrategy,
    RANDOM: doRandomStrategy
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
      if (order.instrument === config.symbol)
        orders[order.uuid] = order
    })
    connectToIndexes()
    listen()
    await setLastPriceAndSide()
    strategy[config.strategy]()
  }


  function connectToIndexes() {
    const baseUrl = config.socketUrl
    if (!baseUrl) return
    let socket = io(baseUrl, {rejectUnauthorized: true});
    socket.on(config.socketTopic, (_) => {
      if (!_.price) return
      indexPrice = _.price.toFixed(instrument().baseSignificantDigits) - 0
    })
    socket.on("reconnect", onIndexReconnectEvent)
    socket.on("connect_error", onIndexConnectEvent)
    socket.on("connect_timeout", onIndexConnectEvent)
    socket.on("disconnect", onIndexConnectEvent)
    socket.on("reconnect_error", onIndexConnectEvent)
    socket.on("reconnect_failed", onIndexConnectEvent)
  }

  const onIndexReconnectEvent = (data) => logger.log('index', 'reconnected')
  const onIndexConnectEvent = (data) => {
    indexPrice = undefined
    logger.log('index', 'onConnectEvent', data instanceof Error ? data.message : data)
  }

  function newOrder(side, price, quantity) {
    let order = {
      orderType: 'LMT',
      side,
      price: price.toFixed(instrument().baseSignificantDigits) - 0,
      quantity: quantity.toFixed(instrument().quoteSignificantDigits) - 0,
      timestamp: Date.now() * 1e3,
      accountId: config.accountId,
      token: instrument().address,
      instrument: instrument().symbol
    }
    order.signature = adapter.sign(order, instrument(), config.secret)
    return order
  }

  async function setLastPriceAndSide() {
    const trades = await zka.rest.get(`/contract/${config.symbol}/trade`)
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

// collar strategy ##########################################################################################


  async function doCollarStrategy() {
    collarStrategy.setConfig(config)
    setInterval(delayedRemoveAndAddOrders, 20000)
  }

  function onTrade({instrument, price, side}) {
    if (instrument !== config.symbol) return
    setPriceAndSide(price, side)
    delayedRemoveAndAddOrders()
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
      const newOrders = toBeAdded.filter(each=>each.price > 0).map(each => newOrder(each.side, each.price, config.quantity))
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

  function getOrdersToBeAddedAndDeleted() {
    if (config.socketUrl) {
      if (indexPrice) return collarStrategy.getOrdersToBeAddedAndDeleted(Object.values(orders), indexPrice)
      else return {toBeAdded: [], toBeRemoved: []}
    } else {
      return collarStrategy.getOrdersToBeAddedAndDeleted(Object.values(orders), lastPrice, lastSide);
    }
  }

// socket connections ##########################################################################################
  function listen() {
    const eventMap = {
      readonly: onReadOnly,
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
    };
    Object.keys(eventMap).forEach(function (event) {
      zka.socket.removeAllListeners(event)
      zka.socket.on(event, eventMap[event])
    })
  }

  function onOrderAdd(response) {
    const resultOrders = response.result;
    for (let i = 0; i < resultOrders.length; i++) {
      const order = resultOrders[i];
      if (order.instrument !== config.symbol) continue
      orders[order.uuid] = order
    }
  }

  function onOrderDel(response) {
    response.result.forEach(uuid => delete orders[uuid])
  }

  const PATCH_OPS = {
    remove: onOrderDel,
    add: onOrderAdd,
  };

  function onOrderPatch(response) {
    const result = response.result;
    for (let i = 0; i < result.length; i++) {
      const eachResponse = result[i];
      if (eachResponse.error) return logger.log(eachResponse.error)
      PATCH_OPS[eachResponse.op]({result: eachResponse.response})
    }
  }

  function onReadOnly(data) {
    readOnly = data.readonly
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
    orders = data.accountDetails.orders[config.symbol]
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
    if (readOnly) return
    try {
      let bid = randomPrice(lastPrice)
      let ask = randomPrice(lastPrice)
      let buy = newOrder('buy', applyRange(bid, config.priceRange), randomQty(config.quantity))
      let sell = newOrder('sell', applyRange(ask, config.priceRange), randomQty(config.quantity))
      zka.rest.post('/order', {}, [buy, sell]).catch(logger.log)
    } catch (e) {
      logger.log(e)
    }
  }

  function randomPrice(price) {
    let sign = Math.random() < 0.5 ? -1 : +1
    let delta = price * (1 + sign * Math.random() * SKEW)
    delta = Math.round(delta * 1000000) / 1000000
    return delta
  }

  function randomQty(qty) {
    let sign = Math.random() < 0.5 ? -1 : +1
    return Math.round(qty * (1 + sign * Math.random() * 2 * SKEW))
  }

  function applyRange(number, range) {
    let sign = Math.random() >= 0.5 ? 1 : -1
    let randomRange = Math.random() * range
    return number + sign * randomRange
  }

  async function cancelRandomOrders() {
    let orderList = await zka.rest.get('/order')
    logger.log(orderList.length)
    if (orderList.length > config.max) {
      let toBeRemoved = orderList.slice(config.min, config.min + 100)
      await zka.rest.patch("/order", {}, [{op: 'remove', value: toBeRemoved.map(order => order.uuid)}])
    }
  }


  function instrument() {
    return instruments[config.symbol]
  }

  start().catch(logger.log)
})().catch(logger.log)
