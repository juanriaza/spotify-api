'use strict';

sp = getSpotifyApi();

var dom = sp.require('$util/dom');
var ui = sp.require('$unstable/ui');
var util = sp.require('$util/util');
var r = sp.require('$util/react');
var fx = sp.require('$util/fx');
var fs = sp.require('$util/fs');
var hermes = sp.require('$unstable/hermes');
var popover = sp.require('$unstable/popover');
var lang = sp.require('$util/language');
var catalog = lang.loadCatalog('$resources/cef_views');
var _ = partial(lang.getString, catalog, 'Profile');
var _g = partial(lang.getString, catalog, 'Generic');
var token = sp.require('scripts/token');
var toplist = sp.require('scripts/toplist');
var staticdata = sp.require('$unstable/staticdata');
var tokenInput = new token.TokenInput('uris');
var favorites = sp.require('$unstable/favorites');
var models = sp.require('$api/models');

var MSGBAR_TYPES = {
  INFORMATION: 0,
  WARNING: 1,
  ERROR: 2,
  INFORMATION_HEART: 3
};

var windowLoad = r.fromDOMEvent(window, 'load');
var argsChanged = r.fromDOMEvent(sp.core, 'argumentsChanged');
var login = r.fromDOMEvent(sp.core, 'login');
var logout = r.fromDOMEvent(sp.core, 'logout').subscribe(userIsOffline);

var t = 0;

var isFacebookProfile = false;

var relations = sp.social.relations;

function _updateFavoriteButton(button) {
  var user = button.user;
  button.textContent = favorites.isFavoriteUser(user.uri) ? _('sProfileRemoveFavorite') : _('sProfileAddFavorite');
}

function _toggleFavoriteState(user) {
  var uri = user.uri;
  if (favorites.isFavoriteUser(uri)) {
    favorites.removeFavoriteUser(uri);
  } else {
    favorites.addFavoriteUser(uri);
  }
}

function _isFriend(person) {
  var match = filter(function(knownFriend) {
    return person.uri === knownFriend;
  }, relations.all());

  return 0 !== match.length;
}

function fillActivityWithState(state) {
  hermes.stringFromPresenceState(state, function(s) {
    dom.queryOne('.activity').innerHTML = s;
  });
}

function userIsOffline() {
  var body = document.querySelector('body');
  var template = document.createDocumentFragment();
  var offlineOverlay = new dom.Element('div', {className: 'overlay'});

  body.className = 'offline';
  template.textContent = fs.readFile('../templates/offline.html');
  body.innerHTML = lang.format(template.textContent, _('sProfileUserOffline'));
}

function getNamedArgument(name) {
  var args = sp.core.getArguments();
  if (args.length < 2) return null;
  if (args[0] != name) return null;
  return args[1].decodeForText();
}

var resize = r.fromDOMEvent(window, 'resize');
function restyleList(e) {
  var targetWrapper = dom.queryOne('.list-wrapper ul'),
      listItems = dom.query('li', targetWrapper),
      list = [],
      minMarginLeft = 10,
      minWidth = 128,
      visibleWidth = targetWrapper.clientWidth,
      columns = Math.floor((visibleWidth + minMarginLeft) / (minWidth + minMarginLeft)),
      marginLeft = Math.floor((visibleWidth - (columns * minWidth)) / (columns - 1));

  var items = listItems.slice(0, columns);
  listItems.forEach(function(elem, index, arr) {
    elem.style.opacity = 0;
  });

  items.forEach(function(elem, index, arr) {
    if (e && 'resize' == e.type) {
      elem.style.webkitTransitionProperty = 'margin-left, opacity';
    }
    elem.style.opacity = 1;
    if (index > 0) {
      if (marginLeft >= minMarginLeft) {
        elem.style.marginLeft = marginLeft + 'px';
      }
    }
  });
}

function isVisible(obj) {
  if (obj == document) return true;

  if (!obj) return false;
  if (!obj.parentNode) return false;
  if (obj.style) {
    if (obj.style.display == 'none') return false;
    if (obj.style.visibility == 'hidden') return false;
  }

  //Try the computed style in a standard way
  if (window.getComputedStyle) {
    var style = window.getComputedStyle(obj, '');
    if (style.display == 'none') return false;
    if (style.visibility == 'hidden') return false;
  }

  return isVisible(obj.parentNode);
}

/**
 * initialize profile page
 * @param {User} user The current user viewing.
 * @param {boolean} isSelf Is it sp.core.user.
 */
