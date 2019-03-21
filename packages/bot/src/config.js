const fs = require('fs')
const affirm = require('affirm.js')
const config = require('config')
module.exports = (function () {
  const secretPath = process.argv[2];
  const secret = JSON.parse(fs.readFileSync(secretPath))
  affirm(config.strategy === "COLLAR" || config.strategy === "RANDOM", "INVALID strategy: " + config.strategy)
  affirm(config.startSide === "buy" || config.startSide === "sell", "INVALID start side: " + config.startSide)
  return {
    baseUrl: config.baseUrl,
    accountId: secret.accountId,
    apiKey: secret.apiKey,
    secret: secret.secret,
    symbol: config.symbol,
    max: config.max - 0,
    min: config.min - 0,
    priceRange: config.priceRange - 0,
    createInterval: config.createInterval * 1000,
    cancelInterval: config.cancelInterval * 1000,
    quantity: config.quantity - 0,
    depth: config.depth - 0,
    step: config.step - 0,
    spread: config.spread - 0,
    startPrice: config.startPrice - 0,
    startSide: config.startSide,
    strategy: config.strategy
  }
})()
