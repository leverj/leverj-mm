module.exports = (function () {
  var WebSocket = require('ws');
  var util      = require('util')
  var affirm    = require('affirm.js')
  var rest      = require('rest.js')
  var gemini    = require('./feeder')('gemini')
  var ws

  gemini.reconnect = function () {
    updatePriceFromTicker()
    require('./wsReconnect').reconnect(ws, init)
  }

  function updatePriceFromTicker() {
    rest.get("https://api.gemini.com/v1/pubticker/btcusd", { "Content-Type": "application/json" }).then(function (ticker) {
      gemini.priceReceived(ticker.body.last)
    })
  }

  function init() {
    try {
      updatePriceFromTicker()
      ws = new WebSocket("wss://api.gemini.com/v1/marketdata/btcusd");
      ws.on('open', function open() {
        try {
          util.log('gemini: connected')
        } catch (e) {
          util.log(e)
        }
      });
      ws.on('error', function (e) {
        util.log('gemini connection failure', e)
      })
      ws.onmessage = function (msg) {
        try {
          var message = JSON.parse(msg.data)
          // util.log(JSON.stringify(message))
          message.events.forEach(event => {
            if (event.type === 'trade') {
              gemini.priceReceived(event.price)
            }
          })
        } catch (e) {
          util.log(e)
        }
      }
    } catch (e) {
      util.log(e)
    }
  }

  init()
  return gemini
})
