/**
 * @fileoverview The logic for the notifications application.
 */

'use strict';
var sp = getSpotifyApi();
var filesystem = sp.require('$util/fs'),
    lang = sp.require('$util/language'),
    models = sp.require('$api/models'),
    dom = sp.require('$util/dom'),
    r = sp.require('$util/react'),
    logger = sp.require('$util/logger'),
    storage = sp.require('$util/storage'),
    proto = sp.require('scripts/proto'),
    nano = sp.require('scripts/nano-scroller-light'),
    langCatalog = lang.loadCatalog('main'),
    translate = lang.getString.bind(lang, langCatalog);

var hermesBaseURL = 'hm://notifications/feed/' + sp.core.user.canonicalUsername + ':inclient/';

/**
 * Types or verbs of notifications we support.
 * @enum {string}
 */
var NOTIFICATION_TYPE = {
  playlistSubscribe: 'playlist-sub',
  newFollower: 'new-follower',
  friendJoined: 'user-signup',
  playlistUpdated: 'playlist-update'
  //albumReleased: 'album-release'
};

var SUB_TYPE = {
  none: 'none',
  starredSubscribe: 'starred',
  toplistSubscribe: 'toplist'
};

/**
 * The various states of a notification.
 * @enum {string}
 */
var LOAD_STATE = {
  unloaded: 'unloaded',
  loading: 'loading',
  loaded: 'loaded',
  failed: 'failed'
};

var L_LEVEL = {
  reg: -1,
  prod: 0,
  debug: 1,
  ver: 2
};

var MAX_CACHE_SIZE = 500;

var CACHE_STORAGE_KEY = 'notifications';

/**
 * What log level to show. The shipping app should only have L_LEVEL.reg. This prints nothing to the console but continues analytics logging.
 */
var CURRENT_LOG_LEVEL = L_LEVEL.reg;


/**
 * Clones an object
 * @param {Object} original The thing to clone.
 * @return {Object} The clone.
 */
function clone(original) {
  if (!original) return null;
  var newObj = (original instanceof Array) ? [] : {};
  for (var i in original) {
    if (original[i] && typeof original[i] == 'object') {
      newObj[i] = clone(original[i]);
    } else {
      newObj[i] = original[i];
    }
  }
  return newObj;
}

/**
 * Logs something, both for debugging and analytics
 * @param {number} level The log level (eg prod, debug verbose).
 * @param {string} title Event title.
 * @param {Object} info OPTIONAL: The main info to log may be string or dict.
 * @param {number} eventVersion OPTIONAL: For the analytics logger. If none is supplied goes to 1.
 * @param {number} testVersion OPTIONAL: The log level. If none is supplied goes to 1.

 */
function sLog(level, title, info, eventVersion, testVersion) {
  eventVersion = eventVersion ? '' + eventVersion : '1';
  testVersion = testVersion ? '' + testVersion : '1';
  if (level <= CURRENT_LOG_LEVEL) {
    if (title) console.log(title);
    if (info) console.log(info);
  }
  if (level == L_LEVEL.prod && title) {
    info = info ? info : {};
    logger.logClientEvent('notification center', title, eventVersion, testVersion, info);
  }
}

/**
 * A representation of a notification
 * @constructor
 * @param {Object} data The acutal hermes JS object or the cached data.
 * @param {boolean} isCachedData Is this cache data we are reheating?
 */
function Notification(data, isCachedData) {
  // Saved/cached data
  if (isCachedData) {
    this.notificationVerb = data.notificationVerb;
    this.sendersData = clone(data.sendersData);
    this.senderTotal = data.senderTotal;
    this.state = clone(data.state);
    this.playlistSubObjects = clone(data.playlistSubObjects);
    this.trackAddObjects = clone(data.trackAddObjects);
    this.albumReleaseObjects = clone(data.albumReleaseObjects);
  }
  else {
    var icd = data.in_client_data;
    this.notificationVerb = icd.notification_verb;
    this.sendersData = clone(icd.subject);
    this.senderTotal = icd.subject_total;
    this.state = clone(icd.state);
    this.playlistSubObjects = clone(icd.playlist_sub_object);
    this.trackAddObjects = clone(icd.track_add_object);
    this.albumReleaseObjects = clone(icd.album_release_object);
  }

  // Data that needs to be loaded
  this.loadedModels = {};

  this.subType = SUB_TYPE.none;

  // Helper info for async loading
  this.outstandingCallbacks = 0;
  this.failureTimeout = null;
  this.loadSuccessCallback = null;
  this.loadFailureCallback = null;
  this.loadState = LOAD_STATE.unloaded;

  this.MAX_SENDERS = 3;
  this.MAX_PLAYLISTS = 3;
  this.TIMEOUT_LENGTH = 2000;
  return this;
}

/**
 * Tell the notification to load the auxillary info it needs.
 * Things like sender, and playlist full info.
 * @param {function(Notification)} success Success callback.
 * @param {function(Notification)} failure Failure callback.
 */
Notification.prototype.loadNodeInfo = function(success, failure) {
  function loadPlaylist(uri, _this) {
    if ((_this.notificationVerb == NOTIFICATION_TYPE.playlistSubscribe || _this.notificationVerb == NOTIFICATION_TYPE.playlistUpdated) &&
        uri.indexOf(SUB_TYPE.starredSubscribe, uri.length - SUB_TYPE.starredSubscribe.length) !== -1) {
      // This is a starred list.
      _this.subType = SUB_TYPE.starredSubscribe;
      _this.loadFinished();
    }
    else if ((_this.notificationVerb == NOTIFICATION_TYPE.playlistSubscribe || _this.notificationVerb == NOTIFICATION_TYPE.playlistUpdated) &&
        uri.indexOf(SUB_TYPE.toplistSubscribe, uri.length - SUB_TYPE.toplistSubscribe.length) !== -1) {
      // This is a toplist list.
      _this.subType = SUB_TYPE.toplistSubscribe;
      _this.loadFinished();
    } else {
      models.Playlist.fromURI(uri, function(model) { _this.loadFinished(model); });
    }
  }

  function loadAlbum(uri, _this) {
    models.Album.fromURI(uri, function(model) {
      _this.loadFinished(model);
    });
  }

  if (this.loadState != LOAD_STATE.unloaded) {
    if (this.loadState == LOAD_STATE.loaded) {
      success(this);
    } else if (this.loadState == LOAD_STATE.failed) {
      failure(this);
    }
    return;
  }

  var i, _this = this;

  this.loadState = LOAD_STATE.loading;
  this.loadSuccessCallback = success;
  this.loadFailureCallback = failure;
  this.outstandingCallbacks = Math.min(this.sendersData ? this.sendersData.length : 0, this.MAX_SENDERS) +
                              Math.min(this.playlistSubObjects ? this.playlistSubObjects.length : 0, this.MAX_PLAYLISTS) +
                              Math.min(this.trackAddObjects ? this.trackAddObjects.length : 0, this.MAX_PLAYLISTS) +
                              (this.albumReleaseObjects ? this.albumReleaseObjects.length : 0);

  if (this.outstandingCallbacks == 0) {
    this.loadFinished();
    return;
  }

  this.failureTimeout = setTimeout(function() { _this.timeoutHit(); }, this.TIMEOUT_LENGTH);

  if (this.sendersData) {
    for (i = 0; i < this.sendersData.length && i < this.MAX_SENDERS; i++) {
      models.User.fromURI('spotify:user:' + this.sendersData[i].canonical_username, function(model) { _this.loadFinished(model); });
    }
  }
  if (this.playlistSubObjects) {
    for (i = 0; i < this.playlistSubObjects.length && i < this.MAX_PLAYLISTS; i++) {
      loadPlaylist(this.playlistSubObjects[i].uri, this);
    }
  }
  if (this.trackAddObjects) {
    for (i = 0; i < this.trackAddObjects.length && i < this.MAX_PLAYLISTS; i++) {
      loadPlaylist(this.trackAddObjects[i].uri, this);
    }
  }
  if (this.albumReleaseObjects) {
    for (i = 0; i < this.albumReleaseObjects.length; i++) {
      loadAlbum('spotify:album:' + this.albumReleaseObjects[i].album_gid, this);
    }
  }

};

