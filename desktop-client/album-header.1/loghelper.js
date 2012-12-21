/**
 * Click logging helper
 * @author Per-Olov Jernberg <po@spotify.com>
 */

'use strict';

var sp = getSpotifyApi();
var logger = sp.require('$util/logger');

/**
 * TODO: Description
 */
exports.testVersion = '';

/**
 * TODO: Description
 *
 * @param {String} context Context in app.
 * @param {String} evt Event type.
 * @param {String} evt_version Event version.
 * @param {Object} args Arguments.
 */
exports.log = function(context, evt, evt_version, args) {
  logger.logClientEvent(context, evt, evt_version, exports.testVersion, args);
};

var _findAttribute = function(root, name) {
  if (root.getAttribute) {
    var value = root.getAttribute(name);
    if (value)
      return value;
    if (root.parentNode != null)
      return _findAttribute(root.parentNode, name);
  }
  return undefined;
};

/**
 * TODO: Document
 *
 * @param {Element} element Tracking element.
 */
exports.logElement = function(element) {
  if (event.srcElement) {
    if (event.srcElement.tagName == 'A' ||
        event.srcElement.tagName == 'INPUT' ||
        event.srcElement.tagName == 'BUTTON') {
      var href = _findAttribute(event.srcElement, 'href') || '';
      var logcontext = _findAttribute(event.srcElement, 'data-logcontext') || '';
      var logevent = _findAttribute(event.srcElement, 'data-logevent') || '';
      var logversion = _findAttribute(event.srcElement, 'data-logversion') || '1';
      var logargs = _findAttribute(event.srcElement, 'data-logargs');
      if (logargs) {
        try {
          logargs = JSON.parse(logargs);
        } catch (e) {
          logargs = undefined;
        }
      }
      logargs = logargs || {};
      if (href !== '' && typeof(logargs.uri) == 'undefined') {
        logargs.uri = href;
      }
      if (logevent !== '') {
        exports.log(logcontext, logevent, logversion, logargs);
      }
    }
  }
};

/**
 * TODO: Document
 *
 * @param {Element} element Tracking element.
 * @param {String} context Context in app.
 */
exports.setContext = function(element, context) {
  element.setAttribute('data-logcontext', context);
};

/**
 * TODO: Document
 *
 * @param {Element} element Tracking element.
 * @param {Event} event event.
 */
exports.setEvent = function(element, event) {
  element.setAttribute('data-logevent', event);
};

/**
 * TODO: Document
 *
 * @param {String} testVersion Active test version.
 */
exports.startEventListener = function(testVersion) {
  if (testVersion)
    exports.testVersion = testVersion;
  document.addEventListener('click', function(event) {
    if (event.srcElement) {
      exports.logElement(event.srcElement);
    }
  }, true);
};
