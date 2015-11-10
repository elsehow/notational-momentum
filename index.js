#!/usr/bin/env node

var Kefir = require('kefir'),
  KefirBus = require('kefir-bus'),
  NotesStore = require ('./src/NotesStore.js'),
  NotesExplorer = require('./src/NotesExplorer.js'),
  fs = require('fs'),
  listNotes = require('./src/helpers/listNotes.js'),
  notesDir = process.argv.slice(2)[0]
  notesDir = (notesDir[notesDir.length] === '/') ? notesDir : notesDir + '/'

var dispatcher = new KefirBus()
// NotesStore returns a stream of application states
// It updates the state based on messages in dispatcher
var stateStream = NotesStore(dispatcher, notesDir)
// NotesExplorer draws the state ot he DOM
// , and pushes messages to dispatcher
NotesExplorer(stateStream, dispatcher)

function listFiles () {
  listNotes(notesDir, function (notes) {
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
