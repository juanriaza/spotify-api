/**
 * Request callback that resolves the object of the promise with the request
 * result.
 * @this {Promise}
 * @private
 */
var _resolveResult = function(result) {
  this.object.resolveMany(0, result);
  this.setDone();
};

/**
 * Set a promise to done.
 * @this {Promise}
 * @private
 */
var _setDone = function() {
  this.setDone();
};

/**
 * Performs a bridge request and returns a promise for that request.
 * @param {Object} object The object to return in the promise callbacks.
 * @param {string} request The request to make.
 * @param {Array} args Arguments to send with the request.
 * @param {boolean=} opt_resolveResult Whether to also resolve the result on
 *     the object. Useful when the request returns updated data.
 * @return {Promise} A promise that will resolve when the request is complete.
 */
var promisedRequest = function(object, request, args, opt_resolveResult) {
  var promise = new Promise(object);
  SP.request(request, args, promise, opt_resolveResult ? _resolveResult : _setDone, promise.setFail);
  return promise;
};

/**
 * Helper function to create an Artist object from an object containing both the
 * URI and the metadata of the artist. Used to create the "artists" property of
 * both Album and Track.
 * @private
 */
var _artists = function(metadata_with_uri) {
  return Artist.fromURI(metadata_with_uri.uri, metadata_with_uri);
};

/**
 * Helper function to create an Album object from an object containing both the
 * URI and the metadata of the album. Used to create the "albums" property of
 * AlbumGroups.
 * @private
 */
var _albums = function(metadata_with_uri) {
  return Album.fromURI(metadata_with_uri.uri, metadata_with_uri);
};

/**
 * Helper function to create a Disc object from an object containing both the
 * URI and the metadata of the disc. Used to create the "discs" property of
 * Albums.
 * @private
 */
var _discs = function(metadata_with_uri) {
  return Disc.fromURI(metadata_with_uri.uri, metadata_with_uri);
};

/**
 * All "metadata items" (Album, Artist, Playlist, Track and URI) are cached on
 * JavaScript side, because it is quite expensive to cross the bridge each time
 * one is needed. The cached items may not contain no metadata, some metadata
 * or all metadata. The items are never evicted from the cache, but a longer
 * term plan is to implement that though, so the user of the API cannot depend
 * on the fact that Item.fromURI always returns the same item for a given URI.
 *
 * @class
 * @since 1.0.0
 *
 * @param {Function} itemClass The type of the items that the cache is for.
 */
function Cache(itemClass) {
  /**
   * A map of URIs to object instances.
   * @type {Object.<string, Object>}
   * @private
   */
  this._items = {};
  /**
   * The type of the items that the cache is for.
   * @type {Function}
   * @private
   */
  this._class = itemClass;
}

/**
 * Looks up an item in the cache for this class.
 * @param {string} uri The URI of the item to look up.
 * @param {Object=} opt_metadata Metadata to fill the object with if it isn't
 *     in the cache.
 * @return {Loadable} An item from the cache (or a newly created instance now
 *     in the cache).
 */
Cache.lookup = function(uri, opt_metadata) {
  return this._cache.lookup(uri, opt_metadata);
};

/**
 * Looks up a list of items in the cache for this class.
 *
 * @since 1.3.0
 *
 * @param {Array.<string>} uris The URIs of the items to look up.
 * @return {Array.<Loadable>} A list of items from the cache (or newly created
 *     instances, now also stored in the cache).
 */
Cache.lookupMany = function(uris) {
  var result = [];
  for (var i = 0, len = uris.length; i < len; i++) {
    result.push(this._cache.lookup(uris[i]));
  }
  return result;
};

/**
 * Put an item in the cache.
 * @param {string} uri The URI of the item to cache.
 * @param {Loadable} item The item to cache.
 */
Cache.prototype.cache = function(uri, item) {
  this._items[uri] = item;
};

/**
 * Looks up an item in the cache, creating it and filling it with the provided
 * metadata if it doesn't exist in the cache.
 *
 * @param {string} uri The URI of the item to look up.
 * @param {Object=} opt_metadata Metadata to fill the object with if it isn't
 *     in the cache.
 * @return {Loadable} An item from the cache (or a newly created instance now
 *     in the cache).
 */
Cache.prototype.lookup = function(uri, opt_metadata) {
  if (!uri) return null;
  var item = this._items[uri];
  if (!item) {
    item = new this._class(uri);
    item.resolveMany(0, opt_metadata);
    this._items[uri] = item;
  }
  return item;
};

/**
 * Removes an item from the cache.
 * @param {string} uri The URI of the item to remove.
 */
Cache.prototype.remove = function(uri) {
  delete this._items[uri];
};

/**
 * Updates a property on one or more items in the cache.
 *
 * @param {Array.<string>} uris The URIs of one or more items to update.
 * @param {Object} data An object with properties and values to update the
 *     items with.
 */
Cache.prototype.update = function(uris, data) {
  for (var i = 0, len = uris.length; i < len; i++) {
    var item = this._items[uris[i]];
    if (item) item.resolveMany(0, data);
  }
};

/**
 * @class
 * @classdesc The base class for all objects that can be observed with
 *     addEventListener.
 * @since 1.0.0
 *
 * @example
 * function MyClass() {
 *   Observable.call(this);
 *
 *   this.something = 127;
 * }
 * SP.inherit(MyClass, Observable);
 */
function Observable() {}

/**
 * This method is called when the first event listener is added to this
 * Observable. Subclasses may override this method in order to lazily initialize
 * resources related to event listening.
 * @protected
 */
Observable.prototype._observed = function() {};

/**
 * Same as the addEventListener in standard JavaScript. Call this method to add
 * an observer to the receiver object, for a given named event.
 *
 * @function
 * @name Observable#addEventListener
 * @since 1.0.0
 * @param {string} eventType The name of the event to get notifications for.
 * @param {Function} observer The callback function. To unregister the callback,
 * the very same function must be passed to the removeEventListener method.
 *
 * @see Observable#removeEventListener
 * @example
 * models.player.addEventListener('change', updateNowPlayingWidget);
 */
Observable.prototype.addEventListener = function(eventType, observer) {
  if (!observer) return;
  if (!this._ob) {
    this._ob = {};
    this._obcount = 0;
  }

  var callbacks = this._ob[eventType];
  if (callbacks) callbacks.push(observer);
  else this._ob[eventType] = [observer];

  this._obcount++;
  if (this._obcount == 1) this._observed();
};

/**
 * Same as the removeEventListener in standard JavaScript. Call this method to
 * remove an observer that was previously added.
 *
 * @function
 * @name Observable#removeEventListener
 * @since 1.0.0
 * @param {string} eventType The name of the event you're getting notifications for.
 * @param {Function} observer The callback must be the exact same function instance
 * as was used in the registration, and not just an identical anonymous function.
 *
 * @see Observable#addEventListener
 * @example
 * models.player.removeEventListener('change', updateNowPlayingWidget);
 */
Observable.prototype.removeEventListener = function(eventType, observer) {
  var observers = this._ob || {};
  var callbacks = observers[eventType] || [];
  var index = callbacks.indexOf(observer);

  if (index != -1) {
    this._obcount--;
    callbacks.splice(index, 1);
    if (!callbacks.length) delete observers[eventType];
    if (!this._obcount) delete this._ob;
  }
};

/**
 * Triggers an event for all observer callbacks.
 * Any callback that explicitly returns false or calls preventDefault()
 * will cause the return value of this function to be false.
 * @function
 * @name Observable#dispatchEvent
 * @since 1.0.0
 * @param {{type: string}|string} evt The event object to dispatch (must have a
 *     type property), or simply the event type as a string.
 * @return {boolean} False if the event was prevented; otherwise, true.
 */
Observable.prototype.dispatchEvent = function(evt) {
  if (typeof evt == 'string') {
    evt = {type: evt};
  }
  if (!evt || !evt.type) {
    throw new Error('Dispatched event must have a type.');
  }
  if (!evt.target) {
    evt.target = this;
  }

  var observers = this._ob || {};
  var callbacks = (observers[evt.type] || []).slice(0);
  if (!callbacks.length) return true;

  var ret = true;
  evt.preventDefault = function() {
    ret = false;
  };
  for (var i = 0; i < callbacks.length; i++) {
    try {
      if (callbacks[i].call(this, evt) === false) ret = false;
    } catch (error) {
      console.error(error);
      if (SP._throwError)
        throw error;
    }
  }
  return ret;
};

/**
 * @class
 * @classdesc A promise is an object that represents a pending query that will
 *     be resolved at some point in the future. A query may either be done or
 *     it may fail. Depending on the outcome, the appropriate callbacks will be
 *     called. A number of promises may be joined using {@link Promise#join} to
 *     make it easy to run a function once several independent queries have all
 *     been resolved.
 * @since 1.0.0
 *
 * @param {Object} object An object that will be passed to the always/done/
 *     fail/each callbacks.
 */
function Promise(object) {
  this.object = object;
  this._done = [];
  this._fail = [];
}

/**
 * When the promise is resolved (success or failure doesn't matter), callbacks
 * registered by this method will be invoked. If the promise has already
 * resolved, the callback function will be called immediately, without waiting
 * for the next runloop iteration. The argument to the callback function is the
 * object used to resolve the promise.
 *
 * @function
 * @name Promise#always
 * @since 1.0.0
 *
 * @param {Object|function(Object)} callbackOrThis If this argument is an
 *     object, it will be used as the "this" context object when calling the
 *     callback. If this argument is the callback function instead, the "this"
 *     context object will be the promise when the callback is called.
 * @param {function(Object)=} opt_callback The callback function to invoke,
 *     unless specified as the first argument.
 * @return {Promise} Returns the same instance, so that the callback method
 *     calls can be easily called in sequence.
 *
 * @example
 * models.Artist.fromURI('spotify:artist:74terC9ol9zMo8rfzhSOiG').load('name')
 *     .done(function(artist) { console.log(artist.name); })
 *     .fail(function(artist, error) { console.log(error.message); })
 *     .always(function(artist, maybeError) { console.log('Done or failed.'); });
 */
Promise.prototype.always = function(callbackOrThis, opt_callback) {
  var cbFunc, cbThis;
  if (opt_callback) {
    cbFunc = opt_callback;
    cbThis = callbackOrThis;
  } else {
    cbFunc = callbackOrThis;
    cbThis = this;
  }

  if (typeof cbFunc != 'function')
    throw new Error('A callback function is required');

  if (this._done) {
    // If the _done property exists, this promise has not resolved yet.
    this._done.push(SP.callback(SP.bind(cbFunc, cbThis)));
    this._fail.push(SP.callback(SP.bind(cbFunc, cbThis)));
  } else {
    cbFunc.apply(cbThis, this._args);
  }
  return this;
};

/**
 * When the promise is resolved successfully, callbacks registered by this
 * method will be invoked. If the promise has already resolved, the callback
 * function will be called immediately, without waiting for the next runloop
 * iteration. The argument to the callback function is the object used to
 * resolve the promise.
 *
 * @function
 * @name Promise#done
 * @since 1.0.0
 *
 * @param {Object|function(Object)} callbackOrThis If this argument is an
 *     object, it will be used as the "this" context object when calling the
 *     callback. If this argument is the callback function instead, the "this"
 *     context object will be the promise when the callback is called.
 * @param {function(Object)=} opt_callback The callback function to invoke,
 *     unless specified as the first argument.
 * @return {Promise} Returns the same instance, so that the callback method
 *     calls can be easily called in sequence.
 *
 * @example
 * models.Artist.fromURI('spotify:artist:74terC9ol9zMo8rfzhSOiG').load('name')
 *     .done(function(artist) { console.log(artist.name); })
 *     .fail(function(artist, error) { console.log(error.message); });
 */
Promise.prototype.done = function(callbackOrThis, opt_callback) {
  var cbFunc, cbThis;
  if (opt_callback) {
    cbFunc = opt_callback;
    cbThis = callbackOrThis;
  } else {
    cbFunc = callbackOrThis;
    cbThis = this;
  }

  if (typeof cbFunc != 'function')
    throw new Error('A callback function is required');

  if (this._isDone)
    cbFunc.apply(cbThis, this._args);
  else if (this._done)
    // If the _done property exists, this promise has not resolved yet.
    this._done.push(SP.callback(SP.bind(cbFunc, cbThis)));
  return this;
};

/**
 * When the promise fails, callbacks registered by this method will be invoked.
 * If the promise has already failed, the callback function will be called
 * immediately, without waiting for the next runloop iteration. The argument to
 * the callback function is an error object describing the failure.
 *
 * @function
 * @name Promise#fail
 * @since 1.0.0
 *
 * @param {Object|function(Object)} callbackOrThis If this argument is an
 *     object, it will be used as the "this" context object when calling the
 *     callback. If this argument is the callback function instead, the "this"
 *     context object will be the promise when the callback is called.
 * @param {function(Object)=} opt_callback The callback function to invoke,
 *     unless specified as the first argument.
 * @return {Promise} Returns the same instance, so that the callback method
 *     calls can be easily called in sequence.
 *
 * @example
 * models.Track.fromURI('spotify:track:6a41rCqZhb2W6rpMolDR08').load('name')
 *     .done(function(track) { console.log(track.name); })
 *     .fail(function(track, error) { console.log(error.message); });
 */
Promise.prototype.fail = function(callbackOrThis, opt_callback) {
  var cbFunc, cbThis;
  if (opt_callback) {
    cbFunc = opt_callback;
    cbThis = callbackOrThis;
  } else {
    cbFunc = callbackOrThis;
    cbThis = this;
  }

  if (typeof cbFunc != 'function')
    throw new Error('A callback function is required');

  if (this._isFail)
    cbFunc.apply(cbThis, this._args);
  else if (this._fail)
    // If the _fail property exists, this promise has not resolved yet.
    this._fail.push(SP.callback(SP.bind(cbFunc, cbThis)));
  return this;
};

