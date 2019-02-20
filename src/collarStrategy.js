const affirm = require('affirm.js')
const sinful = require("sinful-math.js")

module.exports = function () {
  const fixed = {}
  let config
  const BUY = "buy"
  const SELL = "sell"
  const buySort = (a, b) => b.price - a.price
  const sellSort = (a, b) => a.price - b.price
  const affirmPositive = (num, name) => affirm(!isNaN(num) && num > 0, `${name} must be positive number`)
  const action = (side) => side === BUY ? sinful.sub : sinful.add

  fixed.setConfig = function (_config = {}) {
    affirmPositive(_config.depth, "depth")
    affirmPositive(_config.step, "step")
    affirmPositive(_config.spread, "spread")
    config = _config
  }

  fixed.getOrdersToBeAddedAndDeleted = function (orders, executionPrice, executionSide) {
    affirm(config, "config is not set")
    affirm(Array.isArray(orders), "Orders must be an array: " + orders)
    affirm(executionSide === BUY || executionSide === SELL, "Invalid executionSide: " + executionSide)
    affirmPositive(executionPrice, "executionPrice")
    const [buys, sells] = getBuyAndSellOrders(orders)
    if (buys.length && executionSide === BUY && buys[0].price >= executionPrice) return padBook(buys, sells, executionPrice, executionSide)
    if (sells.length && executionSide === SELL && sells[0].price <= executionPrice) return padBook(buys, sells, executionPrice, executionSide)
    if (executionSide === BUY && buys.length && buys[0].price <= executionPrice) {
      let price = sinful.add(buys[0].price, config.spread)
      const toBeAdded = sells.length && sells[0].price > price ? [{side: SELL, price}] : undefined
      return padBook(buys, sells, executionPrice, executionSide, toBeAdded)
    }
    if (executionSide === SELL && sells.length && sells[0].price >= executionPrice) {
      let price = sinful.sub(sells[0].price, config.spread);
      const toBeAdded = buys.length && buys[0].price < price ? [{side: BUY, price: price}] : undefined
      return padBook(buys, sells, executionPrice, executionSide, toBeAdded)
    }
    return padBook(buys, sells, executionPrice, executionSide)
  }

  function padBook(buys, sells, executionPrice, executionSide, toBeAdded = [], toBeRemoved = []) {
    affirm(Array.isArray(buys), "buys must be an array")
    affirm(Array.isArray(sells), "sells must be an array")
    affirmPositive(executionPrice, "executionPrice")
    affirm(executionSide === BUY || executionSide === SELL, "Invalid executionSide: " + executionSide)
    affirm(Array.isArray(toBeAdded), "toBeAdded must be an array")
    affirm(Array.isArray(toBeRemoved), "toBeRemoved must be an array")

    const buyPads = pad(buys, BUY, executionPrice, executionSide)
    const sellPads = pad(sells, SELL, executionPrice, executionSide)
    return {
      toBeAdded: toBeAdded.concat(buyPads.toBeAdded).concat(sellPads.toBeAdded),
      toBeRemoved: toBeRemoved.concat(buyPads.toBeRemoved).concat(sellPads.toBeRemoved)
    }
  }


  function pad(orders, side, executionPrice, executionSide) {
    let toBeRemoved = []
    let toBeAdded = []
    const remaining = config.depth - orders.length
    let price
    if (orders.length) {
      price = action(side)(orders[orders.length - 1].price, config.step)
    } else {
      const sellDiff = executionSide === SELL ? config.step : sinful.sub(config.spread, config.step)
      const sellPrice = sinful.add(executionPrice, sellDiff)
      const buyPrice = sinful.sub(sellPrice, config.spread)
      price = side === BUY ? buyPrice : sellPrice
    }
    if (remaining > 0) {
      toBeAdded = getBook(price, side, remaining)
    } else if (remaining < 0) {
      toBeRemoved = orders.slice(config.depth)
    }
    return {toBeAdded, toBeRemoved}
  }


  function getBuyAndSellOrders(orders) {
    const buys = [], sells = []
    orders.forEach(order => {
      if (order.side === BUY) buys.push(order)
      else if (order.side === SELL) sells.push(order)
      else throw new Error("Order does not have a side." + JSON.stringify(order))
    })
    buys.sort(buySort)
    sells.sort(sellSort)
    return [buys, sells]
  }

  function getBook(price, side, depth = config.depth) {
    const book = []
    for (let i = 0; i < depth; i++) {
      book.push({side, price: action(side)(price, sinful.mul(i, config.step))})
    }
    return book
  }

  return fixed
}()