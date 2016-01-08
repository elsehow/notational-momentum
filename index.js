#!/usr/bin/env node

var _ = require('lodash'),
  fs = require('fs'),
  EventEmitter = require('events').EventEmitter,
  NotesStore = require ('./src/NotesStore.js'),
  NotesExplorer = require('./src/NotesExplorer.js'),
  listNotes = require('./src/helpers/listNotes.js'),
  argv = require('minimist')(process.argv.slice(2))

// the notes dir is from command line argument -d
// - or, it's the current directory.
var notesDir = argv.d ? argv.d : __dirname
// add trailing slash to directory, if there is none (just to be safe on *nix)
notesDir = (_.last(notesDir) === '/') ? notesDir : notesDir + '/'
// get the notetaker command from argument -p
// - or, vim, if there is none
var launchCommand = argv.p ? argv.p : 'vim'

console.log('launching', notesDir, launchCommand, argv)


var dispatcher = new EventEmitter()
// NotesStore returns a stream of application states
// It updates the state based on messages in dispatcher
var store = NotesStore(dispatcher, notesDir)
// NotesExplorer draws the state ot he DOM
// and pushes messages to dispatcher
NotesExplorer(store, dispatcher, launchCommand)

function listFiles () {
  listNotes(notesDir, function (notes) {
    dispatcher.emit('notesList',  notes)
  })
}
// watch the directory
setInterval(listFiles, 2000)
// look the files up again, if anyone asks us to
dispatcher.on('listFiles', listFiles)
// do an initial fetch of files in the dir
listFiles()
