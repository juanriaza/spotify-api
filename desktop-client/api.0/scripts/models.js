/**
 * @fileoverview Interfaces to various Spotify resources.
 * @module api/models
 *
 * @property {Library} library See {@link Library}
 * @property {Player}  player See {@link Player}
 * @property {Application} application See {@link Application}
 *
 * @example
 * var sp = getSpotifyApi();
 * var models = sp.require('$api/models');
 *
 * var myAwesomePlaylist = new models.Playlist('My Awesome Playlist');
 * myAwesomePlaylist.add(models.player.track);
 * myAwesomePlaylist.add('spotify:track:6JEK0CvvjDjjMUBFoXShNZ');
 */

'use strict';

var sp = getSpotifyApi();

// Interfaces
exports.Collection = Collection;
exports.Observable = Observable;

// Constructors
exports.Album = Album;
exports.Artist = Artist;
exports.Link = Link;
exports.Playlist = Playlist;
exports.Search = Search;
exports.Track = Track;
exports.User = User;
exports.Toplist = Toplist;

// Functions
exports.readFile = readFile;

// Properties
exports.AVAILABILITY = null;
exports.EVENT = null;
exports.SEARCHTYPE = null;
exports.LOCALSEARCHRESULTS = null;

exports.TOPLISTTYPE = null;
exports.TOPLISTREGION_EVERYWHERE = null;
exports.TOPLISTUSER_CURRENT = null;
exports.TOPLISTMATCHES = null;

/** @typedef {(Array.<Track>)} */
var Tracks;

var _app = null;
var _session = null;
var _player = null;
var _library = null;
var _social = null;

Object.defineProperties(exports, {
  application: {
    get: function() {
      if (!_app) _app = new Application();
      return _app;
    }
  },
  library: {
    get: function() {
      if (!_library) _library = new Library();
      return _library;
    }
  },
  player: {
    get: function() {
      if (!_player) _player = new Player();
      return _player;
    }
  },
  session: {
    get: function() {
      if (!_session) _session = new Session();
      return _session;
    }
  },
  social: {
    get: function() {
      if (!_social) _social = new Social();
      return _social;
    }
  }
});

var md = sp.require('$api/metadata');
var l = sp.require('$util/language');

var cat = l.loadCatalog('$resources/cef_views');
var _ = partial(l.getString, cat, 'Misc');

/**
 * @ignore
 * @enum {number}
 */
var AVAILABILITY = exports.AVAILABILITY = {
  AVAILABLE: 0,  // Resource available
  NOT_IN_REGION: 1,  // Resource cannot be played in user's current region
  NOT_AVAILABLE: 2,  // All other "not available" states
  PREMIUM: 3,  // Available in premium
  BANNED: 4,  // The artist chose to make it not available
  LOCAL_NO_FILE: 5,  // Track is unavailable because it cannot be found on disk
  LOCAL_FILE_NOT_FOUND: 6,  // Track is unavailable because it cannot be found on disk
  LOCAL_FILE_BAD_FORMAT: 7,  // Track is unavailable because it has the wrong encoding
  PURCHASE: 8,  // Available if you purchase.
  NO_STREAM: 9,  // This is a non-local track, and you're not allowed to stream from Spotify.
  CAP_REACHED: 10, // Capping is reached
  DRM_PROTECTED: 11, // The local file was parsed but is DRM protected (and cannot be played)
  TRACK_CAP_REACHED: 13  // Track has been played too many times for track capped accounts
};

/**
 * @ignore
 * @enum {number}
 */
var EVENT = exports.EVENT = {
  LOAD: 1 << 0,
  UNLOAD: 1 << 1,
  CHANGE: 1 << 2,
  ITEMS_ADDED: 1 << 3,
  ITEMS_REMOVED: 1 << 4,
  ITEMS_MOVED: 1 << 5,
  RENAME: 1 << 6,
  LOAD_ERROR: 1 << 7,
  ACTIVATE: 1 << 8,
  DEACTIVATE: 1 << 9,
  ARGUMENTSCHANGED: 1 << 10,
  LINKSCHANGED: 1 << 11,
  LOGIN: 1 << 12,
  LOGOUT: 1 << 13,
  STATECHANGED: 1 << 14,
  FILTERCHANGED: 1 << 15
};

// Map to C++ event names.
var _EVENT = {};
_EVENT[EVENT.LOAD] = 'load';
_EVENT[EVENT.UNLOAD] = 'unload';
_EVENT[EVENT.CHANGE] = 'change';
_EVENT[EVENT.ITEMS_ADDED] = 'itemsAdded';
_EVENT[EVENT.ITEMS_REMOVED] = 'itemsRemoved';
_EVENT[EVENT.ITEMS_MOVED] = 'itemsMoved';
_EVENT[EVENT.RENAME] = 'rename';
_EVENT[EVENT.ACTIVATE] = 'activate';
_EVENT[EVENT.DEACTIVATE] = 'deactivate';
_EVENT[EVENT.ARGUMENTSCHANGED] = 'argumentsChanged';
_EVENT[EVENT.LINKSCHANGED] = 'linksChanged';
_EVENT[EVENT.LOGIN] = 'login';
_EVENT[EVENT.LOGOUT] = 'logout';
_EVENT[EVENT.STATECHANGED] = 'loginModeChanged';
_EVENT[EVENT.FILTERCHANGED] = 'filterChanged';

// Interfaces

/**
 * Collection base.
 *
 * @name Collection
 * @constructor
 */
function Collection() {
  /**
   * The array containing all items in the Collection.
   * @type {Array}
   */
  this.data = [];
}

/**
 * Add an item to the Collection.
 *
 * @param {*} item Item which is to be added to the Collection.
 * @return {number} The new length of the Collection.
 */
Collection.prototype.add = function(item) {
  return this.data.push(item);
};

/**
 * Remove an item from the Collection.
 *
 * @param {*} item Item which is to be removed from the Collection. A number will remove the item with that index number.
 * @return {Array} An array containing the item that was removed.
 */
Collection.prototype.remove = function(item) {
  var index = item.constructor === Number ? item : this.data.indexOf(item);
  if (-1 === index) {
    return null;
  }
  return this.data.splice(index, 1);
};

/**
 * Gets the item at the specified index in the Collection.
 * @throws {RangeError} If index is out of range.
 * @param {number} index Index of item to get.
 * @return {*} The item.
 */
Collection.prototype.get = function(index) {
  if (index >= this.length) {
    throw new RangeError('Index out of range');
  }
  return this.data[index];
};

/**
 * Get the items from start to start + length. It is inclusive.
 *
 * @param {number} start   Index of first item to get.
 * @param {number} length  Number of items to get.
 * @return {Array} The range of items from start to start + length.
 */
Collection.prototype.getRange = function(start, length) {
  var end = (start + length >= this.length ? this.length : start + length) - 1;
  var range = new Array(end - start);
  for (var i = 0, j = start; j <= end; ++i, ++j) {
    range[i] = this.get(i);
  }
  return range;
};

/**
 * Get the index of an item, or -1 if not found.
 *
 * @param {*} item The item to look for.
 * @return {number} The index of the item.
 */
Collection.prototype.indexOf = function(item) {
  return this.data.indexOf(item);
};

/**
 * Empties the collection.
 */
Collection.prototype.clear = function() {
  this.data.length = 0;
};

/**
 * The number of items in the Collection.
 * @member Collection.prototype.length
 * @type {number}
 */
Object.defineProperty(Collection.prototype, 'length', {
  get: function() {
    return this.data.length;
  }
});

/**
 * Observable base.
 * @name Observable
 * @constructor
 */
function Observable() {
  /**
   * A map of observers that are attached to this object.
   * @type {Object.<string, Function>}
   */
  this.observers = {};
}

/**
 * Register an observer.
 *
 * @param {string} event The event name.
 * @param {Function} observer The observer function.
 */
Observable.prototype.observe = function(event, observer) {
  if (!this.observers[event])
    this.observers[event] = [];
  this.observers[event].push(observer);
  return this;
};

/**
 * Remove observer(s).
 * If the observer parameter is not provided, all observers for the given event will be removed.
 *
 * @param {string} event The event name.
 * @param {Function=} opt_observer The observer function to remove.
 */
Observable.prototype.ignore = function(event, opt_observer) {
  var index = -1;
  // Remove all observers
  if (1 === arguments.length) {
    delete this.observers[event];
    return this;
  }
  // Remove one observer
  if (this.observers[event]) {
    index = this.observers[event].indexOf(opt_observer);
    if (-1 !== index)
      this.observers[event][index] = null; // Can't splice it out, that messes up notify()
  }
  return this;
};

/**
 * Notifies observers about an event.
 * @param {string} event Event to notify about.
 * @param {*} data Data attached to the event.
 */
