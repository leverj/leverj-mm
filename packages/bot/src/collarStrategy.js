const {affirm} = require('@leverj/affirm')
const sinful = require("@leverj/sinful-math")

module.exports = function () {
  const fixed = {}
  let config
  const BUY = "buy"
  const SELL = "sell"
  const affirmPositive = (num, name) => affirm(!isNaN(num) && num > 0, `${name} must be positive number`)
  const action = (side) => side === BUY ? sinful.sub : sinful.add

  fixed.setConfig = function (_config = {}) {
    affirmPositive(_config.depth, "depth")
    affirmPositive(_config.step, "step")
    affirmPositive(_config.spread, "spread")
    config = _config
  }

  fixed.getOrdersToBeAddedAndDeleted = function temp(orders, price, side) {
    affirm(config, "config is not set")
    affirm(Array.isArray(orders), "Orders must be an array: " + orders)
    affirm(side === BUY || side === SELL || side === undefined, "Invalid side: " + side)
    affirmPositive(price, "price")
    const currentBook = getCurrentBook(orders)
    const duplicates = getDuplicates(orders, currentBook)
    const newBook = createNewBook(price, side)
    const cancels = getCancels(currentBook, newBook)
    const creates = getCreates(currentBook, newBook)
    return {toBeAdded: creates, toBeRemoved: cancels.concat(duplicates)}
  }

  function getDuplicates(orders, currentBook) {
    const duplicates = []
    orders.forEach(order => {
      if (currentBook[order.side][order.price] === order) return
      duplicates.push(order)
    })
    return duplicates
  }

  function getCurrentBook(orders) {
    affirm(Array.isArray(orders), 'orders must be an array')
    const ordersBySide = {[BUY]: {}, [SELL]: {}}
    orders.forEach(order => {
      if (order.side === BUY) ordersBySide[BUY][order.price] = order
      if (order.side === SELL) ordersBySide[SELL][order.price] = order
    })
    return ordersBySide
  }

  function createNewBook(price, side) {
    affirmPositive(price, 'price')
    const [buyPrice, sellPrice] = getNewPrice(price, side)
    const buys = getBook(buyPrice, BUY)
    const sells = getBook(sellPrice, SELL)
    return {[BUY]: buys, [SELL]: sells}
  }

  function getNewPrice(price, side) {
    let buyPrice
    if (side === BUY) {
      buyPrice = sinful.sub(price, config.step)
    } else if (side === SELL) {
      buyPrice = sinful.sub(price, sinful.sub(config.spread, config.step))
    } else {
      buyPrice = sinful.sub(price, sinful.sub(sinful.div(config.spread, 2)))
    }
    const sellPrice        = sinful.add(buyPrice, config.spread)
    const premium          = 1 + (config.premium || 0)/100
    const premiumBuyPrice  = sinful.mul(buyPrice, premium)
    const premiumSellPrice = sinful.mul(sellPrice, premium)

    return [premiumBuyPrice, premiumSellPrice]
  }

  function getCancels(currentBook, newBook) {
    const d1 = subtract(currentBook[BUY], newBook[BUY])
    const d2 = subtract(currentBook[SELL], newBook[SELL])
    return d1.concat(d2)
  }

  function getCreates(currentBook, newBook) {
    const d1 = subtract(newBook[BUY], currentBook[BUY])
    const d2 = subtract(newBook[SELL], currentBook[SELL])
    return d1.concat(d2)
  }

  function subtract(map1, map2) {
    const difference = []
    Object.keys(map1).forEach(key => {
      if (!map2[key]) difference.push(map1[key])
    })
    return difference
  }

  function getBook(StartPrice, side, depth = config.depth) {
    const book = {}
    for (let i = 0; i < depth; i++) {
      let price = action(side)(StartPrice, sinful.mul(i, config.step));
      book[price] = {side, price: price}
    }
    return book
  }

  return fixed
}()