/**
 * Method for load failure due to timeout.
 */
Notification.prototype.timeoutHit = function() {
  sLog(L_LEVEL.debug, 'notification-load-timeout');
  this.loadState = LOAD_STATE.failed;
  this.loadFailureCallback(this);
};

/**
 * Callback for a model that has finished loading.
 * @param {Object} model A model that has finish loading (like a user or a playlist).
 */
Notification.prototype.loadFinished = function(model) {
  if (this.loadState != LOAD_STATE.loading)
    return;

  if (model)
    this.loadedModels[decodeURIComponent(model.uri)] = model;
  this.outstandingCallbacks--;

  if (this.outstandingCallbacks > 0)
    return;
  clearTimeout(this.failureTimeout);
  this.failureTimeout = null;
  this.loadState = LOAD_STATE.loaded;
  // We are all done loading
  this.loadSuccessCallback(this);
};

/**
 * Gets string used in growl notifications and the like.
 * @return {Array} Title and description.
 */
Notification.prototype.getStringArrayForSystemNotification = function() {
  var retVal = [];
  switch (this.notificationVerb) {
    case NOTIFICATION_TYPE.playlistSubscribe: {
      retVal.push(translate('systemNotifications', 'sTitlePlaylistSubscribe'));
      retVal.push(lang.format(translate('systemNotifications', 'sBodyPlaylistSubscribe'), this.getSenderDisplayName()));
    }
    break;
    case NOTIFICATION_TYPE.newFollower: {
      retVal.push(translate('systemNotifications', 'sTitleNewFollower'));
      retVal.push(lang.format(translate('systemNotifications', 'sBodyNewFollower'), this.getSenderDisplayName()));
    }
    break;
    case NOTIFICATION_TYPE.friendJoined: {
      retVal.push(translate('systemNotifications', 'sTitleFriendJoined'));
      retVal.push(lang.format(translate('systemNotifications', 'sBodyFriendJoined'), this.getSenderDisplayName()));
    }
    break;
    case NOTIFICATION_TYPE.playlistUpdated: {
      retVal.push(translate('systemNotifications', 'sTitlePlaylistUpdated'));
      retVal.push(lang.format(translate('systemNotifications', 'sBodyPlaylistUpdated'), this.getSenderDisplayName()));
    }
    break;
  }
  return retVal.length == 2 ? retVal : [];
};

/**
 * Get primary sender display name
 * @return {Object} New DOM element.
 */
Notification.prototype.getSenderDisplayName = function() {
  var sender = this.sendersData[0];
  var name = sender.real_name;
  if (!name || name.length == 0) {
    var loadedObject = this.loadedModels['spotify:user:' + sender.canonical_username];
    name = loadedObject && loadedObject.data && loadedObject.data.name && loadedObject.data.name.length > 0 ?
            loadedObject.data.name : sender.canonical_username;
  }
  return name;
};

/**
 * Creates a DOM node for the notification
 * @return {Object} New DOM element.
 */
