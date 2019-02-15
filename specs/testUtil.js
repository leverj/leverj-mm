module.exports =(function(){
  var util = {}
  util.run = function(runOnlyList, index){
    if(runOnlyList && runOnlyList.length !== 0){
      var _ = require('lodash')
      if(_.indexOf(runOnlyList, index) === -1) return it.skip
    }
    return it
  }
  return util
})() 
  
  
  