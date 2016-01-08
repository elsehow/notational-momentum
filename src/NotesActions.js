// register our actions here 
var makeActions = function (emitter) {

  return {

    addToTextbox: function (ev) {
      emitter.emit('addToTextbox',  ev)
    },

    clearTextbox: function () {
      emitter.emit('clearTextbox')
    },

    backspaceTextbox: function () {
      emitter.emit('backspaceTextbox')
    },

    scrollUp: function () {
      emitter.emit('scrollUp')
    },

    scrollDown: function () {
      emitter.emit('scrollDown')
    },

    openSelectedNote: function () {
      emitter.emit('openSelectedNote')
    },

    deleteSelectedNote: function () {
      emitter.emit('deleteSelectedNote')
    },

  }
}

module.exports = makeActions
