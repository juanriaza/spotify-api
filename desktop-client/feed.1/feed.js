/**
 * @module Feed
 */

'use strict';

sp = getSpotifyApi();

// Imports
var $language = sp.require('$util/language');
var $popover = sp.require('$unstable/popover');
var $presence = sp.require('$unstable/presence');
var $react = sp.require('$util/react');
var $staticdata = sp.require('$unstable/staticdata');
var $storage = sp.require('$util/storage');
var $views = sp.require('$api/views');

var $feedPopover = sp.require('feedpopover');
var $presenceFormatter = sp.require('presence-formatter');

// Constants
var CATALOG = $language.loadCatalog('feed', '');
var _ = partial($language.getString, CATALOG, 'presence');
var _f = partial($language.getString, CATALOG, 'feed');

// Logging helper
var $loggingHelper;
var popoverContext = 'feed-popover';

// How often to remove items from feed
var CLEAN_INTERVAL = 10000;
// Timeout before updating (cleaning, loading artwork) in feed after an item was added
var UPDATE_AFTER_ADD_TIMEOUT = 100;
// Max items to display in feed. If the feed area size is bigger though, we display more.
var MAX_ITEMS = 30;
var SHARABLE_LINK_TYPES = {
  1: 1, // Artist
  2: 1, // Album
  4: 1, // Track
  5: 1  // Playlist
};

var LOGIN_TIMESTAMP = Date.now() / 1000;

/**
 * Exports
 * @type {function()}
 */
exports.Feed = Feed;
exports.closePopover = closePopover;

/**
 * [Feed description]
 * @constructor
 */