function init(user, isSelf) {
  var profilePic = new ui.SPImage(user.picture);
  var tl = new toplist.TopList({
    maxItems: 15,
    user: user
  });
  var headerAnchor = dom.queryOne('h1 a');
  var form = dom.queryOne('form');
  var searchInput = tokenInput.input;
  var outputElement = tokenInput.output;
  var messageElement = tokenInput.message;
  var added = false;
  var createButton = function() {
    if (!isSelf && _isFriend(user) && !added) {
      var favoriteButton = document.createElement('button');
      var buttonWrapper = document.createElement('span');
      favoriteButton.user = user;

      favoriteButton.classList.add('sp-button');
      favoriteButton.textContent = favorites.isFavoriteUser(user.uri) ? _('sProfileRemoveFavorite') : _('sProfileAddFavorite');

      buttonWrapper.appendChild(favoriteButton);

      dom.queryOne(isFacebookProfile ? '.picture' : '.profile h1').appendChild(buttonWrapper);

      r.fromDOMEvent(favoriteButton, 'click').subscribe(function(e) {
        _toggleFavoriteState(user);
      });
      r.fromDOMEvent(favorites, favorites.FAVORITES_CHANGED_EVENT).subscribe(function(e) {
        _updateFavoriteButton(favoriteButton);
      });

      added = true;
    }
  };

  r.fromDOMEvent(headerAnchor, 'click').subscribe(function(e) {
    e.preventDefault();
  });

  r.fromDOMEvent(relations, 'change').subscribe(createButton);

  dom.adopt(dom.queryOne('.picture'), profilePic.node);
  dom.adopt(dom.queryOne('form li'), tokenInput.node);
  dom.adopt(dom.queryOne('form li:nth-child(2)'), tokenInput.messageNode);

  createButton();
  if (user.hideSendTracks) {
    sp.core._set_body_size(0, 150, true);
  } else {
    tl.fetchList({
      loadTemplateCb: function(obj) {
        var body = dom.queryOne('body');
        var template = fs.readFile('../templates/list.html');
        var fragment = document.createDocumentFragment();
        var div = document.createElement('div');
        var replacements = [
          'top-' + (isFacebookProfile ? 'facebook' : '{0}'),
          ('artist' === obj.listtype ? _('sProfileTopArtists') : lang.format(_('sProfileSendTopTracks'), user.name.decodeForText()))
        ];

        replacements[0] = lang.format(replacements[0], obj.listtype);
        div.innerHTML = lang.format(template, replacements);
        dom.adopt(dom.queryOne('.list-wrapper', div), tl.toplist);

        fragment.appendChild(div.childNodes[0]);
        tl.toplist = fragment;

        body.classList.add(obj.listtype);
        dom.queryOne('section .loader', tl.toplist)
          .parentNode
          .removeChild(dom.queryOne('section .loader', tl.toplist));

        if ('artist' !== obj.listtype || isFacebookProfile) {
          var aligner = new dom.Element('div', {
            className: 'centered',
            id: 'search-button-wrapper'
          });
          var searchButton = new dom.Element('button', {
            className: 'sp-button sp-flat',
            id: 'search-button',
            type: 'button'
          });
          var fadeOutAnimationOptions = {
            opacity: 0
          };
          var fadeInAnimationOptions = {
            opacity: 1
          };
          searchButton.appendChild(document.createTextNode(_('sProfileSearchLabel')));
          r.fromDOMEvent(searchButton, 'click').subscribe(function(e) {
            e.preventDefault();
            e.stopPropagation();
            var form = dom.queryOne('form');
            var formAnim = new fx.Animation(form);
            var listSection = dom.queryOne('.list-section');
            var listAnim = new fx.Animation(listSection);
            if (isVisible(form)) {
              formAnim.animate(fadeOutAnimationOptions).then(function() {
                form.style.display = 'none';
                listSection.style.display = 'block';
                dom.queryOne('#search-button').textContent = _('sProfileSearchLabel');
                listAnim.animate(fadeInAnimationOptions).then(function() {
                  if (!isFacebookProfile) {
                    restyleList();
                  }
                });
              });
            } else {
              popover.hidePopover();
              listAnim.animate(fadeOutAnimationOptions).then(function() {
                listSection.style.display = 'none';
                form.style.display = 'block';
                dom.queryOne('#search-button').textContent = _('sProfilePickSomethingLabel');
                formAnim.animate(fadeInAnimationOptions);
              });
            }
          });
          dom.adopt(aligner, searchButton);
          dom.adopt(tl.toplist, aligner);
          dom.query('.toplist-share', tl.toplist).forEach(function(elem, index, source) {
            r.fromDOMEvent(elem, 'click').subscribe(function(e) {
              e.preventDefault();
              e.stopPropagation();
              popover.sharePopup(tl.opts.user,
                  elem.parentNode.parentNode.href,
                  elem.parentNode,
                  {
                    relativeNode: dom.queryOne('.list-section'),
                    offsetLeft: 30,
                    offsetFlippedLeft: 60
                  });
            });
          });
        }
      },
      adoptToplistCb: function() {
        if ('track' === tl.listtype && !isFacebookProfile) {
          dom.adopt(dom.queryOne('.profile'), tl.toplist);
        } else {
          dom.adopt(dom.queryOne('body'), tl.toplist);
        }
        if (!isFacebookProfile) {
          resize.subscribe(util.debounce(restyleList, 500));
          restyleList();
        }
      }
    });
  }

  r.fromDOMEvent(form, 'submit').subscribe(function(e) {
    var tokens = tokenInput.getValues();
    var message = e.target.message.value;
    var failure = 0;
    var showSendingTracksOverlay = function() {
      var container = dom.queryOne('.send-tunes-container');
      var fragment = document.createDocumentFragment();
      var div = new dom.Element('div', {
        className: 'send-music'
      });
      var innerDiv = document.createElement('div');
      innerDiv.innerHTML = lang.format('<img src="sp://resources/img/sent-icon.png" /><span>{0}</span>', _('sProfileMusicSent'));
      dom.adopt(div, innerDiv);
      dom.adopt(fragment, div);
      dom.adopt(container, fragment);
      r.fromDOMEvent(div, 'webkitAnimationEnd').subscribe(function(e) {
        var parent = e.target.parentNode;
        parent.removeChild(e.target);
      });
    };
    var onFailureCb = partial(sp.core.showClientMessage, MSGBAR_TYPES.ERROR, _g('sGenericSendMessageError'));
    var onCompleteCb = function() {
      if (null !== user.facebookUid && 2 === failure || null === user.facebookUid && 1 === failure) {
        onFailureCb();
      }
    };

    showSendingTracksOverlay();

    e.preventDefault();

    // Send to Spotify Inbox, now with callbacks
    if (user.canonicalUsername) {
      sp.social.sendToInbox(user.canonicalUsername.decodeForText(),
          message,
          tokens,
          {
            onSuccess: function() {
            },
            onFailure: function() {
              failure++;
            },
            onComplete: onCompleteCb
          }
      );
    }

    // Send to Facebook, if available
    if (null !== user.facebookUid) {
      var postObj = {
        fb_uid: [user.facebookUid.decodeForText()],
        message: message,
        spotify_uri: map(sp.core.spotifyUriToHttpLink, tokens)
      };

      sp.core.getHermes('POST', 'hm://social/post_to_facebook',
          [
           ['FacebookMessagePost', postObj]
          ],
          {
            onSuccess: function() {
            },
            onFailure: function() {
              failure++;
            },
            onComplete: onCompleteCb
          }
      );
    }

    e.target.reset();
    tokenInput.clear();
    e.target.classList.add('success');
    var unused = e.target.offsetWidth;
    e.target.classList.remove('success');
  });
}

