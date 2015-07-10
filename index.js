var Kefir = require('kefir'),
	KefirBus = require('kefir-bus'),
	NotesStore = require ('./src/NotesStore.js'),
	NotesExplorer = require('./src/NotesExplorer.js'),

// var NotesStore = require ('./src/NotesExplorer.js')
// TODO: read from a conf file
conf = {
	// dir: "/home/ffff/Notes/"
	dir: "/home/ffff/Notes/"
}

dispatcher = new KefirBus()
// NotesStore returns a stream of application states
// It updates the state based on messages in dispatcher
stateStream = NotesStore(dispatcher, conf.dir)
// NotesExplorer draws the state ot he DOM
// , and pushes messages to dispatcher
NotesExplorer(stateStream, dispatcher)
