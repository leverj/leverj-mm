module.exports = function () {

  function getOrders(prices, side) {
    return prices.map(price => {
        return {
          price, side,
          orderType: 'LMT',
          quantity: 1,
          accountId: "0x10893fCC4EceEe9D269399baa77Ad595cCF8f13B",
          token: "LEV",
          instrument: "LEVETH"
        }
      }
    )
  }

  function toObj(prices, side) {
    return prices.map(price => {
      return {price, side}
    })
  }

  const config = {
    depth: 3,
    step: 0.1,
    spread: 0.4,
  }

  const tests = [
    {
      description: "should add buy and sell orders based on spread when orders are empty",
      orders: [],
      executionPrice: 8,
      executionSide: "sell",
      result: {toBeRemoved: [], toBeAdded: toObj([7.7, 7.6, 7.5], "buy").concat(toObj([8.1, 8.2, 8.3], "sell"))}
    },
    {
      description: "should return empty map if an order exists with sell execution price",
      orders: getOrders([7.7, 7.6, 7.5], "buy").concat(getOrders([8.1, 8.2, 8.3], "sell")),
      executionPrice: 8.1,
      executionSide: "sell",
      result: {toBeRemoved: [], toBeAdded: []}
    },
    {
      description: "should return empty map if an order exists with buy execution price",
      orders: getOrders([7.7, 7.6, 7.5], "buy").concat(getOrders([8.1, 8.2, 8.3], "sell")),
      executionPrice: 7.5,
      executionSide: "buy",
      result: {toBeRemoved: [], toBeAdded: []}
    },
    {
      description: "should add sell order if buy execution happens and buy order does not exist at that price",
      orders: getOrders([7.6, 7.5], "buy").concat(getOrders([8.1, 8.2, 8.3], "sell")),
      executionPrice: 7.7,
      executionSide: "buy",
      result: {toBeAdded: toObj([8], "sell").concat(toObj([7.4], "buy")), toBeRemoved: []}
    },
    {
      description: "should add buy order if sell execution happens and sell order does not exist at that price",
      orders: getOrders([7.7, 7.6, 7.5], "buy").concat(getOrders([8.2, 8.3], "sell")),
      executionPrice: 8.1,
      executionSide: "sell",
      result: {toBeAdded: toObj([7.8], "buy").concat(toObj([8.4], "sell")), toBeRemoved: []}
    },
    {
      description: "should remove extra orders",
      orders: getOrders([7.7, 7.6, 7.5, 7.4], "buy").concat(getOrders([8.2, 8.3], "sell")),
      executionPrice: 8.1,
      executionSide: "sell",
      result: {toBeAdded: toObj([7.8], "buy").concat(toObj([8.4], "sell")), toBeRemoved: getOrders([7.4], "buy")}
    },
    {
      description: "should not create new orders if order at that price exists for sell side",
      orders: getOrders([7.8, 7.7, 7.6], "buy").concat(getOrders([8.2, 8.3, 8.4], "sell")),
      executionPrice: 8.1,
      executionSide: "sell",
      result: {toBeAdded: [], toBeRemoved: []}
    },
    {
      description: "should not create new orders if order at that price exists for buy side",
      orders: getOrders([7.7, 7.6, 7.5], "buy").concat(getOrders([8.1, 8.2, 8.3], "sell")),
      executionPrice: 7.8,
      executionSide: "buy",
      result: {toBeAdded: [], toBeRemoved: []}
    },
    {
      description: "should create orders if it does not have enough depth for sell side",
      orders: getOrders([7.7, 7.6, 7.5], "buy").concat(getOrders([8.1], "sell")),
      executionPrice: 7.8,
      executionSide: "buy",
      result: {toBeAdded: toObj([8.2, 8.3], "sell"), toBeRemoved: []}
    },
    {
      description: "should create orders if it does not have enough depth for buy side",
      orders: getOrders([7.7], "buy").concat(getOrders([8.1, 8.2, 8.3], "sell")),
      executionPrice: 7.8,
      executionSide: "buy",
      result: {toBeAdded: toObj([7.6, 7.5], "buy"), toBeRemoved: []}
    },
    {
      description: "should create orders on buy side if there are no buys and last price is of sell side",
      orders: getOrders([8.1, 8.2, 8.3], "sell"),
      executionPrice: 7.8,
      executionSide: "sell",
      result: {toBeAdded: toObj([7.5, 7.4, 7.3], "buy"), toBeRemoved: []}
    },
    {
      description: "should create orders on sell side if there are no sells and last price is of buy side",
      orders: getOrders([8.1, 8.2, 8.3], "buy"),
      executionPrice: 8.4,
      executionSide: "buy",
      result: {toBeAdded: toObj([8.7, 8.8, 8.9], "sell"), toBeRemoved: []}
    }
  ]

  return {config, tests}

}()