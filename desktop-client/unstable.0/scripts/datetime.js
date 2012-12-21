/**
 * @fileoverview Date/time related functions.
 */

'use strict';

var sp = getSpotifyApi();

exports.timeAgo = timeAgo;

var lang = sp.require('$util/language');

var catalog = lang.loadCatalog('$resources/cef_views');
var _ = partial(lang.getString, catalog, 'Datetime');


/**
 * Gets how long ago the provided date/time was.
 * @param {Date|number} time The point in time to show time since.
 * @return {string} A formatted, localized string representing the amount of time between now and the specified time.
 */
function timeAgo(time) {
  var seconds = (Date.now() - new Date(time)) / 1000;
  var i = 0;
  var number;
  var format;

  if (10 > seconds) {
    return _('Now');
  } else if (60 > seconds) {
    return _('Moment ago');
  } else if (604800 < seconds) {
    // More than a week ago, just show date
    return dateString(new Date(time));
  }

  while (format = timeFormats[i++]) {
    if (seconds < format[2]) {
      number = ~~(seconds / format[3]);
      // TODO: This works for now, but should update format() to be able to handle it nicer
      return lang.format(format[0], number, format[1]);
    }
  }
}

var timeFormats = [
  [_('Minutes ago'), _('Minute'), 120, 60],
  [_('Minutes ago'), _('Minutes'), 3600, 60],
  [_('Hours ago'), _('Hour'), 7200, 3600],
  [_('Hours ago'), _('Hours'), 86400, 3600],
  [_('Days ago'), _('Day'), 172800, 86400],
  [_('Days ago'), _('Days'), 604800, 86400]
];


/**
 * Formats the given date according to ISO 8601
 * @param {Date} d The date to format.
 * @return {string} The formatted date, according to ISO 8601.
 * @private
 */
function dateString(d) {
  // TODO: write a proper function
  return lang.format('{0}-{1}-{2}', d.getFullYear(),
      ('0' + (d.getMonth() + 1)).slice(-2),
      ('0' + d.getDate()).slice(-2));
}