Notification.prototype.createNode = function() {
  function prepString(string) {
    if (string.length > 75) {
      string = string.substring(0, 74) + '…';
    }
    return string;
  }

  function getSubjectTag(_this) {
    switch (_this.notificationVerb) {
      case NOTIFICATION_TYPE.playlistSubscribe:
      case NOTIFICATION_TYPE.newFollower:
      case NOTIFICATION_TYPE.friendJoined:
      case NOTIFICATION_TYPE.playlistUpdated:
        return '<a href="spotify:user:' + _this.sendersData[0].canonical_username + '" class="senderName">' +
            prepString(_this.getSenderDisplayName()) + '</a>';
      case NOTIFICATION_TYPE.albumReleased:
        var albumuri = 'spotify:album:' + _this.albumReleaseObjects[0].album_gid;
        var albumname = _this.albumReleaseObjects[0].album_name;
        return '<a href="' + albumuri + '" class="senderName">' +
            prepString(albumname) + '</a>';
    }
  }

  function getSecondaryActionLink(_this) {
    switch (_this.notificationVerb) {
      case NOTIFICATION_TYPE.playlistUpdated: {
        return _this.trackAddObjects[0].uri;
      }
      case NOTIFICATION_TYPE.playlistSubscribe: {
        return _this.playlistSubObjects[0].uri;
      }
      case NOTIFICATION_TYPE.albumReleased: {
        return 'spotify:album:' + _this.albumReleaseObjects[0].album_gid;
      }
      case NOTIFICATION_TYPE.newFollower:
      case NOTIFICATION_TYPE.friendJoined:
        return 'spotify:user:' + _this.sendersData[0].canonical_username;
    }
  }

  function getObjectTag(_this) {
    switch (_this.notificationVerb) {
      case NOTIFICATION_TYPE.playlistUpdated: {
        var objectName = null, objectUri;
        objectUri = _this.trackAddObjects[0].uri;
        if (_this.subType == SUB_TYPE.starredSubscribe) {
          objectName = translate('notifications', 'sNotificationBodyStarredTracksUpdatedName');
        }
        else if (_this.subType == SUB_TYPE.toplistSubscribe) {
          objectName = translate('notifications', 'sNotificationBodyToplistUpdatedName');
        }
        else if (_this.loadedModels[decodeURIComponent(_this.trackAddObjects[0].uri)]) {
          objectName = prepString(_this.loadedModels[decodeURIComponent(_this.trackAddObjects[0].uri)].data.name);
        }
        if (!objectName) {
          return '';
        }
        return ' <a href="' + objectUri + '" class="objectName">' + objectName + '</a>';
      }
      case NOTIFICATION_TYPE.playlistSubscribe: {
        if (_this.subType == SUB_TYPE.starredSubscribe || _this.subType == SUB_TYPE.toplistSubscribe) return;
        var object = _this.playlistSubObjects[0],
            loadedObject = _this.loadedModels[decodeURIComponent(object.uri)];
        if (loadedObject)
          return ' <a href="' + object.uri + '" class="objectName">' + prepString(loadedObject.data.name) + '</a>';
        return '';
      }
      case NOTIFICATION_TYPE.albumReleased: {
        var artisturi = 'spotify:artist:' + _this.albumReleaseObjects[0].artist_gid;
        var artistname = prepString(_this.albumReleaseObjects[0].artist_name);
        return ' <a href="' + artisturi + '" class="objectName">' + artistname + '</a>';
      }
      case NOTIFICATION_TYPE.newFollower:
      case NOTIFICATION_TYPE.friendJoined:
        return;
    }
  };

  function getNotificationFormat(_this) {
    switch (_this.notificationVerb) {
      case NOTIFICATION_TYPE.playlistSubscribe: {
        if (_this.subType == SUB_TYPE.starredSubscribe) {
          return translate('notifications', 'sNotificationBodyStarredSubscribe');
        } else if (_this.subType == SUB_TYPE.toplistSubscribe) {
          return translate('notifications', 'sNotificationBodyToplistSubscribe');
        } else {
          return translate('notifications', 'sNotificationBodyPlaylistSubscribe');
        }
      }
      case NOTIFICATION_TYPE.newFollower:
        return translate('notifications', 'sNotificationBodyNewFollower');
      case NOTIFICATION_TYPE.friendJoined:
        return translate('notifications', 'sNotificationBodyFriendJoined');
      case NOTIFICATION_TYPE.playlistUpdated: {
        if (_this.trackAddObjects && _this.trackAddObjects[0] && _this.trackAddObjects[0].track_count == 1) {
          return translate('notifications', 'sNotificationBodyPlaylistUpdatedSingular');
        } else {
          return translate('notifications', 'sNotificationBodyPlaylistUpdatedPlural');
        }
      }
      case NOTIFICATION_TYPE.albumReleased: {
        return translate('notifications', 'sNotificationBodyAlbumReleased');
      }
    }
  }

  function getImageTag(_this) {
    switch (_this.notificationVerb) {
      case NOTIFICATION_TYPE.playlistSubscribe:
      case NOTIFICATION_TYPE.newFollower:
      case NOTIFICATION_TYPE.friendJoined:
      case NOTIFICATION_TYPE.playlistUpdated: {
        var imageUrl, sender = _this.sendersData[0],
            loadedObject = _this.loadedModels['spotify:user:' + sender.canonical_username];
        imageUrl = loadedObject && loadedObject.data.icon && loadedObject.data.icon.length > 0 ?
            loadedObject.data.icon : 'http://aro.spotify.s3.amazonaws.com/emails/notifications/user50x50.png';
        return '<a class="imageLink" href="spotify:user:' + sender.canonical_username +
               '"><div class="image" style="background-image: url(' + imageUrl + ');"></div></a>';
      }
      case NOTIFICATION_TYPE.albumReleased: {
        var albumuri = 'spotify:album:' + _this.albumReleaseObjects[0].album_gid;
        var imageurl = 'http://aro.spotify.s3.amazonaws.com/emails/notifications/user50x50.png';
        if (albumuri in _this.loadedModels) {
          imageurl = _this.loadedModels[albumuri].data.cover;
        }
        return '<a href="' + albumuri + '" class="imageLink">' +
            '<div class="image" style="background-image: url(' + imageurl + ');"></div></a>';

      }
    }
  }

  function getPrimaryActionTitle(_this) {
    return translate('buttons', 'sFollowButtonTitle');
  }

  function getPrimaryActionCompletedTitle(_this) {
    return translate('buttons', 'sFollowedPlaceHolderTitle');
  }

  function getSecondaryActionTitle(_this) {
    return translate('buttons', 'sViewButtonTitle');
  }

  function getCompletionClass(_this) {
    // This this will only be 'uncompleted' when social 2.0 is done
    return 'completed';
  }

  function getTimeLabel(_this) {
    if (!_this.state.notification_id_ms) {
      return '';
    }

    var rightNow, diff, second, minute, hour, day;
    rightNow = new Date();
    diff = rightNow.getTime() - _this.state.notification_id_ms;
    second = 1000;
    minute = second * 60;
    hour = minute * 60;
    day = hour * 24;

    if (isNaN(diff) || diff < 0) {
      return '';
    } else if (diff < second * 2) {
      return translate('time', 'sJustNow');
    } else if (diff < minute) {
      return lang.format(translate('time', 'sSecondsAgo'), [Math.floor(diff / second)]);
    } else if (diff < minute * 2) {
      return translate('time', 's1Minute');
    } else if (diff < hour) {
      return lang.format(translate('time', 'sMinutesAgo'), [Math.floor(diff / minute)]);
    } else if (diff < hour * 2) {
      return translate('time', 's1Hour');
    } else if (diff < day) {
      return lang.format(translate('time', 'sHoursAgo'), [Math.floor(diff / hour)]);
    } else if (diff > day && diff < day * 2) {
      return translate('time', 'sYesterday');
    } else if (diff < day * 365) {
      return lang.format(translate('time', 'sDaysAgo'), [Math.floor(diff / day)]);
    } else {
      return translate('time', 'sOverAYear');
    }
  }

  function getTrackNumber(_this) {
    switch (_this.notificationVerb) {
      case NOTIFICATION_TYPE.playlistUpdated: {
        if (_this.trackAddObjects && _this.trackAddObjects[0]) {
          if (_this.trackAddObjects[0].track_count == 1) {
            return;
          }
          return ' ' + _this.trackAddObjects[0].track_count;
        } else {
          return ' some';
        }
      }
      case NOTIFICATION_TYPE.playlistSubscribe:
      case NOTIFICATION_TYPE.newFollower:
      case NOTIFICATION_TYPE.friendJoined:
      case NOTIFICATION_TYPE.albumReleased:
        return;
    }
  }

  function getBodyHTML(_this) {
    switch (_this.notificationVerb) {
      case NOTIFICATION_TYPE.playlistSubscribe:
      case NOTIFICATION_TYPE.newFollower:
      case NOTIFICATION_TYPE.friendJoined:
      case NOTIFICATION_TYPE.playlistUpdated:
      case NOTIFICATION_TYPE.albumReleased: {
        return lang.format(getNotificationFormat(_this), [getSubjectTag(_this), getObjectTag(_this), getTrackNumber(_this)]);
      }
    }
  }

  var replacements = [
    getImageTag(this),
    getBodyHTML(this),
    getTimeLabel(this),
    getCompletionClass(this),
    getPrimaryActionTitle(this),
    getSecondaryActionTitle(this),
    getPrimaryActionCompletedTitle(this)
  ];

  var node = new dom.Element('div', { html: lang.format(filesystem.readFile('../notification.xml'), replacements) });
  node.className = 'notification ' + this.notificationVerb +
                   (!this.state || !this.state.seen ? ' unread' : '');
  node.id = this.getIdHex();
  node.dataset.timestamp = this.getTimeStamp();
  node.dataset.secondaryActionUrl = getSecondaryActionLink(this);
  return node;
};

