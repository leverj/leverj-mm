
module.exports = function(){
  const logger = {}
  logger.log = function (...messages) {
    console.log(new Date().toISOString(), ...messages)
  }
  return logger
}()