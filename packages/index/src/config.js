const sec = 1000
const min = 60 * sec
const urls = {
  BTCUSD: {
    "bitfinex": () => "https://api-pub.bitfinex.com/v2/ticker/tBTCUSD",
    "currency.com": () => `https://api-adapter.backend.currency.com/api/v1/klines?symbol=BTC/USD&interval=1m&limit=1&start=${Date.now()}`,
    "BW.com": () => "https://www.bw.com/api/data/v1/klines?marketId=281&type=1M&dataSize=1",
    "zbg.com": () => "https://kline.zbg.com/api/data/v1/klines?marketName=btc_usdt&type=1M&dataSize=1",
    "hitbtc": () => "https://api.hitbtc.com/api/2/public/ticker/BTCUSD",
    "binance": () => `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=1&startTime=${Date.now() - Date.now() % min}`,
    "houbi": () => `https://api.huobi.pro/market/history/kline?symbol=btcusdt&period=1min&size=1`,
  },
  ETHUSD: {
    "bitfinex": () => "https://api-pub.bitfinex.com/v2/ticker/tETHUSD",
    "currency.com": () => `https://api-adapter.backend.currency.com/api/v1/klines?symbol=ETH/USD&interval=1m&limit=1&start=${Date.now()}`,
    "BW.com": () => "https://www.bw.com/api/data/v1/klines?marketId=280&type=1M&dataSize=1",
    "zbg.com": () => "https://kline.zbg.com/api/data/v1/klines?marketName=eth_usdt&type=1M&dataSize=1",
    "hitbtc": () => "https://api.hitbtc.com/api/2/public/ticker/ETHUSD",
    "binance": () => `https://api.binance.com/api/v3/klines?symbol=ETHUSDT&interval=1m&limit=1&startTime=${Date.now() - Date.now() % min}`,
    "houbi": () => `https://api.huobi.pro/market/history/kline?symbol=ethusdt&period=1min&size=1`,
  }
}
const prices = {
  "bitfinex": _ => _[6],
  "currency.com": _ => _[0] && _[0][4] && parseFloat(_[0][4]) || undefined,
  "BW.com": _ => _.datas && _.datas[0] && _.datas[0][7] && parseFloat(_.datas[0][7]) || undefined,
  "zbg.com": _ => _.datas && _.datas[0] && _.datas[0][7] && parseFloat(_.datas[0][7]) || undefined,
  "hitbtc": _ => parseFloat(_.last),
  "binance": _ => _[0] && _[0][4] && parseFloat(_[0][4]) || undefined,
  "houbi": _ => _.data && _.data[0] && parseFloat(_.data[0].close) || undefined,
}

const frequency = {
  "bitfinex": 10 * sec,
  "currency.com": 10 * sec,
  "BW.com": 10 * sec,
  "zbg.com": 10 * sec,
  "hitbtc": 10 * sec,
  "binance": 10 * sec,
  "houbi": 10 * sec,
}

const enabled = {
  "BTCUSD": ["bitfinex", "currency.com", "BW.com", "zbg.com", "hitbtc", "binance", "houbi"],
  // "BTCUSD": ["bitfinex"],
  // "ETHUSD": ["bitfinex"]
  "ETHUSD": ["bitfinex", "currency.com", "BW.com", "zbg.com", "hitbtc", "binance", "houbi"]
}

const providers = (pair) => enabled[pair].map(provider => ({
  name: provider,
  url: urls[pair][provider],
  price: prices[provider],
  frequency: frequency[provider],
}))

module.exports = [
  {
    pair: "BTCUSD",
    minExternalProviders: 5,
    ticksize: 1,
    topic: "index#BTCUSD",
    logExternalPrice: true,
    expiryTime: 6,
    startupDelay: sec,
    providers: providers('BTCUSD')
  },
  {
    pair: "ETHUSD",
    minExternalProviders: 5,
    ticksize: 4,
    topic: "index#ETHUSD",
    logExternalPrice: true,
    expiryTime: 6,
    startupDelay: sec,
    providers: providers('ETHUSD')
  }
]

