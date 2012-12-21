"use strict";

var sp = getSpotifyApi(1);

exports.timeAgo = timeAgo;

var lang = sp.require("sp://import/scripts/language");

var catalog = lang.loadCatalog("cef_views");
var _ = partial(lang.getString, catalog, "Datetime");

/**
 * @param {Date|number} time
 */
function timeAgo(time) {
	var seconds = (Date.now() - new Date(time)) / 1000;
	var i = 0;
	var number;
	var format;

	if (10 > seconds) {
		return _("Now");
	} else if (60 > seconds) {
		return _("Moment ago");
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
	[_("Minutes ago"), _("Minute"),  120,    60],
	[_("Minutes ago"), _("Minutes"), 3600,   60],
	[_("Hours ago"),   _("Hour"),    7200,   3600],
	[_("Hours ago"),   _("Hours"),   86400,  3600],
	[_("Days ago"),    _("Day"),     172800, 86400],
	[_("Days ago"),    _("Days"),    604800, 86400]
];

// TODO: write a proper function
function dateString(d) {
    return lang.format("{0}-{1}-{2}", d.getFullYear(),
        ("0" + (d.getMonth() + 1)).slice(-2),
        ("0" + d.getDate()).slice(-2));
}