# coinpit-index
This module listens to BTC/USD spot prices from different exchanges. (currently supported providers: Bitfinex, OKCoin, BitStamp, Gemini, Coinbase)

## usage

 Module can be started in 2 ways:

####1. Run as nodejs server
```bash
https://github.com/coinpit/coinpit-index
// modify port in coinpit-index/config/default.json
cd coinpit-index
npm install
npm start
```


####2. Run as docker image
```
docker run --restart=always -d --name cpindex -p 8090:8090 coinpit/coinpit-index
```

#### Get Index prices on client

Index prices will be emitted on socket with channel "coinpit-index#BTCUSD"

```
var socket = require('socket.io-client')
var io     = socket('http://localhost:8090')
io.on('coinpit-index#BTCUSD', function(data){
    console.log(data)
})

/*
output:
{ price: 900.02,
  lastProvider: 'okcoin',
  used: 5,
  providers:
   { gemini: { price: 901.55, time: 1485402295232 },
     okcoin: { price: 899.3, time: 1485402327813 },
     bitstamp: { price: 898.69, time: 1485402295729 },
     coinbase: { price: 904.32, time: 1485402319819 },
     bitfinex: { price: 900.02, time: 1485402327417 } } }
*/
```

