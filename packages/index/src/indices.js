global.Promise = require('bluebird')
const Index = require('./index.core')

module.exports = function () {
  const service = {}
  service.indices = []

  service.init = function (config, emitter) {
    for (const component of config) {
      const index = Index(component, emitter)
      service.indices.push(index)
    }
  }

  service.reset = function(){
    for (const index of service.indices) {
      index.reset()
    }
  }
  service.stop = function(){
    for (const index of service.indices) {
      index.stop()
    }
    service.indices = []
  }

  return service
}()
