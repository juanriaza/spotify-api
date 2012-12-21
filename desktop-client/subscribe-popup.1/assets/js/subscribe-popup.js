'use strict';

var sp = getSpotifyApi(1);

exports.init = init;

var _howMany = 4;
var _isNewUser;

var m = sp.require('$api/models');
var views = sp.require('$api/views');
var filesystem = sp.require('$util/fs');
var lang = sp.require('$util/language');
var dom = sp.require('$util/dom');
var r = sp.require('$util/react');
var ui = sp.require('$unstable/ui');
var storage = sp.require('$util/storage');
var social = sp.require('$unstable/social');

var schema = sp.require('$unstable/hermes/discovery');
var pop = sp.require('assets/js/popup');
var datasource = sp.require('assets/js/playlist-datasource');

var _logEventVersion = '2';
var _logTestVersion = '1';
var _logTitle = 'playlist subscribe button';

var spViews = sp.require('assets/js/track-list-view');
var logger = pop.logEvent.bind(this, _logTitle, _logEventVersion, _logTestVersion);
var langCatalog = lang.loadCatalog('assets/main');
var translate = lang.getString.bind(lang, langCatalog);

var popup;
var mode;

var playlists = [];
var renderedPlaylists = [];
var friendsLists = null;
var regionLists = null;
var friendIndex = 0;
var regionIndex = 0;

var logEvent = function(eventName) {
  logger(eventName, {isNewUser: _isNewUser});
};

function init(type, config, args, newUser) {
  _isNewUser = newUser;
  logEvent('popup shown');

  popup = new pop.Popup(type, config);
  mode = args[0];

  var translations = [];

  if (newUser) {
    translations = [
      translate('subscribe-popup', 'sHeaderTutorial'),
      translate('subscribe-popup', 'sTaglineTutorial'),
      translate('buttons', 'sOkThanks')
    ];
  } else {
    translations = [
      translate('subscribe-popup', 'sHeaderOldUser'),
      translate('subscribe-popup', 'sTaglineOldUser'),
      translate('buttons', 'sOkThanks')
    ];
  }

  popup.render(translations);

  popup.renderPlaceholders(dom.id('suggestedPlaylists'), _howMany);

  //datasource.discoveryPlaylists(parseLists, onFailure);
  datasource.customPlaylists(parseLists, onFailure);

  popup.adjustWindowSize();

  dom.id('subscribeButton').addEventListener('click', subscribe);
}

function subscribe(button) {
  if (button.className != 'off') {
    var allChecks = dom.query('.checkBox');
    var hasACheck = false;
    var count = 0;

    for (var i = 0; i < allChecks.length; i++) {
      if (allChecks[i].className.indexOf('checkBoxClear') == -1) {
        playlists[i].subscribed = true;
        count++;
      }
    }

    logEvent('close with subscriptions', { 'subscribe-count' : count });
  } else {
    logEvent('close after unchecking all');
  }
  popup.close();
}

function renderNoPlaylist() {
  var newLi = document.getElementById((playlists.length));
  newLi.innerHTML = '';
  playlists.push(0);
  logEvent('empty space shown');
}

function prepRenderPlaylist(playlistData, type) {
  //console.log('request playlist ' + playlistData.uri);
  var pl = m.Playlist.fromURI(playlistData.uri, function(playlist) {
    if (renderedPlaylists.indexOf(playlist.uri) > -1 || playlist.subscribed) {
      //console.log('skip playlist');
      window.setTimeout(renderNextPlaylist, 100);
    } else {
      //console.log('render playlist');
      renderPlaylist(playlist, type, playlistData.name, playlistData.creator);
    }
  });
}

