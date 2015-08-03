var blessed = require('blessed'),
  _ = require('lodash'),
  ascii = require('ascii-codes')

var ASCII_CHARS = ascii.symbolIndex
ASCII_CHARS[0] = 'space' // hack 

// register our actions here 
var makeActions = function (bus) {

  return {

    addToTextbox: function (ev) {
      bus.emit({
        type: 'addToTextbox',
        ev: ev
      })
    },

    clearTextbox: function () {
      bus.emit({
        type: 'clearTextbox'
      })
    },

    backspaceTextbox: function () {
      bus.emit({
        type: 'backspaceTextbox'
      })
    },

    scrollUp: function () {
      bus.emit({
        type: 'scrollUp'
      })
    },

    scrollDown: function () {
      bus.emit({
        type: 'scrollDown'
      })
    },

    // open a note
    openSelectedNote: function () {
      bus.emit({
        type: 'openSelectedNote',
      })
    },

  }
}

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


setup = function (stateStream, dispatcher) {

  // get a  of functions that pushes actions to actionStream
  var actions = makeActions(dispatcher)

  // append to screen - order seems to matter
  screen.append(list)
  screen.append(textbox)

  screen.key(['escape'], actions.clearTextbox)
  screen.key(['backspace'], actions.backspaceTextbox)
  //scroll
  screen.key(['C-j', 'linefeed'], actions.scrollDown)
  screen.key(['C-k'], actions.scrollUp)
  // we allow all ascii chars to be typed in textbox 
  screen.key(ASCII_CHARS, function (ev) { actions.addToTextbox(ev) })
  //open notes
  screen.key(['enter'], actions.openSelectedNote)


  // Quit on Control-C.
  screen.key(['C-c'], function(ch, key) { return process.exit(0) })

  // whenever we get a state from the stateStream,
  stateStream.onValue(function (state) { render(state) })
}

module.exports = setup