var Freezer = require('freezer-js'),
  _ = require('lodash'),
  path = require('path'),
  search  = require('and-search'),
  keywords = require('./helpers/keywords.js')

// str -> str
removeLastChar = function (val) {
  var len = val.length
  if (len > 0) return val.substring(0,len-1)
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
    var searchResults = search(state.notesState.allNotes, kwords)
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

  // set the notes every time a notesList event comes through
  dispatcher.on('notesList', function (notesList) {
    var state                  = store.get()
    var transaction            = state.notesState.transact()
    transaction.allNotes       = notesList
    transaction.displayedNotes = notesList
    state.notesState.run()
    showSearchResults(store.get())
  })

  dispatcher.on('addToTextbox', function (character) {
    var state         = store.get()
    var txtboxVal     = state.searchState.textboxValue
    state.searchState.set('textboxValue', txtboxVal + character)
  })

  dispatcher.on('clearTextbox', function () {
    var state         = store.get()
    state.searchState.set('textboxValue', '')
    state.selection.set(resetSelection())
  })

  dispatcher.on('backspaceTextbox', function () {
    var state         = store.get()
    var txtboxVal     = state.searchState.textboxValue
    var backspacedVal = removeLastChar(txtboxVal) 
    state.searchState.set('textboxValue', backspacedVal)
  })

  dispatcher.on('scrollUp', function () {
    var state         = store.get()
    var i             = state.selection.selectionIndex
    scroll(state, i > 0, -1)()
  })

  dispatcher.on('scrollDown', function () {
    var state         = store.get()
    var i             = state.selection.selectionIndex
    var displayed     = state.notesState.displayedNotes
    var maxScroll     = displayed.length
    scroll(state, i < maxScroll, 1)()
  })

  dispatcher.on('openSelectedNote', function (_) {
    var selectedNote   = store.get().selection.selectionValue  
    // if cursor's over the first item
    if (!selectedNote || selectedNote == 0) {
      // make a new note out of that item
      var textboxValue = store.get().searchState.textboxValue
      var file = path.join(notesDir, textboxValue) 
    // otherwise, 
    } else {
      // get the path of the currently selected note
      var file = path.join(notesDir, selectedNote)
    }
    // finally, get the explorer to spawn vim on the file.
    dispatcher.emit('spawnVim', file)
  })

  // whenever the text box's value changes, for whatever reason,
  // update the store
  var l = store.get().searchState.getListener()
  l.on('update', function () {
    var state = store.get()
    showSearchResults(state)
    // reset the selection
    state.selection.set(resetSelection())
  })

  // `store` is an emitter that emits an 'update' function every time a new state comes in
  return store
}

module.exports = setup
