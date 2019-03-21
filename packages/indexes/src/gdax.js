module.exports = (function () {
  var WebSocket = require('ws');
  var util      = require('util')
  var gdax      = require('./feeder')('gdax')
  var ws
  gdax.reconnect = function () {
    require('./wsReconnect').reconnect(ws, init)
  }

  function init() {
    try {
      ws = new WebSocket("wss://ws-feed.gdax.com");
      ws.on('open', function open() {
        try {
          util.log('gdax: connected')
          var subscriptionMessage = {
            "type"      : "subscribe",
            "product_id": "BTC-USD"
          }
          ws.send(JSON.stringify(subscriptionMessage))
        } catch (e) {
          util.log(e)
        }
      });
      ws.on('error', function (e) {
        util.log('gdax connection failure.', e)
      })
      ws.onmessage = function (msg) {
        try {
          var message = JSON.parse(msg.data)
          if (message.type !== 'match') return
          gdax.priceReceived(message.price)
        } catch (e) {
          util.log(e)
        }
      }
    } catch (e) {
      util.log(e)
    }
  }

  init()
  return gdax
})
