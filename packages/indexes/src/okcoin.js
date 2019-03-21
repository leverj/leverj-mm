module.exports = (function () {
  var WebSocket    = require('ws');
  var util         = require('util')
  var affirm       = require('affirm.js')
  var okcoin       = require('./feeder')('okcoin')
  var ws
  okcoin.reconnect = function () {
    require('./wsReconnect').reconnect(ws, init)
  }
  function init() {
    try {
      ws = new WebSocket("wss://real.okcoin.com:10440/websocket/okcoinapi");
      ws.on('open', function open() {
        try {
          util.log('okcoin: connected')
          var subscriptionMessage = { 'event': 'addChannel', 'channel': 'ok_sub_spotusd_btc_ticker' }
          ws.send(JSON.stringify(subscriptionMessage))
        } catch (e) {
          util.log(e)
        }
      });
      ws.on('error', function (e) {
        util.log('okcoin connection failure.', e)
      })
      ws.onmessage = function (msg) {
        try {
          var message = JSON.parse(msg.data)
          if (!message[0] && message[0].channel === 'ok_sub_spotusd_btc_ticker') return
          if (message[0].success === 'true') util.log('okcoin: subscribed to trades')
          if (message[0].data) okcoin.priceReceived(message[0].data.last)
        } catch (e) {
          util.log(e)
        }
      }
    } catch (e) {
      util.log(e)
    }
  }

  init()
  return okcoin
})
