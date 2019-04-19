const logger = require("../src/index")

const delay = async (ms) => new Promise((resolve, reject) => setTimeout(resolve, ms))

describe('loggers', function () {
  it("should be able to do simple logs", function () {
    logger.log("msg1", "msg2", new Error("it is an error"))
  })

  it('should be able to time any promise call', async function () {
    logger.log("start")
    await logger.time("timing a promise", "which waits", "for 100 ms").execute(delay(100))
    logger.log("done")
  })


})