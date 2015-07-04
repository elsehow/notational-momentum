var Kefir = require('kefir'),
	Freezer = require('freezer-js'),
	fs = require('fs'),

// Function for filtering dispatches by action type
dispatchType = function (type, dispatch) {
	if (dispatch.type === type) return dispatch
}

getNotesList = function (dir, cb) {
	fs.readdir(dir, cb)
}

setup = function (dispatcher, dir) {

	// Our immutable store
	store = new Freezer({
		notes: []
	})

	// Wire the dispatcher to side-effecty functions that update the state
	dispatcher
		// {type:'getNotesList'} -> fetch the notes in our directory 
		.filter(function (d) { return dispatchType('getNotesList', d)})
		.onValue(function (d) {
			getNotesList(dir, function (err, notes) {
				if (err) console.log('ERROR FETCHING NOTES!', err)
				// update store
				else store.get().notes.set(notes)
			})
		})

	// Make a stream of state updates
	stateStream = Kefir.fromEvents(store, 'update')

	return stateStream
}

module.exports = setup