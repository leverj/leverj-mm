var util      = require("util")
var config    = require('config')
var affirm    = require('affirm.js')
global.Promise = require('bluebird')

module.exports = (function () {

  process.on('uncaughtException', (err) => {
    console.log("################################## uncaught exception ######################################")
    console.log(err.stack)
    console.log("################################## uncaught exception ######################################")
  })

  function getSelectedComponents() {
    var selected = process.env.COMPONENTS && process.env.COMPONENTS.split(",") || []
    var selectMap = {}
    var count = 0
    selected.forEach(item => {
      item = item.trim()
      if(!item || !item.length) return
      selectMap[item] = true
      count++
    })
    if(count === 0) return config
    config.components = config.components.filter( x => selectMap[x.name])
    affirm(config.components.length >= config.minExternalProviders, 'minimum ' + config.minExternalProviders + ' components needed')
    console.log('Starting index with', JSON.stringify(Object.keys(selectMap)))
    return config
  }
  var index = require('./index.core')(getSelectedComponents())
})()
