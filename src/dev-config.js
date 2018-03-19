const fs = require('fs')

module.exports = (function () {
  const secretPath = process.argv[2];
  const secret     = JSON.parse(fs.readFileSync(secretPath))
  const baseUrl = process.env.BASE_URL || "http://localhost:9000"
  return {
    baseUrl: baseUrl,
    accountId: secret.accountId,
    apiKey : secret.apiKey,
    secret : secret.secret,
    symbol : 'LEVETH'
  }
})()
