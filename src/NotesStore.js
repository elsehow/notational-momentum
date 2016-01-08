var Kefir = require('kefir')
  path = require('path'),
  search  = require('and-search'),
  exec = require('child_process').exec,
  keywords = require('./helpers/keywords.js'),
  _ = require('lodash')

var backspaceKeyword = 'BKSP'
var clearKeyword = 'CLR'
function zero () { return 0 }
function one () { return 1 }
function minusOne () { return -1 }
function sum (a,b) { return a+b }
function emptyString (a,b) { return '' }
function greaterThanZero (x) { return x > 0 }
function concat (acc, cur) { return acc += cur }
function intoBackspaceKeyword () { return backspaceKeyword }
function intoClearKeyword() { return clearKeyword }

function concatTextbox (acc, cur) {
  if (cur === backspaceKeyword)
    return _.initial(acc).join('')
  if (cur === clearKeyword)
    return ''
  return concat(acc, cur)
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

  function pathTo (filename) {
    return path.join(notesDir, filename)
  }

  var typedCharS        = Kefir.fromEvents(dispatcher, 'addToTextbox')
  var backspaceTextboxS = Kefir.fromEvents(dispatcher, 'backspaceTextbox').map(intoBackspaceKeyword)
  var clearTextboxS     = Kefir.fromEvents(dispatcher, 'clearTextbox').map(intoClearKeyword)
  var scrollUpS         = Kefir.fromEvents(dispatcher, 'scrollUp').map(minusOne)
  var scrollDownS       = Kefir.fromEvents(dispatcher, 'scrollDown').map(one)
  var openSelectedNoteS = Kefir.fromEvents(dispatcher, 'openSelectedNote')
  var delSelectedNoteS  = Kefir.fromEvents(dispatcher, 'deleteSelectedNote')
  var notesList         = Kefir.fromEvents(dispatcher, 'notesList')

  // compute textbox value
  var textboxValue      = typedCharS
                            .merge(backspaceTextboxS)
                            .merge(clearTextboxS)
                            .scan(concatTextbox)
                            .toProperty(function () { return '' })

  // compute displayed notes
  var displayedNotes    = notesList
                            .combine(textboxValue, searchIfNotes)

  // HACK
  // we use this to refer to notesLength when scrolling :(
  var notesLength       = 0

  // compute index of selected note
  var selectionIndex    = scrollUpS
                            .merge(scrollDownS)
                            .scan(function (acc, cur) {
                              acc += cur
                              if (acc < 0) 
                                return 0
                              if (acc > notesLength)
                                return notesLength
                              return acc
                            }
                            , 0)
                            .toProperty(zero)

  // update currently selected note when displayed notes are updated
  selectionIndex = Kefir.combine([displayedNotes, selectionIndex], function (d, i) {
    notesLength = d.length
    if (i > notesLength) {
      return notesLength
    }
    return i
  })

  // compute path to currnetly selected note
  var currentlySelectedNote = Kefir 
    .combine([displayedNotes, selectionIndex, textboxValue], function (n, i, t) { 
      // if the index is 0
      // should open textbox value OR a blank note.
      if (i == 0)
        return t
      return n[i-1] 
    })

  // send command to open files
  currentlySelectedNote
    .sampledBy(openSelectedNoteS)
    .onValue(function (note) {
      dispatcher.emit('launchCommand', pathTo(note))
    })

  // send command to delete files
  currentlySelectedNote
    .sampledBy(delSelectedNoteS)
    .onValue(function (note) {
        var p = pathTo(note)
        exec('rm ' + p, (err) => {
            if (err) console.log(err) 
            // update files now, in case user just saved something
            dispatcher.emit('listFiles')
        })
    })
  
// return a stream of objects
// we emit this to the renderer
  return Kefir.combine([textboxValue, displayedNotes, selectionIndex], function (t, d, i) {
    return {
      textboxVal: t,
      displayedNotes: d,
      selectionIndex: i,
    }
  })

}

module.exports = setup
