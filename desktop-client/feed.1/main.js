/**
 * @module Main Feed
 */
'use strict';

var sp = getSpotifyApi(1);

// Imports
var $favorites = sp.require('$unstable/favorites');
var $language = sp.require('$util/language');
var $presence = sp.require('$unstable/presence');
var $react = sp.require('$util/react');
var $social = sp.require('$unstable/social');
var $storage = sp.require('$util/storage');
var $models = sp.require('$api/models');

var $popups = sp.require('popups-tests');
var $feed = sp.require('feed');
var $friendsList = sp.require('friendslist');
var $tutorial = sp.require('tutorial');

// Constants
var MAX_INITIAL_ITEMS = 30;
var _ = partial($language.getString,
    $language.loadCatalog('feed', ''), 'generic');

// Exports
exports.init = _initializeFeed;

// Private variables
var _friendsList = new $friendsList.FriendsList();
var _feed = new $feed.Feed();
var _eventStream = new $react.EventStream();
var _throttledStream = $react.throttle(_eventStream, 500);
var startedOnline = ($models.session.state === 1) ? true : false;
var _feedInitFlag = false;
var _friendsInitFlag = false;
var _stagger = [20000, 20000, 20000];
var _staggeredTimeouts = {
  feed: null,
  friends: null
};
var _staggerErrorMessage = false;

// Logging helper
var $lh = sp.require('logging-helper');
var _loggingVersion = '5';
var $loggingHelper = new $lh.loggingHelper();
$loggingHelper.init(_loggingVersion);

var _friendSection = null;
var _feedSection = null;

var _tutorialComplete = false;

// A/B TEST
var _abTestGroup = sp.core.getAbTestGroupForTest('feed_ab_test');

_feed.setLoggingHelper($loggingHelper);
_friendsList.setLoggingHelper($loggingHelper);

// Subscriptions
_throttledStream.subscribe(function(states) {
  _feed.addItemsForStates(states);
});

/**
 * Called when initial presence for friends list is ready.
 *
 * @param {Array} data An array of presence states for each user.
 */
function _onInitialPresenceForFriendsList(data) {
  var states = [];

  for (var username in data) {
    var state = $presence.getMostRecentPresence(data[username]);

    if (state !== null) {
      states.push(state);
    }
  }

  _hideThrobber(_friendSection);
  _friendsInitFlag = true;
  _friendsList.setFriendStates(states);
}

/**
 * Get initial presence for friends list.
 *
 * @param {Array} users An array of user objects.
 */
function _getInitialPresenceForFriendsList(users) {
  var usernames = [];

  for (var i = 0, len = users.length; i < len; i++) {
    var user = users[i];

    if (user.hasOwnProperty('canonicalUsername') &&
        user.canonicalUsername.length) {

      usernames.push(user.canonicalUsername);
    }
  }

  // Get the most recent presence for the initial friends list.
  $presence.getPresenceForUsers(usernames,
      _onInitialPresenceForFriendsList, usernames.length);
}

/**
 * Sort callback for comparing PresenceState
 *
 * @param {PresenceState} a First PresenceState.
 * @param {PresenceState} b Second PresenceState.
 * @return {Number} Stickiness.
 */
function _comparePresenceState(a, b) {
  return _feed.getStickyness(b) - _feed.getStickyness(a);
}

/**
 * Called when initial presence for feed is ready.
 *
 * @param {Array} data An array of presence states for each user.
 */
function _onInitialPresenceForFeed(data) {
  var states = [];

  for (var username in data) {
    Array.prototype.push.apply(states, data[username]);
  }

  states.sort(_comparePresenceState);

  _hideThrobber(_feedSection);
  _feedInitFlag = true;
  _feed.showIntroductionItem(_feedSection);
  _feed.addItemsForStates(states.slice(0, MAX_INITIAL_ITEMS));
}

/**
 * Get initial presence for feed.
 *
 * @param {Array} usernames An array of usernames.
 */