/**
 * For joined promises, the callback given to this method will be called once
 * for each of the promises in the join. Promises that fail will not invoke the
 * callback. When adding this callback to the promise, all joined promises that
 * already have completed will invoke the callback, in the order they resolved.
 * The argument to the callback is the same argument as given to the individual
 * promises.
 *
 * @function
 * @name Promise#each
 * @since 1.0.0
 *
 * @param {Object|function(Object)} callbackOrThis If this argument is an
 *     object, it will be used as the "this" context object when calling the
 *     callback. If this argument is the callback function instead, the "this"
 *     context object will be the promise when the callback is called.
 * @param {function(Object)=} opt_callback The callback function to invoke,
 *     unless specified as the first argument.
 * @return {Promise} Returns the same instance, so that the callback method
 *     calls can be easily called in sequence.
 *
 * @example
 * var tracks = getSomeToplist();
 * var promises = [];
 * tracks.forEach(function(track) { promises.push(track.load('name')); });
 * models.Promise.join(promises)
 *     .each(function(track) { console.log('Loaded one track: ' + track.name); })
 *     .done(function(tracks) { console.log('Loaded all tracks.'); })
 *     .fail(function(tracks) { console.log('Failed to load at least one track.'); });
 */
Promise.prototype.each = function(callbackOrThis, opt_callback) {
  // If this is not a joined promise, calling this method will be a no-op.
  if (this._objs) {
    var cbFunc, cbThis;
    if (opt_callback) {
      cbFunc = opt_callback;
      cbThis = callbackOrThis;
    } else {
      cbFunc = callbackOrThis;
      cbThis = this;
    }

    if (typeof cbFunc != 'function')
      throw new Error('A callback function is required');

    if (this._each) {
      this._each.push(SP.callback(SP.bind(cbFunc, cbThis)));
    }

    // Call the newly added each callback for any objects that may already have
    // resolved.
    for (var i = 0, l = this._objs.length; i < l; i++)
      cbFunc.call(cbThis, this._objs[i]);
  }
  return this;
};

/**
 * Resolves the promise, with the object that was specified when creating the
 * instance, set manually afterwards or passed to this method. All callbacks
 * for done will be called in the order they were registered.
 *
 * @function
 * @name Promise#setDone
 * @since 1.0.0
 *
 * @param {*=} opt_object An optional object that should be passed on to all
 *     done handlers.
 */
Promise.prototype.setDone = function(opt_object) {
  if (!this._done) return;
  var done = this._done;
  var fail = this._fail;
  delete this._done;
  delete this._fail;

  if (arguments.length == 1) {
    this.object = opt_object;
  }

  this._isDone = true; // Must be set before invoking the callbacks.
  this._args = [this.object];

  for (var i = 0, l = done.length; i < l; i++)
    done[i].apply(undefined, this._args); // first arg ignored as target is bound
  for (var j = 0, k = fail.length; j < k; j++)
    fail[j].clear();

  delete this._each;
  delete this._join;
  delete this._numResolved;
  delete this._oneFailed;
};

/**
 * Fails the promise, with the given error reason. All callbacks for fail will
 * be called in the order they were registered.
 *
 * @function
 * @name Promise#setFail
 * @since 1.0.0
 *
 * @param {Object} error An error object describing what went wrong.
 */
Promise.prototype.setFail = function(error) {
  if (!this._done) return;
  var fail = this._fail;
  var done = this._done;
  delete this._done;
  delete this._fail;

  this._isFail = true; // Must be set before invoking the callbacks.
  this._args = [this.object, error];
  for (var i = 0, l = fail.length; i < l; i++)
    fail[i].apply(undefined, this._args); // first arg ignored as target is bound
  for (var j = 0, k = done.length; j < k; j++)
    done[j].clear();

  delete this._each;
  delete this._join;
  delete this._numResolved;
  delete this._oneFailed;
};

/**
 * Joins several promises into a single promise that can be waited on. The done
 * and fail callbacks will be called when all of the promises have resolved or
 * any of the promises has failed respectively. The argument to the callback
 * function is an array with the resolved object of all promises. In addition
 * to these composite callbacks, the returned promise object has a method
 * called each, which can be used to get a callback when each of the promises
 * complete. The each callbacks will never be called again once the promise has
 * resolved or failed.
 *
 * @function
 * @name Promise#join
 * @since 1.0.0
 *
 * @param {Array.<Promise>|...Promise} promises Either an array of promises to
 *     join or the promises as separate parameters.
 * @return {Promise} A new Promise that will be done/fail when all of the
 *     joined promises are done/failed.
 *
 * @example
 * var p1 = album.load('name');
 * var p2 = track.load('name', 'duration');
 * var wait = models.Promise.join(p1, p2); // or join([p1, p2]);
 * wait.done(albumAndTrackDone).fail(eitherFailed).each(eitherDone);
 */
Promise.join = function(promises) {
  var promise = new Promise();
  promises = SP.varargs(arguments, 0, true);
  promise._join = promises;
  promise._each = [];
  promise._objs = [];
  promise._numResolved = 0;

  if (promises.length === 0) promise.setDone();
  for (var i = 0, l = promises.length; i < l; i++)
    promises[i].done(promise, promise._oneDone).fail(promise, promise._oneFail);

  return promise;
};

/**
 * This method is called whenever a sub-promise resolves. Once all sub-promises
 * have resolved, this promise will also resolve. If one or more of the sub-
 * promises failed, this promise will also fail.
 *
 * @private
 * @see Promise#join
 */
Promise.prototype._oneEither = function(object) {
  this._numResolved++;
  if (this._numResolved < this._join.length) return;

  // If the function doesn't return above, all promises have resolved. Collect
  // all the objects into an array and make that the object of this promise.
  this.object = [];
  for (var i = 0, l = this._join.length; i < l; i++)
    this.object.push(this._join[i].object);

  // We no longer need the each callbacks so we need to clean them up.
  for (var j = 0, k = this._each.length; j < k; j++)
    this._each[j].clear();

  // If one or more of the promises failed, we want this promise to fail too.
  if (this._oneFailed)
    this.setFail();
  else
    this.setDone();
};

/**
 * Called when one of the joined promises resolves as done. Will go through the
 * list of each callbacks and call them with the same arguments as given to
 * this method. If this method is called after a done or fail callback has been
 * called nothing will happen, because our contract states that we must never
 * call one of the each callbacks after either the done or fail callbacks have
 * been called.
 *
 * @private
 * @see Promise#join
 */
Promise.prototype._oneDone = function(object) {
  if (!this._done) return;

  // Keep track of resolved objects for any each callbacks added after this
  // promise has resolved.
  this._objs.push(object);

  // Call the each callbacks.
  var nextEach = [];
  for (var i = 0, l = this._each.length; i < l; i++) {
    var cb = this._each[i];
    nextEach.push(cb.copy());
    cb.call(undefined, object);  // first arg ignored as target is bound
  }
  this._each = nextEach;

  this._oneEither(object);
};

/**
 * Called when one of the joined promises resolves as failed. If this method is
 * called after a done or fail callback has been called nothing will happen,
 * because our contract states that we must never call one of the each
 * callbacks after either the done or fail callbacks have been called.
 *
 * @private
 * @see Promise#join
 */
Promise.prototype._oneFail = function(object, error) {
  if (!this._done) return;

  // Mark the promise as failed. It won't fail straight away though since we
  // may have more unresolved promises still in progress. Once all promises
  // have resolved, we will resolve this promise as failed.
  this._oneFailed = true;

  this._oneEither(object);
};

/**
 * @class
 * @classdesc This is the base class for all high level objects that are exposed
 * in the API. The most important function is the load function, which must be
 * called by the users of the object to indicate exactly what properties they are
 * interested in. The caller cannot expect any other properties to be available
 * on the object, even though some extra properties might show up there as an
 * optimized fetch operation. The extra properties can and will change in the
 * future and must not be read.
 * @since 1.0.0
 */
function Loadable() {
  Observable.call(this);
  // this._done = 0 and this._wait = 0 are implicit since undefined acts the
  // same as 0 for bitwise operations. This means that the subclass does not
  // need to call this constructor at all.
}

SP.inherit(Loadable, Observable);

/**
 * Register a group of properties that can all be fetched using the same method
 * call. The method will be invoked once when any of the properties in the
 * group is loaded, and the method must return all of the properties in the
 * group: otherwise they will never be loaded, even if additional load calls
 * are made for those properties. They object will already have recorded that
 * there are no values for those properties.
 *
 * @function
 * @name Loadable#define
 * @since 1.0.0
 */
Loadable.define = function(clazz, names, func) {
  var proto = clazz.prototype;
  if (!proto._prop) proto._prop = {};
  if (!proto._next) proto._next = 0;
  var group = { mask: 0, func: func };

  for (var i = 0, l = names.length; i < l; i++) {
    var mask = (1 << proto._next++);
    group.mask |= mask;
    proto._prop[names[i]] = {
      mask: mask,
      group: group
    };
  }
};

/**
 * Lets the subclasses transform the raw property values into high level objects
 * such as Album or Track. The bridge will in general send URIs for links to
 * other items, which can be passed to Track/Album/etc.fromURI to create the
 * actual objects. The transform method should never start a load of the objects
 * it creates, because that could end up in loading the entire world, and the
 * idea is that it is supposed to be cheap to create objects, and the expensive
 * operations should happen when actually loading the objects.
 *
 * @private
 */
Loadable.prototype._make = function(name, value) {
  name = ('_make_' + name);
  var func = this[name];
  return (func ? func(value) : value);
};

/**
 * Resolves a single property on an object.
 * @param {string} name The name of the property.
 * @param {*} value The new value.
 * @param {boolean=} opt_silent Whether to skip dispatching change events for
 *     any properties that change.
 */
Loadable.prototype.resolve = function(name, value, opt_silent) {
  var prop = this._prop[name];
  if (!prop) return;

  this._done |= this._prop[name].mask;
  this._wait &= ~this._done;

  var newValue = this._make(name, value);
  if (this.hasOwnProperty(name) && !opt_silent) {
    // The item already had this value, so if the value changed, dispatch a
    // change event for anyone who may have read it and wants to know it
    // changed.
    var oldValue = this[name];
    if (oldValue !== newValue) {
      this[name] = newValue;

      this.dispatchEvent({
        type: 'change:' + name,
        property: name,
        oldValue: oldValue
      });
    }
  } else {
    this[name] = newValue;
  }

  if (!this._wait) delete this._wait;
};

/**
 * Resolves many properties on an object.
 * @param {number} propsMask A bitmask of properties to mark as done and unmark
 *     as waiting.
 * @param {Object} data A map of properties to update and their new values.
 * @param {boolean=} opt_silent Whether to skip dispatching change events for
 *     any properties that change.
 */
Loadable.prototype.resolveMany = function(propsMask, data, opt_silent) {
  for (var name in data) this.resolve(name, data[name], opt_silent);
  this._done |= propsMask;
  this._wait &= ~propsMask;
  this.resolveDone();
};

Loadable.prototype.resolveDone = function() {
  if (!this._reqs) return;
  var done = [];
  for (var i = 0; i < this._reqs.length; i++) {
    if (!(this._reqs[i]._need & ~this._done))
      done.push(this._reqs.splice(i--, 1)[0]);
  }
  if (!this._reqs.length) delete this._reqs;
  if (!this._wait) delete this._wait;
  for (var j = 0, l = done.length; j < l; j++) {
    done[j].setDone();
  }
};

Loadable.prototype.resolveFail = function(props_mask, error) {
  this._wait &= ~props_mask;
  if (!this._reqs) return;
  var fail = [];
  for (var i = 0; i < this._reqs.length; i++) {
    if (this._reqs[i]._need & props_mask)
      fail.push(this._reqs.splice(i--, 1)[0]);
  }
  if (!this._reqs.length) delete this._reqs;
  if (!this._wait) delete this._wait;
  for (var j = 0, l = fail.length; j < l; j++) {
    fail[j].setFail(error);
  }
};

/**
 * Before any properties of an object can be read they must be loaded by calling
 * this function with a list of properties that the caller is interested in. The
 * only way to ensure that any properties are available on an object is to call
 * this method. After specifying what properties to load the caller must wait
 * for the returned promise to resolve before the properties can actually be
 * read from the object. If the promise fails, the properties must not be read.
 * Note that it is possible, and recommended, to call load multiple times with
 * different property lists. The properties should be grouped by how they are
 * used together. By specifiying a minimum set of properties for each call to
 * load, the callback will happen as soon as possible, sometimes without even
 * having to wait for additional metadata to be fetched remotely.
 *
 * @function
 * @name Loadable#load
 * @since 1.0.0
 *
 * @param {Array.<string>|...string} properties An array of property names. The
 *     property names that are available for loading can be found in the
 *     documentation for each specific sub-class. Note that instead of passing
 *     in an array, multiple arguments can be passed instead.
 * @return {Promise} A promise to wait for before the properties can be read.
 *
 * @example
 * models.Track.fromURI('...').load('name', 'duration').done(function(track) {
 *   console.log('The track ' + track.name + ' is ' + track.duration ' ms long.');
 * });
 */
Loadable.prototype.load = function(properties) {
  var args = SP.varargs(arguments);
  var req = new Promise(this);
  req._need = this._neededForLoad(args);
  if (req._need) {
    if (this._reqs)
      this._reqs.push(req);
    else
      this._reqs = [req];
    this._requestProperties(req._need);
  } else {
    req.setDone();
  }
  return req;
};

/**
 * Checks what properties already exist and returns the intersection of those
 * and the properties to load. The returned value is the bitmask of all
 * properties that are needed, but not yet loaded, including the ones that are
 * waiting to get a reply. If the properties array is empty, a bitmask
 * representing all properties in the object is returned. This can be a very
 * request if properties must be loaded from different sources, so it must only
 * be used when debugging code as a convenience.
 *
 * @private
 * @param {Array} properties An array of properties to get the bitmask for.
 * @since 1.0.0
 */
Loadable.prototype._neededForLoad = function(properties) {
  var needed_mask = 0;
  for (var i = 0, l = properties.length; i < l; i++) {
    var name = properties[i];
    var prop = this._prop[name];
    if (!prop) throw new Error(name + ' is not a property.');
    needed_mask |= prop.mask;
  }
  return (needed_mask & ~this._done);
};

