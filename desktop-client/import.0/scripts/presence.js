'use strict';

var sp = getSpotifyApi(1);

// Imports
var storage = sp.require('sp://import/scripts/storage');
var social  = sp.require('sp://import/scripts/social');

// This is required for registering protobuf definitions.
sp.require('sp://import/scripts/hermes');

// Constants
var PRESENCE_CACHE_KEY          = 'cachedPresences';
var PRESENCE_CACHE_SAVE_TIMEOUT = 1000;
var PRESENCE_BATCH_SIZE         = 15;
var PRESENCE_BATCH_INTERVAL     = 1000;
var PRESENCE_BATCH_DEFAULT_MAX  = 30;
var APP_BLACKLIST = {
    'spotify:app:album-header' : true,
    'spotify:app:feed' : true,
    'spotify:app:finder' : true,
    'spotify:app:home' : true,
    'spotify:app:people' : true,
    'spotify:app:profile' : true,
    'spotify:app:profile-header' : true,
    'spotify:app:search-dropdown' : true,
    'spotify:app:search-header' : true,
    'spotify:app:tutorial' : true
};

// Exports
exports.createStateForFacebookActivity = createStateForFacebookActivity;
exports.getMostRecentPresence          = getMostRecentPresence;
exports.getPresenceForUser             = getPresenceForUser;
exports.getPresenceForUsers            = getPresenceForUsers;
exports.observePresenceForUser         = observePresenceForUser;
exports.observePresenceForUsers        = observePresenceForUsers;
exports.PresenceState                  = PresenceState;


// Private variables
var _cachedPresences = storage.getWithDefault(PRESENCE_CACHE_KEY, {});
var _observedUsers   = {};

// Caching
var _saveCacheTimeout = 0;
var _saveCacheNow     = function() { storage.set(PRESENCE_CACHE_KEY, _cachedPresences); };
var _saveCacheLater   = function() {
    if (_saveCacheTimeout) {
        clearTimeout(_saveCacheTimeout);
    }
    _saveCacheTimeout = setTimeout(_saveCacheNow, PRESENCE_CACHE_SAVE_TIMEOUT);
};

// Events
sp.core.addEventListener('hermes', _presenceUpdated, false);
window.addEventListener("beforeunload", _saveCacheNow);

/**
 * [PresenceState description]
 * @constructor
 * @param {[type]} data      [description]
 * @param {[type]} category  [description]
 * @param {[type]} user      [description]
 */
function PresenceState(data, type, user) {
    this.type         = type;
    this.user         = user;
    this.timestamp    = data.timestamp;
    this.stickyFactor = PresenceState.getStickyFactor(type);

    this.trackUri     = null;
    this.playlistUri  = null;
    this.referrerUri  = null;
    this.contextUri   = null;
    this.appUri       = null;

    PresenceState.extractURIs(this, data);

    return this;
}

/**
 * [TYPE description]
 */
PresenceState.TYPE = {
    UNKNOWN: -1,
    FACEBOOK_ACTIVITY: 0,
    TRACK_FINISHED_PLAYING: 1,
    PLAYLIST_PUBLISHED: 2,
    PLAYLIST_TRACK_ADDED: 3,
    PLAYLIST_TRACK_STARRED: 4,
    PLAYLIST_SUBSCRIBED: 5,
    MY_PLAYLIST_SUBSCRIBED: 6,
    APP_ADDED: 7,
    APP_TRACK_FINISHED_PLAYING: 8,
    RADIO_TRACK_FINISHED_PLAYING: 9
};

/**
 * [getType description]
 * @param  {[type]} name [description]
 * @param  {[type]} user [description]
 * @return {[type]}
 */
