var EventEmitter = require('events').EventEmitter
  , test = require('tape')

var store = require('../src/NotesStore.js')
var dispatcher = new EventEmitter()
var stateS = store(dispatcher)


function testStream (t, answers, stream) {
  var i = 0
  function c (v) {
    if (i == answers.length) {
      stream.offValue(c)
      t.end()
    }
    t.equals(v, answers[i])
    i+=1
  }
  stream.onValue(c)
}

test('adding chars to textbox', function (t) {
  var ans = [
    'a', 'ab', 'abc'
  ]
  testStream(t, ans, stateS)
  dispatcher.emit('addToTextbox', 'a')
  dispatcher.emit('addToTextbox', 'b')
  dispatcher.emit('addToTextbox', 'c')
})

test('backspace chars to textbox', function (t) {
  var ans = [
    'abcde', 'abcdef'
  ]
  testStream(t, ans, stateS)
  //dispatcher.emit('addToTextbox', 'e')
  //dispatcher.emit('addToTextbox', 'f')
})


