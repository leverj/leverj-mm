from nose.tools import *
from leverj_spot_exchange_bridge import *

buy = {
  'order': {
  'id': '104233821827127014240520797578938743699',
    'originatorTimestamp': '1563385374451002',
    'orderType': '1',
    'side': '1',
    'pair': {
      'quote': '0x58C3ed77f0086C8365B84cc909949C93B7aed793',
      'base': '0x0000000000000000000000000000000000000000'
    },
    'quantity': '10000000000',
    'price': '20000',
    'originator': '0x627306090abaB3A6e1400e9345bC60c78a8BEf57',
    'account': '0xf17f52151EbEF6C7334FAD080c5704D77216b732',
  },
  'signer': '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
  'signature': '0x7e48c3a4e282d141cccf940366ed8ad4bdc1bfb52ad214da903dd33834d54e8a07f796a763aba3803e1245e6e9de06930acd89446623c1856477b61dc9547e2b1c',
}

sell = {
  'order': {
    'id': '104217976194624161373002088788871543699',
    'originatorTimestamp': '1563385374430001',
    'orderType': '1',
    'side': '2',
    'pair': {
      'quote': '0x58C3ed77f0086C8365B84cc909949C93B7aed793',
      'base': '0x0000000000000000000000000000000000000000'
    },
    'quantity': '15000000000',
    'price': '18001',
    'originator': '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef',
    'account': '0x821aEa9a577a9b44299B9c15c88cf3087F3b5544',
  },
  'signer': '0x0dbbe8e4ae425a6d2687f1a7e3ba17bc98c673636790f1b8ad91193c05875ef1',
  'signature': '0xec4480428757d3c0c911c9a77e6c7292771c38d19d6a904b19e396608f026c212fcddb9c7da797b43d5fbbfe289fc2ec9ad2eb247a8811a9adadd21dd16df9f91c',
}


def test_sign_order():
  command = 'sign_order'

  arguments = {'order': buy['order'], 'signer': buy['signer']}
  result = run_js(command, arguments)
  assert_equal(result['signature'], buy['signature'])
  assert_not_equal(result['signature'], sell['signature'])

  arguments = {'order': sell['order'], 'signer': sell['signer']}
  result = run_js(command, arguments)
  assert_equal(result['signature'], sell['signature'])
  assert_not_equal(result['signature'], buy['signature'])

def test_compute_signature_for_order():
  command = 'compute_signature_for_order'

  arguments = {'order': buy['order'], 'signer': buy['signer']}
  result = run_js(command, arguments)
  assert_equal(result['signature'], buy['signature'])
  assert_not_equal(result['signature'], sell['signature'])

  arguments = {'order': sell['order'], 'signer': sell['signer']}
  result = run_js(command, arguments)
  assert_equal(result['signature'], sell['signature'])
  assert_not_equal(result['signature'], buy['signature'])
