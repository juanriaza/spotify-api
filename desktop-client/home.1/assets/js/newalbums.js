'use strict';

var dom = sp.require('$util/dom'),
    array = sp.require('$util/array'),
    cf = sp.require('$unstable/coverflow'),
    m = sp.require('$api/models'),
    v = sp.require('$api/views'),
    logger = sp.require('$util/logger'),
    wnData = sp.require('assets/js/data');

var loadingEl = dom.queryOne('.loading');

var loggingVersion;
var testVersion;

/**
 *
 */
var NewAlbums = {

  _key: 'NewAlbums',
  _loaded: false,
  _loadEvent: null,
  // Hotfix for Kate Perry redirect album filtering
  blacklist: {
    'spotify:album:2qP7ZkAQ57K5vereZQKybT' : true,
    'spotify:album:7tQkAAHb5EyWTM73Ljopr0' : true,
    // filter out nswf type albums
    'spotify:album:1o2yY3Qx0zQ4BLqZ8mc6KH' : true
  },
  stepCallback: function() {},
  heading: '',

  /**
   * @constructor
   * @this NewAlbums
   * @param {object} data the data to be used in the object.
   */
  init: function(data) {
    loggingVersion = this.loggingVersion;
    testVersion = this.testVersion;
    this._loadEvent = new dom.Event(this._key + '.load', true);
    if (!data || !data.albums) {
      data = {albums: []};
    }
    this.data = data;
    this.padAlbums = [];
    this.pad();
  },

  setHeading: function(heading) {
    this.heading = heading;
  },

  setStepCallback: function(fn) {
    this.stepCallback = fn;
  },

  /**
   * @this NewAlbums
   * Pads the album data with country toplist albums
   */
  pad: function() {
    var self = this;
    sp.social.getToplist('album',
        sp.core.country, sp.core.user.canonicalUsername, {
          onSuccess: function(result) {
            if (result.albums && result.albums.length) {
              for (var i = 0; i < 50; i++) {
                var tmp = {};
                tmp['album_uri'] = result.albums[i].uri;
                tmp.isRecommended = false;
                self.data.albums.push(tmp);
              }
            }
            self.extend(self.data.albums);
          },
          onFailure: function() {
            self._loaded = true;
            self._loadEvent.dispatch(window);
          }
        });
  },

  /**
   * Extend data received from discovery
   * @this NewAlbums
   * @param {object} the data to be extended.
   */
  extend: function(data) {
    var self = this, uris = [], recommendedUris = {};

    var today = new Date();
    var pushed_albums = [{
      end: new Date(2013, 0, 27),
      group: sp.core.getAbTestGroupForTest('push.test-3'),
      id: 'spotify:album:3MZ5hMy89OUFVvonMKkXEV',
      start: new Date(2012, 10, 13)
    }, {
      end: new Date(2012, 11, 27),
      group: sp.core.getAbTestGroupForTest('push.test-2'),
      id: 'spotify:album:5SVTRyWHWnM8d1VaJYLffG',
      start: new Date(2012, 10, 13)
    }, {
      end: new Date(2012, 11, 12),
      group: sp.core.getAbTestGroupForTest('push.test-1'),
      id: 'spotify:album:5ZAKzV4ZIa5Gt7z29OYHv0',
      start: new Date(2012, 10, 13)
    }];

    // Add pushed albums
    for (var i = 0; i < pushed_albums.length; i++) {
      if (pushed_albums[i]['start'] < today &&
          pushed_albums[i]['end'] > today &&
          pushed_albums[i]['group'] < 400) {
        uris.unshift(pushed_albums[i]['id']);
        recommendedUris[pushed_albums[i]['id']] = true;
      }
    }

    for (var j = 0, l = data.length; j < l; j++) {
      if (!self.blacklist[data[j]['album_uri']]) {
        if (data.isRecommended !== false)
          recommendedUris[data[j]['album_uri']] = true;
        else
          recommendedUris[data[j]['album_uri']] = false;

        uris.push(data[j]['album_uri']);
      }
    }

    var count = 0;
    var recommendedCount = 0;
    var toplistCount = 0;

    if (!uris.length) {
      this._loaded = true;
      this._loadEvent.dispatch(window);
      return;
    }

    sp.core.getMetadata(uris, {
      onSuccess: function(md) {
        var filteredMetadata = [], artists = [];

        for (var i = 0; i < md.length; i++) {
          var d = md[i];
          if (d === null)
            continue;

          // Make sure we only include unique artists and available albums
          if (d.artist.name !== 'Various Artists' &&
              artists.indexOf(d.artist.name) === -1 &&
              d.availableForPlayback) {

            // Why is availableForPlayback sometimes false, even though it's available?

            // Unless push remove duplicate artists.
            if (d.artist.name.toUpperCase() !== 'CAZZETTE')
              artists.push(d.artist.name);

            // Clone and delete album tracks array
            var clonedAlbum = clone(d);
            clonedAlbum.tracks = [];
            filteredMetadata.push(clonedAlbum);

            if (count == 4) {
              break;
            }
            count++;
          }
        }

        if (!recommendedUris[filteredMetadata[2].uri]) {
          for (var k = 0; k < filteredMetadata.length; k++) {
            if (recommendedUris[filteredMetadata[k].uri]) {

              var tempK = filteredMetadata[k];
              var temp = filteredMetadata[2];
              filteredMetadata[2] = tempK;
              filteredMetadata[k] = temp;
              break;
            }
          }
        }

        wnData.Data.set(self._key, filteredMetadata);
        self._loaded = true;
        self._loadEvent.dispatch(window);
      },
      onFailure: function() {
        self._loaded = true;
        self._loadEvent.dispatch(window);
      }
    });
  },

  /**
   * @this NewAlbums
   * Calls the build method if it's loaded, otherwise creates an
   * event listener for it
   */
  next: function() {
    if (this._loaded) {
      this.build();
    } else {
      dom.listen(window, this._key + '.load', this.build.bind(this));
    }
  },

  /**
   * @this NewAlbums
   * Builds the UI and calls the stepper function if it was successful
   */
  build: function() {
    var self = this;

    if (!wnData.Data.has(this._key)) {
      self.stepCallback(false);
      return;
    }
    if (loadingEl) {
      dom.destroy(loadingEl);
    }
    var coverflow = new cf.Coverflow(this, {
      itemCount: 5,
      context: 'newAlbums'
    });
    dom.inject(coverflow.node, dom.id('NewAlbums'));
    if (dom.id('Banners') !== null) {
      dom.id('Banners').classList.remove('hidden');

      var h2 = new dom.Element('h2');
      h2.innerHTML = self.heading;
      dom.id('NewAlbums').insertBefore(h2, dom.id('NewAlbums').firstChild);
    }
    self.stepCallback(true);
  },

  /**
   * @this NewAlbums
   * @return {number} The number of albums.
   */
  count: function() {
    return wnData.Data.get(this._key).length;
  },

  /**
   * @this NewAlbums
   * @param {number} index The index for the node that will be created.
   * @return {element} The node.
   */
  makeNode: function(index) {
    var data = wnData.Data.get(this._key)[index],
        li = new dom.Element('li'),
        badge = new dom.Element('div', {
          className: 'badge',
          textContent: (data.isRecommended ? this.labels.sRecommended : this.labels.sTopList)
        }),
        md = new dom.Element('div', {
          className: 'metadata'
        }),
        album = new dom.Element('a', {
          className: 'album',
          href: data.uri,
          html: data.name
        }),
        artist = new dom.Element('a', {
          className: 'artist',
          href: data.artist.uri,
          html: data.artist.name
        });


    dom.listen(album, 'click', function(e) {
      logger.logClientEvent('newAlbums',
          'browsed album',
          loggingVersion,
          testVersion,
          {'uri': data.uri});
    });
    dom.listen(artist, 'click', function(e) {
      logger.logClientEvent('newAlbums',
          'browsed artist',
          loggingVersion,
          testVersion,
          {'uri': data.artist.uri});
    });

    m.Album.fromURI(data.uri, function(context) {
      var player = new v.Player();
      player.context = context;
      var playerbutton = player.node.querySelector('button');
      var oldchild = player.node.removeChild(playerbutton);
      dom.adopt(md, oldchild, album, document.createElement('br'), artist);
      dom.adopt(player.node, badge, md);
      dom.adopt(li, player.node);

      // Logging
      dom.listen(dom.queryOne('.sp-image', li), 'click', function(e) {
        var eventType = 'browsed album';
        if (li.dataset['offset'] !== 0) {
          eventType = 'browsing coverflow';
        }
        logger.logClientEvent('newAlbums',
            eventType,
            loggingVersion,
            testVersion,
            {'uri': e.target.href});
      });
      dom.listen(dom.queryOne('.sp-player-button', li), 'click', function(e) {
        logger.logClientEvent('newAlbums',
            'play',
            loggingVersion,
            testVersion,
            {'uri': data.uri});
      });
    });

    return li;
  }
};

/**
 * @param {object} obj The object to clone.
 * @return {object} the cloned object.
 */
function clone(obj) {
  if (null === obj || 'object' != typeof obj) {
    return obj;
  }
  else if (obj instanceof Array) {
    var copy = [];
    for (var i = 0; i < obj.length; i++) {
      copy[i] = clone(obj[i]);
    }
    return copy;
  }
  else if (obj instanceof Object) {
    var copy = {};
    for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) {
        copy[attr] = clone(obj[attr]);
      }
    }
    return copy;
  }
  else {
    console.log('Unable to clone object of type', typeof obj);
    return obj;
  }
}

exports.NewAlbums = NewAlbums;
