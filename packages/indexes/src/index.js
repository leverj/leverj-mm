var logger = require("@leverj/logger")
var config = require('config')
var affirm = require('affirm.js')
global.Promise = require('bluebird')
const Index = require('./index.core')

module.exports = (function () {

  // process.on('uncaughtException', (err) => {
  //   console.log("################################## uncaught exception ######################################")
  //   logger.log(err)
  //   console.log("################################## uncaught exception ######################################")
  // })

  const indexes = []

  function init() {
    var io = require('socket.io')(config.port)
    for (const enabled of config.enabled) {
      affirm(config.components[enabled.currency], `${enabled.currency} does not exists in config.components`)
      const allProvidersName = config.components[enabled.currency].providers.map(provider => provider.name)
      for (const providerName of enabled.providers) {
        affirm(allProvidersName.includes(providerName), `${providerName} does not exist for currency ${enabled.currency} in config.provider`)
      }
      const currencyConfig = Object.assign({}, config.components[enabled.currency], {
        logExternalPrice: config.logExternalPrice,
        expiryTime: config.expiryTime,
        port: config.port,
        startupDelay: config.startupDelay,
      })
      currencyConfig.providers = currencyConfig.providers.filter(provider => enabled.providers.includes(provider.name))
      const index = Index(currencyConfig, io)
      indexes.push(index)
    }
  }

  init()
  return indexes
})()
