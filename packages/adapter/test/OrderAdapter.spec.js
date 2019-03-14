const expect = require('expect.js')
const fixtures = require("./OrderAdapter.spec.json")
const auth = require('../src/OrderAdapter')

describe('order sign', function () {

  it('should convert decimals values to big number with decimal places', function () {
    expect(auth.toBN(198200.200389230, 11).toString()).to.eql("19820020038923000")
    expect(auth.toBN(198200.200389230, 18).toString()).to.eql("198200200389230000000000")
    expect(auth.toBN(0.0000009,18).toString()).to.eql("900000000000")
  })

  it('should return order object with big numbers', function () {
    let buy = auth.getContractOrder(fixtures.buy, fixtures.instrument)
    expect(buy.price.toString()).to.eql((fixtures.buy.price * 1e9).toString())
    expect(buy.quantity.toString()).to.eql((fixtures.buy.quantity * 1e9).toString())
    expect(buy.side.toString()).to.eql(1)
    expect(buy.orderType.toString()).to.eql(1)

    let sell = auth.getContractOrder(fixtures.sell, fixtures.instrument)
    expect(sell.price.toString()).to.eql((fixtures.buy.price * 1e9).toString())
    expect(sell.quantity.toString()).to.eql((fixtures.buy.quantity * 1e9).toString())
    expect(sell.side.toString()).to.eql(2)
    expect(sell.orderType.toString()).to.eql(1)
  })

  it('should be able to sign an order', function () {
    expect(auth.sign(fixtures.buy, fixtures.instrument, fixtures.apiKey.privateKey)).to.eql(fixtures.buySignature)
    expect(auth.sign(fixtures.sell, fixtures.instrument, fixtures.apiKey.privateKey)).to.eql(fixtures.sellSignature)
  })

  it('should return correct signer address', function () {
    let signer = auth.getSigner(Object.assign({}, fixtures.buy, {signature: fixtures.buySignature}), fixtures.instrument)
    expect(signer).to.eql(fixtures.apiKey.address)

    signer = auth.getSigner(Object.assign({}, fixtures.sell, {signature: fixtures.sellSignature}), fixtures.instrument)
    expect(signer).to.eql(fixtures.apiKey.address)
  })

})