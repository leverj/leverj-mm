const util = require('util')

module.exports = function () {
  const logger = {}
  logger.getDebugLogger = function (set) {
    let debugLogger = util.debuglog("leverj")
    return function () {
      const args = Array.prototype.slice.call(arguments)
      args.unshift(new Date())
      args.unshift(set)
      debugLogger.apply(debugLogger, args)
    }
  }
  return logger
}()
