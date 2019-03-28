const expect = require('expect.js')
const strategy = require("../src/collarStrategy")
const testUtil = require("./testUtil");
const {tests, config} = require("./collarStrategy.spec.fixture")

const buySort = (a, b) => b.price - a.price

describe("collar spread strategy for market maker", function () {
  tests.forEach((test, index) => {
    testUtil.run([], index)("" + test.description, function () {
      strategy.setConfig(config)
      const result = strategy.getOrdersToBeAddedAndDeleted(test.orders, test.executionPrice, test.executionSide)
      result.toBeRemoved.sort(buySort)
      result.toBeAdded.sort(buySort)
      test.result.toBeRemoved.sort(buySort)
      test.result.toBeAdded.sort(buySort)
      expect(result).to.eql(test.result)
    })
  })
})