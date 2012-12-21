/**
 * @module Friendslist
 */

'use strict';

var sp = getSpotifyApi(1);

// Imports
var $favourites = sp.require('$unstable/favorites');
var $language = sp.require('$util/language');
var $popover = sp.require('$unstable/popover');
var $react = sp.require('$util/react');
var $staticdata = sp.require('$unstable/staticdata');
var $views = sp.require('$api/views');
var $presence = sp.require('$unstable/presence');

var $feedPopover = sp.require('feedpopover');
var $presenceFormatter = sp.require('presence-formatter');

// Constants
var PLACEHOLDER_TIMEOUT = 0;
var CATALOG = $language.loadCatalog('feed', '');
var _f = partial($language.getString, CATALOG, 'friendslist');
var _ = partial($language.getString, CATALOG, 'presence');
var SHARABLE_LINK_TYPES = {
  1: 1, // Artist
  2: 1, // Album
  4: 1, // Track
  5: 1  // Playlist
};

// Logging helper
var $loggingHelper;
var popoverContext = 'friendlist-popover';

// Exports
/** [desc] */
exports.FriendsList = FriendsList;
/** [desc] */
exports.Friend = Friend;

var _noFavoritesPlaceholder = null;
var _placeholderNode = null;
var _placeholderTimer = null;
var _loggingVersion = '4';

/**
 * FriendsList
 * @constructor
 */