function _getInitialPresenceForFeed(usernames) {
  $presence.getPresenceForUsers(usernames,
      _onInitialPresenceForFeed,
      MAX_INITIAL_ITEMS);
}

/**
 * Called when a presence event for a user is fired.
 *
 * @param {String} username The username.
 * @param {Array}  states   An array of presence states.
 */
function _onPresenceForUser(username, states) {
  $react.publish(_eventStream, states);

  var state = $presence.getMostRecentPresence(states);

  if (state !== null) {
    _friendsList.setFriendState(state);
  }
}

/**
 * Subscribe to presence events for a list of users.
 *
 * @param {Array} usernames An array of usernames.
 * @param {Boolean} force   Force resub of presence.
 */
function _subscribeToPresenceForUsers(usernames, force) {
  $presence.observePresenceForUsers(usernames,
      _onPresenceForUser, false, force);
}

/**
 * Show a throbber at a specified node.
 *
 * @param {Node} section Node where to show the throbber.
 */
function _showThrobber(section) {
  var node = document.createElement('div');
  var label = document.createElement('span');
  var spinner = node.cloneNode();

  label.textContent = _('loading');
  node.appendChild(label);
  node.appendChild(spinner);
  node.className = 'throbber';

  section.appendChild(node);
}

/**
 * Hide a throbber at a specified node.
 *
 * @param {Node} section Node where to hide the throbber.
 */
function _hideThrobber(section) {
  var node = section.querySelector('.throbber');
  if (node) {
    node.style.opacity = 0;
    setTimeout(function() {
      if (node && node.parentNode) {
        node.parentNode.removeChild(node);
      }
    }, 400);
  }
}

/**
 * Insert a separator before a given section.
 *
 * @param {Node} section Node to prepend the separator to.
 * @return {Node} The separator node.
 */
function _addSeparator(section) {
  var div = document.createElement('div');
  div.classList.add('separator');
  section.parentNode.insertBefore(div, section);
  return div;
}

/**
 * Show an offline message at specified nodes.
 *
 * @param {friendsListNode} friendsListNode Friend List Node where to show the throbber.
 * @param {feedNode} feedNode Feed Node where to show the throbber.
 */

function _showOfflineMessage(friendsListNode, feedNode) {
  _hideThrobber(friendsListNode);
  _hideThrobber(feedNode);
  var div = document.createElement('div');
  div.classList.add('offline-message');

  div.innerHTML = _('friendsListUnavailableOffline');
  friendsListNode.appendChild(div);

  var div2 = document.createElement('div');
  div2.classList.add('offline-message');
  div2.innerHTML = _('feedUnavailableOffline');
  feedNode.appendChild(div2);
}

/**
 * Hide all offline messages at a specified node.
 */

function _hideOfflineMessage() {
  var nodes = document.querySelectorAll('.offline-message');

  for (var i = 0, l = nodes.length; i < l; i += 1) {
    nodes[i].parentNode.removeChild(nodes[i]);
  }
}

/**
 * Shuffle an array (modified the original array).
 *
 * @param {Array} xs Array to shuffle.
 * @return {Array} The array.
 */
function _fyShuffle(xs) {
  var i = xs.length;
  var j, tmpi, tmpj;
  if (0 === i) return xs;
  while (--i) {
    j = ~~(Math.random() * (i + 1));
    tmpi = xs[i];
    tmpj = xs[j];
    xs[i] = tmpj;
    xs[j] = tmpi;
  }
  return xs;
}

/**
 * Reload the feed.
 */
function _reloadFeed() {
  var usernames = $social.getUsernames();

  _getInitialPresenceForFeed(usernames);
  _subscribeToPresenceForUsers(usernames, false);
}

/**
 * Reload the friends list.
 */
function _reloadFriendsList() {
  var users = $favorites.getFavoriteUsers();
  var friends = [];

  for (var i = 0, len = users.length; i < len; i++) {
    friends.push(new $friendsList.Friend(users[i]));
  }

  _friendsList.updateList(friends);

  if (!_friendsList.node.parentNode) {
    _friendSection.appendChild(_friendsList.node);
  }

  _getInitialPresenceForFriendsList(users);
}

