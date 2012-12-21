'use strict';

var request = sp.require('$util/request');

var domain = 'https://www.spotify.com';
var path = '/xhr/json/loops-ab-tests.php';

/**
 * Loads AB test group threshold i.e. replaces declarations like:
 * SHOW_POPUP_THRESHOLD = 199
 * Allows to change groups distribution without need to update the app
 * values can be changed in https://www-admin2.testing.d.spotify.net/
 *
 * @param {String} testName Label under which the distribution info is stored in admin.
 * @param {Function} successCallback Function to excute when group number was loaded.
 * @param {Function} failureCallback Function to execute if loading the group failed.
 * @param {Object} options Additional configuration object.
 *  param {String} options.market Load the group for given market, ovverride default.
 */
function loadGroup(testName, successCallback, failureCallback, options) {
  options = options || {};

  var market = options.market || '';

  if (market) {
    path = '/' + market + path;
  }

  var params = testName ? { test_name: testName } : null;
  var promise = request.request(domain + path, params, 'GET');

  promise.then(onRequestSuccess, onRequestFailure);

  function onRequestSuccess(response) {
    /**
     * Somehow status 0 is treated as success in
     * $util/request which is incorrect
     */
    if (response.status === 0) {
      onRequestFailure.call(this, response);
      return;
    }

    //console.log('success', arguments);

    var r = {
      status: response.status
    };

    try {
      r.data = JSON.parse(response.response);
      successCallback.call(this, r);
    } catch (e) {
      r.error = 'JSON error: ' + e.type;
      failureCallback.call(this, r);
    }
  }

  function onRequestFailure(response) {
    console.log('failure', arguments);

    var r = {
      status: response.status,
      error: 'Response status: ' + response.status
    };

    failureCallback.call(this, r);
  }
}

exports.loadGroup = loadGroup;
