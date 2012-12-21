/**
 * The Spotify API entry point. Only one instance of this class can exist.
 * Applications never directly use this class (expect for that it actually
 * implements the "require" functionality). Frameworks use this class to make
 * requests over the Stitch bridge. Each platform must make a subclass of this
 * class to implement the request communication.
 * @class
 * @private
 */
function SpotifyApi() {
  this._modules = {};
  this._requested = {};
  this._module_queue = [];
  this._delayed_fns = [];
  this._parallel_reqs = 4;
  this._context_stack = [];
  this._deferred_flush = false;
  this._patch_request_open();
}

/**
 * Never construct an AnalyticsContext using the constructor - use the
 * SP.analyticsContext() convenience function instead.
 *
 * @class
 * @classdesc An analytics context can be used to group activity inside of an
 * application so it can be tracked as a single logical entity.  All API requests
 * executed when a given context is active will be tagged with the context id
 * so they can be assigned to the context on the other side of the bridge.
 * AnalyticsContexts can handle asyncronous callbacks and may be nested
 * arbitrarily deep.
 * @param {string} name A human readable name for the context.
 * @since 1.6.0
 * @see SpotifyApi#analyticsContext
 */
SpotifyApi.AnalyticsContext = function(name) {
  this.name = name;
  this.id = SpotifyApi.AnalyticsContext._nextId++;
  this.references = 0;
  this._begin();
};
SpotifyApi.AnalyticsContext._nextId = 1;

/**
 * Add a reference to the context: indicates that there is an
 * oustanding promise that was created in the context.
 */
SpotifyApi.AnalyticsContext.prototype.addReference = function() { this.references++; };

/**
 * Remove a reference to the context: indicates that a promise
 * that was created in the context has been fullfilled.
 */
SpotifyApi.AnalyticsContext.prototype.removeReference = function() {
  this.references--;
  if (this.references === 0) {
    this._end();
  }
};

/**
 * Called when a context is first created: sends a message over the bridge
 * with the context details.
 */
SpotifyApi.AnalyticsContext.prototype._begin = function() {
  SpotifyApi.api.request('core_context_begin', [this.id, this.name], this);
};

/**
 * Called when there are no more references to the context: sends a message
 * over the bridge with the context details.
 */
SpotifyApi.AnalyticsContext.prototype._end = function() {
  SpotifyApi.api.request('core_context_end', [this.id], this);
};

/**
 * Execute a function in an analytics context.
 * @param {string} name A human readable name to identify the context.
 * @param {function} func A function to invoke in the context.
 *
 * @example
 * SP.analyticsContext('load-playlist-view', function() {
 *   // do lots of complex loading and nested calls here
 * });
 */
SpotifyApi.prototype.analyticsContext = function(name, func) {
  var context = new SpotifyApi.AnalyticsContext(name);
  context.addReference();
  this._context_stack.push(context);
  try {
    func();
  } finally {
    this._context_stack.pop();
    context.removeReference();
  }
};

/**
 * Never construct a Callback using the constructor - use the
 * SP.callback() convenience function instead.
 *
 * A callback class that captures a context stack on
 * instantiation and restores it on invocation.
 * @param {function} func The function to wrap.
 * @param {array} contextStack A context stack to capture.
 * If a stack is not provided defaults to the current context
 * stack.
 *
 * @since 1.7.0
 * @see SpotifyApi#callback
 * @see SpotifyApi#analyticsContext
 */
SpotifyApi.Callback = function(func, contextStack) {
  contextStack = contextStack || SpotifyApi.api._context_stack;
  this._func = func;
  this._setContextStack(contextStack);
};

SpotifyApi.Callback.prototype.apply = function(target, args) {
  try {
    var oldContextStack = SpotifyApi.api._context_stack;
    SpotifyApi.api._context_stack = this._contextStack;
    this._func.apply(target, args);
  } catch (error) {
    setTimeout(function() { throw error; }, 0);
  } finally {
    SpotifyApi.api._context_stack = oldContextStack;
    this.clear();
  }
};

