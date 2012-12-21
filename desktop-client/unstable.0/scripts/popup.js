'use strict';

var sp = getSpotifyApi(1);

var logger = sp.require('$util/logger'),
    lang = sp.require('$util/language'),
    fs = sp.require('$util/fs'),
    dom = sp.require('$util/dom');

exports.Popup = Popup;
exports.logEvent = logEvent;
exports.bindLoggingParams = bindLoggingParams;

/**
 * Popup
 * @constructor
 */
function Popup() { }

/**
 * Render the skeleton of the list.
 * @param {HTMLElement} container the element to render the list into.
 * @param {Number} howMany how many elements in the list.
 */
Popup.prototype.renderPlaceholders = function(container, howMany) {
  var itemTpl = fs.readFile('$unstable/templates/popup-list-item.html');
  var html = '';
  var list = new dom.Element('ul');
  list.classList.add('popup-items');
  container.appendChild(list);
  for (var i = 1; i <= howMany; i++) {
    html += lang.format(itemTpl, [i]);
  }
  list.innerHTML = html;
};

/**
 * Render fallback e.g. if elements didn't load.
 * @param {HTMLElement} container the element to render the list into.
 * @param {String} message text to be rendered.
 */
Popup.prototype.renderFallbackMessage = function(container, message) {
  dom.empty(container);
  container.innerHTML = message;
  container.classList.add('fallback-message');
};

/**
 * Adjust window size to its content.
 */
Popup.prototype.adjustWindowSize = function() {
  var b = document.body;
  if (window.innerHeight !== b.offsetHeight || window.innerWidth !== b.scrollWidth || window.innerWidth !== b.offsetWidth) {
    var width = window.innerWidth !== b.scrollWidth ? b.scrollWidth : b.offsetWidth;
    sp.core._set_body_size(width, document.body.offsetHeight, true);
  }
};

/**
 * Close the popup.
 */
Popup.prototype.close = function() {
  document.location = sp.core.uri + ':close';
};

/**
 * Wrapper for logging messages.
 * Changing params order allows for binding args
 */
function logEvent(logCtx, logEventVersion, logTestVersion, eventName, data) {
  logger.logClientEvent(logCtx, eventName, logEventVersion, logTestVersion, data || {});
}

/**
 * Bind logging params
 */
function bindLoggingParams(logCtx, logEventVersion, logTestVersion) {
  return logEvent.bind(this, logCtx, logEventVersion, logTestVersion);
}