Loadable.prototype._requestProperties = function(props_mask) {
  var groups = [];
  for (var name in this._prop) {
    var prop = this._prop[name];
    var mask = prop.group.mask;
    if (!(mask & props_mask)) continue; // skip: no overlap
    if ((mask & this._wait)) continue; // skip: already sent
    groups.push(prop.group);
    this._wait |= mask;
    props_mask &= ~mask;
    if (!props_mask) break;
  }

  for (var i = 0, l = groups.length; i < l; i++) {
    var func = this[groups[i].func];
    if (func) func.call(this, groups[i].mask);
  }
};

/**
 * @class
 * @extends {Loadable}
 * @classdesc Loadable that interacts with the bridge and handles some common
 *     functionality.
 * @since 1.0.0
 */
function BridgeLoadable() {
  Loadable.call(this);
}

SP.inherit(BridgeLoadable, Loadable);

/**
 * Start listening for bridge events.
 * @param {string} requestName Request name to make to the bridge.
 * @param {Array} requestArgs Args for the bridge request.
 */
BridgeLoadable.prototype.bridgeListen = function(requestName, requestArgs) {
  this._requestName = requestName;
  this._requestArgs = requestArgs;
  this._listening = true;
  this._eventWait();
};

/**
 * Stop listening for bridge events.
 */
BridgeLoadable.prototype.bridgeUnlisten = function() {
  delete this._requestName;
  delete this._requestArgs;
  // There's no way to actually cancel the pending request. So we wait for the
  // next timeout, and then no further SP.request will be made.
  delete this._listening;
};

/**
 * Renew the request to wait for a bridge event if we're supposed to be
 * listening.
 * @private
 */
BridgeLoadable.prototype._eventWait = function() {
  if (this._listening)
    SP.request(this._requestName, this._requestArgs, this, this._eventDone, this._eventFail);
};

/**
 * Handler for bridge events, internal implementation.
 * @private
 */
BridgeLoadable.prototype._eventDone = function(event) {
  this._eventWait();
  this.eventDone(event);
};

/**
 * Handle an event.
 *
 * Default behavior: resolve the 'data' field from events into property updates
 * on this object. By default, a bridge event is redispatched as a JavaScript
 * event on this, unless a 'receiver' field is specified on the event. If
 * given, the 'receiver' field causes 'this[event.receiver]' to be the event
 * target instead of 'this'.
 *
 * Subclasses should override this method if they need custom functionality to
 * run on every bridge event. This should be a rare case.
 *
 * @param {Object} event Raw event object from the bridge.
 */
BridgeLoadable.prototype.eventDone = function(event) {
  if (event.receiver && this.hasOwnProperty(event.receiver)) {
    // Event told us to use a member object as the event receiver.
    var receiver = this[event.receiver];
    receiver.resolveMany(0, event.data);
    receiver.dispatchEvent(event);
  } else {
    this.resolveMany(0, event.data);
    this.dispatchEvent(event);
  }
};

/**
 * Failure handler, internal implementation.
 * @private
 */
BridgeLoadable.prototype._eventFail = function(error) {
  if (error.error == 'timeout')
    this._eventWait();
  this.eventFail(error);
};

/**
 * Handle a failure.
 *
 * Subclasses should replace this method if they need custom
 * functionality to run on an error.
 * @param {Object} error Raw error object from the bridge.
 */
BridgeLoadable.prototype.eventFail = function(error) {};

/**
 * A bridge listener that does not handle events itself, but that can proxy
 * them to another bridge listener.
 *
 * @class
 * @extends {BridgeLoadable}
 * @since 1.2.0
 */
function ProxyListener() {
  BridgeLoadable.call(this);

  /**
   * Functions that can modify an event before it is proxied.
   * @type {Array.<Function>}
   * @private
   */
  this._filters = [];

  /**
   * Other BridgeLoadables that will receive the events from this one.
   * @type {Array.<BridgeLoadable>}
   * @private
   */
  this._receivers = [];

}

SP.inherit(ProxyListener, BridgeLoadable);

/**
 * Adds a filter which will be applied before proxying an event.
 *
 * A filter can prevent an event from being proxied by explicitly returning
 * false. It is also free to modify the event before it is passed on, or
 * otherwise making use of its data.
 *
 * @param {function(Object):boolean} filter A filter to apply to events.
 */
ProxyListener.prototype.filter = function(filter) {
  this._filters.push(filter);
};

/**
 * Proxies events to the specified bridge listener. More than one receiver is
 * allowed.
 *
 * @param {BridgeLoadable} receiver Bridge listener to receive events from this
 *     one.
 */
ProxyListener.prototype.proxyTo = function(receiver) {
  this._receivers.push(receiver);
};

/**
 * Applies filters and proxies the event instead of handling it on this
 *     instance.
 *
 * @param {Object} evt Raw event object from the bridge.
 * @override
 */
ProxyListener.prototype.eventDone = function(evt) {
  // Apply all filters before passing the event on to the receivers. However,
  // if any of the filter functions return false, the event will not be passed
  // on.
  var i, len, proxy = true;
  for (i = 0, len = this._filters.length; i < len; i++) {
    if (this._filters[i](evt) === false) proxy = false;
  }
  if (!proxy) return;

  for (i = 0, len = this._receivers.length; i < len; i++) {
    this._receivers[i].eventDone(evt);
  }
};

/**
 * @class
 * @classdesc The base class of all the "metadata objects": Album, Artist,
 *     Playlist, Track and User. It encapsulates all of the metadata request
 *     functionality, which is more or less the same for all types.
 * @private
 */
function MdL(uri) {
  BridgeLoadable.call(this);
}

SP.inherit(MdL, BridgeLoadable);

/**
 * Subclasses must call this method to set up some particulars of that subclass.
 * Failure to load this method will lead to runtime error when loading any
 * properties of the instances.
 * @name MdL#init
 */
MdL.init = function(clazz, prefix) {
  clazz._type = prefix;
};

/**
 * Returns an image URL for a given minimum size in pixels. Note that this
 * method does takes into account the resolution of the device screen, which
 * means that if the application is running on a High-DPI display, such as an
 * iPhone 4 or iPad 3, the number of pixels in the image will be twice as many
 * as the number of requested CSS pixels. An application running on 3G might
 * want to choose to first transfer a half resolution image to get something on
 * the screen quickly and then request the full resolution image only when all
 * low resolution images have been loaded. Note that all of this is taken care
 * of automatically when using the included view classes, so most applications
 * should not need to worry too much about this. Before this method can be
 * called, the image property must have been loaded.
 * @param {number} size The size, in pixels, of the shortest side of the the
 * image. Note that not all images are square, so the image might be larger in
 * one direction that the requested size, but it will not be smaller, unless the
 * size exceeds the maximum image size allowed, which is platform specific and
 * might change over time. Also note that the image can be larger than the
 * requested minimum size.
 * @since 1.0.0
 * @name MdL#imageForSize
 * @example
 * album.load('image').done(function() {
 *   div.style.backgroundImage = 'url(' + album.imageForSize(300) + ')';
 * });
 */
MdL.prototype.imageForSize = function(size) {
  var images = this.images;
  size *= (window.devicePixelRatio || 1);
  for (var i = 0, l = (images ? images.length : 0); i < l; i++) {
    if (images[i][0] >= size || i == l - 1)
      return images[i][1].replace('{size}', size);
  }
  return this.image;
};

/**
 * Called by load to fetch the metadata of the item.
 * @private
 * @see MdL#_profile
 */
MdL.prototype._metadata = function(props_mask) {
  var load = function(data) { this.resolveMany(props_mask, data); };
  var fail = function(oops) { this.resolveFail(props_mask, oops); };
  SP.request(this.constructor._type + '_metadata', [this.uri], this, load, fail);
};

/**
 * Called by load to fetch the profile information of the item. The profile
 * information is a type of metadata for the item, but things that are quite
 * expensive to look up and of little interest to most users of the API. The
 * main use of the profile is the Artist object, which has some rarely used
 * properties, such as the biography and portait images. The most likely user of
 * the properties is the artist application. No need to punish every other user
 * of the Artist object.
 * @private
 * @see MdL#_metadata
 */
MdL.prototype._profile = function(props_mask) {
  var load = function(data) { this.resolveMany(props_mask, data); };
  var fail = function(oops) { this.resolveFail(props_mask, oops); };
  SP.request(this.constructor._type + '_profile', [this.uri], this, load, fail);
};

MdL.prototype.toString = function() {
  return this.uri;
};

/**
 * Never construct an album object using the default constructor - use fromURI()
 * instead.
 *
 * @class
 * @classdesc The album represents any type of album (album, single or compilation)
 * in the Spotify catalogue.
 * @since 1.0.0
 *
 * @property {array} artists The artists of the album.
 * @property {String} availability Describes how and when the album is available
 * for playback for the currently logged in user. The value will be one of:
 * "available", "banned", "regional", "premium" or "unavailable". "available"
 * means that the album can be played, "banned" that the artist has chosen to
 * not make the album available, "regional" that the album is playable in other
 * regions but not in the region of the currently logged in user, "premium" means
 * that this is premium only content and a premium account is needed in order to play
 * the album (the playable property needs to be checked to actually see if the user
 * can play it or not), and "unavailable" which means the album is unavailable for
 * other reasons.
 * @property {array} copyrights An array of strings with copyright holders for
 * the album. The strings will be on the format "(C) 2012 Company", where "(C)"
 * can be a "(P)" and the year and company name is album specific. For copyright
 * symbols, see:<br />
 * <a href="http://en.wikipedia.org/wiki/Copyright_symbol">Wikipedia - Copyright symbol</a><br />
 * <a href="http://en.wikipedia.org/wiki/Sound_recording_copyright_symbol">Wikipedia - Sound recording copyright symbol</a><br />
 * @property {array} discs An array of discs which are collections of tracks.
 * @property {String} label The label that owns the rights to the album. By
 * using this name in the search query "label:<name>" you can get all the albums
 * for a given label.
 * @property {String} image The image URI for the album.
 *     The format of the image URI is platform dependent, but will always be
 *     something that can be used as the source of an img element or a
 *     background-image in CSS. The size of the image is not defined and might
 *     differ between platforms, so it is recommended that applications use the
 *     imageForSize method to get an appropriately sized image. In general, it's
 *     best to use the Image view from the views framework to display images - it
 *     will load the image in the background (while displaying a placeholder) and
 *     make sure to pick the correct size "intelligently", based on the current
 *     screen resolution and available bandwidth.
 * @property {String} name The name of the album. This is a human readable
 * string that can be presented to the user. Make sure to call the proper string
 * decoding method before using the string in the DOM.
 * @property {boolean} playable Indicates if the album is playable by the
 * currently logged in user. An album can be unplayable for various reasons, such
 * as regional restrictions or play count restrictions in the free service.
 * @property {number} popularity The popularity rating of the album. This is a
 * value between 0 and 100, inclusive, with 0 meaning a very impopular album and
 * 100 a highly popular album.
 * @property {Collection} tracks The tracks of this album.
 * @property {String} type The type of album: "album", "single", "compilation"
 * or undefined if the type is not known.
 * @property {String} uri The URI of the album.
 *
 * @see MdL#imageForSize
 * @see String#decodeForText
 * @see String#decodeForHtml
 * @see String#decodeForLink
 * @see Album#fromURI
 */
function Album(uri) {
  MdL.call(this);
  this.resolve('uri', uri);
}

SP.inherit(Album, MdL);

Loadable.define(Album, ['uri']);

Loadable.define(Album, [
  'availability',
  'artists',
  'date',
  'discs',
  'image',
  'images', // Loaded when 'image' is loaded.
  'label',
  'name',
  'playable',
  'popularity',
  'type'
], '_metadata');

Loadable.define(Album, ['copyrights'], '_profile');

Loadable.define(Album, ['tracks'], '_collections');

MdL.init(Album, 'album');

Album.prototype._make_artists = function(value) { return value && value.map(_artists); };
Album.prototype._make_discs = function(value) { return value && value.map(_discs); };

Album.prototype._collections = function() {
  this.resolve('tracks', new Collection(Track, 'album_tracks', this.uri));
  this.resolveDone();
};

/**
 * Returns the album for a given Spotify URI. The URI is the only property that
 * is loaded on the album immediately.
 *
 * @function
 * @name Album#fromURI
 * @since 1.0.0
 * @param {String} uri The Spotify URI of the album.
 * @return {Album} The album.
 *
 * @example
 * models.Album.fromURI('spotify:album:0hvxqdv8Bg6BXIbTQFr2Sd').load('name').done(function(album) {
 *   console.log(album.uri + ': ' + album.name.decodeForText());
 *   document.getElementById('album').innerHTML = album.name.decodeForHtml();
 * });
 */
Album.fromURI = Cache.lookup;
Album.fromURIs = Cache.lookupMany;
Album._cache = new Cache(Album);

/**
 * @class
 * @classdesc Contains a list of tracks that belonging to a single disc of an album.
 * @since 1.0.0
 */
function Disc(uri) {
  MdL.call(this);
  this.resolve('uri', uri);
  this.resolve('tracks', new Collection(Track, 'album_disc_tracks', uri));
}

SP.inherit(Disc, MdL);

Loadable.define(Disc, ['uri', 'tracks']);

Loadable.define(Disc, [
  'album',
  'number'
], '_metadata');

MdL.init(Disc, 'disc');

Disc.prototype._make_album = function(value) { return value && Album.fromURI(value); };

/**
 * Returns the disc for a given Spotify URI. The URI is the only property that
 * is loaded on the disc immediately.
 *
 * @function
 * @name Disc#fromURI
 * @since 1.0.0
 * @param {String} uri The Spotify URI of the disc.
 * @return {Disc} The disc.
 *
 * @example
 * models.Disc.fromURI('spotify:album:1P1LYaTMV1LnDiHA3LOows:1').load('number').done(function(disc) {
 *   console.log(disc.uri + ': ' + disc.number);
 *   document.getElementById('discNumber').innerHTML = disc.number;
 * });
 */
Disc.fromURI = Cache.lookup;
Disc.fromURIs = Cache.lookupMany;
Disc._cache = new Cache(Disc);

/**
 * @class
 * @classdesc Contains a list of albums that are different versions of the same album. One
 * way this can happen is when the same album is available diffierent regions or
 * when there are multiple versions of the album in one region, e.g., with
 * different bonus tracks.
 * @since 1.0.0
 */
function AlbumGroup(uri, metadata) {
  Loadable.call(this);
  this.resolve('albums', metadata && metadata.albums ? metadata.albums.map(_albums) : []);
}

