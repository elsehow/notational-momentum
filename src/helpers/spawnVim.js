var tty = require('tty'),
  child_process = require('child_process');

function spawnVim(file) {
  var vim = child_process.spawn( 'vi', [file])

  function indata(c) {
    vim.stdin.write(c)
  }
  function outdata(c) {
    process.stdout.write(c)
  }

  process.stdin.resume()
  process.stdin.on('data', indata)
  vim.stdout.on('data', outdata)
  process.stdin.setRawMode(true)

  vim.on('exit', function(code) {
    process.stdin.setRawMode(false)
    process.stdin.pause()
    process.stdin.removeListener('data', indata)
    vim.stdout.removeListener('data', outdata)
    // cb(code)
  })
}

module.exports = spawnVim