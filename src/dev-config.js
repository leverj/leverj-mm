const fs = require('fs')

module.exports = (function () {
  const secretPath = process.argv[2];
  const secret     = JSON.parse(fs.readFileSync(secretPath))
  return {
    baseUrl       : process.env.BASE_URL || "http://localhost:9000",
    accountId     : secret.accountId,
    apiKey        : secret.apiKey,
    secret        : secret.secret,
    symbol        : process.env.SYMBOL || 'LEVETH',
    max           : (process.env.MAX || 30) - 0,
    min           : (process.env.MIN || 15) - 0,
    priceRange    : (process.env.PRICE_RANGE || 0.00001) - 0,
    createInterval: (process.env.CREATE_INTERVAL || 30) * 1000,
    cancelInterval: (process.env.CANCEL_INTERVAL || 40) * 1000,
    quantity      : (process.env.QUANTITY || 0.1) - 0,
  }
})()