/**
 * Simple accessor.
 * @return {string} The Id of the notification.
 */
Notification.prototype.getIdHex = function() {
  return this.state ? this.state.notification_id_hex : null;
};

/**
 * Simple accessor.
 * @return {string} The Timestamp of the notification.
 */
Notification.prototype.getTimeStamp = function() {
  return this.state ? this.state.notification_id_ms : null;
};

/**
 * Updates the state of a notification with another notifications state
 * @param {Object} newState The new state.
 */
Notification.prototype.updateWithNewState = function(newState) {
  // Sanity check to make sure we only ever update a notification with its own state
  if (this.getIdHex() == newState.notification_id_hex) {
    this.state = clone(newState);
  }
};

/**
 * Simple logger.
 * @return {string} Log string.
 */
Notification.prototype.getLog = function() {
  return '      ID   : ' + this.getTimeStamp() + ' | ' + this.getIdHex() + '\n' +
         '      State: ' + this.state.state_id_ms + ' | ' + this.state.state_id_hex + '\n';
};

/**
 * The notification manager
 * @constructor
 * @param {Object} delegate Object which will respond to updates from the notifcation manager.
 */
function NotificationManager(delegate) {
  this.fetchInProgress = false;

  this.unreadCount = 0;

  this.notifications = [];

  this.oldestNoteId = '';
  this.oldestNoteTimestamp;

  this.newestNoteId = '';
  this.newestNoteTimestamp;

  this.notificationDelegate = delegate;

  this.SECONDS_BETWEEN_POLLS = 2;
  this.DEFAULT_PAGE_SIZE = 50;

}

/**
 * Start All Polling, (also resets cache states).
 */
NotificationManager.prototype.startup = function() {
  this.loadCache();
  this.unreadCount = 0;
  this.fetchInProgress = false;
  this.startSubscription();
};

/**
 * Start notification subscription or polling
 */
NotificationManager.prototype.startSubscription = function() {
  var _this = this;

  sp.core.addEventListener('hermes', function(event) { _this.notificationUpdatesReceived(event); }, false);

  sp.core.getHermes('SUB', hermesBaseURL, [], {
    onSuccess: function(message, status) {},
    onFailure: function(errorCode) {
      sLog(L_LEVEL.prod, 'error-subscribe-failed', {'code': errorCode, 'url': hermesBaseURL });
    },
    onComplete: function() {
      _this.getPageOfNotificationsFromServer(null, _this.DEFAULT_PAGE_SIZE, true);
      _this.getBadgeCount();
    }
  });
};

/**
 * Receiver for our notification update subscription.
 * @param {Object} event The received data.
 */
NotificationManager.prototype.notificationUpdatesReceived = function(event) {
  var uri = event.data[0];
  if (uri.indexOf('hm://notifications/feed/') === 0) {
    var data = sp.core.parseHermesReply('Notification', event.data[1]);
    if (data) {
      var newNotifsCount = this.notificationsReceived([data], true);
      newNotifsCount = newNotifsCount && typeof newNotifsCount == 'number' ? newNotifsCount : 0;
      if (newNotifsCount != 0 && this.notificationDelegate && !this.notificationDelegate.showing) {
        this.setBadgeCount(newNotifsCount == -1 ? 0 : this.unreadCount + newNotifsCount);
      }
    }
  }
};

/**
 * Get new badge count. Should only be called at startup, after that we are responsible for keeping the badge count correct.
 */
NotificationManager.prototype.getBadgeCount = function() {
  var _this = this;
  sp.core.getHermes('GET', hermesBaseURL + 'counts', [], {
    onSuccess: function(message) {
      _this.setBadgeCount(sp.core.parseHermesReply('NotificationCounts', message).active);
    },
    onFailure: function(errorCode) {
      sLog(L_LEVEL.prod, 'error-badge-count-get-failed', {'code': errorCode, 'url': (hermesBaseURL + 'counts')});
    }
  });
};

/**
 * Set a new badge count. Computes the badge count based on unread and unacted upon counts
 * @param {number} newUnreadCount The new unread count.
 */
NotificationManager.prototype.setBadgeCount = function(newUnreadCount) {
  newUnreadCount = typeof(newUnreadCount) == 'number' ? newUnreadCount : 0;
  if (this.unreadCount != newUnreadCount) {
    sp.desktop.notificationPopup.badgeCountUpdate(newUnreadCount);
  }
  this.unreadCount = newUnreadCount;
};

/**
 * Convenience method for getting a cached notification by idHex. Returns the most recent one.
 * @param {string} idHex The new unread count.
 * @param {boolean} remove Whether to remove the notifciation that we are returning.
 * @return {Object} The notification with that id. Or null.
 */
NotificationManager.prototype.getCachedNotificationWithIdHex = function(idHex, remove) {
  var retVal = null;
  var index = 0;
  for (var i = 0; i < this.notifications.length; i++) {
    if (this.notifications[i].getIdHex() == idHex) {
      retVal = this.notifications[i];
      index = i;
      break;
    }
  }
  if (remove && retVal) {
    this.notifications.splice(index, 1);
  }
  return retVal;
};

/**
 * Trim cache to keep size managable
 */
NotificationManager.prototype.trimCache = function() {
  if (this.notifications.length > MAX_CACHE_SIZE) {
    this.notifications.splice(MAX_CACHE_SIZE);
  }
};

/**
 * Load the cache from loacal storage. We do this at startup, and then send the newest note timestamp
 * to the server to see if the cache is still good.
 */
NotificationManager.prototype.loadCache = function() {
  try {
    if (window.localStorage) {
      this.notifications = JSON.parse(window.localStorage.getItem(CACHE_STORAGE_KEY)) || [];
    }
    else {
      this.notifications = [];
    }

    for (var i = 0; i < this.notifications.length; i++) {
      this.notifications[i] = new Notification(this.notifications[i], true);
    }

    if (this.notifications.length > 0) {
      this.oldestNoteTimestamp = this.notifications[this.notifications.length - 1].state.notification_id_ms;
      this.oldestNoteId = this.notifications[this.notifications.length - 1].state.notification_id_hex;

      this.newestNoteTimestamp = this.notifications[0].state.notification_id_ms;
      this.newestNoteId = this.notifications[0].state.notification_id_hex;
    }
  }
  catch (e) {
    sLog(L_LEVEL.prod, 'error-invalid-cache-data', {'data': window.localStorage.getItem(CACHE_STORAGE_KEY)});

    // Clear the bad cache.
    this.clearCache();
  }
};

