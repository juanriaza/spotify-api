/**
 * @fileoverview Code for sending analytics data to Google.
 */

'use strict';

var sp = getSpotifyApi();

exports.GoogleTracker = GoogleTracker;

var l = sp.require('$util/language');

var _googleAnalyticsURL = 'http://www.google-analytics.com/__utm.gif?utmwv=5.2.0&utmn=559503360&utmp={0}&utmac={1}&' +
    'utmcc=__utma%3D{2}%3B%2B__utmz%3D11111111.1111111111.1.1.utmcsr%3D(direct)%7Cutmccn%3D(direct)%7Cutmcmd%3D(none)%3B';

// 11111111.11111111.1111111111.1111111111.1111111111.1
//<domain hash>.<unique visitor id>.<timestamp of first visit>.<timestamp of previous (most recent) visit>.<timestamp of current visit>.<visit count>
var _uniqueID = '11111111.{0}.1111111111.1111111111.{1}.1';



/**
 * Google Tracker.
 *
 * @constructor
 * @param {string} id  Google Analytics Tracking-ID.
 */
function GoogleTracker(id) {
  this.id = id;
  var rawUserId = sp.core.getAnonymousUserId();
  this.userId = '';

  for (var i = 0; i < rawUserId.length; ++i) {
    this.userId += parseInt(rawUserId[i], 16);
  }
}


/**
 * @param {string} identifier  The identifier you wish to track.
 */
GoogleTracker.prototype.track = function(identifier) {
  var src = l.format(_googleAnalyticsURL, encodeURIComponent(identifier), this.id,
      l.format(_uniqueID, this.userId, Math.floor(Date.now() / 1000)));
  var img = new Image();
  img.src = src;
};

//var tracker = new GoogleTracker("UA-27235902-1");
//tracker.track("foo");
