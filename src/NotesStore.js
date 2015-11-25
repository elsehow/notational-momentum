var Kefir = require('kefir')
  path = require('path'),
  search  = require('and-search'),
  keywords = require('./helpers/keywords.js'),
  _ = require('lodash')

function one () { return 1 }
function minusOne () { return -1 }
function sum (a,b) { return a+b }
function emptyString (a,b) { return '' }
function concat (acc, cur) { return acc += cur }
var backspaceKeyword = 'BKSP'
var clearKeyword = 'CLR'
function intoBackspaceKeyword () { return backspaceKeyword }
function intoClearKeyword() { return clearKeyword }
function concatTextbox (acc, cur) {
  if (cur === backspaceKeyword)
    return _.initial(acc).join('')
  if (cur === clearKeyword)
    return ''
  return concat(acc, cur)
}
function asKey (k) {
  return function (v) {
    return [k, v]
  }
}
function searchIfNotes (notes, textboxVal) {
  var kwords = keywords(textboxVal)
  // search for notes if there are keywords
  if (kwords) {
    var res = search(notes, kwords)
    return res
}
  return notes
}

function setup (dispatcher, notesDir) {

  // our app state
  var state = {}
  // takes a values of the form [key, value]
  function intoState (v) {
    state[v[0]] = v[1]
    return state
  }

  function fullPath (filename) {
    return path.join(notesDir, filename)
  }

  var typedCharS        = Kefir.fromEvents(dispatcher, 'addToTextbox')
  var backspaceTextboxS = Kefir.fromEvents(dispatcher, 'backspaceTextbox').map(intoBackspaceKeyword)
  var clearTextboxS     = Kefir.fromEvents(dispatcher, 'clearTextbox').map(intoClearKeyword)
  var scrollUpS         = Kefir.fromEvents(dispatcher, 'scrollUp').map(one)
  var scrollDownS       = Kefir.fromEvents(dispatcher, 'scrollDown').map(minusOne)
  var openSelectedNoteS = Kefir.fromEvents(dispatcher, 'openSelectedNote')
  var notesList         = Kefir.fromEvents(dispatcher, 'notesList')

  var textboxValue      = typedCharS
                            .merge(backspaceTextboxS)
                            .merge(clearTextboxS)
                            .scan(concatTextbox)
                            .toProperty(function () { return '' })

  var scrollPos         = scrollUpS.combine(scrollDownS, sum)

  var displayedNotes    = notesList
                            .combine(textboxValue, searchIfNotes)

// TODO
// scroll up and down the list
// select something
  
//  state obj:
//  we emit this to the renderer
// 
// {
//   textboxVal
//   displayedNotes
//   selectionIndex
// }

  var stateStream = Kefir.merge([
    textboxValue.map(asKey('textboxVal'))
  , displayedNotes.map(asKey('displayedNotes'))
  ]).map(intoState)
                            
                            


  return stateStream

}

module.exports = setup
