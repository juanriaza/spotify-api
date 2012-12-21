'use strict';

var sp = getSpotifyApi();

var arr = sp.require('$util/array');
var fs = sp.require('$util/fs');

var lang = sp.core.language; // Two or three letter IANA code

exports.format = format;
exports.language = lang;
exports.loadCatalog = loadCatalog;
exports.getString = getString;
exports.truncate = truncate;
exports.encodeHTML = encodeHTML;

/**
 * @param {Object} catalog [description].
 * @param {string} category [description].
 * @param {string} id [description].
 */
function getString(catalog, category, id) {
  try {
    return catalog['strings'][category][id]['translations'][lang];
  } catch (e) {
    console.warn('Missing translation', '"' + category + '' >> '' + id + '"');
    return '';
  }
}

/**
 * @param {string} fileName [description].
 * @return {Object} [description].
 */
function loadCatalog(fileName) {
  return JSON.parse(fs.readFile(format('{0}.splang', fileName)));
}

/**
 * @param {string} s [description].
 * @param {Object|Array} replacements [description].
 */
function _format(s, replacements) {
  var fmStr = '';
  var match = null;
  for (var i = 0, l = s.length; i < l; ++i) {
    if ('{' === s[i]) {
      match = '';
      while (s[++i] && '}' !== s[i]) {
        match += s[i];
      }
      if ('}' !== s[i]) {
        throw new Error(format('Invalid format string: {0}', s));
      }
      if (undefined === replacements[match]) {
        throw new Error(format('Key error: {0}', match));
      }
      fmStr += replacements[match];
    } else {
      fmStr += s[i];
    }
  }
  return fmStr;
}

function format(s, replacements) {
  // One or more positional arguments
  if ("object" !== typeof replacements || replacements.constructor === String) {
    replacements = arr.drop(1, arguments);
    return _format(s, replacements);
  }
  // Object/Array of replacements
  return _format(s, replacements);
}

/**
 * Truncate string s to n chars, end with an ellipsis if truncated
 * @param {string} s [description].
 * @param {number} n Number of chars to truncate to. [description].
 */
function truncate(s, n) {
  return n >= s.length ? s : encodeHTML(s.decodeForText().slice(0, n) + '\u2026');
}

var entities = {
  '\"': '&quot;',
  '&': '&amp;',
  "'": ' & apos;',
  ' < ': ' & lt;',
  ' > ': ' & gt;'
};

/**
 * Convert a string, potentially including evil HTML, to plain text
 * @param {string} s [description].
 * @return {string} [description].
 */
function encodeHTML(s) {
  return s.replace(/["&' < >]/g, function(ss) {
    return entities[ss];
  });
}
