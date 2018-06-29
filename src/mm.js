const config             = require("./dev-config")
const zka                = require("zka")(config.baseUrl, "/api/v1")
const rest               = require('rest.js')
const orderAuthenticator = require("@leverj/leverj-common/OrderAuthentication")
const _                  = require('lodash')

module.exports = (async function () {
  let instruments  = {}
  let leverjConfig = {}
  let readOnly     = false
  let orders       = {}

  async function start() {
    printConfig()
    zka.init(config.accountId, config.apiKey, config.secret)
    zka.socket.register()
    let allConfig = await zka.rest.get('/all/config')
    leverjConfig  = allConfig.config
    instruments   = allConfig.instruments
    listen()
    setInterval(periodicReadOKX, config.createInterval)
    setInterval(cancelOrders, config.cancelInterval)
  }

  async function periodicReadOKX() {
    if (readOnly) return
    try {
      let okx  = (await rest.get("https://www.okex.com/api/v1/depth.do?symbol=lev_eth")).body
      let bid  = okx.bids[0][0]
      let ask  = okx.asks[okx.asks.length - 1][0]
      let buy  = newOrder('buy', applyRange(bid, config.priceRange), config.quantity)
      let sell = newOrder('sell', applyRange(ask, config.priceRange), config.quantity)
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

  function newOrder(side, price, quantity) {
    let order       = {
      orderType : 'LMT',
      side,
      price     : price.toFixed(instrument().significantEtherDigits) - 0,
      quantity  : quantity.toFixed(instrument().significantTokenDigits) - 0,
      timestamp : Date.now() * 1e3,
      accountId : config.accountId,
      token     : instrument().address,
      instrument: instrument().symbol
    }
    order.signature = orderAuthenticator.sign(order, instrument().decimals, config.secret)
    return order
  }

  async function cancelOrders() {
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
    orders = data.orders && data.orders[config.symbol] || orders
  }

  function onNtp(data) {
  }

  function updateInstruments(data) {
  }

  function doNothing() {
  }

  function printConfig() {
    let config1    = Object.assign({}, config)
    config1.secret = "##############################"
    console.log(config1)
  }

  start().catch(console.error)
})().catch(console.error)
