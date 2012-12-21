/**
 * @module views
 * @property {function} getTrackList
 */

'use strict';

var sp = getSpotifyApi();

// Interfaces
exports.View = View;

// Constructors
exports.Player = Player;
exports.Image = _Image;
exports.List = List;
exports.Track = Track;

// Functions
exports.getTrackList = getTrackList;

var m = sp.require('$api/models');
var dnd = sp.require('$util/dnd');
var l = sp.require('$util/language');
var p = sp.require('$util/promise');
var r = sp.require('$util/react');

var cat = l.loadCatalog('$resources/cef_views');
var _ = partial(l.getString, cat, 'Misc');

// Elements for cloning.
var a = document.createElement('a');
var div = document.createElement('div');
var frag = document.createDocumentFragment();
var span = document.createElement('span');
var table = document.createElement('table');
var tbody = document.createElement('tbody');
var td = document.createElement('td');
var tr = document.createElement('tr');
var button = document.createElement('button');

/**
 * Basic view interface.
 * @interface
 * @constructor
 * @property {Node} node An HTML node.
 */
function View() {}

/**
 * Track player.
 * @implements {View}
 * @constructor
 */
function Player() {
  var player = this;
  player._track = null;
  player._context = null;
  player._playing = false;
  player.node = div.cloneNode();
  player.image = div.cloneNode();
  player.button = button.cloneNode();

  player.node.classList.add('sp-player');
  player.node.classList.add('sp-player-paused');
  player.node.tabIndex = 0;
  player.image.classList.add('sp-player-image');
  player.button.classList.add('sp-player-button');

  player.node.appendChild(player.image);
  player.node.appendChild(player.button);

  function onPlayerStateChanged(event) {
    playerStateChanged.call(player, event);
  }

  player.node.addEventListener('DOMNodeInsertedIntoDocument', function(e) {
    m.player.observe(m.EVENT.CHANGE, onPlayerStateChanged);
  });

  player.node.addEventListener('DOMNodeRemovedFromDocument', function(e) {
    m.player.ignore(m.EVENT.CHANGE, onPlayerStateChanged);
  });

  player.node.addEventListener('keydown', function(e) {
    var key = e.keyCode;
    if (32 === key || 13 === key) {
      e.preventDefault();
      if (13 === key && player.context.uri === m.player.context)
        m.player.position = 0, player.playing = true;
      else
        player.playing = !player.playing;
    }
  });

  player.button.addEventListener('click', function(e) {
    e.preventDefault();
    player.playing = !player.playing;
  });
}

/**
 * Play a track, in an optional context.
 * @param {Track} track The track to play.
 * @param {Album|Playlist=} opt_context The context to play the track in. Optional.
 */
Player.prototype.play = function(track, opt_context) {
  if (opt_context)
    this.context = opt_context;
  m.player.play(track, opt_context);
};

/**
 * Update player view to match the underlying player object, check if it's playing from the same context etc.
 * @ignore
 * @this {Player}
 */
function playerStateChanged() {
  var player = this;
  if (player.context && player.context.uri === m.player.context) {
    player._track = m.player.track;
    player.playing = m.player.playing;
  } else {
    player.playing = false;
  }
}

/**
 * @ignore
 * @this {Player}
 */
function playerSetImage(resource) {
  var player = this;
  var image;
  if (!resource.image) return player;
  emptyNode(player.image);
  image = new _Image(resource.image, resource.uri, resource.name);
  image.node.tabIndex = -1;
  player.image.appendChild(image.node);
  return player;
}

