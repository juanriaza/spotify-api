/**
 * @module Search Dropdown
 * @author Pär Bohrarper <bohrarper@spotify.com>
 * @author Felix Bruns <felixbruns@spotify.com>
 */

'use strict';

sp = getSpotifyApi();

var dom = sp.require('$util/dom');
var lang = sp.require('$util/language');
var models = sp.require('$api/models');
var staticdata = sp.require('$unstable/staticdata');
var _ = partial(lang.getString, lang.loadCatalog('$resources/cef_views'), 'Search Dropdown');

var lastQuery = { str: null, startTime: 0, responseTime: 0 };
var social = sp.social;
var relations = social.relations;
var userCache = {};
var paddedResults = [];
var testVersion = 'A';
var searchTime = 0;

var NONE = -1;
var POOR = 0;
var GOOD = 1;
var EXACT = 2;

var MIN_SEARCH_TIMEOUT = 100;
var MAX_SEARCH_TIMEOUT = 1000;

// mats_test 695
// mats_test_legacy 212
var G = sp.core.getAbTestGroupForTest('pad_suggest');

if (G > 694 && G <= 724) {
  testVersion = 'B';
} else if (G > 211 && G <= 241) {
  testVersion = 'C';
}

var RESULT_COUNT = 9;
var RESULT_ORDER = [
  'tracks',
  'playlists',
  'artists',
  'albums',
  'users'
];

/*
 * Class implementing so called hover intents.
 *
 * Will fire onMouseOver and onMouseOut callbacks as normal, but also
 * an additional onMouseHover callback after the users mouse slowed down.
 *
 * TODO: Should we have this in util?
 *
 * @author Felix Bruns <felixbruns@spotify.com>
 *
 */
function HoverIntent(element, callbacks) {
  var MOUSE_NULL = { x: 0, y: 0 };

  var timer = -1;
  var mousePrev = MOUSE_NULL;
  var mouseCurr = MOUSE_NULL;
  var targetElement = null;

  var mouseFromEvent = function(e) {
    return { x: e.pageX, y: e.pageY };
  };

  var setTimer = function() {
    clearTimer();
    timer = window.setTimeout(onTimer, 100);
  };

  var clearTimer = function() {
    if (timer != -1) {
      window.clearTimeout(timer);
      timer = -1;
    }
  };

  var onTimer = function() {
    if ((Math.abs(mousePrev.x - mouseCurr.x) +
        Math.abs(mousePrev.y - mouseCurr.y)) < 7) {
      if (callbacks.onMouseHover) {
        callbacks.onMouseHover(targetElement);
      }
      onMouseOut();
    }
    else {
      mousePrev = mouseCurr;
      setTimer();
    }
  };

  var onMouseOver = function(e) {
    targetElement = e.target;

    if (callbacks.onMouseOver) {
      callbacks.onMouseOver(targetElement);
    }

    element.addEventListener('mousemove', onMouseMove);
    mousePrev = mouseFromEvent(e);
    setTimer();
  };

  var onMouseOut = function(e) {
    if (callbacks.onMouseOut) {
      callbacks.onMouseOut(targetElement);
    }

    targetElement = null;

    element.removeEventListener('mousemove', onMouseMove);
    mousePrev = MOUSE_NULL;
    mouseCurr = MOUSE_NULL;
    clearTimer();
  };

  var onMouseMove = function(e) {
    mouseCurr = mouseFromEvent(e);
  };

  element.addEventListener('mouseover', onMouseOver);
  element.addEventListener('mouseout', onMouseOut);
}

function GlobalHoverIntent(callbacks) {
  new HoverIntent(document.body, callbacks);
}

/*
 * Matches a name against a search query and determines the
 * quality of the match. Used for getting the top hit in suggestions.
 */
function match(name, query) {
  if (name == query)
    return EXACT;
  // Prepend a space to make subsring search only hit beginnings of words
  if (name && (' ' + name.toLowerCase()).indexOf(' ' + query.toLowerCase()) != -1)
    if (name.length - query.length < name.length / 2)
      return GOOD;
    else
      return POOR;
    return NONE;
}

/*
 * Prepares a search result for displaying it as suggestions.
 */
