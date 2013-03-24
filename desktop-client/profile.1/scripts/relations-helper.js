/**
 * RELATIONS HELPER
 * The RelationsHelper loads and holds a user's relations (the number of followers
 * and followings the user has, and methods to retrieve them).
 *
 * USAGE:
 *   Require the RelationsHelper and init it with .initialize(user, isSelf)
 *   in the main app logic.
 *   In the application, use .request[resource] when relations need to be loaded.
 *   .requestRelations will kick off calls to load both relation types.
 *   As relations are loaded, modules can listen to several events from the
 *   RelationsHelper:
 *     followers_loaded
 *     followings_loaded
 *     all_relations_loaded
 *     followers_add
 *     followers_remove
 *     following_add
 *     following_remove
 *     followers_change
 *   The .data property of these events will contain the data that was requested.
 */
require([
  '$profile/collection-helper#CollectionHelper',
  '$profile/collection-helper#CollectionEvent',
  '$profile/relevance-helper#RelevanceHelper',
  '$profile/relevance-helper#RelevanceEvent',
  '$shared/events#EventHandler',
  '$api/models#Observable',
  '$api/relations#Relations'
], function(CollectionHelper, CollectionEvent, RelevanceHelper, RelevanceEvent,
            EventHandler, Observable, Relations) {

  'use strict';

  /**
   * Definition of the types collections we are working with.
   * @enum {string}
   */
  var Collections = {
    FOLLOWERS: 'subscribers',
    FOLLOWING: 'combinedSubscriptions'
  };

  /**
   * Definition of the types of events the collection helper will emit.
   * @enum {string}
   */
  var Events = {
    FOLLOWERS_LOADED: 'followers_loaded',
    FOLLOWING_LOADED: 'following_loaded',
    FOLLOWERS_LIMITED_LOADED: 'followers_limited_loaded',
    FOLLOWING_LIMITED_LOADED: 'following_limited_loaded',
    FOLLOWERS_CHANGE: 'followers_change',
    FOLLOWERS_ADD: 'followers_add',
    FOLLOWERS_REMOVE: 'followers_remove',
    FOLLOWING_ADD: 'following_add',
    FOLLOWING_REMOVE: 'following_remove',
    ALL_LOADED: 'all_relations_loaded'
  };

  /**
   * Constructor for the RelationsHelper
   * @constructor
   */
  var RelationsHelper = function() {
    this.user = null;
    this.events = null;
    this.collections = {
      followers: {},
      following: {},
      relevantFollowers: {},
      relevantFollowing: {}
    };
  };

  SP.inherit(RelationsHelper, Observable);

  /**
   * Debug flag for the RelationsHelper. If set to true, the RelationsHelper will
   * display various information in the console.
   * @type {boolean}
   */
  RelationsHelper.prototype.debug = false;

  /**
   * Indicates whether the user is looking at their own profile or not.
   * @type {boolean}
   */
  RelationsHelper.prototype.isSelf = false;

  /**
   * Keeps track if the Helper has been initialized or not.
   * @type {boolean}
   */
  RelationsHelper.prototype.initialized = false;

  /**
   * Initializes the RelationsHelper with the user to whom it should load relations.
   * @param {models.User} user A Spotify User object.
   * @param {boolean} isSelf Whether the user is looking at their own profile or not.
   */
  RelationsHelper.prototype.initialize = function(user, isSelf) {
    this._log('init');
    this.user = user;
    this.isSelf = isSelf;
    this.initialized = true;
    this.reset();

    if (this.isSelf) {
      this.relations = Relations.forCurrentUser();
    } else {
      this.relations = Relations.forUser(user);
    }
  };

  /**
   * Resets the RelationsHelper by setting all its data properties to start values.
   */
  RelationsHelper.prototype.reset = function() {
    this._log('reset');

    if (this.events) {
      this.events.removeAll();
    } else {
      this.events = new EventHandler(this);
    }
    this.collections = {
      followers: {},
      following: {},
      relevantFollowers: {},
      relevantFollowing: {}
    };
    this.retries = {};
    this.relations = null;
  };

  /**
   * Request loading all relations. Typically called on app start.
   */
  RelationsHelper.prototype.requestRelations = function() {
    this.requestRelevantFollowers(true);
    this.requestRelevantFollowing(true);
  };

  /**
   * Method to request followers for the current user profile.
   * @param {boolean=} opt_override If set and true, reload the collection and ignore cache.
   */
  RelationsHelper.prototype.requestFollowers = function(opt_override) {
    this._log('request to load followers', this.collections.followers);
    if (this.collections.followers.loaded && !this.collections.followers.needsRefresh && !opt_override) {
      this._followersReady();
    } else {
      if (!this.collections.followers.loading) {
        this.collections.followers.loading = true;
        var collection = new CollectionHelper(this.relations, Collections.FOLLOWERS);
        this.events.listen(collection, CollectionEvent.COLLECTION_LOADED,
            this._followersLoaded);
        collection.load();
      }
    }
  };

  /**
   * Public method to request relevant followers for the current user profile.
   * Relevant followers are followers the current user shares with the profile they
   * are viewing.
   * @param {boolean=} opt_override If set and true, reload the collection and ignore cache.
   */
  RelationsHelper.prototype.requestRelevantFollowers = function(opt_override) {
    this._log('request to load relevant followers', this.collections.relevantFollowers);
    if (this.collections.followers.loaded && this.collections.relevantFollowers.loaded &&
        !this.collections.followers.needsRefresh && !opt_override) {
      this._followersReady();
    } else {
      this.collections.followers.toBeFiltered = true;
      var relevantFollowers = new RelevanceHelper('subscribers', this.user.username);
      this.events.listen(relevantFollowers, RelevanceEvent.RELATIONS_LOADED,
          this._relevantFollowersLoaded);
      relevantFollowers.load();
    }
  };

  /**
   * Callback to fire when the RelevanceHelper is done loading.
   * @param {Event} e An event from the RelevanceHelper.
   * @private
   */
  RelationsHelper.prototype._relevantFollowersLoaded = function(e) {
    this._log('relevant followers loaded', e);
    this.collections.relevantFollowers.loaded = e.data.relevantPeople;
    this.requestFollowers(true);
  };

  /**
   * Public method to request following for the current user profile.
   * @param {Boolean=} opt_override If set and true, reload the collection and ignore cache.
   */
  RelationsHelper.prototype.requestFollowing = function(opt_override) {
    this._log('request to load following', this.collections.following);
    if (this.collections.following.loaded && !this.collections.following.needsRefresh && !opt_override) {
      this._followingReady();
    } else {
      if (!this.collections.following.loading) {
        this.collections.following.loading = true;
        var collection = new CollectionHelper(this.relations, Collections.FOLLOWING);
        this.events.listen(collection, CollectionEvent.COLLECTION_LOADED,
            this._followingLoaded);
        collection.load();
      }
    }
  };

  /**
   * Public method to request relevant following for the current user profile.
   * Relevant followings are followings the current user shares with the profile they
   * are viewing.
   * @param {?Boolean} override If set and true, reload the collection and ignore cache.
   */
  RelationsHelper.prototype.requestRelevantFollowing = function(override) {
    this._log('request to load relevant followings', this.collections.relevantFollowing);
    if (this.collections.following.loaded && this.collections.relevantFollowing.loaded &&
        !this.collections.following.needsRefresh && !override) {
      this._followingReady();
    } else {
      this.collections.following.toBeFiltered = true;
      var relevantFollowing = new RelevanceHelper('subscriptions', this.user.username);
      this.events.listen(relevantFollowing, RelevanceEvent.RELATIONS_LOADED,
          this._relevantFollowingLoaded);
      relevantFollowing.load();
    }
  };

  /**
   * Callback to fire when the RelevanceHelper is done loading.
   * @param {Event} e An event from the RelevanceHelper.
   * @private
   */
  RelationsHelper.prototype._relevantFollowingLoaded = function(e) {
    this._log('relevant following loaded', e);
    this.collections.relevantFollowing.loaded = e.data.relevantPeople;
    this.requestFollowing(true);
  };

  /**
   * Public method to request a limited set of users from the following collection.
   */
  RelationsHelper.prototype.requestLimitedFollowers = function(limit) {
    var collection = new CollectionHelper(this.relations, Collections.FOLLOWERS, limit);
    this.events.listen(collection, CollectionEvent.COLLECTION_LOADED,
        this._limitedFollowersLoaded);
    collection.load();
  };

  /**
   * Method to request a limited set of users from the following collection.
   * @param {number} limit The number of results to limit the request by.
   */
  RelationsHelper.prototype.requestLimitedFollowing = function(limit) {
    var collection = new CollectionHelper(this.relations, Collections.FOLLOWING, limit);
    this.events.listen(collection, CollectionEvent.COLLECTION_LOADED,
        this._limitedFollowingLoaded);
    collection.load();
  };

  /**
   * Callback to fire when the Collection Helper is done loading.
   * @param {Event} e An event from the Collection Helper.
   * @private
   */
  RelationsHelper.prototype._followersLoaded = function(e) {
    this._log('followers loaded', e);
    this.collections.followers.total = e.data.total;
    if (this.collections.followers.toBeFiltered) {
      var followersList = [];
      if (this.collections.relevantFollowers.loaded) {
        followersList = this.collections.relevantFollowers.loaded;
        var i = 0, l = e.data.loaded.length, obj;
        for (; i < l; i++) {
          obj = e.data.loaded[i];
          if (followersList.indexOf(obj) === -1) {
            followersList.push(obj);
          }
        }
      }
      this.collections.followers.loaded = followersList;
    } else {
      this.collections.followers.loaded = e.data.loaded;
    }
    var helper = e.data.helper;
    this.events.unlisten(helper, CollectionEvent.COLLECTION_LOADED,
        this._followersLoaded);
    helper.dispose();
    this._followersReady();
  };

  /**
   * Callback to fire when the Collection Helper is done loading.
   * @param {Event} e An event from the Collection Helper.
   * @private
   */
  RelationsHelper.prototype._followingLoaded = function(e) {
    this.collections.following.total = e.data.total;
    this._log('following loaded', e, this.collections);
    if (this.collections.following.toBeFiltered) {
      var followingList = [];
      if (this.collections.relevantFollowing.loaded) {
        followingList = this.collections.relevantFollowing.loaded;
        var i = 0, l = e.data.loaded.length, obj;
        for (; i < l; i++) {
          obj = e.data.loaded[i];
          if (!followingList.some(
              function(element, index, array) {
                return element.uri === obj.uri;
              }
              )) {
            followingList.push(obj);
          }
        }
      }
      this.collections.following.loaded = followingList;
    } else {
      this.collections.following.loaded = e.data.loaded;
    }
    var helper = e.data.helper;
    this.events.unlisten(helper, CollectionEvent.COLLECTION_LOADED,
        this._followingLoaded);
    helper.dispose();
    this._followingReady();
  };

  /**
   * Callback to fire when the Collection Helper is done loading.
   * @param {Event} e An event from the Collection Helper.
   * @private
   */
  RelationsHelper.prototype._limitedFollowersLoaded = function(e) {
    var helper = e.data.helper;
    var data = {
      total: e.data.total,
      loaded: e.data.loaded
    };
    this.events.unlisten(helper, CollectionEvent.COLLECTION_LOADED,
        this._limitedFollowersLoaded);
    helper.dispose();
    this._generateEvent(Events.FOLLOWERS_LIMITED_LOADED, data);
  };

  /**
   * Callback to fire when the Collection Helper is done loading.
   * @param {Event} e An event from the Collection Helper.
   * @private
   */
  RelationsHelper.prototype._limitedFollowingLoaded = function(e) {
    var helper = e.data.helper;
    var data = {
      total: e.data.total,
      loaded: e.data.loaded
    };
    this.events.unlisten(helper, CollectionEvent.COLLECTION_LOADED,
        this._limitedFollowingLoaded);
    helper.dispose();
    this._generateEvent(Events.FOLLOWING_LIMITED_LOADED, data);
  };

  /**
   * Invoked when the subscribers collection is ready to be communicated to another
   * module.
   * @private
   */
  RelationsHelper.prototype._followersReady = function() {
    this._log('followers ready', this.collections.followers);
    this.collections.followers.loading = false;

    var data = {
      total: this.collections.followers.total,
      loaded: this.collections.followers.loaded
    }, _this = this;
    this._generateEvent(Events.FOLLOWERS_LOADED, data);
    if (!this.collections.followers.watched) {
      this.collections.followers.watched = true;
      this.events.listen(this.relations[Collections.FOLLOWERS], 'add',
          function(change) {
            _this.collections.followers.needsRefresh = true;
            _this._onChangeEvent(change, Events.FOLLOWERS_ADD);
          }
      ).listen(this.relations[Collections.FOLLOWERS], 'remove',
          function(change) {
            _this.collections.followers.needsRefresh = true;
            _this._onChangeEvent(change, Events.FOLLOWERS_REMOVE);
          }
      );
      if (!this.isSelf) {
        this._watchSubscribedProperty();
      }
    }
    this._checkComplete();
  };

  /**
   * Invoked when the subscriptions collection is ready to be communicated to another
   * module.
   * @private
   */
  RelationsHelper.prototype._followingReady = function() {
    this._log('following ready', this.collections.following);
    this.collections.following.loading = false;

    var data = {
      total: this.collections.following.total,
      loaded: this.collections.following.loaded
    }, _this = this;
    if (!this.collections.following.watched) {
      this.collections.following.watched = true;
      this.events.listen(this.relations[Collections.FOLLOWING], 'add',
          function(change) {
            _this.collections.following.needsRefresh = true;
            _this._onChangeEvent(change, Events.FOLLOWING_ADD);
          }
      ).listen(this.relations[Collections.FOLLOWING], 'remove',
          function(change) {
            _this.collections.following.needsRefresh = true;
            _this._onChangeEvent(change, Events.FOLLOWING_REMOVE);
          }
      );
    }
    this._generateEvent(Events.FOLLOWING_LOADED, data);
    this._checkComplete();
  };

  /**
   * Checks whether all collections are ready to be communicated to another module.
   * @private
   */
  RelationsHelper.prototype._checkComplete = function() {
    if (this.collections.followers.loaded && this.collections.following.loaded) {
      var data = {
        numFollowers: this.collections.followers.total,
        numFollowing: this.collections.following.total,
        followers: this.collections.followers.loaded,
        following: this.collections.following.loaded
      };
      this._log('all relations loaded', this);
      this._generateEvent(Events.ALL_LOADED, data);
    }
  };

  /**
   * Load the subscribed property of the relations collection so that it can be
   * listened to.
   * @private
   */
  RelationsHelper.prototype._watchSubscribedProperty = function() {
    this.user.load('subscribed').done(this,
        this._setFollowersListener);
  };

  /**
   * Set up a listener on the subscribed property of the relations collection.
   * NOTE: this property may become 'followed' in the near future.
   * @private
   */
  RelationsHelper.prototype._setFollowersListener = function() {
    this._log('setting listener for subscribers', this.user, this.events);
    this.events.listen(this.user, 'change:subscribed', function(change) {
      this.collections.followers.needsRefresh = true;
      this._generateEvent(Events.FOLLOWERS_CHANGE, change);
    });
  };

  /**
   * Makes the RelationsHelper emit a change event to another module describing
   * what happened and what uri was changed.
   * @param {Object} change Data containing what was changed.
   * @param {Events} eventType An event identifier.
   * @private
   */
  RelationsHelper.prototype._onChangeEvent = function(change, eventType) {
    this._log('change event detected', change, eventType);
    var data = {
      uri: change.uris[0]
    };
    this._generateEvent(eventType, data);
  };

  /**
   * Generates an event object, populates it and dispatches it through Observables
   * dispatchEvent method.
   * @param {Events} type An event type.
   * @param {Object} data The data to populate the event with.
   * @private
   */
  RelationsHelper.prototype._generateEvent = function(type, data) {
    this._log('dispatching event', type, data);
    var e = new Event(type);
    e.data = data || null;
    this.dispatchEvent(e);
  };

  /**
   * Used if the debug flag is true to communicate various internal calls to the
   * console.
   * @private
   */
  RelationsHelper.prototype._log = function() {
    if (this.debug) {
      if (window.console && window.console.log && window.console.log.apply) {
        window.console.log.apply(console, ['   [RelationsHelper]', arguments]);
      }
    }
  };

  exports.RelationsHelper = new RelationsHelper();
  exports.RelationEvent = Events;
  exports.RelationCollection = Collections;
});