Object.defineProperties(Player.prototype, {
  /**
   * Get or set the context.
   * @member Player.prototype.context
   * @type {Album|Playlist|null}
   */
  context: {
    get: function() {
      return this._context;
    },
    set: function(context) {
      //console.log("Setting context")
      playerSetImage.call(this, context);
      // Update image if needed
      if (context instanceof m.Playlist)
        context.observe(m.EVENT.CHANGE, playerSetImage.bind(this));
      this._context = context;
      playerStateChanged.call(this, {});
    }
  },
  /**
   * Get or set playing state.
   * @member Player.prototype.playing
   * @type {boolean}
   */
  playing: {
    get: function() {
      return this._playing;
    },
    set: function(play) {
      if (play === this._playing) return this._playing;
      if (play) {
        if (m.player.context !== this._context.uri) {
          m.player.play(this._context.get(0), this._context);
        }
        if (!m.player.playing)
          m.player.playing = true;
        this._playing = true;
        this.node.classList.remove('sp-player-paused');
        return true;
      }
      if (m.player.playing && m.player.context === this._context.uri) {
        m.player.playing = false;
      }
      this._playing = false;
      this.node.classList.add('sp-player-paused');
      return false;
    }
  }
});

// List View.
var ITEM_HEIGHT = 20;
var MAX_UPDATE_FREQ = 100;
var CACHE_MAX_AGE = 10;

/**
 * List view.
 * @param {Collection=} opt_collection The collection which is to be displayed.
 * @param {function=} opt_getItem A function that returns a view for a single item.
 * @param {function=} opt_filter A function that filters the collection.
 * @constructor
 */
function List(opt_collection, opt_getItem, opt_filter) {
  var node = this.node = div.cloneNode(); // The node that scrolls and stuff
  var list = this;
  this._length = 0;
  this._age = 0;
  this._wrapperNode = this.node.appendChild(div.cloneNode());
  this._getItemView = opt_getItem || Track.withFields;
  this._filter = opt_filter || listDefaultFilter;
  this._itemHeight = ITEM_HEIGHT;
  this._collection = null;
  this._itemViews = {};
  this._items = {}; // Map from original collection indices into list item indices
  // TODO: add support for multiple selected items
  this._selection = null; // Currently selected item indices

  this.node.classList.add('sp-list');
  this.node.tabIndex = 0;

  this.node.addEventListener('mousedown', partial(listOnClick, this));
  this.node.addEventListener('click', function(e) {
    if (!(event.target instanceof HTMLAnchorElement))
      e.preventDefault();
  });
  this.node.addEventListener('dblclick', partial(listOnDoubleClick, this));
  this.node.addEventListener('keydown', partial(listOnKeypress, this));

  if (opt_collection) {
    this.collection = opt_collection;
  }

  r.throttle(r.merge(r.fromDOMEvent(this.node, 'scroll'),
      r.merge(r.fromDOMEvent(this.node, 'DOMNodeInsertedIntoDocument'), r.fromDOMEvent(window, 'resize'))),
      MAX_UPDATE_FREQ).subscribe(listUpdateHTML.bind(this));

  this.node.addEventListener('keydown', function(event) {
    var keyCode = event.keyCode;
    var itemView = list._itemViews[list.selection];
    if (!(itemView && 13 === keyCode))
      return;
    event.preventDefault();
    m.player.track && itemView.track.uri === m.player.track.uri ? m.player.position = 0 :
            m.player.play(itemView.track, list._collection);
  });

  trackListPlayerStateChanged.call(this);
  m.player.observe(m.EVENT.CHANGE, trackListPlayerStateChanged.bind(this));
  m.library.starredPlaylist.observe(m.EVENT.CHANGE, trackListStarredListChanged.bind(this));
}

List.prototype.refresh = function() {
  listUpdateHTML.call(this);
};

