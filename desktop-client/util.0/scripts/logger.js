'use strict';

/**
 * Logger library.
 */
var sp = getSpotifyApi(),
    dom = sp.require('$util/dom');

/**
 * Logs client events
 * @param {String} context [description].
 * @param {String} event [description].
 * @param {String} event_version [description].
 * @param {String} test_version [description].
 * @param {Object} data [description].
 */
function logClientEvent(context, event, event_version, test_version, data) {
  // console.log(context, event, event_version, test_version, data);
  sp.core.logClientEvent(context, event, event_version, test_version, data);
}

/**
 * Logs the click event on an element
 * @param {Node} elm [description].
 * @param {String} context [description].
 */
function logClick(elm, context, event_version, test_version, data) {
  context = context || 'Unknown context';

  if (data === null) {
    if (elm.href !== null) {
      data = {'uri': elm.href};
    }
    else {
      data = {'data': ''};
    }
  }
  dom.listen(elm, 'click', function(evt) {
    evt.preventDefault();
    logClientEvent(context, 'click', event_version, test_version, data);
    window.location = evt.target.href;
  });
}

exports.logClick = logClick;
exports.logClientEvent = logClientEvent;
