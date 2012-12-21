/**
 * @fileoverview Functionality for communicating with the Presence service.
 */

'use strict';

var sp = getSpotifyApi();

// Imports
var models = sp.require('$api/models');
var storage = sp.require('$util/storage');
var social = sp.require('$unstable/social');

// This is required for registering protobuf definitions.
sp.require('$unstable/hermes');

// Constants
var PRESENCE_CACHE_KEY = 'cachedPresences';
var PRESENCE_CACHE_SAVE_TIMEOUT = 1000;
var PRESENCE_BATCH_SIZE = 15;
var PRESENCE_BATCH_INTERVAL = 1000;
var PRESENCE_BATCH_DEFAULT_MAX = 30;
var APP_BLACKLIST = {
  'album': true,
  'album-header': true,
  'artist': true,
  'feed': true,
  'finder': true,
  'home': true,
  'notification-popup': true,
  'og-popup': true,
  'onboarding-popup': true,
  'people': true,
  'profile': true,
  'profile-header': true,
  'playlist-header': true,
  'search-dropdown': true,
  'search-header': true,
  'subscribe-popup': true,
  'tutorial': true
};
var MAX_NUMBER_OF_REFRESHES = 3;

// Regular expression for matching spotify:app:(app_name)
var APP_REGEX = new RegExp(/^spotify:app:([^:]*)(:|$)/);

// Exports
exports.createStateForFacebookActivity = createStateForFacebookActivity;
exports.getMostRecentPresence = getMostRecentPresence;
exports.getPresenceForUser = getPresenceForUser;
exports.getPresenceForUsers = getPresenceForUsers;
exports.observePresenceForUser = observePresenceForUser;
exports.observePresenceForUsers = observePresenceForUsers;
exports.PresenceState = PresenceState;


// Private variables
var _cachedPresences = storage.getWithDefault(PRESENCE_CACHE_KEY, {});
var _observedUsers = {};

// Caching
var _saveCacheTimeout = 0;
var _saveCacheNow = function() {
  storage.set(PRESENCE_CACHE_KEY, _cachedPresences);
};
var _saveCacheLater = function() {
  if (_saveCacheTimeout) {
    clearTimeout(_saveCacheTimeout);
  }
  _saveCacheTimeout = setTimeout(_saveCacheNow, PRESENCE_CACHE_SAVE_TIMEOUT);
};

// Events
sp.core.addEventListener('hermes', _presenceUpdated, false);
window.addEventListener('beforeunload', _saveCacheNow);



/**
 * [PresenceState description].
 * @constructor
 * @param {[type]} data      [description].
 * @param {[type]} type      [description].
 * @param {[type]} user      [description].
 */
function PresenceState(data, type, user) {
  this.type = type;
  this.user = user;
  this.timestamp = data.timestamp;

  this.trackUri = null;
  this.playlistUri = null;
  this.albumUri = null;
  this.artistUri = null;
  this.referrerUri = null;
  this.contextUri = null;
  this.appUri = null;
  this.message = null;

  PresenceState.extractURIs(this, data);

  return this;
}


/**
 * Enum for types of presence states.
 * @enum {number}
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
  RADIO_TRACK_FINISHED_PLAYING: 9,
  TRACK_STARTED_PLAYING: 10,
  TRACK_SHARED: 11,
  PLAYLIST_SHARED: 12,
  ALBUM_SHARED: 13,
  ARTIST_SHARED: 14

};


/**
 * [getType description]
 * @param {Object} data [description].
 * @param {string} name [description].
 * @param {Object} user [description].
 * @return {PresenceState.TYPE} type [description].
 */