function initialize(data, isSelf) {
  var template = document.createDocumentFragment();
  var body = dom.queryOne('body');

  if (data) {
    body.className = '';
    if (isFacebookProfile)
      body.className = 'facebook';

    template.textContent = fs.readFile('../templates/header.html');

    //Dancing around this being read-only.
    var staticData = staticdata.getInterestingPeople(data.canonicalUsername);
    var finalData = {};
    if (staticData) {
      for (var dataAttr in data) {
        finalData[dataAttr] = data[dataAttr];
      }
      for (var staticAttr in staticData) {
        finalData[staticAttr] = staticData[staticAttr];
      }
      finalData.hideSendTracks = true;
    }
    else {
      finalData = data;
    }

    body.innerHTML = lang.format(template.textContent, finalData.uri, finalData.name.decodeForText(), ' ',
        lang.format(_('sProfileSendTopTracks'), finalData.name.decodeForText()),
        _('sProfileMessage'), _('sProfileSend'));

    init(finalData, isSelf);
  } else {
    template.textContent = fs.readFile('../templates/error.html');
    body.innerHTML = lang.format(template.textContent, _('sProfileUnknownUser'), ' ');
  }
}

function loadUser() {
  // spotify:app:profile:user:parbo
  // spotify:app:profile:user:pannpann
  // spotify:app:profile:facebook:1362172452
  var username = getNamedArgument('user');
  var facebook = getNamedArgument('facebook');
  var callbacks = {
    onSuccess: function(user) {
      initialize(user, false);
    },
    onFailure: function(errorCode) {
      sp.core.showClientMessage(MSGBAR_TYPES.ERROR, _('sProfileLoadUserError'));

      var template = document.createDocumentFragment();
      var body = dom.queryOne('body');
      template.textContent = fs.readFile('../templates/error.html');
      body.innerHTML = lang.format(template.textContent, _('sProfileUnknownUser'), ' ');
    },
    onComplete: id
  };

  if (sp.core.getLoginMode() == 1) {
    if (username) {
      isFacebookProfile = false;
      sp.social.getUserByUsername(username, callbacks);
    } else if (facebook) {
      isFacebookProfile = true;
      sp.social.getUserByFacebookUid(facebook, callbacks);
    } else {
      isFacebookProfile = false;
      initialize(models.session.user, true);
    }
  } else {
    userIsOffline();
  }
}

r.merge(login, r.merge(windowLoad, argsChanged)).subscribe(loadUser);
