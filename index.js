var Kefir = require('kefir'),
  KefirBus = require('kefir-bus'),
  NotesStore = require ('./src/NotesStore.js'),
  NotesExplorer = require('./src/NotesExplorer.js'),
  fs = require('fs'),
  listNotes = require('./src/helpers/listNotes.js'),
  conf = require('./config.js')

var dispatcher = new KefirBus()
// NotesStore returns a stream of application states
// It updates the state based on messages in dispatcher
var stateStream = NotesStore(dispatcher, conf)
// NotesExplorer draws the state ot he DOM
// , and pushes messages to dispatcher
NotesExplorer(stateStream, dispatcher)

function listFiles () {
  listNotes(conf.notesDir, function (notes) {
    dispatcher.emit({
      type: 'notesList',
      notes: notes 
    })
  })
}
// watch the directory
// run list-files task whenever there's a change in the directory
setInterval(listFiles, 3000)
// do an initial fetch of files
listFiles()
