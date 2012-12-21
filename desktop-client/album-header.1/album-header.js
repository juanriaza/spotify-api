/**
 * @module Album Header
 * @author Felix Bruns <felixbruns@spotify.com>
 */

'use strict';

sp = sp || getSpotifyApi();

var l = sp.require('$util/language'),
    _ = partial(l.getString, l.loadCatalog('$resources/cef_views'), 'album-header'),
    m = sp.require('$api/models'),
    v = sp.require('$api/views'),
    logger = sp.require('$util/logger'),
    loghelper = sp.require('loghelper'),
    fakesearch = sp.require('fakesearch'),
    react = sp.require('$util/react'),
    filesystem = sp.require('$util/fs');

var showAppLinks = false;
var testVersion = 'A';
var testGroup = sp.core.getAbTestGroupForTest('platform-web');
if (testGroup < 10) {
  showAppLinks = true;
  testVersion = 'B';
  loghelper.testVersion = testVersion;
}

react.fromDOMEvent(sp.core, 'argumentsChanged').subscribe(function() {
  exports.init();
});

var fs = new fakesearch.FakeSearch();

function $(id) {
  return document.getElementById(id);
}

function unique(func, arr) {
  var uniq = [], i, j;

  loop: for (i = 0; i < arr.length; i++) {
    for (j = 0; j < uniq.length; j++) {
      if (func(uniq[j], arr[i])) {
        continue loop;
      }
    }
    uniq.push(arr[i]);
  }

  return uniq;
}

function findPosition(el) {
  var left = 0, top = 0;

  while (el) {
    left += el.offsetLeft;
    top += el.offsetTop;
    el = el.offsetParent;
  }

  return { left: left, top: top };
}

