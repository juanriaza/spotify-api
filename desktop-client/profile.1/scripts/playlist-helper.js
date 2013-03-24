'use strict';

require([
  'scripts/profile-utils',
  '$shared/events#EventHandler'
], function(utils, EventHandler) {

  /**
   * Object wrapper used to track each indexed item in the IndexingService
   * @param {!Object} data A settings object.
   * @constructor
   */
  var IndexItem = function(data) {
    if (typeof data != 'object') {
      data = {};
    }
    this.data = {
      sortIndex: data.hasOwnProperty('sortIndex') ? data.sortIndex : 0,
      identifier: data.hasOwnProperty('identifier') ? data.identifier : new Date().getTime(),
      dataObj: data.hasOwnProperty('dataObj') ? data.dataObj : {}
    };
  };
  /**
   * @type {IndexItem}
   */
  IndexItem.prototype = {
    /**
     * Returns the identifier for this object
     * @return {string} A unique identifier.
     */
    getIdentifier: function() {
      return this.data.identifier;
    },
    /**
     * Returns the data object that is being tracked
     * @return {Object} The data object.
     */
    getDataObject: function() {
      return this.data.dataObj;
    },
    /**
     * Returns the sort index for this item
     * @return {number} Sort index.
     */
    getSortIndex: function() {
      return this.data.sortIndex;
    },
    /**
     * Sets the sort index for this item
     * @param {number} index An index in the array.
     */
    setSortIndex: function(index) {
      this.data.sortIndex = index;
    }
  };
  /**
   * Keeps track of the order in which objects should be rendered
   * @type {HelperIndexingService}
   */
  var HelperIndexingService = function() {

    var _items = [];
    var _identifier;

    /**
     * Finds an item in the array by its identifier
     * @param {string} needle Identifier to look for.
     * @return {number} -1 if not found, otherwise the index.
     * @private
     * @ignore
     */
    var _find = function(needle) {
      var i = 0, l = _items.length, found = -1;

      for (; i < l; i++) {
        if (_items[i].getIdentifier() === needle) {
          found = i;
          break;
        }
      }
      return found;
    };
    /**
     * Adds an item to the internal array
     * @param {Object} item Item to be added.
     * @private
     * @ignore
     */
    var _addItem = function(item, index) {
      _items[_items.length] = new IndexItem({
        dataObj: item,
        sortIndex: index,
        identifier: item.hasOwnProperty(_identifier) ? item[_identifier] : null
      });
    };
    /**
     * Sorts the items array
     * @private
     * @ignore
     */
    var _sortItems = function() {
      _items.sort(function(a, b) {
        return a.getSortIndex() - b.getSortIndex();
      });
    };
    /**
     * Reassigns the sortindices to a sequential order. Done after sort to
     * remove failed indices. This might be redundant
     * @private
     */
    var _reassignSortIndices = function() {
      var i = 0, l = _items.length;

      for (; i < l; i++) {
        _items[i].setSortIndex(i);
      }
    };

    return {
      /**
       * Sets the dataobject property the IndexingService should look at as a
       * unique identifier
       * @param {string} str A property on the dataobject.
       */
      setIdentifier: function(str) {
        if (str && (typeof str === 'string')) {
          _identifier = str;
        }
      },
      /**
       * Adds an item to the service
       * @param {Object} obj Indexable object.
       * @param {number} index Position in the original array.
       */
      addItem: function(obj, index) {
        if (!obj) {
          return;
        }
        _addItem(obj, index);
      },
      /**
       * Empties the service of all its items
       */
      init: function() {
        _items = [];
      },
      /**
       * Returns the number of indexed items
       * @return {number} The length of the array.
       */
      length: function() {
        return _items.length;
      },
      /**
       * Returns an item by its position in the array
       * @param {number} index An index.
       * @return {?IndexItem} An IndexItem object.
       */
      getItemByIndex: function(index) {
        if (!index && (typeof index != 'number')) {
          return null;
        }
        return _items[index];
      },
      /**
       * Returns an item by its identifier
       * @param {string} str A unique identifier.
       * @return {?IndexItem} An IndexItem object.
       */
      getItemByIdentifier: function(str) {
        if (!str && (typeof str != 'string')) {
          return null;
        }
        return _items[_find(str)];
      },
      /**
       * Returns all indexed items
       * @return {Array} An array of all IndexItem objects.
       */
      getItems: function() {
        return _items;
      },
      /**
       * Sorts and reassigns the indexed items
       */
      sort: function() {
        _sortItems();
        _reassignSortIndices();
      }
    };
  }();

  /**
   * Singleton to manage loading playlists from a users library
   * @type {PlaylistHelper}
   */
  var PlaylistHelper = function() {
    /**
     * Placeholder for the callback function
     */
    var _then;
    /**
     * Local event handler
     * @type {*}
     * @private
     */
    var _eventHandler = null;
    /**
     * Object that holds different event handlers
     * @type {Object}
     * @private
     */
    var _handlers = null;
    /**
     * Indicates how many playlists we load at once
     * @type {number}
     * @private
     */
    var _offset = 200;
    /**
     * Holds the uri of the last updated playlists
     * @type {Array}
     * @private
     */
    var _lastUpdated = null;
    /**
     * Indicates whether we're loading the user's own profile
     * @type {boolean}
     * @private
     */
    var _isSelf = false;
    /**
     * Session object
     * @type {Object}
     * @private
     */
    var _session = null;
    /**
     * Max playlists allowed to load
     * @type {number}
     * @private
     */
    var _upperLimit = 500;
    /**
     * Placeholder for special playlists
     * [0] = starred
     * @type {Array}
     * @private
     */
    var _specialPlaylists = null;
    /**
     * Keeps track of the current batch index
     * @type {number}
     * @private
     */
    var _batchIndex = 0;
    /**
     * Stores the users library
     * @type {Object}
     * @private
     */
    var _library = null;
    /**
     * Keeps track of how many playlists there is to load in the current snapshot
     * @type {number}
     * @private
     */
    var _playlistsBatchToLoad = 0;
    /**
     * Keeps track of how many playlists were loaded
     * @type {number}
     * @private
     */
    var _playlistsLoaded = 0;
    /**
     * The total number of playlists to load
     * @type {number}
     * @private
     */
    var _totalPlaylistsToLoad = 0;

    /**
     * Timer ID for reloading playlists from the library.
     * @type {?number}
     */
    var _reloadPlaylistsTimer = null;

    /**
     * Amount of time to wait after we know we need a reload,
     * before we reload playlists
     */
    var RELOAD_PLAYLISTS_BUFFER_MS = 500;

    /**
     * Loads a user's playlists and passes that to the navigation module
     * @private
     */
    var _loadPlaylists = function() {
      //_library.load('playlists').done(_loadSnapshot);
      _specialPlaylists = [];

      if (_isSelf) {
        // starred tracks are not part of the rootlist
        _loadStarred();
      } else {
        // but it's part of users playlist library if another user
        _loadSnapshot();
      }
    };
    /**
     * Load's a user's starred list so we can append it later
     * @private
     */
    var _loadStarred = function() {
      _library.starred.load('name', 'owner', 'subscribers').done(_starredLoaded).fail(_loadToplist);
    };

    /**
     * Load's a user's toplist so we can append it later
     * @private
     */
    var _loadToplist = function() {
      _library.toplist.load('name', 'owner', 'subscribers', 'tracks').done(_toplistLoaded).fail(_loadSnapshot);
    };

    var _listenOnLibraryEvents = function() {
      if (!_eventHandler) {
        _eventHandler = new EventHandler(this);
      }

      if (_reloadPlaylistsTimer) {
        clearTimeout(_reloadPlaylistsTimer);
      }
      _reloadPlaylistsTimer = setTimeout(_reload, RELOAD_PLAYLISTS_BUFFER_MS);

      if (_handlers) {
        if (_handlers.onInsert && _isSelf) {
          _eventHandler.listen(_library.playlists, 'insert', _onLibraryInsert);
        } else if (_handlers.onInsert && !_isSelf) {
          _eventHandler.listen(_library.published, 'insert', _onLibraryInsert);
        }
        if (_handlers.onRemove && _isSelf) {
          _eventHandler.listen(_library.playlists, 'remove', _onLibraryRemove);
        }

        // Listen to my published root list changes
        // This happens when the public/secret state of a playlist changes.
        if (_handlers.onPublishedInsert && _isSelf) {
          _eventHandler.listen(_library.published, 'insert', _onLibraryPublishedInsert);
        }
        if (_handlers.onPublishedRemove && _isSelf) {
          _eventHandler.listen(_library.published, 'remove', _onLibraryPublishedRemove);
        }
      }
    };

    var _onLibraryInsert = function(obj) {
      _lastUpdated = obj.uris;
      if (_handlers.onInsert && typeof _handlers.onInsert === 'function') {
        _handlers.onInsert.call(null, obj);
      }

      if (_reloadPlaylistsTimer) {
        clearTimeout(_reloadPlaylistsTimer);
      }
      _reloadPlaylistsTimer = setTimeout(_reload, RELOAD_PLAYLISTS_BUFFER_MS);
    };

    var _onLibraryRemove = function(obj) {
      _lastUpdated = obj.uris;
      if (_handlers.onRemove && typeof _handlers.onRemove === 'function') {
        _handlers.onRemove.call(null, obj);
      }
    };

    var _onLibraryPublishedInsert = function(obj) {
      _lastUpdated = obj.uris;
      if (_handlers.onPublishedInsert && typeof _handlers.onPublishedInsert === 'function') {
        _handlers.onPublishedInsert.call(null, obj);
      }
    };

    var _onLibraryPublishedRemove = function(obj) {
      _lastUpdated = obj.uris;
      if (_handlers.onPublishedRemove && typeof _handlers.onPublishedRemove === 'function') {
        _handlers.onPublishedRemove.call(null, obj);
      }
    };

    /**
     * Found a starred playlist, stash that and move on in chain
     * @param {models.Playlist} starred A starred playlist.
     * @private
     */
    var _starredLoaded = function(starred) {
      _specialPlaylists.push(starred);
      _loadToplist();
    };
    /**
     * Found a toplist playlist, stash that and move on in chain
     * @param {models.Playlist} toplist A toplist playlist.
     * @private
     */
    var _toplistLoaded = function(toplist) {
      toplist.tracks.snapshot().done(_tracksSnapshotLoaded.bind(toplist)).fail(_loadSnapshot);
    };
    /**
     * Check if playlist contains tracks and adds it to specialPlaylists
     * @param {models.Snapshot} snapshot A snaphot of tracks.
     * @private
     */
    var _tracksSnapshotLoaded = function(snapshot) {
      if (snapshot.length > 0) {
        _specialPlaylists.push(this);
      }
      _loadSnapshot();
    };

    /**
     * Takes a snapshot when the Library finishes loading
     * @private
     */
    var _loadSnapshot = function() {
      // console.log('(PlaylistHelper) taking snapshot (start, offset, total)', _batchIndex, _offset, _totalPlaylistsToLoad);
      if (_isSelf) {
        _library.playlists.snapshot(_batchIndex, _offset).done(_resolvePlaylistSnapshot).fail(
            function(s, e) {
              console.error('(PlaylistHelper) playlist snapshot failed', s, e);
            }
        );
      } else {
        _library.published.snapshot(_batchIndex, _offset).done(_resolvePlaylistSnapshot).fail(
            function(s, e) {
              console.error('(PlaylistHelper) playlist snapshot failed', s, e);
            }
        );
      }
    };
    /**
     * Loads playlists into an array that can be passed to the navigation module
     * @param {models.Snapshot} s A snapshot of playlists.
     * @private
     */
    var _resolvePlaylistSnapshot = function(s) {
      var i = 0;
      // console.log('(PlaylistHelper) snapshot taken', s, s.length);
      if (s.length) {
        if (!_totalPlaylistsToLoad) {
          _totalPlaylistsToLoad = s.length;
          HelperIndexingService.init();
          // this only happens on first load so append all special playlists here
          for (i = 0; i < _specialPlaylists.length; i++) {
            _appendPlaylistFromSnapshot(_specialPlaylists[i], i - 1);
          }
        }
        _playlistsBatchToLoad = s.range.length;
        for (i = 0; i < _playlistsBatchToLoad; i++) {
          var pos = _batchIndex + i;
          _getIndexedItemFromSnapshot(s, pos);
        }
        _batchIndex += _playlistsBatchToLoad;
        if (_batchIndex < _totalPlaylistsToLoad) {
          _loadSnapshot();
        } else if (s.length === 0) {
          _handleNoPlaylists();
        }
      } else {
        _handleNoPlaylists();
      }
    };
    /**
       * Retrieves and indexed snapshot while maintaining i order
       * @param {models.Snapshot} ss A snapshot object.
       * @param {number} i The current index.
       * @private
       */
    var _getIndexedItemFromSnapshot = function(ss, i) {
      var playlist = ss.get(i);
      // odd that some positions in the snapshot seem empty
      if (playlist) {
        _appendPlaylistFromSnapshot(playlist, i);
      } else {
        //console.log('playlist folder marker at position ' + i);
        _resolveLoadedPlaylist();
      }
    };
    /**
       * Pushes a loaded playlist onto the array
       * @param {models.Playlist} p A playlist object.
       * @private
       */
    var _appendPlaylistFromSnapshot = function(p, i) {
      HelperIndexingService.addItem(p, i + _specialPlaylists.length);
      _resolveLoadedPlaylist();
    };
    /**
       * A failed playlist from a snapshot is treated as loaded but not pushed to
       * the array of completed playlist objects
       * @param {models.Playlist} p A playlist object.
       * @private
       */
    var _handleFailedPlaylist = function(p, e) {
      console.error('(PlaylistHelper) playlist not loaded', p, e);
      _resolveLoadedPlaylist();
    };
    /**
       * When user does not have any playlists
       * @private
       */
    var _handleNoPlaylists = function() {
      console.info('(PlaylistHelper) no playlists for user');
      if (_then && typeof _then === 'function') {
        _then.call(this, _filterPlaylists());
      }
    };
    /**
       * Resolves a loaded playlist, checks for load complete
       * @private
       */
    var _resolveLoadedPlaylist = function() {
      _playlistsLoaded++;
      if (_playlistsLoaded === (_totalPlaylistsToLoad + _specialPlaylists.length)) {
        if (_then && typeof _then === 'function') {
          _then.call(this, _filterPlaylists());
        }
      }
    };
    /**
       * Filters out duplicate playlist objects (to make up for the toplist bug/feature)
       * @return {Array} An array of playlist objects.
       * @private
       */
    var _filterPlaylists = function() {
      var i = 0, l = HelperIndexingService.length(), results = [], item;

      HelperIndexingService.sort();
      for (; i < l; i++) {
        item = HelperIndexingService.getItemByIndex(i);
        if (item && !_inList(item.getIdentifier(), results)) {
          results.push(item);
        }
      }
      return results;
    };
    /**
     * Resets the private properties
     * @private
     */
    var _reset = function() {
      _batchIndex = 0;
      _playlistsBatchToLoad = 0;
      _playlistsLoaded = 0;
      _totalPlaylistsToLoad = 0;
      HelperIndexingService.init();
      HelperIndexingService.setIdentifier('uri');
    };
    /**
     * Removes all events
     * @private
     */
    var _destroy = function() {
      if (_eventHandler) {
        _eventHandler.removeAll();
      }
    };
    /**
       * Finds a specific uri an array (requires an array of playlist objects)
       * @param {string} needle A uri.
       * @param {Array} arr An array.
       * @return {boolean} Whether the uri was found or not.
       * @private
       */
    var _inList = function(needle, arr) {
      var i = 0, l = arr.length;
      for (; i < l; i++) {
        if (arr[i].getIdentifier() === needle) return true;
      }
      return false;
    };
    /**
     * Internal method to reload the library
     * @private
     */
    var _reload = function() {
      _reset();
      _loadPlaylists();
    };
    /**
     * Public interface
     */
    return {
      /**
         * Registers a callback event with the helper
         * @param {function} callback The callback to be executed when all items are loaded.
         */
      registerCallback: function(callback) {
        if (!callback || typeof callback != 'function') {
          return;
        }
        _then = callback;
      },
      /**
       * Registers a callback event with the helper
       * @param {function} callback The callback to be executed when all items are loaded.
       */
      registerEventHandlers: function(handlers) {
        if (!handlers || typeof handlers != 'object') {
          return;
        }
        _handlers = handlers;
      },
      /**
         * Initiates load of all the users playlists
         */
      load: function(isSelf, session) {
        _reset();
        _isSelf = isSelf;
        _session = session;
        if (!_library) {
          console.error('(PlaylistHelper) no library set!');
        }
        try {
          _listenOnLibraryEvents();
        } catch (e) {
          console.error(e);
        }
      },
      /**
         * Assign an object with loadable playlists to the service
         * @param {Object} lib A Collection of playlists.
         */
      setLibrary: function(lib) {
        if (!lib) {
          return;
        }
        _library = lib;
      },
      /**
       * Resets the service
       */
      reset: function() {
        _reset();
      },
      /**
       * Destroys all events for this service
       */
      destroy: function() {
        _destroy();
      },
      /**
       * Returns the latest changes, if any
       * @return {Array} An array of updated playlists.
       */
      getLatestChange: function() {
        return _lastUpdated;
      }
    };
  }();
  /**
     * Exports
     */
  exports.registerCallback = PlaylistHelper.registerCallback;
  exports.load = PlaylistHelper.load;
  exports.destroy = PlaylistHelper.destroy;
  exports.setLibrary = PlaylistHelper.setLibrary;
  exports.getLatestChange = PlaylistHelper.getLatestChange;
  exports.registerEventHandlers = PlaylistHelper.registerEventHandlers;
});
