const expect = require('expect.js')
const strategy = require("../src/collarStrategy")
const testUtil = require("./testUtil");
const {tests, config} = require("./collarStrategy.spec.fixture")


describe("collar spread strategy for market maker", function () {

  tests.forEach((test, index) => {
    testUtil.run([], index)(index + ": " + test.description, function () {
      strategy.setConfig(config)
      const result = strategy.getOrdersToBeAddedAndDeleted(test.orders, test.executionPrice, test.executionSide)
      expect(result).to.eql(test.result)
    })
  })
})