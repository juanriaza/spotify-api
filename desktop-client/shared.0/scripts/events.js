/**
 * @fileoverview Various event-related utilities.
 * @module shared/events
 */


/**
 * EventHandler is a class which manages a set of event listeners
 * and allows cleaning them up in bulk.
 * @param {Object=} opt_handler Object in whose scope to call the listeners.
 *     Defaults to the global scope.
 * @constructor
 */
function EventHandler(opt_handler) {
  /**
   * @type {Object}
   * @private
   */
  this._handler = opt_handler || null;

  /**
   * @type {Array.<Listener>}
   * @private
   */
  this._listeners = [];
}

/**
 * Type that represents any object (including DOM elements) that supports the
 * standard event listener interfaces.
 * @typedef {{addEventListener:Function, removeEventListener:Function, dispatchEvent:Function}}
 */
var AnyEventTarget;

/**
 * Listens on an event.
 * @param {AnyEventTarget} src Event target.
 * @param {string} type Event type.
 * @param {Function} listener Listener callback.
 * @return {EventHandler} This object, allowing for chaining calls.
 */
EventHandler.prototype.listen = function(src, type, listener) {
  var listenerObj = new Listener(src, type, listener, this._handler);
  this._listeners.push(listenerObj);
  listenerObj.listen();
  return this;
};

/**
 * Unlistens on an event.
 * @param {AnyEventTarget} src EventTarget (needs addEventListener and
 *     removeEventListener methods).
 * @param {string} type Event type.
 * @param {Function=} opt_listener Listener callback to remove. If undefined,
 *     all listeners for the given event target and type will be removed.
 */
EventHandler.prototype.unlisten = function(src, type, opt_listener) {
  var listeners = this._listeners;
  if (opt_listener) {
    for (var i = 0; i < listeners.length; i++) {
      var l = listeners[i];
      if (l.src === src && l.type === type && l.originalListener === opt_listener) {
        l.unlisten();
        listeners.splice(i, 1);
        break;
      }
    }
  } else {
    var filteredListeners = [];
    for (var i = 0; i < listeners.length; i++) {
      var l = listeners[i];
      if (l.src === src && l.type === type) {
        l.unlisten();
      } else {
        filteredListeners.push(l);
      }
    }
    this._listeners = filteredListeners;
  }
};

/**
 * Removes all event listeners that were created through this handler.
 */
EventHandler.prototype.removeAll = function() {
  var listeners = this._listeners;
  for (var i = 0; i < listeners.length; i++) {
    listeners[i].unlisten();
  }
  listeners.splice(0);
};

/**
 * Listener object to encapsulate state related to listening on an event.
 * @param {AnyEventTarget} src Event target.
 * @param {string} type Event type.
 * @param {Function} listener Listener callback.
 * @param {Object=} opt_handler Object in whose scope to call the listener.
 *     Defaults to the global scope.
 * @constructor
 */
function Listener(src, type, listener, opt_handler) {
  this.src = src;
  this.type = type;
  this.originalListener = listener;

  // TODO(djlee): we don't have a native bind() implementation everywhere; use
  // SP.bind or something instead of this ugliness.
  this.listener = opt_handler ?
      function() { listener.apply(opt_handler, arguments); } :
      listener;
}

/**
 * Attach the listener.
 */
Listener.prototype.listen = function() {
  this.src.addEventListener(this.type, this.listener);
};

/**
 * Detach the listener.
 */
Listener.prototype.unlisten = function() {
  this.src.removeEventListener(this.type, this.listener);
};


exports.EventHandler = EventHandler;