SP.inherit(AlbumGroup, Loadable);

Loadable.define(AlbumGroup, ['albums']);

/**
 * @name AlbumGroup#fromURI
 */
AlbumGroup.fromURI = function(uri, metadata) {
  return new this(uri, metadata);
};

/**
 * @class
 * @classdesc Contains functionality related to the underlying client that is running this
 * application.
 * @since 1.5.0
 */
function Client() {
  Loadable.call(this);
}

SP.inherit(Client, Loadable);

/**
 * Show the platform-specific sharing UI.
 * @function
 * @name Client#showShareUI
 * @param {Track|Album|Artist|Playlist|string} item Item object to share. URI as
 *     a string is supported for now, but marked as deprecated.
 * @param {string=} opt_message Message to render initially in the sharing UI.
 * @param {{x: number, y: number}=} opt_point Point at which the sharing UI
 *     should be rendered. This point is in x,y coordinates relative to the
 *     application viewport.
 * @return {Promise} A Promise which will resolve successfully if the sharing UI
 * is opened, and which will fail if the sharing UI could not be opened.
 *
 * @example
 * var item = models.Track.fromURI('spotify:track:2P2S1wxZYQYHRYDip79JiY');
 * var element = document.getElementById('myButton');
 * var rect = element.getBoundingClientRect();
 * models.client.showShareUI(item, 'check out this track',
 *     {x: rect.left, y: rect.top}).done(sharingOpenedSuccessfully);
 */
Client.prototype.showShareUI = function(item, opt_message, opt_point) {
  var uri = item.uri || item;
  var message = opt_message || '';
  var args = [uri, message];

  if (opt_point && 'x' in opt_point && 'y' in opt_point) {
    args.push(opt_point.x);
    args.push(opt_point.y);
  }
  return promisedRequest(this, 'client_show_share_ui', args);
};

/**
 * Show the platform-specific context UI.
 * @function
 * @name Client#showContextUI
 * @param {Array.<Track|Album|Artist|Playlist>|Track|Album|Artist|Playlist} item
 *     Items to show context UI for. The items in the array should be of the same type.
 * @param {{x: number, y: number}=} opt_point Point at which the context UI
 *     should be rendered. This point is in x,y coordinates relative to the
 *     application viewport.
 * @param {Album|Artist|Playlist=} opt_origin Origin where the items come from.
 * @return {Promise} A Promise which will resolve successfully if the context UI
 *     is opened, and which will fail if the context UI could not be opened.
 *
 * @example
 * var items = [
 *   models.Track.fromURI('spotify:track:2e2Z8FeqqvUClWqc23nuX1'),
 *   models.Track.fromURI('spotify:track:3k68IqyXiefjfjKy3BVOX0'),
 *   models.Track.fromURI('spotify:track:3jRHAsjvnSTmB5crrpqyTj')
 * ];
 * var element = document.getElementById('track');
 * var rect = element.getBoundingClientRect();
 * models.client.showContextUI(items, { x: rect.left, y: rect.top })
 *     .done(contextUIOpenedSuccessfully)
 *     .fail(contextUINotOpened);
 */
Client.prototype.showContextUI = function(items, opt_point, opt_origin) {
  var uris = Array.isArray(items) ? SP.uris(items) : [items.uri];
  var args = [uris];

  if (opt_point && 'x' in opt_point && 'y' in opt_point) {
    args.push(opt_point.x);
    args.push(opt_point.y);
  }
  if (opt_origin && opt_origin.uri) {
    args.push(opt_origin.uri);
  }
  return promisedRequest(this, 'client_show_context_ui', args);
};

/**
 * @class
 * @classdesc The application object manages the interaction between your
 * application and the Spotify client it runs within. The arguments that were
 * used to start the application can be accessed and observed, so that the
 * application is notified whenever they change. Like all other objects in the
 * Spotify API, the caller must make sure the object is loaded before accessing
 * any of its properties.
 * @since 1.0.0
 *
 * @property {array} arguments The arguments that were used to start the
 *     application, or the most recent arguments if they have changed since starting.
 *     Observe the "arguments" event to get notified when this happens.
 * @property {array} dropped The most recent spotify items that were
 *     dragged and dropped into the app. Observe the "dropped" event to
 *     get notified when this happens.
 * @property {String} uri The URI of the application, without any arguments.
 *
 * @example
 * models.application.load('arguments').done(doSomethingWithTheArguments);
 * models.application.addEventListener('arguments', doSomethingWithTheArguments);
 */
function Application() {
  BridgeLoadable.call(this);
}

SP.inherit(Application, BridgeLoadable);

/**
 * @name Application#arguments
 * @event
 * @desc Fired when the application's arguments have changed.
 * @see Application#arguments
 * @param {Object} event The event object.
 */
/**
 * @name Application#activate
 * @event
 * @desc Fired when the application is activated.
 * @param {object} event The event object.
 */
/**
 * @name Application#deactivate
 * @event
 * @desc Fired when the application is deactivated.
 * @param {object} event The event object.
 */
/**
 * @name Application#dropped
 * @event
 * @desc Fired when spotify items are dragged and dropped into the application.
 * @see Application#dropped
 * @param {object} event The event object.
 */
Loadable.define(Application, [
  'arguments',
  'dropped',
  'uri'
], '_query');

Application.prototype._observed = function() {
  this.bridgeListen('application_event_wait', []);
};

Application.prototype._make_arguments = function(value) {
  return value && value.map(function(i) {
    return decodeURIComponent(i);
  });
};

Application.prototype._make_dropped = function(value) {
  return value && value.map(function(i) {
    return fromURI(i);
  });
};

Application.prototype._query = function(props_mask) {
  var load = function(data) { this.resolveMany(props_mask, data); };
  var fail = function(oops) { this.resolveFail(props_mask, oops); };
  SP.request('application_query', [], this, load, fail);
};

/**
 * Makes a request to the current system to activate the application.
 * Whether or not this request is granted is not guaranteed, and
 * implementations are free to ignore this request.
 *
 * @function
 * @name Application#activate
 * @since 1.0.0
 *
 * @example
 * finishedInitialization(..., function() {
 *   models.application.activate();
 * });
 */
Application.prototype.activate = function() {
  return promisedRequest(this, 'application_activate', [this.uri]);
};

/**
 * Makes a request to the current system to deactivate the application.
 * Whether or not this request is granted is not guaranteed, and
 * implementations are free to ignore this request.
 *
 * @function
 * @name Application#deactivate
 * @since 1.0.0
 *
 * @example
 * finishedDestruction(..., function() {
 *   models.application.deactivate();
 * });
 */
Application.prototype.deactivate = function() {
  return promisedRequest(this, 'application_deactivate', [this.uri]);
};

/**
 * Terminates the application with an optional exit status code. Most
 * applications should not have a need to terminate themselves but if the
 * application is running as a popup window this method should be used to close
 * the popup when the user action is complete.
 *
 * @function
 * @name Application#exit
 * @since 1.0.0
 * @param {number=} opt_statusCode The exit status code. 0 means success and
 * anything else is failure.
 *
 * @example
 * models.application.exit(1); // failure
 */
Application.prototype.exit = function(opt_statusCode) {
  return promisedRequest(this, 'application_notify_exit', [opt_statusCode || 0]);
};

/**
 * If specified in the application's manifest that a loading screen should be
 * put up in place of the application itself, when starting the application,
 * call this method to indicate that the application has finished loading
 * whatever it needs to display the initial state. Also call this method if the
 * manifest specifies that it can restore itself exactly to the state it had
 * when last deactivated. This will hide the screenshot of the application that
 * was made when the application deactivated, and is now used to hide the load.
 *
 * Note that there is no guarantee that the client will keep the loading screen
 * forever, if the application never calls this method. The client can choose to
 * hide the loading screen after an arbitrary timeout even if the application
 * has not completely finished loading, so care should be taken to ensure that
 * the state restoration is as fast as possible.
 *
 * @function
 * @name Application#hideLoadingScreen
 * @since 1.0.0
 *
 * @example
 * loadSavedStateFromLocalStorageAndRestoreDOM(..., function() {
 *   models.application.hideLoadingScreen();
 * });
 */
Application.prototype.hideLoadingScreen = function() {
  SP.request('application_notify_loaded', []);
};

/**
 * Reads a single file from the application's bundle. The path is relative to
 * the root of the bundle. If there is a localized version of the file (in a
 * .loc sub-directory, e.g., en.loc, fr.loc), it will be returned instead of
 * the non-localized version.
 *
 * @function
 * @name Application#readFile
 * @since 1.0.0
 * @param {String} path The file path, relative to the root of the
 * application's bundle.
 * @return {Promise} A promise that will be fulfilled when the data has been
 * read. The object of the promise is the data of the file.
 *
 * @example
 * models.application.readFile('messages.txt').done(gotMessages).fail(didNotGetMessages);
 * function gotMessages(messages) { ... }
 * function didNotGetMessages() { ... }
 */
Application.prototype.readFile = function(path) {
  var promise = new Promise();
  var request = new XMLHttpRequest();
  request.open('GET', path, true);
  request.onreadystatechange = function(e) {
    if (request.readyState !== 4) return;
    if (request.status !== 200 && request.status !== 0) {
      promise.setFail();
    } else {
      promise.setDone(request.responseText);
    }
  };
  request.send(null);
  return promise;
};

/**
 * Instructs the Spotify client to perform its default action on the given
 * URI. Depending on the URI resource kind (track, search, playlist etc.)
 * the client may or may not navigate to it. Depending on which platform
 * you're running on, this might behave differently (to conform with the
 * default behavior for the platform).
 *
 * @function
 * @name Application#openURI
 * @since 1.0.0
 * @param {string} uri The Spotify URI to navigate to. The URI should be a
 *     well-formed and properly encoded spotify URI.
 * @param {string=} opt_context The history context of the operation. If the
 *     context of the last URI that was navigated to is the same as this
 *     context, the old entry will be removed from the history stack and
 *     replaced by the new URI. Most applications will not have a need to set
 *     the history context and should leave out this parameter.
 * @return {Promise} A promise that will be fulfilled if the client can
 * navigate the given URI. If the URI is not valid or supported by the client,
 * it will fail to resolve. It can also fail if the current application does
 * not have permission to navigate to URIs.
 *
 * @example
 * models.application.openURI('spotify:artist:4F84IBURUo98rz4r61KF70');
 * @see Application#openApp
 */
Application.prototype.openURI = function(uri, opt_context) {
  return promisedRequest(this, 'application_open_uri', [uri, opt_context || null]);
};

/**
 * Launches another Spotify application with, optional, arguments. The
 * application will launch in a view decided by the client and may end up
 * replacing the currently running application. How an application is launched
 * is specified in the manifest of that application.
 *
 * @function
 * @name Application#openApp
 * @since 1.0.0
 * @param {String} app The bundle identifier of the application.
 * @param {...String} arguments Zero or more unencoded strings that will be sent
 * as arguments to the application.
 * @return {Promise} A promise that will be fulfilled if the client can launch
 * the specified application. If the application is not known by the client or if
 * the current application does not have permission to launch applications, it
 * will fail to resolve. Note that the current application might not be alive to
 * receive the callback, if the application that is launched replaces the
 * current application.
 *
 * @example
 * var uri = myArtist.uri;
 * models.application.openApp('radio', uri);
 * @see Application#openURI
 */
Application.prototype.openApp = function(app) {
  var arg = SP.varargs(arguments, 1);
  var uriSegments = ['spotify', 'app', app];
  for (var i = 0, l = arg.length; i < l; i++) {
    uriSegments.push(encodeURIComponent(arg[i]));
  }
  return this.openURI(uriSegments.join(':'));
};

/**
 * Sets the display title of the application. How this title is used,
 * if used at all, is dependent on the client.
 *
 * @function
 * @name Application#setTitle
 * @since 1.0.0
 * @param {String} title The display title for the application.
 * @return {Promise} A promise that will be fulfilled if the display
 * title was successfully changed.
 *
 * @example
 * models.application.setTitle('My Application');
 */
Application.prototype.setTitle = function(title) {
  return promisedRequest(this, 'application_set_title', [title]);
};

/**
 * Tells the application to please change its size. This is only a
 * recommendation, and it might be the case that the preferred size
 * cannot be set, for different reasons. The actual size the
 * application has after this call will be returned,
 * and might differ from the preferred one.
 *
 * @function
 * @name Application#setPreferredSize
 * @param {number} width The new preferred width.
 * @param {number} height The new preferred height.
 * @return {Promise} A promise that once resolved will hold the actual new
 *      width and height of the application.
 * @example
 * models.application.setPreferredSize(300, 300).done(function(size) {
 *     console.log('Actual new size: ' + size.width + ' X ' + size.height);
 * });
 */
Application.prototype.setPreferredSize = function(width, height) {
  var promise = new Promise();

  var args = [width, height];
  SP.request('application_set_preferred_size', args, promise, promise.setDone, promise.setFail);

  return promise;
};

/**
 * Logs an app specific event to the Spotify data warehouse. All parameters are
 * application dependent, letting you add new log messages on the fly without
 * having to update any logging framework(s).
 *
 * @function
 * @name Application#clientEvent
 * @since 1.0.0
 * @param {String} context Any context you want to associate with the event (like 'spotify:album:521in6R9kcIFL3cOrqFcH1').
 * @param {String} event The name of the event you're logging.
 * @param {String} event_version The version of the event you're logging.
 * @param {String} test_version The A/B test version (if any) currently in use.
 * @param {object} data Any data you want to assoicate with the event. Must be a JSON-serializable object.
 * @return {Promise} The promise for the logging event.
 *
 * @example
 * require(['$api/models#application'], function(app){
 *   app.clientEvent(context, event, event_version, test_version, data);
 * });
 */
Application.prototype.clientEvent = function(context, event, event_version, test_version, data) {
  return promisedRequest(this, 'application_client_event', [].slice.call(arguments));
};

