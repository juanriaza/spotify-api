'use strict';

var sp = getSpotifyApi(1);

exports.init = init;

var dom = sp.require('$util/dom'),
    m = sp.require('$api/models'),
    ui = sp.require('$unstable/ui'),
    v = sp.require('$api/views'),
    logger = sp.require('$util/logger'),
    player = new v.Player();

var p = sp.require('assets/js/popup-util');
var popup;

var _tracksToDisplay = 5; // show n tracks on the popup
var _playAll = true; // play all tracks that were sent to the popup

var _logCtx = 'Idle user popup';
var _logEventVersion = '2'; //?
var _logTestVersion = '1';

function init(type, config, args) {
  popup = new p.Popup(type, config);
  popup.render();

  sp.core.activate();
  logEvent('popup shown');

  var uris = args.map(convertToUri);

  var container = dom.id('tracks-container');

  var trackSet = new TrackSet(uris, container, _tracksToDisplay, _playAll);

  trackSet.renderItems(onClickPlaySingleTrack);

  function onClickPlaySingleTrack(evt) {
    var el = evt.currentTarget;
    trackSet.play(el.dataset.index);
    closePopup();
  }

  dom.id('play-button').addEventListener('click', function() {
    trackSet.playAll();
    closePopup();
  });
}

function convertToUri(el) {
  return el.replace(/\|/g, ':');
}

/**
 * Handles set of tracks sent to the popup
 * @param {Array} URIs - uris of tracks that should be handled.
 * @param {HTMLElement} container - element in which track list should be rendered.
 * @param {Number} tracksToDisplay - how many tracks should be rendered on the popup.
 * @param {Bool} playAll - if true 'play all' plays all tracks from URIs, if false plays only ones rendered.
 * @this TrackSet
 */
function TrackSet(URIs, container, tracksToDisplay, playAll) {
  var _tracks = [];
  var _playList = new m.Playlist();
  var _dataLoaded = false;
  var _container = container;
  var _tracksToDisplay;
  var _loadedEvent = new dom.Event('tracksetLoaded', true);

  (function init() {
    _tracksToDisplay = Math.min(tracksToDisplay || URIs.length, URIs.length);

    if (!playAll) {
      URIs = URIs.slice(0, tracksToDisplay);
    }

    for (var i = 0, l = URIs.length; i < l; i++) {
      _tracks.push({
        uri: URIs[i],
        id: URIs[i].split(':')[2]
      });
      _playList.add(URIs[i]);
    }

    dom.listen(window, 'tracksetLoaded', function() {
      _dataLoaded = true;
      popup.adjustWindowSize();
    });
  })();

  function getArtistName(artists) {
    return artists.map(function(el) {
      return el.name;
    }).join(', ');
  }

  var renderTrack = (function() {
    var howManyRendered = 0;

    return function(index, track) {
      var box = dom.id('item-box-' + index);
      var picPlaceholder = dom.queryOne('.box-pic', box);
      var namePlaceholder = dom.queryOne('.box-track-name', box);
      var artistPlaceholder = dom.queryOne('.box-artist-name', box);

      if (track.data.album && track.data.album.cover) {
        var img = new ui.SPImage(track.data.album.cover);
        dom.empty(picPlaceholder);
        picPlaceholder.appendChild(img.node);
      }
      var artistName = getArtistName(track.data.artists);
      namePlaceholder.innerHTML = track.data.name;
      artistPlaceholder.innerHTML = 'by ' + artistName;

      if (++howManyRendered === _tracksToDisplay) {
        new dom.Event('tracksetLoaded', true).dispatch(window);
      }
    };
  })();

  function createTrackNode(index) {
    var item = document.createElement('li');
    item.className = 'item-box';
    item.id = 'item-box-' + index;
    item.dataset.index = index;

    var spinner = document.createElement('div');
    spinner.className = 'spinner';

    var picPlaceholder = document.createElement('div');
    picPlaceholder.className = 'box-pic';

    var namePlaceholder = document.createElement('span');
    namePlaceholder.className = 'box-track-name';
    namePlaceholder.innerHTML = '&nbsp;';

    var artistPlaceholder = document.createElement('span');
    artistPlaceholder.className = 'box-artist-name';
    artistPlaceholder.innerHTML = '&nbsp;';

    item.appendChild(spinner);
    item.appendChild(picPlaceholder);
    item.appendChild(namePlaceholder);
    item.appendChild(artistPlaceholder);

    return item;
  }

  this.renderItems = function(trackClickCallback) {
    var list = document.createElement('ul');
    _container.appendChild(list);

    var track, item;

    for (var i = 0; i < _tracksToDisplay; i++) {
      item = createTrackNode(i);
      list.appendChild(item);
      item.addEventListener('click', trackClickCallback);

      track = _tracks[i];
      track.track = m.Track.fromURI(track.uri, renderTrack.bind(track, i));
    }

  };

  this.play = function(trackIndex) {
    var index = parseInt(trackIndex, 10);
    if (_tracks[index]) {
      logEvent('track played', {
        index: index,
        uri: _tracks[index].track.uri
      });
      player.play(_tracks[index].track);
    }
  };

  this.playAll = function() {
    if (_dataLoaded) {
      logEvent('all tracks played');
      player.play(_tracks[0].track, _playList);
    }
  };

  this.getTrackSetURI = function() {
    var ids = [];
    for (var i = 0, l = _tracks.length; i < l; i++) {
      ids.push(_tracks[i].id);
    }
    return 'spotify:trackset::' + ids.join(',');
  };
}

function closePopup() {
  setTimeout(function() {
    logEvent('popup closed');
    document.location = sp.core.uri + ':close';
  }, 100);
}

function logEvent(eventName, data) {
  logger.logClientEvent(_logCtx, eventName, _logEventVersion, _logTestVersion, data || {});
}