function renderPlaylist(playlist, type, playlistName, creatorName) {
  var playlistArt = new views.Player();
  //playlistArt.track = playlist.data.getTrack(0);
  playlistArt.context = playlist;
  playlistArt.node.classList.add('sp-image-large');

  var image = dom.queryOne('.sp-image', playlistArt.node);
  if (!image) {
    //console.log('skip playlist - no image');
    window.setTimeout(renderNextPlaylist, 100);
    return;
  }

  if (type === 'topFriends' && playlist.data.owner && playlist.data.owner.picture) {
    var friendPic = new ui.SPImage(playlist.data.owner.picture).node;
    friendPic.classList.add('sp-player-image');
    dom.replace(playlistArt.image, friendPic);
  } else {
    playlistArt.image.firstChild.href = '#';
  }

  var ownerName = creatorName || playlist.data.owner && playlist.data.owner.name;
  var subtitle = !ownerName ? '' : translate('subscribe-popup', 'sBy') + ' ' + ownerName;
  var infoLine = '';

  if (type == 'topFriends' || type == 'recent' || type == 'topLocal') {
    if (playlist.subscriberCount < 5) {
      infoLine = translate('subscribe-popup', 'sNewPlaylist');
    } else {
      infoLine = playlist.subscriberCount + ' ' + translate('subscribe-popup', 'sSubscribers');
    }
  }

  // Whole Tamale
  var replacements = [
    playlistName || playlist.name,
    subtitle,
    playlist.uri,
    infoLine
  ];

  playlists.push(playlist);
  var newLi = document.getElementById('item-' + playlists.length);
  newLi.innerHTML = lang.format(filesystem.readFile('assets/templates/list-item-2.xml'), replacements);
  newLi.insertBefore(playlistArt.node, newLi.firstChild);
  playlist.ignore(m.EVENT.CHANGE); // don't refresh cover art when playlist is updated

  var checkBox = dom.queryOne('.checkBox', newLi);
  r.fromDOMEvent(checkBox, 'click').subscribe(function(e) { toggleCheckBox(checkBox); });
  renderedPlaylists.push(playlist.uri);

  window.setTimeout(function() {
    var trackList = new spViews.TrackList(playlist, mode, 'fade');
    trackList.append(playlistArt.node);
    playlist.observe(m.EVENT.CHANGE, trackList.checkForScroller.bind(trackList));
  }, 20);
}

function toggleCheckBox(checkBox) {
  if (checkBox.className.indexOf('checkBoxClear') == -1) {
    checkBox.classList.add('checkBoxClear');
    logEvent('unchecked playlist');
  } else {
    checkBox.classList.remove('checkBoxClear');
    logEvent('checked playlist');
  }

  var allChecks = dom.query('.checkBox');
  var i = 0;
  var hasACheck = false;

  for (i; i < allChecks.length; i++) {
    if (allChecks[i].className.indexOf('checkBoxClear') == -1) {
      hasACheck = true;
      break;
    }
  }

  var button = document.getElementById('subscribeButton');
  if (hasACheck) {
    button.innerHTML = translate('buttons', 'sOkThanks');
    button.classList.remove('off');
  } else {
    button.innerHTML = translate('buttons', 'sNoThanks');
    button.classList.add('off');
  }
}

function renderNextPlaylist() {
  if (friendIndex >= friendsLists.length && regionIndex >= regionLists.length) {
    friendIndex++;
    renderNoPlaylist();
  } else if (friendIndex < friendsLists.length && (regionIndex >= regionLists.length || friendIndex < regionIndex)) {
    prepRenderPlaylist(friendsLists[friendIndex], 'topFriends');
    friendIndex++;
  } else {
    prepRenderPlaylist(regionLists[regionIndex], 'topLocal');
    regionIndex++;
  }
}

function parseLists(friendsPlaylists, regionPlaylists) {
  friendsLists = shuffle(friendsPlaylists);
  regionLists = shuffle(regionPlaylists);

  if (friendsLists.length === 0 && regionLists.length === 0) {
    logEvent('no playlists to recomend');
    popup.close();
  }

  logEvent('got playlist data');

  while (friendIndex + regionIndex < _howMany) {
    var howmany = friendIndex + regionIndex;
    renderNextPlaylist();
  }
}

function onFailure() {
  logEvent('failed to get playlist data');
  popup.close();
}

function shuffle(a) {
  for (var j, x, i = a.length; i; j = parseInt(Math.random() * i, 10), x = a[--i], a[i] = a[j], a[j] = x);
  return a;
}