function Feed() {
  var feed = this;
  var _formatter, _addItem,
      _compareItems, _containsItem, _updateFeed, _cleanFeed, _equalStates, _findSlot,
      _findSlotAndInsert, _maybeGetArtwork, _getStickyness, _insertAtIndex,
      _removeItem, _showItem, _showIntroductionItem, _updateFeedHeight,
      _introductionItemDisplayed = false, _updatedFeedTimeout = 0,
      _setLoggingHelper, _testGroup;

  _setLoggingHelper = function(lh) {
    $loggingHelper = lh;
    _testGroup = $loggingHelper.getTestGroup();

    $feedPopover.setLoggingHelper($loggingHelper);
  };

  _formatter = new $presenceFormatter.PresenceFormatter(function(state, presenceNode, isPartOfBatch) {
    _addItem(state, presenceNode, !isPartOfBatch);
  });

  _formatter.stringFromArtistsArray = function(as) {
    return map(
        function(a) {
          return a.name.decodeForHTML();
        }, as).join(', ');
  };
  _formatter.formatPlaylistPublished = function(state, data) {
    return $language.format(_('playlistPublished'),
        $language.format('<strong>{0}</strong>',
        state.user.name.decodeForHTML()),
        data.name.decodeForHTML());
  };
  _formatter.formatPlaylistSubscribed = function(state, data, owner) {
    return $language.format(_('playlistSubscribed'),
        $language.format('<strong>{0}</strong>',
        state.user.name.decodeForHTML()),
        data.name.decodeForHTML(),
        owner.name.decodeForHTML());
  };
  _formatter.formatMyPlaylistSubscribed = function(state, data) {
    return $language.format(_('myPlaylistSubscribed'),
        $language.format('<strong>{0}</strong>',
        state.user.name.decodeForHTML()),
        data.name.decodeForHTML());
  };
  _formatter.formatPlaylistTrackAdded = function(state, data) {
    var track = data[0];
    var playlist = data[1];
    return $language.format(_('playlistTrackAdded'),
        $language.format('<strong>{0}</strong>',
        state.user.name.decodeForHTML()),
        track.name.decodeForHTML(),
        playlist ?
        playlist.name.decodeForHTML() :
        _('aPlaylist'));
  };
  _formatter.formatTrackStarred = function(state, data) {
    return $language.format(_('playlistTrackStarred'),
        $language.format('<strong>{0}</strong>',
        state.user.name.decodeForHTML()),
        data.name.decodeForHTML(),
        _formatter.stringFromArtistsArray(data.artists));
  };
  _formatter.formatTrackFinishedPlaying = function(state, data, appInfo) {
    var formattedString = null;
    var appUri = '#';
    if (state.type == $presence.PresenceState.TYPE.APP_TRACK_FINISHED_PLAYING && state.appInfo && state.appInfo.name !== '') {
      appUri = 'spotify:app:' + state.appInfo.application;
      formattedString = $language.format(
          '<span class="info">{0}</span><a class="app-link" href="' + appUri + '">{1}</a>',
          $language.format(_('trackFinishedPlaying'),
          $language.format('<strong>{0}</strong>',
          state.user.name.decodeForHTML()),
          data.name.decodeForHTML(),
          _formatter.stringFromArtistsArray(data.artists)
          ),
          $language.format('<span class="app-icon" style="{1}"></span><span class=" app-info">{0}</span>',
          $language.format(_('usingApp'), state.appInfo.name),
          'background-image:url(' + state.appInfo.icon_small + ')'
          )
          );
    }
    else if (state.type == $presence.PresenceState.TYPE.RADIO_TRACK_FINISHED_PLAYING) {
      appUri = state.referrerUri;

      formattedString = $language.format(
          '<span class="info">{0}</span><a class="app-link" href="' + appUri + '">{1}</a>',
          $language.format(_('trackFinishedPlaying'),
          $language.format('<strong>{0}</strong>',
          state.user.name.decodeForHTML()),
          data.name.decodeForHTML(),
          _formatter.stringFromArtistsArray(data.artists)
          ),
          $language.format('<span class="app-icon radio" style="{1}"></span><span class=" app-info radio">{0}</span>',
          $language.format(_('usingApp'), 'Spotify radio'),
          'background-image:url(sp://resources/img/buddylist-radio-icon.png)'
          )
          );
    }
    else {
      formattedString = $language.format(_('trackFinishedPlaying'),
          $language.format('<strong>{0}</strong>',
          state.user.name.decodeForHTML()),
          data.name.decodeForHTML(),
          _formatter.stringFromArtistsArray(data.artists)
          );
    }
    return formattedString;
  };
  _formatter.formatFavouriteAppAdded = function(state) {
    var retVal = null;
    var appUri = 'spotify:app:' + state.appInfo.application;
    var image = 'import/img/missing-artwork-142.png';
    retVal = $language.format('<span class="info">{0}</span><a class="app-link" href="' + appUri + '">{1}</a>',
        $language.format(_('userAddedApp'),
        $language.format('<strong>{0}</strong>', state.user.name.decodeForHTML()),
        state.appInfo.name
        ),
        $language.format('<span class="app-icon-big" style="{1}"></span><span class=" app-info">{0}</span>',
        state.appInfo.name,
        'background-image:url(\'' + state.appInfo.icon_medium + '\')'
        )
        );
    return retVal;
  };

  /**
   * [_maybeGetArtwork description]
   * @param  {[type]} item  [description].
   */
  _maybeGetArtwork = function(item) {
    if (item.loadedArtwork)
      return;

    item.loadedArtwork = true;

    var state = item.state;
    var needsArtwork = state.type == $presence.PresenceState.TYPE.PLAYLIST_TRACK_ADDED ||
        state.type == $presence.PresenceState.TYPE.PLAYLIST_TRACK_STARRED ||
        state.type == $presence.PresenceState.TYPE.MY_PLAYLIST_SUBSCRIBED ||
        state.type == $presence.PresenceState.TYPE.PLAYLIST_SUBSCRIBED ||
        state.type == $presence.PresenceState.TYPE.PLAYLIST_PUBLISHED;

    if (!needsArtwork)
      return;

    var _image = null;

    // Track events
    if (state.type == $presence.PresenceState.TYPE.PLAYLIST_TRACK_ADDED ||
        state.type == $presence.PresenceState.TYPE.PLAYLIST_TRACK_STARRED) {
      var _onGetMetadata = function(data) {
        if (!data) {
          return;
        }

        _image = new $views.Image(data.album.cover,
            state.trackUri + '?action=browse',
            $language.format(_('itemByArtists'),
            data.name.decodeForHTML(),
            _formatter.stringFromArtistsArray(data.artists)
            ));
        _image.node.classList.add('cover');
        item.node.appendChild(_image.node);
      };
      sp.core.getMetadata(state.trackUri, {
        onSuccess: _onGetMetadata,
        onFailure: id
      });
    }
  // Playlist events
    else {
      // Second parameter means don't link tracks.
      var _playlist = sp.core.getPlaylist(state.playlistUri, false);
      var _onPlaylistChanged = function() {
        // Just do the following if we have a valid cover
        // or if the placeholder image doesn't exist.
        if (_playlist.cover.length > 0 || !_image) {
          // If we have a valid cover, we don't need to listen
          // to more changes.
          if (_playlist.cover.length > 0) {
            _playlist.removeEventListener('change', _onPlaylistChanged);
          }

          // If an image was set before (placeholder), we need
          // to remove it from the DOM.
          if (_image) {
            item.node.removeChild(_image.node);
            _image = null;
          }

          // Create the image from the playlist cover URI and add
          // it to the DOM.
          _image = new $views.Image(_playlist.cover);
          _image.node.classList.add('cover');
          item.node.appendChild(_image.node);
        }
      };

      if (!_playlist.loaded) {
        _playlist.addEventListener('change', _onPlaylistChanged);
      }
      else {
        _onPlaylistChanged();
      }
    }
  };

  /**
   * [_getStickyness description]
   * @param {PresenceState} state [description].
   * @return {number}   Returns timestamp.
   */
  _getStickyness = function(state) {
    var stickyFactor = _formatter.stickyFactor(state.type);
    return state.timestamp + stickyFactor * 20;
  };

  /**
   * [_updateFeedHeight description]
   */
  _updateFeedHeight = function() {
    var height = 0, nodes = feed.node.childNodes;

    for (var i = 0, len = nodes.length; i < len; i++) {
      height += nodes[i].offsetHeight;
    }

    feed.node.style.height = height + 'px';
  };

  /**
   * [_showItem description]
   * @param {boolean} animate [description].
   * @param {Item}    item    [description].
   */
  _showItem = function(animate, item) {
    var node = item.node;
    var intrinsicHeight = node.offsetHeight;
    // Ask Jonas W what this did?
    // node.style.zIndex = _getStickyness(item.state); // Reverse stacking order
    if (animate) {
      node.addEventListener('webkitAnimationEnd', function onAnimationEnd() {
        _updateFeedHeight();
        node.removeEventListener('webkitAnimationEnd', onAnimationEnd);
      });
      node.style.marginTop = -intrinsicHeight + 'px';
      var notused = node.offsetWidth;
      node.classList.add('show');
      node.style.marginTop = '0';
    }
    else {
      _updateFeedHeight();
    }
  };

  /**
   * [_insertAtIndex description].
   * @param {Item} item [description].
   * @param {number} ix [description].
   * @return {Item}     [description].
   */
  _insertAtIndex = function(item, ix) {
    feed.items.splice(ix, 0, item);
    feed.node.insertBefore(item.node, feed.node.childNodes[ix]);
    return item;
  };

  /**
   * [_equalStates description].
   * @param  {Object} stateA [description].
   * @param  {Object} stateB [description].
   * @return {boolean}       [description].
   */
  _equalStates = function(stateA, stateB) {
    return stateA.user.uri === stateB.user.uri &&
        stateA.timestamp === stateB.timestamp;
  };

  /**
   * Check if feed contains a presence state already.
   * @param {Object} state [description].
   * @return {boolean}     [description].
   */
  _containsItem = function(state) {
    var found = false;
    for (var i = 0, l = feed.items.length; i < l; ++i) {
      if (_equalStates(state, feed.items[i].state)) {
        found = true;
        break;
      }
    }
    return found;
  };

  /**
   * Compare items based on date and stickiness multiplier.
   * @param {Item} itemA [description].
   * @param {Item} itemB [description].
   * @return {number}    [description].
   */
  _compareItems = function(itemA, itemB) {
    return compare(_getStickyness(itemA.state), _getStickyness(itemB.state));
  };

  /**
   * Find a nice slot for this item, below sticky items, newer items, etc.
   * @param {Item} item [description].
   * @return {number}   [description].
   */
  _findSlot = function(item) {
    var feedItems = feed.items;
    for (var ix = 0, l = feedItems.length; ix < l; ++ix) {
      if (1 === _compareItems(item, feedItems[ix]))
        break;
    }
    return ix;
  };

  /**
   * [_findSlotAndInsert description].
   * @param {Item} item [description].
   * @return {Item}     [description].
   */
  _findSlotAndInsert = function(item) {
    return _containsItem(item.state) ?
        item :
        _insertAtIndex(item, _findSlot(item));
  };

  /**
   * Add an Item to a Feed.
   * @param {Object}  state        Hermes presence state.
   * @param {Node}    presenceNode The node to attach.
   * @param {boolean} animate      Whether node should be animated or not.
   */
  _addItem = function(state, presenceNode, animate) {
    if ($popover.popover && $popover.popover.visible)
      return;

    if (state.timestamp - LOGIN_TIMESTAMP > 600) {
      hideIntroductionItem();
    }

    _showItem(animate, _findSlotAndInsert(new FeedItem(state, presenceNode)));

    if (_updatedFeedTimeout) {
      clearTimeout(_updatedFeedTimeout);
    }
    _updatedFeedTimeout = setTimeout(_updateFeed, UPDATE_AFTER_ADD_TIMEOUT);
  };

  /**
   * Remove an Item from a Feed, by index.
   * @param {number} ix [description].
   */
  _removeItem = function(ix) {
    var item = feed.items.splice(ix, 1)[0];
    feed.node.removeChild(item.node);
  };

  /**
   * Update feed (clean, maybe load artwork).
   */
  _updateFeed = function() {
    _cleanFeed();

    var _node = feed.node.parentNode,
        _from = _node.scrollTop,
        _to = _from + _node.offsetHeight,
        _offset = 0;

    for (var i = 0, len = feed.items.length; i < len; i++) {
      var item = feed.items[i];
      var nextHeight = (i + 1 < len) ?
          feed.items[i + 1].node.offsetHeight : 0;

      _offset += item.node.offsetHeight;

      if (_offset >= _from && _offset <= _to + nextHeight) {
        _maybeGetArtwork(item);
      }
    }
  };

  /**
   * Clean up old Items in a feed.
   */
  _cleanFeed = function() {
    var height = 0;
    _updatedFeedTimeout = 0;

    // Compute the current feed height.
    for (var i = 0, len = feed.items.length; i < len; i++) {
      height += feed.items[i].node.offsetHeight;
    }

    // Clean items until we reached MAX_ITEMS, but stop when we need those items to fill the feed.
    while (feed.items.length > MAX_ITEMS &&
        height > feed.node.parentNode.offsetHeight) {

      height -= feed.items[feed.items.length - 1].node.offsetHeight;
      _removeItem(feed.items.length - 1);
    }

    _updateFeedHeight();
  };

  /**
   * Show intro with info about what's feed about
   */
  _showIntroductionItem = function(feedNode) {
    if (true !== $storage.getWithDefault('noFeedIntroductionItem') &&
        true !== _introductionItemDisplayed) {
      var introductionItemNode = document.createElement('div');

      introductionItemNode.className = 'placeholder';

      var tmp = '<h1>' + _f('introductionTitle') + '</h1>';
      tmp += '<button class="button thanksButton" href="#">';
      tmp += _f('introductionButton');
      tmp += '</button>';

      introductionItemNode.innerHTML = tmp;
      feedNode.insertBefore(introductionItemNode, feedNode.firstChild);
      _introductionItemDisplayed = true;

      var thanksButton = document.querySelector('#feed .thanksButton');

      thanksButton.addEventListener('click', hideIntroductionItem);
    }
  };

  feed.node = document.createElement('div');
  feed.node.className = 'feed';
  feed.items = [];
  feed.showIntroductionItem = _showIntroductionItem;
  feed.addItemForState = _formatter.formatState;
  feed.addItemsForStates = _formatter.formatStates;
  feed.getStickyness = _getStickyness;
  feed.setLoggingHelper = _setLoggingHelper;

  setInterval(_cleanFeed, CLEAN_INTERVAL);

  // Throttle scroll events to at most 1 every 500 ms.
  var _eventStream = new $react.EventStream();
  var _throttledStream = $react.throttle(_eventStream, 500);

  feed.node.addEventListener('DOMNodeInsertedIntoDocument',
      function onDOMNodeInsertedIntoDocument(e) {
        feed.node.removeEventListener('DOMNodeInsertedIntoDocument',
            onDOMNodeInsertedIntoDocument);
        feed.node.parentNode.addEventListener('scroll', function() {
          $react.publish(_eventStream, null);
        });
      });
  _throttledStream.subscribe(_updateFeed);

  return feed;
}

