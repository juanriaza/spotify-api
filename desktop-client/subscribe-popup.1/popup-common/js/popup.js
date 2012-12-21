'use strict';

var sp = getSpotifyApi(1);

var logger = sp.require('$util/logger'),
    lang = sp.require('$util/language'),
    fs = sp.require('$util/fs'),
    dom = sp.require('$util/dom');

var commonPath = 'popup-common/';

exports.Popup = Popup;
exports.logEvent = logEvent;

function Popup(type, config) {
  config = config || {};
  this.type = type;
  this.module = config.module || this.type;
  this.template = config.template || this.type;
}

Popup.prototype.renderPlaceholders = function(container, howMany) {
  var itemTpl = fs.readFile(commonPath + 'templates/popup-list-item.html');
  var html = '';
  var list = new dom.Element('ul');
  list.classList.add('popup-items');
  container.appendChild(list);
  for (var i = 1; i <= howMany; i++) {
    html += lang.format(itemTpl, [i]);
  }
  list.innerHTML = html;
};

Popup.prototype.renderFallbackMessage = function(container, message) {
  dom.empty(container);
  container.innerHTML = message;
  container.classList.add('fallback-message');
};

Popup.prototype.adjustWindowSize = function() {
  var b = document.body;
  if (window.innerHeight !== b.offsetHeight || window.innerWidth !== b.scrollWidth || window.innerWidth !== b.offsetWidth) {
    var width = window.innerWidth !== b.scrollWidth ? b.scrollWidth : b.offsetWidth;
    sp.core._set_body_size(width, document.body.offsetHeight, true);
  }
};

Popup.prototype.close = function() {
  document.location = sp.core.uri + ':close';
};

Popup.prototype.closeWithTimeout = function(delay, counterId) {
  if (counterId && dom.id(counterId)) {
    var popup = this;
    var counter = dom.id(counterId);
    var value = Math.ceil(delay / 1000);
    counter.innerHTML = value;
    var timerId = window.setInterval(function() {
      if (value > 1) {
        value -= 1;
        counter.innerHTML = value;
      } else {
        clearTimeout(timerId);
        timerId = null;
        popup.close();
      }
    }, 1000);
  } else {
    window.setTimeout(this.close, delay);
  }
};

function logEvent(logCtx, logEventVersion, logTestVersion, eventName, data) {
  logger.logClientEvent(logCtx, eventName, logEventVersion, logTestVersion, data || {});
}
