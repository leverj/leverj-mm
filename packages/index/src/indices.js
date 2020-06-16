global.Promise = require('bluebird')
const Index = require('./index.core')

module.exports = function () {
  const service = {}
  service.indexes = []

  service.init = function (config, emitter) {
    for (const component of config) {
      const index = Index(component, emitter)
      service.indexes.push(index)
    }
  }

  return service
}()
