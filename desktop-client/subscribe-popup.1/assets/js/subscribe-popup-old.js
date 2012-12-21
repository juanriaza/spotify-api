'use strict';

var sp = getSpotifyApi(1);

exports.init = init;

var models = sp.require('$api/models');
var views = sp.require('$api/views');
var filesystem = sp.require('$util/fs');
var lang = sp.require('$util/language');
var dom = sp.require('$util/dom');
var r = sp.require('$util/react');
var fx = sp.require('$util/fx');
var social = sp.require('$unstable/social');
var schema = sp.require('$unstable/hermes/discovery');
var logger = sp.require('$util/logger');

var p = sp.require('assets/js/popup');
var popup;

var _loggingVersion = '2';
var logTitle = 'playlist subscribe button';

var langCatalog = lang.loadCatalog('assets/main');
var translate = lang.getString.bind(lang, langCatalog);

var small = false;
var doubleList = false;
var hideInfo = false;

var playlists = [];
var friendsLists = null;
var regionLists = null;
var friendIndex = 0;
var regionIndex = 0;

function init(type, config, args, newUser) {
  popup = new p.Popup(type, config);

  small = args[0] == 1;
  doubleList = args[1] == 1;
  hideInfo = args[2] == 1;

  var c = lang.loadCatalog('assets/main');
  var translations;

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

  //if (!doubleList || !small) {
  // This is dumb that is it hardcoded. But for now whatever.
  var cellWidth = small ? 180 : 230;
  var width = (cellWidth * 3) + 30;
  var height = small ? (doubleList ? 552 : 330) : (doubleList ? 652 : 380);
  sp.core._set_body_size(width, height, true);
  //}

  prepList();
  getInfo();

  popup.adjustWindowSize();

  dom.id('subscribeButton').addEventListener('click', subscribe);
}

function prepList() {
  var list = document.getElementById('suggestedPlaylists');
  var i = 1;
  var max = doubleList ? 7 : 4;

  logger.logClientEvent(logTitle, 'popup shown', _loggingVersion, '1', {});

  for (i; i < max; i++) {
    var newLi = document.createElement('li');
    newLi.id = i;
    newLi.innerHTML = "<div><div class='spinner'></div></div>";
    list.appendChild(newLi);
  }
  list.classList.add(small ? 'small' : 'large');

  playlists = [];
  friendsLists = null;
  regionLists = null;
  friendIndex = 0;
  regionIndex = 0;
}

function subscribe(button) {
  if (button.className != 'off') {
    var allChecks = dom.query('.checkBox');
    var i = 0;
    var hasACheck = false;
    var count = 0;
    for (i; i < allChecks.length; i++) {
      if (allChecks[i].className.indexOf('checkBoxClear') == -1) {
        playlists[i].subscribed = true;
        count++;
      }
    }
    logger.logClientEvent(logTitle, 'close with subscriptions', _loggingVersion, '1', { 'subscribe-count' : count });
  }
  else {
    logger.logClientEvent(logTitle, 'close after unchecking all', _loggingVersion, '1', {});
  }
  document.location = 'spotify:app:subscribe-popup:close';
}

function renderNoPlaylist() {
  var newLi = document.getElementById((playlists.length));
  newLi.innerHTML = '';
  playlists.push(0);
  logger.logClientEvent(logTitle, 'empty space shown', _loggingVersion, '1', {});
}

function prepRenderPlaylist(playlistData, type) {
  models.Playlist.fromURI(playlistData.uri, function(playlist) {
    renderPlaylist(playlist, type, playlistData.creator);
  });
}

