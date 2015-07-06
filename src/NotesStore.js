var Kefir = require('kefir'),
	Freezer = require('freezer-js'),
	fs = require('fs'),
	_ = require('lodash'),


// Filter dispatch (obj) by type (str) -> (Dispatch)
dispatchIsType = function (type, dispatch) {
	if (dispatch.type === type) return dispatch
}

// Filters dispatcher for dispatch (obj) of type -> (Dispatcher)
wire = function (dispatcher, dispatchType) {
	return dispatcher
		.filter(function (d) { return dispatchIsType(dispatchType, d)})
}

// Filters notes for hidden files -> [str...]
filter = function (notes) {
	// remove all hidden files (files that start with '.')
	return _.reject(notes, function (n) {
		return _.first(n) === '.'
	})
}

// -> [str..]
sort = function (notes) {
	// return _.sortBy(notes, 'filename')
	return notes
}

// str, char -> str
addCharToString = function (chr, str) { return str+chr }

// str -> str
removeLastChar = function (val) {
	var len = val.length
	if (len > 0) return val.substring(0,len-2)
	else return val
}

setup = function (dispatcher, dir) {

	// Our immutable store
	store = new Freezer({
		textboxValue: '',
		notes: []
	})

	// Wire the dispatcher to side-effecty functions that update the state
	var on = function (dispatcher, dispatchType, fn) {
		return wire(dispatcher, dispatchType).onValue(fn)
	}

	// TODO - make these return actionStream
	// TODO - then you explicitly merge actionStream in index?

	// {type:'getNotesList'} -> fetch the notes in our directory 
	on(dispatcher, 'getNotesList', function (dispatch) {
		// TODO: through2 pipe list of files ....
		fs.readdir(dir, function (err, notes) {
			if (err) console.log('ERROR FETCHING NOTES!', err)
			// filtering notes
			// update store
			else store.get().notes.set(sort(filter(notes)))
		})
	})

	// {type:'addToTextbox', val: 'j'} -> set textboxValue
	on(dispatcher, 'addToTextbox', function (dispatch) {
		var state = store.get()
		state.set('textboxValue', addCharToString(dispatch.ev, state.textboxValue))
	})

	// {type:'clearTextbox'} -> clear textbox
	on(dispatcher, 'clearTextbox', function() {
		store.get().set('textboxValue', '')
	})

	// {type:'backspaceTextbox'} -> remove last char from textbox
	on(dispatcher, 'backspaceTextbox', function () {
		var state = store.get()
		state.set('textboxValue', removeLastChar(state.textboxValue))
	})

	// Make a stream of state updates
	stateStream = Kefir.fromEvents(store, 'update')

	return stateStream
}

module.exports = setup