SpotifyApi.Callback.prototype.call = function(target) {
  this.apply(target, Array.prototype.slice.call(arguments, 1));
};

/**
 * Creates a copy of the callback instance, incrementing the
 * context stack reference count.
 */
SpotifyApi.Callback.prototype.copy = function() {
  return new this.constructor(this._func, this._contextStack);
};

/**
 * Clear the callback, releasing the context stack: calling it after
 * this will cause an exception to be thrown.
 *
 * Note: If your callback will never be invoked, be sure to call
 * clear to ensure proper cleanup of the instance.
 */
SpotifyApi.Callback.prototype.clear = function() {
  this._releaseContextStack();
  delete this._func;
  delete this._contextStack;
};

/**
 * Set the context stack that should be restored when the callback is invoked.
 *
 * @private
 * @see SpotifyApi.Callback#invoke
 */
SpotifyApi.Callback.prototype._setContextStack = function(contextStack) {
  for (var i = 0, l = contextStack.length; i < l; ++i) {
    contextStack[i].addReference();
  }
  this._contextStack = contextStack.slice(0);
};

/**
 * Remove our reference to each item in the stored context stack.
 *
 * @private
 */
SpotifyApi.Callback.prototype._releaseContextStack = function() {
  var contextStack = this._contextStack;
  for (var i = 0, l = contextStack.length; i < l; ++i) {
    contextStack[l - i - 1].removeReference();
  }
};

/**
 * Return a callback object that when invoked will restore the analytics
 * context stack that was active at the time the callback was created.
 * @param {function} func The function to wrap.
 */
SpotifyApi.prototype.callback = function(func) {
  return new SpotifyApi.Callback(func);
};

/**
 * Return the analytics context id to send over the bridge for the next request.
 */
SpotifyApi.prototype._getContextIdForRequest = function() {
  var contexts = this._context_stack;
  return contexts.length ? contexts[contexts.length - 1].id : 0;
};

/**
 * Process the message that are posted to the window to handle the zero-delay
 * timeout system. When calling the delay function a message will be posted to
 * the window and processed in this event handler. It just goes through all
 * registered delayed invocations and calls them in order. Note that the array
 * must be copied first, because the callback could end up putting more stuff
 * on it, which must not run until the _next_ runloop iteration.
 */
window.addEventListener('message', function(event) {
  if (event.source == window && event.data == 'api-delay') {
    event.stopPropagation();
    var functions = SpotifyApi.api._delayed_fns.splice(0);
    for (var i = 0, l = functions.length; i < l; i++) {
      functions[i].call();
    }
  }
});

/**
 * All subclasses' implementations of the request method must call this method.
 * It does not matter if it is called in the beginning or end of the request
 * method since the action is deferred until the beginning of the next runloop
 * iteration.
 * @private
 */
SpotifyApi.prototype._prepareFlush = function() {
  if (!this._deferred_flush) {
    this._deferred_flush = true;
    this.defer(this, this._flushRequests);
  }
};

/**
 * Sends the "bridge_flush" request across the bridge, indicating that now is
 * a good time to execute any batch jobs that have been building up because of
 * incoming requests. The implementation is free to execute requests right away
 * or wait until this flush request is sent.
 */
SpotifyApi.prototype._flushRequests = function() {
  // Send the bridge_flush request before setting _deferred_flush to false, so
  // that we don't cause another deferred bridge_flush request to be set up.
  this.request('core_flush', []);
  this._deferred_flush = false;
};

/**
 * Call this function to perform a function as soon as possible, but in the next
 * run loop iteration at the earliest. It is faster than calling setTimeout with
 * a zero timeout argument, since most browsers will artificially increase the
 * timeout to 15 milliseconds (plus/minus a few milliseconds).
 * @param {Object} self The this instance to use in the callback.
 * @param {Function} func The function to call in the next runloop iteration.
 */
