'use strict';

var sp = getSpotifyApi(1);

exports.TrackList = TrackListView;
exports.getArtistName = textFromArtistsArray;

var m = sp.require('$api/models');
var views = sp.require('$api/views');
var dom = sp.require('$util/dom');
var nano = sp.require('$unstable/nano-scroller');

function TrackListView(playlist, mode, animation) {
  var trackIndex = 0;
  var availableTrackIndex = 0;
  var maxTrackNumber = 10;
  var defaultMode = 'getBigItemView';

  this.hasScrollbar = false;

  this.mode = itemViews[mode] ? mode : defaultMode;

  this.node = document.createElement('div');
  this.node.classList.add('sp-track-list');
  this.node.classList.add('nano');

  this.list = new views.List(playlist, itemViews[this.mode], filterItems);
  this.list.node.classList.add('content');
  this.list.node.classList.add(this.mode);
  if (animation) {
    this.list.node.classList.add(animation);
  }
  this.node.appendChild(this.list.node);

  function filterItems(track) {
    var a = track.availability;
    var available = !track.loaded ? false : a === 0;

    trackIndex++;
    if (available) {
      availableTrackIndex++;
    }

    if (trackIndex === this.collection.length) { // we reached the end of collection, reset counters
      trackIndex = 0;
      availableTrackIndex = 0;
    }

    return available && availableTrackIndex < maxTrackNumber ? true : false;
  }
}

TrackListView.prototype.append = function(node) {
  var tracklist = this;
  node.appendChild(this.node);
  tracklist.checkForScroller();
};

TrackListView.prototype.animate = function(animation) {
  this.list.node.classList.add(animation);
};

TrackListView.prototype.checkForScroller = function() {
  //console.log('checking scroller ' + this.list.node.scrollHeight + ' ' + this.list.node.offsetHeight);
  if (!this.hasScrollbar && this.list.node.scrollHeight > this.list.node.offsetHeight) {
    createScroller(this.node);
    this.hasScrollbar = true;
  }
};

var itemViews = {
  getStandardItemView: function(track) {
    var fields = views.Track.FIELD;
    var trackView = new views.Track(track, fields.STAR | fields.NAME);

    var artistName = createArtistNameField(track);
    trackView.node.appendChild(artistName);

    return trackView;
  },

  getItemViewWithPlay: function(track) {
    var list = this;
    var fields = views.Track.FIELD;
    var trackView = new views.Track(track, fields.NAME);

    var artistName = createArtistNameField(track);
    trackView.node.appendChild(artistName);

    var playField = createPlayButton();
    dom.prepend(trackView.node, playField);
    return trackView;
  },

  getBigItemView: function(track) {
    var list = this;
    list._itemHeight = 45;

    var fields = views.Track.FIELD;
    var trackView = new views.Track(track, fields.NAME);

    var artistName = createArtistNameField(track);
    trackView.node.appendChild(artistName);

    var playField = createPlayButton();
    dom.prepend(trackView.node, playField);

    return trackView;
  }
};

function textFromArtistsArray(artists) {
  var string = '';
  for (var i = 0, length = artists.length; i < length; ++i) {
    if (0 !== i)
      string += ', ';
    if (artists[i].name)
      string += artists[i].name.decodeForHTML();
  }
  return string;
}

function createArtistNameField(track) {
  var artistName = document.createElement('span');
  artistName.classList.add('sp-track-field-artist');
  artistName.innerHTML = textFromArtistsArray(track.data.artists);
  return artistName;
}

function createScroller(node) {
  var slider = document.createElement('div');
  slider.classList.add('pane');
  slider.innerHTML = '<div class="slider"></div>';
  dom.prepend(node, slider);

  nano.scroller(node, function() {});
}

function createPlayButton() {
  var playField = document.createElement('span');
  playField.classList.add('sp-track-field-play');
  playField.innerHTML = '<span class="sp-icon-play"></span>';

  var playClick = new dom.Event('dblclick', true, true, 'MouseEvents');
  playField.addEventListener('click', function(evt) {
    var trackNode = evt.target.parentNode.parentNode; // FIND BETTER WAY TO DO THAT!!!
    if (trackNode.classList.contains('sp-track-playing')) {
      m.player.playing = trackNode.classList.contains('sp-track-paused');
    } else {
      playClick.dispatch(this);
    }
  });

  return playField;
}