function prepareResult(r, query) {
  var top = { value: NONE, item: null };
  var result = {};

  for (var i in RESULT_ORDER) {
    result[RESULT_ORDER[i]] = [];
  }

  // Insert users into result
  r['users'] = [];
  for (var canonicalUsername in userCache) {
    var user = userCache[canonicalUsername];
    if (match(user.canonicalUsername, query) != NONE || match(user.name, query) != NONE) {
      r['users'].push(user);
    }
  }

  // Aggregate different results into final result
  var count = 0;
  while (count < RESULT_COUNT) {
    for (var j = 0; j < RESULT_ORDER.length; ) {
      var key = RESULT_ORDER[j];
      if (r[key].length) {
        var val = r[key].shift();
        ++count;
        result[key].push(val);
      }
      j++;
    }

    if (!r['tracks'].length &&
        !r['playlists'].length &&
        !r['artists'].length &&
        !r['albums'].length &&
        !r['users'].length) {
      break;
    }
  }

  // Find the top result hit
  var v = NONE;

  for (var k in RESULT_ORDER) {
    var key = RESULT_ORDER[k];
    for (var j = 0; j < result[key].length; j++) {
      if (key == 'users' && (v = match(result[key][j].canonicalUsername, query)) > top.value) {
        top.item = result[key][j];
        top.item.image = result[key][j].picture;
        top.value = v;
      }
      if ((v = match(result[key][j].name, query)) > top.value) {
        top.item = result[key][j];
        top.item.image = result[key][j].portrait;
        top.value = v;
      }
    }
  }

  result.top = top;

  return result;
}

function extractURIs(arr) {
  var uris = [];
  var key;
  for (var i = 0, iL = RESULT_ORDER.length - 1; i < iL; i += 1) {
    key = RESULT_ORDER[i];
    for (var j = 0, jL = arr[key].length; j < jL; j += 1) {
      uris.push(arr[key][j].uri);
    }
  }
  return uris;
}

function padResult(result, query) {
  paddedResults = [];
  if ((testVersion === 'B' || testVersion === 'C') &&
      (query.length > 3 && result.artists.length < 2 && result.tracks.length < 2)) {
    var start = new Date().getTime();
    searchTime = 0;
    var uris = extractURIs(result);

    query += '*';
    var search = new models.Search(query, { 'pageSize': 18 });

    var key, item;
    search.observe(models.EVENT.CHANGE, function() {
      if (testVersion === 'B') {
        for (var i = 0, iL = RESULT_ORDER.length - 1; i < iL; i += 1) {
          key = RESULT_ORDER[i];
          for (var j = 0, jL = search[key].length; j < jL; j += 1) {
            item = search[key][j].data;
            if (uris.indexOf(item.uri) === -1) {
              result[key].push(item);
              paddedResults.push(item.uri);
              uris.push(item.uri);
            }
          }
        }
      }
      searchTime = new Date().getTime() - start;
      searchResultHandler(prepareResult(result, query));
    });

    search.appendNext();
  } else {
    searchResultHandler(prepareResult(result, query));
  }

}

function autoComplete(query) {
  lastQuery.str = query;
  lastQuery.startTime = Date.now();

  sp.core.suggestSearch(query, {
    onSuccess: function(result) {
      if (lastQuery.str === query) {
        lastQuery.responseTime = Date.now() - lastQuery.startTime;
        //console.log("Suggest: " + lastQuery.responseTime);
        padResult(result, query);
      }
    }
  });
}

function autoCompleteHoldOff() {
  return Math.min(Math.max(MIN_SEARCH_TIMEOUT, lastQuery.responseTime), MAX_SEARCH_TIMEOUT);
}

function searchResultHandler(r) {
  var div = dom.queryOne('#suggest');

  if (null === r || (0 === r.tracks.length && 0 === r.artists.length &&
      0 === r.albums.length && 0 === r.playlists.length &&
      0 === r.users.length)) {
    div.innerHTML = lang.format(
        "<a href='spotify:search:{0}' class='selected'><img src='sp://resources/img/show-all.png' class='all' />{1}</a>",
        encodeURIComponent(lastQuery.str), _('sDropdownShowAllResults')
        );
  }
  else {
    div.innerHTML = resultToHtml(r);
  }

  var links = dom.query('a');
  links.forEach(function(link) {
    link.addEventListener('click', function(e) {
      sp.desktop.dropdown.openLink(decodeURIComponent(link.href));
      // Prevent default link handling, so the browser doesn't try to navigate
      // to the URI, which will _break_ the search-dropdown. This is important!
      e.preventDefault();
    });
  });

  var selected = dom.queryOne('a.selected');
  sp.desktop.dropdown.setLink(decodeURIComponent(selected.href));
  sp.desktop.dropdown.show(div.offsetHeight);
}