function renderPlaylist(playlist, type, creatorName) {
  var playlistArt = new views.Player();
  if (playlist.data.length == 0) {
    window.setTimeout(renderNextPlaylist, 100);
    return;
  }
  playlistArt.track = playlist.data.getTrack(0);
  playlistArt.context = playlist;
  if (!small) {
    playlistArt.node.classList.add('sp-image-large');
  }
  var image = dom.queryOne('.sp-image', playlistArt.node);
  if (!image) {
    window.setTimeout(renderNextPlaylist, 100);
    return;
  }
  image.href = null;

  var ownerName = creatorName || playlist.data.owner && playlist.data.owner.name;
  var subtitle = !ownerName ? '' : translate('subscribe-popup', 'sBy') + ' ' + ownerName;
  var infoLine;
  if (type == 'topFriends' || type == 'recent' || type == 'topLocal') {
    if (playlist.subscriberCount < 5) {
      infoLine = translate('subscribe-popup', 'sNewPlaylist');
    }
    else {
      infoLine = playlist.subscriberCount + ' ' + translate('subscribe-popup', 'sSubscribers');
    }
  }
  // Whole Tamale
  var replacements = [
    playlist.name,
    subtitle,
    playlist.uri,
    infoLine,
    hideInfo ? 'on' : ''
  ];
  playlists.push(playlist);
  var newLi = document.getElementById((playlists.length));
  newLi.innerHTML = lang.format(filesystem.readFile('assets/templates/list-item.xml'), replacements);
  newLi.insertBefore(playlistArt.node, newLi.firstChild);

  var checkDiv = document.createElement('div');
  checkDiv.classList.add('checkBox');

  checkDiv.id = playlist.uri;

  var checkBox = dom.queryOne('.checkBox', newLi);
  r.fromDOMEvent(checkBox, 'click').subscribe(function(e) { toggleCheckBox(checkBox); });
}

function toggleCheckBox(checkBox) {
  if (checkBox.className.indexOf('checkBoxClear') == -1) {
    checkBox.classList.add('checkBoxClear');
    logger.logClientEvent(logTitle, 'unchecked playlist', _loggingVersion, '1', {});
  }
  else {
    checkBox.classList.remove('checkBoxClear');
    logger.logClientEvent(logTitle, 'checked playlist', _loggingVersion, '1', {});
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
  }
  else {
    button.innerHTML = translate('buttons', 'sNoThanks');
    button.classList.add('off');
  }
}

function renderNextPlaylist() {
  if (friendIndex >= friendsLists.length && regionIndex >= regionLists.length) {
    friendIndex++;
    renderNoPlaylist();
  }
  else if (friendIndex < friendsLists.length && (regionIndex >= regionLists.length || friendIndex < regionIndex)) {
    prepRenderPlaylist(friendsLists[friendIndex], 'topFriends');
    friendIndex++;
  }
  else {
    prepRenderPlaylist(regionLists[regionIndex], 'topLocal');
    regionIndex++;
  }
}

function getInfo() {
  var postObj = {
    'user_info': {
      'country': sp.core.country
    }
  };
  sp.core.getHermes('GET', 'hm://discovery/get-whats-new-data/',
      [
       ['WhatsNewRequest', postObj]
      ],
      {
        onSuccess: function(message) {
          var data = sp.core.parseHermesReply('WhatsNewReply', message);

          friendsLists = (data.friends_playlists && data.friends_playlists.playlists) ? data.friends_playlists.playlists : [];

          regionLists = (data.region_playlists && data.region_playlists.playlists) ? data.region_playlists.playlists : [];
          if (friendsLists.length == 0 && regionLists.length == 0) {
            alert('Sorry we have no playlists to recomend.');
            logger.logClientEvent(logTitle, 'no playlists to recomend', _loggingVersion, '1', {});
            document.location = 'spotify:app:subscribe-popup:close';
          }

          var max = doubleList ? 6 : 3;
          logger.logClientEvent(logTitle, 'got playlist data', _loggingVersion, '1', {});
          while (friendIndex + regionIndex < max) {
            renderNextPlaylist();
          }
        },
        onFailure: function(errorCode) {
          alert('Sorry something has gone wrong.');
          logger.logClientEvent(logTitle, 'failed to get playlist data', _loggingVersion, '1', {});
          document.location = 'spotify:app:subscribe-popup:close';
        }
      }
  );
}