SpotifyApi.prototype.defer = function(self, func) {
  if (this._delayed_fns.push(this.bind(this.callback(func), self)) == 1)
    window.postMessage('api-delay', '*');
};

/**
 * Used by require to evaluate the JavaScript module source code. Note that the
 * code in the module will be interpreted in strict JavaScript mode, to ensure
 * that it does not make some common coding mistakes, and it also enables some
 * additional optimizations by the compiler.
 * @private
 * @param {Object} meta The module's meta object.
 * @param {Array} graph An array containing the object's dependency graph.
 * @param {string} module The module path.
 * @param {string} code The source code of the module.
 * @return {Object} The exported namespace of the module.
 */
SpotifyApi.prototype._evalModule = function(meta, graph, module, code) {
  return (!(/\.lang$/).test(module)) ? this._evalJSModule(meta, graph, module, code) : this._evalLangModule(module, code);
};

SpotifyApi.prototype._evalJSModule = function(meta, graph, module, code) {
  var self = this;
  var exports = {__name: module};
  var require = function(modules, fn) {
    exports.__waiting = true; // require was called inside the module
    var callback = function() {
      exports.__waiting = false;
      return fn.apply(this, arguments);
    };
    callback.__native = true;
    return self._require(module, meta, graph, modules, callback);
  };
  try {
    code = '\'use strict\';' + code + '\n//@ sourceURL=' + module;
    new Function('require', 'exports', 'SP', '_code', 'eval(_code)').call({}, require, exports, this, code);
    return exports;
  } catch (error) {
    error.message += ' in ' + module;
    throw error;
  }
};

/**
 * A module containing localized strings.
 * @constructor
 */
SpotifyApi.LangModule = function(name, strings) {
  this.__name = name;
  this.strings = strings;
};

/**
 * Gets a string from the language module. This function supports substitution
 * of parameters ("{0}" will be replaced with the first additional argument to
 * this method).
 * @param {string} key The key to use when looking up the string. If the string
 *     does not exist, the key will be used as the string instead.
 * @param {*...} var_args Substitution values to use for the string.
 * @return {string} The localized, formatted string.
 */
SpotifyApi.LangModule.prototype.get = function(key, var_args) {
  var format = this.strings.hasOwnProperty(key) ? this.strings[key] : key;

  // Scan the format string for placeholders ("{0}", etc.) and substitute them
  // with the provided arguments.
  var out = '', lastIndex = 0, startIndex, endIndex;
  while ((startIndex = format.indexOf('{', lastIndex)) > -1) {
    endIndex = format.indexOf('}', startIndex + 1);
    // Stop parsing if we can't find a closing curly brace.
    if (endIndex == -1) { break; }

    // Get the substitution value from the arguments.
    var value = arguments[parseInt(format.substring(startIndex + 1, endIndex)) + 1];
    if (value !== undefined) {
      out += format.substring(lastIndex, startIndex) + value;
    } else {
      // Just leave the placeholder untouched if there is no value.
      out += format.substring(lastIndex, endIndex + 1);
    }

    lastIndex = endIndex + 1;
  }

  return lastIndex ? out + format.substring(lastIndex) : format;
};

/**
 * Evaluates a language module, which is basically just a JSON file. The module
 * that is returned will also have a "get" function which lets people load a
 * localized string with formatting.
 * @param {string} module Name of the module.
 * @param {string} code The JSON data of the module.
 * @return {Object} The exported members of the module.
 * @private
 */
SpotifyApi.prototype._evalLangModule = function(module, code) {
  try {
    return new SpotifyApi.LangModule(module, JSON.parse(code));
  } catch (error) {
    throw new Error('Cannot import language file "' + module + '": ' + error.message);
  }
};

/**
 * Fires a require callback after all of dependencies have finished loading.
 * @param {Object} meta The metadata node to start at.
 * @private
 */
