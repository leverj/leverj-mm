const average = (a, b) => ((a - 0) + (b - 0)) / 2
const kyberPrice = (_) => {
  const dai = _.data.filter(price => price.pair === "ETH_DAI")[0]
  return average(dai.current_bid, dai.current_ask)
}

module.exports = {
  "logExternalPrice": true,
  "expiryTime": 6,
  "port": 8090,
  "startupDelay": 10000,
  "components": {
    "ETH-DAI": {
      "minExternalProviders": 5,
      "ticksize": 3,
      "topic": "leverj-index#ETHDAI",
      "providers": [
        {
          "name": "bitfinex",
          "url": "https://api.bitfinex.com/v1/pubticker/daieth",
          price: (_) => average(_.bid, _.ask),
          "frequency": 10000,
          "inverse": true
        },
        {
          "name": "bancor",
          "url": "https://api.bancor.network/0.1/currencies/ETH/ticker?fromCurrencyCode=DAI&displayCurrencyCode=DAI",
          price: (_) => _.data.price - 0,
          "frequency": 10000,
          "inverse": false
        },
        {
          "name": "coinmarketcap",
          "url": "https://api.coinmarketcap.com/v1/ticker/ethereum/?convert=DAI",
          price: (_) => _[0].price_dai - 0,
          "bid": ["0", "price_dai"],
          "ask": ["0", "price_dai"],
          "frequency": 10000,
          "inverse": false
        },
        {
          "name": "infura",
          "url": "https://api.infura.io/v1/ticker/ethusd",
          price: (_) => average(_.bid, _.ask),
          "frequency": 10000,
          "inverse": false
        },
        {
          "name": "kucoin",
          "url": "https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=ETH-DAI",
          price: (_) => average(_.data.bestBid, _.data.bestAsk),
          "frequency": 10000,
          "inverse": false
        }, {
          "name": "kyber",
          "url": "https://api.kyber.network/market",
          price: kyberPrice,
          "frequency": 10000,
          "inverse": true
        },
      ]
    }
  },
  "enabled": [
    {
      "currency": "ETH-DAI",
      "providers": ["bitfinex", "bancor", "coinmarketcap", "infura", "kucoin", "kyber"]
    }
  ]
}

