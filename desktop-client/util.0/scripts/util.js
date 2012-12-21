'use strict';

/**
 * Convert an Array-like object (like an arguments object) to Array
 * @param {*} arrLike Sufficiently Array-like object.
 * @param {number=} opt_begin Zero-based index at which to begin extraction.
 * @param {number=} opt_end Zero-based index at which to end extraction (exclusive).
 * @return {Array} [description].
 */
function toArray(arrLike, opt_begin, opt_end) {
  return Array.prototype.slice.call(arrLike, opt_begin, opt_end);
}

/**
 * Concatenate an array of arrays
 * @param {Array} arr Array to concat.
 * @return {Array} [description].
 */
function concat(arr) {
  return foldl(function(a, b) {
    return a.concat(b);
  }, [], arr);
}

/**
 * Merge multiple objects
 * @ param {...Object} objects Variable number of objects to merge
 *  from left to right.
 * @return {Object} [description].
 */
function merge(/*obj1, obj2, ...*/) {
  var objects = toArray(arguments),
      target = objects.shift();
  objects.forEach(function(obj) {
    Object.keys(obj).forEach(function(k) {
      target[k] = obj[k];
    });
  });
  return target;
}

/**
 * Internal function used to implement `throttle` and `debounce`.
 * @param {function(...):*} func [description].
 * @param {integer} wait [description].
 * @param {boolean} debounce [description].
 * @return {function(...):*} [description].
 */
function limit(func, wait, debounce) {
  var timeout;
  return function() {
    var context = this, args = arguments;
    var throttler = function() {
      timeout = null;
      func.apply(context, args);
    };
    if (debounce) clearTimeout(timeout);
    if (debounce || !timeout) timeout = setTimeout(throttler, wait);
  };
}

/**
 * Returns a function, that, when invoked, will only be triggered at most once
 * during a given window of time.
 * @param {function(...):*} func [description].
 * @param {integer} wait [description].
 * @return {function(...):*} [description].
 */
function throttle(func, wait) {
  return limit(func, wait, false);
}

/**
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds.
 * @param {function(...):*} func [description].
 * @param {integer} wait [description].
 * @return {function(...):*} [description].
 */
function debounce(func, wait) {
  return limit(func, wait, true);
}

/**
 * Returns a function that will be executed at most one time, no matter how
 * often you call it. Useful for lazy initialization.
 * @param {function(...):*} func [description].
 * @return {function(...):*} [description].
 */
function once(func) {
  var ran = false, memo;
  return function() {
    if (ran) return memo;
    ran = true;
    return memo = func.apply(this, arguments);
  };
}

/**
 * Create arrays containing arithmetic progressions.
 * @ param {integer} start The first number in the sequence.
 * @ param {integer} stop The last number in the sequence.
 * @ param {integer} step The size of each step.
 */
function range() {
  var L = arguments, start, stop, step, r = [];
  if (L.length == 1) {
    start = 0, stop = L[0], step = 1;
  } else {
    start = L[0], stop = L[1], step = L[2] == null ? 1 : L[2];
  }
  for (var i = start; step > 0 ? i < stop : i > stop; i += step) {
    r.push(i);
  }
  return r;
}

exports.concat = concat;
exports.merge = merge;
exports.toArray = toArray;
exports.throttle = throttle;
exports.debounce = debounce;
exports.once = once;
exports.range = range;