SpotifyApi.prototype._fireCallbacks = function(meta) {
  while (meta) {
    meta.waiting--;
    if (meta.waiting) break;
    meta.unpacked.forEach(function(unpacked) {
      var pos = unpacked.position;
      var exported = meta.args[pos];
      var property = unpacked.property;
      if (!(property in exported))
        throw new Error('No "' + property + '" exported in module "' + exported.__name + '"');
      meta.args[pos] = exported[property];
    });
    meta.callback.apply({}, meta.args);
    meta.waiting = (1 / 0); // Infinity
    meta = meta.parent;
  }
};

SpotifyApi.prototype._createRequest = function(module, callback) {
  var request = new XMLHttpRequest();
  request.open('GET', module, true);
  request.onreadystatechange = function(e) {
    if (request.readyState != 4) return;
    if (request.status != 200 && request.status != 0)
      throw new Error('Could not load module "' + module + '"; Not found.');
    callback(request.responseText);
  };
  request.send(null);
};

/**
 * Loads the executable code of a module via XHR or from the cache.
 * @private
 */
SpotifyApi.prototype._loadModule = function(meta, graph, module, position, property) {
  var self = this;

  var cached = this._modules[module];
  if (cached && !cached.__waiting) {
    meta.args[position] = this._modules[module];
    if (property) meta.unpacked.push({property: property, position: position});
    this._fireCallbacks(meta);
  } else if (this._requested[module] || !this._parallel_reqs) {
    this.defer(this, function() {
      this._loadModule(meta, graph, module, position, property);
    });
  } else {
    this._requested[module] = true;
    this._parallel_reqs--;
    this._createRequest(module, function(responseText) {
      self._parallel_reqs++;
      var exported = self._modules[module] = self._evalModule(meta, graph, module, responseText);
      meta.args[position] = exported;
      if (property) meta.unpacked.push({property: property, position: position});
      self._fireCallbacks(meta);
    });
  }
};

/**
 * Resolves any path-related "magic" for a module's require path.
 * @private
 */
SpotifyApi.prototype._resolveModule = function(module) {
  if (!(/\.lang$/).test(module)) {
    var _module = module.match(/^(\$(?:[^\/]+)\/)(?!scripts)(.*)/);
    if (_module) module = _module[1] + 'scripts/' + _module[2];
    module += '.js';
  }
  return module;
};

/**
 * Import a module of the Spotify API by specifying the module path as:
 * $framework/module, e.g., $api/models. Store the returned object in a
 * variable of your own choice. The object represents the namespace of the
 * module. You can also use this method to import your own modules, included in
 * the bundle, by passing a relative module path.
 * @param {string} name The module name.
 * @param {Object} parent The meta object of the modules' parent.
 * @param {Array.<string>} graph The dependency graph of the modules.
 * @param {string|Array.<string>} modules The paths of the modules to require.
 * @param {Function} fn The callback function to call when the modules have
 *     been loaded.
 * @return {Object} The module namespace.
 * @private
 */
SpotifyApi.prototype._require = function(name, parent, graph, modules, fn) {
  if (typeof modules == 'string') modules = [modules];
  if (!modules || !modules.length)
    throw new Error('Missing modules argument to require().');
  if (!fn || typeof fn != 'function')
    throw new Error('Missing callback function argument to require().');

  var len = modules.length;
  if (!fn.__native && len != fn.length)
    throw new Error('Module-parameter mismatch! Imported ' + len + ' but only declared ' +
        fn.length + ' in callback.');

  var meta = {
    name: name,
    parent: parent,
    waiting: len,
    callback: fn,
    args: new Array(len),
    unpacked: []
  };

  parent.waiting++;

  for (var i = 0, l = len; i < l; i++) {
    var module = modules[i];
    if (!module) throw new Error('Empty module name in require.');

    // property unpacking
    var property = module.split('#');
    module = this._resolveModule(property[0]);
    property = property[1];

    // dependency checking
    var modGraph = graph.slice(0);
    var index = graph.indexOf(module);
    modGraph.push(module);
    if (index != -1) {
      modGraph = modGraph.slice(index).join(' -> ');
      throw new Error('Circular Dependency on Module "' + module + '": ' + modGraph);
    }

    this._loadModule(meta, modGraph, module, i, property);
  }
};