Observable.prototype.notify = function(event, data) {
  var observers = this.observers[event];
  if (!observers) return this;
  for (var i = 0; i < observers.length; ++i) {
    if (null !== observers[i])
      observers[i](data);
  }
  for (var i = 0; i < observers.length; ++i) {
    if (null === observers[i])
      observers.splice(i, 1);
  }
  if (0 === observers.length)
    delete this.observers[event];
  return this;
};

// Constructors

/**
 * An application object that handles your application's interaction with the rest of the Spotify client.
 * Please note that you should *not* instantiate this class directly - instead, use the models.application property.
 *
 * @constructor
 * @extends {Observable}
 */
function Application() {
  Observable.call(this);

  var self = this;

  sp.core.addEventListener(_EVENT[EVENT.ACTIVATE], function(e) {
    self.notify(EVENT.ACTIVATE, self);
  });

  sp.core.addEventListener(_EVENT[EVENT.DEACTIVATE], function(e) {
    self.notify(EVENT.DEACTIVATE, self);
  });

  sp.core.addEventListener(_EVENT[EVENT.ARGUMENTSCHANGED], function(e) {
    self.notify(EVENT.ARGUMENTSCHANGED, self);
  });

  sp.core.addEventListener(_EVENT[EVENT.LINKSCHANGED], function(e) {
    self.notify(EVENT.LINKSCHANGED, self);
  });

  sp.core.addEventListener(_EVENT[EVENT.FILTERCHANGED], function(e) {
    self.notify(EVENT.FILTERCHANGED, self);
  });
}

/**
 * Activates the application view, so that it is the focus of keyboard events. Call
 * this method only in response to user actions, such if user further input is required
 * when dragging a track onto the application.
 */
Application.prototype.activate = function() {
  sp.core.activate();
};

/**
 * Shows the standard Spotify "Share" popup to allow the user to share the given URI with a variety of social networks.
 *
 * @param {Element} anchorElement The element to anchor the popup to. This should be the button or link the user clicked
 *   to open the share popup.
 * @param {string} uri The URI to share.
 *
 * @example
 * var sp = getSpotifyApi();
 * var models = sp.require('$api/models');
 *
 * models.application.showSharePopup(document.getElementById('header'), 'spotify:track:6JEK0CvvjDjjMUBFoXShNZ');
 *
 */
Application.prototype.showSharePopup = function(anchorElement, uri) {
  var rect = null;

  if (anchorElement != null) {
    rect = anchorElement.getClientRects()[0];
  } else {
    rect = document.body.getClientRects()[0];
  }

  var left = rect.left + (rect.width / 2);
  var right = rect.top + (rect.height / 2);

  sp.social.showSharePopup(parseInt(left), parseInt(right), uri);
};

/**
 * Hides the standard Spotify "Share" popup, if visible.
 */
Application.prototype.hideSharePopup = function() {
  sp.social.hideSharePopup();
};

Object.defineProperties(Application.prototype, {
  /**
   * The arguments that were used to start the application. The arguments are extracted from the URI used to activate
   * the application, in the  format spotify:app:name:arg1:val1:arg2:val2:...:argN:valN.
   * @member Application.prototype.arguments
   * @type {Array.<string>}
   */
  arguments: {
    get: sp.core.getArguments
  },
  /**
   * @member Application.prototype.filter
   */
  filter: {
    get: sp.core.getFilter
  },
  /**
   * The most recent set of URIs that were dropped onto your application.
   * @member Application.prototype.links
   */
  links: {
    get: sp.core.getLinks
  }
});

/**
 * Register an observer. The Application object fires the following events:
 *   <ul>
 *     <li>EVENT.ACTIVATE: Fires when the application is activated.</li>
 *     <li>EVENT.DEACTIVATE: Fires when the application is deactivated.</li>
 *     <li>EVENTS.ARGUMENTSCHANGED: Called when the arguments property changes.</li>
 *     <li>EVENT.LINKSCHANGED: Called when the links property changes.</li>
 *   </ul>
 * @see Observable#observe
 * @param {string} event The event to register for.
 * @param {Function} observer The observer function to register.
 *
 * @example
 * var sp = getSpotifyApi();
 * var models = sp.require('$api/models');
 *
 * models.application.observe(models.EVENT.ACTIVATE, function() {
 *   console.log('Application activated!');
 * });
 *
 */
Application.prototype.observe = Observable.prototype.observe;

Application.prototype.ignore = Observable.prototype.ignore;

Application.prototype.notify = Observable.prototype.notify;

/**
 * An object which represents a link to a Spotify resource.
 *
 * @param {string} uri The URI/HTTP URL.
 * @throws {Error} If the URI is invalid.
 * @constructor
 */
function Link(uri) {
  var linkType = Link.getType(uri);
  if (Link.TYPE.EMPTY === linkType) {
    throw new Error(l.format('Invalid URI: {0}', uri));
  }

  /**
   * The Link type.
   * @type {number}
   */
  this.type = linkType;

  /**
   * The URI of the Link.
   * @type {string}
   */
  this.uri = sp.core.spotifyHttpLinkToUri(uri);
}

/** @return {string} URI as string. */
Link.prototype.toString = function() {
  return this.uri;
};

/** @return {string} URI as string. */
Link.prototype.valueOf = function() {
  return this.uri;
};

/** @return {string} HTTP URL as string. */
Link.prototype.toURL = function() {
  return sp.core.spotifyUriToHttpLink(this.uri);
};

/**
 * Get the link type from a string.
 *
 * @param {string} uri  The link type, which is a value from the {@link Link.TYPE} enum.
 * @return {Link.TYPE} The type of the link.
 */
Link.getType = function(uri) {
  return sp.core.getLinkType(uri);
};

/**
 * @enum {number}
 */
Link.TYPE = {
  /** @desc A link that has not yet been initialized. */
  EMPTY: 0,
  /** @desc A link to an artist. */
  ARTIST: 1,
  /** @desc A link to an album. */
  ALBUM: 2,
  /** @desc A link to a search result. */
  SEARCH: 3,
  /** @desc A link to a track. */
  TRACK: 4,
  /** @desc A link to a playlist. */
  PLAYLIST: 5,
  /** @desc A link that contains nothing that just brings spotify to the front. */
  ACTIVATE: 6,
  /** @desc A link to an internal view. */
  INTERNAL_VIEW: 7,
  /** @desc A link in the spotify:internal: namespace. */
  INTERNAL: 8,
  /** @desc A link to a local track. */
  LOCAL_TRACK: 9,
  /** @desc A link to a profile page. */
  PROFILE: 10,
  /** @desc A link to a user's starred list. */
  STARRED: 11,
  /** @desc A link to a specific ad. */
  AD: 12,
  /** @desc A link to a user's toptracks list. */
  TOPLIST: 13,
  /** @desc A link to recently played. */
  RECENTLY_PLAYED: 14,
  /** @desc A link to the radio view. */
  RADIO: 15,
  /** @desc A link to an image. */
  IMAGE: 16,
  /** @desc A link to a partner page. */
  PARTNER: 17,
  /** @desc A link to a list of tracks. */
  TRACK_SET: 18,
  /** @desc A link that is opened when spotify is autostarted. */
  AUTOSTART: 19,
  /** @desc A link that delays login view (also offline login). */
  LOGIN_DELAY: 20,
  /** @desc A link to an application. */
  APPLICATION: 21,
  /** @desc A link to a Facebook user. */
  FACEBOOK_USER: 22
};

/**
 * Construct an Album from an Object.
 * You should rarely need to use this directly, instead the fromURI static method should be used.
 *
 * Implements {@link Collection}.
 *
 * @param {Object} data The data object used to construct the Album.
 * @constructor
 * @extends {Collection}
 * @extends {Observable}
 */
function Album(data) {
  Collection.call(this);
  Observable.call(this);

  this.loaded = true;
  this.data = data;
}

/**
 * Get an Album object for the given URI.
 * If provided, the callback parameter will be called when the Album has loaded.
 *
 * @param {Link|string} uri A Link or a string containing a Spotify URI for the album.
 * @param {Function=} opt_callback Function to call once the Album has loaded.
 * @return {Album} The album represented by the specified URI.
 * @example
 * var a = Album.fromURI('spotify:album:5zyS3GEyL1FmDWgVXxUvj7', function(album) {
 *   console.log('Album loaded', album.name);
 * });
 */
