from nose.tools import *
from leverj_spot_exchange_bridge import *

instrument = {
  'symbol': 'ETHLEV',
  'name': 'ETH/LEV',
  'status': 'active',
  'ticksize': 1,
  'ticksperpoint': 10,
  'baseSignificantDigits': 1,
  'quoteSignificantDigits': 4,
  'quote': {
    'name': 'LEV',
    'address': '0x58C3ed77f0086C8365B84cc909949C93B7aed793',
    'symbol': 'LEV',
    'decimals': 9
  },
  'base': {
    'name': 'ETH',
    'address': '0x0000000000000000000000000000000000000000',
    'symbol': 'ETH',
    'decimals': 9
  },
  'convertSymbol': 'ETH'
}

buy = {
  'order': {
    'accountId': '0xf17f52151EbEF6C7334FAD080c5704D77216b732',
    'originator': '0x627306090abaB3A6e1400e9345bC60c78a8BEf57',
    'side': 'buy',
    'quantity': 10, # * 1e+9
    'price': 20000,
    'orderType': 'LMT',
    'clientOrderId': '104233821827127014240520797578938743699',
    'postOnly': True,
    'instrument': instrument['symbol'],
    'timestamp': 1563385374451002
  },
  'signer': '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
  'signature': '0x7e48c3a4e282d141cccf940366ed8ad4bdc1bfb52ad214da903dd33834d54e8a07f796a763aba3803e1245e6e9de06930acd89446623c1856477b61dc9547e2b1c'
}

sell = {
  'order': {
    'accountId': '0x821aEa9a577a9b44299B9c15c88cf3087F3b5544',
    'originator': '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef',
    'side': 'sell',
    'quantity': 15, # * 1e+9
    'price': 18001,
    'orderType': 'LMT',
    'clientOrderId': '104217976194624161373002088788871543699',
    'postOnly': True,
    'instrument': instrument['symbol'],
    'timestamp': 1563385374430001
  },
  'signer': '0x0dbbe8e4ae425a6d2687f1a7e3ba17bc98c673636790f1b8ad91193c05875ef1',
  'signature': '0xec4480428757d3c0c911c9a77e6c7292771c38d19d6a904b19e396608f026c212fcddb9c7da797b43d5fbbfe289fc2ec9ad2eb247a8811a9adadd21dd16df9f91c'
}


def test_compute_signature_for_exchange_order():
  command = 'compute_signature_for_exchange_order'

  arguments = {'order': buy['order'], 'instrument': instrument, 'signer': buy['signer']}
  result = run_js(command, arguments)
  assert_equal(result['signature'], buy['signature'])
  assert_not_equal(result['signature'], sell['signature'])

  arguments = {'order': sell['order'], 'instrument': instrument, 'signer': sell['signer']}
  result = run_js(command, arguments)
  assert_equal(result['signature'], sell['signature'])
  assert_not_equal(result['signature'], buy['signature'])