function _onRelationsLoaded(e) {
  if (_tutorialComplete) {
    $popups.loadPopupsTest();
  }

  _onRelationsUpdated.call(this, e);
}

/**
 * Called when social relations are updated.
 */
function _onRelationsUpdated(e) {
  _reloadFeed();
  _reloadFriendsList();
}

/**
 * Called when favorites are loaded.
 */
function _onFavoritesLoaded(e) {
  _reloadFriendsList();
}

/**
 * Called when favorites are changed.
 */
function _onFavoritesChanged(e) {
  var numFriendsOld = document.getElementById('friends')
    .getElementsByClassName('friends')[0]
    .childNodes.length;
  var numFriendsNew = $favorites.getFavoriteUsers().length;

  if (numFriendsOld < numFriendsNew) {
    $loggingHelper.logClientEvent('favorite changed', 'friend added', {});
  }
  else if (numFriendsOld > numFriendsNew) {
    $loggingHelper.logClientEvent('favorite changed', 'friend removed', {});
  }

  _reloadFriendsList();
}

/**
 * Called when client logged in (after being disconnected)
 */
function _onLogin(e) {
  _subscribeToPresenceForUsers($social.getUsernames(), true);
}

function _goOnline() {
  _clearErrorMessage();
  _hideOfflineMessage();
  _onRelationsUpdated();
}
/**
 * Initiate staggered reload of feed sections
 * @param {number} stage An index for the _stagger global variable.
 * @private
 */
function _initStaggeredReload(stage) {
  _staggerFeedReload(stage);
  _staggerFriendsReload(stage);
}
/**
 * Initiate staggered reload of the feed
 * @param {number} stage An index for the _stagger global variable.
 * @private
 */
function _staggerFeedReload(stage) {
  //console.log('(feed) _staggerFeedReload', stage);
  if (stage < (_stagger.length - 1)) {
    _staggeredTimeouts.feed = setTimeout(function() {
      //console.log('(feed) timeout fired for feedsection', _feedInitFlag);
      if (!_feedInitFlag) {
        if ($social.loaded) {
          _reloadFeed();
        }
        _staggerFeedReload(stage + 1);
      }
    }, _stagger[stage]);
  } else {
    _staggeredTimeouts.feed = null;
    if (!_feedInitFlag) {
      _hideThrobber(_feedSection);
      _displayErrorMessage(_feedSection);
    }
  }
}
/**
 * Initiate staggered reload of the friends section
 * @param {number} stage An index for the _stagger global variable.
 * @private
 */
function _staggerFriendsReload(stage) {
  //console.log('(feed) _staggerFriendsReload', stage);
  if (stage < (_stagger.length - 1)) {
    _staggeredTimeouts.friends = setTimeout(function() {
      //console.log('(feed) timeout fired for friendsection', _friendsInitFlag);
      if (!_friendsInitFlag) {
        if ($favorites.loaded) {
          _reloadFriendsList();
        }
        _staggerFriendsReload(stage + 1);
      }
    }, _stagger[stage]);
  } else {
    _staggeredTimeouts.friends = null;
    if (!_friendsInitFlag) {
      _hideThrobber(_friendSection);
      _displayErrorMessage(_friendSection);
    }
  }
}
/**
 * Displays error messages
 * @param {Element} section Feed or friendslist.
 * @private
 */
function _displayErrorMessage(section) {
  if (_staggerErrorMessage === true) return;

  var msg = document.createElement('div');

  msg.innerHTML = '<p>' + _('notLoadingProperly') + '</p>' +
      '<button class="button reload-btn" href="javascript:window.location=window.location">' + _('reload') + '</button>';
  msg.classList.add('error-msg');
  section.appendChild(msg);
  _staggerErrorMessage = true;
}
/**
 * Removes error messages
 * @private
 */
