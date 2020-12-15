const fs = require('fs')
const affirm = require('affirm.js')
const config = require('config')
module.exports = (function () {
  const secretPath = process.argv[2]
  const secret = JSON.parse(fs.readFileSync(secretPath))
  const app = config.app
  affirm(app === 'spot' || app === 'futures', `BOT_APP must be spot or futures. found ${app}`)
  const _config = config[app]
  console.log('strats', config['strats'])
  affirm(config['strats'][_config.strategy], "INVALID strategy: " + _config.strategy)
  affirm(_config.startSide === "buy" || _config.startSide === "sell", "INVALID start side: " + _config.startSide)
  return {
    app: app,
    baseUrl: _config.baseUrl,
    accountId: secret.accountId,
    apiKey: secret.apiKey,
    secret: secret.secret,
    instrumentId: _config.instrumentId,
    max: _config.max - 0,
    min: _config.min - 0,
    priceRange: _config.priceRange - 0,
    createInterval: _config.createInterval * 1000,
    cancelInterval: _config.cancelInterval * 1000,
    quantity: _config.quantity - 0,
    depth: _config.depth - 0,
    step: _config.step - 0,
    spread: _config.spread - 0,
    startPrice: _config.startPrice - 0,
    startSide: _config.startSide,
    strategy: _config.strategy,
    apiPath: _config.apiPath,
    socketPath: _config.socketPath,
    premium: (_config.premium || 0) - 0,
    leverage: (_config.leverage || 0) - 0
  }
})()
