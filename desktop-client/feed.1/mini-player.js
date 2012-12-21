/**
 * @module Mini Player
 * @author Jonas Westerlund <jonasw@spotify.com>
 */

'use strict';

sp = getSpotifyApi();

// Imports
var $language = sp.require('$util/language');
var $models = sp.require('$api/models');
var $views = sp.require('$api/views');

// Exports
exports.MiniPlayer = MiniPlayer;

/**
 * [MiniPlayer description]
 * @constructor
 */
function MiniPlayer() {
  var player = this;
  player.resource = null;
  player.node = document.createElement('div');
  player.playing = false;

  player.button = document.createElement('a');
  player.nameNode = player.node.cloneNode();
  player.infoNode = player.node.cloneNode();

  player.node.className = 'player paused';
  player.nameNode.className = 'name sp-text-truncate';
  player.infoNode.className = 'info sp-text-truncate';

  function onPlayerStateChanged(e) {
    if (e.data.playstate) {
      if (sp.trackPlayer.getIsPlaying() && player.isCurrentlyPlaying()) {
        player.play(false);
      } else {
        player.pause(false);
      }
    }
  }

  player.node.addEventListener('DOMNodeInsertedIntoDocument', function(e) {
    sp.trackPlayer.addEventListener('playerStateChanged', onPlayerStateChanged);
  });
  player.node.addEventListener('DOMNodeRemovedFromDocument', function(e) {
    sp.trackPlayer.removeEventListener('playerStateChanged', onPlayerStateChanged);
  });

  player.button.addEventListener('click', function(e) {
    e.preventDefault();
    player.toggle(true);
  });

  player.button.classList.add('play');

  player.node.appendChild(player.button);
  player.node.appendChild(player.nameNode);
  player.node.appendChild(player.infoNode);
}

/**
 * [toggle description]
 * @param  {boolean} perform [description].
 * @return {boolean} [description].
 */
MiniPlayer.prototype.toggle = function(perform) {
  return true === this.playing ? this.pause(perform) : this.play(perform);
};

/**
 * [triggerPlayerEvent description]
 * @param  {[type]} player [description].
 * @param  {[type]} playing [description].
 * @return {Event} [description].
 */
function triggerPlayerEvent(player, playing) {
  var e = document.createEvent('Event');
  e.initEvent('playstatechange', true, true);
  e.playing = playing;
  e.resource = player.resource;
  return player.node.dispatchEvent(e);
}

/**
 * [play description]
 * @param  {boolean} perform [description].
 * @return {Player} [description].
 */
MiniPlayer.prototype.play = function(perform) {
  if (perform && !triggerPlayerEvent(this, true)) return;

  var player = this;
  player.playing = true;
  player.node.classList.remove('paused');
  if (false === perform)
    return player;
  // Already on this song
  if (player.onSameSong()) {
    sp.trackPlayer.setIsPlaying(player.playing);
  } else {
    sp.trackPlayer.playTrackFromUri(player.resource.uri, {
      onSuccess: id,
      onFailure: function() {
        player.pause();
      }
    });
  }
  return player;
};

/**
 * [pause description]
 * @param  {boolean} perform [description].
 * @return {Player} [description].
 */
MiniPlayer.prototype.pause = function(perform) {
  if (perform && !triggerPlayerEvent(this, false)) return;

  this.playing = false;
  this.node.classList.add('paused');
  if (true === perform)
    sp.trackPlayer.setIsPlaying(this.playing);
  return this;
};

/**
 * [loadURI description]
 * @param  {string} uri [description].
 */
MiniPlayer.prototype.loadURI = function(uri) {
  var player = this;
  var linkType = sp.core.getLinkType(uri);
  var image = null;
  if ($models.Link.TYPE.TRACK === linkType) {
    // Load track
    $models.Track.fromURI(uri, partial(playTrack, player));
    // Set current state
    if (player.isCurrentlyPlaying()) {
      player.play(false);
    }
  } else if ($models.Link.TYPE.PLAYLIST === linkType || $models.Link.TYPE.STARRED == linkType || $models.Link.TYPE.TOPLIST == linkType) {
    // Load Playlist
    $models.Playlist.fromURI(uri, partial(playPlaylist, player));
    // Set current state
    if (player.isCurrentlyPlaying()) {
      player.play(false);
    }
  }
  player.button.href = uri;
};

/**
 * [playTrack description]
 * @param  {Player} player [description].
 * @param  {Track} track [description].
 * @return {Track} [description].
 */
function playTrack(player, track) {
  var image;
  var artistArr = map(function(a) {
    return $language.format('<a href=\"{0}\">{1}</a>',
        a.uri.decodeForHTML(),
        a.name.decodeForHTML());
  }, track.data.artists) || [];
  player.resource = track;
  if (null !== track.image) {
    image = new $views.Image(track.image);
    player.node.appendChild(image.node);
  }
  player.nameNode.innerHTML = $language.format('<a href=\"{0}\">{1}</a>',
      track.uri.decodeForHTML() + '?action=browse',
      track.name.decodeForHTML());
  player.infoNode.innerHTML = artistArr.join(', ');

  player.button.title = player.resource.name.decodeForText();
  return track;
}

/**
 * [playPlaylist description]
 * @param  {Player} player [description].
 * @param  {Playlist} pl [description].
 * @return {Playlist} [description].
 */
function playPlaylist(player, pl) {
  var image;
  player.resource = pl;

  if (null !== pl.image) {
    image = new $views.Image(pl.image);
    player.node.appendChild(image.node);
  } else {
    image = document.createElement('div');
    image.classList.add('sp-image');
    player.node.appendChild(image);
    player.node.removeChild(player.button);
  }
  player.nameNode.innerHTML = $language.format('<a href=\"{0}\">{1}</a>',
      pl.uri.decodeForHTML(),
      pl.name.decodeForHTML());
  player.infoNode.textContent = pl.data.owner.name.decodeForText();

  player.button.title = player.resource.name.decodeForText();
  return pl;
}

/**
 * Check if the "real" player is currently playing this player's resource
 * @return {boolean} [description].
 */
MiniPlayer.prototype.isCurrentlyPlaying = function() {
  return sp.trackPlayer.getIsPlaying() && this.onSameSong();
};

/**
 * [onSameSong description]
 * @return {boolean} [description].
 */
MiniPlayer.prototype.onSameSong = function() {
  var currentlyPlaying = sp.trackPlayer.getNowPlayingTrack();
  var context = sp.trackPlayer.getPlayingContext();
  var uri;
  if (null === this.resource || null === currentlyPlaying) {
    return false;
  }
  uri = this.resource.uri;
  if (uri === currentlyPlaying.track.uri ||
      context.length && context[0] === uri) {
    return true;
  }
  return false;
};
