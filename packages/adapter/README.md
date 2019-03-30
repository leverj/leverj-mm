# adapter
creates and verifies order signature for gluon plasma 

```bash
npm install @leverj/adapter
```

#### sign and validate order object

##### sign an order

```javascript
const adapter = require('@leverj/adapter/src/OrderAdapter')
const {v,r,s} = adapter.sign(order, pair, secret)
```

##### validate order
 
```javascript
const adapter = require('@leverj/adapter/src/OrderAdapter')
const apiKey = adapter.getSigner(order, pair, {v,r,s})
affirm(apiKey).to.eql(accountApiKey)
``` 

 