function getImage(data) {
  var type = data.type || ((data.canonicalUsername || data.facebookUid) ? 'user' : '');

  switch (type) {
    case 'artist':
      return data.portrait ? data.portrait : 'sp://resources/img/placeholders/20-artist.png';
    case 'album':
      return data.cover ? data.cover : 'sp://resources/img/placeholders/20-album.png';
    case 'track':
      return data.album.cover ? data.album.cover : 'sp://resources/img/placeholders/20-track.png';
    case 'playlist':
      if (data.cover) {
        return data.cover.replace(/spotify:mosaic:([^;]{40}?).*/, 'spotify:image:$1');
      }
      return 'sp://resources/img/placeholders/20-playlist.png';
    case 'user':
      return data.picture ? data.picture : 'sp://resources/img/placeholders/20-artist.png';
    default:
      return data.image ? data.image : '';
  }
}

function topHitToHtml(data) {
  var type = data.type || ((data.canonicalUsername || data.facebookUid) ? 'user' : '');

  switch (type) {
    case 'artist': return artistToHtml(data);
    case 'album': return albumToHtml(data);
    case 'track': return trackToHtml(data);
    case 'playlist': return playlistToHtml(data);
    case 'user': return userToHtml(data);
    default:
      return '';
  }
}

function artistToHtml(artist) {
  return lang.format(
      '<a href=\"{0}\"><img src=\"{1}\" />{2}</a>',
      artist.uri, getImage(artist), artist.name.decodeForHTML()
  );
}

function albumToHtml(album) {
  return lang.format(
      '<a href=\"{0}\"><img src=\"{1}\" />{2} <span>{3} {4}</span></a>',
      album.uri, getImage(album), album.name.decodeForHTML(), _('sDropdownBy'), album.artist.name.decodeForHTML()
  );
}

function trackToHtml(track) {
  return lang.format(
      '<a href=\"{0}?action=browse\"><img src=\"{1}\" />{2} <span>{3} {4}</span></a>',
      track.uri, getImage(track), track.name.decodeForHTML(), _('sDropdownBy'),
      map(function(artist) { return artist.name.decodeForHTML(); }, track.artists).join(', ')
  );
}

function playlistToHtml(playlist) {
  if (playlist.owner.uri === sp.core.user.uri) {
    return lang.format(
        '<a href=\"{0}\"><img src=\"{1}\" />{2}</a>',
        playlist.uri, getImage(playlist), playlist.name.decodeForHTML()
    );
  }
  else {
    return lang.format(
        '<a href=\"{0}\"><img src=\"{1}\" />{2} <span>{3} {4}</span></a>',
        playlist.uri, getImage(playlist), playlist.name.decodeForHTML(), _('sDropdownBy'), playlist.owner.name.decodeForHTML()
    );
  }
}

function userToHtml(user) {
  var userPicture = getImage(user);
  var userName = user.name;

  var staticUser = staticdata.getInterestingPeople(user.canonicalUsername);
  if (staticUser) {
    userPicture = staticUser.picture;
    userName = staticUser.name;
  }
  return lang.format('<a href=\"{0}\"><img src=\"{1}\" />{2}</a>', user.uri, userPicture, userName.decodeForHTML());
}

function resultToHtml(r) {
  var html = lang.format(
      '<a href=\"spotify:search:{0}\" class=\"selected\"><img src=\"sp://resources/img/show-all.png\" class=\"all\" />{1}</a>',
      encodeURIComponent(lastQuery.str), _('sDropdownShowAllResults')
      );

  if (r.top.item !== null) {
    html += lang.format('<div class=\"tophit\">{0}</div>{1}', _('sDropdownTopHit'), topHitToHtml(r.top.item));
  }

  for (var i in RESULT_ORDER) {
    var key = RESULT_ORDER[i];
    if (r[key].length) {
      switch (key) {
        case 'tracks':
          html += lang.format('<div class=\"tracks\">{0}</div>{1}', _('sDropdownTracks'), map(trackToHtml, r.tracks).join(''));
          break;
        case 'playlists':
          html += lang.format('<div class=\"playlists\">{0}</div>{1}', _('sDropdownPlaylists'), map(playlistToHtml, r.playlists).join(''));
          break;
        case 'artists':
          html += lang.format('<div class=\"artists\">{0}</div>{1}', _('sDropdownArtists'), map(artistToHtml, r.artists).join(''));
          break;
        case 'albums':
          html += lang.format('<div class=\"albums\">{0}</div>{1}', _('sDropdownAlbums'), map(albumToHtml, r.albums).join(''));
          break;
        case 'users':
          html += lang.format('<div class=\"users\">{0}</div>{1}', _('sDropdownUsers'), map(userToHtml, r.users).join(''));
          break;
      }
    }
  }

  return html;
}

