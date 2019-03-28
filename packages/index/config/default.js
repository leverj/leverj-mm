const average = (a, b) => ((a - 0) + (b - 0)) / 2
const kyberPrice = (_) => {
  const dai = _.data.filter(price => price.pair === "ETH_DAI")
  if (dai.length !== 1) return undefined
  return average(dai[0].current_bid, dai[0].current_ask)
}

const fatbtcPrice = (_) => {
  let ticker = _.data.ethdai_ticker;
  if (!ticker) return undefined
  return average(ticker.bis1[0], ticker.ask1[0])
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
          "url": () => "https://api.bitfinex.com/v1/pubticker/daieth",
          price: (_) => average(_.bid, _.ask),
          "frequency": 5000,
          "inverse": true
        },
        {
          "name": "bancor",
          "url": () => "https://api.bancor.network/0.1/currencies/ETH/ticker?fromCurrencyCode=DAI&displayCurrencyCode=DAI",
          price: (_) => _.data.price - 0,
          "frequency": 1000,
          "inverse": false
        },
        {
          "name": "coinmarketcap",
          "url": () => "https://api.coinmarketcap.com/v1/ticker/ethereum/?convert=DAI",
          price: (_) => _[0].price_dai - 0,
          "frequency": 1000,
          "inverse": false
        }, {
          "name": "hitbtc",
          "url": () => "https://api.hitbtc.com/api/2/public/ticker/ETHDAI",
          price: (_) => average(_.bid, _.ask),
          "frequency": 1000,
          "inverse": false
        },
        {
          "name": "kucoin",
          "url": () => "https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=ETH-DAI",
          price: (_) => average(_.data.bestBid, _.data.bestAsk),
          "frequency": 1000,
          "inverse": false
        }, {
          "name": "kyber",
          "url": () => "https://api.kyber.network/market",
          price: kyberPrice,
          "frequency": 1000,
          "inverse": true
        }, {
          "name": "fatbtc",
          "url": () => `https://www.fatbtc.com/m/allticker/1/${Date.now()}`,
          price: fatbtcPrice,
          "frequency": 1000,
          "inverse": true
        },
      ]
    }
  },
  "enabled": [
    {
      "currency": "ETH-DAI",
      "providers": ["bitfinex", "bancor", "coinmarketcap", "hitbtc", "kucoin", "kyber", "fatbtc"]
    }
  ]
}

