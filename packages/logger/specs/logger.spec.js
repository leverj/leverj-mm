const logger = require('../src/index')
describe("logger", function(){
  it("should add date to logs", function(){
    logger.log("hello", "world", {message: "json object"})
  })
})