/**
 * Never construct an artist object using the default constructor - use fromURI()
 * instead.
 *
 * @class
 * @classdesc The artist object represents an artist in the Spotify catalogue.
 * @since 1.0.0
 *
 * @property {Collection} albums The artist's own albums.
 * @property {Collection} appearances Albums on which the the artist appears.
 * @property {String} biography The biography associated with the artist.
 * @property {Collection} genres The genres associated with the artist.
 * @property {String} image The image URI for the artist.
 *     The format of the image URI is platform dependent, but will always be
 *     something that can be used as the source of an img element or a
 *     background-image in CSS. The size of the image is not defined and might
 *     differ between platforms, so it is recommended that applications use the
 *     imageForSize method to get an appropriately sized image. In general, it's
 *     best to use the Image view from the views framework to display images - it
 *     will load the image in the background (while displaying a placeholder) and
 *     make sure to pick the correct size "intelligently", based on the current
 *     screen resolution and available bandwidth.
 * @property {String} name The name of the artist. This is a human readable
 * string that can be presented to the user. Make sure to call the proper string
 * decoding method before using the string in the DOM.
 * @property {number} popularity The popularity rating of the artist. This is a
 * value between 0 and 100, inclusive, with 0 meaning a very low popularity and
 * 100 a very high popularity.
 * @property {Collection} portraits Portraits (images) of the artist.
 * @property {Collection} related Other artists that somehow relates to this artist.
 * @property {Collection} singles The artist's own singles.
 * @property {String} uri The URI of the album.
 * @property {object} years The years during which the artist was/is active.
 *     This value of the property has two fields: "from" and "to".
 * @property {User} user The user associated to the artist, if any exists.
 *
 * @see MdL#imageForSize
 * @see String#decodeForText
 * @see String#decodeForHtml
 * @see String#decodeForLink
 * @see Artist#fromURI
 */
function Artist(uri) {
  MdL.call(this);
  this.resolve('uri', uri);
}

SP.inherit(Artist, MdL);

Loadable.define(Artist, ['uri']);

Loadable.define(Artist, [
  'image',
  'images', // Loaded when 'image' is loaded.
  'name',
  'popularity'
], '_metadata');

Loadable.define(Artist, [
  'biography',
  'genres',
  'portraits',
  'years'
], '_profile');

Loadable.define(Artist, [
  'albums',
  'appearances',
  'related',
  'singles'
], '_collections');

Loadable.define(Artist, [
  'user'
], '_associated_user');

MdL.init(Artist, 'artist');

Artist.prototype._collections = function() {
  this.resolve('albums', new Collection(AlbumGroup, 'artist_albums', this.uri));
  this.resolve('appearances', new Collection(AlbumGroup, 'artist_appearances', this.uri));
  this.resolve('related', new Collection(Artist, 'artist_related_artists', this.uri));
  this.resolve('singles', new Collection(AlbumGroup, 'artist_singles', this.uri));
  this.resolveDone();
};

Artist.prototype._associated_user = function(props_mask) {
  var load = function(data) { this.resolveMany(props_mask, data); };
  var fail = function(oops) { this.resolveFail(props_mask, oops); };
  SP.request('artist_associated_user', [this.uri], this, load, fail);
};

Artist.prototype._make_user = function(value) { return value && User.fromURI(value); };

/**
 * Returns the artist for a given Spotify URI.  The URI is the only property that
 * is loaded on the artist immediately.
 *
 * @function
 * @name Artist#fromURI
 * @since 1.0.0
 * @param {String} uri The Spotify URI of the artist.
 * @return {Artist} The artist matching the given URI.
 *
 * @example
 * models.Artist.fromURI('spotify:artist:5bWRCM3vFGqamlNxSzNj1O').load('name').done(function(artist) {
 *   console.log(artist.uri + ': ' + artist.name.decodeForText());
 *   document.getElementById('artist').innerHTML = artist.name.decodeForHtml();
 * });
 */
Artist.fromURI = Cache.lookup;
Artist.fromURIs = Cache.lookupMany;
Artist._cache = new Cache(Artist);

/**
 * @class
 * @classdesc A collection represents a list of items. Each item in a given
 * collection is guaranteed to be of the same kind. The type of the item(s)
 * depends on what the collection represents - it could be tracks in a playlist,
 * albums in a toplist etc.
 * @since 1.0.0
 */
function Collection(item_class, type, uri, args, sort, filter) {
  Loadable.call(this);
  this.resolve('type', item_class);
  this.resolve('uri', uri);
  this._type = type;
  this._args = args !== undefined ? args : uri;
  if (sort) this._sort = sort;
  if (filter) this._filter = filter;
}

SP.inherit(Collection, Loadable);

Loadable.define(Collection, ['type', 'uri']);

/**
 * Makes a snapshot of the collection, optionally for a limited range. Making a
 * snapshot is the only way to examine the items in the collection, by freezing
 * it at a specific moment in time. The snapshot, once resolved, will never
 * change and can be kept around for as long as required. The start offset and
 * maximum length can, and should, be used to limit the size of the snapshot.
 * When making a snapshot of a playlist, only ask for the tracks that are
 * actually being displayed on screen at the moment, instead of asking for all
 * tracks in the playlist, which could be thousands of tracks. Even if the items
 * are not meant to be displayed it is a good idea to divide the colleciton into
 * chunks of reasonable size, to keep memory usage down and avoid blocking the
 * client. Ask for sequential snapshots of 500 items or so and ask for the next
 * snapshot while working on the first one.
 *
 * @function
 * @name Collection#snapshot
 * @since 1.0.0
 * @param {number=} opt_start The offset of the first item to fetch in the
 *     snapshot. This is a hint to the API, and items before the offset could
 *     end up being fetched. It is however not allowed to read any items that
 *     were not specifically specified.
 * @param {number=} opt_length The maximum length of the range to snapshot.
 *     This is also a hint, and more items could end up being fetched. Note
 *     that the caller must not ask for items outside of the specified range.
 * @param {boolean=} opt_raw An optional parameter specifying if the snapshot
 *     should avoid pre-fetching metadata for the items in the snapshot. For
 *     most use cases this parameter should be left out or set to false. Only
 *     pass true if the only intended use for the snapshot is to get the URIs
 *     of the items.
 * @return {Promise} A promise.
 *
 * @example
 * playlist.tracks.snapshot(0, 50).done(function(snapshot) {
 *   var len = Math.min(snapshot.length, 50);
 *   for (var i = 0; i < len; i++) {
 *     doSomethingWithTrack(snapshot.get(i));
 *   }
 * });
 */
Collection.prototype.snapshot = function(opt_start, opt_length, opt_raw) {
  return (new Snapshot(this.type, this._type, this._args, opt_start, opt_length, opt_raw)).load('length', 'range');
};

/**
 * Adds one or more items to a collection. The item is added to the end of the
 * collection. Note that it is better to call this method with multiple items
 * than to call it multiple times with a single item, since the tracks are added
 * asynchronously and could end up in the wrong order otherwise. This can happen
 * when the second item to add is already cached by the client, while the first
 * item must be fetched remotely. In this situation the second item would be
 * added before the first. This can either be resolved by always waiting for the
 * item to be added before moving on to the next item, but this is less efficient
 * than simply passing in all items to be added right away.
 *
 * @function
 * @name Collection#add
 * @since 1.0.0
 * @param {Array.<Object>|...Object} items The items to add to the collection.
 *     Can either be a single item, many items or an array of items.
 * @return {Promise} A promise.
 *
 * @example
 * playlist1.tracks.add(models.Track.fromURI('spotify:track:2P2S1wxZYQYHRYDip79JiY'));
 * playlist2.tracks.add(track1, track2, ..., trackN).done(addedManyTracks);
 */
Collection.prototype.add = function(items) {
  var args = SP.uris(arguments);
  args.unshift(this._args);
  return promisedRequest(this, this._type + '_append', args);
};

/**
 * Inserts one or more items into a collection. Note that it is better to call
 * this method with multiple items than to call it multiple times with a single
 * item, since the tracks are added asynchronously and could end up in the wrong
 * order otherwise. This can happen when the second item to insert is already
 * cached by the client, while the first item must be fetched remotely. In this
 * situation the second item would be inserted before the first. This can either
 * be resolved by always waiting for the item to be inserted before moving on to
 * the next item, but this is less efficient than simply passing in all items to
 * be inserted right away.
 *
 * @function
 * @name Collection#insert
 * @since 1.0.0
 * @param {Reference} ref A reference to where the items should be inserted
 *     into the collection.
 * @param {Array.<Object>|...Object} items The items to insert into the
 *     collection. Can either be a single item, many items or an array of
 *     items.
 * @return {Promise} A promise.
 *
 * @example
 * playlist.tracks.snapshot(function(snapshot) {
 *   var index = ...;
 *   playlist.tracks.insert(snapshot.ref(index), track1, track2, track3);
 * });
 */
Collection.prototype.insert = function(ref, items) {
  var args = [this._args, ref.index, ref.uri];
  var uris = SP.uris(arguments, 1);
  return promisedRequest(this, this._type + '_insert', args.concat(uris));
};

Collection.prototype.remove = function(ref) {
  return promisedRequest(this, this._type + '_remove', [this._args, ref.index, ref.uri]);
};

/**
 * Trims items from the end of the collection so that the last item in the
 * collection is the item referred to by the given reference. If the reference
 * is not in the collection, no items will be removed.
 *
 * @function
 * @name Collection#trim
 * @since 1.0.0
 * @param {Reference} ref The last item in the collection to keep.
 * @return {Promise} A promise.
 */
Collection.prototype.trim = function(ref) {
  return promisedRequest(this, this._type + '_trim', [this._args, ref.index, ref.uri]);
};

/**
 * Removes all items in the collection.
 *
 * @function
 * @name Collection#clear
 * @since 1.0.0
 * @return {Promise} A promise.
 */
Collection.prototype.clear = function() {
  return promisedRequest(this, this._type + '_clear', [this._args]);
};

/**
 * Returns a sorted version of the collection. The current collections sorting
 * will not be affected. Note that the sorting is completely specified by this
 * method and will not be inherited from the current collection. To turn off
 * sorting, call this method without arguments or with an empty array.
 *
 * @function
 * @name Collection#sorted
 * @since 1.0.0
 * @param {Array.<string>|...string} order An array of fields by which to sort
 *     by, in order. Can also be passed as multiple arguments to the method.
 *     Each element is a string that corresponds to a field name. The sorting
 *     order, ascending or descending, can be append to the name of the field
 *     as "field:a" or "field:d" respectively. If the sording order is not
 *     specified, ascending order is used.
 * @return {Collection} The sorted collection.
 * @example
 * // Sort the playlist by duration of the tracks, longest first, and by name if
 * // the tracks have the same duration. The sorted collection can further be
 * // filtered if needed.
 * var sorted = playlist.tracks.sorted('duration:d', 'name');
 */
Collection.prototype.sorted = function(order) {
  throw new Error('sorting is not implemented');
};

/**
 * Never construct a context object using the default constructor - use fromURI()
 * instead.
 *
 * @class
 * @classdesc An opaque context. The player will hold one of these contexts when
 * a track is playing, rather than holding a reference to the high level context
 * objects, such as Album or Playlist. This context can be compared to other
 * contexts to check for equality and it can also be passed to the play methods
 * of the player object.
 * @since 1.0.0
 *
 * @property {String} uri The URI of the context.
 * @see Context#fromURI
 * @see Player#playContext
 */
function Context(uri) {
  Loadable.call(this);
  this.resolve('uri', uri);
}

SP.inherit(Context, Loadable);

Loadable.define(Context, ['uri']);

Context.prototype.toString = function() {
  return this.uri;
};

/**
 * Returns an opaque context for a given Spotify URI.  The URI is the only
 * property that is available on the cotext. It is loaded immediately.
 *
 * @function
 * @name Context#fromURI
 * @since 1.0.0
 * @param {String} uri The Spotify URI of the context.
 * @return {Context} The opaque context for the URI.
 *
 * @example
 * models.Artist.fromURI('spotify:artist:5bWRCM3vFGqamlNxSzNj1O').load('name').done(function(artist) {
 *   console.log(artist.uri + ': ' + artist.name.decodeForText());
 *   document.getElementById('artist').innerHTML = artist.name.decodeForHtml();
 * });
 */
Context.fromURI = function(uri) {
  return new Context(uri);
};

/**
 * Never construct a context object using the default constructor - use create()
 * instead.
 *
 * @class
 * @classdesc A context group. The player takes a context group when calling the
 * playContextGroup method.
 * @since 1.0.0
 *
 * @see Context#create
 * @see Player#playContextGroup
 */
function Group(uri) {
  Loadable.call(this);
  this.resolve('uri', uri);
  this.resolve('contexts', new Collection(Context, 'context_group', uri));
}

SP.inherit(Group, Loadable);

Loadable.define(Group, ['contexts', 'uri']);

/**
 * Creates a named context group.
 *
 * @function
 * @name Group#create
 * @since 1.0.0
 * @param {String} id The identifier of the group.
 * @return {Promise} A promise that will resolve into a Group once it has
 * been created.
 */
Group.create = function(id) {
  var promise = new Promise();
  var done = function(result) {
    var group = new Group(result.uri);
    promise.setDone(group);
  };
  SP.request('context_group_create', [id], promise, done, promise.setFail);
  return promise;
};

/**
 * @class
 * @classdesc Use this class to control the playback of the Spotify client. There is
 * only one player instance in the application, which can be accessed by the models
 * module. To know when playback changes the application can observe the
 * "change" event. This event is fired each time the track changes or any of the
 * properties other than position. To update the user interface with the
 * position, use a timer and query the position as often as is necessary for the
 * purposes of the application.
 * @since 1.0.0
 *
 * @property {Collection} context The currently playing context, if any. This
 * item can be a playlist, album, search results etc. Depending on the
 * permissions of your application you may not be allowed to see this property
 * unless your application owns the context (such as a temporary playlist).
 * @property {number} index The index of the playing track in the currently
 * playing context.
 * @property {boolean} playing Is Spotify playing a track right now? If this
 * property is true, the track property will be set, and possibly the context.
 * @property {number} position The playback position of the current track. To
 * change the playback position, use the seek method instead of directly setting
 * the property.
 * @property {boolean} repeat Indicates if the currently playling context is set
 * to repeat.
 * @property {boolean} shuffle Indicates if the currently playing context is set
 * to shuffle.
 * @property {Track} track The currently playing track, if any. To start playing
 * a new track, use one of the methods playTrack and playContext. Directly
 * setting the property has no effect.
 *
 * @example
 * models.player.addEventListener('change', function() { ... });
 * models.player.playTrack(models.Track.fromURI('spotify:track:3P6p25MvU3qnvWa8L7i5Lr'));
 */
