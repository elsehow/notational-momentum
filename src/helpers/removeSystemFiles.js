_ = require('lodash')

// Remove notes that start with '.' [str..] -> [str...]
removeSystemFiles = function (filenames) {
	// remove all hidden files (files that start with '.')
	return _.reject(filenames, function (f) {
		return _.first(f) === '.'
	})
}


module.exports = removeSystemFiles