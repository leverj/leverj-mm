const rest = require('rest.js');
const affirm = require('affirm.js');
const url = require('url');
const logger = require("@leverj/logger");
const Emitter = require('events').EventEmitter;
const _ = require('lodash');
const config = require('config');

module.exports = function (restProvider) {
  const DEFAULT_FREQUENCY = 1000;
  const MINUTE = 60 * 1000;
  const index = _.assign({}, restProvider);
  affirm(index.url() && url.parse(index.url()), 'Invalid provider url')
  affirm(restProvider.name, 'rest provider name is not defined')
  logger.log("restIndex", index.url())
  const emitter = new Emitter();
  let restPrice, working;
  index.on = emitter.on.bind(emitter)
  index.once = emitter.once.bind(emitter)

  index.getPrice = async function () {
    if (working) return
    working = true
    let response;
    try {
      response = await rest.get(index.url(), {'User-Agent': 'restjs'})
      affirm(response && response.body, 'Invalid response: ' + response.statusCode)
      let data = response.body;
      if (typeof data === 'string') data = JSON.parse(data)
      const price = index.price(data)
      affirm(!isNaN(price) && price !== Infinity && price !== null && price > 0, 'Invalid price[' + price + "]")
      restPrice = {type: "rest", "name": restProvider.name, price: price, time: Date.now()}
      emitter.emit('price', restPrice)
      return price
    } catch (e) {
      logger.log(response && response.statusCode, restProvider.name, e.stack)
      if (!restPrice || !restPrice.time) return undefined
      if (Date.now() - restPrice.time > config.expiryTime * MINUTE) {
        restPrice.expired = true
      }
      return restPrice
    } finally {
      working = false
    }
  }

  index.getPrice()
  setInterval(index.getPrice, restProvider.frequency || DEFAULT_FREQUENCY)

  return index
}
