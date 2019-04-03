const affirm = require("affirm.js")
const {BN, toChecksumAddress, toWei} = require("web3-utils")
const {Order, SignedOrder, Side, OrderType, Pair} = require('@leverj/gluon-plasma.exchange/src/domain/v/2/orders');
const ORDER_TYPE_MAP = {LMT: OrderType.limit, MKT: OrderType.market}
const mathUtil = require('./MathUtil')

module.exports = function () {
  const auth = {}

  auth.sign = function (order, pair, secret) {
    const contractOrder = auth.getContractOrder(order, pair)
    const signedContractOrder = contractOrder.signedBy(secret)
    return signedContractOrder.signature
  }

  auth.validate = function (order, pair, apiKey, {v, r, s}) {
    const signer = auth.getSigner(order, pair, {v, r, s})
    affirm(signer === apiKey, 'Invalid apiKey. expected:' + apiKey + " found:" + signer)
  }

  auth.getSigner = function (order, pair) {
    // setting serverTimestamp to 0 if order.entryTime is undefined
    const serverTimestamp = order.entryTime ? order.entryTime : 0
    const contractOrder = auth.getContractOrder(order, pair)
    const signedOrder = new SignedOrder(contractOrder, order.signature, serverTimestamp, new BN(0))
    const address = signedOrder.signerAddress
    return toChecksumAddress(address)
  }

  auth.getContractOrder = function (order, pair) {
    affirm(ORDER_TYPE_MAP[order.orderType] > 0, 'Invalid order orderType')
    affirm(Side[order.side] > 0, 'Invalid order side')
    affirm(pair, 'pair missing')
    affirm(pair.symbol === order.instrument, 'pair must be same as order instrument')
    affirm(typeof order.timestamp === 'number', 'Invalid timestamp')
    const quantity = auth.toBN(order.quantity, pair.quote.decimals);
    const price = auth.toBN(order.price, pair.base.decimals).div(new BN(Math.pow(10, pair.quote.decimals).toString(10)));
    const timestamp = new BN(order.timestamp);
    const id = new BN(order.clientOrderId);
    const orderType = new BN(ORDER_TYPE_MAP[order.orderType]);
    const side = new BN(Side[order.side]);
    return new Order(id, timestamp, orderType, side, new Pair(pair.quote.address, pair.base.address), quantity, price, order.originator, order.accountId)
  }

  auth.toBN = function (number, decimalPlaces) {
    affirm(decimalPlaces === 0 || decimalPlaces, 'decimal places must be provided')
    affirm(typeof number === 'number', 'Invalid number')
    affirm(typeof decimalPlaces === 'number' && decimalPlaces >= 0 && decimalPlaces <= 18, 'invalid decimalPlaces')
    const asWei = new BN(toWei(mathUtil.noExponents(number), 'ether'))
    // console.log({ asWei: asWei.toString(10) })
    return asWei.div(new BN(Math.pow(10, 18 - decimalPlaces)))
  }

  return auth
}()