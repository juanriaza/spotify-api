(function() {
  SpotifyApi.prototype._throwError = true;

  var bridge = window._getSpotifyModule('bridge'),
      core = window._getSpotifyModule('core');

  /**
   * Override the request creation routine with one that reads files
   * using the native C++ readFile() function.
   */
  SpotifyApi.prototype._createRequest = function(module, callback) {
    // Run asynchronously to mirror the behaviour of other platforms
    this.defer(this, function() {
      var code = core.readFile(module);
      if (undefined === code) {
        throw new Error('Could not load module "' + module + '"; Not found.');
      } else {
        callback(code);
      }
    });
  };

  /**
   * Makes a request to a native function.
   */
  SpotifyApi.prototype.request = function(name, args, caller, success, failed) {
    var contextId = this._getContextIdForRequest();
    var message = JSON.stringify({ name: name, args: args, context: contextId });
    bridge.executeRequest(message, {
      onSuccess: function(data) {
        if (success) {
          success.call(caller, JSON.parse(data));
        }
      },
      onFailure: function(data) {
        data = JSON.parse(data);
        console.log('Request ' + name + ' failed: ' + data.message, data);
        if (failed) {
          failed.call(caller, data);
        }
      }
    });
    this._prepareFlush();
  };

  SpotifyApi.api = new SpotifyApi();
})();
