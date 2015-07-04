var blessed = require('blessed')

// Create a screen object.
var screen = blessed.screen({
  autoPadding: true,
  smartCSR: true
})//.title = 'notational momentum'

// Create notes list 
var list = blessed.list({ 
  parent: screen,
  top: 0,
  left: 0,
  width: '50%',
  height: '100%',
  align: 'left',
  
  // Colors
  fg: 'blue',
  border: {
    type: 'line'
  },
  selectedBg: 'green',

  // Allow mouse support
  mouse: true,

  // Allow key support (arrow keys + enter)
  keys: true,

  // Use vi built-in keys
  vi: true
});

render = function (state) {

  // update list with new notes
  list.setItems(state.notes)

  // TODO: why isnt this working?
  list.prepend(new blessed.Text({  
    left: 2,
    content: 'Notes'
  }))

  // select the first item
  list.select(0)

  // put the list in focus
  list.focus()

  // render the screen
  screen.render()
}


setup = function (stateStream) {

  // Append notes list + text area to the screen.
  screen.append(list)

  // Quit on Control-C.
  screen.key(['C-c'], function(ch, key) { return process.exit(0) })

  // whenever we get a state from the stateStream,
  stateStream.onValue(function (state) {
    render(state)
  })

  // do an initial fetch of notes
  dispatcher.emit({type:'getNotesList'})

}

module.exports = setup