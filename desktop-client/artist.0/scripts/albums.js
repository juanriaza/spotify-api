require([
  '$api/models',
  '$views/image#Image',
  '/scripts/utils',
  '/scripts/env#Environment',
  '/scripts/logger#Logger',
  '/scripts/promises',
  '/scripts/onemoretime',
  '/scripts/promised_loader#PromisedLoader',
  '/scripts/artificial_context#ArtificialContext',
  '/scripts/snapshot.albums#AlbumsSnapshot',
  '$views/scroll-agent/scroll-agent-endless#ScrollAgent',
  '$views/list#List',
  '$views/throbber#Throbber',
  '/scripts/logger#Logger'
], function(models, Image, utils, Environment, Logger, promises,
    omt, PromisedLoader, ArtificalContext, AlbumsSnapshot, ScrollAgent, List, Throbber, logger) {

  var ContentManager = function() { };
  var logger = new Logger();
  SP.inherit(ContentManager, models.Observable);

  ContentManager.prototype.init = function(artist, manager) {
    this.artist = artist;
    this.initialized = true;
    this.throbber = false;
    this.contextManager = manager;
    this.loaders = {};
    this.contentShown = false;
    var self = this;

    this.loaders.album = new AlbumsLoader();
    this.loaders.singles = new SinglesLoader();
    this.loaders.appears = new AppearsLoader();

    if (Environment.desktop) {
      this.artificalContext = new ArtificalContext();
      for (var loader in this.loaders) {
        this.loaders[loader].addEventListener('contextCreated', SP.bind(this._registerArtificalContext, this));
      }
    }
  };

  ContentManager.prototype.startLoading = function() {
    if (this.initialized === false) {
      return true;
    }
    var self = this;
    this.showThrobber();

    this.loaders.album.init(this.artist, this.contextManager);
    this.loaders.album.addEventListener('albumLoaded', function() {
      self._readyToShow();
      self.loaders.album.showContainer();
    });

    this.loaders.album.addEventListener('finishedLoading', function() {
      // When albums are done loading start on singles.
      // finishedLoading _always_ triggers, even if the artist has no albums.
      self.loaders.singles.init(this.artist, this.contextManager);
      self.loaders.singles.addEventListener('albumLoaded', function() {
        self.loaders.singles.showContainer();
      });
    });

    this.loaders.singles.addEventListener('finishedLoading', function() {
      self.loaders.appears.init(this.artist, this.contextManager);
      self.loaders.appears.addEventListener('albumLoaded', function() {
        self.loaders.appears.showContainer();
      });
    });

    this.loaders.appears.addEventListener('finishedLoading', function() {
      // When there's no more appears on hide the throbber.
      self.hideThrobber();
    });
  }

  ContentManager.prototype._readyToShow = function() {
    if (this.contentShown === false) {
      this.dispatchEvent('readyToShow');
      this.contentShown = true;
    }
  }

  ContentManager.prototype._registerArtificalContext = function(e) {
    this.artificalContext.append(e.data.uri, e.data.length);
  };

  ContentManager.prototype.dispose = function() {
    if (this.initialized === true) {
      this.loaders.appears.removeEventListener('finishedLoading', this.hideThrobber);
      for (var loader in this.loaders) {
        this.loaders[loader].dispose();
        this.loaders[loader].hideContainer();
        this.loaders[loader] = null;
      }
      this.initialized = false;
    }
  };

  ContentManager.prototype.showThrobber = function() {
    if (this.throbber === false) {
      this.throbber = new Throbber.forElement(document.getElementById('content-throbber'));
      this.throbber.setSize('normal');
    }
    this.throbber.show();
  };

  ContentManager.prototype.hideThrobber = function() {
    if (this.throbber.parentNode != null) {
      this.throbber.hide();
    }
    $('content-loading').setStyle('display', 'none');
  };

  /*
   * Main class for all loading, never instantiated directly.
   */
  var ContentLoader = function() { };
  SP.inherit(ContentLoader, models.Observable);

  ContentLoader.prototype.init = function(artist, manager) {
    this.artist = artist;
    this.offset = -1;
    this.loadSize = 10; // How many items the scroll agent should load in each batch.
    this.content = this.artist[this.type]; // Albums, Singles, Appears On etc (set in subclass)
    this.first = true; // Keep track of when event 'albumLoaded' should fire.
    this.totalAlbums = 0;
    this.scrollAgent = false;
    this.views = []; // All the views we create, used for clean disposing.
    this.viewsKeys = []; // Context lookup list.
    this.contextManager = manager;
    this.disposed = false;
    this._scrollAgentRequestBind = this._scrollAgentRequest.bind(this);
    this._toggleViewTypeBind = this._onToggleViewTypeClick.bind(this);

    var self = this;
    var binder = function(index) {
      return self.contextManager.allocate(index, self._getView.bind(self));
    }
    this.content.snapshot(0).done(function(snap) {
      if (self.disposed) {
        return true;
      }
      if (snap.length === 0) {
        self._dispatchFirstAlbum();
        self._dispatchDone();
        return true;
      }
      // Allocate all contexts before doing anything else.
      for (var i = 0; i < snap.length; i++) {
        self.viewsKeys[i] = binder(i);
      }
      self.contextManager.incrementOffset(snap.length);

      self.totalAlbums = snap.length;
      self.scrollAgent = new ScrollAgent(document.documentElement, {
        id: self.type + '-' + self.artist.uri.split(':')[2],
        container: document.getElementById(self.type + '-list'),
        removeInvisibles: true,
        tagName: 'li',
        debug: false,
        batchSize: self.loadSize,
        hotZone: 2000,
        deadZone: 147,
        length: snap.length
      });

      // Albums and singles can change view (cover/list)
      if (self.supportCoverMode) {
        self._bindToggleEvent();
        self._restoreViewType(self.type);
      }

      self.scrollAgent.addEventListener('request', self._scrollAgentRequestBind);
      self.scrollAgent.attach();
    });
  }

  ContentLoader.prototype._getView = function(index) {
    return this.views[index];
  }

  // Called by the Scroll Agent on every batch
  ContentLoader.prototype._scrollAgentRequest = function(e) {
    if (this.disposed) { return true; }
    var snapshot = new AlbumsSnapshot(this.artist, this._source.bind(this)),
        self = this;

    snapshot.get(e.start, e.length).done(function(result) {
      if (self.disposed) { return true; }

      if (e.start + e.length >= self.totalAlbums) {
        self._dispatchDone();
      }
      var views = [],
          orderedViews = [],
          completedViews = 0,
          arrayOffset = 0;
      for (var i = 0, j = result.albums.length; i < j; i++) {
        self.offset += 1;
        if (result.albums[i] === null) {
          completedViews += 1;
          self._callDone(views, e.length, completedViews, e.done);
        } else {
          var promise,
              view;
          if (self.mode === 'playlist') {
            promise = self._prepareView('playlist', arrayOffset, result.albums[i].album, self.offset);
          } else {
            promise = self._prepareView('album', arrayOffset, result.albums[i].album, self.offset);
          }
          arrayOffset += 1;

          promise.done(function(view) {
            if (self.disposed) { return true; }

            if (!!view.playlist && (view.playableTracks < 1 || view.tracks === 0)) {
              completedViews += 1;
              if (self._callDone(views, e.length, completedViews, e.done)) {
                self._processOrderedViews(orderedViews);
              }
              return;
            }
            views[view.internalOffset] = view.node;
            // This is a work around to make sure lists are added to the artificial
            // Context in the right order.
            orderedViews[view.internalOffset] = view;

            view.create().done(function(v) {
              if (self.disposed) { return true; }
              if (self.first) { self._dispatchFirstAlbum(); }

              completedViews += 1;
              self.views[v.realOffset] = v;
              if (self._callDone(views, e.length, completedViews, e.done)) {
                self._processOrderedViews(orderedViews);
              }
            });
          });
        }
      }
    });
  };

  ContentLoader.prototype._processOrderedViews = function(views) {
    var self = this;
    views.forEach(function(ov) {
      if (ov.list !== null) {
        self.contextManager.evaluate(self.viewsKeys[ov.realOffset], ov.list);
      }
      // If there's no tracks in the playlist we can skip connecting it.
      if (!!ov.playlist && ov.playableTracks > 0) {
        self.dispatchEvent({type: 'contextCreated', data: {
          uri: ov.playlist.uri,
          length: ov.playableTracks
        }});
      } else {
        self.dispatchEvent({type: 'contextCreated', data: {
          uri: ov.album.uri,
          length: ov.album.tracks.length
        }});
      }
    });
  };

  // Returns a promise for a finished view depending on what is requested.
  ContentLoader.prototype._prepareView = function(type, offset, data, realOffset) {
    var promise = new models.Promise(),
        view;
    if (type === 'playlist') {
      this._filterAppearance(offset, data).done(function(pl) {
        view = new PlaylistView(pl.offset, pl.album, pl.playlist);
        view.tracks = pl.tracks;
        view.realOffset = realOffset;
        view.playableTracks = pl.playableTracks;
        promise.setDone(view);
      });
    } else {
      view = new AlbumView(offset, data);
      view.realOffset = realOffset;
      promise.setDone(view);
    }

    return promise;
  }

  // Helper method for AlbumSnapshot.
  ContentLoader.prototype._source = function() {
    return this.content;
  };

  // Lazy method to check wether the scroll agent batch is done.
  ContentLoader.prototype._callDone = function(views, length, completed, callback) {
    if (this.disposed) {
      return false;
    }
    if (completed === length) {
      var finalViews = [];
      for (var i = 0, j = views.length; i < j; i++) {
        if (views[i] !== undefined) {
          finalViews.push(views[i]);
        }
      }
      callback(finalViews);
      return true;
    }
    return false;
  };

  ContentLoader.prototype._dispatchDone = function() {
    this.dispatchEvent('finishedLoading', {data: null});
  };

  ContentLoader.prototype._dispatchFirstAlbum = function() {
    this.dispatchEvent({type: 'albumLoaded', data: false});
    this.first = false;
  }

  // List / Cover view functionality.
  ContentLoader.prototype._bindToggleEvent = function() {
    $$('.viewtype.' + this.type + ' span').addEvent('click', this._toggleViewTypeBind);
  };

  ContentLoader.prototype._unbindToggleEvent = function() {
    $$('.viewtype.' + this.type + ' span').removeEvent('click', this._toggleViewTypeBind);
  };

  ContentLoader.prototype._onToggleViewTypeClick = function(e) {
    var viewType = (!!~e.target.className.indexOf('covers')) ? 'covers' : 'list';
    this._setViewType(this.type, viewType);
    this._storeViewType(this.type, viewType);
    this.triggerUpdate();
    logger.clientEvent('set-view-type', {'list': this.type, 'view': viewType});
  }

  ContentLoader.prototype._setViewType = function(listType, viewType) {
    $$('.viewtype.' + this.type).removeClass('covers').addClass(viewType);
    $(this.type + '-list').removeClass('list').removeClass('covers').addClass(viewType);
  };

  ContentLoader.prototype._storeViewType = function(listType, viewType) {
    if (localStorage) {
      this._viewTypeSettings = JSON.parse(localStorage.getItem(this._localStorageViewTypeKey) || '{}');
      this._viewTypeSettings[listType] = viewType;
      localStorage.setItem(this._localStorageViewTypeKey, JSON.stringify(this._viewTypeSettings));
    }
  };

  ContentLoader.prototype._restoreViewType = function(listType) {
    if (localStorage) {
      this._viewTypeSettings = JSON.parse(localStorage.getItem(this._localStorageViewTypeKey) || '{}');
      if (typeof(this._viewTypeSettings[listType]) !== 'undefined') {
        this._setViewType(listType, this._viewTypeSettings[listType]);
      }
    }
  };

  // Forces the scroll agent to update (used when switching views).
  ContentLoader.prototype.triggerUpdate = function() {
    this.scrollAgent.update();
  };
  // End List / Cover view things.

  // Convenience methods for showing / hiding the main containers.
  ContentLoader.prototype.showContainer = function() {
    if (this.offset > -1) {
      $(this.container).removeClass('hidden');
    }
  }

  ContentLoader.prototype.hideContainer = function() {
    $(this.container).addClass('hidden');
  }

  // Good 'ol dispose. Tries to clean up as much as possible.
  ContentLoader.prototype.dispose = function() {
    this.disposed = true;
    if (!!this.scrollAgent) {
      this.scrollAgent.removeEventListener('request', this._scrollAgentRequestBind);
      this.scrollAgent.destroy();
    }
    this._unbindToggleEvent();
    if (!!this.views) {
      for (var i = this.views.length; i >= 0; i--) {
        if (this.views[i] !== undefined) {
          this.views[i].dispose();
        }
      }
    }
    this.views = null;
    this.viewsKeys = null;
    this.scrollAgent = null;
    document.getElementById(this.type + '-list').innerHTML = '';
  };

  var AlbumsLoader = function() {
    this.type = 'albums';
    this.container = document.getElementById('albums-container');
    this.supportCoverMode = true;
    this.mode = 'album';
  };
  SP.inherit(AlbumsLoader, ContentLoader);

  var SinglesLoader = function() {
    this.type = 'singles';
    this.container = document.getElementById('singles-container');
    this.supportCoverMode = true;
    this.mode = 'album';
  };
  SP.inherit(SinglesLoader, ContentLoader);

  var AppearsLoader = function() {
    this.type = 'appearances';
    this.container = document.getElementById('appearances-container');
    this.supportCoverMode = false;
    this.mode = 'playlist';
  }
  SP.inherit(AppearsLoader, ContentLoader);

  // Filters the appears on albums and creates playlists (stolen from old logic)
  AppearsLoader.prototype._filterAppearance = function(offset, album) {
    var result = {};
    var whenDone = new models.Promise(result);
    var promises = [];
    var artistName = this.artist.name,
        self = this;
    result.offset = offset;
    result.album = album;
    result.tracks = 0;
    result.playableTracks = 0;

    var tracks = omt.snapshotWithRetry(album.tracks);
    tracks.snapshot().fail(this, function() {
      logger.clientEvent('snapshot-timeout-albums',
          { artist: this.artist.uri,
            object: album.uri });
    }).done(this, function(tracks) {
      if (tracks.length === 0) {
        whenDone.setDone();
        return;
      }
      var playlist = models.Playlist.createTemporary(album.uri + Date.now() / 1000);
      playlist.done(function(playlist) {
        playlist.load('tracks').done(function(pl) {
          result.playlist = pl;
          result.options = {
            album: album,
            name: album.name,
            uri: album.uri,
            date: album.date
          };

          tracks.loadAll('name', 'artists', 'playable').each(function(track) {
            track.artists.forEach(function(trackArtist) {
              if (trackArtist.name === artistName) {
                result.tracks += 1;
                if (track.playable) {
                  result.playableTracks += 1;
                }
                pl.tracks.add(models.Track.fromURI(track.uri));
              }
            });
          }).always(function() {
            whenDone.setDone();
          });
        });
      });
    });
    return whenDone;
  };

  // View for album objects, also inherited by playlist views.
  var AlbumView = function(offset, album) {
    this.internalOffset = offset;
    this.realOffset = 0;
    this.album = album;
    this.list = null;
    this.disposed = false;
    this._timer = null;
    this._creationSetDoneBind = this._creationSetDone.bind(this);
    this._setListFields();

    this._createNodes();
  };

  AlbumView.prototype._setListFields = function() {
    if (Environment.web) {
      this.listFields = ['number', 'track', 'trackartist', 'time', 'popularity'];
    } else {
      this.listFields = ['star', 'share', 'number', 'track', 'trackartist', 'time', 'popularity'];
    }
  };

  AlbumView.prototype._createNodes = function() {
    this.node = document.createElement('li');
    this.node.className = 'cf';

    this.imageNode = document.createElement('div');
    this.imageNode.className = 'album-cover';

    this.listNode = document.createElement('div');
    this.listNode.className = 'album-playlist';

    this.infoNode = document.createElement('div');
    this.infoNode.className = 'album-info';

    this.node.appendChild(this.imageNode);
    this.node.appendChild(this.infoNode);
    this.node.appendChild(this.listNode);
  };

  AlbumView.prototype.create = function() {
    this.creationPromise = new models.Promise();

    this.createImage();
    this.createTitle();
    this.createList();

    return this.creationPromise;
  };

  AlbumView.prototype.createImage = function() {
    this.image = Image.forAlbum(this.album, {
      title: this.album.title,
      height: 180,
      width: 180,
      player: true,
      animate: false,
      overlay: [this.album.name.decodeForHtml(), this.album.date],
      placeholder: 'album',
      link: this.album.uri
    });
    this.imageNode.appendChild(this.image.node);
  };

  AlbumView.prototype.createTitle = function() {
    var node = document.createElement('h2');
    var link = document.createElement('a');
    link.innerHTML = this.album.name.decodeForHtml();
    link.href = this.album.uri;
    node.className = 'album-title';
    node.appendChild(link);

    var year = document.createElement('span');
    year.innerHTML = this.album.date;
    year.className = 'album-year';
    node.appendChild(year);

    this.infoNode.appendChild(node);
  };

  AlbumView.prototype.createList = function() {
    this.list = new List(this.album, {
      context: this.album,
      title: this.album.name.decodeForHtml(),
      type: 'tracks',
      fields: this.listFields,
      header: 'no',
      fetch: 'greedy',
      style: 'rounded'
    });
    this.listNode.appendChild(this.list.node);
    var self = this;
    this.list.addEventListener('initial-snapshots-load', this._creationSetDoneBind);
    this.list.init();
    this._timer = setTimeout(function() {
      self._creationSetDoneBind();
    }, 1000);
  };

  AlbumView.prototype._creationSetDone = function() {
    clearTimeout(this._timer);
    this.creationPromise.setDone(this);
  };

  AlbumView.prototype.dispose = function() {
    if (this.disposed === true) {
      return true;
    }
    this.disposed = true;
    this.list.removeEventListener('initial-snapshots-load', this._creationSetDoneBind);
    this.list.destroy();
    this.list = null;
    this.image = null;
    this.listNode.parentNode.removeChild(this.listNode);
    this.imageNode.parentNode.removeChild(this.imageNode);
    this.listNode = null;
    this.imageNode = null;
    if (this.node.parentNode) {
      this.node.parentNode.removeChild(this.node);
    }
    this.node = null;
  };

  var PlaylistView = function(offset, album, playlist) {
    this.internalOffset = offset;
    this.realOffset = 0;
    this.album = album;
    this.playlist = playlist;
    this.list = null;
    this.destroyed = false;
    this.tracks = 0;
    this._timer = null;
    this._creationSetDoneBind = this._creationSetDone.bind(this);
    this._setListFields();

    this._createNodes();
  }

  PlaylistView.prototype.createList = function() {
    this.list = new List(this.playlist.tracks, {
      context: this.playlist,
      title: 'Some album',
      type: 'tracks',
      fields: this.listFields,
      header: 'no',
      fetch: 'greedy',
      style: 'rounded'
    });
    this.listNode.appendChild(this.list.node);
    var self = this;
    this.list.addEventListener('initial-snapshots-load', this._creationSetDoneBind);
    this._timer = setTimeout(function() {
      self._creationSetDoneBind();
    }, 1000);
    this.list.init();
  };

  PlaylistView.prototype.create = AlbumView.prototype.create;
  PlaylistView.prototype._setListFields = AlbumView.prototype._setListFields;
  PlaylistView.prototype._createNodes = AlbumView.prototype._createNodes;
  PlaylistView.prototype.createImage = AlbumView.prototype.createImage;
  PlaylistView.prototype.createTitle = AlbumView.prototype.createTitle;
  PlaylistView.prototype._creationSetDone = AlbumView.prototype._creationSetDone;
  PlaylistView.prototype.dispose = AlbumView.prototype.dispose;

  exports.ContentManager = ContentManager;
});
