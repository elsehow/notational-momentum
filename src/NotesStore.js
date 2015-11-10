var Kefir = require('kefir'),
  Freezer = require('freezer-js'),
  _ = require('lodash'),
  path = require('path'),
  search  = require('./helpers/search.js'),
  keywords = require('./helpers/keywords.js'),

// Filter dispatch (obj) by type (str) -> (Dispatch)
dispatchIsType = function (type, dispatch) {
  if (dispatch.type === type) return dispatch
}

// Filters dispatcher for dispatch (obj) of type -> (Dispatcher)
wire = function (dispatcher, dispatchType) {
  return dispatcher
    .filter(function (d) { return dispatchIsType(dispatchType, d)})
}

// str, char -> str
addCharToString = function (chr, str) { return str+chr }

// str -> str
removeLastChar = function (val) {
  var len = val.length
  if (len > 0) return val.substring(0,len-2)
  else return val
}


// functions that act on the state

selectionByIndex = function (selectionState, i, visibleNotes) {
  return {
    selectionIndex: i,
    selectionValue: visibleNotes[i-1]
  }
}

showSearchResults = function (state) {
  var kwords = keywords(state.searchState.textboxValue)
  // search for notes if there are keywords
  if (kwords) {
    var searchResults = search([], state.notesState.allNotes, kwords)
    state.notesState.set('displayedNotes', searchResults)
  // otherwise display all notes
  } else {
    state.notesState.set('displayedNotes', state.notesState.allNotes)
  }
}

resetSelection = function (state) {
  return {
    selectionIndex: null,
    selectionValue: null
  }
}

// dir is 1 or -1
var scroll = function (state, comparison, direction) {
  return function () {
    if (comparison) state.set('selection', 
      selectionByIndex(state.selection, state.selection.selectionIndex+direction, state.notesState.displayedNotes))
  }
}

setup = function (dispatcher, notesDir) {

  // Our immutable store
  store = new Freezer({
    searchState: { textboxValue: '' },
    selection: {
      // we keep a separate state for selection index
      selectionIndex: null,
      // and selection content
      selectionValue: null
    },
    notesState: {
      allNotes: [],
      // displayedNotes is a subset of notes
      displayedNotes: []
    }
  })

  // Wire the dispatcher to side-effecty functions that update the state
  // returns nothing
  var on = function (dispatchType, fn) {
    wire(dispatcher, dispatchType).onValue(function (d) { 
      fn(d, store.get()) 
    })
  }

  on('notesList', function (dispatch, state) {
    var transaction = state.notesState.transact()
    transaction.allNotes = dispatch.notes
    transaction.displayedNotes = dispatch.notes
    state.notesState.run()
    showSearchResults(store.get())
  })

  // {type:'addToTextbox', val: 'j'} -> set textboxValue
  on('addToTextbox', function (dispatch, state) {
    var updatedVal = addCharToString(dispatch.ev, state.searchState.textboxValue)
    state.searchState.set('textboxValue', updatedVal)
  })

  // {type:'clearTextbox'} -> clear textbox
  on('clearTextbox', function (_, state) {
    state.searchState.set('textboxValue', '')
    state.selection.set(resetSelection())
  })

  // {type:'backspaceTextbox'} -> remove last char from textbox
  on('backspaceTextbox', function (_, state) {
    var backspacedVal = removeLastChar(state.searchState.textboxValue) 
    state.searchState.set('textboxValue', backspacedVal)
  })

  on('scrollUp', function (_, state) {
    var i = state.selection.selectionIndex
    scroll(state, i > 0, -1)()
  })

  on('scrollDown', function (_, state) {
    var i = state.selection.selectionIndex
    var displayedNotes = state.notesState.displayedNotes
    scroll(state, i < displayedNotes.length, 1)()
  })

  on('openSelectedNote', function (_) {
    var selectedNote = store.get().selection.selectionValue  
    if (!selectedNote || selectedNote == 0) {
      var textboxValue = store.get().searchState.textboxValue
      var file = path.join(notesDir, textboxValue) 
    } else {
      var file = path.join(notesDir, selectedNote)
    }
    //conf.launchEditor(file)
  })

  // Make a stream of state updates
  stateStream = Kefir.fromEvents(store, 'update')

  // Update displayed notes whenever the text box's value changes
  searchStateListener = store.get().searchState.getListener()
  searchStateListener.on('update', function (_) {
    var state = store.get()
    showSearchResults(state)
    // reset the selection
    state.selection.set(resetSelection())
    
  })

  return stateStream
}

module.exports = setup