Object.defineProperties(List.prototype, {
  /**
   * Get or set the collection which is displayed by the list view.
   * @member List.prototype.collection
   * @type {Collection}
   */
  collection: {
    get: function() {
      return this._collection;
    },
    set: function(collection) {
      this._collection = collection || null;
      if (!collection) return;

      if (collection.loaded) {
        listUpdateCollection.call(this, collection);
        listUpdateHTML.call(this);
      }

      collection.observe(m.EVENT.CHANGE,
          compose(listUpdateHTML.bind(this),
              listUpdateCollection.bind(this, collection),
              listClean.bind(this, true)));
    }
  },
  /**
   * Get or set the height of the individual items. Note that your CSS must ensure that it looks correct.
   * @member List.prototype.itemHeight
   * @type {number}
   */
  itemHeight: {
    get: function() {
      return this._itemHeight;
    },
    set: function(height) {
      if (height === this._itemHeight) return;
      listClean.call(this, true);
      this._itemHeight = height;
    }
  },
  selection: {
    get: function() {
      return this._selection;
    },
    set: function(index) {
      var view = this._itemViews[index];
      if (!view)
        return;
      if (null !== this._selection && this._itemViews[this._selection])
        this._itemViews[this._selection].selected = false;
      this._selection = index;
      view.selected = true;
    }
  }
});

function listOnKeypress(list, event) {
  var keyCode = event.keyCode;
  var view;
  switch (keyCode) {
    case 38:
    case 40:
      event.preventDefault();
      null === list.selection ? 0 : list.selection += keyCode === 40 ? 1 : -1;
      break;
    default:
      break;
  }
}

/**
 * @ignore
 * @this {List}
 */
function listUpdateHTML() {
  var list = this;
  if (!list._collection)
    return list;
  var totalHeight = list._length * list._itemHeight;
  var itemsPerPage;
  var curItem;
  var startItem;
  var endItem;
  var item;
  list._wrapperNode.style.height = totalHeight + 'px';
  itemsPerPage = Math.ceil(list.node.offsetHeight / list._itemHeight);
  if (0 === itemsPerPage) return list;
  curItem = Math.ceil(list.node.scrollTop / list._itemHeight);
  startItem = Math.max(0, curItem - itemsPerPage);
  endItem = curItem + itemsPerPage * 2;
  var fragment = document.createDocumentFragment();
  for (var i = startItem, l = list._length; i <= endItem && i < l; ++i) {
    if (list._itemViews[i]) {
      list._itemViews[i]._age = list._age;
      continue;
    }
    item = list._getItemView(list._collection.get(list._items[i]));
    item._index = list._items[i];
    if (m.player.track && m.player.track.uri === item.track.uri && item._index === m.player.index) {
      item.playing = true;
      if (!m.player.playing)
        item.paused = true;
    }
    if (i === list._selection)
      item.selected = true;
    list._itemViews[i] = item;
    item.node.dataset['itemindex'] = list._items[i];
    item.node.dataset['viewindex'] = i;
    item.node.style.webkitTransform = 'translateY(' + i * list._itemHeight + 'px)';
    item._age = list._age;
    fragment.appendChild(item.node);
  }
  list._wrapperNode.appendChild(fragment);
  listClean.call(list);
  list._age = ++list._age % (CACHE_MAX_AGE * 2);
  return list;
}

function listClean(force) {
  var list = this;
  var item;
  for (var k in list._itemViews) {
    item = list._itemViews[k];
    if (force || list._age - item._age > CACHE_MAX_AGE || list._age < item._age - CACHE_MAX_AGE) {
      item.node.parentNode.removeChild(item.node);
      delete list._itemViews[k];
    }
  }
  return list;
}

function listOnClick(listView, event) {
  var itemIndex = getItemData(event.target, 'itemindex');
  var viewIndex = getItemData(event.target, 'viewindex');
  var item;
  var view;
  if (-1 === itemIndex || event.target instanceof HTMLAnchorElement)
    return;
  view = listView._itemViews[viewIndex];
  listView.selection = viewIndex;
  view.selected = true;
}

function listOnDoubleClick(listView, event) {
  var itemIndex = getItemData(event.target, 'itemindex');
  if (-1 === itemIndex || event.target instanceof HTMLAnchorElement)
    return;
  event.preventDefault();
  //console.log("Playing", listView._collection.get(itemIndex).uri, "from", listView._originalCollection.uri, "at", itemIndex);
  m.player.play(listView._collection.get(itemIndex), listView._collection, itemIndex);
}