function Player(id) {
  BridgeLoadable.call(this);
  this.resolve('id', id);
}

SP.inherit(Player, BridgeLoadable);

/**
 * @name Player#change
 * @event
 * @desc Fired when a property of the player changes.
 * @param {object} event The event object.
 */
/**
 * @name Player#change:{property}
 * @event
 * @desc {property} is one of the player's properties listed above, with the
 * exception of the position property. Fired when that specific property changes.
 * @param {object} event The event object.
 */
Loadable.define(Player, [
  'context',
  'duration',
  'id',
  'index',
  'playing',
  'position',
  'repeat',
  'shuffle',
  'track',
  'volume'
], '_query');

Player.prototype._observed = function() {
  this.bridgeListen('player_event_wait', [this.id]);
};

Player.prototype.eventDone = function(event) {
  Player._superClass.eventDone.call(this, event);
  this._queryPosition();
};

Player.prototype._make_context = function(value) { return value && Context.fromURI(value.uri, value); };
Player.prototype._make_track = function(value) { return value && Track.fromURI(value.uri, value); };

Player.prototype._query = function(propsMask) {
  var load = function(data) { this.resolveMany(propsMask, data); this._queryPosition(); };
  var fail = function(error) { this.resolveFail(propsMask, error); };
  SP.request('player_query', [this.id], this, load, fail);
};

Player.prototype._queryPosition = function() {
  if (!this._pq && this.playing) {
    var time = 500; // ms
    var self = this;
    this._pq = setTimeout(function() { SP.request('player_query', [this.id], self, self._progress); }, time);
  }
};

Player.prototype._progress = function(data) {
  this._pq = null;
  // Resolve the position first since we don't want to fire events for it.
  this.resolve('position', data.position, true);
  delete data.position;
  // Resolve the rest of the properties.
  this.resolveMany(0, data);
  this._queryPosition();
};

/**
 * Sets the volume of the playback. This setting affects the entire Spotify
 * client. Setting the volume is not available on all platforms and may also not
 * be available to the current application, depending on the permissions
 * requested in the manifest.
 *
 * @function
 * @name Player#setVolume
 * @since 1.0.0
 * @param {float} volume Sets the audio output volume - 0.0 represent silent, 1.0 represents max volume.
 * @return {Promise} A promise object.
 */
Player.prototype.setVolume = function(volume) {
  return promisedRequest(this, 'player_set_volume', [this.id, volume]);
};

/**
 * Sets the repeat state of the player. This setting affects the entire Spotify
 * client. Repeat in this case means that the context will start playing from
 * the beginning after it has played the last track. If shuffling is also
 * enabled the context might start playing from a track other than the first
 * track when starting over.
 *
 * @function
 * @name Player#setRepeat
 * @since 1.0.0
 * @param {boolean} enabled Whether repeating should be enabled or not.
 * @return {Promise} A promise.
 */
Player.prototype.setRepeat = function(enabled) {
  return promisedRequest(this, 'player_set_repeat', [this.id, enabled]);
};

/**
 * Sets the shuffle state of the player. This setting affects the entire Spotify
 * client.
 *
 * @function
 * @name Player#setShuffle
 * @since 1.0.0
 * @param {boolean} enabled Whether shuffling should be enabled or not.
 * @return {Promise} A promise.
 */
Player.prototype.setShuffle = function(enabled) {
  return promisedRequest(this, 'player_set_shuffle', [this.id, enabled]);
};

/**
 * If the player is paused, starts playing the current track again.
 *
 * @function
 * @name Player#play
 * @since 1.0.0
 * @return {Promise} A promise.
 */
Player.prototype.play = function() {
  return promisedRequest(this, 'player_play', [this.id]);
};

/**
 * If the player is playing a track, pauses playback.
 *
 * @function
 * @name Player#pause
 * @since 1.0.0
 * @return {Promise} A promise.
 */
Player.prototype.pause = function() {
  return promisedRequest(this, 'player_pause', [this.id]);
};

/**
 * Starts playing the given track. The track does not have to be loaded before
 * passing it to this method, it will take care of waiting for the track to load
 * before starting playback. No context will be set when using this method to
 * start playback.
 *
 * @function
 * @name Player#playTrack
 * @since 1.0.0
 * @param {Track} track The track to play.
 * @param {number} ms The time to seek to before starting to play the track, in
 * milliseconds.
 * @param {number} duration The playback duration for the track, in milliseconds.
 * @return {Promise} A promise.
 *
 * @example
 * models.player.playTrack(models.Track.fromURI('spotify:track:7MzmBmyI9KkyQJaPNLdtUi'));
 */
Player.prototype.playTrack = function(track, ms, duration) {
  return promisedRequest(this, 'player_play_track', [this.id, track.uri, ms || 0, duration != undefined ? duration : -1]);
};

/**
 * Starts playing the given context. The context does not have to be loaded
 * before passing it to this method, it will take care of waiting for the
 * contexts to load before starting playback.
 *
 * @function
 * @name Player#playContext
 * @since 1.0.0
 * @param {Album|Collection|Context|Playlist|Search} context The context to
 * play.
 * @param {number} index The first item in the context to play. This must be a
 * positive number. If left out, the first playable item in the context will
 *     start playing.
 * @param {number} ms The time to seek to before starting to play the track, in
 *     milliseconds.
 * @param {number} duration The playback duration for the tracks in the context,
 *     in milliseconds.
 * @return {Promise} A promise.
 *
 * @example
 * models.player.playContext(models.Album.fromURI('spotify:album:11SNDUZQ5iVPKJtl7x0677'));
 */
Player.prototype.playContext = function(context, index, ms, duration) {
  if (index == null) index = -1;
  return promisedRequest(this, 'player_play_context', [this.id, context.uri, index, ms || 0, duration != undefined ? duration : -1]);
};

/**
 * Starts playing the given groups of contexts. The contexts does not have to be
 * loaded before passing it to this method, it will take care of waiting for the
 * contexts to load before starting playback.
 *
 * @function
 * @name Player#playContextGroup
 * @since 1.0.0
 * @param {Group} group The context group to play.
 * @param {number} context_index The index of the congext to play.
 * @param {number} index The first item in the context to play. This must be a
 * positive number. If left out, the first item in the context will start
 * playing.
 * @param {number} ms The time to seek to before starting to play the track, in
 * milliseconds.
 * @return {Promise} A promise.
 */
Player.prototype.playContextGroup = function(group, context_index, index, ms) {
  if (context_index == undefined) context_index = -1;
  if (index == undefined) index = -1;
  return promisedRequest(this, 'player_play_context_group', [this.id, group.uri, context_index, index, ms || 0]);
};

/**
 * When playing in a context, skips to the previous track.
 *
 * @function
 * @name Player#skipToPrevTrack
 * @since 1.0.0
 * @return {Promise} A promise.
 */
Player.prototype.skipToPrevTrack = function() {
  return promisedRequest(this, 'player_skip_to_prev', [this.id]);
};

/**
 * When playing in a context, skips to the next track.
 *
 * @function
 * @name Player#skipToNextTrack
 * @since 1.0.0
 * @return {Promise} A promise.
 */
Player.prototype.skipToNextTrack = function() {
  return promisedRequest(this, 'player_skip_to_next', [this.id]);
};

/**
 * Sets the playback position to the specified time. Seeking in the track can
 * take anywhere from zero to a few seconds, depending on caching and network
 * performance.
 *
 * @function
 * @name Player#seek
 * @since 1.0.0
 * @param {number} ms The time to seek to, in milliseconds.
 * @return {Promise} A promise.
 */
Player.prototype.seek = function(ms) {
  return promisedRequest(this, 'player_seek', [this.id, ms]);
};

/**
 * Never construct a playlist object using the default constructor - use fromURI()
 * instead.
 *
 * @class
 * @classdesc The playlist object represents a playlist owned by a certain
 * Spotify user.
 * @since 1.0.0
 *
 * @property {object} allows A dictionary of the allowed operations on the
 * playlist.
 * @property {boolean} collaborative Indicates if this is a collaborative
 * playlist.
 * @property {String} description A description for the playlist. This is a
 * human readable string that can be presented to the user. Make sure to call
 * the proper string decoding method before using the string in the DOM.
 * @property {String} name The name of the playlist. This is a human readable
 * string that can be presented to the user. Make sure to call the proper string
 * decoding method before using the string in the DOM.
 * @property {String} image The image URI for the playlist.
 *     The format of the image URI is platform dependent, but will always be
 *     something that can be used as the source of an img element or a
 *     background-image in CSS. The size of the image is not defined and might
 *     differ between platforms, so it is recommended that applications use the
 *     imageForSize method to get an appropriately sized image. In general, it's
 *     best to use the Image view from the views framework to display images - it
 *     will load the image in the background (while displaying a placeholder) and
 *     make sure to pick the correct size "intelligently", based on the current
 *     screen resolution and available bandwidth.
 * @property {User} owner The owner of a playlist. Depending on the privacy
 * settings of the Spotify client, this may or may not be empty.
 * @property {boolean} published Indicates if the playlist belongs to the currently
 * logged in user's list of public playlists.
 * @property {boolean} subscribed Indicates if the the currently logged in user is
 * subscribed to this playlist.
 * @property {Collection} subscribers A collection of users that are currently
 * subscribed to this playlist.
 * @property {Collection} tracks The tracks in this playlist.
 * @property {String} uri The URI of the playlist.
 *
 * @see MdL#imageForSize
 * @see String#decodeForText
 * @see String#decodeForHtml
 * @see String#decodeForLink
 * @see Playlist#fromURI
 */
function Playlist(uri) {

  MdL.call(this);
  this.resolve('uri', uri);

}

SP.inherit(Playlist, MdL);

/**
 * @name Playlist#insert
 * @event
 * @desc Fired when a track is inserted into the playlist.
 * @param {object} event The event object. It has an array of the
 *     track uris that have been inserted called 'uris' and a
 *     property called 'index' telling the position where the tracks
 *     were inserted.
 */
/**
 * @name Playlist#remove
 * @event
 * @desc Fired when a track is removed into the playlist.
 * @param {object} event The event object. It has two arrays, one
 *     containing the uris of the tracks that have been removed called
 *     'uris', and another one containing the positions those tracks
 *     had in the playlist called 'indices'.
 */
/**
 * @name Playlist#change
 * @event
 * @desc Fired when a property of the playlist changed.
 * @param {object} event The event object.
 */
/**
 * @name Playlist#change:{property}
 * @event
 * @desc {property} is one of the playlist's properties listed above. Fired when that specific property changes.
 * @param {object} event The event object.
 */
Loadable.define(Playlist, ['uri']);

Loadable.define(Playlist, [
  'allows',
  'collaborative',
  'description',
  'subscribed',
  'name',
  'owner',
  'published'
], '_metadata');

Loadable.define(Playlist, [
  'image',
  'images' // Loaded when 'image' is loaded.
], '_profile');

Loadable.define(Playlist, [
  'subscribers',
  'tracks'
], '_collections');

Loadable.define(Playlist, [
  'popularity'
], '_popularity');

MdL.init(Playlist, 'playlist');

Playlist.prototype._make_owner = function(value) { return value && User.fromURI(value.uri, value); };
Playlist.prototype._collections = function() {
  this.resolve('subscribers', new Collection(User, 'playlist_subscribers', this.uri));
  this.resolve('tracks', new Collection(Track, 'playlist_tracks', this.uri));
  this.resolveDone();
};

Playlist.prototype._popularity = function(props_mask) {
  var load = function(data) { this.resolveMany(props_mask, data); };
  var fail = function(oops) { this.resolveFail(props_mask, oops); };
  SP.request('playlist_popularity', [this.uri], this, load, fail);
};

/**
 * A bridge listener for library events. This is only a proxy so to actually
 * handle the events, another bridge listener needs to receive the events using
 * the proxyTo method.
 *
 * @type {ProxyListener}
 * @private
 */
Playlist._libraryListener = null;

/**
 * Returns the playlist for a given Spotify URI.  The URI is the only property that
 * is loaded on the playlist immediately.
 *
 * @function
 * @name Playlist#fromURI
 * @since 1.0.0
 * @param {String} uri the Spotify URI of the playlist.
 * @return {Playlist} A playlist.
 *
 * @example
 * models.Playlist.fromURI('spotify:playlist:...').load('name').done(function(playlist) {
 *   console.log(playlist.uri + ': ' + playlist.name.decodeForText());
 *   document.getElementById('playlist').innerHTML = playlist.name.decodeForHtml();
 * });
 */
Playlist.fromURI = Cache.lookup;
Playlist.fromURIs = Cache.lookupMany;
Playlist._cache = new Cache(Playlist);

/**
 * Creates a <i>temporary</i> playlist that can be used as the context to play
 * tracks in. This is useful to know when it is your app that is responsible
 * for the currently playing track, or if the user decided to start playing
 * music from some other part of Spotify. Please note that your app is never
 * allowed to override the currently playing track, unless in direct response
 * to an action initated by the user, e.g., clicking a track.
 *
 * @function
 * @name Playlist#createTemporary
 * @since 1.0.0
 * @param {string} name The name of the temporary playlist. This can be used as
 *     an identifier by your app for whatever purpose. It is never displayed to
 *     the user in the regular Spotify interface.
 * @return {Promise} A promise that will resolve into a Playlist once it has
 *     been created.
 */
Playlist.createTemporary = function(name) {
  var promise = new Promise();
  var done = function(result) {
    var playlist = new Playlist(result.uri);
    Playlist._cache.cache(result.uri, playlist);
    playlist.resolve('name', name);
    promise.setDone(playlist);
  };
  SP.request('playlist_create_temporary', [name], promise, done, promise.setFail);
  return promise;
};

/**
 * If your application creates a lot of temporary playlists it should remove
 * the ones not in use, to reduce the resource load. If this method is never
 * called, the temporary playlists created by the application are removed when
 * the user logs out.
 *
 * @function
 * @name Playlist#removeTemporary
 * @since 1.0.0
 * @param {Playlist} playlist The temporary playlist to delete. Passing in a
 * non temporary playlist does nothing.
 * @return {Promise} A promise.
 */