Album.fromURI = function(uri, opt_callback) {
  var album;
  var link = Link.getType(uri.toString());
  if (Link.TYPE.ALBUM !== link) {
    throw new Error(l.format('Invalid album URI: {0}', uri));
  }
  album = new Album({ uri: uri });
  album.loaded = false;
  sp.core.browseUri(uri, {
    onSuccess: function(data) {
      if (null !== data) {
        album.data = data.album;
        album.data['tracks'] = data.tracks;
        album.loaded = true;
        album.notify(EVENT.CHANGE);
        album.notify(EVENT.LOAD);
      }
      if (opt_callback) opt_callback(album);
    },
    onFailure: function(error) {
      if (opt_callback) opt_callback(album);
    }
  });
  return album;
};

Object.defineProperties(Album.prototype, {
  /**
   * The Artist of the Album.
   * @member Album.prototype.artist
   * @type {?Artist}
   */
  artist: {
    get: function() { return new Artist(this.data.artist); }
  },
  /**
   * URI for the cover art of the Album.
   * @member Album.prototype.image
   * @type {?string}
   */
  image: {
    get: function() {
      return this.data.cover || null;
    }
  },
  /**
   * The number of tracks.
   * @member Album.prototype.length
   * @type {?number}
   */
  length: {
    get: function() {
      return this.loaded ? this.data.tracks.length : 0;
    }
  },
  /**
   * The name of the Album.
   * @member Album.prototype.name
   * @type {?string}
   */
  name: {
    get: function() {
      return this.data.name || null;
    }
  },
  /**
   * The year of the album's release.
   * @member Album.prototype.year
   * @type {?number}
   */
  year: {
    get: function() {
      return this.data.year || null;
    }
  },
  /**
   * Indicates whether the Album is available for playback or not.
   * @member Album.prototype.playable
   * @type {?boolean}
   */
  playable: {
    get: function() {
      return this.loaded ? this.data.availableForPlayback : null;
    }
  },
  /**
   * The tracks of the Album.
   * @member Album.prototype.tracks
   * @type {?Tracks}
   */
  tracks: {
    get: function() {
      return this.loaded ? map(function(track) { return new Track(track); }, this.data.tracks) : null;
    }
  },
  /**
   * The URI of the Album.
   * @member Album.prototype.uri
   * @type {?string}
   */
  uri: {
    get: function() {
      return this.data.uri || null;
    }
  }
});

/**
 * Get a single Track object from the Album.
 *
 * @param {number} index A positive integer not greater than the length of the Album.
 * @throws {RangeError}
 * @return {Track} The track at the specified index.
 */
Album.prototype.get = function(index) {
  if (index >= this.data.tracks.length) {
    throw new RangeError('Index out of range');
  }
  return new Track(this.data.tracks[index]);
};

/**
 * Get a range of Tracks from the Album.
 *
 * @param {number} index The index at which to begin.
 * @param {number} length The number of tracks to get.
 * @return {Track} The tracks in the specified range.
 */
Album.prototype.getRange = Collection.prototype.getRange;

/** @return {string} A string representation of the Album. */
Album.prototype.toString = function() {
  return l.format(_('Item by artists'), this.name, this.data.artist);
};

Album.prototype.observe = Observable.prototype.observe;
Album.prototype.ignore = Observable.prototype.ignore;
Album.prototype.notify = Observable.prototype.notify;

/**
 * Construct an Artist from an Object.
 * You should rarely need to use this directly, instead the fromURI static method should be used.
 *
 * @param {Object} data The data object used to construct the Artist.
 * @constructor
 * @extends {Observable}
 */
function Artist(data) {
  Observable.call(this);

  this.loaded = true;
  this.data = data;
}

/**
 * Get an Artist object for the given URI.
 * If provided, the callback parameter will be called when the Artist has loaded.
 *
 * @param {Link|string} uri A Link or a string containing a Spotify URI for the artist.
 * @param {Function=} opt_callback Function to call once the Artist has loaded.
 * @return {Artist} An Artist object representing the specified URI.
 * @example
 * var a = Artist.fromURI('spotify:artist:4cAaMbr6CLIXAokpayCEOL', function(artist) {
 *   console.log('Artist loaded', artist.name);
 * });
 */
Artist.fromURI = function(uri, opt_callback) {
  var artist;
  var link = Link.getType(uri.toString());
  if (Link.TYPE.ARTIST !== link) {
    throw new Error(l.format('Invalid artist URI: {0}', uri));
  }
  artist = new Artist({});
  artist.loaded = false;
  md.getMetadata(uri, function(data) {
    if (null !== data) {
      artist.data = data;
      artist.loaded = true;
    }
    if (opt_callback) opt_callback(artist);
  });
  return artist;
};

Object.defineProperties(Artist.prototype, {
  /**
   * Portrait image for the Artist.
   * @member Artist.prototype.image
   * @type {?string}
   */
  image: {
    get: function() { return this.data.portrait || null; }
  },
  /**
   * Name of the Artist.
   * @member Artist.prototype.name
   * @type {?string}
   */
  name: {
    get: function() { return this.data.name || null; }
  },
  /**
   * URI of the Artist.
   * @member Artist.prototype.uri
   * @type {?string}
   */
  uri: {
    get: function() { return this.data.uri || null; }
  }
});

/** @return {string} A string representation of the Artist. */
Artist.prototype.toString = function() {
  return this.name;
};

/**
 * The Spotify Player.
 * This constructor should not be used directly, but is included here for documentation purposes.
 * Implements {@link Observable}.
 *
 * @constructor
 * @extends {Observable}
 */
function Player() {
  var player = this;
  player.observers = {};
  sp.trackPlayer.addEventListener('playerStateChanged', function(e) {
    player.notify(EVENT.CHANGE, e);
  });
}

/**
 * Play a track, with optional context.
 *
 * @param {Link|Track|string} track The track to play, as a Track object, Link object, or URI/URL string.
 * @param {Album|Playlist|Artist|Link|string=} opt_context The optional context in which to play the track.
 * @param {number=} opt_index Optional index of the item in the provided context.
 * @return {Player} The Player instance.
 */
Player.prototype.play = function(track, opt_context, opt_index) {
  var player = this;
  if (track.constructor === String) {
    // Convert string to Link
    track = new Link(track);
  } else if (track instanceof Link) {
    if (!(Link.TYPE.TRACK === track.type || Link.TYPE.LOCAL_TRACK === track.type))
      throw new Error(l.format('Invalid track URI: {0}', track.uri));
  }
  if (opt_context) {
    if (opt_context.constructor === String) {
      opt_context = new Link(opt_context);
    } else if (opt_context instanceof Link) {
      if (!(Link.TYPE.PLAYLIST === opt_context.type ||
          Link.TYPE.ALBUM === opt_context.type ||
          Link.TYPE.ARTIST === opt_context.type ||
          Link.TYPE.INTERNAL === opt_context.type)) // For temporary playlists
        throw new Error(l.format('Invalid context URI: {0}', opt_context.uri));
    }
    return this.playTrackWithContext(track, opt_context, opt_index ? opt_index : -1);
  }
  return this.playTrack(track);
};

/**
 * @ignore
 * @param {Track} track The track to play.
 * @return {Player} The Player instance.
 */
Player.prototype.playTrack = function(track) {
  this.track = track;
  return this;
};

/**
 * @ignore
 * @param {Track} track The track to play.
 * @param {Album|Playlist} context The context to play in the track in.
 * @param {number} index The index of the track in the context.
 * @return {Player} The Player instance.
 */
Player.prototype.playTrackWithContext = function(track, context, index) {
  var player = this;
  if (!(context instanceof Playlist || context instanceof Album || context instanceof Artist ||
        context instanceof Link || context.constructor === String)) {
    throw new Error(l.format('Invalid context: {0}', context.toString()));
  }

  if (index === -1 && !track) {
    // loop looking for the next playable track
    var numTracks;
    var i = 0;
    if (context instanceof Playlist) {
      numTracks = context.data.length;
      while (i < numTracks) {
        if (context.data.getTrack(i).availableForPlayback) {
          track = context.data.getTrack(i);
          index = i;
          break;
        } else {
          i++;
        }
      }
    } else if (context instanceof Album) {
      numTracks = context.tracks.length;
      while (i < numTracks) {
        if (context.tracks[i].data.availableForPlayback) {
          track = context.tracks[i];
          index = i;
          break;
        } else {
          i++;
        }
      }
    }
  }

  sp.trackPlayer.playTrackFromContext(context.uri, index, track.uri, {
    onSuccess: function() {
      //console.log(l.format('Playing track {0} ({1}) in context {2} ({3})', track.name, track.uri, context.name, context.uri));
    },
    onFailure: function() {
      //console.log(l.format('Failed playing track {0} ({1}) in context {2} ({3})', track.name, track.uri, context.name, context.uri));
    }
  });
  return this;
};


/**
 * Skip to the previous track.
 * @param {boolean=} opt_alwaysSkip If true, always skips to the previous track no matter how long the current song has
 *   been playing, otherwise skips to the beginning of the song.
 * @return {boolean} Whether the action was successful.
 */