function getItemData(item, key) {
  var itemIndex;
  while (!itemIndex && item)
    itemIndex = item.dataset[key], item = item.parentElement;
  return itemIndex ? +itemIndex : -1;
}

function listUpdateCollection(collection) {
  var list = this;
  var length = collection.length;
  var item;
  list._length = 0;
  for (var i = 0, j = 0; i < length; ++i) {
    item = collection.get(i);
    if (list._filter(item)) {
      list._items[j++] = i;
      ++list._length;
    //console.log("Accepted track:", item);
    //list._collection.add(item);
    }
    else {
      //console.log("Rejected track:", item);
    }
  }
  return list;
}

/**
 * @ignore
 * @return {boolean} True if track should be kept, false if it should be filtered out.
 */
function listDefaultFilter(track) {
  var a = track.availability;
  return !track.loaded ? false :
      !!((1 << a) & ((1 << m.AVAILABILITY.AVAILABLE) | (1 << m.AVAILABILITY.PREMIUM) |
      (1 << m.AVAILABILITY.PURCHASE) | (1 << m.AVAILABILITY.LOCAL_FILE_NOT_FOUND) |
      (1 << m.AVAILABILITY.LOCAL_FILE_BAD_FORMAT) | (1 << m.AVAILABILITY.DRM_PROTECTED) |
      (1 << m.AVAILABILITY.CAP_REACHED) | (1 << m.AVAILABILITY.TRACK_CAP_REACHED) |
      (1 << m.AVAILABILITY.LOCAL_NO_FILE)));
}

/**
 * Track view.
 * @param {m.Track} track Track model instance.
 * @param {number} fields Fields from Track.FIELD.
 * @property {boolean} selected
 * @constructor
 */
function Track(track, fields) {
  var view = this;
  var field;
  var node;

  fields = fields || DEFAULT_FIELDS;

  this._age = 0;
  this._state = 0;
  this._index = -1;
  this.track = track;
  this.node = node = a.cloneNode();
  this.node.href = track.uri;

  this.node.classList.add('sp-item');
  this.node.classList.add('sp-track');
  // Availability, see error_codes.h
  this.node.classList.add('sp-track-availability-' + track.availability);
  this.node.title = l.format(_('Item by artists'),
                        track.data.name, stringFromArtistsArray(track.data.artists));

  if (track.starred)
    this.starred = true;

  if (fields & Track.FIELD.STAR) {
    field = span.cloneNode();
    field.classList.add('sp-track-field-star');
    field.innerHTML = '<span class="sp-icon-star {0}"></span>';
    field.addEventListener('mousedown', function(e) { e.stopPropagation(); });
    field.addEventListener('click', function(e) {
      //console.log("Starring", !track.starred)
      view.starred = !view.starred;
    });
    this.node.appendChild(field);
  }
  if (fields & Track.FIELD.SHARE) {
    field = span.cloneNode();
    field.classList.add('sp-track-field-share');
    field.innerHTML = '<span class="sp-icon-share"></span>';
    field.addEventListener('mousedown', function(e) { e.stopPropagation(); });
    field.addEventListener('click', function(e) {
      var rect = e.target.getClientRects()[0];
      sp.social.showSharePopup(rect.left + e.target.clientWidth / 2,
          rect.top + e.target.clientHeight / 2,
          track.uri);
    });
    this.node.appendChild(field);
  }
  if (fields & Track.FIELD.NUMBER) {
    field = span.cloneNode();
    field.classList.add('sp-track-field-number');
    field.textContent = track.data.trackNumber;
    this.node.appendChild(field);
  }
  if (fields & Track.FIELD.NAME) {
    field = span.cloneNode();
    field.classList.add('sp-track-field-name');
    field.textContent = track.data.name.decodeForText();
    this.node.appendChild(field);
  }
  if (fields & Track.FIELD.ARTIST) {
    field = span.cloneNode();
    field.classList.add('sp-track-field-artist');
    field.innerHTML = linksFromArtistsArray(track.data.artists);
    this.node.appendChild(field);
  }
  if (fields & Track.FIELD.DURATION) {
    field = span.cloneNode();
    field.classList.add('sp-track-field-duration');
    field.textContent = stringFromDuration(track.data.duration);
    this.node.appendChild(field);
  }
  if (fields & Track.FIELD.POPULARITY) {
    field = span.cloneNode();
    field.classList.add('sp-track-field-popularity');
    field.innerHTML = l.format('<span class="sp-popularity-indicator"><span class="sp-popularity-indicator-value" style="width:{0}%"></span></span>',
        track.data.popularity);
    this.node.appendChild(field);
  }
  if (fields & Track.FIELD.ALBUM) {
    field = span.cloneNode();
    field.classList.add('sp-track-field-album');
    field.innerHTML = l.format('<a href="{0}" title="{2}">{1}</a>',
        track.data.album.uri.decodeForHTML(),
        track.data.album.name.decodeForHTML(),
        l.format(_('Item by artists'), track.data.album.name.decodeForHTML(), track.data.album.artist.name.decodeForHTML()));
    this.node.appendChild(field);
  }
}