/**
 * Clears the cache. Used when the cache is dirty, or when we delete all notes.
 */
NotificationManager.prototype.clearCache = function() {
  this.notifications = [];
  this.oldestNoteId = '';
  this.oldestNoteTimestamp = 0;
  this.newestNoteId = '';
  this.newestNoteTimestamp = 0;
  this.saveCache();
};

/**
 * Saves the cache in its current state into loacal storage to be used at next startup time.
 */
NotificationManager.prototype.saveCache = function() {
  window.localStorage && window.localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(this.notifications));
};


/**
 * Convenience method for inserting a notification into the cache.
 * @param {Object} notification The notification to be inserted.
 * @param {boolean} fromSubscription Whether the notification comes from a subscription.
 * @return {boolean} Whether it was actually inserted. Wont insert duplicates.
 */
NotificationManager.prototype.insertNotificationIntoCache = function(notification, fromSubscription) {
  var timeStamp = notification.getTimeStamp();
  var idHex = notification.getIdHex();
  var index = -1;

  for (var i = 0; i < this.notifications.length; i++) {
    if (index == -1 && timeStamp > this.notifications[i].getTimeStamp()) {
      index = i;
    }
    if (this.notifications[i].getIdHex() == idHex) {
      return false;
    }
  }
  if (index == -1) {
    this.notifications.push(notification);
  } else {
    this.notifications.splice(index, 0, notification);
  }
  if (fromSubscription) {
    // We start evicting notifications from the cache
    this.trimCache();
  }

  this.oldestNoteTimestamp = this.notifications[this.notifications.length - 1].state.notification_id_ms;
  this.oldestNoteId = this.notifications[this.notifications.length - 1].state.notification_id_hex;

  this.newestNoteTimestamp = this.notifications[0].state.notification_id_ms;
  this.newestNoteId = this.notifications[0].state.notification_id_hex;

  this.saveCache();

  return true;
};

/**
 * Simple verification of data. This differs from accepted because all we need to mark a
 * notification as deleted or read are a few fields (id and timestamp). But just cause we
 * have those fields doesnt mean we can or will display the notification. We may not be
 * ready with translations or some of the required data may be missing. That is where the
 * subsequent notificationDataIsAccepted method is used.
 * for that type of notification.
 * @param {Object} newInClientData The in_client_data of a notification from hermes.
 * @return {boolean} Whether the notification is good.
 */
NotificationManager.prototype.notificationDataIsValid = function(newInClientData) {
  if (newInClientData && newInClientData.state && newInClientData.state.notification_id_hex && newInClientData.state.notification_id_ms) {
    return true;
  }
  return false;
};

/**
 * Simple verification of data. For further explanation see note on notificationDataIsValid.
 * @param {Object} newInClientData The in_client_data of a notification from hermes.
 * @return {boolean} Whether the notification is good.
 */
NotificationManager.prototype.notificationDataIsAccepted = function(newInClientData) {
  var ok = false;
  if (!newInClientData.state.dismissed && newInClientData.subject && newInClientData.subject.length > 0) {
    // Ensure corret sub-object is there
    switch (newInClientData.notification_verb) {
      case NOTIFICATION_TYPE.playlistUpdated:
        ok = newInClientData.track_add_object && newInClientData.track_add_object.length > 0 ? true : false;
        break;
      case NOTIFICATION_TYPE.playlistSubscribe:
        ok = newInClientData.playlist_sub_object && newInClientData.playlist_sub_object.length > 0 ? true : false;
        break;
      case NOTIFICATION_TYPE.newFollower:
      case NOTIFICATION_TYPE.friendJoined:
        ok = true;
        break;
      default: ok = false;
    }
  } else if (!newInClientData.state.dismissed) {
    // Ensure corret sub-object is there
    switch (newInClientData.notification_verb) {
      case NOTIFICATION_TYPE.albumReleased:
        ok = newInClientData.album_release_object && newInClientData.album_release_object.length > 0 ? true : false;
        break;
      default: ok = false;
    }
  }
  return ok;
};

/**
 * Convenience logger.
 * @return {string} A string description of the current cache state.
 */
NotificationManager.prototype.getCacheStateDescription = function() {
  var stateString = this.notifications.length > 1 ? '' : '    NONE';
  for (var i = 0; i < this.notifications.length; i++) {
    stateString += '    NOTE ' + i + '\n';
    stateString += this.notifications[i].getLog();
  }
  return stateString;
};

/**
 * Receiver for all new notifications, whether from subscription or get request.
 * @param {Array} newHermesArray The notifications from hermes.
 * @param {boolean} fromSubscription Whether we need to send alerts to the user (like growl notifications).
 */
NotificationManager.prototype.notificationsReceived = function(newHermesArray, fromSubscription) {
  var newNotifications = [];
  var newAndUpdatedNotifications = [];
  var hasBadNotifications = false;
  var hasResetFromSubscription = false;

  var icd = null;

  sLog(L_LEVEL.debug, 'notifications-received' + (fromSubscription ? '-subscription' : ''), newHermesArray);
  sLog(L_LEVEL.ver, 'cache-stat-pre-insertion', this.getCacheStateDescription());

  if (!newHermesArray || newHermesArray.length === 0)
    return;

  for (var i = 0; i < newHermesArray.length; i++) {
    if (!this.notificationDataIsValid(newHermesArray[i].in_client_data)) {
      // This should never happen
      sLog(L_LEVEL.prod, 'error-invalid-notification-data-received', {'data': newHermesArray[i].in_client_data});
      continue;
    }
    icd = newHermesArray[i].in_client_data;

    // Adjust cache for resets
    if (newHermesArray[i].type == 1) {
      if (icd.state.seen) {
        for (var g = 0; g < this.notifications.length; g++) {
          this.notifications[g].state.seen = true;
        }
        if (fromSubscription) {
          // Lets us know to clear badge;
          hasResetFromSubscription = true;
        }
      } else if (icd.state.dismissed) {
        this.notifications = [];
        this.oldestNoteId = '';
        this.oldestNoteTimestamp = 0;
        if (fromSubscription) {
          // Lets us know to clear badge;
          hasResetFromSubscription = true;
        }
      }
      continue;
    }

    // Next see if it is a state update:
    if (newHermesArray[i].type == 7) {
      var oldNotification = this.getCachedNotificationWithIdHex(icd.state.notification_id_hex);
      if (oldNotification) {
        // This is a state update
        oldNotification.updateWithNewState(icd.state);
        newAndUpdatedNotifications.push(oldNotification);
        sLog(L_LEVEL.debug, 'update-cached-notification', {'notification-id': oldNotification.getIdHex()});
      } else {
        // This refers to a notification we dont have cached.
        sLog(L_LEVEL.debug, 'drop-notification-update', {'notification-id': icd.state.notification_id_hex});
      }
      continue;
    }

    if (!this.notificationDataIsAccepted(icd)) {
      sLog(L_LEVEL.debug, 'unaccepted-notification-received', {'notification-id': icd.state.notification_id_hex});
      hasBadNotifications = true;
      continue;
    }

    // This must be a valid new notification (at least as far as this client is concerned)
    // Insert into notification cache in correct spot.
    var newNotification = new Notification(newHermesArray[i]);
    if (this.insertNotificationIntoCache(newNotification, fromSubscription)) {
      sLog(L_LEVEL.prod, 'new-note-received', {'notification-id': icd.state.notification_id_hex});
      newAndUpdatedNotifications.push(newNotification);
      newNotifications.push(newNotification);

      // NOTE: This is very hacky and dumb. And I hate it.
      // But right now way there is no way to ensure the user will be loaded. So we try to pre load here.
      // So we can get user images. When Stitch 1.0 is in the client this will be better.
      models.User.fromURI('spotify:user:' + newNotification.sendersData[0].canonical_username);
    }
  }

  if (this.notificationDelegate && this.notificationDelegate.displayNewOrUpdatedNotifications) {
    this.notificationDelegate.displayNewOrUpdatedNotifications(newAndUpdatedNotifications);
  }
  if (hasBadNotifications && !fromSubscription) {
    if (this.notifications.length > 0) {
      this.getPageOfNotifications(this.oldestNoteId);
    }
  }

  if (fromSubscription && newNotifications.length > 0) {
    // Create array of strings for each notification, to be used by client for growl notifications and more.
    var clientNotificationArray = [];
    for (var i = 0; i < newNotifications.length; i++) {
      clientNotificationArray = clientNotificationArray.concat(newNotifications[i].getStringArrayForSystemNotification());
    }
    sp.desktop.notificationPopup.notificationsRecieved(clientNotificationArray);
  }
  sLog(L_LEVEL.ver, 'cache-stat-post-insertion', this.getCacheStateDescription());
  return hasResetFromSubscription ? -1 : newNotifications.length;
};

