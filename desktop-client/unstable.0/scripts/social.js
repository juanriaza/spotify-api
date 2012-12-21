/**
 * @fileoverview Functions for calling into the Social service.
 */

'use strict';

var sp = getSpotifyApi();

var dom = sp.require('$util/dom');
var events = sp.require('$util/events');
var models = sp.require('$api/models');
var react = sp.require('$util/react');
var staticdata = sp.require('$unstable/staticdata');
var storage = sp.require('$util/storage');
var util = sp.require('$util/util');


/**
 * The name of the event fired when the list of relations has been loaded.
 * @const
 * @type {string}
 */
var RELATIONS_LOADED_EVENT = 'relationsLoaded';
/**
 * The name of the event fired when the list of relations has changed.
 * @const
 * @type {string}
 */
var RELATIONS_CHANGED_EVENT = 'relationsChanged';
/**
 * The name of the event fired when a single relation is updated.
 * @const
 * @type {string}
 */
var RELATION_UPDATED_EVENT = 'relationUpdated';
/**
 * The name of the event fired when the current user subscribes to another user.
 * @const
 * @type {string}
 */
var SUBSCRIPTION_ADDED_EVENT = 'subscribe';
/**
 * The name of the event fired when the current user unsubscribes from another user.
 * @const
 * @type {string}
 */
var SUBSCRIPTION_REMOVED_EVENT = 'unsubscribe';
/**
 * The name of the event fired when the current user dismisses another user.
 * @const
 * @type {string}
 */
var DISMISS_EVENT = 'dismiss';

var RELATIONS_CACHE_KEY = 'socialRelationsCache'; /* Key in local storage */
var RELATIONS_CACHE_USERS_KEY = 'users'; /* Cache key where the actual user data is stored */
var RELATIONS_CACHE_VERSION_KEY = '__cacheVersion__'; /* Cache key storing the schema version */

sp.core.registerSchema([
  // Social service messages.
  {
    name: 'CountResponse',
    fields: [
      {id: 1, type: '*int32', name: 'counts'}
    ]
  },
  {
    name: 'UserListRequest',
    fields: [
    ]
  },
  {
    name: 'UserListResponse',
    fields: [
      {id: 1, type: 'int32', name: 'matches'},
      {id: 2, type: '*User', name: 'users'}
    ]
  },
  {
    name: 'User',
    fields: [
      {id: 1, type: 'string', name: 'username'},
      {id: 2, type: 'int32', name: 'subscriber_count'},
      {id: 3, type: 'int32', name: 'subscription_count'}
    ]
  },
  // Facebook messages.
  {
    name: 'FacebookMessagePost',
    fields: [
      {id: 1, name: 'fb_uid', type: '*string'},
      {id: 2, name: 'message', type: 'string'},
      {id: 3, name: 'spotify_uri', type: '*string'}
    ]
  }
]);


/*
 * Exports
 */
exports.addEventListener = addEventListener;
exports.decorate = decorate;
exports.dismiss = dismiss;
exports.getAllUsers = getAllUsers;
exports.getAllFacebookUsers = getAllFacebookUsers;
exports.getSubscriberCount = getSubscriberCount;
exports.getSubscribers = getSubscribers;
exports.getSubscribersIntersection = getSubscribersIntersection;
exports.getSubscriptionCount = getSubscriptionCount;
exports.getSubscriptions = getSubscriptions;
exports.getSubscriptionsIntersection = getSubscriptionsIntersection;
exports.getUserBy = getUserBy;
exports.getUserByFacebookUid = getUserByFacebookUid;
exports.getUserByUri = getUserByUri;
exports.getUserByUsername = getUserByUsername;
exports.getUsernames = getUsernames;
exports.isDismissed = isDismissed;
exports.isSubscribed = isSubscribed;
exports.sendFacebookMessage = sendFacebookMessage;
exports.subscribe = subscribe;
exports.unsubscribe = unsubscribe;
exports.RELATIONS_LOADED_EVENT = RELATIONS_LOADED_EVENT;
exports.RELATIONS_CHANGED_EVENT = RELATIONS_CHANGED_EVENT;
exports.RELATION_UPDATED_EVENT = RELATION_UPDATED_EVENT;
exports.SUBSCRIPTION_ADDED_EVENT = SUBSCRIPTION_ADDED_EVENT;
exports.SUBSCRIPTION_REMOVED_EVENT = SUBSCRIPTION_REMOVED_EVENT;
exports.DISMISS_EVENT = DISMISS_EVENT;