Player.prototype.previous = function(opt_alwaysSkip) {
  return sp.trackPlayer.skipToPreviousTrack(!!opt_alwaysSkip);
};

/**
 * Skip to the next track.
 *
 * @return {boolean} Whether the action was successful.
 */
Player.prototype.next = function() {
  return sp.trackPlayer.skipToNextTrack();
};

Object.defineProperties(Player.prototype, {
  /**
   * @member Player.prototype.context
   * @type {?string}
   */
  context: {
    get: function() {
      var context = sp.trackPlayer.getPlayingContext();
      return context[0] || null;
    }
  },
  /**
   * @member Player.prototype.index
   * @type {?number}
   */
  index: {
    get: function() {
      var context = sp.trackPlayer.getPlayingContext();
      return -1 === context[1] ? null : context[1];
    }
  },
  /**
   * Indicates whether the Player is currently playing. Can be used as a setter.
   * @member Player.prototype.playing
   * @type {boolean}
   */
  playing: {
    get: sp.trackPlayer.getIsPlaying,
    set: sp.trackPlayer.setIsPlaying
  },
  /**
   * Get or set the current position in the currently playing track, if any.
   * @member Player.prototype.position
   * @type {?number}
   */
  position: {
    get: function() {
      var nowPlaying = sp.trackPlayer.getNowPlayingTrack();
      return nowPlaying ? nowPlaying.position : null;
    },
    set: function(position) {
      sp.trackPlayer.seek(position);
    }
  },
  /**
   * Get or set repeat mode.
   * @member Player.prototype.repeat
   * @type {boolean}
   */
  repeat: {
    get: sp.trackPlayer.getRepeat,
    set: sp.trackPlayer.setRepeat
  },
  /**
   * Get or set shuffle mode.
   * @member Player.prototype.shuffle
   * @type {boolean}
   */
  shuffle: {
    get: sp.trackPlayer.getShuffle,
    set: sp.trackPlayer.setShuffle
  },
  /**
   * The currently playing track, or null if none is playing.
   * @member Player.prototype.track
   * @type {?Track}
   */
  track: {
    get: function() {
      var nowPlaying = sp.trackPlayer.getNowPlayingTrack();
      return nowPlaying ? new Track(nowPlaying.track) : null;
    },
    set: function(track) {
      sp.trackPlayer.playTrackFromUri(track instanceof Track ? track.uri : track.toString(), {
        onSuccess: id,
        onFailure: id
      });
    }
  },
  /**
   * Get or set the current volume level as a float between 0.0 and 1.0.
   * @member Player.prototype.volume
   * @type {number}
   */
  volume: {
    get: sp.trackPlayer.getVolume,
    set: sp.trackPlayer.setVolume
  },
  /**
   * Set to true if the repeat property can be changed. Read-only.
   * @member Player.prototype.canChangeRepeat
   * @type {boolean}
   */
  canChangeRepeat: {
    get: sp.trackPlayer.canChangeRepeat
  },
  /**
   * Set to true if the shuffle property can be changed. Read-only.
   * @member Player.prototype.canChangeShuffle
   * @type {boolean}
   */
  canChangeShuffle: {
    get: sp.trackPlayer.canChangeShuffle
  },
  /**
   * Set to true if the player can skip to a previous track. Read-only.
   * @member Player.prototype.canPlayPrevious
   * @type {boolean}
   */
  canPlayPrevious: {
    get: function() {
      return sp.trackPlayer.getPlaybackControlState().previousEnabled;
    }
  },
  /**
   * Set to true if the player can skip to a next track. Read-only.
   * @member Player.prototype.canPlayNext
   * @type {boolean}
   */
  canPlayNext: {
    get: function() {
      return sp.trackPlayer.getPlaybackControlState().nextEnabled;
    }
  },
  /**
   * Set to true if the player can be paused. Read-only.
   * @member Player.prototype.canPlayPause
   * @type {boolean}
   */
  canPlayPause: {
    get: function() {
      return sp.trackPlayer.getPlaybackControlState().playpauseEnabled;
    }
  }
});

/**
 * Register an observer. The Player object fires the following events:
 *   <ul>
 *     <li>EVENT.CHANGE: Fires when something changes.</li>
 *   </ul>
 * @see Observable#observe
 * @param {string} event The event to observe.
 * @param {Function} observer The observer function to register.
 *
 * @example
 * var sp = getSpotifyApi();
 * var models = sp.require('$api/models');
 *
 * models.player.observe(models.EVENT.CHANGE, function(event) {
 *   console.log('Something changed!');
 * });
 *
 */
Player.prototype.observe = Observable.prototype.observe;

Player.prototype.ignore = Observable.prototype.ignore;

Player.prototype.notify = Observable.prototype.notify;

/**
 * Construct a new Playlist.
 * Implements {@link Collection} and {@link Observable}.
 *
 * @param {string=} opt_name The name to use for the Playlist. If no name is provided, a temporary Playlist will be
 *   created.
 * @constructor
 * @extends {Collection}
 * @extends {Observable}
 */
function Playlist(opt_name) {
  var pl = this;
  pl.data = arguments.length === 0 ? sp.core.getTemporaryPlaylist(temporaryName()) :
      opt_name.constructor === Object ? opt_name :
      opt_name instanceof Link ? sp.core.getPlaylist(opt_name.toString()) :
      sp.core.library.createPlaylist(opt_name);

  pl.observers = {};

  pl.data.addEventListener(_EVENT[EVENT.LOAD], function(e) {
    pl.notify(EVENT.LOAD, pl);
  });

  pl.data.addEventListener(_EVENT[EVENT.UNLOAD], function(e) {
    pl.notify(EVENT.UNLOAD, pl);
  });

  pl.data.addEventListener(_EVENT[EVENT.CHANGE], function(e) {
    pl.notify(EVENT.CHANGE, pl);
  });

  pl.data.addEventListener(_EVENT[EVENT.ITEMS_ADDED], function(e) {
    pl.notify(EVENT.ITEMS_ADDED, pl);
  });

  pl.data.addEventListener(_EVENT[EVENT.ITEMS_REMOVED], function(e) {
    pl.notify(EVENT.ITEMS_REMOVED, pl);
  });

  pl.data.addEventListener(_EVENT[EVENT.ITEMS_MOVED], function(e) {
    pl.notify(EVENT.ITEMS_MOVED, pl);
  });

  pl.data.addEventListener(_EVENT[EVENT.RENAME], function(e) {
    pl.notify(EVENT.RENAME, pl);
  });
}

/**
 * Get a Playlist object for the given URI.
 * If provided, the callback parameter will be called when the Playlist has loaded.
 *
 * @param {Link|string} uri A Link or a string containing a Spotify URI for the playlist.
 * @param {Function=} opt_callback Function to call once the Playlist has loaded.
 * @return {Playlist} The Playlist representing the specified URI.
 * @example
 * var pl = Playlist.fromURI('spotify:user:spotify:playlist:3Yrvm5lBgnhzTYTXx2l55x', function(playlist) {
 *   console.log('Playlist loaded', playlist.name);
 * });
 */
Playlist.fromURI = function(uri, opt_callback) {
  var playlist;
  var link = uri instanceof Link ? uri : new Link(uri);
  if (Link.TYPE.PLAYLIST !== link.type && Link.TYPE.STARRED !== link.type && Link.TYPE.TOPLIST !== link.type) {
    throw new Error(l.format('Invalid playlist URI: {0}', uri));
  }
  playlist = new Playlist(link);
  if (playlist.loaded) {
    if (opt_callback) opt_callback(playlist);
  } else {
    playlist.observe(EVENT.LOAD, function observer() {
      if (opt_callback) opt_callback(playlist);
      playlist.ignore(EVENT.LOAD, observer);
    });
  }
  return playlist;
};