function FriendsList() {
  var fl = this;
  var formatter;
  var _friendEquals, _friendIndex, _hidePlaceholder, _showPlaceholder,
      _sortByName, _setFriendState,
      _setLoggingHelper, _loggingHelper, _testGroup;
  var droppable = document.createElement('div');

  _setLoggingHelper = function(lh) {
    $loggingHelper = lh;
    _testGroup = $loggingHelper.getTestGroup();

    $feedPopover.setLoggingHelper($loggingHelper);
  };

  formatter = new $presenceFormatter.PresenceFormatter(function(state, presenceNode, isPartOfBatch) {
    _setFriendState(state, presenceNode);
  });
  formatter.stringFromArtistsArray = function(as) {
    return map(function(a) {
      var tmp = '<a class="sp-text-truncate" href="{0}">{1}</a>';
      return $language.format(tmp,
          a.uri.decodeForHTML(),
          a.name.decodeForHTML());
    }, as).join(', ');
  };
  formatter.formatPlaylistPublished = function(state, data) {
    return $language.format('<span class="playlist">{0}</span>',
        $language.format(
        _('publishedPlaylist'),
        data.name.decodeForHTML()
        ));
  };
  formatter.formatPlaylistSubscribed = function(state, data, owner) {
    return $language.format('<span class="playlist">{0}</span>',
        $language.format(
        _('subscribedToPlaylist'),
        $language.format('<a href="{0}">{1}</a>',
        data.uri.decodeForHTML(),
        data.name.decodeForHTML())
        ));
  };
  formatter.formatMyPlaylistSubscribed = function(state, data) {
    return $language.format('<span class="playlist">{0}</span>',
        $language.format(
        _('myPlaylistSubscribed'),
        $language.format('<strong>{0}</strong>',
        state.user.name.decodeForHTML()),
        data.name.decodeForHTML()
        ));
  };
  formatter.formatPlaylistTrackAdded = function(state, data) {
    var track = data[0];
    var playlist = data[1];
    return $language.format('<span class="playlist">{0}</span>',
        $language.format(
        _('addedTrack'),
        track.uri.decodeForHTML(),
        track.name.decodeForHTML(),
        playlist.uri.decodeForHTML(),
        playlist.name.decodeForHTML()
        ));
  };
  formatter.formatTrackStarred = function(state, data) {
    return $language.format('<span class="starred">{0}</span>',
        $language.format(
        _('starredTrack'), {
          uri: data.uri.decodeForHTML() + '?action=browse',
          name: data.name.decodeForHTML()
        }
        ));
  };
  formatter.formatTrackFinishedPlaying = function(state, data) {
    var formattedString;
    var appUri = '#';
    if (state.type === $presence.PresenceState.TYPE.APP_TRACK_FINISHED_PLAYING && state.appInfo) {
      appUri = 'spotify:app:' + state.appInfo.application;
      formattedString = $language.format('<span class="track app">{0}{1}</span>',
          $language.format(_('track'), {
            uri: data.uri.decodeForHTML() + '?action=browse',
            name: data.name.decodeForHTML(),
            artists: formatter.stringFromArtistsArray(data.artists)
          }),
          '<a class="app-icon" href="' + appUri + '" style="background-image:url(' + state.appInfo.icon_small + ')"></a>');
    } else if (state.type === $presence.PresenceState.TYPE.RADIO_TRACK_FINISHED_PLAYING) {
      appUri = 'spotify:app:radio';
      formattedString = $language.format('<span class="track app">{0}{1}</span>',
          $language.format(_('track'), {
            uri: data.uri.decodeForHTML() + '?action=browse',
            name: data.name.decodeForHTML(),
            artists: formatter.stringFromArtistsArray(data.artists)
          }),
          '<a class="app-icon radio" href="' + appUri + '" style="background-image: url(sp://resources/img/buddylist-radio-icon.png)"></a>');
    } else {
      formattedString = $language.format('<span class="track">{0}</span>',
          $language.format(_('track'), {
            uri: data.uri.decodeForHTML() + '?action=browse',
            name: data.name.decodeForHTML(),
            artists: formatter.stringFromArtistsArray(data.artists)
          }));
    }
    return formattedString;
  };
  formatter.formatFavouriteAppAdded = function(state) {
    return $language.format(
        '<span class="info">{0}{1}</span>',
        $language.format(_('addedApp'), state.appInfo.name),
        '<span class="app-icon" style="background-image:url(' + state.appInfo.icon_small + ')"></span>'
    );
  };

  droppable.classList.add('droppable');
  droppable.classList.add('friends');
  droppable.tabIndex = 0;
  fl.node = droppable;
  fl.selectedItem = null;
  fl.friends = [];
  fl.setFriendState = formatter.formatState;
  fl.setFriendStates = formatter.formatStates;
  fl.setLoggingHelper = _setLoggingHelper;

  /**
   * Set the friend state if friend is in list
   * @param {[type]} state        [description].
   * @param {[type]} presenceNode [description].
   */
  _setFriendState = function(state, presenceNode) {
    var friends = fl.friends;
    for (var i = 0, l = friends.length; i < l; ++i) {
      if (state.user.canonicalUsername === friends[i].data.canonicalUsername) {
        friends[i].setActivity(state, presenceNode);
        break;
      }
    }
  };

  /**
   * [_friendEquals description]
   * @param  {[type]} friend      [description].
   * @param  {[type]} otherFriend [description].
   * @return {[type]} Returns data uri.
   */
  _friendEquals = function(friend, otherFriend) {
    return friend.data.uri === otherFriend.data.uri;
  };

  /**
   * [_friendIndex description]
   * @param  {[type]} friend [description].
   * @return {boolean} [description].
   */
  _friendIndex = function(friend) {
    var match = filter(function(otherFriend) {
      return _friendEquals(friend, otherFriend);
    }, fl.friends);

    return 0 === match.length ? -1 :
        fl.friends.indexOf(match[0]);
  };

  /**
   * [_showPlaceholder description]
   * @param  {String} content HTML as text.
   */
  _showPlaceholder = function(content) {
    if (null === _placeholderNode) {
      _placeholderNode = document.createElement('div');
      _placeholderNode.className = 'placeholder droppable';
      _placeholderNode.innerHTML = content;
      _placeholderNode.style.opacity = 0;
      fl.node.insertBefore(_placeholderNode, fl.node.firstChild);
      var unused = _placeholderNode.offsetWidth;
      _placeholderNode.style.opacity = 1;
    }
  };

  /**
   * [_hidePlaceholder description]
   */
  _hidePlaceholder = function() {
    var pNode = _placeholderNode;
    if (null !== pNode) {
      _placeholderNode = null;
      var unused = pNode.offsetWidth;
      $react.fromDOMEvent(pNode, 'webkitTransitionEnd')
        .subscribe(function(e) {
            if (fl.node)
              fl.node.removeChild(pNode);
          });
      pNode.style.opacity = 0;
    }
  };

  /**
   * [_sortByName description]
   * @param  {[type]} friends [description].
   * @return {Array} [description].
   */
  _sortByName = function(friends) {
    return friends.sort(function(f1, f2) {
      return compare(f1.data.name.toLowerCase(),
          f2.data.name.toLowerCase());
    });
  };

  var _getRemovableFriends = function(friends, newFriends) {
    var removableFriends = [];
    var i = 0;
    var found;
    while (i < friends.length) {
      found = false;
      for (var idx in newFriends) {
        if (_friendEquals(friends[i], newFriends[idx])) {
          found = true;
        }
      }
      if (false === found) {
        removableFriends.push(friends[i]);
      }
      ++i;
    }
    return removableFriends;
  };

  /**
   * [updateList description]
   * @param  {Array.<Friend>} newItems [description].
   */
  fl.updateList = function(newItems) {
    var toRemove = [];
    var newFriends = _sortByName(newItems);
    toRemove = _getRemovableFriends(fl.friends, newFriends);

    // Remove obsolete items
    for (var removable in toRemove) {
      var removableFriend = toRemove[removable];
      removableFriend.remove();
      fl.friends.splice(fl.friends.indexOf(removableFriend), 1);
    }

    // Update existing items
    for (var newFriendIdx in newFriends) {

      var newFriend = newFriends[newFriendIdx];
      var ix = _friendIndex(newFriend);

      if (-1 === ix) {
        for (var friendIdx in fl.friends.length) {

          var newFriendName = newFriend.data.name
              .decodeForText().toLowerCase();
          var friendName = fl.friends[friendIdx].data.name
              .decodeForText().toLowerCase();

          if (newFriendName < friendName) {
            ix = friendIdx;
            break;
          }
        }

        newFriend.parent = fl;
        if (-1 === ix) {
          ix = fl.friends.length;
        }

        fl.friends.splice(ix, 0, newFriend);
        fl.node.insertBefore(newFriend.node,
            ix === fl.node.childNodes.length ?
            null :
            fl.node.childNodes[ix]);
        newFriend.show();

      } else {
        fl.friends[ix].update(newFriend.data);
      }
    }

    // Show placeholder when there are no friends
    if (_placeholderTimer) clearTimeout(_placeholderTimer);
    if (0 === fl.friends.length) {
      if (null === _noFavoritesPlaceholder) {
        var tmp = '<h1>{0}</h1><p>{1}</p>';
        tmp += '<a class="button" href="spotify:app:people">{2}</a>';
        _noFavoritesPlaceholder = $language.format(tmp,
            _f('noFavorites'),
            _f('addPeople'),
            _f('showPeople'));
      }
      _placeholderTimer = setTimeout(
          partial(_showPlaceholder, _noFavoritesPlaceholder),
          PLACEHOLDER_TIMEOUT);
    } else {
      _hidePlaceholder();
    }
  };

  /*
   * Add events to FriendsList
   */
  $react.fromDOMEvent(fl.node, 'dragover')
    .subscribe(function(e) {
        var uri = e.dataTransfer.getData('text');
        var linkType = sp.core.getLinkType(uri);
        if (!$favourites.isFavoriteUser(uri) &&
            (10 === linkType || 22 === linkType)) {
          e.preventDefault();
        } else {
          e.dataTransfer.dropEffect = 'none';
        }
      });

  $react.fromDOMEvent(fl.node, 'drop')
    .subscribe(function(e) {
        e.preventDefault();
        e.stopPropagation();

        var uri = e.dataTransfer.getData('text');
        var linkType = sp.core.getLinkType(uri);
        if (10 === linkType || 22 === linkType) {
          $favourites.addFavoriteUser(uri);
          $loggingHelper.logClientEvent('favorite friend added', 'drag & drop', {
            uri: uri
          });
        } else {
          e.preventDefault();
          sp.core.showClientMessage(0,
              $language.format(_('unsupportedDropType'),
              sp.core.user.name.decodeForText()));
        }
      });

  $react.fromDOMEvent(droppable, 'dragenter')
    .subscribe(function(e) {
        var uri = e.dataTransfer.getData('text');
        var linkType = sp.core.getLinkType(uri);
        var notFavorite = !$favourites.isFavoriteUser(uri);
        if (notFavorite && (10 === linkType || 22 === linkType)) {
          e.currentTarget.classList.add('drag-over');
          e.stopPropagation();
        }
      });

  $react.merge($react.fromDOMEvent(droppable, 'drop'),
      $react.fromDOMEvent(droppable, 'dragleave'))
    .subscribe(function(e) {
        e.target.classList.remove('drag-over');
      });
}


