const sec      = 1000
const min      = 60 * sec
module.exports = {
  logExternalPrice: true,
  expiryTime:       6,
  port:             11090,
  startupDelay:     10 * sec,
  components:       {
    BTCUSD: {
      minExternalProviders: 5,
      ticksize:             1,
      topic:                "index#BTCUSD",
      providers:            [
        {
          name:      "bitfinex",
          url:       () => "https://api-pub.bitfinex.com/v2/ticker/tBTCUSD",
          price:     _ => _[6],
          frequency: 10 * sec,
          inverse:   false
        },
        {
          name:      "currency.com",
          url:       () => `https://api-adapter.backend.currency.com/api/v1/klines?symbol=BTC/USD&interval=1m&limit=1&start=${Date.now()}`,
          price:     _ => parseFloat(_[0][4]),
          frequency: 10 * sec,
          inverse:   false
        },
        {
          name:      "BW.com",
          url:       () => "https://www.bw.com/api/data/v1/klines?marketId=281&type=1M&dataSize=1",
          price:     _ => parseFloat(_.datas[0][7]),
          frequency: 10 * sec,
          inverse:   false
        },
        {
          name:      "zbg.com",
          url:       () => "https://kline.zbg.com/api/data/v1/klines?marketName=btc_usdt&type=1M&dataSize=1",
          price:     _ => parseFloat(_.datas[0][7]),
          frequency: 10 * sec,
          inverse:   false
        },
        {
          name:      "hitbtc",
          url:       () => "https://api.hitbtc.com/api/2/public/ticker/BTCUSD",
          price:     _ => parseFloat(_.last),
          frequency: 10 * sec,
          inverse:   false
        },
        {
          name:      "binance",
          url:       () => `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=1&startTime=${Date.now() - Date.now() % min}`,
          price:     _ => parseFloat(_[0][4]),
          frequency: 10 * sec,
          inverse:   false
        },
        {
          name:      "houbi",
          url:       () => `https://api.huobi.pro/market/history/kline?symbol=btcusdt&period=1min&size=1`,
          price:     _ => parseFloat(_.data[0].close),
          frequency: 10 * sec,
          inverse:   false
        },

      ]
    }
  },
  enabled:          [
    {
      currency:  "BTCUSD",
      providers: ["bitfinex", "currency.com", "BW.com", "zbg.com", "hitbtc", "binance", "houbi"]
      // providers: ["binance"]
    }
  ]
}

