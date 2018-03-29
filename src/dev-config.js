const fs = require('fs')

module.exports = (function () {
  const secretPath = process.argv[2];
  const secret     = JSON.parse(fs.readFileSync(secretPath))
  return {
    baseUrl:  process.env.BASE_URL || "http://localhost:9000",
    accountId: secret.accountId,
    apiKey : secret.apiKey,
    secret : secret.secret,
    symbols : ['LEVETH', 'ETHUSDT'],
    max: process.env.MAX || 30,
    min: process.env.MIN || 15,
    createInterval: (process.env.CREATE_INTERVAL || 3)*1000,
    cancelInterval: (process.env.CANCEL_INTERVAL || 4)*1000,
    exchangeSymbolMap : {
      "okex" : {
        "LEVETH" : "lev_eth",
        "ETHUSDT" : "eth_usdt",
      },
    },
  }
})()
