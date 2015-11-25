var Kefir = require('kefir')

function combineTemplate (obj) {

  var state = {}

  // helper fn
  function asKey (k) {
    return function (v) {
      return [k, v]
    }
  }
  // takes a values of the form [key, value]
  function intoState (v) {
    state[v[0]] = v[1]
    return state
  }

  // make a list of the form [ [key, value], .. ]
  var l = []
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      l.push([key, obj[key]])
    }
  }

  var ss = l.map(function (i) {
    return i[1].map(asKey(i[0]))
  })

  return Kefir.merge(ss).map(intoState)
                            
}

module.exports = combineTemplate