Object.defineProperties(Playlist.prototype, {
  /**
   * Indicates whether the Playlist is collaborative or not.
   * @member Playlist.prototype.collaborative
   * @type {?boolean}
   */
  collaborative: {
    get: function() {
      return this.loaded ? this.data.collaborative : null;
    }
  },
  /**
   * Gets or sets the description of the playlist.
   * @member Playlist.prototype.description
   * @type {?string}
   */
  description: {
    get: function() {
      return this.loaded ? this.data.getDescription() : null;
    },
    set: function(description) {
      this.data.setDescription(description);
    }
  },
  /**
   * URI of the image representing the Playlist.
   * @member Playlist.prototype.image
   * @type {?string}
   */
  image: {
    get: function() { return this.data.cover || null; }
  },
  /**
   * Number of Tracks in the Playlist.
   * @member Playlist.prototype.length
   * @type {?number}
   */
  length: {
    get: function() {
      return this.loaded ? this.data.length : 0;
    }
  },
  /**
   * Whether the Playlist has been loaded.
   * @member Playlist.prototype.loaded
   * @type {boolean}
   */
  loaded: {
    get: function() {
      return this.data.loaded;
    }
  },
  /**
   * Name of the Playlist.
   * @member Playlist.prototype.name
   * @type {?string}
   */
  name: {
    get: function() { return this.data.name || null; },
    set: function(name) {
      this.data.rename(name);
    }
  },
  /**
   * The user who created the playlist.
   * @member Playlist.prototype.owner
   * @type {?User}
   */
  owner: {
    get: function() {
      return this.data.owner ? new User(this.data.owner) : null;
    }
  },
  /**
   * Indicates whether the current User is subscribed to the Playlist.
   * @member Playlist.prototype.subscribed
   * @type {?boolean}
   */
  subscribed: {
    get: function() {
      return this.loaded ? this.data.subscribed : null;
    },
    set: function(subscribe) {
      if (subscribe === this.subscribed) return subscribe;
      if (subscribe) {
        sp.core.library.addPlaylist(this.uri);
      } else {
        sp.core.library.removePlaylist(this.uri);
      }
    }
  },
  /**
   * Indicates whether the current User is subscribed to the Playlist
   * Is used by apps from social client instead of subscribed , which is not working properly in all cases
   * @member Playlist.prototype.subscribed
   * @type {?boolean}
   */
  followed: {
    get: function() {
      return this.loaded ? this.data.subscribed : null;
    },
    set: function(subscribe) {
      this.data.subscribed = subscribe;
    }
  },
  /**
   * A list of users subscribing to the Playlist.
   * @member Playlist.prototype.subscribers
   * @type {?Array.<User>}
   */
  subscribers: {
    get: function() {
      return this.loaded ? map(function(user) { return new User(user) }, this.data.getSubscribers()) : null;
    }
  },
  /**
   * The number of users subscribed to this playlist.
   * @member Playlist.prototype.subscriberCount
   * @type {integer}
   */
  subscriberCount: {
    get: function() {
      return this.data.subscriberCount;
    }
  },
  /**
   * All the Tracks in the Playlist. Using this is discouraged, for performance reasons.
   * @member Playlist.prototype.tracks
   * @type {?Tracks}
   */
  tracks: {
    get: function() {
      var tracks = new Array(this.data.length);
      for (var i = 0, l = tracks.length; i < l; ++i) {
        tracks[i] = new Track(this.data.getTrack(i));
      }
      return tracks;
    }
  },
  /**
   * URI for the Playlist. This will only be valid if you initialised the Playlist object with the fromURI() method.
   * @member Playlist.prototype.uri
   * @type {?string}
   */
  uri: {
    get: function() { return this.data.uri || null; }
  }
});

/**
 * Add a Track to the Playlist.
 * @param {Track|Link|string} track Track or Link/URI string.
 * @return {number} The new length of the Playlist.
 */
Playlist.prototype.add = function(track) {
  this.data.add(track instanceof Track ? track.uri : track.toString());
  return this.length;
};

/**
 * Gets the track at the specified index.
 * @return {Track} The track.
 */
Playlist.prototype.get = function(index) {
  return new Track(this.data.getTrack(index));
};

Playlist.prototype.getRange = Collection.prototype.getRange;

/**
 * Gets the index of the first instance of the specified track.
 * @param {Track|Link|string} track The track to find.
 * @return {number} The index of the first instance of the specified track.
 */
Playlist.prototype.indexOf = function(track) {
  var index = -1;
  var uri = track instanceof Track ? track.uri : track.toString();
  for (var i = 0, l = this.length; i < l; ++i) {
    if (uri === this.data.get(i)) {
      index = i;
      break;
    }
  }
  return index;
};

/**
 * Remove a Track from the Playlist.
 * @param {Track|Link|string|number} track Track, Link, URI string or index.
 * @return {number} The new length of the Playlist.
 */
Playlist.prototype.remove = function(track) {
  var uri = track instanceof Track ? track.uri : track.toString();
  this.data.remove(track.constructor === Number ? track : uri);
  return this.length;
};

/** @return {string} A string representation of the Playlist. */
Playlist.prototype.toString = function() {
  return l.format(_('Item by artists'),
      this.name, this.data.owner.name);
};

/**
 * Register an observer. The Playlist object fires the following events:
 *   <ul>
 *     <li>EVENT.LOAD: Called when the playlist has completed loading.</li>
 *     <li>EVENT.UNLOAD: Called when the playlist is unloaded from memory.</li>
 *     <li>EVENT.CHANGE: Called when the playlist is changed.</li>
 *     <li>EVENT.ITEMS_ADDED: Called when tracks have been added to the playlist.</li>
 *     <li>EVENT.ITEMS_REMOVED: Called when tracks have been removed from the playlist.</li>
 *     <li>EVENT.ITEMS_MOVED: Called when tracks have been rearranged within the playlist.</li>
 *     <li>EVENT.RENAME: Called when the playlist is renamed.</li>
 *   </ul>
 * @param {string} event The event to observe.
 * @param {Function} observer The function to register as observer.
 *
 * @example
 * var sp = getSpotifyApi();
 * var models = sp.require('$api/models');
 *
 * var playlist = models.Playlist.fromURI('spotify:user:spotify:playlist:3Yrvm5lBgnhzTYTXx2l55x');
 * playlist.observe(models.EVENT.RENAME, function() {
 *   console.log('Playlist renamed!');
 * });
 *
 */
Playlist.prototype.observe = Observable.prototype.observe;

Playlist.prototype.ignore = Observable.prototype.ignore;

Playlist.prototype.notify = Observable.prototype.notify;

/**
 * Create a name for a temporary playlist.
 */
function temporaryName() {
  return (Date.now() * Math.random()).toFixed();
}

/**
 * Construct a Track from an Object.
 * You should rarely need to use this directly, instead the fromURI static method should be used.
 *
 * @param {Object} data The data object used to construct the Track.
 * @constructor
 */
function Track(data) {
  this.data = data;
}

/**
 * Get a Track object for the given URI.
 * If provided, the callback parameter will be called when the Track has loaded.
 *
 * @param {Link|string} uri A Link or a string containing a Spotify URI for the track.
 * @param {Function=} opt_callback Function to call once the Track has loaded.
 * @return {Track} The Track object representing the specified URI.
 * @example
 * var t = Track.fromURI('spotify:track:3enFTlwkCRF5HUM8xX6FKB', function(track) {
 *   console.log('Track loaded', track.name);
 * });
 */
Track.fromURI = function(uri, opt_callback) {
  var track;
  var link = Link.getType(uri.toString());
  if (!(Link.TYPE.TRACK === link || Link.TYPE.LOCAL_TRACK === link)) {
    throw new Error(l.format('Invalid track URI: {0}', uri));
  }
  track = new Track({uri: uri});
  md.getMetadata(uri, function(data) {
    if (null !== data) {
      track.data = data;
    }
    if (opt_callback) opt_callback(track);
  });
  return track;
};

