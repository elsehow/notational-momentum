var Kefir = require('kefir'),
	Freezer = require('freezer-js'),
	fs = require('fs'),
	_ = require('lodash'),
	path = require('path'),
	spawnSubl = require('./helpers/spawnSubl.js'),
	search  = require('./helpers/search.js'),
	keywords = require('./helpers/keywords.js'),
	removeSystemFiles = require('./helpers/removeSystemFiles.js')

// Filter dispatch (obj) by type (str) -> (Dispatch)
dispatchIsType = function (type, dispatch) {
	if (dispatch.type === type) return dispatch
}

// Filters dispatcher for dispatch (obj) of type -> (Dispatcher)
wire = function (dispatcher, dispatchType) {
	return dispatcher
		.filter(function (d) { return dispatchIsType(dispatchType, d)})
}

// -> [str..]
sort = function (notes, dir) {
	return notes.sort(function(a, b) {
               return fs.statSync(dir + b).mtime.getTime() - 
                      fs.statSync(dir + a).mtime.getTime();
	})
}

// str, char -> str
addCharToString = function (chr, str) { return str+chr }

// str -> str
removeLastChar = function (val) {
	var len = val.length
	if (len > 0) return val.substring(0,len-2)
	else return val
}


// search fns

selectionByIndex = function (selectionState, i, visibleNotes) {
	return {
		selectionIndex: i,
		selectionValue: visibleNotes[i-1]
	}
}

selectionByValue = function (selectionState, val, visibleNotes) {
	return {
		selectionIndex: _.findIndex(visibleNotes, function (note) { note === val }),
		selectionValue: val
	}
}

setup = function (dispatcher, dir) {

	// Our immutable store
	store = new Freezer({
		searchState: { textboxValue: '' },
		selection: {
			// we keep a separate state for selection index
			selectionIndex: null,
			// and selection content
			selectionValue: null
		},
		notesState: {
			allNotes: [],
			// displayedNotes is a subset of notes
			displayedNotes: []
		}
	})

	// Wire the dispatcher to side-effecty functions that update the state
	// returns nothing
	var on = function (dispatcher, dispatchType, fn) {
		wire(dispatcher, dispatchType).onValue(function (d) { 
			fn(d, store.get()) 
		})
	}

	var resetSelection = function (state) {
		return {
			selectionIndex: null,
			selectionValue: null
		}
	}

	// {type:'getNotesList'} -> fetch the notes in our directory 
	on(dispatcher, 'getNotesList', function (dispatch, state) {
		// TODO: through2 pipe list of files ....
		fs.readdir(dir, function (err, notes) {
			// handle errors
			if (err) console.log('ERROR FETCHING NOTES!', err)
			// do stuff
			var allNotes = sort(removeSystemFiles(notes), dir)
			var transaction = state.notesState.transact()
			transaction.allNotes = allNotes
			transaction.displayedNotes = allNotes
			state.notesState.run()
			// set selection
			state.selection.set(resetSelection())
		})
	})

	// {type:'addToTextbox', val: 'j'} -> set textboxValue
	on(dispatcher, 'addToTextbox', function (dispatch, state) {
		var updatedVal = addCharToString(dispatch.ev, state.searchState.textboxValue)
		state.searchState.set('textboxValue', updatedVal)
	})

	// {type:'clearTextbox'} -> clear textbox
	on(dispatcher, 'clearTextbox', function (_, state) {
		state.searchState.set('textboxValue', '')
		state.selection.set(resetSelection())
	})

	// {type:'backspaceTextbox'} -> remove last char from textbox
	on(dispatcher, 'backspaceTextbox', function (_, state) {
		var backspacedVal = removeLastChar(state.searchState.textboxValue) 
		state.searchState.set('textboxValue', backspacedVal)
	})

	// dir is 1 or -1
	var scroll = function (state, comparison, dir) {
		return function () {
			if (comparison) state.set('selection', 
				selectionByIndex(state.selection, state.selection.selectionIndex+dir, state.notesState.displayedNotes))
		}
	}

	on(dispatcher, 'scrollUp', function (_, state) {
		var i = state.selection.selectionIndex
		scroll(state, i > 0, -1)()
	})

	on(dispatcher, 'scrollDown', function (_, state) {
		var i = state.selection.selectionIndex
		var displayedNotes = state.notesState.displayedNotes
		scroll(state, i < displayedNotes.length, 1)()
	})


	on(dispatcher, 'openSelectedNote', function () {
		var selectedNote = store.get().selection.selectionValue  
		if (!selectedNote || selectedNote == 0) {
			var textboxValue = store.get().searchState.textboxValue
			var file = path.join(dir, textboxValue)	
		} else {
			var file = path.join(dir, selectedNote)
		}
		spawnSubl(file)
	})

	// Make a stream of state updates
	stateStream = Kefir.fromEvents(store, 'update')

	// Update displayed notes whenever the text box's value changes
	searchStateListener = store.get().searchState.getListener()
	searchStateListener.on('update', function (_) {
		var state = store.get()
		var kwords = keywords(state.searchState.textboxValue)
		// search for notes if there are keywords
		if (kwords) {
			var searchResults = search([], state.notesState.allNotes, kwords)
			state.notesState.set('displayedNotes', searchResults)
		// otherwise display all notes
		} else 
			state.notesState.set('displayedNotes', state.notesState.allNotes)
		// either way, reset the selection
		state.selection.set(resetSelection())
		
	})

	return stateStream
}

module.exports = setup