Playlist.removeTemporary = function(playlist) {
  var promise = new Promise();
  var done = function(result) {
    Playlist._cache.remove(playlist.uri);
    promise.setDone();
  };
  SP.request('playlist_remove_temporary', [playlist.name], promise, done, promise.setFail);
  return promise;
};

/**
 * Creates a named playlist and adds it to the user's library.
 *
 * @function
 * @name Playlist#create
 * @since 1.0.0
 * @param {String} name the name of the playlist. This is how the playlist will
 * be presented to the user.
 * @return {Promise} A promise that will resolve into a Playlist once it has
 * been created.
 */
Playlist.create = function(name) {
  var promise = new Promise();
  var done = function(result) {
    var playlist = new Playlist(result.uri);
    Playlist._cache.cache(result.uri, playlist);
    playlist.resolve('name', name);
    promise.setDone(playlist);
  };
  SP.request('playlist_create', [name], promise, done, promise.setFail);
  return promise;
};

/**
 * Sets up (if needed) and returns a proxy listener for library events.
 * @return {ProxyListener} A proxy listener for library events.
 */
Playlist.getOrCreateLibraryListener = function() {
  var listener = Playlist._libraryListener;

  if (!listener) {
    listener = new ProxyListener();
    listener.bridgeListen('library_event_wait', [exports.session.user.uri]);

    // Apply a filter to library events which will update cached Playlist
    // instances.
    listener.filter(function(evt) {
      if (evt.type != 'insert' && evt.type != 'remove') return;
      var newState = (evt.type == 'insert');
      switch (evt.receiver) {
        case 'playlists':
          Playlist._cache.update(evt.uris, {subscribed: newState});
          break;
        case 'published':
          Playlist._cache.update(evt.uris, {published: newState});
          break;
      }
    });

    Playlist._libraryListener = listener;
  }

  return listener;
};

/**
 * @override
 */
Playlist.prototype.load = function() {
  var args = SP.varargs(arguments);
  if (Array.prototype.indexOf.call(args, 'subscribed') >= 0) {
    // Start listening for library events if we ever load the subscribed
    // property.
    Playlist.getOrCreateLibraryListener();
  }
  return Playlist._superClass.load.apply(this, args);
};

/**
 * Called when the first event listener is added to the playlist object. Make a
 * request for the next event for this playlist. If a request has already been
 * made for this playlist, another request will be made but it will fail because
 * only one event request at a time is allowed. This is ok since it happens
 * fairly rarely and will not cause any incorrect behavior.
 * @private
 */
Playlist.prototype._observed = function() {
  this.bridgeListen('playlist_event_wait', [this.uri]);
};

/**
 * Override to stop listening on bridge events if there are no JS listeners
 * attached to this playlist.
 * @override
 */
Playlist.prototype.eventFail = function(error) {
  if (!this._obcount)
    this.bridgeUnlisten();
  Playlist._superClass.eventFail.call(this, error);
};

Playlist.prototype.setDescription = function(description) {
  return promisedRequest(this, 'playlist_set_description', [this.uri, description], true);
};

Playlist.prototype.setImage = function(image_url) {
  return promisedRequest(this, 'playlist_set_image', [this.uri, image_url], true);
};

Playlist.prototype.setName = function(name) {
  return promisedRequest(this, 'playlist_set_name', [this.uri, name], true);
};

Playlist.prototype.setSource = function(source, link) {
  return promisedRequest(this, 'playlist_set_source', [this.uri, source, link]);
};

Playlist.prototype.enforceRules = function(rules) {
  return promisedRequest(this, 'playlist_enforce_rules', [this.uri, rules]);
};

/**
 * @class
 * @classdesc A reference to an item in a snapshot. To remove items from a collection,
 * first find the item in the snapshot to get a reference to it, and then
 * call the remove method on the collection, passing it the reference. If the
 * collection has changed since creating the reference, the call will fail, and
 * the caller must make a new snapshot and reference, and try the operation
 * again. Do not directly create instances of this class. Instead use the find
 * operation on the snapshot.
 * @since 1.0.0
 *
 * @see Collection#remove
 * @see Snapshot#find
 * @see Snapshot#ref
 * @example
 * myTracks.snapshot().done(function(snapshot) {
 *   myTracks.remove(snapshot.find(track));
 * });
 */
function Reference(index, uri) {
  this.index = index;
  this.uri = uri;
}

/**
 * @class
 * @classdesc The session object exposes information about the current session
 *
 * @since 1.0.0
 *
 * @property {boolean} connecting Set to true if the client is not online and is
 * in the process of trying to connect to the Spotify servers.
 * @property {String} connection The current network connection type. One of
 * "none", "gprs", "edge", "3g", "wlan", "ethernet" and "unknown". More types
 * will be added in the future as more connectivity options become available.
 * This property may not be available on all platforms, and will always be set
 * to "unknown".
 * @property {String} country The country that the currently logged in user is
 * registered in, as a two-letter ISO 3166-1 country code.
 * @property {boolean} developer Set to true if the currently logged in user's
 * Spotify account has the "app-developer" attribute.
 * @property {String} device The device that the application is running on. One
 * of "unknown", "mobile", "tablet" and "desktop". More device types could be
 * added in the future.
 * @property {boolean} incognito Set if the currently logged in user has
 * instructed the client to not broadcast any activity publically.
 * @property {String} language The language that the Spotify client is currently
 * using, as a two-letter ISO 639-1 language code.
 * @property {boolean} online Indicates if the client has a connection to the
 * Spotify servers or not. This can be false either be because the connection
 * was lost, or because the client was manually put in offline mode.
 * @property {String} partner Set if the currently logged in user's account is
 * currently being paid for through partner. If set, it holds the partner's
 * identifier.
 * @property {String} product The currently logged in user's account product,
 * e.g., "premium"/"daypass"/"free".
 * @property {Number} resolution The resolution of the main screen of the device
 * that the application is running on. The resolution is defined in CSS pixel
 * units, meaning that a resolution of 2 would equal two device pixels per one
 * CSS pixel. This is corresponds to running the applicatin on a device with a
 * High-DPI display, such as an iPhone 4 or iPad 3. On regular resolution
 * @property {String} streaming Set to disabled, if the user cannot stream music,
 * enabled if the user can stream, or dmca-radio if streaming is restricted
 * to DMCA radio.
 * @property {Number} testGroup The AB test group that the user belongs to. Can
 * be used to provide different functionality to different set of users to test
 * new features and compare the behaviors and outcomes of each group.
 * displays, the resolution is 1.
 * @property {User} user A User instance representing the currently logged in user.
 */
function Session() {

  BridgeLoadable.call(this);
  this.resolve('user', User.fromURI('spotify:user:@'));

}

SP.inherit(Session, BridgeLoadable);

/**
 * @name Session#change
 * @event
 * @desc Fired when a property of the session changed.
 * @param {object} event The event object.
 */
/**
 * @name Session#change:{property}
 * @event
 * @desc Where {property} is one of the session's properties listed above. Fired when that specific property changes.
 * @param {object} event The event object.
 */
Loadable.define(Session, ['user']);

Loadable.define(Session, [
  'connecting',
  'connection',
  'country',
  'developer',
  'device',
  'incognito',
  'language',
  'online',
  'partner',
  'product',
  'resolution',
  'streaming',
  'testGroup',
  'capabilities'
], '_query');

Session.prototype._observed = function() {
  this.bridgeListen('session_event_wait', []);
};

Session.prototype._query = function(props_mask) {
  var load = function(data) { this.resolveMany(props_mask, data); };
  var fail = function(oops) { this.resolveFail(props_mask, oops); };
  SP.request('session_query', [], this, load, fail);
};

/**
 * @class
 * @classdesc A snapshot is a collection frozen in time. Collections can change
 * their contents at any time, so to examine the items in the colleciton, take a
 * snapshot of the the entire collection, or just the part of it that is
 * interesting. Partial snapshots are preferred when possible, since they will
 * fetch less data, saving memory and bandwidth. When the collection changes,
 * the snapshot will remain the same, but it is a good time to take a new
 * snapshot of the collection (if your app needs to use up-to-date data).
 *
 * To make a snapshot, call the snapshot method on the collection. You do not
 * ever need to directly instantiate a snapshot object.
 * @since 1.0.0
 *
 * @param {number} length The total length of the collection at the time the
 *     snapshot was taken. This number can be greater than the range (offset +
 *     length) that the snapshot was created using.
 * @param {Object} range The valid range for the snapshot, used at creation
 *     time. The value of the property has two fields: "range" and "length".
 *
 * @see Collection#snapshot
 * @example
 * myAlbum.tracks.snapshot().done(function(snapshot) { ... });
 * myArtist.albums.snapshot.done(artistLoaded).fail(artistNotLoaded);
 * myPlaylist.tracks.snapshot(0, 100).done(function(snapshot) { ... });
 */
function Snapshot(item_class, type, uri, start, length, opt_raw) {

  Loadable.call(this);

  this._class = item_class;
  this._req = type + '_snapshot';
  this._uri = uri;
  this._off = (start === undefined ? 0 : start);
  this._len = (length === undefined ? -1 : length);
  this._raw = (opt_raw || false);

}

SP.inherit(Snapshot, Loadable);

Loadable.define(Snapshot, [
  'length',
  'range'
], '_request');

Snapshot.prototype._request = function(props_mask) {
  SP.request(this._req, [this._uri, this._off, this._len, this._raw], this, this._success, this._failure);
};

Snapshot.prototype._success = function(result) {
  this._uris = result.array;
  this._meta = result.metadata || [];
  this.resolve('length', result.length);
  this.resolve('range', { offset: this._off, length: this._uris.length });
  this.resolveDone();
};

Snapshot.prototype._failure = function(error) {
  var props_mask = this._neededForLoad(['length', 'range']);
  this.resolveFail(props_mask, error);
};

/**
 * Returns a singe item from the snapshot. If the index is outside the range of
 * the snapshot, null is returned. Since the snapshot is static, the returned
 * item will never be different when calling this method with the same index.
 *
 * @function
 * @name Snapshot#get
 * @since 1.0.0
 *
 * @param {Reference|number} index The index of the item to get. Can be a
 *     reference returned by the find method.
 * @return {Item} The item in the collection.
 *
 * @example
 * myTracks.snapshot(0, 20).done(function(snapshot) {
 *   var track1 = snapshot.get(18); // Returns a Track
 *   var track2 = snapshot.get(23); // Returns null
 * });
 */
Snapshot.prototype.get = function(index) {
  if (index instanceof Reference) index = index.index;
  index -= this._off;
  if (index < 0 || index > this._uris.length) return null;
  return this._class.fromURI(this._uris[index], this._meta[index]);
};

/**
 * Searches for a given item in the snapshot part of the collection, and returns
 * a reference to the item if found or null if it was not found in the snapshot.
 * If null is returned it just means that item was not found in the snapshot. It
 * could still be somewhere in the collection. The reference is bound to the
 * snapshot's view of the collection, and can be used to remove items from the
 * collection or add new items in a particular location.
 *
 * @function
 * @name Snapshot#find
 * @since 1.0.0
 *
 * @param {!Item} item A collection item, such as Track or Artist.
 * @param {Reference|number} first The first item to consider when searching.
 *     This parameter is optional. If left out, the search will start from
 *     first item in the snapshot.
 * @return {Reference} A reference object.
 *
 * @example
 * myTracks.snapshot().done(function(snapshot) {
 *   myTracks.remove(snapshot.find(track));
 * });
 */
Snapshot.prototype.find = function(item, first) {
  if (first instanceof Reference) first = first.index;
  var index = this._uris.indexOf(item.uri, first || 0);
  return (index == -1 ? null : new Reference(index + this._off, this._uris[index]));
};

/**
 * This is a utility function to get instances of all the items in this
 * snapshot and then calling load on all the individual items and finally
 * joining all the resulting promises.
 *
 * @function
 * @name Snapshot#loadAll
 * @since 1.0.0
 *
 * @param {Array.<string>|...string} properties An array of property names. The
 *     property names that are available for loading can be found in the
 *     documentation for each specific sub-class. Note that instead of passing
 *     in an array, multiple arguments can be passed instead.
 * @return {Promise} A promise to wait for before the properties can be read.
 *
 * @example
 * var playlist = Playlist.fromURI(...);
 * playlist.load('tracks').done(function() {
 *   playlist.tracks.snapshot().done(function(snapshot) {
 *     snapshot.loadAll('name').each(function(track) {
 *       console.log(track.name);
 *     });
 *   });
 * });
 *
 * @see Loadable#load
 */
Snapshot.prototype.loadAll = function() {
  var promises = [],
      items = this.toArray();
  for (var i = 0, len = items.length; i < len; i++) {
    var item = items[i];
    promises.push(item.load.apply(item, arguments));
  }
  return Promise.join(promises);
};

/**
 * Makes a reference to an indexed item in the snapshot. The reference can be
 * used to insert to or remove items from the collection that the snapshot came
 * from. Note that the index must be part of the snapshot subset or one past the
 * the length of the collection, so that tracks can be inserted at the very end.
 *
 * @function
 * @name Snapshot#ref
 * @since 1.0.0
 *
 * @param {number} index The item index in the snapshot.
 * @return {Reference} A reference object.
 *
 * @example
 * myTracks.snapshot().done(function(snapshot) {
 *   myTracks.remove(snapshot.ref(0));
 * });
 */
Snapshot.prototype.ref = function(index) {
  var item = this.get(index);
  return new Reference(index, item ? item.uri : null);
};

/**
 * Creates an array with all of the items in the snapshot. Does not include the
 * empty slots in the snapshot, if any. Be sure that you actually have a need to
 * call this method before using it, since it will create instances of every item
 * in the snapshot, which are usually created lazily.
 *
 * @function
 * @name Snapshot#toArray
 * @since 1.0.0
 *
 * @return {Array.<Object>} An array.
 *
 * @example
 * myTracks.snapshot().done(function(snapshot) {
 *   var tracks = snapshot.toArray();
 *   tracks.forEach(doSomethingWithTrack);
 * });
 */