Object.defineProperties(Track.prototype, {
  /**
   * The Album of the Track.
   * @member Track.prototype.album
   * @type {?Album}
   */
  album: {
    get: function() {
      return this.loaded ? new Album(this.data.album) : null;
    }
  },
  /**
   * An array of Artist objects for this track.
   * @member Track.prototype.artists
   * @type {?Array}
   */
  artists: {
    get: function() {
      return map(function(a) { return new Artist(a); },
          this.data.artists);
    }
  },
  /**
   * @member Track.prototype.availability
   */
  availability: {
    get: function() {
      return this.loaded ? this.data.availability : null;
    }
  },
  /**
   * Duration of the Track in milliseconds.
   * @member Track.prototype.duration
   * @type {?number}
   */
  duration: {
    get: function() { return this.loaded ? this.data.duration : null; }
  },
  /**
   * Image representing the Track.
   * @member Track.prototype.image
   * @type {?string}
   */
  image: {
    get: function() {
      return this.loaded ? this.data.album.cover : null;
    }
  },
  /**
   * Indicates whether the Track data is loaded or not.
   * @member Track.prototype.loaded
   * @type {boolean}
   */
  loaded: {
    get: function() {
      return this.data.isLoaded;
    }
  },
  /**
   * Name of the Track.
   * @member Track.prototype.name
   * @type {?string}
   */
  name: {
    get: function() { return this.data.name || null; }
  },
  /**
   * Indicates whether the Track is available for playback or not.
   * @member Track.prototype.playable
   * @type {?boolean}
   */
  playable: {
    get: function() {
      return this.loaded ? this.data.availableForPlayback : null;
    }
  },
  /**
   * Indicates whether the Track is explicit or not.
   * @member Track.prototype.explicit
   * @type {?boolean}
   */
  explicit: {
    get: function() {
      return this.loaded ? this.data.isExplicit : null;
    }
  },
  /**
   * Whether the track is a local file or not, or null if the track isn't loaded yet.
   * @member Track.prototype.local
   * @type {?boolean}
   */
  local: {
    get: function() {
      return this.loaded ? this.data.isLocal || false : null;
    }
  },
  /**
   * Popularity of the Track as a Number in the range of 0 through 100.
   * @member Track.prototype.popularity
   * @type {?number}
   */
  popularity: {
    get: function() { return this.loaded ? this.data.popularity : null; }
  },
  /**
   * Get or set track starredness.
   * @member Track.prototype.starred
   * @type {?boolean}
   */
  starred: {
    get: function() {
      this.data.starred = exports.library.starredPlaylist.indexOf(this) >= 0;
      return this.data.starred;
    },
    set: function(starred) {
      if (starred === this.starred) return this.data.starred;
      if (starred)
        this.data.starred = true, exports.library.starredPlaylist.add(this);
      else
        this.data.starred = false, exports.library.starredPlaylist.remove(this);
      return this.data.starred;
    }
  },
  /**
   * Number of the Track on the Album it belongs to.
   * @member Track.prototype.number
   * @type {?number}
   */
  number: {
    get: function() { return this.data.trackNumber || null; }
  },
  /**
   * The URI of the Track.
   * @member Track.prototype.uri
   * @type {?string}
   */
  uri: {
    get: function() { return this.data.uri || null; }
  }
});

/** @return {string} A string representation of the Track. */
Track.prototype.toString = function() {
  return l.format(_('Item by artists'),
      this.name, map(function(a) { return a.name; },
      this.data.artists).join(', '));
};

var TOPLISTTYPE = exports.TOPLISTTYPE = {
  USER: 0, // Toplist for a user
  REGION: 1 // Toplist for a region
};

var TOPLISTREGION_EVERYWHERE = exports.TOPLISTREGION_EVERYWHERE = 'everywhere';
var TOPLISTUSER_CURRENT = exports.TOPLISTUSER_CURRENT = '';


var TOPLISTMATCHES = exports.TOPLISTMATCHES = {
  TRACKS: 'track', // Toplist searches for tracks
  ARTISTS: 'artist', // Toplist searches for artists
  ALBUMS: 'album' // Toplist searches for albums
};

/**
 * Object representing a Spotify top list - the most popular tracks, artists and albums
 * for a region or user. Please note that if you request another user's toplists,
 * you may get no results if that user hasn't publically published their toplists.
 *
 * @example
 * var sp = getSpotifyApi();
 * var models = sp.require('$api/models');
 *
 * var toplist = new models.Toplist();
 * toplist.toplistType = models.TOPLISTTYPE.REGION;
 * toplist.matchType = models.TOPLISTMATCHES.ARTISTS;
 * toplist.region = 'SE';
 *
 * toplist.observe(models.EVENT.CHANGE, function() {
 *   toplist.results.forEach(function(artist) {
 *     console.log(artist.name);
 *   });
 * });
 *
 * toplist.run();
 *
 * @constructor
 * @extends {Observable}
 */
function Toplist() {
  Observable.call(this);

  this.toplistType = TOPLISTTYPE.USER;
  this.matchType = TOPLISTMATCHES.TRACKS;
  this.userName = TOPLISTUSER_CURRENT;
}

Object.defineProperties(Toplist.prototype, {
  /**
   * The type of top list to fetch. Defaults to TOPLISTTYPE.USER. Possible values:
   *   <ul>
   *     <li>TOPLISTTYPE.USER: Get toplists for a user.</li>
   *     <li>TOPLISTTYPE.REGION: Get toplists for a geographical region.</li>
   *   </ul>
   * @member Toplist.prototype.toplistType
   * @type {Models.TOPLISTTYPE}
   */
  toplistType: {
    get: function() {
      return this._toplistType;
    },
    set: function(newType) {
      this._toplistType = newType;
    }
  },
  /**
   * Either the region as a two-character region name (such as SE for Sweden) or TOPLISTREGION_EVERYWHERE for a global
   *   toplist.
   * @member Toplist.prototype.region
   * @type {string}
   */
  region: {
    get: function() {
      return this.type == TOPLISTTYPE.REGION ? this._region : 'user';
    },
    set: function(newRegion) {
      this._region = newRegion;
      this.type = TOPLISTTYPE.REGION;
    }
  },
  /**
   * Either the Spotify username to get toplists for, or TOPLISTUSER_CURRENT for the current user.
   * @member Toplist.prototype.userName
   * @type {string}
   */
  userName: {
    get: function() {
      return this.type == TOPLISTTYPE.USER ? this._userName : '';
    },
    set: function(newUserName) {
      this._userName = newUserName;
      this.type = TOPLISTTYPE.USER;
    }
  },
  /**
   * The kind of item to match. Defaults to TOPLISTMATCHES.TRACKS. Possible values:
   *   <ul>
   *     <li>TOPLISTMATCHES.TRACKS: Match tracks.</li>
   *     <li>TOPLISTMATCHES.ALBUMS: Match albums.</li>
   *     <li>TOPLISTMATCHES.ARTISTS: Match artists.</li>
   *   </ul>
   * @member Toplist.prototype.matchType
   * @type {Models.TOPLISTMATCHES}
   */
  matchType: {
    get: function() {
      return this._matchType;
    },
    set: function(newMatchType) {
      this._matchType = newMatchType;
    }
  },
  /**
   * The results returned by the top list, if any. Read-only.
   * @member Toplist.prototype.results
   * @type {Array}
   */
  results: {
    get: function() {
      return this._results;
    }
  },
  /**
   * True if the top list is currently running. Read-only.
   * @member Toplist.prototype.running
   * @type {boolean}
   */
  running: {
    get: function() {
      return this._running;
    }
  }
});

/**
 * Fetches the configured toplist. Please note that if you request another user's toplists,
 * you may get no results if that user hasn't publically published their toplists.
 */
Toplist.prototype.run = function() {
  if (this.running === true) {
    return;
  }

  this._running = true;
  var self = this;

  sp.social.getToplist(this.matchType, this.region, this.userName, {
    onSuccess: function(result) {
      self._results = [];

      if (self.matchType == TOPLISTMATCHES.TRACKS && result.tracks) {
        result.tracks.forEach(function(track) {
          self._results.push(new Track(track));
        });
      }

      if (self.matchType == TOPLISTMATCHES.ARTISTS && result.artists) {
        result.artists.forEach(function(artist) {
          self._results.push(new Artist(artist));
        });
      }

      if (self.matchType == TOPLISTMATCHES.ALBUMS && result.albums) {
        result.albums.forEach(function(album) {
          self._results.push(new Album(album));
        });
      }

      self._running = false;

      self.notify(EVENT.LOAD, self);
      self.notify(EVENT.CHANGE, self);
      self.notify(EVENT.ITEMS_ADDED, self);
    },

    onFailure: function(error) {
      self._running = false;
      self.notify(EVENT.LOAD_ERROR, error);
    },

    onComplete: function() {
    }
  });
};

/**
 * Register an observer. The Toplist object fires the EVENT.CHANGE, EVENT.ITEMS_ADDED, EVENT.LOAD_ERROR events.
 * @see Observable#observe
 * @param {string} event The event to observe.
 * @param {Function} observer The function to register as observer.
 */
Toplist.prototype.observe = Observable.prototype.observe;

Toplist.prototype.ignore = Observable.prototype.ignore;

Toplist.prototype.notify = Observable.prototype.notify;

var SEARCHTYPE = exports.SEARCHTYPE = {
  NORMAL: 0, // A normal search
  SUGGESTION: 1 // Search suggestions for a partially-entered query
};

var LOCALSEARCHRESULTS = exports.LOCALSEARCHRESULTS = {
  IGNORE: 0, // Ignore local results entirely
  PREPEND: 1, // Add local results to the beginning of the result list
  APPEND: 2 // Add local results to the end of the result list
};

/**
 * Object representing a Spotify search. Note that searches use a non-trivial amount of
 * resources in the Spotify backend - please keep this in mind when writing your application.
 *
 * @example
 * var sp = getSpotifyApi();
 * var models = sp.require('$api/models');
 *
 * var search = new models.Search('Counting Crows');
 * search.localResults = models.LOCALSEARCHRESULTS.APPEND;
 *
 * search.observe(models.EVENT.CHANGE, function() {
 *   search.tracks.forEach(function(track) {
 *     console.log(track.name);
 *   });
 * });
 *
 * search.appendNext();
 *
 * @param {string} query The query to search for. For advanced syntax, see {@link http://www.spotify.com/about/features/advanced-search-syntax/}.
 * @param {Object} options Optional options object to configure the search. See properties for keys.
 * @constructor
 * @extends {Observable}
 */