Track.withFields = function(track, fields) {
  fields = fields || DEFAULT_FIELDS;
  return new Track(track, fields);
};

Object.defineProperties(Track.prototype, {
  selected: {
    get: function() {
      return this._state & Track.STATE.SELECTED ? true : false;
    },
    set: function(selected) {
      if (selected) {
        this._state |= Track.STATE.SELECTED;
        this.node.classList.add('sp-track-selected');
        return;
      }
      this._state &= ~Track.STATE.SELECTED;
      this.node.classList.remove('sp-track-selected');
    }
  },
  paused: {
    get: function() {
      return this._state & Track.STATE.PAUSED ? true : false;
    },
    set: function(paused) {
      if (paused) {
        this._state |= Track.STATE.PAUSED;
        this.node.classList.add('sp-track-paused');
        return;
      }
      this._state &= ~Track.STATE.PAUSED;
      this.node.classList.remove('sp-track-paused');
    }
  },
  playing: {
    get: function() {
      return this._state & Track.STATE.PLAYING ? true : false;
    },
    set: function(playing) {
      if (playing) {
        this._state |= Track.STATE.PLAYING;
        this.node.classList.add('sp-track-playing');
        return;
      }
      this._state &= ~Track.STATE.PLAYING;
      this.node.classList.remove('sp-track-playing');
    }
  },
  starred: {
    get: function() {
      return this._state & Track.STATE.STARRED ? true : false;
    },
    set: function(starred) {
      var track = this.track;
      if (starred === this.starred) return;
      if (starred) {
        this._state |= Track.STATE.STARRED;
        this.node.classList.add('sp-track-starred');
      } else {
        this._state &= ~Track.STATE.STARRED;
        this.node.classList.remove('sp-track-starred');
      }
      setTimeout(function() { track.starred = starred; }, 100);
    }
  }
});

/**
 * @ignore
 * @enum {number}
 */
Track.FIELD = {
  ALBUM: 1 << 0,
  ARTIST: 1 << 1,
  DOWNLOAD: 1 << 2,
  DURATION: 1 << 3,
  IMAGE: 1 << 4,
  NAME: 1 << 5,
  NUMBER: 1 << 6,
  POPULARITY: 1 << 7,
  PURCHASE: 1 << 8,
  SHARE: 1 << 9,
  STAR: 1 << 10,
  TRACK: 1 << 11,
  USER: 1 << 12
};

var DEFAULT_FIELDS = Track.FIELD.STAR | Track.FIELD.SHARE | Track.FIELD.NAME | Track.FIELD.ARTIST | Track.FIELD.DURATION | Track.FIELD.ALBUM;

