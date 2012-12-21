'use strict';

var sp = getSpotifyApi();

var util = sp.require('$util/util');

// The states that a Promise can have
var STATES = {
  WAITING: 0,
  RESOLVED: 1,
  REJECTED: 2
};

/**
 * Promise constructor
 * @constructor
 */
function Promise() {
  // Avoid modifying the global object if called without `new`
  if (!isPromise(this)) {
    return new Promise();
  }

  var state = STATES.WAITING,
      callbacks = {},
      result;

  callbacks[STATES.RESOLVED] = [];
  callbacks[STATES.REJECTED] = [];

  function notify(args, newState, force) {
    // Ugly...
    if (STATES.WAITING !== state && true !== force) {
      return this;
    }
    result = result || args;
    state = newState;
    callbacks[newState].forEach(function(callback) {
      callback.apply(callback, args);
    });
    callbacks[newState].length = 0;
    return this;
  }

  this.getState = function() {
    return state;
  };

  this.then = function(resolved, rejected) {
    resolved && callbacks[STATES.RESOLVED].push(resolved);
    rejected && callbacks[STATES.REJECTED].push(rejected);
    // Call immediately if already done
    if (STATES.WAITING !== state) {
      notify.call(this, result, state, true);
    }
    return this;
  };

  this.resolve = function(/*arguments*/) {
    return notify.call(this, idMap(arguments),
        STATES.RESOLVED);
  };

  this.reject = function(/*arguments*/) {
    return notify.call(this, idMap(arguments),
        STATES.REJECTED);
  };

  this.valueOf = function() {
    return result;
  }
}

/**
 * Always call this callback, on resolve or reject
 * @param {Function} callback The callback.
 */
Promise.prototype.always = function(callback) {
  return this.then(callback, callback);
};

/**
 * Check if passed in value is a Promise
 * @param {*} value [description].
 * @return {Boolean} [description].
 */
function isPromise(value) {
  return value instanceof Promise;
}

/**
 * Creates a new promise that is resolved when all passed in promises are resolved
 * Or rejected as soon as any of the passed in promises is rejected.
 * When resolved, the callback receives all values from all promises, in order,
 * as a variable number of arguments to the callback.
 * @ param {...Promise} promises Any number of promises to join.
 * @return {Promise} [description].
 */
function join(/*promises*/) {
  var promises = idMap(arguments),
      waiting = promises.length,
      promise = new Promise(),
      results = [];

  // When all promises have resolved, resolve the new one
  promises.forEach(function(p, i) {
    p.always(function() {
      --waiting;
      if (STATES.REJECTED === p.getState()) {
        // One promise failed, reject the new one
        promise.reject.apply(promise, p.valueOf());
        return;
      }
      results[i] = p.valueOf(); // Add results in order
      // All done! Resolve the new promise with all results
      if (!waiting) {
        promise.resolve.apply(promise, util.concat(results));
      }
    });
  });

  return promise;
}

exports.Promise = Promise;
exports.isPromise = isPromise;
exports.join = join;