/**
 * Whether the social relations have finished loading.
 * @member loaded
 * @type {boolean}
 */
Object.defineProperty(exports, 'loaded', {
  get: function() {
    return relations.loaded;
  }
});


/*
 * Private variables
 */
var relations = sp.social.relations;
var loadEvent = react.fromDOMEvent(relations, 'load');
var reloadEvent = react.fromDOMEvent(relations, 'reload');
var changeEvent = react.fromDOMEvent(relations, 'change');
var relationsCache = loadCache();
var target = new events.EventTarget();


/*
 * Initialization
 */
loadEvent.subscribe(function(e) {
  updateCache();
  new dom.Event(RELATIONS_LOADED_EVENT, true).dispatch(target);
});

reloadEvent.subscribe(function(e) {
  if (!updateCache()) return;
  new dom.Event(RELATIONS_CHANGED_EVENT, true).dispatch(target);
});

changeEvent.subscribe(function(e) {
  e.data.forEach(function(user) {
    if (user.canonicalUsername !== sp.core.user.canonicalUsername)
      updateCachedUser(user);
  });
  var event = document.createEvent('CustomEvent');
  event.initCustomEvent(RELATION_UPDATED_EVENT, true, false, e.data);
  target.dispatchEvent(event);
});

window.addEventListener('beforeunload', saveCache);


var subscribeEvent, unsubscribeEvent, dismissEvent;

/**
 * Conform to the same interface as native modules: compatible with react.
 */
function addEventListener(type, listener, useCapture) {
  // The try/catch is here to catch any errors from the C++ bridge. The bridge throws error when an
  // event is not supported, which is not how JavaScript usually behaves. So instead of crashing,
  // we show a warning in the console.
  try {
    switch (type) {
      case RELATIONS_LOADED_EVENT:
      case RELATIONS_CHANGED_EVENT:
      case RELATION_UPDATED_EVENT:
        break;

      case SUBSCRIPTION_ADDED_EVENT:
        if (subscribeEvent) break;
        subscribeEvent = react.fromDOMEvent(sp.social, 'socialSubscribe');
        subscribeEvent.subscribe(function(e) {
          var event = document.createEvent('CustomEvent');
          event.initCustomEvent(SUBSCRIPTION_ADDED_EVENT, true, false, e.data);
          target.dispatchEvent(event);
        });
        break;

      case SUBSCRIPTION_REMOVED_EVENT:
        if (unsubscribeEvent) break;
        unsubscribeEvent = react.fromDOMEvent(sp.social, 'socialUnsubscribe');
        unsubscribeEvent.subscribe(function(e) {
          var event = document.createEvent('CustomEvent');
          event.initCustomEvent(SUBSCRIPTION_REMOVED_EVENT, true, false, e.data);
          target.dispatchEvent(event);
        });
        break;

      case DISMISS_EVENT:
        if (dismissEvent) break;
        dismissEvent = react.fromDOMEvent(sp.social, 'socialDismiss');
        dismissEvent.subscribe(function(e) {
          var event = document.createEvent('CustomEvent');
          event.initCustomEvent(DISMISS_EVENT, true, false, e.data);
          target.dispatchEvent(event);
        });
        break;

      default:
        console.warn('Invalid event type: ' + type);
        return;
    }
  } catch (e) {
    console.warn('Bridge ' + e);
    return;
  }
  target.addEventListener(type, listener, useCapture);
}


/**
 * Return types for convertTo* functions.
 * @enum
 */
var ConvertTo = {
  SAME_AS_INPUT: 0,
  ALWAYS_ARRAY: 1,
  ALWAYS_ITEM: 2
};


/** @typedef {(module:api/models~Link|module:api/models~User|string)} */
var UserLike;


