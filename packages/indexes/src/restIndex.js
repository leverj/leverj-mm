var rest     = require('rest.js')
var affirm   = require('affirm.js')
var url      = require('url')
var util     = require('util')
var Emitter  = require('events').EventEmitter
var _        = require('lodash')
var config   = require('config')

module.exports = function (restProvider) {
  var DEFAULT_FREQUENCY = 1000
  var MINUTE            = 60 * 1000
  var index             = _.assign({}, restProvider)
  affirm(index.url && url.parse(index.url), 'Invalid provider url')
  affirm(index.path && Array.isArray(index.path), 'path must be an array')
  affirm(restProvider.name, 'rest provider name is not defined')

  var emitter = new Emitter()
  var restPrice

  index.on   = emitter.on.bind(emitter)
  index.once = emitter.once.bind(emitter)

  index.getPrice = async function() {
    var response
    try {
      response = await rest.get(index.url, { 'User-Agent': 'restjs' })
      affirm(response && response.body, 'Invalid response: ' + response.statusCode)
      var data = response.body
      if (typeof data === 'string') data = JSON.parse(data)
      var price = getPriceUsingPath(data, index.path) - 0
      affirm(!isNaN(price) && price !== Infinity && price !== null && price > 0, 'Invalid price[' + price + "]")
      restPrice = { type: "rest", "name": restProvider.name, price: price, time: Date.now() }
      emitter.emit('price', restPrice)
      return price
    } catch (e) {
      util.log(response && response.statusCode, restProvider.name, e.stack)
      if (!restPrice || !restPrice.time) return undefined
      if (Date.now() - restPrice.time > config.expiryTime * MINUTE) {
        restPrice.expired = true
      }
      return restPrice
    }
  }

  function getPriceUsingPath(data, path) {
    if (path.length === 0) return data
    var key = path[0]
    path    = path.slice(1)
    data    = data[key]
    affirm(data, 'key [' + key + '] not found in data retrieved from provider. ' + JSON.stringify(data))
    return getPriceUsingPath(data, path)
  }

  index.getPrice()
  setInterval(index.getPrice, restProvider.frequency || DEFAULT_FREQUENCY)

  return index
}
