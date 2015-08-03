var _ = require('lodash'),
    fs = require('fs')

// -> [str..]
sort = function (notes, dir) {
  return notes.sort(function(a, b) {
               return fs.statSync(dir + b).mtime.getTime() - 
                      fs.statSync(dir + a).mtime.getTime();
  })
}
// Remove notes that start with '.' [str..] -> [str...]
removeSystemFiles = function (filenames) {
  // remove all hidden files (files that start with '.')
  return _.reject(filenames, function (f) {
    return _.first(f) === '.'
  })
}

function listNotes (dir, successCb) {
  fs.readdir(dir, function (err, notes) {
    // handle errors
    if (err) {
      console.log('ERROR FETCHING NOTES!', err)
      return
    }
    successCb(sort(removeSystemFiles(notes), dir))
  })
}

module.exports = listNotes 
