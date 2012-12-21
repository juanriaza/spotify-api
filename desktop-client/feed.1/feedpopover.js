/**
 * @module Feed Popover
 */

'use strict';

sp = getSpotifyApi();

// Imports
var $dateTime = sp.require('$unstable/datetime');
var $language = sp.require('$util/language');
var $metadata = sp.require('$api/metadata');
var $popover = sp.require('$unstable/popover');
var $presence = sp.require('$unstable/scripts/presence');
var $staticdata = sp.require('$unstable/staticdata');
var $views = sp.require('$api/views');

var $miniPlayer = sp.require('mini-player');

// Constants
var CATALOG = $language.loadCatalog('feed', '');
var _ = partial($language.getString, CATALOG, 'presence');
var UPDATE_INTERVAL = 10000; // How often to update timestamps

// Private variables
var _topTrack = '';
var $loggingHelper;

function setLoggingHelper(lh) {
  $loggingHelper = lh;
}

// Exports
exports.feedPopover = showFeedPopover;
exports.setLoggingHelper = setLoggingHelper;

/**
 * [getTopTrack description]
 * @param  {[type]} favorites [description].
 * @return {[type]}           [description].
 */
function getTopTrack(favorites) {
  for (var favorite in favorites) {
    if (favorites[favorite].length) {
      return favorites[favorite].shift().uri;
    }
  }
}

/**
 * [getGlobalTopTrack description]
 */
function getGlobalTopTrack() {
  sp.social.getToplist('track', 'everywhere', sp.core.user.canonicalUsername, {
    onSuccess: function(result) {
      _topTrack = getTopTrack(result);
    },
    onFailure: function() {
    },
    onComplete: function() {
    }
  });
}

// Possible TODO: First try presence for last listened song and THEN try
// social if presence comes up empty. Check with Mattias.
sp.social.getToplist('track', 'user', sp.core.user.canonicalUsername, {
  onSuccess: function(result) {
    if (result.tracks && result.tracks.length) {
      _topTrack = getTopTrack(result);
    } else {
      getGlobalTopTrack();
    }
  },
  onFailure: function(error) {
    getGlobalTopTrack();
  },
  onComplete: function() {
  }
});

/**
 * [_linkString description]
 * @param  {String} uri  [description].
 * @param  {String} name [description].
 * @return {String}      [description].
 */
function _linkString(uri, name) {
  return '<a href=\"' + uri.decodeForHTML() + '\">' + name.decodeForHTML() + '</a>';
}

var STATES = [];

STATES[$presence.PresenceState.TYPE.TRACK_FINISHED_PLAYING] = 'isTrackFinished';
STATES[$presence.PresenceState.TYPE.APP_TRACK_FINISHED_PLAYING] = 'isTrackFinishedFromApp';
STATES[$presence.PresenceState.TYPE.RADIO_TRACK_FINISHED_PLAYING] = 'isTrackFinishedFromRadio';
STATES[$presence.PresenceState.TYPE.PLAYLIST_PUBLISHED] = 'isPlaylistPublished';
STATES[$presence.PresenceState.TYPE.PLAYLIST_SUBSCRIBED] = 'isPlaylistSubscribed';
STATES[$presence.PresenceState.TYPE.MY_PLAYLIST_SUBSCRIBED] = 'isMyPlaylistSubscribed';
STATES[$presence.PresenceState.TYPE.PLAYLIST_TRACK_ADDED] = 'isTrackAdded';
STATES[$presence.PresenceState.TYPE.PLAYLIST_TRACK_STARRED] = 'isTrackStarred';
STATES[$presence.PresenceState.TYPE.APP_ADDED] = 'isFavouriteAppAdded';

/**
 * Show more info about a feed item
 * @param  {[type]} state          [description].
 * @param  {[type]} node           [description].
 * @param  {[type]} relNode        [description].
 * @param  {[type]} popoverContext [description].
 */