function AlbumHeader(uri) {
  var _self = this;
  var _album = null;
  var _albums = null;
  var _totalAlbums = -1;

  fs.startEventListener();

  loghelper.testVersion = testVersion;
  loghelper.startEventListener();

  var _onAlbumMetadata = function(album) {
    _album = album;

    // This code is disabled until we have the better metadata service.
    // Currently it is too slow for huge artists like Elvis.
    //if (_album.artist.uri && _album.artist.uri.length > 0) {
    //  sp.core.browseArtistEx(_album.artist.uri, 1, { onSuccess: _onArtistMetadata });
    //}
    //else {
    $('meta').style.width = '100%';
    //}

    var image = new v.Image(_album.image ? _album.image : 'sp://resources/img/placeholders/128-album.png', _album.uri);
    image.node.classList.add('image');
    $('cover').appendChild(image.node);

    $('meta-title').innerHTML = '<a href="' + _album.uri + '">' + _album.name.decodeForHTML() + '</a><span>(' + _album.year + ')</span>';

    if (_isVariousArtists(_album.artist.name)) {
      $('meta-details').textContent = l.format(_('sAlbumBy'), _album.artist.name.decodeForText());
    }
    else {
      $('meta-details').innerHTML = l.format(_('sAlbumBy'), '<a href="' + _album.artist.uri + '">' + _album.artist.name.decodeForHTML() + '</a>');
    }

    // Share button
    var shareButton = $('button-share');

    shareButton.innerHTML = '<span class="sp-share"></span>' + _('sShare');
    shareButton.style.display = 'inline';
    shareButton.addEventListener('click', _onClickShare);

    // Radio button
    var shareButton = $('button-radio');

    shareButton.innerHTML = '<span class="sp-radio"></span>' + _('sStartAlbumRadio');
    shareButton.style.display = 'inline';
    shareButton.addEventListener('click', _onClickRadio);

    // Buy button
    if (sp.core.getShowPurchaseButtons() && sp.core.buyAlbum(_album.uri, false)) {
      var buyButton = $('button-buy');

      buyButton.innerHTML = '<span class="sp-get"></span>' + _('sGetAlbum');
      buyButton.style.display = 'inline';
      buyButton.addEventListener('click', _onClickBuy);
    }

    if (showAppLinks) {
      fs.query(_album.uri, function(hits) {
        console.log('got album hits', hits);

        loghelper.log('baseline', 'pageview', '1', {
          query: _album.uri,
          numapps: hits.length
        });

        var el = $('meta-fakesearch');
        el.setAttribute('data-logcontext', 'apps');

        if (hits.length > 0) {
          var sp = document.createElement('span');
          sp.innerHTML = 'Apps: ';
          el.appendChild(sp);

        }


        for (var k = 0; k < hits.length; k++) {
          (function() {
            var hit = hits[k];
            console.log(hit);
            var b = document.createElement('a');
            b.className = 'a';
            b.style.cursor = 'pointer';
            b.setAttribute('data-logevent', 'click');
            b.setAttribute('data-logargs', JSON.stringify({album: _album.uri, hit: hit.id, uri: hit.link}));
            if (hit.play)
              b.setAttribute('data-play', hit.play);
            b.setAttribute('href', hit.link);

            if (hit.appicon) {
              var im = document.createElement('div');
              im.style.backgroundImage = 'url(\"' + hit.appicon + '\")';
              im.style.display = 'inline-block';
              im.style.marginTop = '4px';
              im.style.marginBottom = '-4px';
              im.style.marginRight = '3px';
              im.style.width = '18px';
              im.style.height = '18px';
              b.appendChild(im);
            }

            var t = document.createTextNode('' + hit.title);
            b.appendChild(t);
            el.appendChild(b);

            var sp = document.createTextNode(' ');
            el.appendChild(sp);
          })();
        }
      });
    }
  };

  var _isVariousArtists = function(name) {
    return name.decodeForText() == 'Various Artists' || name.decodeForText() == 'Various';
  };

  var _cleanup = function(s) {
    return s.decodeForText().toLowerCase().replace(/[^A-Za-z0-9\s]/g, '');
  };

  var _compare = function(a, b) {
    return _cleanup(a) === _cleanup(b);
  };

  var _onArtistMetadata = function(artist) {
    _albums = filter(function(a) { return _compare(a.artist.name, _album.artist.name) && !_compare(a.name, _album.name) &&
          a.type != 'compilation' && a.availableForPlayback; }, artist.albums);
    _albums = unique(function(a, b) { return _compare(a.name, b.name); }, _albums);
    _albums = _albums.sort(function(a, b) {
      if (a.type != 'album' && b.type == 'album') return 1;
      if (a.type == 'album' && b.type != 'album') return -1;
      return b.year - a.year;
    });

    if (_albums.length > 0) {
      _layoutAlbums();
    }
    else {
      $('meta').style.width = '100%';
    }
  };

  var _onClickArtist = function(e) {
    document.location.href = _album.artist.uri;
  };

  var _onClickShare = function(e) {
    var el = e.target, pos = findPosition(el);
    sp.social.showSharePopup(Math.floor(pos.left + el.offsetWidth / 2), Math.floor(pos.top + el.offsetHeight / 2), _album.uri);
  };

  var _onClickRadio = function(e) {
    var radioUri = _album.uri.replace(/^spotify/, 'spotify:radio');
    document.location.href = radioUri;
  };

  var _onClickBuy = function(e) {
    sp.core.buyAlbum(uri, true);
  };

  var _layoutAlbums = function() {
    var albumsEl = $('more-albums');
    var titleEl = $('more-title');
    var seeAllEl = $('button-see-all');

    titleEl.innerHTML = l.format(_('sMoreBy'), '<a href="' + _album.artist.uri + '">' + _album.artist.name.decodeForHTML() + '</a>');
    seeAllEl.textContent = _('sSeeAll');
    seeAllEl.addEventListener('click', _onClickArtist);

    _albums.slice(0, 7).forEach(function(album) {
      var listEl = document.createElement('li');
      var imageEl = new v.Image(album.cover, album.uri).node;

      imageEl.classList.add('image');
      listEl.appendChild(imageEl);
      albumsEl.appendChild(listEl);

      new Tooltip(imageEl, l.truncate(album.name.decodeForHTML(), 30) + ' <span>(' + album.year + ')</span>');
    });

    $('more').style.display = 'block';
  };

  this.init = function() {
    m.Album.fromURI(uri, _onAlbumMetadata);
  };
}

function Tooltip(elem, html) {
  var _elem = elem;
  var _node = document.createElement('span');

  var _show = function(e) {
    var x = _elem.offsetLeft + _elem.offsetWidth / 2 - _node.offsetWidth / 2;
    var y = _elem.offsetTop + _elem.offsetHeight + 5;

    _node.style.left = x + 'px';
    _node.style.top = y + 'px';
    _node.classList.add('sp-tooltip-show');
  };

  var _hide = function(e) {
    _node.style.top = '-1000px';
    _node.classList.remove('sp-tooltip-show');
  };

  _elem.addEventListener('mouseover', _show);
  _elem.addEventListener('mouseout', _hide);

  _node.innerHTML = html;
  _node.classList.add('sp-tooltip');
  document.body.appendChild(_node);

  this.show = _show;
  this.hide = _hide;
}

exports.init = function() {
  var layout = filesystem.readFile('layout.html');
  $('wrapper').innerHTML = layout;
  var uri = sp.core.getArguments().join(':');
  if (!uri) {
    uri = 'spotify:album:3FSiWiPJxoz7L6tLmrwYYy';//'spotify:album:62V7taC1KNGRBwtqNyklJ0';
  }
  var albumHeader = new AlbumHeader(uri);
  albumHeader.init();
};