/**
 * Converts an input variable into a username or a list of usernames, depending on what is provided.
 *
 * Takes one (or an array) of the following:
 * <ul>
 *   <li>{@link module:api/models~Link}</li>
 *   <li>{@link module:api/models~User}</li>
 *   <li>Spotify URI (string)</li>
 *   <li>Spotify URL (string)</li>
 *   <li>Spotify username (string)</li>
 * </ul>
 * @param {UserLike} input The input to convert.
 * @param {ConvertTo=} opt_resultType ConvertTo.SAME_AS_INPUT (default) to return either an item or an array depending
 *     on input, ConvertTo.ALWAYS_ARRAY to always return an array, or ConvertTo.ALWAYS_ITEM to always return a single
 *     item (if provided an array this will throw an error).
 * @return {string|Array.<string>} The resulting username or list of usernames.
 */
function convertToUsername(input, opt_resultType) {
  if (opt_resultType == ConvertTo.ALWAYS_ARRAY) {
    if (!(input instanceof Array)) input = [input];
  }

  // Support array input/output.
  if (input instanceof Array) {
    if (opt_resultType == ConvertTo.ALWAYS_ITEM) throw new Error('Got an array but expected a single item');
    return input.map(function(item) { return convertToUsername(item, ConvertTo.ALWAYS_ITEM); });
  }

  switch (input.constructor) {
    case models.Link:
      if (input.type != models.Link.TYPE.PROFILE) {
        throw new Error('Expected user Link, got "' + input + '"');
      }
      return input.uri.split(':')[2];
    case models.User:
      return input.canonicalName;
    case String:
      // This is a little bit magic, but only URIs can contain colons so it's safe.
      // Note that this covers both http://open.spotify.com URLs and spotify: URIs.
      if (input.indexOf(':') >= 0) {
        return convertToUsername(new models.Link(input));
      }
      return input;
    default:
      throw new Error('Cannot convert type ' + (input.constructor.name || '<unknown>'));
  }
}


/**
 * Converts an input variable into a User or a list of User objects, depending on what is provided.
 *
 * Takes one (or an array) of the following:
 * <ul>
 *   <li>{@link module:api/models~Link}</li>
 *   <li>{@link module:api/models~User}</li>
 *   <li>Spotify URI (string)</li>
 *   <li>Spotify URL (string)</li>
 *   <li>Spotify username (string)</li>
 * </ul>
 * @param {UserLike} input The input to convert.
 * @param {ConvertTo=} opt_resultType ConvertTo.SAME_AS_INPUT (default) to return either an item or an array depending
 *     on input, ConvertTo.ALWAYS_ARRAY to always return an array, or ConvertTo.ALWAYS_ITEM to always return a single
 *     item (if provided an array this will throw an error).
 * @return {module:api/models~User|Array.<module:api/models~User>} The resulting user or list of users.
 */
function convertToUser(input, opt_resultType) {
  if (opt_resultType == ConvertTo.ALWAYS_ARRAY) {
    if (!(input instanceof Array)) input = [input];
  }

  // Support array input/output.
  if (input instanceof Array) {
    if (opt_resultType == ConvertTo.ALWAYS_ITEM) throw new Error('Got an array but expected a single item');
    return input.map(function(item) { return convertToUser(item, ConvertTo.ALWAYS_ITEM); });
  }

  switch (input.constructor) {
    case models.Link:
      return models.User.fromURI(input);
    case models.User:
      return input;
    case String:
      if (input.indexOf(':') == -1) {
        input = 'spotify:user:' + input;
      }
      return models.User.fromURI(input);
    default:
      throw new Error('Cannot convert type ' + (input.constructor.name || '<unknown>'));
  }
}


/**
 * Decorates usernames with display name and profile picture.
 * @param {UserLike} users A list of users. Can be whatever {@link convertToUser} takes.
 * @param {function(Array.<module:api/models~User>)} ondone Callback for completion.
 */
