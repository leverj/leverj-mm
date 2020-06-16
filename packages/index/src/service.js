const {config, indices} = require('../index')
module.exports = function () {
  const io = require('socket.io')(process.env.PORT || 11090)
  indices.init(config, io)
}()
