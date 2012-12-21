(function() {

  /**
   * An incrementing counter used to id requests.
   * @private
   */
  var uid = 0;

  /**
   * Object storage for callbacks
   * @private
   */
  var callbacks = {};

  SpotifyApi.prototype._throwError = true;

  /**
   * Override base resolveModule;
   */
  var deps = window.dependencies;
  var staticDeps = deps['static'];
  var rootDepsBare = staticDeps.replace(/\/([^\/]*)$/, '');
  var rootDeps = rootDepsBare + '/';

  var resolve = SpotifyApi.prototype._resolveModule;
  SpotifyApi.prototype._resolveModule = function(module) {
    var result = resolve(module);

    var match = result.match(/^\$([a-z\-\_]+)(\/.*)/);
    var framework = false, path, leadingSlash = false;
    if (match) {
      framework = match[1];
      path = match[2];
    } else if (/^\//.exec(result)) {
      leadingSlash = true;
    }
    var lang = false;

    if (/\.lang$/.exec(result)) {
      lang = 'en.loc';
      if (framework) result = '$' + framework + '/' + (path = '/' + lang + path);
      else result = (leadingSlash ? ('/' + lang) : (lang + '/')) + result;
    }

    if (framework && deps[framework]) {
      result = deps[framework] + path;
    } else {
      if (framework) result = '/' + framework + path;
      else if (!leadingSlash) result = '/' + result;
      result = (framework ? rootDepsBare : staticDeps) + result;
    }

    return result;
  };

  /*
   * Resource listening.
   */
  var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

  if (MutationObserver) {
    // Native MutationObserver is available, let's use it.
    var observer = new MutationObserver(function(mutations) {
      for (var j = 0, m = mutations.length; j < m; j++) {
        var mutation = mutations[j];
        var links = mutation.addedNodes;
        if (!links.length) return this;
        var matcher = staticDeps + '/$';
        for (var i = 0, l = links.length; i < l; i++) {
          var link = links[i];
          if (link.tagName.toLowerCase() != 'link' || !(/^\$/).test(link.getAttribute('href'))) continue;
          var href = link.href;
          link.href = href.replace(matcher, rootDeps);
        }
      }
    });
    observer.observe(document.head, {childList: true});
  } else {
    // No MutationObserver, use DOMSubtreeModified.
    var listenSubtree = function(event) {
      if (event.target !== document.head) return;
      var links = document.head.querySelectorAll('link[href^="$"]');
      var matcher = staticDeps + '/$';
      for (var i = 0, l = links.length; i < l; i++) {
        var link = links[i];
        if (!(/^\$/).test(link.getAttribute('href'))) continue;
        var href = link.href;
        link.href = href.replace(matcher, rootDeps);
      }
    };
    document.head.addEventListener('DOMSubtreeModified', listenSubtree);
  }


  /**
   * Overrides the default _createRequest method to enable CORS on IE8 and IE9
   * via XDomainRequest
   * @private
   */
  if ('XDomainRequest' in window) {

    var createXHR = SpotifyApi.prototype._createRequest;

    SpotifyApi.prototype._createRequest = function(module, callback) {
      if (!(/^http/.test(module))) return createXHR(module, callback);
      var request = new XDomainRequest();
      request.onprogress = function() {};
      request.onerror = function() {
        throw new Error('Could not load module "' + module + '"; Not found.');
      };
      request.onload = function() {
        callback(request.responseText);
      };
      request.open('GET', module);
      request.send(null);
    };

  }

  /**
   * if the request is found in the keys, send dependencies
   */
  var sendDependencies = {
    hermes_register_schema: 1
  };

  /**
   * Sends a postMessage request to the top level window to communicate
   * with the API.
   * @private
   * @param {string} name The name of the request. This parameter is required
   * and must be one of the supported requests (see the bridge specification).
   * @param {array} args An array of arguments for the request. The items in
   * the array must be trivially decodable to strings, e.g., string, number.
   * @param {object} caller The object to use as the "this" object when
   * calling one of the result callback functions.
   * @param {function} success The callback function to invoke when the request succeeds.
   * @param {function} failed The callback function to invoke when the
   * request does not succeed.
   */
  SpotifyApi.prototype.request = function(name, args, caller, success, failed) {
    var data = {
      id: uid++,
      name: name,
      args: args
    };

    if (sendDependencies[name]) data.deps = deps;

    window.top.postMessage(JSON.stringify(data), '*');
    if (!success) return this;
    callbacks[data.id] = {
      success: success,
      failed: failed,
      caller: caller
    };
    this._prepareFlush();
  };

  SpotifyApi.prototype._requestReply = function(e) {
    var data = e.data;
    if (typeof data == 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        return this;
      }
    }
    var callback = callbacks[data.id];

    if (!callback) return this;
    if (data.success && callback.success) callback.success.call(callback.caller, data.payload);
    else if (!data.success && callback.failed) callback.failed.call(callback.caller, data.payload);
  };

  SpotifyApi.api = new SpotifyApi();
  window.addEventListener('message', SpotifyApi.api._requestReply, false);

  // URI Overrides
  SpotifyApi.Bases.url = 'https://play.spotify.com';
  SpotifyApi.Exps.http = /^https?:\/\/(play|open)\.spotify\.com\/(.+)$/;

  String.prototype.toSpotifyLink = function() {
    return this.toSpotifyURL();
  };

  // Link Delegation
  document.documentElement.addEventListener('click', function(e) {
    var target = e.target;
    if (target.tagName.toLowerCase() !== 'a') return;
    var href = target.href;
    var uri = null;
    if (SpotifyApi.Exps.http.test(href)) {
      uri = href.toSpotifyURI();
    } else if (SpotifyApi.Exps.spotify.test(href)) {
      uri = href;
    }
    if (!uri) return;
    e.preventDefault();
    SpotifyApi.api.request('application_open_uri', [uri, null]);
  });

  // Browser fixes
  var slice = Array.prototype.slice;

  if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(item, from) {
      var length = this.length >>> 0;
      for (var i = (from < 0) ? Math.max(0, length + from) : from || 0; i < length; i++) {
        if (this[i] === item) return i;
      }
      return -1;
    };
  }

  if (!String.prototype.trim) {
    String.prototype.trim = function() {
      return String(this).replace(/^\s+|\s+$/g, '');
    };
  }

  if (!Function.prototype.bind) {
    Function.prototype.bind = function(that) {
      var self = this,
          args = arguments.length > 1 ? slice.call(arguments, 1) : null,
          F = function() {};

      var bound = function() {
        var context = that, length = arguments.length;
        if (this instanceof bound) {
          F.prototype = self.prototype;
          context = new F;
        }
        var result = (!args && !length) ?
            self.call(context) :
            self.apply(context, args && length ? args.concat(slice.call(arguments)) : args || arguments);
        return context == that ? result : context;
      };
      return bound;
    };
  }

  // Keyboard
  var kbd = {
    _modifiers: null,
    _keymap: null,
    _ignore: null,
    _bindings: null,
    _empty: function() {},

    init: function() {
      SpotifyApi.api.request('keyboard_get_bindings', [], this, function(directives) {
        for (var i in directives) {
          if (!directives.hasOwnProperty(i)) continue;
          this[i] = directives[i];
        }
      }.bind(this), this._empty);
      window.addEventListener('keydown', this.handleOwn.bind(this, false));
      window.addEventListener('keyup', this.handleOwn.bind(this, true));
    },

    handleOwn: function(request, e) {
      var target = e.target;
      if (this._ignore[target.tagName.toLowerCase()]) return this;
      var key = this._keymap[e.which || e.keyCode];
      if (!key) return this;
      var modifiers = this._modifiers;
      if (e.altKey) key |= modifiers.alt;
      if (e.metaKey) key |= modifiers.meta;
      if (e.ctrlKey) key |= modifiers.ctrl;
      var binding = this._bindings[key];
      if (!binding) return this;
      e.preventDefault();
      e.stopPropagation();
      if (request) SpotifyApi.api.request('keyboard_trigger_binding', [binding], this, this._empty, this._empty);
    }

  };

  kbd.init();


})();