Snapshot.prototype.toArray = function() {
  var array = [];
  for (var i = 0, l = this._uris.length; i < l; i++)
    array[i] = this._class.fromURI(this._uris[i], this._meta[i]);
  return array;
};

/**
 * Creates an array with all URIs of the items in the snapshot. Does not include
 * the empty slots in the snapshot, if any. In general, applications should not
 * need to work with URIs directly, but for applications that have their own
 * database of Spotify URIs mapped to their own data it might be useful. If the
 * application does not actually need the metadata of the items in the snapshot
 * it is better to call this method than toArray, to avoid creating a large
 * number of objects that are not needed.
 *
 * @function
 * @name Snapshot#toURIs
 * @since 1.2.0
 * @return {Array.<string>} An array of URIs.
 */
Snapshot.prototype.toURIs = function() {
  return this._uris.slice();
};

/**
 * Never construct a track object using the default constructor - use fromURI()
 * instead.
 *
 * @class
 * @classdesc The track represents a track on an album in the Spotify catalogue.
 * @since 1.0.0
 *
 * @property {Album} album The album of the track.
 * @property {array} artists The artists of the track.
 * @property {String} availability Describes how and when the track is available
 * for playback for the currently logged in user. The value will be one of:
 * "available", "banned", "regional", "premium" or "unavailable". "available"
 * means that the track can be played, "banned" that the artist has chosen to
 * not make the track available, "regional" that the track is playable in other
 * regions but not in the region of the currently logged in user, "premium" means
 * that this is premium only content and a premium account is needed in order to play
 * the track (the playable property needs to be checked to actually see if the user
 * can play it or not), and "unavailable" which means the track is unavailable for
 * other reasons.
 * @property {number} disc For multi-disc albums, indicates which disc the track
 * is on. The first disc is disc 1.
 * @property {number} duration The duration of the track, in milliseconds.
 * @property {boolean} explicit True if the track should be displayed with a
 * label indicating that it contains explicit lyrics. May not be set in all
 * regions.
 * @property {String} image The image URI for the track.
 *     The format of the image URI is platform dependent, but will always be
 *     something that can be used as the source of an img element or a
 *     background-image in CSS. The size of the image is not defined and might
 *     differ between platforms, so it is recommended that applications use the
 *     imageForSize method to get an appropriately sized image. In general, it's
 *     best to use the Image view from the views framework to display images - it
 *     will load the image in the background (while displaying a placeholder) and
 *     make sure to pick the correct size "intelligently", based on the current
 *     screen resolution and available bandwidth.
 * @property {String} name The name of the playlist. This is a human readable
 * string that can be presented to the user. Make sure to call the proper string
 * decoding method before using the string in the DOM.
 * @property {number} number The number of the track on the album/disc it belongs
 * to. The first track is track 1, the second track is track 2 and so on. The
 * track number count is reset for each new disc on the album, and hence the first
 * track on disc two on a two disc album is also known as track number 1 (and so
 * on, for every new disc on the album).
 * @property {boolean} playable Indicates if the track is playable by the
 * currently logged in user. If the resource used to construct the track isn't
 * readily available for playback, Spotify will automatically try to find another
 * (equivalent) playable copy of the track. This implies that if this property is
 * set to false, neither this copy or any other copy of this track (in the Spotify
 * catalogue) is playable for the currently logged in user. A track can be
 * unplayable for various reasons, such as regional restrictions or play count
 * restrictions in the free service.
 * @property {number} popularity The popularity rating of the track. This is a
 * value between 0 and 100, inclusive, with 0 meaning a very impopular track and
 * 100 a highly popular track.
 * @property {boolean} starred Indicates if the user has starred the track.
 * @property {String} uri The URI of the playlist.
 *
 * @see MdL#imageForSize
 * @see String#decodeForText
 * @see String#decodeForHtml
 * @see String#decodeForLink
 * @see Track#fromURI
 */
function Track(uri) {
  MdL.call(this);
  this.resolve('uri', uri);
}

SP.inherit(Track, MdL);

Loadable.define(Track, ['uri']);
Loadable.define(Track, [
  'advertisement',
  'album',
  'artists',
  'availability',
  'disc',
  'duration',
  'explicit',
  'image',
  'images', // Loaded when 'image' is loaded.
  'local',
  'name',
  'number',
  'placeholder',
  'playable',
  'popularity',
  'starred'
], '_metadata');

MdL.init(Track, 'track');

Track.prototype._make_album = function(value) { return value && Album.fromURI(value.uri, value); };
Track.prototype._make_artists = function(value) { return value && value.map(_artists); };

/**
 * Returns the track for a given Spotify URI.  The URI is the only property that
 * is loaded on the track immediately.
 *
 * @function
 * @name Track#fromURI
 * @since 1.0.0
 * @param {String} uri The Spotify URI of the track.
 * @return {Track} A track.
 *
 * @example
 * models.Track.fromURI('spotify:track:2M5nPOo9UmoQVOWrN8lfN1').load('name').done(function(track) {
 *   console.log(track.uri + ': ' + track.name.decodeForText());
 *   document.getElementById('track').innerHTML = track.name.decodeForHtml();
 * });
 */
Track.fromURI = Cache.lookup;
Track.fromURIs = Cache.lookupMany;
Track._cache = new Cache(Track);

/**
 * Stars the current track for the currently logged-in user.
 *
 * @function
 * @name Track#star
 * @since 1.0.0
 * @return {Promise} A promise.
 *
 * @deprecated Use Library#star instead.
 *
 * @example
 * models.Track.fromURI('spotify:track:2M5nPOo9UmoQVOWrN8lfN1').star();
 */
Track.prototype.star = function() {
  return promisedRequest(this, 'library_star', [exports.session.user.uri, this.uri]);
};

/**
 * Unstars the current track for the currently logged-in user.
 *
 * @function
 * @name Track#unstar
 * @since 1.0.0
 * @return {Promise} A promise.
 *
 * @deprecated Use Library#unstar instead.
 *
 * @example
 * models.Track.fromURI('spotify:track:2M5nPOo9UmoQVOWrN8lfN1').unstar();
 */
Track.prototype.unstar = function() {
  return promisedRequest(this, 'library_unstar', [exports.session.user.uri, this.uri]);
};

/**
 * Waits for any track change event.
 *
 * @function
 * @name Track#_trackEventWait
 * @since 1.16.1
 * @private
 */
Track._trackEventWait = function() {
  SP.request('track_event_wait_any', [], this, this._trackEventDone, this._trackEventFail);
};

Track._trackEventDone = function(event) {
  var track = Track.fromURI(event.data.uri);
  track.resolveMany(event.data);
  track.dispatchEvent(event);
  this._trackEventWait();
};

Track._trackEventFail = function(error) {
  if (error.error == 'timeout')
    this._trackEventWait();
};

/**
 * @class
 * @classdesc The user objects represents a unique Spotify user.
 * @since 1.0.0
 *
 * @property {Boolean} currentUser A boolean field that indicates whether or not
 * the user represented by the object is the current session's user.
 * @property {String} identifier An identifier for the user that is unique to
 * the application. This can be used to identify the currently logged in user
 * and will not change, but it will be different for each application, so it
 * cannot be used to track the user between different applications. This
 * property is only set on the currently logged in user.
 * @property {String} image The image URI for the user's portrait image. This
 *     property may or may not be available, depending on the application's
 *     permissions. The format of the image URI is platform dependent, but will
 *     always be something that can be used as the source of an img element or a
 *     background-image in CSS. The size of the image is not defined and might
 *     differ between platforms, so it is recommended that applications use the
 *     imageForSize method to get an appropriately sized image. In general, it's
 *     best to use the Image view from the views framework to display images - it
 *     will load the image in the background (while displaying a placeholder) and
 *     make sure to pick the correct size "intelligently", based on the current
 *     screen resolution and available bandwidth.
 * @property {String} name The name of the user. This is a human readable
 * string that can be presented to the user. Make sure to call the proper string
 * decoding method before using the string in the DOM.
 * @property {String} uri The URI of the user.
 * @property {String} username The canonical username of the user. This
 * name should not be presented to the user. Call decodeForText to get a pure
 * string without escape characters.
 * @property {Artist} artist The artist that the user is associated to, if
 * any exists.
 *
 * @see MdL#imageForSize
 * @see String#decodeForText
 * @see String#decodeForHtml
 * @see String#decodeForLink
 */
function User(uri) {

  MdL.call(this);
  this.resolve('uri', uri);

}

SP.inherit(User, MdL);

Loadable.define(User, ['uri']);
Loadable.define(User, [
  'currentUser',
  'identifier',
  'image',
  'images', // Loaded when 'image' is loaded.
  'name',
  'subscribed',
  'username'
], '_metadata');

Loadable.define(User, [
  'artist'
], '_associated_artist');

MdL.init(User, 'user');

User.prototype._associated_artist = function(props_mask) {
  var load = function(data) { this.resolveMany(props_mask, data); };
  var fail = function(oops) { this.resolveFail(props_mask, oops); };
  SP.request('user_associated_artist', [this.uri], this, load, fail);
};

User.prototype._make_artist = function(value) { return value && Artist.fromURI(value); };

/**
 * A bridge listener for relations events. This is only a proxy so to actually
 * handle the events, another bridge listener needs to receive the events using
 * the proxyTo method.
 *
 * @type {ProxyListener}
 * @private
 */
User._relationsListener = null;

/**
 * Returns the user for a given Spotify URI. The URI is the only property that
 * is loaded on the user immediately.
 *
 * @function
 * @name User#fromURI
 * @since 1.0.0
 * @param {string} uri The Spotify URI of the user.
 * @return {User} A user.
 *
 * @example
 * var user = models.User.fromURI('spotify:user:...');
 * user.load('username', 'name').done(function(user) {
 *   console.log(user.username + ': ' + user.name.decodeForText());
 *   document.getElementById('user').innerHTML = user.name.decodeForHtml();
 * });
 */
User.fromURI = Cache.lookup;
User.fromURIs = Cache.lookupMany;
User._cache = new Cache(User);

/**
 * Returns the user for a given Spotify username. The URI is the only property
 * that is loaded on the user immediately.
 *
 * @function
 * @name User#fromUsername
 * @since 1.1
 * @param {string} username The canonical username of the user.
 * @return {User} A user.
 *
 * @example
 * var user = models.User.fromUsername('**freer!de**');
 * user.load('username', 'name').done(function(user) {
 *   console.log(user.username + ': ' + user.name.decodeForText());
 *   document.getElementById('user').innerHTML = user.name.decodeForHtml();
 * });
 */
User.fromUsername = function(username) {
  // fromURI only accepts characters escaped with lower case hexadecimal.
  var escaped = encodeURIComponent(username), i = -1;
  while ((i = escaped.indexOf('%', i + 1)) > -1) {
    escaped = escaped.substring(0, i + 1) + escaped.substring(i + 1, i + 3).toLowerCase() + escaped.substring(i + 3);
  }
  return User.fromURI('spotify:user:' + escaped);
};

/**
 * Sets up (if needed) and returns a proxy listener for relation events.
 * @return {ProxyListener} A proxy listener for relation events.
 */
User.getOrCreateRelationsListener = function() {
  var listener = User._relationsListener;

  if (!listener) {
    listener = new ProxyListener();
    listener.bridgeListen('relations_event_wait', [exports.session.user.uri]);

    // Apply a filter to relations events which will update cached User
    // instances.
    listener.filter(function(evt) {
      if (evt.receiver != 'subscriptions' || (evt.type != 'add' && evt.type != 'remove')) return;
      User._cache.update(evt.uris, {subscribed: evt.type == 'add'});
    });

    User._relationsListener = listener;
  }

  return listener;
};

/**
 * @override
 */
User.prototype.load = function() {
  var args = SP.varargs(arguments);
  if (Array.prototype.indexOf.call(args, 'subscribed') >= 0) {
    // Start listening for relation events if we ever load the subscribed
    // property.
    User.getOrCreateRelationsListener();
  }
  return User._superClass.load.apply(this, args);
};

/**
 * Generic function for getting an instance that best represents the passed in
 * URI.
 *
 * Only use this function if you don't know what the URI type is, or if the URI
 * can be one of several different types.
 *
 * This function will only return instances of Album, Artist, Disc, Playlist,
 * Track, or User.
 *
 * @since 1.3.0
 *
 * @param {string} uri The URI to get an instance for.
 * @param {Object=} opt_data Optional data to resolve the instance with. Note
 *     that this should only be used if the data was provided together with the
 *     URI.
 * @return {?Loadable} An instance representing the provided URI, or null if
 *     the URI could not be understood.
 */
var fromURI = function(uri, opt_data) {
  var parts = uri.split(':');
  switch (parts[1]) {
    case 'album':
      // spotify:album:<id>:<disc>
      if (parts.length == 4)
        return Disc.fromURI(uri, opt_data);
      return Album.fromURI(uri, opt_data);
    case 'artist':
      return Artist.fromURI(uri, opt_data);
    case 'track':
      return Track.fromURI(uri, opt_data);
    case 'user':
      // spotify:user:<username>:<playlist:<id>|starred|toplist>
      if (parts.length > 3 && parts[2] != 'facebook')
        return Playlist.fromURI(uri, opt_data);
      return User.fromURI(uri, opt_data);
  }
  return null;
};

/*
 * Start waiting for any incoming track change events.
 */
Track._trackEventWait();

/*
 * Export all of the classes and instances that are available to users of this
 * module. We could set the classes at the top of the file, but the instance
 * must be created here at the bottom because they need the prototypes of the
 * classes to be set up before creating an object.
 */
exports.Observable = Observable;
exports.Loadable = Loadable;
exports.BridgeLoadable = BridgeLoadable;
exports.Album = Album;
exports.Application = Application;
exports.Artist = Artist;
exports.Cache = Cache;
exports.Client = Client;
exports.Collection = Collection;
exports.Context = Context;
exports.Disc = Disc;
exports.Group = Group;
exports.Player = Player;
exports.Playlist = Playlist;
exports.Promise = Promise;
exports.Session = Session;
exports.Track = Track;
exports.User = User;
exports.application = new Application();
exports.client = new Client();
exports.fromURI = fromURI;
exports.player = new Player('main');
exports.preview = new Player('preview');
exports.promisedRequest = promisedRequest;
exports.session = new Session();