function decorate(users, ondone) {
  users = convertToUser(users, ConvertTo.ALWAYS_ARRAY);

  // TODO(blixt): Use new C++ bindings for this once they're done.
  var numUsers = users.length;
  if (!numUsers) {
    ondone(users);
    return;
  }

  var c = numUsers;
  for (var i = 0; i < numUsers; i++) {
    var user = users[i];

    // Include static data about "interesting people" that may not have any profile data in the backend.
    var data = staticdata.getInterestingPeople(user.canonicalName);
    if (data) {
      data.dismissed = isDismissed(user.canonicalName);
      data.subscribed = isSubscribed(user.canonicalName);
      user.update(data);
      user.loaded = true;
      if (!--c) ondone(users);
    } else if (user.data.name && user.data.picture) {
      if (!--c) ondone(users);
    } else {
      // Only do a request if full name or picture is missing.
      sp.social.getUserByUsername(user.canonicalName, {
        onSuccess: function(i) {
          return function(data) {
            users[i].update(data);
          };
        }(i),
        onComplete: function() {
          if (!--c) ondone(users);
        }});
    }
  }
}


/**
 * Dismiss one or more users.
 * @param {UserLike} usernames A list of usernames to dismiss. Can be whatever {@link convertToUsername} takes.
 * @param {Function=} opt_onsuccess Callback for success.
 * @param {Function=} opt_onerror Callback for errors.
 */
function dismiss(usernames, opt_onsuccess, opt_onerror) {
  usernames = convertToUsername(usernames, ConvertTo.ALWAYS_ARRAY);
  sp.social.dismissUsers(usernames, {onSuccess: opt_onsuccess || id, onFailure: opt_onerror || id});
}


/**
 * Subscribe to one or more users.
 * @param {UserLike} usernames A list of usernames to subscribe to. Can be whatever {@link convertToUsername} takes.
 * @param {Function=} opt_onsuccess Callback for success.
 * @param {Function=} opt_onerror Callback for errors.
 */
function subscribe(usernames, opt_onsuccess, opt_onerror) {
  usernames = convertToUsername(usernames, ConvertTo.ALWAYS_ARRAY);
  sp.social.subscribeUsers(usernames, {onSuccess: opt_onsuccess || id, onFailure: opt_onerror || id});
}


/**
 * Gets the subscriber count of one or more users.
 * @param {UserLike} usernames A list of usernames. Can be whatever {@link convertToUsername} takes.
 * @param {function(Array.<number>)} onsuccess Callback for success.
 * @param {Function=} opt_onerror Callback for errors.
 */
function getSubscriberCount(usernames, onsuccess, opt_onerror) {
  usernames = convertToUsername(usernames, ConvertTo.ALWAYS_ARRAY);
  sp.social.getSubscriberCounts(usernames, {onSuccess: onsuccess, onFailure: opt_onerror || id});
}


/**
 * Decorates a list of user data objects (what is returned from the bridge.)
 * @param {Array.<Object>} userDataList An array of user data objects.
 * @param {function(Array.<User>)} onsuccess Callback for success.
 * @private
 */
function _decorateUserData(userDataList, onsuccess) {
  var users = userDataList.map(function(data) {
    return new models.User(data);
  });
  decorate(users, onsuccess);
}


/**
 * Requests the users subscribing to the specified user.
 * @param {UserLike} username Username of the user to get subscribers for. Can be whatever {@link convertToUsername}
 *     takes. A falsy value means current user.
 * @param {function(Array.<module:api/models~User>)} onsuccess Callback for success.
 * @param {Function=} opt_onerror Callback for errors.
 */
function getSubscribers(username, onsuccess, opt_onerror) {
  if (username) username = convertToUsername(username, ConvertTo.ALWAYS_ITEM);

  // TODO(blixt): Support pagination somehow (possibly abstracted into a container class).
  sp.social.getSubscribers(username, {
    onSuccess: function(users) {
      _decorateUserData(users, onsuccess);
    },
    onFailure: opt_onerror || id
  });
}


/**
 * Checks if one or more users are subscribed to a specific user. Basically, the intersection of the specified
 * user's subscribers and the provided list of usernames.
 * @param {UserLike} username Username of the user whose subscriber list to test. Can be whatever
 *     {@link convertToUsername} takes.
 * @param {UserLike} subscribers List of usernames to test. Can be whatever {@link convertToUsername} takes.
 * @param {function(Array.<boolean>)} onsuccess Callback for success.
 * @param {Function=} opt_onerror Callback for errors.
 */
