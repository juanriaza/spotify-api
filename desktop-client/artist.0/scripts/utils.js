/**
 * Returns a nicely formatted date string given either a browse2-style
 * years array or a metadata-style years array.
 *
 * @param {Array} years   Either An array of year strings, or an array
 *                        of year objects {start: year, end: year}.
 *
 * @return {String} A formatted string, for example "80's", "1980-2003",
 *                   "80's, 90's, 00's", etc.
 */
function readableYearsActive(years) {
  if (years === undefined) return '';
  try {
    if (!years.hasOwnProperty('length')) {
      return formatDesktopYearsActive(years);
    } else if (years.length === 1) {
      return formatSingleYearsActive(years);
    } else {
      return formatMultipleYearsActive(years);
    }
  } catch (err) {
    return '';
  }
}

/**
 * Takes an array of year strings and returns a HTML formatted string
 * @param  {Array} years An array of year strings.
 * @return {String} A formatted year string.
 */
function formatDesktopYearsActive(years) {
  var d = new Date();
  var currentYear = d.getFullYear();
  var yearsArray = [];
  // Hack to prevent showing weird number from backend
  if (years.from == '2147483647') {
    return '';
  }

  if (years.to === currentYear) {
    yearsArray.push(years.from + '-');
  } else if (years.from % 10 === 0) { // '90s, 00s'
    for (var i = 0; i < (years.to - years.from); i += 10) {
      yearsArray.push((years.from + i).toString().slice(2) + 's');
    }
  } else {
    if (years.to !== 0 && years.to != '2147483647') {
      yearsArray.push(years.from + '-' + years.to);
    } else {
      yearsArray.push(years.from + '-');
    }
  }
  return yearsArray.join(', ');
}

/**
 * Takes an array representing a single year range and returns a HTML formatted string
 * @param  {Array} years An array of year objects.
 * @return {String} A formatted year string.
 */
function formatSingleYearsActive(years) {
  var d = new Date();
  var currentYear = d.getFullYear();

  if (years[0]['end'] === currentYear) { // '2009-''
    var href = 'spotify:search:year:' + years[0]['start'] + '-2099';
    return '<a class="year" href="' + href.toSpotifyURL() + '">' + years[0]['start'] + '-</a>';
  } else if (years[0]['end'] - years[0]['start'] === 9 && years[0]['start'] % 10 === 0) { // a single '80s'
    var href = 'spotify:search:year:' + years[0]['start'] + '-' + years[0]['end'];
    return '<a class="year" href="' + href.toSpotifyURL() + '">' + years[0]['start'].toString().slice(2) + 's' + '</a>';
  } else { // '2002-2007'
    var href = 'spotify:search:year:' + years[0]['start'] + years[0]['end'];
    return '<a class="year" href="' + href.toSpotifyURL() + '">' + years[0]['start'] + '-' + years[0]['end'] + '</a>';
  }
}

/**
 * Takes an array of multiple years and returns a HTML formatted string
 * @param  {Array} years An array of year objects.
 * @return {String} A formatted year string such as '70s, 80s, 90s'.
 */
function formatMultipleYearsActive(years) {
  var d = new Date();
  var currentYear = d.getFullYear();
  var yearsArray = [];

  for (var i = 0; i < years.length; i++) {
    if (years[i]['end'] - years[i]['start'] === 9) { // '70s, 80s'
      var href = 'spotify:search:year:' + years[i]['start'] + '-' + years[i]['end'];
      yearsArray.push('<a class="year" href="' + href.toSpotifyURL() + '">' + years[i]['start'].toString().slice(2) + 's' + '</a>');
    }
  }
  return yearsArray.join(', ');
}

/**
 * Calculates a readable year given either a browse2-style date object,
 * or a metadata-style browse object.
 *
 * @param {Mixed} date   Either a string or an object containing a year,
 *                     as object.year.
 *
 * @return {String}  Returns a canonical year, like 1820, 2007, etc.
 */
function readableYear(date) {
  if (date === undefined) {
    return '';
  } else if (typeof(date) === 'string' && date !== '0') {
    return date;
  } else if (typeof(date.year) !== 'undefined') {
    return date.year.toString();
  } else {
    return '';
  }
}

/**
 * Returns the higest precision timinig of the client/browser.
 * The variable is a safety check in case of no native performance.
 */
var _timeOffset = new Date().getTime();
function performanceNow() {
  if (window.performance) {
    if (typeof(window.performance.now) === 'function') {
      return window.performance.now();
    } else if (typeof(window.performance.webkitNow) === 'function') {
      return window.performance.webkitNow();
    }
  }
  return new Date().getTime() - _timeOffset;
}

/**
 * Return element position, given a DOM node currently inserted in to the DOM.
 *
 * @param {DOMNode} elem  A node currently inserted to the DOM.
 *
 * @return {Object} Returns an object {top,left,width,height} containing
 *                   the coordinates of the object relative to the document.
 */
function elementPosition(elem) {
  var box = elem.getBoundingClientRect(),
      doc = document.documentElement,
      body = document.getElementsByTagName('body')[0];

  var fixed = $(elem).getStyle('position') === 'fixed';

  var scrollTop = body.scrollTop,
      scrollLeft = body.scrollLeft,
      top = box.top + (fixed ? 0 : scrollTop),
      left = box.left + (fixed ? 0 : scrollLeft);

  return { top: top, left: left, width: box.width, height: box.height };
}

/**
 * Returns the current scroll position of the page relative the top of the page.
 *
 * @return {Object} Returns an object {x,y} of the current position.
 */
function scrollPosition() {
  var x = window.pageXOffset ? window.pageXOffset : document.documentElement.scrollLeft ?
      document.documentElement.scrollLeft : document.body.scrollLeft;
  var y = window.pageYOffset ? window.pageYOffset : document.documentElement.scrollTop ?
      document.documentElement.scrollTop : document.body.scrollTop;

  return {'x': x, 'y': y};
}

/**
 * Returns the amount of space left on the page relative the scroller, so that if
 * the page is 1000px high, and you've scrolled 100px, it returns 900px.
 *
 * @return {number}  Returns the remaining height of the page.
 */
function getScrollableHeight() {
  return window.getScrollSize().y - (window.getScroll().y + window.getSize().y);
}

/**
 * debounce and throttle - ripped from underscore because I am lazy
 * MIT Licensed (http://underscorejs.org/docs/underscore.html)
 */
function debounce(func, wait, immediate) {
  var timeout, result;
  return function() {
    var context = this, args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) result = func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) result = func.apply(context, args);
    return result;
  };
}

function throttle(func, wait) {
  var context, args, timeout, throttling, more, result;
  var whenDone = debounce(function() { more = throttling = false; }, wait);
  return function() {
    context = this; args = arguments;
    var later = function() {
      timeout = null;
      if (more) {
        result = func.apply(context, args);
      }
      whenDone();
    };
    if (!timeout) timeout = setTimeout(later, wait);
    if (throttling) {
      more = true;
    } else {
      throttling = true;
      result = func.apply(context, args);
    }
    whenDone();
    return result;
  };
}

exports.THROBBER_MIN_APPEAR_TIME = 400;
exports.THROBBER_MAX_APPEAR_TIME = 15000;
exports.readableYearsActive = readableYearsActive;
exports.readableYear = readableYear;
exports.elementPosition = elementPosition;
exports.scrollPosition = scrollPosition;
exports.getScrollableHeight = getScrollableHeight;
exports.debounce = debounce;
exports.throttle = throttle;
exports.performanceNow = performanceNow;