PresenceState.getType = function(data, name, user) {
    if (name === 'track_finished_playing') {
        var uri = data[name].referrer_uri;
        if (uri && !APP_BLACKLIST[uri]) {
            var radio = ':app:radio';
            var app = 'spotify:app';

            if (uri && uri.indexOf(radio, uri.length - radio.length) !== -1) {
                return PresenceState.TYPE.RADIO_TRACK_FINISHED_PLAYING;
            }
            else if (uri && uri.indexOf(app) === 0) {
                return PresenceState.TYPE.APP_TRACK_FINISHED_PLAYING;
            }
        }
        return PresenceState.TYPE.TRACK_FINISHED_PLAYING;
    }
    else if (name === 'playlist_track_added') {
        if (data[name].playlist_uri && _isStarredPlaylist(data[name].playlist_uri)) {
            return PresenceState.TYPE.PLAYLIST_TRACK_STARRED;
        }
        return PresenceState.TYPE.PLAYLIST_TRACK_ADDED;
    }
    else if (name === 'playlist_published') {
        var owner = data[name].uri.split(':')[2];
        if (owner === user.canonicalUsername) {
            return PresenceState.TYPE.PLAYLIST_PUBLISHED;
        }
        else if (owner === sp.core.user.canonicalUsername) {
            return PresenceState.TYPE.MY_PLAYLIST_SUBSCRIBED;
        }
        else {
            return PresenceState.TYPE.PLAYLIST_SUBSCRIBED;
        }
    }
    else if (name === 'favorite_app_added') {
        return PresenceState.TYPE.APP_ADDED;
    }
    else if (name === 'facebook_activity') {
        return PresenceState.TYPE.FACEBOOK_ACTIVITY;
    }
    return PresenceState.TYPE.UNKNOWN;
};

/**
 * Determines an item's 'sticky' factor from a predefined list
 * @param  {Number} type [description]
 * @return {Number} A numerical value that could be used, for instance, to determine
 *                  for how long an item should stay prioritized in the feed.
 */
PresenceState.getStickyFactor = function(type) {
    switch (type) {
        case PresenceState.TYPE.UNKNOWN:
        case PresenceState.TYPE.FACEBOOK_ACTIVITY:
        case PresenceState.TYPE.TRACK_FINISHED_PLAYING:
            return 0;
        case PresenceState.TYPE.PLAYLIST_PUBLISHED:
        case PresenceState.TYPE.PLAYLIST_TRACK_ADDED:
            return 1;
        case PresenceState.TYPE.PLAYLIST_TRACK_STARRED:
        case PresenceState.TYPE.PLAYLIST_SUBSCRIBED:
        case PresenceState.TYPE.MY_PLAYLIST_SUBSCRIBED:
            return 2;
        case PresenceState.TYPE.RADIO_TRACK_FINISHED_PLAYING:
        case PresenceState.TYPE.APP_TRACK_FINISHED_PLAYING:
        case PresenceState.TYPE.APP_ADDED:
            return 0;
        default:
            return 0;
    }
};

/**
 * Retrieve all available URIs for a presence event
 * @param {[type]} state [description]
 * @param {[type]} data  [description]
 */
PresenceState.extractURIs = function(state, data) {
    switch (state.type) {
        case PresenceState.TYPE.PLAYLIST_PUBLISHED:
        case PresenceState.TYPE.PLAYLIST_SUBSCRIBED:
        case PresenceState.TYPE.MY_PLAYLIST_SUBSCRIBED:
            state.playlistUri = data["uri"] || null;
            break;
        case PresenceState.TYPE.PLAYLIST_TRACK_ADDED:
        case PresenceState.TYPE.PLAYLIST_TRACK_STARRED:
            state.trackUri    = data["track_uri"]    || null;
            state.playlistUri = data["playlist_uri"] || null;
            break;
        case PresenceState.TYPE.TRACK_FINISHED_PLAYING:
        case PresenceState.TYPE.RADIO_TRACK_FINISHED_PLAYING:
        case PresenceState.TYPE.APP_TRACK_FINISHED_PLAYING:
            state.trackUri    = data["uri"]          || null;
            state.contextUri  = data["context_uri"]  || null;
            state.referrerUri = data["referrer_uri"] || null;
            break;
        case PresenceState.TYPE.APP_ADDED:
            state.appUri = data["app_uri"] || null;
            break;
    }
};

/**
 * [_isStarredPlaylist description]
 * @param  {[type]}  uri [description]
 * @return {Boolean}
 */
function _isStarredPlaylist(uri) {
    var a = ':starred', b = ':publishedstarred';
    return uri.indexOf(a, uri.length - a.length) !== -1 || uri.indexOf(b, uri.length - b.length) !== -1;
}

