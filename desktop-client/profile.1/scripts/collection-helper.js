/**
 * COLLECTION HELPER
 * The collection helper will take an anonymous collection, perform
 * a load, take recursive snapshots until it has all results and then
 * dispatch an event which holds the data it has loaded.
 *
 * USAGE:
 *   This class should be instantiated and passed the collection it should
 *   work with. It will then fire an event with its data and destroy itself.
 *   It will fire an event which has a data property that holds the data
 *   from the collection.
 */
require([
  '$shared/events#EventHandler',
  '$api/models#Observable'
], function(EventHandler, Observable) {

  'use strict';

  /**
   * Definition of the types of events the collection helper will emit.
   * @enum {string}
   */
  var Events = {
    COLLECTION_LOADED: 'collection_loaded'
  };

  /**
   * Constant to indicate how many retry attempts a failed load should do.
   * @const
   * @type {number}
   */
  var RETRY_ATTEMPT_LIMIT = 2;

  /**
   * Constant that determines how many results to fetch in each snapshot.
   * Regulated by api limitations.
   * @const
   * @type {number}
   */
  var LOAD_OFFSET = 200;

  /**
   * Sets the maximum number of items to fetch for display.
   * @const
   * @type {number}
   */
  var LOAD_CEIL = 1000;

  /**
   * Constructor for the CollectionHelper
   *
   * @class
   * @extends {module:api/models~Observable}
   *
   * @param {module:api/models~Loadable} loadable Something that implements the
   *    loadable superclass.
   * @param {string} property A loadable property on the collection.
   * @param {?number=} opt_limit Optional limit to replace the LOAD_OFFSET constant.
   * @constructor
   */
  var CollectionHelper = function(loadable, property, opt_limit) {
    if (!loadable && !property) {
      return;
    }
    this.events = null;
    this.loadable = loadable;
    this.loadableProperty = property;
    this.offset = opt_limit || LOAD_OFFSET;
    this.ceil = opt_limit || LOAD_CEIL;
    this.retries = {};
    this._initData();
    this._initEvents();
  };

  SP.inherit(CollectionHelper, Observable);

  CollectionHelper.prototype.load = function() {
    this._loadCollection();
  };

  /**
   * Debug flag for the CollectionHelper. If set to true, the CollectionHelper will
   * display various information in the console.
   * @type {Boolean}
   */
  CollectionHelper.prototype.debug = false;

  /**
   * Sets and object variable containing data for the collection.
   * @private
   */
  CollectionHelper.prototype._initData = function() {
    this.data = {
      start: 0,
      offset: 0,
      total: 0,
      loaded: [],
      all: false
    };
  };

  /**
   * Sets or resets the event handler of this class.
   * @private
   */
  CollectionHelper.prototype._initEvents = function() {
    if (this.events) {
      this.events.removeAll();
    } else {
      this.events = new EventHandler(this);
    }
  };

  /**
   * Loads the assigned properties on the collection.
   * @private
   */
  CollectionHelper.prototype._loadCollection = function() {
    this.loadable.load(this.loadableProperty).
        done(this, this._collectionLoaded).
        fail(this, this._collectionFailed);
  };

  /**
   * Callback for when the collection is ready to be snapshotted.
   * @private
   */
  CollectionHelper.prototype._collectionLoaded = function() {
    this._log('loaded collection', this.loadable, this.loadableProperty);
    this.loadable[this.loadableProperty].snapshot(this.data.start, this.offset).
        done(this, this._snapshotLoaded).
        fail(this, this._snapshotFailed);
  };

  /**
   * Evaluates a successful snapshot.
   * @param {module:api/models~Snapshot} snapshot A collection snapshot.
   * @private
   */
  CollectionHelper.prototype._snapshotLoaded = function(snapshot) {
    this._log('snapshot loaded', snapshot);
    this.data.total = snapshot.length;

    for (var i = 0; i < this.offset && i < snapshot.range.length; i++) {
      this.data.loaded.push(snapshot.get(this.data.start + i));
    }
    this.data.start += this.offset;

    if (snapshot.range.length === 0 || this.data.loaded.length >= snapshot.length ||
        this.data.loaded.length >= this.ceil) {
      this.data.all = true;
      this._collectionReady();
    } else {
      this._collectionLoaded();
    }
  };

  /**
   * Invoked when the collection is ready to be communicated to another module.
   * @private
   */
  CollectionHelper.prototype._collectionReady = function() {
    var e = new Event(Events.COLLECTION_LOADED);

    e.data = {
      total: this.data.total,
      loaded: this.data.loaded,
      helper: this
    };

    this._log('collection ready', this.data, e);
    this.dispatchEvent(e);
  };

  /**
   * Handles a failed collection load call and passes the error to _retryLoadAttempt.
   * @param {Object} error An error object.
   * @private
   */
  CollectionHelper.prototype._collectionFailed = function(error) {
    this._retryLoadAttempt('snapshot', error);
  };

  /**
   * Handles a failed snapshot load call and passes the error to _retryLoadAttempt.
   * @param {Object} error An error object.
   * @private
   */
  CollectionHelper.prototype._snapshotFailed = function(error) {
    this._retryLoadAttempt('snapshot', error);
  };

  /**
   * Handles a failed load call and invokes a retry if allowed by the
   * RETRY_ATTEMPT_LIMIT.
   * @param {string} type Which load call attempt that failed. 'collection' or 'snapshot'.
   * @param {Object} error An error object.
   * @private
   */
  CollectionHelper.prototype._retryLoadAttempt = function(type, error) {
    var retryCount = this.retries[type];

    if (!retryCount || retryCount < RETRY_ATTEMPT_LIMIT) {
      this.retries['collection'] = !retryCount ? 1 : retryCount + 1;
      if (type === 'snapshot') {
        this._collectionLoaded();
      } else if (type === 'collection') {
        this._loadCollection();
      }
    } else {
      console.error('request failed', error);
    }
  };

  /**
   * Used if the debug flag is true to communicate various internal calls to the
   * console.
   * @private
   */
  CollectionHelper.prototype._log = function() {
    if (this.debug) {
      if (window.console && window.console.log && window.console.log.apply) {
        window.console.log.apply(console, ['     [CollectionHelper]', arguments]);
      }
    }
  };

  /**
   * Nullifies this instance and removes all event handlers.
   */
  CollectionHelper.prototype.dispose = function() {
    if (this.events) {
      this.events.removeAll();
    }
    this.events = null;
    this.data = null;
    this.loadable = null;
    this.retries = null;
    this.loadableProperty = null;

    delete this.loadable;
    delete this.data;
  };

  exports.CollectionHelper = CollectionHelper;
  exports.CollectionEvent = Events;
});

