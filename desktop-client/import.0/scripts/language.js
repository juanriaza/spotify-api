"use strict";

var sp = getSpotifyApi(1);

var arr = sp.require("sp://import/scripts/array");
var fs = sp.require("sp://import/scripts/fs");

var lang = sp.core.language; // Two or three letter IANA code

exports.format      = format;
exports.language    = lang;
exports.loadCatalog = loadCatalog;
exports.getString   = getString;
exports.truncate    = truncate;
exports.encodeHTML  = encodeHTML;

/**
 * @param {Object} catalog
 * @param {string} category
 * @param {string} id
 */
function getString(catalog, category, id) {
	return catalog["strings"][category][id]["translations"][lang];
}

/**
 * @param {string} fileName
 * @param {string} path
 * @return {Object}
 */
function loadCatalog(fileName, path) {
    if (path === undefined)
        path = "sp://import/";
	return JSON.parse(fs.readFile(format(path + "{0}.splang", fileName)));
}

/**
 * @param {string} s
 * @param {Object|Array} replacements
 */
function _format(s, replacements) {
    var fmStr = "";
    var match = null;
    for (var i = 0, l = s.length; i < l; ++i) {
        if ('{' === s[i]) {
            match = "";
            while (s[++i] && '}' !== s[i]) {
                match += s[i];
            }
            if ('}' !== s[i]) {
                throw new Error(format("Invalid format string: {0}", s));
            }
            if (undefined === replacements[match]) {
                throw new Error(format("Key error: {0}", match));
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
    if ("object" !== typeof replacements) {
        replacements = arr.drop(1, arguments);
        return _format(s, replacements);
    }
    // Object/Array of replacements
    return _format(s, replacements);
}

/**
 * Truncate string s to n chars, end with an ellipsis if truncated
 * @param {string} s
 * @param {number} n Number of chars to truncate to
 */
function truncate(s, n) {
    return n >= s.length ? s : encodeHTML(s.decodeForText().slice(0, n) + "\u2026");
};

var entities = {
    "\"": "&quot;",
    "&": "&amp;",
    "'": "&apos;",
    "<": "&lt;",
    ">": "&gt;"
};

/**
 * Convert a string, potentially including evil HTML, to plain text
 * @param {string} s
 * @return {string}
 */
function encodeHTML(s) {
    return s.replace(/["&'<>]/g, function(ss) {
        return entities[ss];
    });
}
