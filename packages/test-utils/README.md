# test-utils
convenient methods for testing 

## install
```bash
npm install --save-dev test-utils.js
```

## Usage

```javascript
  const expect  = require('expect.js');
  const testUtil = require('test-utils.js'); 
  //tests only 0 and 5th test from the list of tests. rest of them should be ignored
  [0,1,2,3,4,5].forEach(function (test, index) {
    testUtil.run([0,5], index)(index + ": should be even number", function () {
      expect(test%2 === 0).to.be.ok();
    })
  })
```
