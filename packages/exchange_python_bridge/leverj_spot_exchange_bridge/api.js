#!/usr/bin/env node

const dashdash = require('dashdash')
const {Order, Pair} = require('@leverj/gluon-plasma.exchange/src/domain/v/2/orders')
const orderAdapter = require('@leverj/adapter/src/OrderAdapter')

const usage = 'usage: node api.js --command <command> --args=<arguments-as-json-string>'
const options = [
  {
    names: ['help', 'h'],
    type: 'bool',
    help: usage
  },
  {
    names: ['command', 'c'],
    type: 'string',
    help: 'api-command to call',
  },
  {
    names: ['args', 'a'],
    type: 'string',
    help: 'api-command args (as json)',
  }
]

const parser = dashdash.createParser({options: options})
try {
  const opts = parser.parse(process.argv)
  if (opts.help) { console.log(usage); process.exit(0) }
  if (!opts.command || !opts.args) throw Error(usage)

  const command = opts.command
  const arguments = JSON.parse(opts.args)
  const result = JSON.stringify(exec(command, arguments))
  console.log(result) // ... returning result via stdout

} catch (e) {
  console.error(e.message)
  process.exit(1)
}


function exec(command, arguments) {
  switch (command) {
    case 'sign_order': return sign_order(arguments)
    case 'compute_signature_for_order': return compute_signature_for_order(arguments)
    case 'compute_signature_for_exchange_order': return compute_signature_for_exchange_order(arguments)
    default: throw Error(`unknown command: ${command}`)
  }
}

function sign_order(arguments) {
  const signer = arguments.signer
  const
    {id, originatorTimestamp, orderType, side, pair, quantity, price, originator, account} = arguments.order,
    {quote, base} = pair,
    pair_ = new Pair(quote, base)
  const order = new Order(id, originatorTimestamp, orderType, side, pair_, quantity, price, originator, account)
  return order.signedBy(signer)
}

function compute_signature_for_order(arguments) {
  return {signature: sign_order(arguments).signature}
}

function compute_signature_for_exchange_order(arguments) {
  const order = arguments.order
  const instrument = arguments.instrument
  const signer = arguments.signer
  const signature = orderAdapter.sign(order, instrument, signer)
  return {signature}
}
