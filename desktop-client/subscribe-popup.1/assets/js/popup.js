'use strict';

var sp = getSpotifyApi(1);

var lang = sp.require('$util/language'),
    fs = sp.require('$util/fs'),
    popup = sp.require('popup-common/js/popup'),

    popupKeys = Object.keys(popup),
    key;

for (var i = 0, l = popupKeys.length; i < l; i++) {
  key = popupKeys[i];
  exports[key] = popup[key];
}
exports.Popup = SPopup;

function SPopup(type, config) {
  config = config || {};
  this.type = type;
  this.module = config.module || this.type;
  this.template = config.template || this.type;
}

SPopup.prototype = new popup.Popup();

SPopup.prototype.render = function(translations) {
  var content = lang.format(fs.readFile('assets/templates/' + (this.template) + '.xml'), translations);
  document.body.classList.add(this.type);
  document.getElementById('main').innerHTML = content;
};