function moveSelectionTo(element, doSetLink) {
  var current = dom.queryOne('a.selected');

  if (current !== undefined) {
    current.className = '';
  }

  if (element !== undefined) {
    element.className = 'selected';
  }

  if (doSetLink) {
    sp.desktop.dropdown.setLink(decodeURIComponent(element.href));
  }
}

var DIRECTION_UP = 0;
var DIRECTION_DOWN = 1;

var delayedSetLinkTimer = -1;

function delayedSetLink(link, timeout) {
  if (delayedSetLinkTimer != -1) {
    window.clearTimeout(delayedSetLinkTimer);
    delayedSetLinkTimer = -1;
  }
  delayedSetLinkTimer = window.setTimeout(
      partial(sp.desktop.dropdown.setLink, link),
      timeout
      );
}

function moveSelection(dir) {
  var links = dom.query('a');
  var current, next, previous;

  for (var i = 0; i < links.length; i++) {
    if (links[i].className == 'selected') {
      previous = links[i - 1] || links[links.length - 1];
      current = links[i];
      next = links[i + 1] || links[0];
    }
  }

  if (dir == DIRECTION_UP && current !== null && previous !== null) {
    current.className = '';
    previous.className = 'selected';

    delayedSetLink(decodeURIComponent(previous.href), 100);
  }
  else if (dir == DIRECTION_DOWN && current !== null && next !== null) {
    current.className = '';
    next.className = 'selected';

    delayedSetLink(decodeURIComponent(next.href), 100);
  }
}

function showRecentSearches(data) {
  var div = dom.queryOne('#suggest');

  div.innerHTML = lang.format('<div class=\"recent\">{0}</div>{1}<hr /><a href=\"spotify:internal:clear-recent-searches\">{2}</a>',
      _('sDropdownRecentSearches'), map(function(query) {
        return lang.format('<a href=\"spotify:search:{0}\">{0}</a>', query);
      }, filter(function(query) { return query.length > 0; }, data)).join(''), _('sDropdownClearRecentSearches')
      );

  var links = dom.query('a');
  links.forEach(function(link, index) {
    if (index === 0) {
      link.className = 'selected';
    }

    link.addEventListener('click', function(e) {
      sp.desktop.dropdown.openLink(decodeURIComponent(link.href));
      // Prevent default link handling, so the browser doesn't try to navigate
      // to the URI, which will _break_ the search-dropdown. This is important!
      e.preventDefault();
    });
  });

  var selected = dom.queryOne('a.selected');
  sp.desktop.dropdown.setLink(decodeURIComponent(selected.href));
  sp.desktop.dropdown.show(div.offsetHeight);
}

function close() {
  dom.queryOne('#suggest').innerHTML = '';
  sp.desktop.dropdown.hide();
}

function AdaptiveThrottler(func, throttleTimeFunc) {
  this.toID = null;
  this.prevTs = null;
  this.f = func;
  this.tf = throttleTimeFunc;
  this.delayNext = false;
}

AdaptiveThrottler.prototype.call = function() {
  var self = this;
  var args = arguments;
  var ts = Date.now();
  var elapsed = ts - (this.prevTs || 0);

  if (self.delayNext) {
    //console.log("delaying..");
    elapsed = 0;
    self.delayNext = false;
  }

  var t = self.tf();
  var f = self.f;
  self.cancel();

  if (elapsed >= t) {
    //console.log("calling f directly");
    self.prevTs = ts;
    f.apply(f, args);
  }
  else {
    //console.log("calling f in " + (t - elapsed) + " ms");
    self.toID = setTimeout(function() {
      self.prevTs = ts;
      //console.log("calling f throttled");
      f.apply(f, args);
    }, t - elapsed);
  }
};

