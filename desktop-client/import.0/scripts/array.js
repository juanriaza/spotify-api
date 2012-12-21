"use strict";

exports.append       = append;
exports["delete"]    = partial(deleteBy, eq);
exports.deleteBy     = deleteBy;
exports.drop         = drop;
exports.dropWhile    = dropWhile;
exports.range        = partial(steppedRange, 1);
exports.steppedRange = steppedRange;
exports.take         = take;
exports.takeWhile    = takeWhile;
exports.zip          = zip;
exports.shuffle      = shuffle;
exports.contains     = contains;

/**
 * @param {function(*, *):boolean} f
 * @param {*} x
 * @param {Array} ys
 * @return {Array}
 */
function deleteBy(f, x, ys) {
    // Return an array without elements for which f(element, x) === true
    return filter(compose(not, partial(flip(f), x)), ys);
}

/**
 * @param {number} n
 * @param {*} xs
 * @return {Array}
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
 * @param {function(*):boolean} p
 * @param {*} xs
 * @return {Array}
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
 * @param {number} n
 * @param {*} xs
 * @return {Array}
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
 * @param {function(*):boolean} p
 * @param {*} xs
 * @return {Array}
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
 * @param {*} as
 * @param {*} bs
 * @return {Array}
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
 * @param {*} as
 * @param {*} bs
 * @return {Array}
 */
function zip(as, bs) {
    var aLength = as.length;
    var bLength = bs.length;
    var length  = aLength > bLength ?
        bLength : aLength;
    var zipped = [];
    var i = 0;
    while (i < length) {
        zipped[i] = [as[i], bs[i++]];
    }
    return zipped;
}

/**
 * @param {number} n
 * @param {number} a
 * @param {number} b
 * @return {Array}
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
 * @param {Array} a
 * @return {Array}
 */
function shuffle(arr) {
    var result = [];
    var i = arr.length;
    if(0 == i) {return arr}
    while(--i) {
        var j = parseInt(Math.floor(Math.random()*(i+1)))
        var tempi = arr[i];
        var tempj = arr[j];
        arr[i] = tempj;
        arr[j] = tempi;
    }
    return arr;
}

/**
 * @param {Array} a

 * @return {bool}
 */
function contains(arr,value) {
    var i = arr.length;
    while (i--) {
        if (arr[i] == value) {
            return true;
        }
    }
    return false;
}
