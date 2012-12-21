/**
 * Copyright (c) 2012 Spotify Ltd
 * @module {util/events}
 * Events library, inspired by goog.events from Google Closure.
 */

'use strict';

exports.EventHandler = EventHandler;
exports.EventTarget = EventTarget;

// EventHandler is a class which manages a set of event listeners
// and allows cleaning them up in bulk.

/**
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
 * @param {AnyEventTarget|EventTarget} src Event target.
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
 * @param {EventTarget} src EventTarget (needs addEventListener and
 *     removeEventListener methods).
 * @param {string} type Event type.
 * @param {Function} listener Listener callback.
 */
EventHandler.prototype.unlisten = function(src, type, listener) {
  var listeners = this._listeners;
  for (var i = 0; i < listeners.length; i++) {
    var l = listeners[i];
    if (l.src === src && l.type === type && l.originalListener === listener) {
      l.unlisten();
      listeners.splice(i, 1);
      break;
    }
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
 * @constructor
 */
function Listener(src, type, listener, opt_handler) {
  this.src = src;
  this.type = type;
  this.originalListener = listener;
  this.listener = opt_handler ? listener.bind(opt_handler) : listener;
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

/**
 * An implementation of standard event functionality.
 * @constructor
 */
function EventTarget() {
  /**
   * Registered event listeners.
   * @type {Object.<string, function(Object)>}
   * @private
   */
  this._listeners = {};
}

/**
 * Adds a listener function for a specific event type.
 * @param {string} type The event type to listen for.
 * @param {function({type: string})} listener A function that will be called when the event is triggered.
 */
EventTarget.prototype.addEventListener = function(type, listener) {
  var l = this._listeners[type];
  if (l) {
    l.push(listener);
  } else {
    this._listeners[type] = [listener];
  }
};

/**
 * Triggers an event for all listeners.
 * @param {{type: string}} evt The event to dispatch.
 * @return {boolean} False if the event was prevented; otherwise, true.
 */
EventTarget.prototype.dispatchEvent = function(evt) {
  if (!evt || !evt.type) {
    throw new Error('Dispatched event must have a type.');
  }

  var l = this._listeners[evt.type];
  if (!l) return true;

  var r = true;
  evt.preventDefault = function() {
    r = false;
  };
  for (var i = 0; i < l.length; i++) {
    if (l[i].call(this, evt) === false) r = false;
  }
  return r;
};

/**
 * Remove all event listeners.
 */
EventTarget.prototype.remove = function() {
  this._listeners.length = 0;
};

/**
 * Stops sending events of the specified type to the specified listener.
 * @param {string} type The event type.
 * @param {function({type: string})} listener The listener to stop sending events to.
 */
EventTarget.prototype.removeEventListener = function(type, listener) {
  var l = this._listeners[type];
  if (!l) return;
  var idx = l.indexOf(listener);
  if (idx >= 0) l.splice(idx, 1);
};
