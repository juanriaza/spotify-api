"use strict";

var sp = getSpotifyApi(1);

var promise = sp.require("sp://import/scripts/promise");
var dom = sp.require("sp://import/scripts/dom");

var XHR = XMLHttpRequest,
	DEFAULT_METHOD = "GET";

/**
 * @this {XMLHttpRequest}
 * @param {Promise} prom
 */
function readyStateHandler(prom) {
	var status;

	switch (this.readyState) {
		case XHR.UNSENT:
		case XHR.OPENED:
		case XHR.HEADERS_RECEIVED:
			break;
		case XHR.DONE:
			status = this.status;
			if (status >= 200 && status < 300 ||
				status === 304 || status === 0) {
				prom.resolve(this);
			} else {
				prom.reject(this);
			}
			break;
	}
}

// { lol: 1, omg: false } -> "lol=1&omg=false"
// @todo make it handle multiple values for same property
function toQueryString(obj) {
	return map(function(k) {
		return encodeURIComponent(k) + "=" + encodeURIComponent(obj[k]);
	}, Object.keys(obj)).join('&');
}

/**
 * Performs an XMLHttpRequest using a Promise
 * @param {string} url URL to request
 * @param {string|Object} params Query string parameters
 * @param {string} method The HTTP method to use
 * @return {Promise} A Promise which is resolved/rejected with the XMLHttpRequest instance
 */
function request(url, params, method) {
	var prom = new promise.Promise(),
		req = new XHR();

	// Leave as-is if it's a string
	// otherwise it should be an object to serialize
	params = "string" === typeof params ? params :
		params ? toQueryString(params) : null;
	method = method || DEFAULT_METHOD;
	dom.listen(req, "readystatechange",
		readyStateHandler.bind(req, prom));
	req.open(method, url, true);
	req.send(params);
	return prom;
}

exports.request = request;
exports.toQueryString = toQueryString;
