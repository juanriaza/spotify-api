'use strict';

var sp = getSpotifyApi();

var r = sp.require('$util/react');

exports.metaKey = navigator.platform === 'MacIntel' ? 'metaKey' : 'ctrlKey';

exports.whileFocused = whileFocused;

function whileFocused(element, es) {
  return r['switch'](r.fromDOMEvent(element, 'focus'), function(_) {
    return r.takeUntil(r.fromDOMEvent(element, 'blur'), es);
  });
}
