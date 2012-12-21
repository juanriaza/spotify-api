'use strict';

var sp = getSpotifyApi();

var dom = sp.require('$util/dom');
var lang = sp.require('$util/language');
var catalog = lang.loadCatalog('$resources/cef_views');
var ui = sp.require('$unstable/ui');
var _ = partial(lang.getString, catalog, 'Profile');

var MSGBAR_TYPES = {
  INFORMATION: 0,
  WARNING: 1,
  ERROR: 2,
  INFORMATION_HEART: 3
};

function TopList(opts) { /* user, callbacks, etc */
  var tl = this;
  tl.opts = {
    className: '',
    maxItems: 12
  };

  for (var prop in opts) {
    tl.opts[prop] = opts[prop];
  }
}

TopList.prototype.fetchList = function(callbacks) {
  var tl = this;

  var counter = 0;
  var toplistSelection = [
    {
      listtype: 'track',
      filter: 'user',
      user: '' //sp.core.user.canonicalUsername
    },
    {
      listtype: 'track',
      filter: 'everywhere',
      user: '' //sp.core.user.canonicalUsername
    }
  ];

  function buildList(result) {
    var items = [];
    var fragment = document.createDocumentFragment();
    var type = '';

    var list = new dom.Element('ul', {
      className: type
    });

    result.forEach(function(item, index, source) {
      var li = document.createElement('li');
      var anchor = document.createElement('a');
      var artistWrap = document.createElement('p');
      var anchorTitle = '';
      var artistArr = [];
      var imageNode = null;
      var name = item.name.decodeForText();
      var clonedAnchor;

      anchor.href = item.uri;
      anchor.textContent = name;

      clonedAnchor = anchor.cloneNode();
      clonedAnchor.className = 'cover';

      if (item.type != 'artist') {
        imageNode = fetchImageNode(item.album.cover, true);
      } else {
        imageNode = fetchImageNode(item.portrait, false);
        // add number instead for top artists
        dom.adopt(clonedAnchor, new dom.Element('span', {
          className: 'number',
          innerHTML: index + 1
        }));
      }
      dom.adopt(clonedAnchor, imageNode);
      dom.adopt(li, clonedAnchor);

      artistWrap.className = 'artist-wrap sp-text-truncate';
      if (item.type != 'artist') {
        item.artists.forEach(function(element, index, array) {
          var artistAnchor = document.createElement('a');
          var separator = document.createTextNode(', ');
          var name = element.name.decodeForText();

          artistAnchor.href = element.uri;
          artistAnchor.textContent = name;
          artistArr.push(name);
          if (index > 0) {
            dom.adopt(artistWrap, separator);
          }
          dom.adopt(artistWrap, artistAnchor);
        });
        dom.adopt(li, artistWrap);
        anchorTitle = name + ' ' + _('sProfileBy') + ' ' + artistArr.join(', ');
      } else {
        anchorTitle = name;
      }

      anchor.className = 'song-title sp-text-truncate';
      anchor.title = anchorTitle;
      clonedAnchor.title = anchorTitle;

      dom.adopt(li, anchor);
      dom.adopt(list, li);
    });
    dom.adopt(fragment, list);
    return fragment;
  }

  function fetchTopList(obj) {
    var test = sp.social.getToplist(obj.listtype, obj.filter, obj.user, {
      onSuccess: function(response) {
        var resultKey = obj.listtype + 's';
        var result = response[resultKey];

        if (result && result.length) {
          var items = result.slice(0, tl.opts.maxItems);
          tl.toplist = buildList(items);
          tl.listtype = obj.listtype;

          if (callbacks && 'function' === typeof callbacks.loadTemplateCb) {
            callbacks.loadTemplateCb(obj);
          }
          if (callbacks && 'function' === typeof callbacks.adoptToplistCb) {
            callbacks.adoptToplistCb();
          } else {
            dom.adopt(dom.queryOne('body'), tl.toplist);
          }
        } else {
          counter++;
          fetchTopList(toplistSelection[counter]);
        }
      },
      onFailure: function(error) {
        counter++;
        fetchTopList(toplistSelection[counter]);
      },
      onComplete: function() {
      }
    });
  }

  // If normal user, fetch top artists from user
  if (tl.opts.user.canonicalUsername) {
    toplistSelection.unshift({
      listtype: 'artist',
      filter: 'user',
      user: tl.opts.user.username
    });
  }
  fetchTopList(toplistSelection[counter]);
};

function fetchImageNode(_image, bAddButton) {
  var fragment = document.createDocumentFragment();
  var coverImg = new ui.SPImage(_image);

  var aligner = new dom.Element('div', {
    className: 'bottom-align centered'
  });
  var button = new dom.Element('button', {
    className: 'sp-button sp-text-truncate toplist-share',
    type: 'button'
  });
  var content = document.createTextNode(_('sProfileSendTrack'));

  dom.adopt(fragment, coverImg.node);

  if (bAddButton) {
    dom.adopt(button, content);
    dom.adopt(aligner, button);
    dom.adopt(fragment, aligner);
  }
  return fragment;
}

exports.TopList = TopList;
