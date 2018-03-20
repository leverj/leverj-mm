const fs = require('fs')

module.exports = (function () {
  const secretPath = process.argv[2];
  const secret     = JSON.parse(fs.readFileSync(secretPath))
  return {
    baseUrl:  process.env.BASE_URL || "http://localhost:9000",
    accountId: secret.accountId,
    apiKey : secret.apiKey,
    secret : secret.secret,
    symbol : 'LEVETH',
    max: process.env.MAX || 30,
    min: process.env.MIN || 15,
    createInterval: (process.env.CREATE_INTERVAL || 30)*1000,
    cancelInterval: (process.env.CANCEL_INTERVAL || 40)*1000,
  }
})()