/**
 * Tell the server to mark all notes as read, also mark our cache.
 * @param {boolean} sendToServer Whether or not we need to send this marking to the server. We dont if we dont think we have any unread notes.
 */
NotificationManager.prototype.readAllNotes = function(sendToServer) {
  sLog(L_LEVEL.debug, 'read-all-notifications');
  var state, _this = this;
  state = {'seen': true};

  for (var i = 0; i < _this.notifications.length; i++) {
    this.notifications[i].state.seen = true;
  }
  this.saveCache();
  this.setBadgeCount(0);
  if (!sendToServer) {
    return;
  }
  var hermesUrl = hermesBaseURL + 'states/all/';
  sp.core.getHermes('PUT', hermesUrl, [['NotificationState', state]], {
    onSuccess: function(message) {
      sLog(L_LEVEL.prod, 'read-all-notes-success', {'hermesUrl': hermesUrl});
    },
    onFailure: function(errorCode) {
      sLog(L_LEVEL.prod, 'error-read-all-notes-failed', {'errorCode': errorCode, 'hermesUrl': hermesUrl});
    }
  });
};


/**
 * Tell the server to delete all notes... only for tresting
 */
NotificationManager.prototype.deleteAllNotes = function() {
  this.clearCache();
  var hermesUrl = hermesBaseURL + 'states/all/';
  sp.core.getHermes('PUT', hermesUrl, [['NotificationState', {'dismissed': true}]], {
    onSuccess: function(message) {
      sLog(L_LEVEL.prod, 'delete-all-notes-success', {'hermesUrl': hermesUrl});
    },
    onFailure: function(errorCode) {
      sLog(L_LEVEL.prod, 'error-delete-all-notes-failed', {'errorCode': errorCode, 'hermesUrl': hermesUrl});
    }
  });
};


/**
 * Get a page of notifications. Try cache first, otherwise request from server.
 * @param {string} beforeId The (optional) id of the last notification currently shown.
 *                          Should only receive notificaiton created before that one.
 * @param {number} take The (optional) number of notifications to get.
 */
NotificationManager.prototype.getPageOfNotifications = function(beforeId, take) {
  take = take ? take : this.DEFAULT_PAGE_SIZE;

  // First check cache.
  var firstNoteInCacheIndex = this.notifications.length > 0 ? 0 : -1;
  if (beforeId) {
    firstNoteInCacheIndex = -1;
    for (var i = this.notifications.length - 2; i >= 0; i--) {
      if (this.notifications[i].getIdHex() == beforeId) {
        firstNoteInCacheIndex = i + 1;
        break;
      }
    }
  }
  if (firstNoteInCacheIndex != -1) {
    // We have at least some of the notifications cached
    var lastNoteInCacheIndex = firstNoteInCacheIndex + take;
    var diff = lastNoteInCacheIndex - (this.notifications.length);
    if (diff <= 0) {
      // We have it all in the cache.
      take = 0;
    } else {
      // We need more.
      lastNoteInCacheIndex = this.notifications.length;
      beforeId = this.oldestNoteId;
    }

    if (this.notificationDelegate && this.notificationDelegate.displayNewOrUpdatedNotifications) {
      // We return more than the take if we have more in the cache
      this.notificationDelegate.displayNewOrUpdatedNotifications(this.notifications.slice(firstNoteInCacheIndex, this.notifications.length));
    }
  }

  if (!take)
    return;

  this.getPageOfNotificationsFromServer(beforeId, take, false);
};

/**
 * Get a page of notifications from server.
 * @param {string} beforeId The (optional) id of the last notification currently shown.
 *                          Should only receive notifications created before that one.
 * @param {number} take The (optional) number of notifications to get.
 * @param {boolean} isInitialCacheCheck If its the initial cache check.
 */
NotificationManager.prototype.getPageOfNotificationsFromServer = function(beforeId, take, isInitialCacheCheck) {
  var _this = this;
  var fromLine = beforeId ? 'from/' + beforeId + '/' : '';
  var hermesUrl = hermesBaseURL + fromLine + 'take/' + take;

  if (isInitialCacheCheck && this.newestNoteId) {
    hermesUrl += '/?etag=' + this.newestNoteId;
  }

  sLog(L_LEVEL.debug, 'get-page-of-notifications', {'hermesUrl': hermesUrl});
  if (isInitialCacheCheck) {
    sLog(L_LEVEL.prod, 'do-initial-cache-check', {'hermesUrl': hermesUrl});
  }

  this.fetchInProgress = true;
  sp.core.getHermes('GET', hermesUrl, [], {
    onSuccess: function(message) {
      if (isInitialCacheCheck) {
        // Clear the bad cache.
        sLog(L_LEVEL.prod, 'cache-dirty', {'hermesUrl': hermesUrl});
        _this.clearCache();
      }
      _this.hermesGetSuccess(message, take);
    },
    onFailure: function(errorCode) {
      this.fetchInProgress = false;
      if (isInitialCacheCheck && errorCode == 5404) { // 5404 Means 304.
        // Do nothing, cache is fine.
        sLog(L_LEVEL.prod, 'cache-ok', {'hermesUrl': hermesUrl});
        return;
      }
      if (_this.notificationDelegate && _this.notificationDelegate.showError) {
        _this.notificationDelegate.showError();
      }
      sLog(L_LEVEL.prod, 'error-get-page-failed', {'errorCode': errorCode, 'hermesUrl': hermesUrl});
    }
  });
};