AdaptiveThrottler.prototype.cancel = function() {
  if (this.toID) {
    //console.log("cancel throttled call");
    clearTimeout(this.toID);
    this.toID = null;
  }
};

AdaptiveThrottler.prototype.delayNextCall = function() {
  this.delayNext = true;
};

function isAdvancedSearch(s) {
  var p = /:|(^|\s)[\+-]/g;
  return p.test(s);
}

function onText() {
  var throttler = new AdaptiveThrottler(autoComplete, autoCompleteHoldOff);
  return function(e) {
    //console.log("data: \"" + e.data + "\"")
    if (e.data.length === 0 || isAdvancedSearch(e.data)) {
      //console.log("cancel search");
      throttler.cancel(); // cancel delayed searches
      lastQuery.str = null; // make sure we throw away search responses
      close();
    } else {
      if (e.data.length == 1)
        sp.core.logClientEvent('', 'searchIntent', '1', '1', {});
      if (e.data.length < 3)
        throttler.delayNextCall();
      throttler.call(e.data.decodeForText());
    }
  };
}

// log all "commit" actions in the instant search dropdown
function onBrowseToLink() {
  return function(e) {
    var searchResult = false;
    if (paddedResults.indexOf(e.data.split('?')[0]) !== -1) {
      searchResult = true;
    }
    sp.core.logClientEvent('', 'onBrowseToLink', '3', testVersion, {
      'search_query': lastQuery.str,
      'uri': e.data,
      'padded-search-result': searchResult,
      'latest_search_time': searchTime
    });
  };
}

function loadRelations() {
  userCache = {};

  for (var i = 0; i < relations.length; i++) {
    var user = relations.getUserInfo(i);
    userCache[user.canonicalUsername] = user;
  }

  social.getSubscriptionUsernames(sp.core.user.canonicalUsername, {
    onSuccess: function(usernames) {
      social.getUsersBatch(usernames, {
        onSuccess: function(users) {
          for (var i = 0; i < users.length; i++) {
            userCache[users[i].canonicalUsername] = users[i];
          }
        }
      });
    }
  });
}

exports.init = function() {
  document.body.oncontextmenu = function() {
    return sp.core.isDebugMode;
  };

  var platform = window.navigator.platform;

  if (platform.match(/Win/)) {
    document.body.classList.add('windows');
  }
  else if (platform.match(/Mac/)) {
    document.body.classList.add('mac');
  }
  else if (platform.match(/Linux/) || platform.match(/X11/)) {
    document.body.classList.add('linux');
  }

  relations.addEventListener('load', loadRelations);
  relations.addEventListener('change', loadRelations);
  social.addEventListener('socialSubscribe', loadRelations);
  social.addEventListener('socialUnsubscribe', loadRelations);

  if (relations.loaded) {
    window.setTimeout(loadRelations, 0);
  }

  sp.desktop.dropdown.addEventListener('text', onText());
  sp.desktop.dropdown.addEventListener('recent', function(e) { showRecentSearches(e.data); });
  sp.desktop.dropdown.addEventListener('moveup', function(e) { moveSelection(DIRECTION_UP); });
  sp.desktop.dropdown.addEventListener('movedown', function(e) { moveSelection(DIRECTION_DOWN); });
  sp.desktop.dropdown.addEventListener('browsetolink', onBrowseToLink());

  // We use a global hover intent, so we can set a custom timer when the user actually doesn't
  // hover over a link anymore. If that timer fires, we select the last hovered link.
  var globalHoverTimer = -1;
  var clearGlobalHoverTimer = function() {
    if (globalHoverTimer != -1) {
      window.clearTimeout(globalHoverTimer);
      globalHoverTimer = -1;
    }
  }
  var setGlobalHoverTimer = function(callback) {
    clearGlobalHoverTimer();
    globalHoverTimer = window.setTimeout(callback, 100);
  }
  var onGlobalHoverTimer = function(element) {
    moveSelectionTo(element, true);
  };

  new GlobalHoverIntent({
    onMouseOver: function(element) {
      if (element && element.tagName == 'A') {
        clearGlobalHoverTimer();
        moveSelectionTo(element, false);
      }
    },
    onMouseOut: function(element) {
      if (element && element.tagName == 'A') {
        setGlobalHoverTimer(partial(onGlobalHoverTimer, element));
      }
    },
    onMouseHover: function(element) {
      if (element && element.tagName == 'A') {
        moveSelectionTo(element, true);
      }
    }
  });
};