function getSubscribersIntersection(username, subscribers, onsuccess, opt_onerror) {
  username = convertToUsername(username, ConvertTo.ALWAYS_ITEM);
  subscribers = convertToUsername(subscribers, ConvertTo.ALWAYS_ARRAY);

  // TODO(blixt): This needs to be server-side since client might not get complete list.
  getSubscribers(username, function(users) {
    // Create a lookup of usernames that are subscribers to the specified user.
    var lookup = {};
    users.forEach(function(user) {
      lookup[user.canonicalName] = true;
    });
    // Call the success callback with an array of booleans.
    onsuccess(subscribers.map(function(otherUsername) {
      return !!lookup[otherUsername];
    }));
  }, opt_onerror || id);
}


/**
 * Gets the subscription count of one or more users.
 * @param {UserLike} usernames A list of usernames. Can be whatever {@link convertToUsername} takes.
 * @param {function(Array.<number>)} onsuccess Callback for success.
 * @param {Function=} opt_onerror Callback for errors.
 */
function getSubscriptionCount(usernames, onsuccess, opt_onerror) {
  usernames = convertToUsername(usernames, ConvertTo.ALWAYS_ARRAY);
  sp.social.getSubscriptionCounts(usernames, {onSuccess: onsuccess, onFailure: opt_onerror || id});
}


/**
 * Requests the people the specified user is subscribed to.
 * @param {UserLike} username Username of the user to get subscriptions for. Can be whatever {@link convertToUsername}
 *     takes. A falsy value means current user.
 * @param {function(Array.<module:api/models~User>)} onsuccess Callback for success.
 * @param {Function=} opt_onerror Callback for errors.
 */
function getSubscriptions(username, onsuccess, opt_onerror) {
  if (username) username = convertToUsername(username, ConvertTo.ALWAYS_ITEM);

  // Optimize for the currently logged in user.
  if (username == sp.core.canonicalUsername) {
    _decorateUserData(sp.social.subscriptions, onsuccess);
    return;
  }

  sp.social.getSubscriptions(username, {
    onSuccess: function(users) {
      _decorateUserData(users, onsuccess);
    },
    onFailure: function(code) {
      if (opt_onerror) opt_onerror(code);
    }
  });
}


/**
 * Checks what users in the given list are being followed by the specified username. Basically, the intersection of
 * the specified user's subscriptions and the provided list of usernames.
 * @param {UserLike} username User whose subscription list to test. Can be whatever {@link convertToUsername} takes.
 * @param {UserLike} subscriptions List of usernames to test. Can be whatever {@link convertToUsername} takes.
 * @param {function(Array.<boolean>)} onsuccess Callback for success.
 * @param {Function=} opt_onerror Callback for errors.
 */
function getSubscriptionsIntersection(username, subscriptions, onsuccess, opt_onerror) {
  username = convertToUsername(username, ConvertTo.ALWAYS_ITEM);
  subscriptions = convertToUsername(subscriptions, ConvertTo.ALWAYS_ARRAY);

  // TODO(blixt): This needs to be server-side since client might not get complete list.
  getSubscriptions(username, function(users) {
    // Create a lookup of usernames that are subscribed to by the specified user.
    var lookup = {};
    users.forEach(function(user) {
      lookup[user.canonicalName] = true;
    });
    // Call the success callback with an array of booleans.
    onsuccess(subscriptions.map(function(otherUsername) {
      return !!lookup[otherUsername];
    }));
  }, opt_onerror || id);
}


/**
 * Cache used by {@link isDismissed}.
 * @type {Object.<string, boolean>}
 * @private
 */
var _dismissedCache = null;

/**
 * Cache used by {@link isSubscribed}.
 * @type {Object.<string, boolean>}
 * @private
 */
var _subscribedCache = null;

/**
 * Returns whether the currently logged in user has dismissed the specified user.
 * @param {UserLike} username User to test. Can be whatever {@link convertToUsername} takes.
 * @return {boolean} Whether the currently logged in user has dismissed the specified user.
 */
