var blessed = require('blessed'),
  _ = require('lodash'),
  ascii = require('ascii-codes')

var ASCII_CHARS = ascii.symbolIndex
ASCII_CHARS[0] = 'space' // hack 

// register our actions here 
var makeActions = function (bus) {

  return {

    // read notes from directory
    getNotesList: function () {
      bus.emit({type:'getNotesList'})
    },

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

  // update textbox state
  textbox.setValue(state.searchState.textboxValue)

  // update list with new notes
  //TODO: search notes per-keywords
  list.setItems(state.notesState.displayedNotes)
  // list.setItems(filterFor(state.notes, state.textboxValue))

  // select the first item
  list.select(state.selection.selectionIndex)

  // put the textbox in focus
  list.focus()

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

  // // scroll
  // screen.on('keypress', function() {
  //   combo = arguments['1']
  //   if combo.full == 'C-f'
  // })

  // Quit on Control-C.
  screen.key(['C-c'], function(ch, key) { return process.exit(0) })

  // whenever we get a state from the stateStream,
  stateStream.onValue(function (state) { render(state) })

    // do an initial fetch of notes
  actions.getNotesList()

}

module.exports = setup