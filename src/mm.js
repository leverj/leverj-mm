const config = require("./dev-config")
const zka    = require("zka")(config.baseUrl, "/api/v1")
const rest   = require('rest.js')
const orderAuthenticator = require("leverj-common/OrderAuthentication")
const _      = require('lodash')
const util = require('util')
const debuglog = util.debuglog('leverj-mm')

module.exports = (async function () {
  let instruments  = {}
  let leverjConfig = {}
  let readOnly     = false
  let orders       = {}

  async function start() {
    debuglog("config:", config)
    zka.init(config.accountId, config.apiKey, config.secret)
    debuglog("zka initialized with accountId:", config.accountId, "apiKey:", config.apiKey, "secret:", config.secret)
    zka.socket.register()
    let allConfig = await zka.rest.get('/all/config')
    leverjConfig  = allConfig.config
    debuglog("leverjConfig", leverjConfig)
    instruments   = allConfig.instruments
    debuglog("instruments", instruments)
    listen()
    for (var i=0; i < config.symbols.length; i++) {
      debuglog("order created every", config.createInterval, "milliseconds")
      let symbol_leverj = config.symbols[i]
      let symbol_okex = config.exchangeSymbolMap["okex"][symbol_leverj]
      debuglog(symbol_leverj, symbol_okex)
      setInterval(function() { periodicReadOKX(symbol_leverj, symbol_okex); }, config.createInterval)
      debuglog("order cancelled every", config.cancelInterval, "milliseconds")
      setInterval(cancelOrders, config.cancelInterval)
    }
  }

  async function periodicReadOKX(symbol_leverj, symbol_okx) {
    debuglog("symbol_leverj", symbol_leverj, "symbol_okx", symbol_okx)
    if (readOnly) return
    try {
      let okx  = (await rest.get("https://www.okex.com/api/v1/depth.do?symbol="+symbol_okx)).body
      let bid  = okx.bids[0][0] // highest bid, top of the book
      let ask  = okx.asks[okx.asks.length - 1][0] // lowest ask, top of the book
      let buy  = newOrder(symbol_leverj, 'buy', applyRange(bid, 0.00001), applyRange(6, 1))
      let sell = newOrder(symbol_leverj, 'sell', applyRange(ask, 0.00001), applyRange(6, 1))
      debuglog(buy)
      debuglog(sell)
      zka.rest.post('/order', {}, [buy, sell]).catch(console.error)
    } catch (e) {
      console.error(e)
    }
  }

  function applyRange(number, range) {
    let sign        = Math.random() >= 0.5 ? 1 : -1
    let randomRange = Math.random() * range
    return number + sign * randomRange
  }

  function newOrder(symbol_leverj, side, price, quantity) {
    let order       = {
      orderType : 'LMT',
      side,
      price     : price.toFixed(instrument(symbol_leverj).significantEtherDigits) - 0,
      quantity  : quantity.toFixed(instrument(symbol_leverj).significantTokenDigits) - 0,
      timestamp : Date.now(),
      accountId : config.accountId,
      token     : instrument(symbol_leverj).address,
      instrument: instrument(symbol_leverj).symbol
    }
    order.signature = orderAuthenticator.sign(order, instrument(symbol_leverj).decimals, config.secret)
    return order
  }

  async function cancelOrders() {
    let orderList = await zka.rest.get('/order')
    if (orderList.length > config.max) {
      let toBeRemoved = orderList.slice(config.min)
      await zka.rest.patch("/order", {}, [{op:'remove',value: toBeRemoved.map(order=>order.uuid)}])
    }
  }


  function instrument(symbol_leverj) {
    return instruments[symbol_leverj]
  }

  function listen() {
    const eventMap = {
      readonly        : onReadOnly,
      reconnect       : onConnect,
      connect_error   : onConnectEvent,
      connect_timeout : onConnectEvent,
      disconnect      : onConnectEvent,
      reconnect_error : onConnectEvent,
      reconnect_failed: onConnectEvent,
      order_error     : onError,
      account         : myMessageReceived,
      server_time     : onNtp,
      instruments     : updateInstruments
    };
    Object.keys(eventMap).forEach(function (event) {
      zka.socket.removeAllListeners(event)
      zka.socket.on(event, eventMap[event])
    })
  }

  function onReadOnly(data) {
    readOnly = data.readonly
  }

  function onConnect(data) {

  }

  function onConnectEvent(data) {
  }

  function onError(data) {

  }

  function myMessageReceived(data) {
    orders = data.orders && data.orders[config.symbols[1]] || orders
  }

  function onNtp(data) {
  }

  function updateInstruments(data) {
  }

  function doNothing() {
  }


  start().catch(console.error)
})().catch(console.error)