function isDismissed(username) {
  username = convertToUsername(username, ConvertTo.ALWAYS_ITEM);

  // Build a simple lookup map for dismissed users.
  if (!_dismissedCache) {
    var dismissals = sp.social.dismissals;
    // TODO(blixt): Is this the best way to indicate that dismissals are not available yet?
    if (!dismissals) return null;

    _dismissedCache = {};

    dismissals.forEach(function(user) {
      _dismissedCache[user.canonicalUsername] = true;
    });

    // Update the lookup map on dismissal changes.
    addEventListener(DISMISS_EVENT, function(evt) {
      evt.detail.forEach(function(username) {
        _dismissedCache[username] = true;
      });
    });
  }

  return !!_dismissedCache[username];
}

/**
 * Returns whether the currently logged in user is subscribed to the specified user.
 * @param {UserLike} username User to test. Can be whatever {@link convertToUsername} takes.
 * @return {boolean} Whether the currently logged in user is subscribed to the specified user.
 */
function isSubscribed(username) {
  username = convertToUsername(username, ConvertTo.ALWAYS_ITEM);

  // Build a simple lookup map for subscribed users.
  if (!_subscribedCache) {
    var subs = sp.social.subscriptions;
    // TODO(blixt): Is this the best way to indicate that subscriptions are not available yet?
    if (!subs) return null;

    _subscribedCache = {};

    subs.forEach(function(user) {
      _subscribedCache[user.canonicalUsername] = true;
    });

    // Update the lookup map on subscription changes.
    addEventListener(SUBSCRIPTION_ADDED_EVENT, function(evt) {
      evt.detail.forEach(function(username) {
        _subscribedCache[username] = true;
      });
    });

    addEventListener(SUBSCRIPTION_REMOVED_EVENT, function(evt) {
      evt.detail.forEach(function(username) {
        delete _subscribedCache[username];
      });
    });
  }

  return !!_subscribedCache[username];
}


/**
 * Unsubscribes from one or more users.
 * @param {UserLike} usernames A list of usernames to unsubscribe from. Can be whatever {@link convertToUsername} takes.
 * @param {Function=} opt_onsuccess Callback for success.
 * @param {Function=} opt_onerror Callback for errors.
 */
function unsubscribe(usernames, opt_onsuccess, opt_onerror) {
  usernames = convertToUsername(usernames, ConvertTo.ALWAYS_ARRAY);
  sp.social.unsubscribeUsers(usernames, {onSuccess: opt_onsuccess || id, onFailure: opt_onerror || id});
}


/**
 * Update the relations cache.
 * Returns a boolean to indicate if the contents changed.
 * @private
 */
function updateCache(cache) {
  var oldCache = relationsCache;
  relationsCache = getUserMap();
  saveCache();
  return !compareCaches(oldCache, relationsCache);
}


function saveCache() {
  var data = {};
  data[RELATIONS_CACHE_VERSION_KEY] = 2;
  data[RELATIONS_CACHE_USERS_KEY] = relationsCache;
  storage.set(RELATIONS_CACHE_KEY, data);
}


function loadCache() {
  var data = storage.get(RELATIONS_CACHE_KEY);
  if (!data || !(RELATIONS_CACHE_VERSION_KEY in data) || data[RELATIONS_CACHE_VERSION_KEY] < 2 ||
      !data[RELATIONS_CACHE_USERS_KEY]) {
    // This cache was saved before SOC-8 was fixed, so it might be corrupted.
    // Fall back to the bridge API instead.
    return getUserMap();
  } else {
    return data[RELATIONS_CACHE_USERS_KEY];
  }
}


/**
 * Build and return the user map for caching and lookup.
 */
function getUserMap() {
  var userMap = {};
  for (var i = 0, l = relations.length; i < l; ++i) {
    var user = relations.getUserInfo(i);
    userMap[user.uri] = user;
  }
  return userMap;
}


/**
 * Returns an array containing all related user details.
 */
function getAllUsers() {
  var getUser = partial(getValue, relationsCache);
  return map(getUser, Object.keys(relationsCache));
}


