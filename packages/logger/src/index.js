module.exports = function () {
  const logger = {}
  logger.log = function (...messages) {
    console.log(new Date().toISOString(), ...messages)
  }

  logger.error = function (...messages) {
    if (console.error) console.error(new Date().toISOString(), ...messages)
    else logger.log(...messages)
  }

  logger.time = function (...logs) {
    const start = Date.now()
    const executor = {}
    executor.execute = async function (promise) {
      const result = await promise
      const now = Date.now()
      if (now - start > 10) console.log(`[${now - start} millis] : (EXCHANGE PERF timing info @ ${now}) -`, ...logs)
      return result
    }
    return executor
  }

  return logger
}()