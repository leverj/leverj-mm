from nose.tools import *
from leverj_spot_exchange_bridge import *

sell = {
  "order": {
    "id": "140803898767343953682648955235810353848",
    "originatorTimestamp": "1562962795826001",
    "orderType": "1",
    "side": "2",
    "pair": {
      "quote": "0x1a121c49f6f251F49449F8ED5E3a2C8bb63aD1df",
      "base": "0x0000000000000000000000000000000000000000"
    },
    "quantity": "15",
    "price": "18001",
    "originator": "0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef",
    "account": "0x821aEa9a577a9b44299B9c15c88cf3087F3b5544",
    "hash": "0x56c519b9b53d640ccb4b70188a3e9cdf46780f555a8511721266e64ff973d62d"
  },
  "signer": "0x0dbbe8e4ae425a6d2687f1a7e3ba17bc98c673636790f1b8ad91193c05875ef1",
  "signature": "0x97558a4f1729aee8f98e141ddee4a7c3c84031572d4c84d767d2c76fabc7a44c09b55f09f49092edf2964be58276fceb73c1fadd226a5148d3c1dacaf8a14fc61b"
}

buy = {
  "order": {
    "id": "140818159836596521263415793146870833848",
    "originatorTimestamp": "1562962795845002",
    "orderType": "1",
    "side": "1",
    "pair": {
      "quote": "0x1a121c49f6f251F49449F8ED5E3a2C8bb63aD1df",
      "base": "0x0000000000000000000000000000000000000000"
    },
    "quantity": "10",
    "price": "20000",
    "originator": "0x627306090abaB3A6e1400e9345bC60c78a8BEf57",
    "account": "0xf17f52151EbEF6C7334FAD080c5704D77216b732",
    "hash": "0x272bd1a15734c6fc59fabb8d15c7c0ab2a3bd381680fc7bb4418084f28549a3a"
  },
  "signer": "0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3",
  "signature": "0xeeadd117b4fbfd573e451d8808335ff879cdfd0700436cda216c45c9c1a165d530bff3ab5c9b353a766ed0ff52d939139e8f56acbc1af01f629d4352bde6fc331b"
}

def test_sign_order():
  command = 'sign_order'
  arguments = {"order": sell['order'], "signer": sell['signer']}
  result = run_js(command, arguments)
  assert_equal(result['signature'], sell['signature'])
  assert_not_equal(result['signature'], buy['signature'])

  arguments = {"order": buy['order'], "signer": buy['signer']}
  result = run_js(command, arguments)
  assert_equal(result['signature'], buy['signature'])
  assert_not_equal(result['signature'], sell['signature'])

def test_compute_signature_for_order():
  command = 'compute_signature_for_order'
  arguments = {"order": sell['order'], "signer": sell['signer']}
  result = run_js(command, arguments)
  assert_equal(result['signature'], sell['signature'])
  assert_not_equal(result['signature'], buy['signature'])

  arguments = {"order": buy['order'], "signer": buy['signer']}
  result = run_js(command, arguments)
  assert_equal(result['signature'], buy['signature'])
  assert_not_equal(result['signature'], sell['signature'])
