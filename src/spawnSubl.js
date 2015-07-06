var child_process = require('child_process')

function spawnSubl(file) {
  var vim = child_process.spawn( 'subl', [file])
}

module.exports = spawnSubl