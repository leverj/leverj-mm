const config = require("./config")
const zka = require("zka")(config.baseUrl, "/api/v1")
const rest = require('rest.js')
const orderAuthenticator = require("@leverj/leverj-common/OrderAuthentication")
const _ = require('lodash')
const collarStrategy = require('./collarStrategy')

module.exports = (async function () {
  const SKEW = 0.2
  let instruments = {}
  let leverjConfig = {}
  let readOnly = false
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
      if(order.instrument === config.symbol)
        orders[order.uuid] = order
    })
    listen()
    await setLastPriceAndSide()
    strategy[config.strategy]()
  }


  function newOrder(side, price, quantity) {
    let order = {
      orderType: 'LMT',
      side,
      price: price.toFixed(instrument().significantEtherDigits) - 0,
      quantity: quantity.toFixed(instrument().significantTokenDigits) - 0,
      timestamp: Date.now() * 1e3,
      accountId: config.accountId,
      token: instrument().address,
      instrument: instrument().symbol
    }
    order.signature = orderAuthenticator.sign(order, instrument().decimals, config.secret)
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
    console.log(formattedDate(), 'last price and side', price, side)
  }

// collar strategy ##########################################################################################
  let collarWorking, lastPrice, lastSide

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
      collarTimer = setTimeout(() => removeAndAddOrders().catch(console.error), 500)
    } catch (e) {
      console.error(e)
    }
  }

  async function removeAndAddOrders() {
    if (collarWorking) return
    collarWorking = true
    try {
      console.log(formattedDate(), "removeAndAddOrders", lastPrice, lastSide)
      let {toBeAdded, toBeRemoved} = collarStrategy.getOrdersToBeAddedAndDeleted(Object.values(orders), lastPrice, lastSide);
      const newOrders = toBeAdded.map(each => newOrder(each.side, each.price, config.quantity))
      let patch = []
      if (toBeRemoved.length) patch.push({op: 'remove', value: toBeRemoved.map(order => order.uuid)})
      if (newOrders.length) patch.push({op: 'add', value: newOrders})
      if (patch.length) {
        console.log(formattedDate(), "sending patch", "add", newOrders.map(order=> order.price), "remove", toBeRemoved.map(order => order.uuid))
        await zka.rest.patch("/order", {}, patch)
      }
    } catch (e) {
      console.error(e)
    }
    collarWorking = false
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
      if (eachResponse.error) return console.log(eachResponse.error)
      PATCH_OPS[eachResponse.op]({result: eachResponse.response})
    }
  }

  function onReadOnly(data) {
    readOnly = data.readonly
  }

  function onReconnect(data) {
    zka.socket.register()
  }

  function onConnectEvent(data) {
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
    console.log(config1)
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
      zka.rest.post('/order', {}, [buy, sell]).catch(console.error)
    } catch (e) {
      console.error(e)
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
    console.log(orderList.length)
    if (orderList.length > config.max) {
      let toBeRemoved = orderList.slice(config.min, config.min + 100)
      await zka.rest.patch("/order", {}, [{op: 'remove', value: toBeRemoved.map(order => order.uuid)}])
    }
  }


  function instrument() {
    return instruments[config.symbol]
  }

  start().catch(console.error)
})().catch(console.error)