function _clearErrorMessage() {
  var nodes = document.querySelectorAll('.error-msg');

  for (var i = 0, l = nodes.length; i < l; i += 1) {
    nodes[i].parentNode.removeChild(nodes[i]);
  }
}

/**
 * Initialize the feed.
 */
function _initializeFeed() {
  _friendSection = document.getElementById('friends');
  _feedSection = document.getElementById('feed');

  var tutorialSection = document.getElementById('tutorial');
  var feedSeparator = _addSeparator(_feedSection);
  var friendsSeparator = null;

  var onTutorialComplete = function() {
    var node = tutorialSection.parentNode;
    if (node) {
      node.removeChild(tutorialSection);
      if (friendsSeparator)
        node.removeChild(friendsSeparator);
    }
    _tutorialComplete = true;
  };
  var tutorial = new $tutorial.Tutorial(onTutorialComplete);

  if (tutorial.isComplete) {
    onTutorialComplete();
  }
  else {
    friendsSeparator = _addSeparator(_friendSection);

    tutorialSection.style.display = 'block';
    tutorialSection.style.height = tutorial.node.height;
    tutorialSection.appendChild(tutorial.node);
  }

  _showThrobber(_friendSection);
  _showThrobber(_feedSection);

  if (!startedOnline) {
    _showOfflineMessage(_friendSection, _feedSection);
  } else {
    _initStaggeredReload(0);
  }

  // Setting height of friends section.
  var _setFriendSectionHeight = function(height) {
    var bodyHeight = document.body.offsetHeight;
    var tutorialHeight = tutorialSection.offsetHeight;
    var max = bodyHeight * 0.8 - tutorialHeight;

    _friendSection.style.height = Math.min(height, max) + 'px';

    $storage.set('friendSectionHeight', _friendSection.offsetHeight);
  };

  var _onDoubleClick = function(e) {
    _setFriendSectionHeight(_friendsList.friends.length * 34 + 10);
  };

  var _onMouseMove = function(e) {
    _setFriendSectionHeight(e.clientY - tutorialSection.offsetHeight);
  };

  var _onMouseUp = function(e) {
    window.removeEventListener('mousemove', _onMouseMove);
    window.removeEventListener('mouseup', _onMouseUp);

    $storage.set('friendSectionHeight', _friendSection.offsetHeight);
  };

  var _onMouseDown = function(e) {
    $feed.closePopover();
    window.addEventListener('mousemove', _onMouseMove);
    window.addEventListener('mouseup', _onMouseUp);

    // Prevent dragging something below the separator
    e.preventDefault();
  };

  feedSeparator.classList.add('resizable');
  feedSeparator.addEventListener('dblclick', _onDoubleClick);
  feedSeparator.addEventListener('mousedown', _onMouseDown);

  _setFriendSectionHeight($storage.getWithDefault('friendSectionHeight', 248));

  _feedSection.appendChild(_feed.node);
  _friendSection.appendChild(_friendsList.node);

  // Social relations
  if (!$social.loaded) {
    $social.addEventListener($social.RELATIONS_LOADED_EVENT, _onRelationsLoaded);
    // console.log('(feed) social not loaded, adding event listener');
  }
  else {
    _onRelationsLoaded();
  }

  $social.addEventListener($social.RELATIONS_CHANGED_EVENT, _onRelationsUpdated);
  // TODO: Single relation changed
  //$social.addEventListener($social.RELATION_UPDATED_EVENT, _onRelationUpdated);

  // Favorites
  if (!$favorites.loaded) {
    $favorites.addEventListener($favorites.FAVORITES_LOADED_EVENT, _onFavoritesLoaded);
    // console.log('(feed) favourites not loaded, adding event listener');
  }
  else {
    _onFavoritesLoaded();
  }

  $favorites.addEventListener($favorites.FAVORITES_CHANGED_EVENT, _onFavoritesChanged);

  $models.session.observe($models.EVENT.STATECHANGED, function() {
    if ($models.session.state === 1) {
      _goOnline();
    }
  });

  sp.core.addEventListener('login', _onLogin);
}
