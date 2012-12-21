"use strict";

var	sp = getSpotifyApi(1),
	dom = sp.require('sp://import/scripts/dom');

/**
 * Logs client events
 * @param {String} context
 * @param {String} event
 * @param {String} event_version
 * @param {String} test_version
 * @param {Object} data
 */
function logClientEvent(context, event, event_version, test_version, data) {
	//console.log(context, event, event_version, test_version, data);
	sp.core.logClientEvent(context, event, event_version, test_version, data);
}

/**
 * Logs the click event on an element
 * @param {Node} elm
 * @param {String} context
 * @param {Object} child
 */
function logClick(elm, context, event_version, test_version, data) {
	var	context = context || 'Unknown context';
	if(data == null) {
		if(elm.href != null) {
			data = {'uri':elm.href};
		}
		else {
			data = {'data':''};
		}
	}
	dom.listen(elm,'click',function(evt){
		evt.preventDefault();
		logClientEvent(context, 'click', event_version, test_version, data);
		window.location = evt.target.href;
	});
}

exports.logClick = logClick;
exports.logClientEvent = logClientEvent;
