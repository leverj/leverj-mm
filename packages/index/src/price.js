module.exports = (function(name) {
  var price = {}
  price.name = name

  var socketPrice
  var restPrice

  price.getPrice = function() {
    if(socketPrice && !socketPrice.expired) return socketPrice
    if(restPrice && !restPrice.expired) return restPrice
    return socketPrice ? socketPrice : restPrice
  }

  price.setSocketPrice = function(data) {
    var oldData = socketPrice
    socketPrice = data
    return price.isChanged(oldData, data)
  }

  price.setRestPrice = function(data) {
    var oldData = restPrice
    restPrice   = data
    var changed = price.isChanged(oldData, data)
    return (!socketPrice || socketPrice.expired) ? changed : false
  }

  price.isChanged = function(oldData, data) {
    return !oldData || oldData.price !== data.price || oldData.expired !== data.expired
  }

  return price
})
