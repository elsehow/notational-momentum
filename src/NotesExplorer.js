var blessed = require('blessed'),
  _ = require('lodash');

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

    // open a note
    openNote: function (note) {
      bus.emit({
        type: 'openNote',
        note: note
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

// str, str2, -> str/null
keywords = function (str) {
  if (str) return str.split(' ')
}

includes = function (str1, str2) { 
  // ignore case
  if (str1.toLowerCase().indexOf(str2.toLowerCase()) > -1) return str1
}

// [str..] list, str searchStr -> [str..]
filterFor = function (list, searchStr)  {
  return _.filter(list, function(str) {
    return includes(str, searchStr)
  })
}

// [str...] list, [str...] searchTerms => [str...] filteredList
search = function (acc, list, searchTerms) {

  if (!searchTerms) {
    return list
  }

  if (searchTerms.length == 0) {
    return acc
  }

  else return search(
    // union of keyword results
    _.union(acc, filterFor(list, _.first(searchTerms)))
    , list
    , _.rest(searchTerms))
}
  
render = function (state) {

  // update textbox state
  textbox.setValue(state.textboxValue)

  // update list with new notes
  //TODO: search notes per-keywords
  list.setItems(search([], state.notes, keywords(state.textboxValue)))
  // list.setItems(filterFor(state.notes, state.textboxValue))

  // select the first item
  list.select(0)

  // put the textbox in focus
  list.focus()

  // render the screen
  screen.render()

}


setup = function (stateStream, dispatcher) {

  actions = makeActions(dispatcher)

  // append to screen - order seems to matter
  screen.append(list)
  screen.append(textbox)

  // TODO: clearer to filter keypreses
  //screen.on('keypress', function (ev) {
    // switch (ev) ...
  // })
  // or --
  // screen.key(ALLOWED_KEYS)

  screen.key(['escape'], function (_) {
    actions.clearTextbox()
  })

  screen.key(['backspace'], function (_) {
    actions.backspaceTextbox()
  })

  screen.on('keypress', function (ev) {
    actions.addToTextbox(ev)
  })

  //screen.on('C-j')
  //screen.on('C-k')

  // Quit on Control-C.
  screen.key(['C-c'], function(ch, key) { return process.exit(0) })

  // whenever we get a state from the stateStream,
  stateStream.onValue(function (state) {
    render(state)
  })

    // do an initial fetch of notes
  actions.getNotesList()

}

module.exports = setup