/**
 * [FeedItem description].
 * @param {[type]} state        [description].
 * @param {[type]} presenceNode [description].
 * @constructor
 */
function FeedItem(state, presenceNode) {
  var item = this;
  var user = state.user;
  var staticUser = $staticdata.getInterestingPeople(user.canonicalUsername);

  item.state = state;
  item.node = document.createElement('a');
  item.loadedArtwork = false;

  var node = item.node;
  node.appendChild(presenceNode);
  node.className = 'item type-' + state.type;
  node.title = state.user.name.decodeForText();
  node.href = state.user.uri;

  var icon = state.type == $presence.PresenceState.TYPE.MY_PLAYLIST_SUBSCRIBED ?
      state.user.picture :
      state.user.icon;

  var image = new $views.Image(icon, state.user.uri);
  image.node.classList.add('avatar');
  node.appendChild(image.node);
  this.avatar = image.node;
  this.appLink = presenceNode.querySelector('.app-info');

  $react.fromDOMEvent(node, 'dragover').subscribe(function(e) {
    var linkType = sp.core.getLinkType(e.dataTransfer.getData('text'));
    if (SHARABLE_LINK_TYPES[linkType]) {
      e.preventDefault();
    }
  });

  $react.fromDOMEvent(node, 'dragenter').subscribe(function(e) {
    var linkType = sp.core.getLinkType(e.dataTransfer.getData('text'));
    if (SHARABLE_LINK_TYPES[linkType]) {
      e.target.classList.add('drag-over');
    }
    else {
      e.dataTransfer.dropEffect = 'none';
    }
  });

  $react.merge($react.fromDOMEvent(node, 'drop'),
      $react.fromDOMEvent(node, 'dragleave'))
  .subscribe(function(e) {
        e.target.classList.remove('drag-over');
      });

  $react.fromDOMEvent(node, 'drop').subscribe(function(e) {
    e.preventDefault();
    e.stopPropagation();

    var uri = e.dataTransfer.getData('text');
    var linkType = sp.core.getLinkType(uri);
    if (SHARABLE_LINK_TYPES[linkType]) {
      if ($popover.popover && $popover.popover.targetNode === e.target) {
        $popover.popover.hide(true);
      }
      $popover.sharePopup(state.user, uri, node, {
        relativeNode: item.node.parentNode.parentNode
      });
    }
    else {
      sp.core.showClientMessage(0,
          $language.format(
          $language.getString(CATALOG,
              'friendslist', 'unsupportedDropType'),
          sp.core.user.name.decodeForText()
          )
      );
    }
  });

  // Show info popover
  $react.fromDOMEvent(item.node, 'click').subscribe(function(e) {
    if ((item.avatar === e.target || item.appLink === e.target) ||
        (item.appLink && item.appLink.children[0])) {

      var uri = item.appLink === e.target ? item.appLink.parentNode.href : item.avatar.href;

      // workaround because logClientEvent cannot handle embedded object
      var data = extractStateForLogging(item.state);
      data.uri = uri;
      $loggingHelper.logClientEvent('feed link clicked', 'link', data);

      return;
    }

    e.preventDefault();
    e.stopPropagation();

    $feedPopover.feedPopover(item.state, item.node, item.node.parentNode.parentNode, popoverContext);
  });

  return item;
}

/**
 * Hides introduction item
 */
function hideIntroductionItem() {
  var introductionItemNode = document.querySelector('#feed .placeholder');

  if (introductionItemNode !== null) {
    introductionItemNode.classList.add('closed');
    introductionItemNode.addEventListener('webkitAnimationEnd', function() {
      introductionItemNode.parentNode.removeChild(introductionItemNode);
    });
    $storage.set('noFeedIntroductionItem', true);
  }
}

/**
 * Extracts useful fields from state object for logging purposes
 */
function extractStateForLogging(state) {
  var properties = [
    'albumUri', 'artistUri', 'playlistUri', 'trackUri',
    'appUri', 'contextUri', 'referrerUri'];
  var new_state = {};
  for (var i = 0; i < properties.length; i++) {
    var p = properties[i];
    if (state.hasOwnProperty(p) && state[p] !== null) {
      new_state[p] = state[p];
    }
  }
  return new_state;
}

/**
 * Closes open popover
 */
function closePopover() {
  if ($popover.popover) {
    $popover.popover.hide(true);
  }
}