/**
 * Friend
 * @constructor
 */
function Friend(data) {
  var friend = this;
  var el = document.createElement('a');
  el.href = data.uri;
  el.title = data.name.decodeForText();
  el.classList.add('droppable');
  el.classList.add('no-activity');
  el.classList.add('friend');

  friend.node = el;
  friend.presence = null;

  /**
   * [show description]
   * @param  {[type]} noAnim [description].
   * @return {Object} Returns friend if noAnim.
   */
  friend.show = function(noAnim) {
    noAnim = !!noAnim;
    friend.node.classList.remove('hide');
    if (noAnim) {
      friend.node.classList.remove('show');
      friend.node.classList.remove('hidden');
      return friend;
    }
    friend.node.classList.add('show');
  };

  /**
   * [remove description]
   */
  friend.remove = function() {
    var node = friend.node;
    $react.takeFirst($react.fromDOMEvent(node, 'webkitAnimationEnd'))
      .subscribe(function(e) {
          node.parentNode.removeChild(node);
        });
    node.classList.add('hide');
  };

  /**
   * [setActivity description]
   * @param {Object} state          [description].
   * @param {HTMLNode} presenceNode [description].
   */
  friend.setActivity = function(state, presenceNode) {
    var activityNode = friend.node.lastChild;
    friend.presence = state;
    while (activityNode.firstChild) {
      activityNode.removeChild(activityNode.firstChild);
    }
    activityNode.appendChild(presenceNode);
    friend.node.classList.remove('no-activity');
  };

  /**
   * @param {Object} data [description].
   */
  friend.update = function(data) {
    var el = friend.node;
    var nameEl, image, imageEl;
    var fData = friend.data;
    var staticUser = $staticdata.getInterestingPeople(data.canonicalUsername);
    if (!el.innerHTML) {
      el.innerHTML = $language.format('{0}{1}{2}',
          '<div class="picture"></div>',
          '<div class="name"></div>',
          '<div class="activity"></div>');
    }

    if (!fData ||
        fData.name.decodeForText() !== data.name.decodeForText()) {
      var friendName = data.name.decodeForText();
      if (staticUser)
        friendName = staticUser.name.decodeForText();

      nameEl = el.querySelector('.name');
      nameEl.textContent = friendName;
    }

    if (!fData || (fData.icon !== data.icon)) {
      var icon = data.icon;
      if (staticUser)
        icon = staticUser.picture;

      image = new $views.Image(icon, data.uri);
      imageEl = el.querySelector('.picture');
      while (imageEl.firstChild) {
        imageEl.removeChild(imageEl.firstChild);
      }
      imageEl.appendChild(image.node);
      image.node.classList.add('avatar');
    }
    friend.data = data;
  };

  /*
   * Friend events
   */
  $react.fromDOMEvent(el, 'dragenter')
    .subscribe(function(e) {
        var linkType = sp.core.getLinkType(e.dataTransfer.getData('text'));
        if (SHARABLE_LINK_TYPES[linkType]) {
          e.target.classList.add('drag-over');
          e.stopPropagation();
        }
      });

  $react.merge($react.fromDOMEvent(el, 'drop'), $react.fromDOMEvent(el, 'dragleave'))
    .subscribe(function(e) {
        e.target.classList.remove('drag-over');
      });

  $react.fromDOMEvent(friend.node, 'dragover')
    .subscribe(function(e) {
        var linkType = sp.core.getLinkType(e.dataTransfer.getData('text'));
        if (SHARABLE_LINK_TYPES[linkType]) {
          e.preventDefault();
          e.stopPropagation();
        } else {
          e.dataTransfer.dropEffect = 'none';
        }
      });

  $react.fromDOMEvent(friend.node, 'drop')
    .subscribe(function(e) {
        e.preventDefault();
        e.stopPropagation();

        var uri = e.dataTransfer.getData('text');
        var linkType = sp.core.getLinkType(uri);
        e.stopPropagation();

        if ($popover.popover && $popover.popover.targetNode === e.target) {
          $popover.popover.hide(true);
        }

        if (SHARABLE_LINK_TYPES[linkType]) {
          $popover.sharePopup(friend.data, uri, friend.node, {
            relativeNode: friend.parent.node
          });
        }
      });

  $react.fromDOMEvent(friend.node, 'click')
    .subscribe(function(e) {
        var appLink = friend.node.querySelector('.app-icon');
        var avatar = friend.node.querySelector('.avatar');

        if (avatar === e.target || appLink == e.target) {
          var uri = appLink === e.target ? appLink.parentNode.href : avatar.href;
          $loggingHelper.logClientEvent('favorite link clicked', 'link', {
            state: friend.presence,
            uri: uri
          });
          return;
        }

        e.preventDefault();
        e.stopPropagation();

        if ($popover.popover && $popover.popover.targetNode === e.target) {
          $popover.popover.hide(false);
          return;
        }
        var data = friend.presence ? friend.presence : {user: friend.data};
        if (friend.presence && friend.presence.user.name !== friend.data.name) {
          data.user = friend.data;
        }
        $feedPopover.feedPopover(data, friend.node, friend.node.parentNode, popoverContext);
      });

  friend.update(data);
}