PresenceState.getType = function(data, name, user) {
  switch (name) {
    case 'track_started_playing':
      return PresenceState.TYPE.TRACK_STARTED_PLAYING;
    case 'track_finished_playing':
      var uri = data[name].referrer_uri;
      var match = APP_REGEX.exec(uri);
      if (match) {
        var appName = match[1];
        if (appName && !APP_BLACKLIST[appName]) {
          if (appName == 'radio')
            return PresenceState.TYPE.RADIO_TRACK_FINISHED_PLAYING
          else
            return PresenceState.TYPE.APP_TRACK_FINISHED_PLAYING;
        }
      }
      return PresenceState.TYPE.TRACK_FINISHED_PLAYING;
    case 'playlist_track_added':
      if (data[name].playlist_uri &&
          _isStarredPlaylist(data[name].playlist_uri)) {
        return PresenceState.TYPE.PLAYLIST_TRACK_STARRED;
      }
      return PresenceState.TYPE.PLAYLIST_TRACK_ADDED;
    case 'playlist_published':
      var owner = data[name].uri.split(':')[2];
      if (owner === user.canonicalUsername) {
        return PresenceState.TYPE.PLAYLIST_PUBLISHED;
      } else if (owner === sp.core.user.canonicalUsername) {
        return PresenceState.TYPE.MY_PLAYLIST_SUBSCRIBED;
      }
      return PresenceState.TYPE.PLAYLIST_SUBSCRIBED;
    case 'favorite_app_added':
      return PresenceState.TYPE.APP_ADDED;
    case 'facebook_activity':
      return PresenceState.TYPE.FACEBOOK_ACTIVITY;
    case 'uri_shared':
      if (_isTrack(data[name].uri)) {
        return PresenceState.TYPE.TRACK_SHARED;
      } else if (_isPlaylist(data[name].uri)) {
        return PresenceState.TYPE.PLAYLIST_SHARED;
      } else if (_isAlbum(data[name].uri)) {
        return PresenceState.TYPE.ALBUM_SHARED;
      } else if (_isArtist(data[name].uri)) {
        return PresenceState.TYPE.ARTIST_SHARED;
      } else {
        return PresenceState.TYPE.UNKNOWN;
      }
    default:
      return PresenceState.TYPE.UNKNOWN;
  }
};

/**
 * Retrieve all available URIs for a presence event
 * @param {[type]} state [description].
 * @param {[type]} data [description].
 */
PresenceState.extractURIs = function(state, data) {
  switch (state.type) {
    case PresenceState.TYPE.PLAYLIST_PUBLISHED:
    case PresenceState.TYPE.PLAYLIST_SUBSCRIBED:
    case PresenceState.TYPE.MY_PLAYLIST_SUBSCRIBED:
      state.playlistUri = data['uri'] || null;
      break;
    case PresenceState.TYPE.PLAYLIST_TRACK_ADDED:
    case PresenceState.TYPE.PLAYLIST_TRACK_STARRED:
      state.trackUri = data['track_uri'] || null;
      state.playlistUri = data['playlist_uri'] || null;
      break;
    case PresenceState.TYPE.TRACK_STARTED_PLAYING:
    case PresenceState.TYPE.TRACK_FINISHED_PLAYING:
    case PresenceState.TYPE.RADIO_TRACK_FINISHED_PLAYING:
    case PresenceState.TYPE.APP_TRACK_FINISHED_PLAYING:
      state.trackUri = data['uri'] || null;
      state.contextUri = data['context_uri'] || null;
      state.referrerUri = data['referrer_uri'] || null;
      break;
    case PresenceState.TYPE.APP_ADDED:
      state.appUri = data['app_uri'] || null;
      break;
    case PresenceState.TYPE.TRACK_SHARED:
      state.trackUri = data['uri'] || null;
      state.message = data['message'] || ''; // default is empty message
      break;
    case PresenceState.TYPE.PLAYLIST_SHARED:
      state.playlistUri = data['uri'] || null;
      state.message = data['message'] || ''; // default is empty message
      break;
    case PresenceState.TYPE.ALBUM_SHARED:
      state.albumUri = data['uri'] || null;
      state.message = data['message'] || ''; // default is empty message
      break;
    case PresenceState.TYPE.ARTIST_SHARED:
      state.artistUri = data['uri'] || null;
      state.message = data['message'] || ''; // default is empty message
      break;
  }
};


/**
 * Check whether or not the uri is a starred playlist.
 * @param {string} uri a Spotify URI.
 * @return {boolean} true if uri is a starred playlist, otherwise false.
 * @private
 */
function _isStarredPlaylist(uri) {
  var a = ':starred', b = ':publishedstarred';
  return uri.indexOf(a, uri.length - a.length) !== -1 ||
      uri.indexOf(b, uri.length - b.length) !== -1;
}

/**
 * Check whether or not the uri is a track.
 * @param {string} uri a Spotify URI.
 * @return {boolean} true if uri is a track, otherwise false.
 * @private
 */
function _isTrack(uri) {
  var a = 'spotify:track:';
  return uri.indexOf(a) === 0;
}

/**
 * Check whether or not the uri is a playlist.
 * @param {string} uri a Spotify URI.
 * @return {boolean} true if uri is a (starred) playlist, otherwise false.
 * @private
 */
