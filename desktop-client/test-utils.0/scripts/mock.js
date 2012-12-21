var _mocked = {};
var _originalRequest;

function _mockedRequest(name, args, caller, success, failed) {
  if (!(name in _mocked)) {
    return _originalRequest.apply(this, arguments);
  }

  _mocked[name]({
    name: name,
    args: args,
    fail: function(error) {
      failed.call(caller, error);
    },
    succeed: function(result) {
      success.call(caller, result);
    }
  });
}

/**
 * Clear all mocks and restore the bridge.
 */
function clear() {
  for (var k in _mocked) delete _mocked[k];
  if (_originalRequest) SpotifyApi.prototype.request = _originalRequest;
}

/**
 * Mock a bridge request.
 * @param {string} name The request to mock.
 * @param {function(Object)|null} handler A function that will handle the
 *     request, or null to stop mocking the request.
 */
function request(name, handler) {
  if (SpotifyApi.prototype.request != _mockedRequest) {
    _originalRequest = SpotifyApi.prototype.request;
    SpotifyApi.prototype.request = _mockedRequest;
  }

  if (handler)
    _mocked[name] = handler;
  else
    delete _mocked[name];
}

exports.clear = clear;
exports.request = request;