/**
 * This function will take an array of parameters (usually from the 'arguments'
 * keyword), and expect it to contain a single array of values, or a variable-
 * length list of values, starting at the specified offset (default 0). This is
 * used to implement methods such as Loadable.load and Promise.join.
 *
 * @function
 * @name SpotifyApi#varargs
 * @since 1.1.0
 *
 * @param {Arguments|Array} values An arguments object or an array to get the
 *     list of values from.
 * @param {number=} opt_offset An offset to start expecting variable arguments
 *     at. For example, if a function always takes one argument plus a list of
 *     values (which can either be a single array or many arguments), you would
 *     pass in an offset of 1. Default is 0.
 * @param {boolean=} opt_copy Force this function to return a copy of the list
 *     so that the return value is safe to retain and/or change.
 * @return {Arguments|Array} Either the arguments object or an array. Unless a
 *     copy of the value list is explicitly requested, the existing list will
 *     be returned when possible (for performance reasons), so do not attempt
 *     to modify the returned value in any way unless asking for it to be
 *     copied.
 *
 * @example
 * function printList(title) {
 *   // Get the items with an offset of 1 (ignoring title).
 *   var items = SP.varargs(arguments, 1);
 *
 *   var html = '<h1>' + title + '</h1><ul>';
 *   for (var i = 0; i < items.length; i++) {
 *     html += '<li>' + items[i] + '</li>';
 *   }
 *   document.write(html + '</ul>');
 * }
 *
 * // This will work...
 * printList('Numbers', ['one', 'two', 'three']);
 *
 * // ...and so will this.
 * printList('Numbers', 'four', 'five', 'six');
 */
SpotifyApi.prototype.varargs = function(values, opt_offset, opt_copy) {
  if (!opt_offset) opt_offset = 0;

  if (values[opt_offset] instanceof Array) {
    if (values.length > opt_offset + 1)
      throw new Error('Ambiguous use of varargs');

    return opt_copy ? Array.prototype.slice.call(values[opt_offset]) : values[opt_offset];
  }

  if (opt_offset)
    return Array.prototype.slice.call(values, opt_offset);
  else
    return opt_copy ? Array.prototype.slice.call(values) : values;
};

/**
 * Gets a list of URIs from the provided arguments object or array.
 *
 * @function
 * @name SpotifyApi#uris
 * @since 1.1.0
 *
 * @param {Arguments|Array} values An arguments object or an array to get the
 *     list of URIs from. It is expected to hold objects with a "uri" property.
 * @param {number=} opt_offset An offset to start expecting variable arguments
 *     at. For example, if a function always takes one argument plus a list of
 *     values (which can either be a single array or many arguments), you would
 *     pass in an offset of 1. Default is 0.
 * @return {Array.<string>} A list containing the URIs of the provided objects.
 *
 * @see SpotifyApi#varargs
 */
SpotifyApi.prototype.uris = function(values, opt_offset) {
  var objs = this.varargs(values, opt_offset),
      uris = [];
  for (var i = 0, len = objs.length; i < len; i++) {
    uris.push(objs[i].uri);
  }
  return uris;
};

/**
 * Binds a function to a specific this object. This is a simpler version of the
 * bind method of the Function class, which is not available on all platforms.
 *
 * @function
 * @name SpotifyApi#bind
 * @since 1.4.0
 *
 * @param {Function} func A function to bind.
 * @param {Object} that The this object to use when invoking the returned
 *     function.
 * @param {...*} var_args Additional arguments to pass into the function before
 *     any arguments passed to the new, bound version of the function.
 * @return {Function} A new function that will invoke the given function.
 */
