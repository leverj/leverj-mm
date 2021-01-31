module.exports = function () {

  function getOrders(buyPrices = [], sellPrices = []) {
    return buyPrices.map(price => createOrder(price, "buy"))
      .concat(sellPrices.map(price => createOrder(price, "sell")))
  }

  function createOrder(price, side) {
    return {
      price, side,
      orderType: 'LMT',
      quantity: 1,
      accountId: "0x10893fCC4EceEe9D269399baa77Ad595cCF8f13B",
      token: "LEV",
      instrument: "LEVETH"
    }
  }

  function toObj(buyPrices = [], sellPrices = []) {
    return buyPrices.map(price => {
      return {price, side: "buy", quantity: config.quantity}
    }).concat(sellPrices.map(price => {
      return {price, side: "sell", quantity: config.quantity}
    }))
  }

  const config = {
    depth: 3,
    step: 0.1,
    spread: 0.4,
    quantity: 1,
    multiplyQty: false
  }

  const tests = [
    {
      description: "0",
      orders: [],
      executionPrice: 8,
      executionSide: "sell",
      result: {
        toBeAdded: toObj([7.7, 7.6, 7.5], [8.1, 8.2, 8.3]),
        toBeRemoved: []
      }
    },
    {
      description: "1",
      orders: getOrders([7.7, 7.6, 7.5], [8.1, 8.2, 8.3]),
      executionPrice: 8.1,
      executionSide: "sell",
      result: {
        toBeAdded: toObj([7.8], [8.4]),
        toBeRemoved: getOrders([7.5], [8.1])
      },
    },
    {
      description: "2",
      orders: getOrders([7.3, 7.4, 7.5], [8.1, 8.2, 8.3]),
      executionPrice: 7.5,
      executionSide: "buy",
      result: {
        toBeAdded: toObj([7.2], [7.8, 7.9, 8.0]),
        toBeRemoved: getOrders([7.5], [8.1, 8.2, 8.3])
      }
    },
    {
      description: "3",
      orders: getOrders([7.6, 7.5], [8.1, 8.2, 8.3]),
      executionPrice: 7.7,
      executionSide: "buy",
      result: {
        toBeAdded: toObj([7.4], [8]),
        toBeRemoved: getOrders([], [8.3])
      }
    },
    {
      description: "4",
      orders: getOrders([7.7, 7.6, 7.5], [8.2, 8.3]),
      executionPrice: 8.1,
      executionSide: "sell",
      result: {
        toBeAdded: toObj([7.8], [8.4]),
        toBeRemoved: getOrders([7.5])
      }
    },
    {
      description: "5",
      orders: getOrders([7.7, 7.6, 7.5, 7.4], [8.2, 8.3]),
      executionPrice: 8.1,
      executionSide: "sell",
      result: {
        toBeAdded: toObj([7.8], [8.4]),
        toBeRemoved: getOrders([7.5, 7.4], [])
      }
    },
    {
      description: "6",
      orders: getOrders([7.8, 7.7, 7.6], [8.2, 8.3, 8.4]),
      executionPrice: 8.1,
      executionSide: "sell",
      result: {
        toBeAdded: toObj([], []),
        toBeRemoved: getOrders([], [])
      }
    },
    {
      description: "7",
      orders: getOrders([7.7, 7.6, 7.5], [8.1, 8.2, 8.3]),
      executionPrice: 7.8,
      executionSide: "buy",
      result: {
        toBeAdded: toObj([], []),
        toBeRemoved: getOrders([], [])
      }
    },
    {
      description: "8",
      orders: getOrders([7.7, 7.6, 7.5], [8.1]),
      executionPrice: 7.8,
      executionSide: "buy",
      result: {
        toBeAdded: toObj([], [8.2, 8.3]),
        toBeRemoved: getOrders([], [])
      }
    },
    {
      description: "9",
      orders: getOrders([7.7], [8.1, 8.2, 8.3]),
      executionPrice: 7.8,
      executionSide: "buy",
      result: {
        toBeAdded: toObj([7.6, 7.5], []),
        toBeRemoved: getOrders([], [])
      }
    },
    {
      description: "10",
      orders: getOrders([], [8.1, 8.2, 8.3]),
      executionPrice: 7.8,
      executionSide: "sell",
      result: {
        toBeAdded: toObj([7.5, 7.4, 7.3], [7.9, 8.0]),
        toBeRemoved: getOrders([], [8.2, 8.3])
      }
    },
    {
      description: "11",
      orders: getOrders([8.1, 8.2, 8.3], []),
      executionPrice: 8.4,
      executionSide: "buy",
      result: {
        toBeAdded: toObj([], [8.7, 8.8, 8.9]),
        toBeRemoved: getOrders([], [])
      }
    },
    {
      description: "12: duplicate",
      orders: getOrders([8.1, 8.1, 8.2, 8.2, 8.3], [8.7, 8.7, 8.7]),
      executionPrice: 8.4,
      executionSide: "buy",
      result: {
        toBeAdded: toObj([], [8.8, 8.9]),
        toBeRemoved: getOrders([8.1, 8.2], [8.7,8.7])
      }
    },
    {
      description: "13: No sides",
      orders: [],
      executionPrice: 8,
      executionSide: undefined,
      result: {
        toBeAdded: toObj([7.8, 7.7, 7.6], [8.2, 8.3, 8.4]),
        toBeRemoved: []
      }
    },
  ]

  return {config, tests}

}()