/**
 * Callback for hermes paging requests
 * @param {Object} message The encoded hermes/protobuf reply.
 * @param {number} take The number of notifications we are supposed to receive, if we received less we know we are at the end of the list.
 */
NotificationManager.prototype.hermesGetSuccess = function(message, take) {
  sLog(L_LEVEL.debug, 'hermes-get-success');
  var data = sp.core.parseHermesReply('NotificationList', message);
  this.fetchInProgress = false;
  if (data && data.notification && data.notification.length > 0) {
    this.notificationsReceived(data.notification);
  }
  if ((!data || !data.notification || data.notification.length < take) &&
      this.notificationDelegate && this.notificationDelegate.noMoreNotificationsToLoad) {
    // We assume we have reached the end of the list.
    this.notificationDelegate.noMoreNotificationsToLoad();
  }
};

/**
 * The actual popup
 * @constructor
 */
function NotificationPopup() {
  this.showing = false;
  this.reconnectOnClose = false;
  this.lastConnectedTime = 0; // Only used in older clients that dont inform us of reconnects.
  this.selectedNode = null;
  this.notificationsLoading = 0;
  var _this = this;
  this.scroller = nano.scroller(document.getElementById('notificationList'), function() {
    _this.nearBottomCallback();
  });
  this.noMoreNotes = false;

  this.NOTES_PER_PAGE = 6;

  this.noteCenterNode = document.getElementById('noteCenter');

  // Insert correct UI translations
  document.getElementById('topBar').innerHTML = translate('mainUI', 'sTitle');

  this.notificationManager = new NotificationManager(this);

  if (sp.desktop.notificationPopup && sp.core.getArguments()[0] != 1) {
    sp.desktop.notificationPopup.addEventListener('shownPop', function() { _this.show(); });
    sp.desktop.notificationPopup.addEventListener('closingPop', function() { _this.closePop(); });
    sp.desktop.notificationPopup.addEventListener('moveup', function() { _this.keyUp(); });
    sp.desktop.notificationPopup.addEventListener('movedown', function() { _this.keyDown(); });
    sp.desktop.notificationPopup.addEventListener('doActionOnSelectedNote', function() { _this.doActionOnSelectedNote(); });
    if (sp.desktop.notificationPopup.hasEvent && sp.desktop.notificationPopup.hasEvent('reconnect')) {
      // Working with newer version of client that informs us when we go to sleep.
      // Here we hold off on the start up of the center, until we get a reconnect message.
      setTimeout(function() {
        _this.reconnect();
        // Sometimes at startup we get multiple reconnects in a row. Wait for the rush to be over.
        setTimeout(function() {
          sp.desktop.notificationPopup.addEventListener('reconnect', function() { _this.reconnect(); });
        }, 3000);
      }, 3000);
    }
    else {
      // Working with an older version of the client. We dont know when we reconnect.
      // So we must poll and we startup right away.
      setInterval(function() { _this.checkConnection(); }, 3000);
    }
  } else {
    // This is only for testing inside the main window.
    this.notificationManager.startup();
    this.show();
  }
}

/**
 * Notice we have connected. After login, after coming back from offline mode, after waking from sleep, whenever.
 */
NotificationPopup.prototype.reconnect = function() {
  if (this.showing) {
    this.reconnectOnClose = true;
  }
  else {
    this.notificationManager.startup();
  }
};

/**
 * Function to poll connection state (for older clients).
 */
NotificationPopup.prototype.checkConnection = function() {
  if (sp.core.getLoginMode() == 1) {
    var d = new Date();
    var newConnectedTime = d.getTime();
    if (newConnectedTime - this.lastConnectedTime > 4000) {
      this.reconnect();
    }
    this.lastConnectedTime = newConnectedTime;
  }
};

/**
 * Notice from the client that we are now showing the window. Start load.
 */
NotificationPopup.prototype.show = function() {
  this.showing = true;
  this.notificationManager.getPageOfNotifications();
  document.getElementById('noMoreMessage').innerHTML = translate('mainUI', 'sNoMoreMessage');
  sLog(L_LEVEL.prod, 'shown');
};

/**
 * Notice from the client that we are now closing the window. Reset to hibernating state.
 */
NotificationPopup.prototype.closePop = function() {
  this.showing = false;
  this.notificationManager.readAllNotes(this.notificationManager.unreadCount > 0 || dom.queryOne('.unread'));
  document.getElementById('notificationListContent').innerHTML = '';
  this.noteCenterNode.classList.remove('loaded');
  this.noteCenterNode.classList.remove('empty');
  this.scroller.reset();
  this.selectedNode = null;
  this.noMoreNotes = false;
  if (this.reconnectOnClose) {
    this.reconnectOnClose = false;
    this.notificationManager.startup();
  }
};

/**
 * This is how the notification manager lets us know there is an error
 */
NotificationPopup.prototype.showError = function() {
  if (this.showing) {
    document.getElementById('noMoreMessage').innerHTML = translate('mainUI', 'sLoadError');
    this.noteCenterNode.classList.add('empty');
  }
};

/**
 * This is how the notification manager passes on new or updated notifications.
 * We dont know which is which.
 * @param {Array} notifications The new notifications.
 */
NotificationPopup.prototype.displayNewOrUpdatedNotifications = function(notifications) {
  sLog(L_LEVEL.ver, 'displaying-notifications', notifications);
  if (!this.showing) {
    return;
  }
  var _this = this;
  this.notificationsLoading += notifications.length;
  for (var i = 0; i < notifications.length; i++) {
    notifications[i].loadNodeInfo(
        function(notification) { _this.displayLoadedNotification(notification); },
        function(notification) { _this.notificationFailedToLoad(notification); });
  }
};

/**
 * Actually display a notification once it is loaded.
 * @param {Notification} notification The loaded notification.
 */
