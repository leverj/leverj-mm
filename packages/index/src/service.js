const config = require('./config')
const indices = require('./indices')

module.exports = function () {
  const io = require('socket.io')(process.env.PORT || 11090)
  indices.init(config, io)
}()