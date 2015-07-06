_ = require('lodash')

includes = function (str1, str2) { 
  // ignore case
  if (str1.toLowerCase().indexOf(str2.toLowerCase()) > -1) return str1
}

// [str..] list, str searchStr -> [str..]
filterFor = function (list, searchStr)  {
  return _.filter(list, function(str) {
    return includes(str, searchStr)
  })
}

// [str...] list, [str...] searchTerms => [str...] filteredList
search = function (acc, list, searchTerms) {

  if (searchTerms.length == 0) {
    return acc
  }

  else return search(
    // union of keyword results
    _.union(acc, filterFor(list, _.first(searchTerms)))
    , list
    , _.rest(searchTerms))
}

module.exports = search