NotificationPopup.prototype.displayLoadedNotification = function(notification) {
  function linkHandler(url, node, _this) {
    return function() {
      _this.linkHit(url, node);
    };
  }

  var _this = this,
      list = document.getElementById('notificationListContent'),
      node,
      links,
      inserted = false;
  this.notificationsLoading--;
  var node = document.getElementById(notification.getIdHex());
  // This is an update to an existing notificaiton
  if (node) {
    // As of right now we dont want to do anything to the view for a state update.
    return;
  }

  // We must have a new notificaiton.
  node = notification.createNode();
  links = dom.query('a', node);

  // Add listeners
  r.fromDOMEvent(dom.queryOne('.mainActionButton', node), 'click').subscribe(function() {_this.mainActionButtonHit(node)});
  r.fromDOMEvent(dom.queryOne('.secondaryActionButton', node), 'click').subscribe(function() {_this.secondaryActionButtonHit(node)});
  for (var i = 0; i < links.length; i++) {
    r.fromDOMEvent(links[i], 'click').subscribe(linkHandler(links[i], node, _this));
  }

  // Inject node in correct spot.
  var nodes = list.childNodes;
  var indexOfNewNode = 0;
  while (nodes && indexOfNewNode < nodes.length && nodes[indexOfNewNode].dataset.timestamp > node.dataset.timestamp) {
    indexOfNewNode++;
  }
  if (nodes && indexOfNewNode < nodes.length) {
    list.insertBefore(node, nodes[indexOfNewNode]);
  } else {
    list.appendChild(node);
  }

  this.noteCenterNode.classList.add('loaded');
  this.noteCenterNode.classList.remove('empty');
  document.getElementById('noMoreMessage').innerHTML = translate('mainUI', 'sNoMoreMessage');

  if (sp.desktop.notificationPopup) {
    sp.desktop.notificationPopup.setHeight(this.noteCenterNode.clientHeight);
  }

  setTimeout(function() {
    _this.scroller.reset();
    sp.desktop.notificationPopup.setHeight(_this.noteCenterNode.clientHeight);
  }, 1);
};

/**
 * Handle a notification that fails to load.
 * @param {Notification} notification The loaded notification.
 */
NotificationPopup.prototype.notificationFailedToLoad = function(notification) {
  this.notificationsLoading--;
  if (this.notificationsLoading === 0 && dom.query('.notification').length === 0) {
    this.emptyListHandler();
  }
};

/**
 * This is how the notification manager tells us we have reached the end of all notifications on the server.
 */
NotificationPopup.prototype.noMoreNotificationsToLoad = function() {
  if (!this.showing) {
    return;
  }

  if (dom.query('.notification').length === 0) {
    this.noteCenterNode.classList.remove('loaded');
    this.noteCenterNode.classList.add('empty');
  }

  this.noMoreNotes = true;
  return;
};

/**
 * Called when we have no more visible notifications.
 * @param {boolean} dontLoadMore When clear all has just been he we can go right to the epty state.
 *                               We dont need to page more in from the server.
 */
NotificationPopup.prototype.emptyListHandler = function(dontLoadMore) {
  // Request more notes
  this.noteCenterNode.classList.remove('loaded');
  this.scroller.reset();
  if (sp.desktop.notificationPopup) {
    sp.desktop.notificationPopup.setHeight(this.noteCenterNode.clientHeight);
  }
  if (dontLoadMore) {
    this.noMoreNotificationsToLoad();
  } else {
    this.notificationManager.getPageOfNotifications(null);
  }
};

/**
 * Called when user scrolls near the bottom, to kick of infinite scroll.
 */
NotificationPopup.prototype.nearBottomCallback = function() {
  if (!this.fetchInProgress && !this.noMoreNotes) {
    var nodes = dom.query('.notification');
    if (nodes && nodes.length > 0)
      this.notificationManager.getPageOfNotifications(nodes[nodes.length - 1].id);
  }
};

/**
 * Main action button handler
 * @param {Object} node DOM Node whose button was hit.
 */
NotificationPopup.prototype.mainActionButtonHit = function(node) {
  var buttonCell = dom.queryOne('.buttonCell', node);
  if (buttonCell.className.indexOf('uncompleted') != -1) {
    buttonCell.classList.add('completing');
    buttonCell.classList.remove('uncompleted');
    setTimeout(function() {
      buttonCell.classList.add('completed');
      buttonCell.classList.remove('completing');
    }, 2000);
  }
};

/**
 * Secondary action button handler
 * @param {Object} node DOM Node whose button was hit.
 */
NotificationPopup.prototype.secondaryActionButtonHit = function(node) {
  this.linkHit(node.dataset.secondaryActionUrl, node, true);
};

/**
 * Link click handler
 * @param {string} linkUrl Url of hit link.
 * @param {Object} node DOM Node whose button was hit.
 * @param {boolean} isSecondary whether the link comes from the secondary button or an inline link.
 */
NotificationPopup.prototype.linkHit = function(linkUrl, node, isSecondary) {
  if (event) {
    event.preventDefault();
  }
  sp.desktop.notificationPopup.openLink(decodeURIComponent(linkUrl));
  sLog(L_LEVEL.prod, (isSecondary ? 'secondary-action-hit' : 'link-hit'), {'url': linkUrl});
};

/**
 * Called from client when user presses up arrow.
 */
NotificationPopup.prototype.keyUp = function() {
  this.keyBoardMove(true);
};

/**
 * Called from client when user presses down arrow.
 */
NotificationPopup.prototype.keyDown = function() {
  this.keyBoardMove(false);
};

/**
 * Unified key move function
 * @param {boolean} up True if key press is up, otherwise it must be down.
 */
NotificationPopup.prototype.keyBoardMove = function(up) {
  if (!this.selectedNode && up) {
    return;
  }
  var nextNode = this.selectedNode ? (up ? this.selectedNode.previousSibling : this.selectedNode.nextSibling) : dom.queryOne('.notification');
  if (!nextNode) {
    return;
  }
  this.selectNode(nextNode);
};

/**
 * Select a node
 * @param {Object} nextNode The new node to select.
 */
NotificationPopup.prototype.selectNode = function(nextNode) {
  if (this.selectedNode != nextNode) {
    if (this.selectedNode)
      this.selectedNode.classList.remove('selected');
    if (nextNode)
      nextNode.classList.add('selected');
    this.selectedNode = nextNode;
  }
  // Make sure selected node is visible
  var topPos = nextNode.offsetTop;
  var height = nextNode.clientHeight;
  var scrollDiv = document.getElementById('notificationListContent');
  if (scrollDiv.scrollTop > topPos) {
    scrollDiv.scrollTop = topPos;
  } else if (scrollDiv.scrollTop + scrollDiv.clientHeight < topPos + height) {
    scrollDiv.scrollTop = (topPos + height) - scrollDiv.clientHeight;
  }
};

/**
 * Called from client when user presses enter/return.
 */
NotificationPopup.prototype.doActionOnSelectedNote = function() {
  if (this.selectedNode) {
    if (dom.queryOne('.buttonCell', this.selectedNode).className.indexOf('uncompleted') != -1) {
      this.mainActionButtonHit(this.selectedNode);
    } else {
      this.secondaryActionButtonHit(this.selectedNode);
    }
  }
};

// The not popup object
var notePopup = new NotificationPopup();
