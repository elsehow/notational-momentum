var Kefir = require('kefir')
  path = require('path'),
  search  = require('and-search'),
  keywords = require('./helpers/keywords.js')

// functions that act on the state

function selectionByIndex (selectionState, i, visibleNotes) {
  return {
    selectionIndex: i,
    selectionValue: visibleNotes[i-1]
  }
}

function showSearchResults (state) {
  var kwords = keywords(state.searchState.textboxValue)
  // search for notes if there are keywords
  if (kwords) {
    var searchResults = search(state.notesState.allNotes, kwords)
  } else {
  // otherwise display all notes
  }
}

function one () { return 1 }
function minusOne () { return -1 }
function sum (a,b) { return a+b }
function emptyString (a,b) { return '' }
function concat (acc, cur) { return acc += cur }
function removeLast (item) { return item }

function setup (dispatcher, notesDir) {

  function fullPath (filename) {
    return path.join(notesDir, filename)
  }

  var typedCharS        = Kefir.fromEvents(dispatcher, 'addToTextbox')
  var backspaceTextboxS = Kefir.fromEvents(dispatcher, 'backspaceTextbox')
  var clearTextboxS     = Kefir.fromEvents(dispatcher, 'clearTextbox')
  var scrollUpS         = Kefir.fromEvents(dispatcher, 'scrollUp').map(one)
  var scrollDownS       = Kefir.fromEvents(dispatcher, 'scrollDown').map(minusOne)
  var openSelectedNoteS = Kefir.fromEvents(dispatcher, 'openSelectedNote')
  var notesList         = Kefir.fromEvents(dispatcher, 'notesList')

  var textboxValue      = typedCharS.scan(concat)
                            //.combine(backspaceTextboxS, removeLast)
                            //.merge(clearTextboxS)

  var scrollPos         = scrollUpS.combine(scrollDownS, sum)

  return textboxValue

//  state obj:
//  we emit this to the renderer
// 
// {
//   textboxVal
//   displayedNotes
//   selectionIndex
// }

}

module.exports = setup
