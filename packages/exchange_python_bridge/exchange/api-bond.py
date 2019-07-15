import json
import sys
from bond import make_bond


TIMEOUT = 1
# interactive = "ssh localhost nodejs -i"
# interactive = "ssh localhost node -e 'require\(\\\"repl\\\"\).start\(\)'"
interactive = "ssh localhost 'nodejs -i || node -e require\(\\\"repl\\\"\).start\(\)'"
print('before javascript bond')
# js = make_bond('JavaScript', interactive, timeout=TIMEOUT, def_args=False)
# js = make_bond('JavaScript', timeout=TIMEOUT, def_args=False)
js = make_bond('JavaScript', timeout=TIMEOUT)
print('after javascript bond')



js.eval_block('function test_simple(arg) { return eval(arg); }')
ret = js.call('test_simple', 1)
print(ret)



code = r'''
  var circular = [];
  circular.push(circular);
  var fun_ref = function() {};
  function func() { return circular; }
  function exceptional() { throw circular; }
  function plus(a, b) { return a + b }
'''
js.eval_block(code)
plus = js.callable('plus')
result = plus(1, 2)
print(result)



js.close()
