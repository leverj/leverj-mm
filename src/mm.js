const config = require("./dev-config")
const zka    = require("zka")(config.baseUrl, "/api/v1")
const rest   = require('rest.js')
const orderAuthenticator = require("leverj-common/OrderAuthentication")
const _      = require('lodash')

module.exports = (async function () {
  let instruments  = {}
  let leverjConfig = {}
  let readOnly     = false
  let orders       = {}

  async function start() {
    zka.init(config.accountId, config.apiKey, config.secret)
    zka.socket.register()
    let allConfig = await zka.rest.get('/all/config')
    leverjConfig  = allConfig.config
    instruments   = allConfig.instruments
    listen()
    setInterval(periodicReadOKX, 10000)
    setInterval(cancelOrders, 20000)
    // periodicReadOKX().catch(console.error)
  }

  async function periodicReadOKX() {
    if (readOnly) return
    try {
      let okx  = (await rest.get("https://www.okex.com/api/v1/depth.do?symbol=lev_eth")).body
      let bid  = okx.bids[0][0]
      let ask  = okx.asks[okx.asks.length - 1][0]
      let buy  = newOrder('buy', applyRange(bid, 0.00001), applyRange(6, 1))
      let sell = newOrder('sell', applyRange(ask, 0.00001), applyRange(6, 1))
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
      timestamp : Date.now(),
      accountId : config.accountId,
      token     : instrument().address,
      instrument: instrument().symbol
    }
    order.signature = orderAuthenticator.sign(order, instrument().decimals, config.secret)
    return order
  }

  async function cancelOrders() {
    let orderList = await zka.rest.get('/order')
    if (orderList.length > 30) {
      let toBeRemoved = orderList.slice(15)
      await zka.rest.patch("/order", {}, [{op:'remove',value: toBeRemoved.map(order=>order.uuid)}])
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


  start().catch(console.error)
})().catch(console.error)