// Various visual states.
Track.STATE = {
  LINKED: 1 << 0,
  LOCAL: 1 << 1,
  PAUSED: 1 << 2,
  PLAYING: 1 << 3,
  PREMIUM: 1 << 4,
  SELECTED: 1 << 5,
  STARRED: 1 << 6
};

function stringFromDuration(ms) {
  var seconds = ~~(ms / 1000 + 0.5);
  var minutes = ~~(seconds / 60);
  var remains = seconds - minutes * 60;
  return minutes + ':' + (remains > 9 ? remains : '0' + remains);
}

function linksFromArtistsArray(artists) {
  var string = '';
  for (var i = 0, length = artists.length; i < length; ++i) {
    if (0 !== i)
      string += ', ';
    if (artists[i].name)
      string += '<a href="' + artists[i].uri.decodeForHTML() + '">' + artists[i].name.decodeForHTML() + '</a>';
  }
  return string;
}

function stringFromArtistsArray(artists) {
  var string = '';
  for (var i = 0, l = artists.length; i < l; ++i) {
    if (0 !== i)
      string += ', ';
    string += artists[i].name;
  }
  return string;
}

/**
 * An image which automatically scales itself for optimal fit, while preserving aspect ratio.
 * Its CSS class name is "sp-image", when it has loaded, the class "sp-image-loaded" is added.
 * This lets you decide how it should look before and after loading, if you want transitions or something else.
 * @name Image
 * @constructor
 * @param {string} source The source of the Image.
 * @param {string=} opt_uri A URI which, if provided, will be used for an anchor wrapping the image.
 * @param {string=} opt_title A string which, if provided, will be used as the title for the anchor wrapping the image.
 * @property {Node} node The node of the view.
 */
function _Image(source, opt_uri, opt_title) {
  var image = this;

  image.node = null;

  if (opt_uri) {
    image.node = a.cloneNode();
    image.node.href = opt_uri;
  } else {
    image.node = div.cloneNode();
  }

  if (opt_title) {
    image.node.title = opt_title;
  }

  image.node.classList.add('sp-image');

  if (source.length) {
    var img = new Image();
    img.src = source;

    if (img.complete) {
      image.node.style.backgroundImage = 'url("' + source + '")';
      image.node.classList.add('sp-image-loaded');
    } else {
      img.addEventListener('load', function onLoad() {
        img.removeEventListener('load', onLoad);
        image.node.style.backgroundImage = 'url("' + source + '")';
        image.node.classList.add('sp-image-loaded');
      });
    }
  }
}

/**
 * Helper function that wires everything up for a track list.
 * @deprecated Use List constructor directly instead of this function.
 */
function getTrackList(collection, getItem, filter) {
  console.log('getTrackList is deprecated, use the List constructor directly instead.');
  var list = new List(collection, getItem, filter);
  return list;
}

/**
 * @ignore
 * @this {List}
 */
function trackListPlayerStateChanged(e) {
  var list = this;
  var index;
  var view;
  if (list._collection.uri === m.player.context) {
    index = sp.trackPlayer.getPlayingContext()[1];
    for (var i = 0, l = list._length; i < l; ++i) {
      view = list._itemViews[i];
      if (!view) continue;
      if (view.track.uri === m.player.track.uri && index === view._index) {
        view.playing = true;
        view.paused = !m.player.playing;
      } else
        view.playing = view.paused = false;
    }
  } else {
    for (var i = 0, l = list._collection.length; i < l; ++i) {
      view = list._itemViews[i];
      if (!view) continue;
      if (view.playing) {
        view.playing = view.paused = false;
        break;
      }
    }
  }
}

/**
 * @ignore
 * @this {List}
 */
function trackListStarredListChanged(e) {
  listClean.call(this, true);
  // Re-set it to update starred status :(
  this.collection = this._collection;
}

/** @ignore */
function emptyNode(node) {
  while (node.firstChild)
    node.removeChild(node.firstChild);
  return node;
}