/**
 * Returns the list of all facebook users.
 */
function getAllFacebookUsers() {
  return map(getUserByFacebookUid, relations.allFacebookUsers());
}


/**
 * Get user by predicate function.
 * @param {function(Object):boolean} p Predicate function to apply to users.
 * @return {?Object} First user that matches the predicate.
 */
function getUserBy(p) {
  var users = filter(p, getAllUsers());
  return 0 === users.length ? null : users[0];
}


function getUserByUsername(cun) {
  var getCanonicalUsername = partial(getKey, 'canonicalUsername');
  return getUserBy(partial(comparing, getCanonicalUsername, cun));
}


function getUserByFacebookUid(uid) {
  var getFacebookUid = partial(getKey, 'facebookUid');
  return getUserBy(partial(comparing, getFacebookUid, uid));
}


function getUserByUri(uri) {
  var getUri = partial(getKey, 'uri');
  return getUserBy(partial(comparing, getUri, uri));
}


function getUsernames() {
  var userNames = [];
  var name;
  for (var i in relationsCache) {
    name = relationsCache[i].canonicalUsername;
    if (name.length && 0 !== name.indexOf('spotify:user:facebook:'))
      userNames.push(name);
  }
  return userNames;
}


/**
 * Update the user cache with new user data.
 * @param {Object} user User data to update the cache with.
 * @return {boolean} Whether the data was new or not.
 * @private
 */
function updateCachedUser(user) {
  var cachedUser = relationsCache[user.uri];
  if (user.relationType === 'none') {
    if (cachedUser) {
      delete relationsCache[user.uri];
    } else {
      // Sometimes we get events for unrelated users, we have to avoid caching
      // these users.
      return false;
    }
  }
  if (!cachedUser || !compareUsers(user, cachedUser)) {
    relationsCache[user.uri] = user;
    saveCache();
    return true;
  }
  return false;
}


/**
 * Determine user equality: compare all properties for now.
 * @private
 */
function compareUsers(first, second) {
  for (var property in first) {
    if (getValue(first, property) !== getValue(second, property)) {
      return false;
    }
  }
  return true;
}


/**
 * Determines if two caches contain the same users.
 * @private
 */
function compareCaches(first, second) {
  if (Object.keys(first).length !== Object.keys(second).length) {
    return false;
  }
  for (var key in first) {
    if (!second[key])
      return false;
  }
  return true;
}


/**
 * Sends a message with one or more attached links to the specified Facebook user(s).
 * @param {string|Array.<string>} uids A Facebook uid or an array of them.
 * @param {string} message The message to send.
 * @param {string|Array.<string>} urls A Spotify URL or an array of them.
 * @param {Function=} opt_onsuccess A function to call the service call to the backend succeeds.
 * @param {Function=} opt_onerror A function to call if the service call to the backend fails.
 * @param {Function=} opt_oncomplete A function to call after the service call to the backend has been completed. This
 *     function is called both after success and an error.
 */
function sendFacebookMessage(uids, message, urls, opt_onsuccess, opt_onerror, opt_oncomplete) {
  if (!uids || !uids.length) {
    throw new Error('At least one Facebook UID must be provided.');
  }

  if (!urls || !urls.length) {
    throw new Error('At least one Spotify URL must be provided.');
  }

  // Most common use case is to send a single URL to a single user, so support single values.
  if (!(uids instanceof Array)) uids = [uids];
  if (!(urls instanceof Array)) urls = [urls];

  var data = {
    fb_uid: uids,
    message: message || '',
    spotify_uri: urls
  };

  // TODO(blixt): Use hm://facebook/inbox once it is available in the Social service.
  sp.core.getHermes('POST', 'hm://social/post_to_facebook',
      [['FacebookMessagePost', data]],
      {
        onSuccess: opt_onsuccess || id,
        onFailure: opt_onerror || id,
        onComplete: opt_oncomplete || id
      }
  );
}


function comparing(f, x, userData) { return eq(x, f(userData)); }
function getKey(key, obj) { return obj[key]; }
function getValue(obj, key) { return obj[key]; }
