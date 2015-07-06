// str, str2, -> str/null
keywords = function (str) {
  if (_.isString(str) && str.length > 0) {
	var tokens = str.split(' ')
		return _.reject(tokens, function (str) {
  			return str.length == 0
  		})
  	}
}

module.exports = keywords