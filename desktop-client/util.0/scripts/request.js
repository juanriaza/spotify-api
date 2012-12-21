'use strict';

var sp = getSpotifyApi(1);

var promise = sp.require('$util/promise');
var dom = sp.require('$util/dom');

var XHR = XMLHttpRequest,
    DEFAULT_METHOD = 'GET';

/**
 * @this {XMLHttpRequest}
 * @param {Promise} prom The promise passed on from request.
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

/**
 * Serialization of object notated parameters.
 * ex: { lol: 1, omg: false } -> "lol=1&omg=false"
 * TODO: Make it handle multiple values for same property.
 * @param  {Object} obj Parameters the request.
 * @return {string} Serialized parameters.
 */
function toQueryString(obj) {
  return map(function(k) {
    return encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]);
  }, Object.keys(obj)).join('&');
}

/**
 * Performs an XMLHttpRequest using a Promise
 * @param {string} url URL to request.
 * @param {string|Object} params Query string parameters.
 * @param {string} method The HTTP method to use.
 * @return {Promise} A Promise which is resolved/rejected with the XMLHttpRequest instance.
 */
function request(url, params, method) {
  var prom = new promise.Promise();
  var req = new XHR();

  method = method || DEFAULT_METHOD;

  if (!params) {
    params = '';
  } else if ('string' !== typeof params) {
    params = toQueryString(params);
  }

  if ('GET' === method.toUpperCase()) {
    params = params.replace(/^(\?|\&)/, '');

    if (params) {
      if (!/\?/.test(url)) {
        url += '?' + params;
      } else {
        url += '&' + params;
      }
    }
    params = null;
  }

  dom.listen(req, 'readystatechange',
      readyStateHandler.bind(req, prom));
  req.open(method, url, true);
  req.send(params);
  return prom;
}

exports.request = request;
exports.toQueryString = toQueryString;
