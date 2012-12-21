'use strict';

var dom = sp.require('$util/dom'),
    array = sp.require('$util/array'),
    p = sp.require('$unstable/pager'),
    m = sp.require('$api/models'),
    v = sp.require('$api/views'),
    logger = sp.require('$util/logger'),
    wnData = sp.require('assets/js/data');

var loadingEl = dom.queryOne('.loading');

var loggingVersion;
var testVersion;

var NewReleases = {
  _key: 'NewReleases',
  _loaded: false,
  _loadEvent: null,
  stepCallback: function() {},
  headings: null,
  currentLayout: null,

  /**
   * @constructor
   * @this NewReleases
   */
  init: function() {
    this.failureTimeout = this.failureTimeout || 5000;

    this._loadEvent = new dom.Event(this._key + '.load', true);

    loggingVersion = this.loggingVersion;
    testVersion = this.testVersion;

    var self = this, artists = [], albums = [];

    var useCache = setTimeout(function() {
      self.triggerFailure('Search');
    }, this.failureTimeout);

    sp.core.search('tag:new', {
      onSuccess: function(result) {
        clearTimeout(useCache);
        // Make sure artists are unique
        result.albums.forEach(function(album) {
          if (album.artist.name !== 'Various Artists' &&
              artists.indexOf(album.artist.name) === -1) {
            artists.push(album.artist.name);
            albums.push(album);
          }
        });
        array.shuffle(albums);

        wnData.Data.set(self._key, albums);
        self._loaded = true;
        self._loadEvent.dispatch(window);
      },
      onFailure: function() {
        self.triggerFailure('Search');
        self._loaded = true;
        self._loadEvent.dispatch(window);
        // step(false);
      }
    });
  },

  setTriggerTimeout: function(ms) {
    this.failureTimeout = ms;
  },

  setCurrentLayout: function(currentLayout) {
    this.currentLayout = currentLayout;
  },

  setHeadings: function(headings) {
    this.headings = headings;
  },

  setStepCallback: function(fn) {
    this.stepCallback = fn;
  },

  /**
   * @this NewReleases
   * Calls the build method if it's loaded, otherwise create an
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
   * @this NewReleases
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

    var wrapper = dom.id(this._key), perPage = 10;

    switch (this.currentLayout) {
      case 1: perPage = 10; break;
      case 2: perPage = 8; break;
      case 3: perPage = 6; break;
    }

    var pager = new p.Pager(new NewReleasesDataSource(), {
      perPage: perPage,
      hidePartials: true,
      pagingLocation: 'top',
      bullets: false,
      context: 'newReleases'
    });
    pager.h2.innerHTML = self.headings[this._key];

    dom.adopt(wrapper, pager.node);

    dom.listen(window, 'layout.switch', function() {
      var perPage = null;
      switch (self.currentLayout) {
        case 1: perPage = 10; break;
        case 2: perPage = 8; break;
        case 3: perPage = 6; break;
      }
      if (perPage) {
        pager.setOptions({perPage: perPage});
        pager.reflow();
      }
    });

    self.stepCallback(true);
  }
};

function NewReleasesDataSource() {
  var data = wnData.Data.get('NewReleases');

  this.count = function() {
    return data.length;
  };

  this.makeNode = function(index) {
    var d = data[index], li = new dom.Element('li');

    var albumLink = new dom.Element('a', {
      className: 'name',
      href: d.uri,
      text: d.name.decodeForText()
    });
    var artistLink = new dom.Element('a', {
      className: 'artist',
      href: d.artist.uri,
      text: d.artist.name.decodeForText()
    });

    logger.logClick(albumLink, 'newReleases album link', loggingVersion, testVersion, {'uri': d.uri});
    logger.logClick(artistLink, 'newReleases artist link', loggingVersion, testVersion, {'uri': d.uri});
    var album = m.Album.fromURI(d.uri, function(a) {
      var albumPlayer = new v.Player();
      albumPlayer.track = a.get(0);
      albumPlayer.context = a;

      dom.listen(dom.queryOne('.sp-player-image', albumPlayer.node), 'click', function(e) {
        logger.logClientEvent('newReleases album cover',
            'click',
            loggingVersion,
            testVersion,
            {'uri': d.uri}
        );
      });

      dom.listen(dom.queryOne('.sp-player-button', albumPlayer.node), 'click', function(e) {
        logger.logClientEvent('newReleases play button',
            'click',
            loggingVersion,
            testVersion,
            {'uri': d.uri}
        );
      });

      dom.inject(albumPlayer.node, li, 'top');
    });
    dom.adopt(li, albumLink, artistLink);
    return li;
  };
}

exports.NewReleases = NewReleases;
