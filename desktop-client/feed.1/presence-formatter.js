/**
 * @module Presence Formatter
 */

'use strict';

sp = getSpotifyApi();

// Imports
var $metadata = sp.require('$api/metadata');
var $presence = sp.require('$unstable/presence');

var METADATA_BATCH_SIZE = 50;

// Exports
exports.PresenceFormatter = PresenceFormatter;

/**
 * Class to process presence updates formatting them ready for display.
 * Formatted updates are returned as DOM nodes which can be inserted into to
 * the document where required.
 * Exposes a function that is suitable for passing to observePresenceForUser(s)
 * or getPresenceForUser(s) - see formatStates.
 *
 * @param {function(String, Node)} callback Handles node with formatted
 *                                 presence data.
 */
function PresenceFormatter(callback) {
  var self = this;
  var spanNode = document.createElement('span');

  spanNode.className = 'sp-presence';

  function _invokeCallback(state, innerHTML, isPartOfBatch) {
    var node = spanNode.cloneNode();
    node.innerHTML = innerHTML;
    callback(state, node, isPartOfBatch);
  }

  /**
   * [_onFormatPlaylistPublished description]
   * @param  {[type]}   state [description].
   * @param  {[type]}   data  [description].
   */
  function _onFormatPlaylistPublished(state, data, isPartOfBatch) {
    _invokeCallback(state,
        self.formatPlaylistPublished(state, data),
        isPartOfBatch);
  }

  /**
   * [_onFormatPlaylistSubscribed description]
   * @param  {[type]}   state [description].
   * @param  {[type]}   data  [description].
   */
  function _onFormatPlaylistSubscribed(state, data, isPartOfBatch) {
    if (state.type == $presence.PresenceState.TYPE.MY_PLAYLIST_SUBSCRIBED) {
      _invokeCallback(state,
          self.formatMyPlaylistSubscribed(state, data),
          isPartOfBatch);
    } else {
      sp.social.getUserByUsername(data.owner.canonicalUsername, {
        onSuccess: function(user) {
          _invokeCallback(state,
              self.formatPlaylistSubscribed(state, data, user),
              isPartOfBatch);
        }});
    }
  }

  /**
   * [_onFormatPlaylistTrackAdded description]
   * @param  {[type]}   state [description].
   * @param  {[type]}   data  [description].
   */
  function _onFormatPlaylistTrackAdded(state, data, isPartOfBatch) {
    if (state.type == $presence.PresenceState.TYPE.PLAYLIST_TRACK_STARRED) {
      if (data.isInvalid)
        return;
      _invokeCallback(state,
          self.formatTrackStarred(state, data),
          isPartOfBatch);
    } else {
      $metadata.getMetadata(state.playlistUri, function(plData) {
        if (!plData)
          return;
        _invokeCallback(state,
            self.formatPlaylistTrackAdded(state, [data, plData]),
            isPartOfBatch);
      });
    }
  }

  /**
   * [_onFormatTrackFinishedPlaying description]
   * @param  {[type]}   state [description].
   * @param  {[type]}   data  [description].
   */
  function _onFormatTrackFinishedPlaying(state, data, isPartOfBatch) {
    if (data.isInvalid || data.name === '')
      return;

    var _onFormatTrackFinishedPlayingInternal = function(appInfo) {
      _invokeCallback(state,
          self.formatTrackFinishedPlaying(state, data),
          isPartOfBatch);
    };

    if (state.type == $presence.PresenceState.TYPE.APP_TRACK_FINISHED_PLAYING ||
        state.type == $presence.PresenceState.TYPE.RADIO_TRACK_FINISHED_PLAYING) {
      sp.installer.getApplicationInfo(state.referrerUri, {
        onSuccess: function(appInfo) {
          state.appInfo = appInfo;
          _onFormatTrackFinishedPlayingInternal(appInfo);
        },
        onFailure: function(error) {
          _onFormatTrackFinishedPlayingInternal();
        }
      });
    } else {
      _onFormatTrackFinishedPlayingInternal();
    }
  }

  /**
   * [_onFormatFacebookActivity description]
   * @param  {[type]}   state [description].
   * @param  {[type]}   data  [description].
   */
  function _onFormatFacebookActivity(state, data, isPartOfBatch) {
    _invokeCallback(state,
        self.formatFacebookActivity(state),
        isPartOfBatch);
  }

  /**
   * Formatter function to handle the favorite app added event
   * @param  {[type]}   state [description].
   * @param  {[type]}   data  [description].
   */
  function _onFormatFavouriteAppAdded(state, data, isPartOfBatch) {
    sp.installer.getApplicationInfo(state.appUri, {
      onSuccess: function(appInfo) {
        state.appInfo = appInfo;
        _invokeCallback(state,
            self.formatFavouriteAppAdded(state),
            isPartOfBatch);
      },
      onFailure: function(error) {}
    });
  }

  function _getInfoFromState(state, info) {
    switch (state.type) {
      // Track finished playing
      case $presence.PresenceState.TYPE.TRACK_FINISHED_PLAYING:
      case $presence.PresenceState.TYPE.APP_TRACK_FINISHED_PLAYING:
      case $presence.PresenceState.TYPE.RADIO_TRACK_FINISHED_PLAYING:
        info.uri = state.trackUri;
        info.callback = _onFormatTrackFinishedPlaying;
        break;
      // Playlist published
      case $presence.PresenceState.TYPE.PLAYLIST_PUBLISHED:
        info.uri = state.playlistUri;
        info.callback = _onFormatPlaylistPublished;
        break;
      // Playlist subscribed
      case $presence.PresenceState.TYPE.PLAYLIST_SUBSCRIBED:
      case $presence.PresenceState.TYPE.MY_PLAYLIST_SUBSCRIBED:
        info.uri = state.playlistUri;
        info.callback = _onFormatPlaylistSubscribed;
        break;
      // Track added to playlist (starred)
      case $presence.PresenceState.TYPE.PLAYLIST_TRACK_ADDED:
      case $presence.PresenceState.TYPE.PLAYLIST_TRACK_STARRED:
        info.uri = state.trackUri;
        info.callback = _onFormatPlaylistTrackAdded;
        break;
      // App added
      case $presence.PresenceState.TYPE.APP_ADDED:
        info.uri = null;
        info.callback = _onFormatFavouriteAppAdded;
        break;
      // Default
      default:
        info.uri = null;
        info.callback = null;
        break;
    }
  }


  /**
   * Determines an item's 'sticky' factor from a predefined list.
   * @param {number} type [description].
   * @return {number} A numerical value that could be used, for instance, to
   *     determine for how long an item should stay prioritized in the feed.
   */
  function _getStickyFactor(type) {
    switch (type) {
      case $presence.PresenceState.TYPE.UNKNOWN:
      case $presence.PresenceState.TYPE.FACEBOOK_ACTIVITY:
      case $presence.PresenceState.TYPE.TRACK_FINISHED_PLAYING:
      case $presence.PresenceState.TYPE.TRACK_STARTED_PLAYING:
        return 0;
      case $presence.PresenceState.TYPE.PLAYLIST_PUBLISHED:
      case $presence.PresenceState.TYPE.PLAYLIST_TRACK_ADDED:
        return 1;
      case $presence.PresenceState.TYPE.PLAYLIST_TRACK_STARRED:
      case $presence.PresenceState.TYPE.PLAYLIST_SUBSCRIBED:
      case $presence.PresenceState.TYPE.MY_PLAYLIST_SUBSCRIBED:
        return 2;
      case $presence.PresenceState.TYPE.RADIO_TRACK_FINISHED_PLAYING:
      case $presence.PresenceState.TYPE.APP_TRACK_FINISHED_PLAYING:
      case $presence.PresenceState.TYPE.APP_ADDED:
      case $presence.PresenceState.TYPE.TRACK_SHARED:
      case $presence.PresenceState.TYPE.PLAYLIST_SHARED:
      case $presence.PresenceState.TYPE.ALBUM_SHARED:
      case $presence.PresenceState.TYPE.ARTIST_SHARED:
        return 3;
      default:
        return 0;
    }
  }

  /**
   * Format state updates invoke the callback passed to the constructor
   * for each one.
   *
   * @param  {Array} states [description].
   */
  function _formatStates(states) {
    var uris = [];
    var callbacks = [];
    var info = { uri: null, callback: null };
    var isPartOfBatch = states.length > 1;

    for (var i = 0, s = states.length; i < s; i++) {
      var state = states[i];

      _getInfoFromState(state, info);

      if (info.uri) {
        uris.push(info.uri);
        callbacks.push(partial(info.callback, state));
      }
      else if (info.callback) {
        try {
          info.callback(state, null, isPartOfBatch);
        } catch (e) {
          console.log('error formatting state', state, e);
        }
      }
    }

    // Now send in batches of 50.
    var batchUris = null;
    var batchCallbacks = null;
    var batchStart = 0;

    // Batch complete handler.
    var _onBatchComplete = function(_callbacks, _data) {
      if (_data) {
        for (var i = 0, d = _data.length; i < d; i++) {
          if (_data[i]) {
            try {
              _callbacks[i](_data[i], isPartOfBatch);
            } catch (e) {
              console.log('error formatting state', _data[i], e);
            }
          }
        }
      }
    };

    // Actually send batch requests.
    while (batchStart < uris.length) {
      batchUris = uris.slice(batchStart, batchStart + METADATA_BATCH_SIZE);
      batchCallbacks = callbacks.slice(batchStart, batchStart + METADATA_BATCH_SIZE);
      batchStart += METADATA_BATCH_SIZE;

      $metadata.getMetadata(batchUris, partial(_onBatchComplete, batchCallbacks));
    }
  }

  /**
   * Format a state update the callback passed to the constructor.
   *
   * @param  {Object} state [description].
   */
  function _formatState(state) {
    _formatStates([state]);
  }

  self.formatState = _formatState;
  self.formatStates = _formatStates;
  self.stickyFactor = _getStickyFactor;

  return self;
}
