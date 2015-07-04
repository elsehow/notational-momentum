var Kefir = require('kefir'),
	KefirBus = require('kefir-bus'),
	NotesStore = require ('./src/NotesStore.js'),
	NotesExplorer = require('./src/NotesExplorer.js'),

// var NotesStore = require ('./src/NotesExplorer.js')
// TODO: read from a conf file
conf = {
	dir: "/home/ffff/Notes/"
}

dispatcher = new KefirBus()

// NotesStore returns a stream of application states
stateStream = NotesStore(dispatcher, conf.dir)
NotesExplorer(stateStream)
// actionStream = NotesExplorer(stateStream)
// dispatcher.merge(actionStream)


// DEBUG
// dispatcher.log('dispatcher')
// stateStream.log('stateStream')