/**
 * [_subscribeToUsers description]
 * @param  {[type]} usernames [description]
 * @return {[type]}
 */
function _subscribeToUsers(usernames) {
    var batchNext, batchRequest;
    var SUBSCRIPTION_BATCH_SIZE = 300;
    var batch = null;
    var batchStart = 0;
    var batchRequests = Math.ceil(usernames.length / SUBSCRIPTION_BATCH_SIZE);
    batchNext = function() {
        batch = usernames.slice(batchStart, batchStart + SUBSCRIPTION_BATCH_SIZE);
        batchStart += SUBSCRIPTION_BATCH_SIZE;
        // console.log("Requesting batch... " + batchRequests + " remaining.", batch);
        batchRequest(batch);
    };
    batchRequest = function(_batch) {
        sp.core.getHermes("SUB", "hm://presence/user/", _batch, {
            onSuccess: function () {},
            onFailure: function () {},
            onComplete: function () {
                if (--batchRequests > 0) {
                    setTimeout(batchNext, 500);
                }
            }
        });
    };

    // First batch of subs.
    batchNext();
}

/**
 * [_presenceUpdated description]
 * @param  {[type]} event [description]
 * @return {[type]}
 */
function _presenceUpdated(event) {
    var uri = event.data[0];

    if (uri.indexOf("hm://presence/user/") === 0) {
        var username = uri.slice("hm://presence/user/".length, -1);
        var data     = sp.core.parseHermesReply("PresenceState", event.data[1]);
        var states   = _extractPresenceStates(username, data);

        if (states.length) {
            _observedUsers[username](username, states);
        }
    }
}

/**
 * [_extractPresenceStates description]
 * @param  {String} username [description]
 * @param  {Object} data     [description]
 * @return {Array}
 */
function _extractPresenceStates(username, data) {
    if (!data)
        return [];

    var user   = social.getUserByUsername(username);
    var type   = PresenceState.TYPE.UNKNOWN;
    var states = [];

    if (!user)
        return states;

    for (var name in data) {
        if (data.hasOwnProperty(name) && data[name].timestamp > 0) {
            type = PresenceState.getType(data, name, user);
            states.push(new PresenceState(data[name], type, user));
        }
    }

    _cachedPresences[username] = states;
    _saveCacheLater();

    return states;
}

/**
 * [_getUsername description]
 * @param  {[type]} user [description]
 * @return {String}
 */
function _getUsername(user) {
    if (user.hasOwnProperty("canonicalUsername")) {
        return user.canonicalUsername;
    } else if (typeof user === "string") {
        return  user;
    } else {
        throw "Invalid arguments: no user or username provided";
    }
}

/**
 * [_getCachedPresenceForUsers description]
 * @param  {Array} usernames [description]
 * @return {Object}
 */
function _getCachedPresenceForUsers(usernames) {
    var cachedData = {};

    for (var i = 0; i < usernames.length; i++) {
        var username = usernames[i];

        if (!username.length)
            continue;

        var states = _cachedPresences[username];

        if (states instanceof Array) {
            cachedData[username] = states;
        }
        else {
            _cachedPresences[username] = null;
        }
    }

    _saveCacheLater();

    return cachedData;
}

/**
 * Shuffle an array (modified the original array).
 *
 * @param {Array} xs Array to shuffle.
 * @return {Array} The array.
 */
function _fyShuffle(xs) {
    var i = xs.length;
    var j, tmpi, tmpj;
    if (0 === i) return xs;
    while (--i) {
        j = ~~(Math.random() * (i + 1));
        tmpi = xs[i];
        tmpj = xs[j];
        xs[i] = tmpj;
        xs[j] = tmpi;
    }
    return xs;
}

/**
 * [getPresenceForUser description]
 * @param  {[type]}   user     [description]
 * @param  {Function} callback [description]
 */
function getPresenceForUser(user, callback) {
    getPresenceForUsers([_getUsername(user)], callback, 1);
}

/**
 * [getPresenceForUsers description]
 * @param  {Array}    usernames [description]
 * @param  {Function} callback  [description]
 * @param  {Number}   max       [description]
 */
