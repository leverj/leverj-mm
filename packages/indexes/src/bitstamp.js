module.exports = (function () {
  var bluebird         = require('bluebird')
  var Pusher           = require('pusher-client')
  var pusher, lastTime = Date.now()
  var bitstamp         = require('./feeder')('bitstamp')

  bitstamp.reconnect = function () {
    init()
  }

  function init() {
    if (pusher){
      var state = pusher.connection.state
      util.log('###### bitstamp status', state)
      if(state === 'unavailable' || state === 'failed' || state === 'disconnected')
        pusher.disconnect()
      else return
    }
    pusher = new Pusher('de504dc5763aeef9ff52')
    pusher.connection.bind('error', function (err) {
      util.log('PUSHER ERR', err)
    })

    pusher.connection.bind('disconnected', function (err) {
      util.log('PUSHER DISCONNECT', err)
    })

    var channel = pusher.subscribe('live_trades')

    channel.bind('trade', bluebird.coroutine(function*(data) {
      lastTime = Date.now()
      bitstamp.priceReceived(data.price)
    }))
  }

  init()
  return bitstamp
})
