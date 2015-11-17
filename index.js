#!/usr/bin/env node

var _ = require('lodash'),
  fs = require('fs'),
  EventEmitter = require('events').EventEmitter,
  NotesStore = require ('./src/NotesStore.js'),
  NotesExplorer = require('./src/NotesExplorer.js'),
  listNotes = require('./src/helpers/listNotes.js'),
  // get the notes dir from command line args
  notesDir = process.argv.slice(2)[0]
  notesDir = (_.last(notesDir) === '/') ? notesDir : notesDir + '/'

var dispatcher = new EventEmitter()
// NotesStore returns a stream of application states
// It updates the state based on messages in dispatcher
var store = NotesStore(dispatcher, notesDir)
// NotesExplorer draws the state ot he DOM
// and pushes messages to dispatcher
NotesExplorer(store, dispatcher)

function listFiles () {
  listNotes(notesDir, function (notes) {
    dispatcher.emit('notesList',  notes)
  })
}
// watch the directory
setInterval(listFiles, 2000)
dispatcher.on('listFiles', listFiles)
// do an initial fetch of files in the dir
listFiles()