function Search(query, options) {
  Observable.call(this);

  options = options || {};
  this._running = false;

  this._tracks = [];
  this._albums = [];
  this._artists = [];
  this._playlists = [];

  this._totalAlbums = 0;
  this._totalArtists = 0;
  this._totalTracks = 0;
  this._totalPlaylists = 0;

  /**
   * The number of items to search for per "page". For performance reasons, you should set this to the lowest reasonable
   *   number for your UI. Defaults to 50.
   * @type {integer}
   */
  this.pageSize = options.pageSize ? parseInt(options.pageSize) : 50;
  /**
   * Whether or not to include albums in the search results. For performance reasons, this should be set to false if not
   *   needed. Defaults to true.
   * @type {boolean}
   */
  this.searchAlbums = (options.searchAlbums !== false) ? true : false;
  /**
   * Whether or not to include artists in the search results. For performance reasons, this should be set to false if
   *   not needed. Defaults to true.
   * @type {boolean}
   */
  this.searchArtists = (options.searchArtists !== false) ? true : false;
  /**
   * Whether or not to include tracks in the search results. For performance reasons, this should be set to false if not
   *   needed. Defaults to true.
   * @type {boolean}
   */
  this.searchTracks = (options.searchTracks !== false) ? true : false;
  /**
   * Whether or not to include playlists in the search results. For performance reasons, this should be set to false if
   *   not needed. Defaults to true.
   * @type {boolean}
   */
  this.searchPlaylists = (options.searchPlaylists !== false) ? true : false;

  /**
   * The kind of search to perform. Defaults to SEARCHTYPE.NORMAL. Possible values:
   *   <ul>
   *     <li>SEARCHTYPE.NORMAL: A normal Spotify search.</li>
   *     <li>SEARCHTYPE.SUGGESTION: A "live" search done while the user is still typing.</li>
   *   </ul>
   * @member Playlist.prototype.searchType
   * @type {Models.SEARCHTYPE}
   */
  this.searchType = options.searchType ? parseInt(options.searchType) : SEARCHTYPE.NORMAL;
  /**
   * The behaviour of local search results. Defaults to LOCALSEARCHRESULTS.IGNORE. Possible values:
   *   <ul>
   *     <li>LOCALSEARCHRESULTS.IGNORE: Ignore local files in the search results.</li>
   *     <li>LOCALSEARCHRESULTS.PREPEND: Return local files in the results before Spotify tracks.</li>
   *     <li>LOCALSEARCHRESULTS.APPEND: Return local files in the results after Spotify tracks.</li>
   *   </ul>
   * @type {Models.LOCALSEARCHRESULTS}
   */
  this.localResults = options.localResults ? parseInt(options.localResults) : LOCALSEARCHRESULTS.IGNORE;

  this.uri = sp.core.spotifyHttpLinkToUri('spotify:search:' + query);

  this._query = query;
}

Object.defineProperties(Search.prototype, {
  /**
   * The search query. Read-only.
   * @member Playlist.prototype.query
   * @type {string}
   */
  query: {
    get: function() {
      return this._query;
    }
  },
  /**
   * The tracks returned by the search, if any. Read-only.
   * @member Playlist.prototype.tracks
   * @type {Array}
   */
  tracks: {
    get: function() {
      return this._tracks;
    }
  },
  /**
   * The albums returned by the search, if any. Read-only.
   * @member Playlist.prototype.albums
   * @type {Array}
   */
  albums: {
    get: function() {
      return this._albums;
    }
  },
  /**
   * The artists returned by the search, if any. Read-only.
   * @member Playlist.prototype.artists
   * @type {Array}
   */
  artists: {
    get: function() {
      return this._artists;
    }
  },
  /**
   * The playlists returned by the search, if any. Read-only.
   * @member Playlist.prototype.playlists
   * @type {Array}
   */
  playlists: {
    get: function() {
      return this._playlists;
    }
  },
  /**
   * True if the search is currently running. Read-only.
   * @member Playlist.prototype.running
   * @type {boolean}
   */
  running: {
    get: function() {
      return this._running;
    }
  },
  /**
   * The total number of artists matching the search query in the Spotify backend. Read-only.
   * @member Playlist.prototype.totalArtists
   * @type {integer}
   */
  totalArtists: {
    get: function() {
      return this._totalArtists;
    }
  },
  /**
   * The total number of albums matching the search query in the Spotify backend. Read-only.
   * @member Playlist.prototype.totalAlbums
   * @type {integer}
   */
  totalAlbums: {
    get: function() {
      return this._totalAlbums;
    }
  },
  /**
   * The total number of tracks matching the search query in the Spotify backend. Read-only.
   * @member Playlist.prototype.totalTracks
   * @type {integer}
   */
  totalTracks: {
    get: function() {
      return this._totalTracks;
    }
  },
  /**
   * The total number of playlists matching the search query in the Spotify backend. Read-only.
   * @member Playlist.prototype.totalPlaylists
   * @type {integer}
   */
  totalPlaylists: {
    get: function() {
      return this._totalPlaylists;
    }
  }
});

/**
 * Register an observer. The Search object fires the EVENT.CHANGE, EVENT.ITEMS_ADDED, EVENT.LOAD_ERROR events.
 * @see Observable#observe
 * @param {string} event The event to observe.
 * @param {Function} observer The function to register as observer.
 */
Search.prototype.observe = Observable.prototype.observe;

Search.prototype.ignore = Observable.prototype.ignore;

Search.prototype.notify = Observable.prototype.notify;

/**
 * Fetches more search results, up to pageSize. If the search object is already in the process of searching, does
 * nothing.
 */
Search.prototype.appendNext = function() {
  if (this.running === true) {
    return;
  }

  this._running = true;
  var self = this;

  var searchOptions = {};
  searchOptions['trackFrom'] = this.searchTracks ? this.tracks.length : 0;
  searchOptions['trackNum'] = this.searchTracks ? this.pageSize : 0;
  searchOptions['albumFrom'] = this.searchAlbums ? this.albums.length : 0;
  searchOptions['albumNum'] = this.searchAlbums ? this.pageSize : 0;
  searchOptions['artistFrom'] = this.searchArtists ? this.artists.length : 0;
  searchOptions['artistNum'] = this.searchArtists ? this.pageSize : 0;
  searchOptions['playlistFrom'] = this.searchPlaylists ? this.playlists.length : 0;
  searchOptions['playlistNum'] = this.searchPlaylists ? this.pageSize : 0;

  sp.core.searchEx(this.query, searchOptions, this.searchType, this.localResults, {
    onSuccess: function(result) {
      result.artists.forEach(function(artist) {
        self._artists.push(new Artist(artist));
      });

      result.albums.forEach(function(album) {
        self._albums.push(new Album(album));
      });

      result.tracks.forEach(function(track) {
        self._tracks.push(new Track(track));
      });

      result.playlists.forEach(function(aPlaylist) {
        self._playlists.push(Playlist.fromURI(aPlaylist.uri));
      });

      self._totalAlbums = result.total_albums;
      self._totalArtists = result.total_artists;
      self._totalTracks = result.total_tracks;
      self._totalPlaylists = result.total_playlists;

      self._running = false;

      self.notify(EVENT.LOAD, self);
      self.notify(EVENT.CHANGE, self);
      self.notify(EVENT.ITEMS_ADDED, self);
    },

    onFailure: function(error) {
      self._running = false;
      self.notify(EVENT.LOAD_ERROR, error);
    },

    onComplete: function() {
    }
  });
};


/**
 * Object representing a Spotify user.
 * @constructor
 * @extends {Observable}
 */
function User(data) {
  Observable.call(this);

  if (!data.canonicalUsername && !data.uri) {
    throw new Error('cannot create User without URI or username in data');
  }

  if (!data.uri) {
    data.uri = 'spotify:user:' + data.canonicalUsername;
  }

  if (!data.canonicalUsername && Link.getType(data.uri) == Link.TYPE.PROFILE) {
    data.canonicalUsername = data.uri.substr(data.uri.lastIndexOf(':') + 1);
  }

  this.loaded = true;
  this.data = {};
  this.update(data);
}
User.prototype = Object.create(Observable.prototype);
User.prototype.constructor = User;

/**
 * Creates a User from a Spotify user URI.
 * @param {string} uri The Spotify URI to create the user from.
 * @param {function(User)} callback A function to call when the user has been loaded.
 * @return {User} The User object, uninitialized (use callback to be notified when it has been loaded).
 */
