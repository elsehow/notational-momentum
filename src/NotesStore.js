var Kefir = require('kefir'),
	Freezer = require('freezer-js'),
	fs = require('fs'),
	_ = require('lodash'),
	path = require('path'),
	spawnSubl = require('./spawnSubl')

// Filter dispatch (obj) by type (str) -> (Dispatch)
dispatchIsType = function (type, dispatch) {
	if (dispatch.type === type) return dispatch
}

// Filters dispatcher for dispatch (obj) of type -> (Dispatcher)
wire = function (dispatcher, dispatchType) {
	return dispatcher
		.filter(function (d) { return dispatchIsType(dispatchType, d)})
}

// Remove notes that start with '.' [str..] -> [str...]
removeSystemFiles = function (filenames) {
	// remove all hidden files (files that start with '.')
	return _.reject(filenames, function (f) {
		return _.first(f) === '.'
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


// search fns

// str, str2, -> str/null
keywords = function (str) {
  if (_.isString(str) && str.length > 0) {
	var tokens = str.split(' ')
		return _.reject(tokens, function (str) {
  			return str.length == 0
  		})
  	}
}

includes = function (str1, str2) { 
  // ignore case
  if (str1.toLowerCase().indexOf(str2.toLowerCase()) > -1) return str1
}

// [str..] list, str searchStr -> [str..]
filterFor = function (list, searchStr)  {
  return _.filter(list, function(str) {
    return includes(str, searchStr)
  })
}

// [str...] list, [str...] searchTerms => [str...] filteredList
search = function (acc, list, searchTerms) {

  if (searchTerms.length == 0) {
    return acc
  }

  else return search(
    // union of keyword results
    _.union(acc, filterFor(list, _.first(searchTerms)))
    , list
    , _.rest(searchTerms))
}

selectionByIndex = function (selectionState, i, visibleNotes) {
	return {
		selectionIndex: i,
		selectionValue: visibleNotes[i]
	}
}

selectionByValue = function (selectionState, val, visibleNotes) {
	return {
		selectionIndex: _.findIndex(visibleNotes, function (note) { note === val }),
		selectionValue: val
	}
}

// algo for adjusting selected item on search
//	if your selected index is > 0 
//    and your selected object is still in the list, 
//      return your object
//	otherwise, return the first item 
selectSensibleItem = function (selection, notes) {
	if (selection.selectionIndex > 0) {
		if (_.includes(notes, selection.selectionValue)) {
			return selectionByValue(selection, selection.selectionValue, notes)
		}
	}
	else {
		return selectionByIndex(selection, 0, notes)
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
	var on = function (dispatcher, dispatchType, fn) {
		return wire(dispatcher, dispatchType).onValue(fn)
	}

	var resetSelection = function (state) {
		return selectionByIndex(state.selection, 0, state.notesState.displayedNotes)
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
			else {
				var state = reset(store.get()
				var allNotes = sort(removeSystemFiles(notes))
				var transaction = state.notesState.transact()
				transaction.allNotes = allNotes
				transaction.displayedNotes = allNotes
				state.notesState.run()
				// set selection
				state.selection = resetSelection(store.get())
			}
		})
	})

	// {type:'addToTextbox', val: 'j'} -> set textboxValue
	on(dispatcher, 'addToTextbox', function (dispatch) {
		var state = store.get()
		var updatedVal = addCharToString(dispatch.ev, state.searchState.textboxValue)
		state.searchState.set('textboxValue', updatedVal)
	})

	// {type:'clearTextbox'} -> clear textbox
	on(dispatcher, 'clearTextbox', function() {
		var state = store.get()
		state.searchState.set('textboxValue', '')
		// reset selection when textbox is cleared
		state.selection = resetSelection(state)
	})

	// {type:'backspaceTextbox'} -> remove last char from textbox
	on(dispatcher, 'backspaceTextbox', function () {
		var state = store.get()
		var backspacedVal = removeLastChar(state.searchState.textboxValue) 
		state.searchState.set('textboxValue', backspacedVal)
	})

	on(dispatcher, 'scrollUp', function () {
		var state = store.get()
		var i = state.selection.selectionIndex
		if (i > 0) {
			state.set('selection',selectionByIndex(state.selection, i-1, state.notesState.displayedNotes))
		}
	})

	on(dispatcher, 'scrollDown', function () {
		var state = store.get()
		var i = state.selection.selectionIndex
		var displayedNotes = state.notesState.displayedNotes
		if (i < displayedNotes.length) {
			state.set('selection',selectionByIndex(state.selection, i+1, displayedNotes))
		}
	})


	on(dispatcher, 'openSelectedNote', function () {
		var selectedNote = store.get().selection.selectionValue  
		var file = path.join(dir, selectedNote)
		spawnSubl(file)
	})


	// Make a stream of state updates
	stateStream = Kefir.fromEvents(store, 'update')

	// Update displayed notes whenever the text box's value changes
	searchStateListener = store.get().searchState.getListener()
	searchStateListener.on('update', function (_) {
		var state = store.get()
		var kwords = keywords(state.searchState.textboxValue)
		if (kwords) {
			var searchResults = search([], state.notesState.allNotes, kwords)
			state.notesState.set('displayedNotes', searchResults)
			// adjust selection
			state.selection = selectSensibleItem(state.selection, state.notesState.displayedNotes)
		} else {
			state.notesState.set('displayedNotes', state.notesState.allNotes)
			state.selection =resetSelection(state) 
		}
	})

	return stateStream
}

module.exports = setup