function getPresenceForUsers(usernames, callback, max) {
    var finalData         = _getCachedPresenceForUsers(usernames);
    var uncachedUsernames = [];

    max = max || PRESENCE_BATCH_DEFAULT_MAX;

    // Create array of uncached usernames.
    for (var i = 0; i < usernames.length; i++) {
        var username = usernames[i];

        if (!finalData[username]) {
            uncachedUsernames.push(username);
        }
    }

    max = Math.min(max, uncachedUsernames.length);

    if (!uncachedUsernames.length || Object.keys(finalData).length >= max) {
        // console.log("Already got enough cached data!", finalData);
        callback(finalData);
        return;
    }

    _fyShuffle(uncachedUsernames);

    // Devide uncached usernames into batches of PRESENCE_BATCH_SIZE.
    var batch         = null;
    var batchStart    = 0;
    var batchRequests = Math.ceil(uncachedUsernames.length / PRESENCE_BATCH_SIZE);
    var batchNext, batchRequest;
    batchNext     = function() {
        batch       = uncachedUsernames.slice(batchStart, batchStart + PRESENCE_BATCH_SIZE);
        batchStart += PRESENCE_BATCH_SIZE;
        // console.log("Requesting batch... " + batchRequests + " remaining.", batch);
        batchRequest(batch);
    };
    batchRequest  = function(_batch) {
        sp.core.getHermes("GET", "hm://presence/user/", _batch, {
            onSuccess: function () {
                for (var i = 0; i < arguments.length; ++i) {
                    var username = _batch[i];
                    var data     = sp.core.parseHermesReply("PresenceState", arguments[i]);
                    var states   = _extractPresenceStates(username, data);

                    if (states.length) {
                        finalData[username] = states;
                    }
                    else {
                        delete finalData[username];
                    }
                }
            },
            onFailure: function () {},
            onComplete: function () {
                if (Object.keys(finalData).length >= max) {
                    // console.log("Sending data of length " + Object.keys(finalData).length);
                    callback(finalData);
                }
                else if (--batchRequests > 0) {
                    setTimeout(batchNext, PRESENCE_BATCH_INTERVAL);
                }
            }
        });
    };

    batchNext();
}

/**
 * [observePresenceForUser description]
 * @param  {String}   user             [description]
 * @param  {Function} callback         [description]
 * @param  {Boolean}  getCurrentState  [description]
 * @param  {Boolean}  forceResubscribe [description]
 */
function observePresenceForUser(user, callback, getCurrentState, forceResubscribe) {
    observePresenceForUsers([_getUsername(user)], callback, getCurrentState, forceResubscribe);
}

/**
 * [observePresenceForUsers description]
 * @param  {Array}    usernames        [description]
 * @param  {Function} callback         [description]
 * @param  {Boolean}  getCurrentState  [description]
 * @param  {Boolean}  forceResubscribe [description]
 */
function observePresenceForUsers(usernames, callback, getCurrentState, forceResubscribe) {
    var newUsers = [];

    // console.log('getCurrentState: ', getCurrentState);
    if (getCurrentState) {
        getPresenceForUsers(usernames, callback, PRESENCE_BATCH_DEFAULT_MAX);
    }

    for (var i in usernames) {
        var username = usernames[i];

        if (!username.length)
            continue;

        if (forceResubscribe || !_observedUsers[username])
            newUsers.push(username);

        _observedUsers[username] = callback;
    }

    if (newUsers.length)
        _subscribeToUsers(newUsers);
}

/**
 * [getMostRecentPresence description]
 * @param  {[type]} states [description]
 * @return {[type]}
 */
function getMostRecentPresence(states) {
    if (!states) {
        return null;
    }
    var state = null;

    for (var i = 0, l = states.length; i < l; ++i) {
        var next_state = states[i];
        if (!state || next_state.timestamp > state.timestamp)
            state = next_state;
    }

    return state;
}

/**
 * Function to create presence state for Facebook Activities which appear
 * in Feed.
 *
 * @param  {Integer} userId
 * @return {Object} state
 */
function createStateForFacebookActivity(userId) {
    return new PresenceState(
        { timestamp: Date.now() / 1000 },
        PresenceState.TYPE.FACEBOOK_ACTIVITY,
        social.getUserByFacebookUid(userId)
    );
}
