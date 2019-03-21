module.exports = (function() {
  var  mocksock = {}

  var mock = require('mock-require')


  mocksock.mock = function() {
    mock('socket.io', function() {
      return {
        "on": function() {},
        "emit": function() {}
      }
    })
  }

  mocksock.stop = function() {
    mock.stop('socket.io')
  }

  return mocksock
})()
