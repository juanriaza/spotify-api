'use strict';

var sp = getSpotifyApi(1);

exports.init = init;

var _howManyInRow = 4;

var m = sp.require('$api/models');
var views = sp.require('$api/views');
var dom = sp.require('$util/dom');
var ui = sp.require('$unstable/ui');
var social = sp.require('$unstable/social');
var presence = sp.require('$unstable/presence');
var fs = sp.require('$util/fs');
var lang = sp.require('$util/language');

var pop = sp.require('popup-common/js/popup');
var popup = new pop.Popup('og-popup');

var _logEventVersion = '2';
var _logTestVersion = '1';
var _logTitle = 'open graph popup';
var _logEvent = pop.logEvent.bind(null, _logTitle, _logEventVersion, _logTestVersion);

var _howManyFriends = 4;
var _recentTracks = [];

var _fbUsers = null;
var _fbTimeout = 10000;

function init() {
  _logEvent('popup shown');

  popup.renderPlaceholders(dom.id('friends-container'), _howManyFriends);

  if (!social.loaded) { // social not loaded - just wait for loaded event
    social.addEventListener(social.RELATIONS_LOADED_EVENT, socialLoaded);
  } else {
    var start = Date.now();
    var timerId = setInterval(function() {
      var current = Date.now();
      if (current - start >= _fbTimeout || _fbUsers && _fbUsers.length > 0) {
        clearInterval(timerId);
        socialLoaded();
      } else {
        checkForUsers();
      }
    }, 200);
  }

  dom.listen(dom.id('connect-og'), 'click', connectToOpenGraph);
}

function checkForUsers() {
  _fbUsers = social.getUsernames();
}

function socialLoaded() {
  var usernames = social.getUsernames();
  presence.getPresenceForUsers(usernames, onPresenceForFriendsList, 20);
}

function connectToOpenGraph(evt) {
  _logEvent('user connected to open graph');
  if (sp.social.openGraphAvailable && !sp.social.openGraphEnabled && typeof sp.social.togglePostToOG === 'function') {
    sp.social.togglePostToOG();
  }
  popup.close();
}

function renderFriends(data) {
  for (var i = 0, l = data.length; i < l; i++) {
    if (_recentTracks.length >= _howManyFriends) {
      break;
    }
    renderFriend(data[i]);
  }

  while (l < _howManyFriends) {
    removePlaceholder(l);
    l++;
  }
}

function removePlaceholder(index) {
  _logEvent('empty space rendered', {index: index});
  var element = dom.id('item-' + (index + 1));
  dom.destroy(element);
}

var renderFriend = (function() {
  var index = 1;
  var infoTemplate = fs.readFile('assets/templates/list-item-info.html');
  return function(data) {
    if (_recentTracks.length < _howManyFriends) {
      m.Track.fromURI(data.trackUri, function(track) {
        if (track.availability === 0 && _recentTracks.length < _howManyFriends) {
          var playlistArt = new views.Player();

          playlistArt.context = new m.Playlist();
          playlistArt.context.add(track);
          playlistArt.track = track;

          playlistArt.node.classList.add('sp-image-large');

          if (data.user.picture) {
            var friendPic = new ui.SPImage(data.user.picture).node;
            friendPic.classList.add('sp-player-image');
            friendPic.classList.remove('image');
            dom.replace(playlistArt.image, friendPic);
          }

          _recentTracks.push(track);
          var userName = data.user.facebookUid ? data.user.name : 'One of your friends';
          dom.id('list-item-artwork-' + index).appendChild(playlistArt.node);
          dom.id('list-item-info-' + index).innerHTML = lang.format(infoTemplate, [userName, track.data.name, getArtistName(track.data.artists)]);
          index += 1;
        }
      });
    }
  };
})();

function renderFallbackMessage() {
  _logEvent('no friends data received, fallback message rendered');
  popup.renderFallbackMessage(dom.id('friends-container'), '<p>Sorry, we couldn\'t get your Facebook friends.</p>');
}

function onPresenceForFriendsList(data) {
  var recentPlays = [];

  for (var user in data) {
    var uData = data[user];
    for (var i = 0, len = uData.length; i < len; i++) {
      var activity = uData[i];
      // type == 1 - track was listened to
      if (activity.type == 1 && activity.hasOwnProperty('user')) {
        recentPlays.push(activity);
        break;
      }
    }
  }
  recentPlays = shuffle(recentPlays);
  if (recentPlays.length > 0) {
    renderFriends(recentPlays);
  } else {
    renderFallbackMessage();
  }
}

function shuffle(a) {
  for (var j, x, i = a.length; i; j = parseInt(Math.random() * i, 10), x = a[--i], a[i] = a[j], a[j] = x);
  return a;
}

function getArtistName(artists) {
  var string = '';
  for (var i = 0, length = artists.length; i < length; ++i) {
    if (0 !== i)
      string += ', ';
    if (artists[i].name)
      string += artists[i].name.decodeForHTML();
  }
  return string;
}
