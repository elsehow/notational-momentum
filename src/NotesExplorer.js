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

  var textboxVal = state.searchState.textboxValue 

  // update textbox state
  textbox.setValue(textboxVal)

  // update list with new notes
  list.setItems(state.notesState.displayedNotes)

  // prepend an option to create a note
  if (!textboxVal)
    list.insertItem(0, '..(open dir)..')
  else
    list.insertItem(0, textboxVal)

  // select the first item
  if (state.selection.selectionIndex)
    list.select(state.selection.selectionIndex)
  else
    list.select(0)

  // render the screen
  screen.render()

}


setup = function (store, dispatcher) {

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
  store.on('update', function (state) {
    render(state)
  })

  // whenever we're told to spawn vim,
  // we `screen.exec` vim on the file.
  // `screen.exec` goes goes back to 
  // our blessed session when we quit.
  dispatcher.on('spawnVim', function (file) {
    screen.exec('vim', [file], {}, function () {
      dispatcher.emit('listFiles') // update files now, in case user just saved something
    })
  })
}

module.exports = setup