function _isPlaylist(uri) {
  var a = 'spotify:user:', b = ':playlist:';
  return (uri.indexOf(a) === 0 && uri.indexOf(b) !== -1) ||
      _isStarredPlaylist(uri);
}

/**
 * Check whether or not the uri is an album.
 * @param {string} uri a Spotify URI.
 * @return {boolean} true if uri is an album, otherwise false.
 * @private
 */
function _isAlbum(uri) {
  var a = 'spotify:album:';
  return uri.indexOf(a) === 0;
}

/**
 * Check whether or not the uri is an artist.
 * @param {string} uri a Spotify URI.
 * @return {boolean} true if uri is an artist, otherwise false.
 * @private
 */
function _isArtist(uri) {
  var a = 'spotify:artist:';
  return uri.indexOf(a) === 0;
}

/**
 * Subscribe to users.
 * @param {Array} usernames [description].
 * @private
 */
function _subscribeToUsers(usernames) {
  var batchNext, batchRequest;
  var SUBSCRIPTION_BATCH_SIZE = 300;
  var batchStart = 0;
  var batchRequests = Math.ceil(usernames.length / SUBSCRIPTION_BATCH_SIZE);

  batchNext = function() {
    var batch = usernames.slice(batchStart, batchStart + SUBSCRIPTION_BATCH_SIZE);
    batchStart += SUBSCRIPTION_BATCH_SIZE;
    batchRequest(batch);
  };

  batchRequest = function(_batch) {
    sp.core.getHermes('SUB', 'hm://presence/user/', _batch, {
      onSuccess: function() {},
      onFailure: function() {},
      onComplete: function() {
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
 * @param {[type]} event [description].
 * @private
 */
function _presenceUpdated(event) {
  var uri = event.data[0];

  if (uri.indexOf('hm://presence/user/') === 0) {
    var username = uri.slice('hm://presence/user/'.length, -1);
    var data = sp.core.parseHermesReply('PresenceState', event.data[1]);
    var states = _extractPresenceStates(username, data);

    if (states.length) {
      _observedUsers[username](username, states);
    }
  }
}


/**
 * [_extractPresenceStates description]
 * @param {string} username [description].
 * @param {Object} data [description].
 * @return {Array} [description].
 * @private
 */
function _extractPresenceStates(username, data) {
  if (!data) {
    return [];
  }

  var user = models.User.fromURI('spotify:user:' + username);
  var type = PresenceState.TYPE.UNKNOWN;
  var states = [];

  if (!user || !user.loaded) {
    return states;
  }

  for (var name in data) {
    if (data.hasOwnProperty(name) && data[name].timestamp > 0) {
      type = PresenceState.getType(data, name, user.data);
      states.push(new PresenceState(data[name], type, user.data));
    }
  }

  _cachedPresences[username] = {
    refreshCounter: 0,
    states: states
  };

  _saveCacheLater();

  return states;
}


/**
 * [_getUsername description]
 * @param {[type]} user [description].
 * @return {string} [description].
 * @private
 */
function _getUsername(user) {
  if (user.hasOwnProperty('canonicalUsername')) {
    return user.canonicalUsername;
  } else if (typeof user === 'string') {
    return user;
  } else {
    throw 'Invalid arguments: no user or username provided';
  }
}


/**
 * [_getCachedPresenceForUsers description]
 * @param {Array} usernames [description].
 * @return {Object} [description].
 * @private
 */
function _getCachedPresenceForUsers(usernames) {
  var cachedData = {};

  for (var i = 0; i < usernames.length; i++) {
    var username = usernames[i];

    if (!username.length) {
      continue;
    }

    var states;
    if (_cachedPresences[username]) {
      states = _cachedPresences[username].states;

      if (states instanceof Array) {
        cachedData[username] = states;

        if (states[0]) {
          // Name and image might not be loaded for FB users
          if (_cachedPresences[username].refreshCounter < MAX_NUMBER_OF_REFRESHES &&
              states[0].user.name === states[0].user.username) {

            // not waiting for load event, trying to get data which is already available in the client
            var updatedUser = models.User.fromURI(states[0].user.uri);

            if (updatedUser.data.facebookUid !== states[0].user.facebookUid) {
              // Updates user object for states if FB data loaded
              for (var j = 0, l = states.length; j < l; j++) {
                states[j].user = updatedUser.data;
              }
            }
            _cachedPresences[username].refreshCounter++;
          }
        }
      }
    } else {
      _cachedPresences[username] = null;
    }
  }

  _saveCacheLater();

  return cachedData;
}


/**
 * Shuffle an array (modifying the original array in place).
 *
 * @param {Array} xs Array to shuffle.
 * @return {Array} The array.
 * @private
 */
function _fyShuffle(xs) {
  var i = xs.length;
  var j, tmpi, tmpj;

  if (0 === i) {
    return xs;
  }

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
 * @param {[type]} user [description].
 * @param {Function} callback [description].
 */
function getPresenceForUser(user, callback) {
  getPresenceForUsers([_getUsername(user)], callback, 1);
}


/**
 * [getPresenceForUsers description]
 * @param {Array} usernames [description].
 * @param {Function} callback [description].
 * @param {number} max [description].
 */
function getPresenceForUsers(usernames, callback, max) {
  var finalData = _getCachedPresenceForUsers(usernames);
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
    callback(finalData);
    return;
  }

  _fyShuffle(uncachedUsernames);

  // Devide uncached usernames into batches of PRESENCE_BATCH_SIZE.
  var batchNext, batchRequest;
  var batchStart = 0;
  var batchRequests = Math.ceil(uncachedUsernames.length / PRESENCE_BATCH_SIZE);

  batchNext = function() {
    var batch = uncachedUsernames.slice(batchStart, batchStart + PRESENCE_BATCH_SIZE);
    batchStart += PRESENCE_BATCH_SIZE;
    // Execute batch
    batchRequest(batch);
  };

  batchRequest = function(_batch) {
    sp.core.getHermes('GET', 'hm://presence/user/', _batch, {
      onSuccess: function() {
        for (var i = 0; i < arguments.length; ++i) {
          var username = _batch[i];
          var data = sp.core.parseHermesReply('PresenceState', arguments[i]);
          var states = _extractPresenceStates(username, data);

          if (states.length) {
            finalData[username] = states;
          } else {
            delete finalData[username];
          }
        }
      },
      onFailure: function() {},
      onComplete: function() {
        if (Object.keys(finalData).length < max && --batchRequests > 0) {
          setTimeout(batchNext, PRESENCE_BATCH_INTERVAL);
        } else {
          callback(finalData);
        }
      }
    });
  };

  // Execute first batch
  batchNext();
}


/**
 * [observePresenceForUser description]
 * @param {string} user [description].
 * @param {Function} callback [description].
 * @param {boolean} getCurrentState [description].
 * @param {boolean} forceResubscribe [description].
 */
function observePresenceForUser(user, callback, getCurrentState, forceResubscribe) {
  observePresenceForUsers([_getUsername(user)], callback, getCurrentState, forceResubscribe);
}


/**
 * [observePresenceForUsers description]
 * @param {Array} usernames [description].
 * @param {Function} callback [description].
 * @param {boolean} getCurrentState [description].
 * @param {boolean} forceResubscribe [description].
 */
function observePresenceForUsers(usernames, callback, getCurrentState, forceResubscribe) {
  var newUsers = [];

  if (getCurrentState) {
    getPresenceForUsers(usernames, callback, PRESENCE_BATCH_DEFAULT_MAX);
  }

  for (var i in usernames) {
    var username = usernames[i];

    if (!username.length) {
      continue;
    }

    if (forceResubscribe || !_observedUsers[username]) {
      newUsers.push(username);
    }

    _observedUsers[username] = callback;
  }

  // Possible resub w/ empty array
  if (newUsers.length) {
    _subscribeToUsers(newUsers);
  }
}


/**
 * [getMostRecentPresence description]
 * @param {Object} states [description].
 * @return {Object} state [description].
 */
function getMostRecentPresence(states) {
  if (!states) {
    return null;
  }
  var state = null;

  for (var i = 0, l = states.length; i < l; ++i) {
    var next_state = states[i];
    if (!state || next_state.timestamp > state.timestamp) {
      state = next_state;
    }
  }

  return state;
}


/**
 * Function to create presence state for Facebook Activities which appear
 * in Feed.
 *
 * @param {number} userId [description].
 * @return {Object} state [description].
 */
function createStateForFacebookActivity(userId) {
  return new PresenceState(
      {timestamp: Date.now() / 1000},
      PresenceState.TYPE.FACEBOOK_ACTIVITY,
      social.getUserByFacebookUid(userId));
}