SpotifyApi.prototype.bind = function(func, that, var_args) {
  if (arguments.length > 2) {
    var slice = Array.prototype.slice;
    var bind = Function.prototype.bind;
    if (bind && func.bind === bind) return bind.apply(func, slice.call(arguments, 1));
    var args = slice.call(arguments, 2);
    return function() {
      return func.apply(that, (arguments.length) ? args.concat(slice.call(arguments)) : args);
    };
  } else {
    return function() {
      return func.apply(that, arguments);
    };
  }
};

/**
 * Inherit the prototype methods from one constructor into another.
 *
 * Usage:
 * <pre>
 * function ParentClass(a, b) { }
 * ParentClass.prototype.foo = function(a) { }
 *
 * function ChildClass(a, b, c) {
 *   ParentClass.call(this, a, b);
 * }
 * inherit(ChildClass, ParentClass);
 *
 * var child = new ChildClass('a', 'b', 'see');
 * child.foo(); // works
 * </pre>
 *
 * In addition, a superclass' implementation of a method can be invoked
 * as follows:
 *
 * <pre>
 * ChildClass.prototype.foo = function(a) {
 *   ChildClass._superClass.foo.call(this, a);
 *   // other code
 * };
 * </pre>
 *
 * @param {Function} childConstructor Child class.
 * @param {Function} parentConstructor Parent class.
 */
SpotifyApi.prototype.inherit = function(childConstructor, parentConstructor) {
  var TempConstructor = function() {};

  TempConstructor.prototype = childConstructor._superClass = parentConstructor.prototype;
  childConstructor.prototype = new TempConstructor();
  childConstructor.prototype.constructor = childConstructor;
  return childConstructor;
};

/**
 * Patches XMLHttpRequest.prototype.open to add a custom Spotify header.
 * Only applies to same-domain requests.
 * @private
 */