function showFeedPopover(state, node, relNode, popoverContext) {
  var user = state.user;
  var contentNode = document.createElement('div');
  var relativeNode = relNode || node.parentNode.parentNode;
  var textNode = contentNode.cloneNode();
  var timerId = -1;
  var userUri = user.uri;
  var playbackUri = null;
  var staticUser = $staticdata.getInterestingPeople(user.canonicalUsername);
  var vanityName = staticUser ? staticUser.name : user.name;
  var player = new $miniPlayer.MiniPlayer();
  var dateNode = document.createElement('time');
  var dateContent = document.createElement('span');

  dateContent.textContent = $dateTime.timeAgo(new Date(state.timestamp * 1000));
  dateNode.appendChild(dateContent);

  if ((state.type == $presence.PresenceState.TYPE.APP_TRACK_FINISHED_PLAYING && state.appInfo && state.appInfo.name !== '') ||
      state.type === $presence.PresenceState.TYPE.RADIO_TRACK_FINISHED_PLAYING) {
    var appAnchor = document.createElement('a');
    var appIcon = document.createElement('span');
    var parent = dateNode.firstChild;
    appIcon.className = 'feed-popover-app-icon';
    var appName;

    if (state.type === $presence.PresenceState.TYPE.RADIO_TRACK_FINISHED_PLAYING) {
      appIcon.classList.add('radio');
      appIcon.style.backgroundImage = 'url(sp://resources/img/buddylist-radio-icon.png)';
      appName = 'Spotify radio';
    } else {
      appIcon.style.backgroundImage = 'url(' + state.appInfo.icon_small + ')';
      appName = state.appInfo.name;
    }

    // insert the new element into the DOM before the existing first child
    parent.parentNode.insertBefore(appIcon, parent);

    dateContent.textContent += ', ' + $language.format(_('usingApp').toLowerCase(), '');
    appAnchor.href = state.referrerUri;
    appAnchor.textContent = appName;
    dateContent.appendChild(appAnchor);
  }

  var template;
  switch (state.type) {
    case $presence.PresenceState.TYPE.TRACK_FINISHED_PLAYING:
    case $presence.PresenceState.TYPE.APP_TRACK_FINISHED_PLAYING:
    case $presence.PresenceState.TYPE.RADIO_TRACK_FINISHED_PLAYING:
      textNode.innerHTML = $language.format(
          _('listenedTo'),
          '<strong>' + _linkString(userUri, vanityName) + '</strong>'
          );
      playbackUri = state.trackUri;
      break;
    case $presence.PresenceState.TYPE.PLAYLIST_PUBLISHED:
      textNode.innerHTML = $language.format(
          _('userPublishedPlaylist'),
          '<strong>' + _linkString(userUri, vanityName) + '</strong>'
          );
      playbackUri = state.playlistUri;
      break;
    case $presence.PresenceState.TYPE.PLAYLIST_SUBSCRIBED:
    case $presence.PresenceState.TYPE.MY_PLAYLIST_SUBSCRIBED:
      textNode.innerHTML = $language.format(
          _('userSubscribedToPlaylist'),
          '<strong>' + _linkString(userUri, vanityName) + '</strong>'
          );
      playbackUri = state.playlistUri;
      break;
    case $presence.PresenceState.TYPE.PLAYLIST_TRACK_ADDED:
      $metadata.getMetadata(state.playlistUri, function(md) {
        if (md === null) return;
        textNode.innerHTML = $language.format(
            _('userAddedTrack'),
            '<strong>' + _linkString(userUri, vanityName) + '</strong>',
            '<strong>' + _linkString(md.uri, md.name) + '</strong>'
            );
      });
      playbackUri = state.trackUri;
      break;
    case $presence.PresenceState.TYPE.PLAYLIST_TRACK_STARRED:
      textNode.innerHTML = $language.format(
          _('userStarred'),
          '<strong>' + _linkString(userUri, vanityName) + '</strong>'
          );
      playbackUri = state.trackUri;
      break;
    case $presence.PresenceState.TYPE.APP_ADDED:
      var style = 'background-image:url("' + state.appInfo.icon_medium + '");';
      template = '<div class="popover-app-info">' +
          '<span style={0}></span>' +
          _linkString(state.appUri, state.appInfo.name) +
          '<p>{1}</p>' +
          '<p>{2}</p>' +
          '</div>';
      textNode.innerHTML = $language.format('{0}{1}',
          $language.format(
          _('userAddedApp'),
          '<strong>' + _linkString(userUri, vanityName) + '</strong>',
          _linkString(state.appUri, state.appInfo.name)),
          $language.format(template,
          style,
          state.appInfo.description,
          $language.format('<button class="new-button primary"' +
          ' onclick="location.href=\'' + state.appUri + '\';">{0}</button>',
          $language.getString(CATALOG, 'generic', 'view'))));
      dateNode = null;
      break;
    default:
      // Show the no presence popover
      var image = new $views.Image(staticUser ? staticUser.picture : user.picture);
      template = '<strong class="sp-text-truncate">' +
          _linkString(userUri, vanityName) +
          '</strong>' +
          _linkString(userUri, $language.getString(CATALOG, 'generic', 'viewProfile'));
      textNode.className = 'no-presence';
      textNode.innerHTML = template;
      textNode.insertBefore(image.node, textNode.firstChild);
      dateNode = null;
      break;
  }

  contentNode.className = 'feed-popover';
  contentNode.appendChild(textNode);

  if (playbackUri) {
    player.loadURI(playbackUri);
    contentNode.appendChild(player.node);
  }

  var currentState = STATES[state.type];

  var popupId = +new Date();
  $loggingHelper.logClientEvent(popoverContext, 'open', {
    state: currentState,
    popupId: popupId,
    uri: playbackUri,
    user: userUri
  });

  contentNode.addEventListener('click', function(e) {
    if (e.target.tagName !== 'A' || !e.target.href) return;
    $loggingHelper.logClientEvent(popoverContext, 'link', {
      state: currentState,
      popupId: popupId,
      uri: e.target.href,
      user: userUri
    });
  });

  contentNode.addEventListener('playstatechange', function(e) {
    $loggingHelper.logClientEvent(popoverContext, e.playing ? 'play' : 'pause', {
      state: currentState,
      popupId: popupId,
      uri: e.resource.uri,
      user: userUri
    });
  });

  if (dateNode) {
    contentNode.appendChild(dateNode);
  }

  var feedPopover;
  feedPopover = $popover.showPopover({
    contentNode: contentNode,
    relativeNode: relativeNode
  });

  feedPopover.show(node);
}
