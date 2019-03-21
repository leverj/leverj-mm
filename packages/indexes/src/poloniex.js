module.exports = (function () {
  var autobahn = require('autobahn');
  var poloniex = require('./feeder')('poloniex')

  poloniex.reconnect = function () {
    // require('./wsReconnect').reconnect(ws, init)
  }

  function init() {
    try {
      var connection     = new autobahn.Connection({
        url        : "wss://api.poloniex.com",
        realm      : "realm1",
        max_retries: -1
      });
      connection.onopen  = function (session) {
        util.log('poloniex connected')
        session.subscribe('ticker', function tickerEvent(ticker) {
          if (ticker[0] === 'USDT_BTC') {
            poloniex.priceReceived(ticker[1])
          }
        });
      }
      connection.onclose = function () {
        util.log("Websocket connection closed");
      }
      connection.open();
    } catch (e) {
      util.log(e)
    }
  }

  init()
  return poloniex
})
