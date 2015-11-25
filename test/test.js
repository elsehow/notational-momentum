var EventEmitter = require('events').EventEmitter
  , test = require('tape')
  , _ = require('lodash')

var store = require('../src/NotesStore.js')
var dispatcher = new EventEmitter()
var stateS = store(dispatcher, '/test/dir/')


var fakeNotes = [
  'very cool note',
  'things good and pending',
  'my client work',
  'assorted notes on trout',
  'mighty casey has just struck trout'
]

function testStream (t, answers, stream, prop) {
  stream = stream.map(_.property(prop)).skipDuplicates()
  var i = 0
  function c (v) {
    t.deepEquals(v, answers[i], v + ' should be ' + answers[i])
    i+=1
    if (i == answers.length) {
      stream.offValue(c)
      t.end()
    }
  }
  stream.onValue(c)
}


test('adding chars to textbox', function (t) {
  var ans = [
    '', 'a', 'ab', 'abc'
  ]
  testStream(t, ans, stateS, 'textboxVal')
  dispatcher.emit('addToTextbox', 'a')
  dispatcher.emit('addToTextbox', 'b')
  dispatcher.emit('addToTextbox', 'c')
})

test('backspace chars from textbox', function (t) {
  var ans = [
    'abc', 'abcd', 'abc'
  ]
  testStream(t, ans, stateS, 'textboxVal')
  dispatcher.emit('addToTextbox', 'd')
  dispatcher.emit('backspaceTextbox')
})

test('clear textbox', function (t) {
  var ans = [
    'abc', '', 'a', ''
  ]
  testStream(t, ans, stateS, 'textboxVal')
  dispatcher.emit('clearTextbox')
  dispatcher.emit('addToTextbox', 'a')
  dispatcher.emit('clearTextbox')
})

test('can take notes list', function (t) {
  var ans = [
    undefined, 
    fakeNotes, 
  ]
  testStream(t, ans, stateS, 'displayedNotes')
  dispatcher.emit('notesList', fakeNotes)
})

test('can search for notes', function (t) {
  var ans = [
    fakeNotes,
    [ 'my client work',
      'mighty casey has just struck trout'
    ],
    [ 'my client work'],
    fakeNotes
  ]
  testStream(t, ans, stateS, 'displayedNotes')
  dispatcher.emit('addToTextbox', 'm')
  dispatcher.emit('addToTextbox', 'y')
  dispatcher.emit('clearTextbox')
})


test('can scroll up and down list', function (t) {
  var ans = [
   0,
   1,
   2,
   1,
   0,
   1,
   2,
   3,
   4,
   4,
   4,
   // 1,
   // 1,
   // 0,
  ]
  testStream(t, ans, stateS, 'selectionIndex')
  dispatcher.emit('addToTextbox', 'm') // makes it display only 2 notes
  dispatcher.emit('scrollDown') // 1 
  dispatcher.emit('scrollDown') // 2
  dispatcher.emit('scrollDown') // we're at bottom! shouldn't scroll anymore. should see nothing.
  dispatcher.emit('scrollDown') // we're at bottom! shouldn't scroll anymore. should see nothing.
  dispatcher.emit('scrollUp') // now we should see 1
  dispatcher.emit('scrollUp') // 0
  dispatcher.emit('scrollUp') // we're at top! shouldnt scroll anymore
  dispatcher.emit('scrollUp') // we're at top! shouldnt scroll anymore
  dispatcher.emit('clearTextbox')
  dispatcher.emit('scrollDown') // 1 
  dispatcher.emit('scrollDown') // 2
  dispatcher.emit('scrollDown') // 3
  dispatcher.emit('scrollDown') // 4
  dispatcher.emit('scrollDown') // we're at bottom! shouldn't scroll anymore. should see nothing.
  dispatcher.emit('scrollDown') // we're at bottom! shouldn't scroll anymore. should see nothing.
  // dispatcher.emit('addToTextbox', 'm') // makes it display only 2 notes - now we should see 1
  // dispatcher.emit('scrollUp') // 0
  // dispatcher.emit('scrollUp') // we're at top! shouldnt scroll anymore
  // dispatcher.emit('scrollUp') // we're at top! shouldnt scroll anymore
  // dispatcher.emit('scrollUp') // we're at top! shouldnt scroll anymore
})


test.skip('can `spawnVim on the selected file', function (t) {

  dispatcher.emit('clearTextbox')

  dispatcher.on('spawnVim', function (f) {
    t.deepEquals(f, '/test/dir/very cool note')
    dispatcher.removeAllListeners('spawnVim')
  })
  dispatcher.emit('openSelectedNote')

})




