var child_process = require('child_process')

var config = {

  notesDir: "/home/ffff/Notes/",

  launchEditor: function (file) {
    return child_process.spawn('subl', [file])
  },

}

module.exports = config