SpotifyApi.prototype._patch_request_open = function() {
  var open = XMLHttpRequest.prototype.open;
  var rurl = /^[\w\+\.\-]+:\/\/([^\/?#:]*)/;

  XMLHttpRequest.prototype.open = function(method, url) {
    var self = open.apply(this, arguments);
    var matched = url.match(rurl);
    if (!matched || matched[1] == window.location.hostname) this.setRequestHeader('X-Spotify-Requested-With', 'XMLHttpRequest');
    return self;
  };
};

/**
 * Import a module of the Spotify API by specifying the module path as:
 * $framework/module, e.g., $api/models. Store the returned object in a variable
 * of your own choice. The object represents the namespace of the module. You
 * can also use this method to import your own modules, included in the bundle,
 * by passing a relative module path. Note that the code in the module will be
 * interpreted in strict JavaScript mode, to ensure that it does not make some
 * common coding mistakes, and it also enables some additional optimizations by
 * the compiler.
 * @param {array} modules The module paths.
 * @param {function} callback The function that will be called once all
 * required models have been loaded, including the modules that the required
 * modules depend on.
 * @example
 * require(['scripts/newsfeed', '$api/models'], function(newsfeed, models) {
 *   var player = models.player;
 *   player.playTrack(models.Track.fromURI('spotify:track:2GIyi2hpXSAlMgjEfmd0oF'));
 * });
 */
function require(modules, callback) {
  return SpotifyApi.api._require('__main__', {
    callback: function() {},
    waiting: (1 / 0) // Infinity
  }, [], modules, callback);
}

/**
 * Before using any string returned from the Spotify API, call this method to
 * decode it to a usable string. Note that this method must only be used for
 * cases where the string will never end up being interpreted as HTML (such as
 * when using it in an innerHTML attribute). In that case, the decodeForHTML
 * method should be used instead.
 *
 * @function
 * @name String#decodeForText
 * @return {String} A string without any escaped characters.
 * @since 1.0.0
 *
 * @see String#decodeForHtml
 * @see String#decodeForLink
 * @example
 * getElementById('name').innerText = album.name.decodeForText();
 */
String.prototype.decodeForText = function() {
  return this.toString();
};

/**
 * Before using any string returned from the Spotify API in the DOM in a way
 * such that the string might be interpreted as HTML, such as setting the
 * innerHTML attribute of a node. Note that the recommendation is that the
 * application does not use innerHTML, because it is easy to accidentally
 * introduce dangerous behavior.
 *
 * @function
 * @name String#decodeForHtml
 * @return {String} An escaped string that does not contain any HTML code.
 * @since 1.0.0
 *
 * @see String#decodeForText
 * @see String#decodeForLink
 * @example
 * getElementById('name').innerHTML = track.name.decodeForHTML();
 */
String.prototype.decodeForHtml = (function() {
  var e = { '&': '&amp;', '<': '&lt;', '>': '&gt;'};
  var r = function(c) { return e[c]; };
  return function() { return this.replace(/[&<>]/g, r); };
})();

/**
 * Before using a URL string returned from the Spotify API in HTML code that
 * constructs links, use this method to decode it into a string that is escaped
 * for links. Note that it is not recommended to build HTML directly using
 * strings. It is better to construct nodes and set the link URL attributes
 * instead. This way there is less chance of introducing dangerous behavior.
 *
 * @function
 * @name String#decodeForLink
 * @return {String} A URL escaped string.
 * @since 1.0.0
 *
 * @see String#decodeForText
 * @see String#decodeForHtml
 * @example
 * div.innerHTML = '&lt;a href="' + artist.uri.decodeForLink() + '"&gt;Artist&lt;/a&gt;';
 */
String.prototype.decodeForLink = function() {
  return encodeURI(this);
};

/**
 * URI and URL Bases used for toSpotifyURL, toSpotifyURI and toSpotifyLink
 * methods.
 */
SpotifyApi.Bases = {
  uri: 'spotify',
  url: 'http://open.spotify.com'
};

/**
 * Regular expressions used for toSpotifyURL, toSpotifyURI and toSpotifyLink
 * methods.
 */
SpotifyApi.Exps = {
  spotify: /^spotify:(.+)$/,
  http: /^https?:\/\/open\.spotify\.com\/(.+)$/
};

/**
 * Converts a string Spotify URI to a Spotify URL.
 *
 * @function
 * @name String#toSpotifyURL
 * @return {String} a string containing a Spotiy URI.
 * @since 1.0.0
 *
 * @see String#toSpotifyURI
 * @see String#toSpotifyLink
 */
String.prototype.toSpotifyURL = function() {
  var matches = this.match(SpotifyApi.Exps.spotify);
  if (!matches) return this;
  var parts = matches.pop().replace(/:$/, '').split(/:/);
  var type = parts.shift();
  if (type == 'search') parts = [parts.join(':')];
  parts.unshift(SpotifyApi.Bases.url, type);
  return parts.join('/');
};

/**
 * Converts a string Spotify URL to a Spotify URI.
 *
 * @function
 * @name String#toSpotifyURI
 * @return {String} a string containing a Spotiy URL.
 * @since 1.0.0
 *
 * @see String#toSpotifyURL
 * @see String#toSpotifyLink
 */
String.prototype.toSpotifyURI = function() {
  var matches = this.match(SpotifyApi.Exps.http);
  if (!matches) return this;
  var parts = matches.pop().replace(/\/$/, '').split(/\//);
  parts.unshift(SpotifyApi.Bases.uri);
  return parts.join(':');
};

/**
 * Converts a string Spotify URL or Spotify URI to the
 * platform's default type.
 *
 * @function
 * @name String#toSpotifyLink
 * @return {String} a string containing a Spotiy URL or URL.
 * @since 1.0.0
 *
 * @see String#toSpotifyURL
 * @see String#toSpotifyURI
 */
String.prototype.toSpotifyLink = function() {
  return this.toSpotifyURI();
};