User.fromURI = function(uri, callback) {
  var user = new User({uri: uri.toString()});
  user.loaded = false;
  user.load(function() {
    if (callback) callback(user);
  });

  return user;
};

/**
 * Load all data about the user.
 * @param {Function} callback Function to run after the user has been loaded.
 */
User.prototype.load = function(callback) {
  var uri = this.data.uri;

  var lookup;
  switch (Link.getType(uri)) {
    case Link.TYPE.PROFILE:
      lookup = sp.social.getUserByUsername;
      break;
    case Link.TYPE.FACEBOOK_USER:
      lookup = sp.social.getUserByFacebookUid;
      break;
    default:
      throw new Error(l.format('Invalid user URI: {0}', uri));
  }

  var user = this;
  lookup(uri.slice(uri.lastIndexOf(':') + 1), {
    onSuccess: function(data) {
      user.update(data);
      user.loaded = true;
      user.notify('load', user);
      callback.call(user);
    },
    onFailure: function(error) {
      user.notify('load', user);
      callback.call(user);
    }
  });
};

/**
 * Updates the user with new data.
 * @param {Object} data An object with fields that are to be updated.
 */
User.prototype.update = function(data) {
  if (!data) return;
  for (var p in data) {
    if (data.hasOwnProperty(p)) {
      this.data[p] = data[p];
    }
  }
};

Object.defineProperties(User.prototype, {
  /**
   * Get the canonical username of the user.
   * @member User.prototype.canonicalName
   * @type {?string}
   */
  canonicalName: {
    get: function() {
      return this.data.canonicalUsername || null;
    },
    enumerable: true
  },
  /**
   * Gets the display name of the user (usually the full name).
   * @member User.prototype.displayName
   * @type {?string}
   */
  displayName: {
    get: function() {
      return this.data.name || null;
    },
    enumerable: true
  },
  /**
   * Gets a URI for the profile picture of the user.
   * @member User.prototype.image
   * @type {?string}
   */
  image: {
    get: function() {
      return this.data.picture || null;
    },
    enumerable: true
  },
  /**
   * Gets the number of people subscribing to the user.
   * @member User.prototype.subscriberCount
   * @type {?number}
   */
  subscriberCount: {
    get: function() {
      if (typeof this.data.subscriberCount != 'number') return null;
      return this.data.subscriberCount;
    },
    enumerable: true
  },
  /**
   * Gets the number of people the user is subscribing to.
   * @member User.prototype.subscriptionCount
   * @type {?number}
   */
  subscriptionCount: {
    get: function() {
      if (typeof this.data.subscriptionCount != 'number') return null;
      return this.data.subscriptionCount;
    },
    enumerable: true
  },
  /**
   * Gets the URI of the user.
   * @member User.prototype.uri
   * @type {?string}
   */
  uri: {
    get: function() {
      return this.data.uri || null;
    },
    enumerable: true
  }
});

/**
 * Returns a string representation of the user.
 * @return {string} The display name of the user.
 */
User.prototype.toString = function() {
  return this.displayName;
};

/**
 * Object representing the current session.
 * @constructor
 * @extends {Observable}
 */
function Session() {
  Observable.call(this);

  this._user = null;
  var self = this;

  sp.core.addEventListener(_EVENT[EVENT.LOGIN], function(e) {
    self.notify(EVENT.LOGIN, self);
  });

  sp.core.addEventListener(_EVENT[EVENT.LOGOUT], function(e) {
    self.notify(EVENT.LOGOUT, self);
  });

  sp.core.addEventListener(_EVENT[EVENT.STATECHANGED], function(e) {
    self.notify(EVENT.STATECHANGED, self);
  });
}

Object.defineProperties(Session.prototype, {
  /**
   * Get an anonymous user ID, which is unique per-user, per-application.
   * @member Session.prototype.anonymousUserID
   * @type {string}
   */
  anonymousUserID: {
    get: sp.core.getAnonymousUserId
  },
  /**
   * ISO 3166-1 alpha-2 country code of the logged in user.
   * @member Session.prototype.country
   * @type {string}
   */
  country: {
    get: function() {
      return sp.core.country;
    }
  },
  /**
   * Set to true if the current user has a Spotify developer account.
   * @member Session.prototype.developer
   * @type {boolean}
   */
  developer: {
    get: function() {
      return sp.core.developer;
    }
  },
  /**
   * The current language as an IANA language code.
   * @member Session.prototype.language
   * @type {string}
   */
  language: {
    get: function() {
      return sp.core.language;
    }
  },
  /**
   * The current connection state.
   * @member Session.prototype.state
   * @type {Session.STATE}
   */
  state: {
    get: sp.core.getLoginMode
  },
  /**
   * The current user.
   * @member Session.prototype.user
   * @type {User}
   */
  user: {
    get: function() {
      if (!this._user)
        this._user = new User(sp.core.user);
      return this._user;
    }
  }
});

/**
 * Register an observer. The Session object fires the following events:
 *   <ul>
 *     <li>EVENT.LOGIN: Fires when the user logs into the Spotify client. Will not be fired if your application isn't active when this happens.</li>
 *     <li>EVENT.LOGOUT: Fires when the user logs out from Spotify client. Will not be fired if your application isn't active when this happens.</li>
 *     <li>EVENT.STATECHANGED: Fired when the state property changes.</li>
 *   </ul>
 * @see Observable#observe
 * @param {string} event The event to observe.
 * @param {Function} observer The function to register as observer.
 *
 * @example
 * var sp = getSpotifyApi();
 * var models = sp.require('$api/models');
 *
 * models.session.observe(models.EVENT.STATECHANGED, function() {
 *   console.log('Session state changed!');
 * });
 */
Session.prototype.observe = Observable.prototype.observe;

Session.prototype.ignore = Observable.prototype.ignore;

Session.prototype.notify = Observable.prototype.notify;

/**
 * Connection states.
 * @ignore
 * @enum {number}
 */
Session.STATE = {
  LOGGED_OUT: 0, // Not logged in.
  LOGGED_IN: 1, // Logged in against access point.
  DISCONNECTED: 2, // Logged in but currently disconnected (trying to reconnect).
  OFFLINE: 3, // Logged in but in offline mode.
  DUMMY_USER: 4 // Logged in with a dummy user. This means no network access or anything.
};

var _starredPlaylist = null;

/**
 * An object representing the current user's library.
 * @constructor
 */
function Library() {}

Object.defineProperties(Library.prototype, {
  /**
   * All albums in the user's library.
   * @member Library.prototype.albums
   * @type {Array.<Album>}
   */
  albums: {
    get: function() {
      return map(function(album) { return new Album(album); },
          sp.core.library.getAlbums());
    }
  },
  /**
   * All artists in the user's library.
   * @member Library.prototype.artists
   * @type {Array.<Artist>}
   */
  artists: {
    get: function() {
      return map(function(artist) { return new Artist(artist); },
          sp.core.library.getArtists());
    }
  },
  /**
   * A list of the user's playlists.
   * @member Library.prototype.playlists
   * @type {Array.<Playlist>}
   */
  playlists: {
    get: function() {
      return map(function(playlist) { return new Playlist(playlist); },
          sp.core.library.getPlaylists());
    }
  },
  /**
   * The user's playlist of starred tracks.
   * @member Library.prototype.starredPlaylist
   * @type {Playlist}
   */
  starredPlaylist: {
    get: function() {
      if (!_starredPlaylist)
        _starredPlaylist = new Playlist(sp.core.getStarredPlaylist());
      return _starredPlaylist;
    }
  },
  /**
   * All tracks in the user's library.
   * @member Library.prototype.tracks
   * @type {Array.<Track>}
   */
  tracks: {
    get: function() {
      return map(function(track) { return new Track(track); },
          sp.core.library.getTracks());
    }
  }
});

/**
 * Social.
 * @ignore
 * @constructor
 */
function Social() {}

Object.defineProperties(Social.prototype, {
  /**
   * Users marked as favorites.
   * @member Social.prototype.favorites
   * @type {Array.<User>}
   */
  favorites: {
    get: function() {
      return map(function(uri) { return User.fromURI(uri); },
          sp.social.getFavorites().all());
    }
  },
  /**
   * All friends.
   * @member Social.prototype.friends
   * @type {Array.<User>}
   */
  friends: {
    get: function() {
      return map(function(uri) { return User.fromURI(uri); },
          sp.social.relations.all());
    }
  }
});

function Event(name) {
  this.name = name;
}


/**
 * Get the contents of the specified file.
 *
 * @param {string} filename Filename relative to the app root.
 * @return {string} The contents of the file.
 */
function readFile(filename) {
  return sp.core.readFile(filename);
}
