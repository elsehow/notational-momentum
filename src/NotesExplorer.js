var blessed = require('blessed'),
  _ = require('lodash'),
  ascii = require('ascii-codes'),
  makeActions = require('./NotesActions')

var ASCII_CHARS = ascii.symbolIndex
// hack  -- add blessed's keywords for sapce
ASCII_CHARS[0] = 'space' 
// hack -- add blessed's keywords for uppercase letters
var UPPER_CASE_ASCII = 'abcdefghijklmnopqrstuvwxyz'.split('').map(function (letter) {
  return 'S-'+letter
})

// Create a screen object.
var screen = blessed.screen({
  autoPadding: true,
  smartCSR: true
})
screen.title = 'notational momentum'

// Create search/create box
var textbox = blessed.textbox({
  parent: screen,
  top: 0,
  left: 0,
  width: '100%',
  height: 3,
  align: 'left',
  border: {
    type: 'line'
  },
})

// Create notes list 
var list = blessed.list({ 
  parent: screen,
  top: 3,
  left: 0,
  width: '100%',
  height: '100%-3',
  align: 'left',
  // Colors
  // fg: 'blue',
  border: {
    type: 'line'
  },
  selectedBg: 'blue',
});

// append to screen - order seems to matter
screen.append(list)
screen.append(textbox)

render = function (state) {

    // update textbox state
    textbox.setValue(state.textboxVal)

    // update list with new notes
    list.setItems(state.displayedNotes)

    // prepend an option to create a note
    if (!state.textboxVal)
      list.insertItem(0, '..(open dir)..')
    else
      list.insertItem(0, state.textboxVal)

    // select the first item
    if (state.selectionIndex !== 0)
      list.select(state.selectionIndex)
    else
      list.select(0)

  // render the screen
  screen.render()
}


setup = function (store, dispatcher, cmd) {

  // get a  of functions that pushes actions to actionStream
  var actions = makeActions(dispatcher)

  // setup keybindings
  screen.key(['escape'], actions.clearTextbox)
  screen.key(['backspace'], actions.backspaceTextbox)
  screen.key(['C-j', 'linefeed'], actions.scrollDown)
  screen.key(['C-k'], actions.scrollUp)
  screen.key(['enter'], actions.openSelectedNote)
  screen.key(['C-c'], function(ch, key) { return process.exit(0) })
  // we allow all ascii chars to be typed in textbox 
  screen.key(ASCII_CHARS, function (ev) { actions.addToTextbox(ev) })
  screen.key(UPPER_CASE_ASCII, function (ev) { actions.addToTextbox(ev) })

  // whenever we get a state from the stateStream, render it
  store.onValue(render)

  // whenever we're told to spawn vim,
  // we `screen.exec` vim on the file.
  // `screen.exec` goes goes back to 
  // our blessed session when we quit.
  dispatcher.on('launchCommand', function (file) {
    screen.exec(cmd, [file], {}, function () {
      dispatcher.emit('listFiles') // update files now, in case user just saved something
    })
  })
}

module.exports = setup
