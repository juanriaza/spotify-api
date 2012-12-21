var utils = exports;


/**
 * Hack in support for Function.name for browsers that don't support it.
 * IE, I'm looking at you.
 * http://matt.scharley.me/2012/03/09/monkey-patch-name-ie.html
 */
if (Function.prototype.name === undefined && Object.defineProperty !== undefined) {
  Object.defineProperty(Function.prototype, 'name', {
    get: function() {
      var funcNameRegex = /function\s([^(]{1,})\(/;
      var results = (funcNameRegex).exec((this).toString());
      return (results && results.length > 1) ? results[1].trim() : '';
    },
    set: function(value) {}
  });
}


/**
 * Helper method to throttle execution on resize
 */
utils.throttle = function(fn, delay) {
  var timer = null;
  return function() {
    var context = this, args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function() {
      fn.apply(context, args);
    }, delay);
  };
};

/**
 * Helper method to get scrolled pixels from top.
 */
utils.getScrollTop = function() {
  if ('undefined' !== typeof window.pageYOffset) {
    return window.pageYOffset;
  } else {
    var _b = document.body; // IE 'quirks'
    var _d = document.documentElement; // IE with doctype
    _d = (_d.clientHeight) ? _d : _b;
    return _d.scrollTop;
  }
};

/**
 * Helper method to trim the argument.
 */
utils.trimArgument = function(argument) {
  return argument && argument.length > 1000 ?
      argument.slice(0, 1000 - argument.length) :
      argument;
};

/**
 * Helper method to encode argument.
 */
utils.encodeArgument = function(argument) {
  return argument ? encodeURIComponent(argument) : argument;
};

/**
 * Helper method to get the total number of a dictionary.
 */
utils.getTotal = function(dict) {
  var p = 0;
  for (var key in dict) {
    if (dict.hasOwnProperty(key)) {
      p += parseInt(dict[key], 10);
    }
  }
  return p;
};

/**
 * Helper method to get the total amount in the visible array.
 */
utils.getVisibleTotal = function(arr) {
  var counter = 0;
  for (var i = 0, l = arr.length; i < l; i += 1) {
    for (var j = 0, jL = arr[i].length; j < jL; j += 1) {
      var _key = Object.keys(arr[i][j])[0];
      counter += parseInt(arr[i][j][_key], 10);
    }
  }
  return counter;
};

/**
 * Helper method to fill out the array with fakes
 * Always fill out the last one if all are equal.
 */
utils.fillOutWithFakes = function(arr, row, cols) {
  var loopKey;
  var pos = 0;
  var key = Object.keys(arr[row][0]);
  var min = arr[row][0][key];
  var flag = true;
  while (utils.getVisibleTotal(arr) < cols) {
    for (var j = 0, jL = arr[row].length; j < jL; j += 1) {
      loopKey = Object.keys(arr[row][j])[0];
      if (arr[row][j][loopKey] < min) {
        key = loopKey;
        pos = j;
        flag = false;
        break;
      }
      if (arr[row][j][loopKey] !== min) {
        flag = false;
      }
    }
    if (flag) {
      key = loopKey;
      pos = j - 1;
    }

    arr[row][pos][key] += 1;
    min = arr[row][pos][key];
    flag = true;
  }
  return arr;
};

/**
 * Helper method to get the max value in a dictionary.
 */
utils.getMax = function(dict) {
  var max = 0;
  for (var key in dict) {
    if (dict.hasOwnProperty(key)) {
      max = dict[key] > max ? dict[key] : max;
    }
  }
  return max;
};

/**
 * Helper method to trim down the dictionary to fit within columns
 */
utils.trim = function(dict, cols) {
  var key = Object.keys(dict)[0];
  var max = dict[key];
  while (utils.getTotal(dict) > cols) {
    for (var loopkey in dict) {
      if (max < dict[loopkey]) {
        key = loopkey;
        break;
      }
    }
    dict[key] -= 1;
    max = dict[key];
  }

  return dict;
};

/**
 * Helper method to get a subset of an object
 */
utils.subset = function(object, keys) {
  var results = {};
  for (var i = 0, l = keys.length; i < l; i += 1) {
    var k = keys[i];
    if (k in object) {
      results[k] = object[k];
    }
  }
  return results;
};

/**
 * Helper method to clone an object.
 */
utils.clone = function(obj) {
  if (null === obj || 'object' !== typeof obj) {
    return obj;
  }
  var copy = obj.constructor();
  for (var attr in obj) {
    if (obj.hasOwnProperty(attr)) {
      copy[attr] = obj[attr];
    }
  }
  return copy;
};

