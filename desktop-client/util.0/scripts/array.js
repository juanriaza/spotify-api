'use strict';

exports.append = append;
exports['delete'] = partial(deleteBy, eq);
exports.deleteBy = deleteBy;
exports.drop = drop;
exports.dropWhile = dropWhile;
exports.range = partial(steppedRange, 1);
exports.steppedRange = steppedRange;
exports.take = take;
exports.takeWhile = takeWhile;
exports.zip = zip;
exports.shuffle = shuffle;
exports.contains = contains;

/**
 * @param {function(*, *):boolean} f [description].
 * @param {*} x [description].
 * @param {Array} ys [description].
 * @return {Array} [description].
 */
function deleteBy(f, x, ys) {
  // Return an array without elements for which f(element, x) === true
  return filter(compose(not, partial(flip(f), x)), ys);
}

/**
 * @param {number} n [description].
 * @param {*} xs [description].
 * @return {Array} [description].
 */
function take(n, xs) {
  var length = xs.length;
  var xs_ = [];
  var i = 0;
  if (n > length) {
    n = length;
  }
  while (i < n) {
    xs_[i] = xs[i++];
  }
  return xs_;
}

/**
 * Take items from array until p fails
 * @param {function(*):boolean} p [description].
 * @param {*} xs [description].
 * @return {Array} [description].
 */
function takeWhile(p, xs) {
  var length = xs.length;
  var xs_ = [];
  var i = 0;
  while (i < length) {
    if (true === p(xs[i])) {
      xs_[i] = xs[i++];
      continue;
    }
    break;
  }
  return xs_;
}

/**
 * @param {number} n [description].
 * @param {*} xs [description].
 * @return {Array} [description].
 */
function drop(n, xs) {
  var length = xs.length;
  var xs_ = [];
  var i = 0;
  while (n < length) {
    xs_[i++] = xs[n++];
  }
  return xs_;
}

/**
 * Drop items from while p succeeds
 * @param {function(*):boolean} p [description].
 * @param {*} xs [description].
 * @return {Array} [description].
 */
function dropWhile(p, xs) {
  var length = xs.length;
  var xs_ = [];
  var i = 0;
  var j = 0;
  while (i < length) {
    if (true === p(xs[i])) {
      ++i;
      continue;
    }
    xs_[j++] = xs[i++];
  }
  return xs_;
}

/**
 * @param {*} as [description].
 * @param {*} bs [description].
 * @return {Array} [description].
 */
function append(as, bs) {
  var cs = [];
  var aLength = as.length;
  var length = aLength + bs.length;
  for (var i = 0; i < length; ++i) {
    cs[i] = i < aLength ? as[i] : bs[i - aLength];
  }
  return cs;
}

/**
 * @param {*} as [description].
 * @param {*} bs [description].
 * @return {Array} [description].
 */
function zip(as, bs) {
  var aLength = as.length;
  var bLength = bs.length;
  var length = aLength > bLength ?
      bLength : aLength;
  var zipped = [];
  var i = 0;
  while (i < length) {
    zipped[i] = [as[i], bs[i++]];
  }
  return zipped;
}

/**
 * @param {number} n [description].
 * @param {number} a [description].
 * @param {number} b [description].
 * @return {Array} [description].
 */
function steppedRange(n, a, b) {
  var xs = [];
  var i = 0;
  while (a <= b) {
    xs[i++] = a;
    a += n;
  }
  return xs;
}

/**
 * @param {Array} arr [description].
 * @return {Array} [description].
 */
function shuffle(arr) {
  var result = [];
  var i = arr.length;
  if (0 === i) {
    return arr;
  }
  while (--i) {
    var j = parseInt(Math.floor(Math.random() * (i + 1)), 10);
    var tempi = arr[i];
    var tempj = arr[j];
    arr[i] = tempj;
    arr[j] = tempi;
  }
  return arr;
}

/**
 * @param {Array} arr [description].

 * @return {boolean} [description].
 */
function contains(arr, value) {
  var i = arr.length;
  while (i--) {
    if (arr[i] == value) {
      return true;
    }
  }
  return false;
}
