const fs = require('fs')
const affirm = require('affirm.js')

module.exports = (function () {
  const secretPath = process.argv[2];
  const secret = JSON.parse(fs.readFileSync(secretPath))
  const strategy = process.env.STRATEGY || "COLLAR"
  affirm(strategy === "COLLAR" || strategy === "RANDOM", "INVALID strategy: " + strategy)
  return {
    baseUrl: process.env.BASE_URL || "http://localhost:9000",
    accountId: secret.accountId,
    apiKey: secret.apiKey,
    secret: secret.secret,
    symbol: process.env.SYMBOL || 'LEVETH',
    max: (process.env.MAX || 30) - 0,
    min: (process.env.MIN || 15) - 0,
    priceRange: (process.env.PRICE_RANGE || 0.00001) - 0,
    createInterval: (process.env.CREATE_INTERVAL || 30) * 1000,
    cancelInterval: (process.env.CANCEL_INTERVAL || 40) * 1000,
    quantity: (process.env.QUANTITY || 100) - 0,
    depth: (process.env.DEPTH || 4) - 0,
    step: (process.env.STEP || 0.000001) - 0,
    spread: (process.env.SPREAD || 0.00001) - 0,
    startPrice: (process.env.START_PRICE || 0.00006) - 0,
    startSide: process.env.START_SIDE || "buy",
    strategy
  }
})()
