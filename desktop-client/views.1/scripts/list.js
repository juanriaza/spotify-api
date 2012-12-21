'use strict';

require([
  '$api/models',
  '$views/utils/dom',
  '$views/list/model#ListModel',
  '$views/list/view#ListView',
  '$views/throbber#Throbber'
], function(models, dom, ListModel, ListView, Throbber) {

  exports.List = List;

  /**
   * @class List
   * @classdesc Create a new list of items from a collection. Not all items
   *     from the collection will be added directly. It uses snapshots, and
   *     will fill up some when you call list.init(). If you want more items,
   *     you call list.more() which will get a new round with the right offset.
   *     Call one of the factory methods to create an instance of List.
   *
   * @since 1.0.0
   *
   * You can subscribe to some events that the list will broadcast:
   * - initialized            (when list.init() has been completed)
   * - play                   (when a track starts playing by the list)
   * - set-collection         (when a new collection is set)
   * - set-context            (when a new context is set)
   * - refresh                (when the list has been refreshed, but before the
   *                           snapshots are loaded)
   * - clear                  (when the list has been cleared)
   * - initial-snapshots      (when the initial snapshots have been made)
   * - initial-snapshots-load (when the items of the initial snapshots have
   *                           been loaded)
   * - snapshot-start         (when a snapshot starts)
   * - snapshot               (when a snapshot is done, but items might not be
   *                           loaded yet)
   * - snapshot-load          (when the items of a snapshot are loaded)
   * - item-load              (when an item has been loaded)
   * - item-load-fail         (when an item has failed to be loaded)
   * - column-resize          (when the user has moved the handle between two
   *                           columns)
   * - scroll-fetch           (when the list is scrolled to the bottom and more
   *                           items will be fetched)
   * - item-select            (when an item has been selected)
   * - item-deselect          (when an item has been deselected)
   *
   * - empty                  (when the collection is empty and no rows will show)
   * - visually-empty         (when the list will not show any visible rows. If
   *                           unplayable tracks have been chosen to be hidden,
   *                           this will trigger even if there are unplayable
   *                           tracks in the collection.)
   *
   * @param {Collection|Album|Disc|Playlist} item An object containing a
   *     collection or a collection itself.
   * @param {Object} options An object containing different options for the
   *     list. Everything has defaults, so all are optional.
   *
   *     numItems: Number of items to get. If not set, enough to fill the view
   *         three times will be added.
   *     fetch: The way to fetch items. 'once' | 'scroll' | 'greedy'.
   *         Default: 'scroll'. When set to 'greedy', it will fetch all
   *         items in the collection. Do NOT use 'greedy' for searches, as
   *         it is really expensive. When set to 'scroll' it will fetch more
   *         items when scrolled to the bottom of the list. When set to 'once',
   *         it will only fetch the initial buckets, and nothing more.
   *     numBuckets: Number of buckets to initially get. One bucket is the
   *         number of items that fit into the view at once. Default: 3
   *     header: If/how the header will be displayed. 'no' | 'yes' | 'fixed'.
   *         Default: 'fixed'
   *     type: The type of list to get. 'tracks' | 'albums' | 'artists'
   *         Default: 'tracks'
   *     layout: The layout to use. 'default' | 'toplist'. Default: 'default'
   *     getItem: Function that will return a DOM node for each list item.
   *         Defaults to a predefined function.
   *     fields: The fields to use in the list. There are many predefined,
   *         listed in LIST_FIELDS. Default: Depends on the type of list.
   *     height: How the height of the list will behave. 'fixed' | 'dynamic'.
   *         Default: 'dynamic'
   *     scrollElement: If provided, and height option is set to 'dynamic',
   *         this will be the element used for detecting scrolling.
   *     context: An optional context to use instead of generating one.
   *     unplayable: How to show unplayable tracks. 'disabled' | 'hidden'.
   *         Default: 'disabled'
   *     style: The style of the list. 'plain' | 'rounded'. Default: 'plain'
   *     imageOptions: An object that will be passed as options to the image
   *         view for images inside the list. Default: undefined.
   *     visualOffset: An optional offset for the ordinal field. If for example 5 is provided,
   *         the first item in the list will have the number 6. Default: 0
   *     throbber: What type of throbber to use.
   *         'none': No throbber is visible.
   *         'hide-content': Throbber is visible and content is hidden.
   *         'show-content': Throbber is visible on top of the content
   *         Default: 'none'
   */
  function List(item, options) {
    var isCollection = item instanceof models.Collection;
    this.eventHandlers = [];

    this.listIndex = 0;

    this._parseOptions(options);

    if (isCollection) {
      this.item = item;
      this._init(item);
    } else {
      this._loadItem(item);
    }
  }
  SP.inherit(List, models.Observable);

  /**
   * Create a List for the given collection.
   *
   * @since 1.0.0
   *
   * @param {Collection} collection The collection object to use.
   * @param {Object=} opt_options An optional options object.
   *
   * @return {List} A List instance.
   */
  List.forCollection = function(collection, opt_options) {
    return new List(collection, opt_options);
  };

  /**
   * Create a List for the given album.
   *
   * @since 1.0.0
   *
   * @param {Album} album The album object to use.
   * @param {Object=} opt_options An optional options object.
   *
   * @return {List} A List instance.
   */
  List.forAlbum = function(album, opt_options) {
    return new List(album, opt_options);
  };

  /**
   * Create a List for the given disc.
   *
   * @since 1.0.0
   *
   * @param {Disc} disc The disc object to use.
   * @param {Object=} opt_options An optional options object.
   *
   * @return {List} A List instance.
   */
  List.forDisc = function(disc, opt_options) {
    return new List(disc, opt_options);
  };

  /**
   * Create a List for the given playlist.
   *
   * @since 1.0.0
   *
   * @param {Playlist} playlist The playlist object to use.
   * @param {Object=} opt_options An optional options object.
   *
   * @return {List} A List instance.
   */
  List.forPlaylist = function(playlist, opt_options) {
    return new List(playlist, opt_options);
  };

  /**
   * Initialize the list and fill up the first initial buckets.
   * This MUST be called after the list node has been added to the DOM.
   */
  List.prototype.init = function() {
    if (this.destroyed) { return; }

    if (this.isDiscsList) { this._callForEachList('init'); this.initialized = true; return; }

    var self = this;
    if ((!this.view || !this.model || (this.type === 'tracks' && !this.model.context)) && (this.numInitTries || 0) < 50) {
      setTimeout(function() {
        self.numInitTries = (self.numInitTries || 0) + 1;
        self.init();
      }, 100);
      return;
    } else if (this.numInitTries >= 50) {
      this.numInitTries = 0;
      return;
    }
    this.numInitTries = 0;

    this.view.addedToDOM();
    this.initialized = true;
    this.dispatchEvent('initialized');
    if (this.parentList) {
      this.parentList.numDiscsInitialized++;

      if (this.parentList.numDiscsInitialized === this.parentList.numDiscs) {
        this.parentList.dispatchEvent('initialized');
      }
    }

    if (!this.throbber) {
      this._createThrobber();
    }

    var makeSnapshots = function() { self.model.makeInitialSnapshots(); };
    this.isAlbumItem = this.item instanceof models.Album;
    if (this.isAlbumItem) {
      this.item.load('artists').done(function(item) {
        var uris = [];
        for (var i = 0, l = item.artists.length; i < l; i++) {
          uris.push(item.artists[i].uri);
        }
        self.albumArtists = uris.join(' ');
        makeSnapshots();
      }).fail(function() {
        makeSnapshots();
      });
    } else {
      makeSnapshots();
    }
  };

  /**
   * Add more items to the list.
   * This will make another snapshot for the next section.
   */
  List.prototype.more = function() {
    if (this.destroyed) { return; }

    if (this.isDiscsList) { this._callForEachList('more'); return; }

    this.model.snapshot();
  };

  /**
   * Play a track at a particular index within the list.
   *
   * @function
   * @name List#playTrack
   * @param {number} index Index within the list.
   * @param {number=} opt_discIndex Disc index. If specified, the index param
   *     refers to within the disc.
   * @since 1.0.0
   */
  List.prototype.playTrack = function(index, opt_discIndex) {
    if (this.destroyed) { return; }

    var items = [];
    var model;

    // Collect all items, from all discs if a discs list
    if (this.isPartOfDiscsList || this.isDiscsList) {
      var lists = this.isPartOfDiscsList ? this.parentList.lists : this.lists;

      // Cancel if the disc does not exist
      if (opt_discIndex > lists.length - 1) {
        return;
      }

      for (var i = 0, l = lists.length; i < l; i++) {
        items = items.concat(lists[i].model.items);

        if (opt_discIndex !== undefined && i < opt_discIndex) {
          index += lists[i].length;
        }
      }

      model = this.isPartOfDiscsList ? this.model : this.lists[0].model;

    } else {
      model = this.model;
      items = model.items;
    }

    var item = items[index];

    // Play track in context or single track
    if (this.isTrackList && item && item instanceof models.Track) {
      if (this.contextGroup) {
        models.player.playContextGroup(this.contextGroup, this._indexInContextGroup, index);
        model.contextHasUpdates = false;
      } else if (model.context) {
        models.player.playContext(model.context, index);
        model.contextHasUpdates = false;
      } else {
        models.player.playTrack(item);
      }

      this.dispatchEvent('play');
    }
  };

  /**
   * Set a new item, which could be a collection.
   * This will clear the current list and refresh it with the new content.
   *
   * @param {Collection|Album|Disc|Playlist} item The new item.
   * @param {(Album|Disc|Playlist)=} opt_context An optional new context.
   */
  List.prototype.setItem = function(item, opt_context) {
    if (this.destroyed) { return; }

    var self = this;
    var isCollection = item instanceof models.Collection;

    // Set the new context if provided
    if (opt_context) {
      this.options.context = opt_context;
    }

    // Both old and new item is a collection, then just switch collection
    if (!this.lists && isCollection) {
      this.model.setCollection(item);
      this.dispatchEvent({ type: 'set-item', item: item });
      this._resetContextGroup();
      this.refresh();

    // If the new item is not of the same type as the old one, load it
    } else {

      // Destroy all disc lists, if any
      if (this.lists) {
        this._callForEachList('destroy');
      }

      this.destroy();

      this.addEventListener('list-init', function handler() {
        self.removeEventListener('list-init', handler);
        self.dispatchEvent({ type: 'set-item', item: item });
        this._resetContextGroup();

        if (self._oldParentNode) {
          self._oldParentNode.appendChild(self.node);
        }
        this.init();
      });

      if (isCollection) {
        this._init(item);
      } else {
        this._loadItem(item);
      }
      this.destroyed = false;
    }
  };

  /**
   * Set a collection.
   * Deprecated, use setItem instead.
   *
   * @param {Collection} collection The new collection.
   */
  List.prototype.setCollection = function(collection) {
    if (this.destroyed) { return; }

    this.setItem(collection);
    this.dispatchEvent({ type: 'set-collection', collection: collection });
  };

  /**
   * Set a new context.
   * Setting a context will make the list use that context when playing tracks.
   * For this to work, the context will need to correspond to the collection
   * used to display the list, otherwise the wrong tracks will be played.
   *
   * @param {Object} context A valid context object.
   */
  List.prototype.setContext = function(context) {
    if (this.destroyed) { return; }

    if (this.lists) {
      for (var i = 0, l = this.lists.length; i < l; i++) {
        this.lists[i].model.context = context;
        this.lists[i].isOptionContext = true;
        this.lists[i].options.context = context;
      }
    } else {
      this.model.context = context;
      this.options.context = context;
    }
    this.isOptionContext = true;
    this.dispatchEvent({ type: 'set-context', context: context });
  };

  /**
   * Clear and refresh the list with the set collection.
   */
  List.prototype.refresh = function() {
    if (this.destroyed) { return; }

    this.clear();

    var lists = this.lists || [this];
    for (var i = 0, l = lists.length; i < l; i++) {
      lists[i].view.setFixedHeight();
      if (lists[i].throbber) {
        lists[i].throbber.show();
        if (lists[i].options.throbber === 'show-content') {
          lists[i].throbber.showContent();
        }
      }
      lists[i].model.makeInitialSnapshots();
      lists[i].dispatchEvent('refresh');
    }

    if (this.lists) {
      this.dispatchEvent('refresh');
    }
  };

  /**
   * Clear the list and reset everything.
   */
  List.prototype.clear = function() {
    if (this.destroyed) { return; }

    var lists = this.lists || [this];
    for (var i = 0, l = lists.length; i < l; i++) {
      lists[i].model.reset();
      lists[i].view.reset();
      lists[i].dispatchEvent('clear');
    }
    if (this.lists) {
      this.dispatchEvent('clear');
    }
  };

  /**
   * Remove the list from the DOM and remove any event handlers.
   */
  List.prototype.destroy = function() {
    if (this.destroyed) { return; }

    // Remove DOM node
    if (this.node.parentNode) {
      this._oldParentNode = this.node.parentNode;
      this.node.parentNode.removeChild(this.node);
    }

    // Remove event handlers
    if (this.eventHandlers) {
      for (var i = 0, l = this.eventHandlers.length, obj; i < l; i++) {
        obj = this.eventHandlers[i];
        if (obj.dom) {
          dom.removeEventListener(obj.obj, obj.type, obj.handler);
        } else if (obj.obj && obj.obj.removeEventListener) {
          obj.obj.removeEventListener(obj.type, obj.handler);
        }
      }
    }

    // Remove list from global list storage
    var groupIndex = this.node.getAttribute('data-connected-lists-index');
    var listGroup = ListView.listViewConnectedContainerArray[groupIndex];
    if (listGroup) {
      var listIndex = listGroup.indexOf(this);
      if (listIndex > -1) {
        listGroup.splice(listIndex, 1);
      }
    }

    // Remove contextmenu event handler (which is added as a property)
    this.view.nodes.tableBody.oncontextmenu = null;

    delete this.lists;
    delete this.node;
    delete this.model;
    delete this.view;
    delete this.eventHandlers;
    delete this.length;
    delete this.isDiscsList;
    delete this.isPartOfDiscsList;
    delete this.isDisc;
    delete this.discNumber;
    delete this.throbber;

    this.destroyed = true;
    this.initialized = false;
  };

  /*
   * Connect this list with another list.
   * This list will come before the other list.
   * Connecting lists will make selection within them unified,
   * and tracks will continue play in the next list.
   *
   * @param {List} list Another list instance.
   *
   * @return {List} This list instance.
   */
  List.prototype.connect = function(list) {
    if (this.destroyed) { return; }

    this.nextList = list;
    list.previousList = this;

    // Add list to selection object
    var thisList = this.lists ? this.lists[this.lists.length - 1] : this;
    var listHasBeenMoved = false;
    var lists = list.lists || [list];
    var lastListIndex = thisList.listIndex;
    var connectedGroups, connectedLists, listIndex, thisListIndex;
    for (var i = 0, l = lists.length; i < l; i++) {
      thisList.view.selection.addList(lists[i]);
      if (lists[i].view.selection && lists[i].view.selection.isDndAdded) {
        thisList.view.selection.isDndAdded = true;
      }
      lists[i].view.selection = thisList.view.selection;
      lastListIndex++;
      lists[i].listIndex = lastListIndex;

      // If the passed in list has already been added to a global storage,
      // we want to move it inside the storage to be in the same group as
      // this list instance.
      if (lists[i]._connectedListsIndex !== undefined || (!listHasBeenMoved && list._connectedListsIndex !== undefined)) {
        var storedList = lists[i];
        if (lists[i]._connectedListsIndex === undefined && list._connectedListsIndex !== undefined) {
          listHasBeenMoved = true;
          storedList = list;
        }
        connectedGroups = ListView.listViewConnectedContainerArray;
        connectedLists = connectedGroups[storedList._connectedListsIndex];
        listIndex = connectedLists.indexOf(storedList);
        thisListIndex = connectedLists.indexOf(this);

        // Check if this list and the other list is in different groups in storage
        if (thisListIndex === -1 && listIndex > -1) {
          connectedLists.splice(listIndex, 1);
          if (lists[i].view.listViewDocMouseDownHandler) {
            dom.removeEventListener(document, 'mousedown', lists[i].view.listViewDocMouseDownHandler);
          }

          for (var n = 0, len = connectedGroups.length; n < len; n++) {
            thisListIndex = connectedGroups[n].indexOf(this);
            if (thisListIndex > -1) {
              connectedGroups[n].push(storedList);
              storedList._connectedListsIndex = n;
              storedList.node.setAttribute('data-connected-lists-index', n);
              break;
            }
          }
        }
      }
    }

    if (!this.isPartOfDiscsList) {

      // Retry if the list is not initialized
      var self = this;
      if (!this.initialized && (this.numConnectTries || 0) < 50) {
        setTimeout(function() {
          self.numConnectTries = (self.numConnectTries || 0) + 1;
          self.connect(list);
        }, 100);
        return;
      } else if (this.numConnectTries >= 50) {
        this.numConnectTries = 0;
        return;
      }
      this.numConnectTries = 0;

      if (!this._inContextGroup) {
        this._addToContextGroup(this);
      }

      this._addToContextGroup(list);
    }
    return this;
  };

  /**
   * Set focus for this list.
   */
  List.prototype.focus = function() {
    if (this.destroyed) { return; }

    if (this.isDiscsList) {
      this.lists[0].view.focus();
      return;
    }

    this.view.focus();
  };

  /**
   * Unfocus this list.
   */
  List.prototype.blur = function() {
    if (this.destroyed) { return; }

    if (this.isDiscsList) { this._callForEachList('blur'); return; }

    this.view.blur();
  };

  /**
   * Select an item.
   * This will deselect the current item.
   *
   * @param {number} index The index within the list.
   */
  List.prototype.selectItem = function(index) {
    if (this.destroyed) { return; }

    if (this.isDiscsList) {
      var offset = 0;
      var lists = this.lists;
      var list;
      var i = 0;

      while (index > offset && lists[i]) {
        list = lists[i];
        offset += list.length;
        i++;
      }

      index = index - (offset - list.length);
      list.view.selection.add(index, list.listIndex);
      list.view.selection.setOrigin(index, list.listIndex);

      return;
    }

    this.view.selection.add(index, this.listIndex);
    this.view.selection.setOrigin(index, this.listIndex);
  };

  /**
   * Deselect the current item, or all items in connected lists.
   *
   * @param {boolean} deselectConnected If true, deselect items in all connected lists.
   */
  List.prototype.deselect = function(deselectConnected) {
    if (this.destroyed) { return; }

    if (deselectConnected && this.isDiscsList) {
      this.lists[0].view.deselect(deselectConnected);
      return;
    } else if (this.isDiscsList) {
      this._callForEachList('deselect');
      return;
    }

    this.view.deselect(deselectConnected);
  };

  /**
   * Get data for all selected items.
   *
   * @param {Object=} opt_options Options for what to get. Could contain:
   *     onlyThisList: (boolean) If true, it gets selection data for only this list.
   *         Default is false, which means it will get data for all connected lists.
   *
   * @return {Object} Object containing indices, uris and items for selection.
   */
  List.prototype.getSelection = function(opt_options) {
    var options = opt_options || {};

    var list = this;
    if (this.lists && this.lists.length > 0) {
      list = this.lists[0];
    }
    return list.view.selection.getSelectionData(options.onlyThisList ? this.listIndex : undefined);
  };

  /**
   * Parse options and use defaults for options that are not provided.
   * The options will be put in the property options of the instance.
   *
   * @private
   *
   * @param {Object} options Object of options.
   */
  List.prototype._parseOptions = function(options) {
    var defaults = {
      type: 'tracks',
      layout: 'default',
      height: 'dynamic',
      header: 'fixed',
      numBuckets: 3,
      fetch: 'scroll',
      unplayable: 'disabled',
      style: 'plain',
      visualOffset: 0,
      throbber: 'none'
    };

    // Set the parent list if this is a disc
    if (options && options.parentList) {
      this.parentList = options.parentList;
      if (!this.parentList.lists) {
        this.parentList.lists = [this];
      }
      delete options.parentList;
    }

    // Copy the options
    var optionsWithDefaults = extendObject({}, options);

    // Set up options, and fall back on defaults
    for (var prop in defaults) {
      optionsWithDefaults[prop] = optionsWithDefaults[prop] === undefined ? defaults[prop] : optionsWithDefaults[prop];
    }

    var types = ['tracks', 'artists', 'albums'];
    var layouts = ['default', 'toplist'];

    this.options = optionsWithDefaults;
    this._originalOptions = options;
    this.layout = ~layouts.indexOf(optionsWithDefaults.layout) ? optionsWithDefaults.layout : 'default';
    this.type = ~types.indexOf(optionsWithDefaults.type) ? optionsWithDefaults.type : 'tracks';
    this.isTrackList = this.type === 'tracks';
    this.options.header = this.layout === 'toplist' ? 'no' : this.options.header;
  };

  /*
   * Initialize a list instance.
   * These are things that should normally happen in the constructor,
   * but might be deferred until we know if this is an album with
   * multiple discs.
   *
   * @private
   *
   * @param {Collection} collection A collection object.
   */
  List.prototype._init = function(collection) {
    var self = this;

    this.eventHandlers = [];
    this.length = 0;
    this.isDiscsList = false;
    this.isPartOfDiscsList = !!this.options.isDisc;
    this.isDisc = this.isPartOfDiscsList || (collection.className === 'Disc');
    if (this.isDisc) {
      this.discNumber = this.options.discNumber;
    }

    this.model = new ListModel(collection, this);
    this.view = new ListView(this);
    this.node = this.view.node;

    function snapshotDone(e) { self.view.createItems(e.start, e.end); }
    this.eventHandlers.push({ type: 'snapshot', handler: snapshotDone, obj: this, dom: false });
    this.addEventListener('snapshot', snapshotDone);
    this.eventHandlers.push({ type: 'insert', handler: snapshotDone, obj: this, dom: false });
    this.addEventListener('insert', snapshotDone);

    function itemsRemoved(e) { self.view.removeItems(e.start, e.end); }
    this.eventHandlers.push({ type: 'remove', handler: itemsRemoved, obj: this, dom: false });
    this.addEventListener('remove', itemsRemoved);

    function fieldsLoaded(e) { self.view.addFields(); }
    this.eventHandlers.push({ type: 'fields-loaded', handler: fieldsLoaded, obj: this, dom: false });
    this.addEventListener('fields-loaded', fieldsLoaded);

    this.model.init();
    this.view.init();

    this.dispatchEvent({ type: 'list-init', from: 'init' });
  };

  /**
   * Load the tracks collection from an item that is not a collection.
   *
   * @private
   *
   * @param {Album|Disc|Playlist} item An API object.
   */
  List.prototype._loadItem = function(item) {
    var self = this;
    var isAlbum = item instanceof models.Album;

    this.item = item;

    // Add temporary node so that the user can add it to the DOM
    if (!this.node && !this._oldParentNode) {
      this.node = document.createElement('div');
      this.node.className = 'sp-list';
    }

    if (!this.options.context) {
      this.options.context = item;
    }

    if (isAlbum) {
      item.load('discs').done(function() {
        var discs = item.discs;
        var numDiscs = discs.length;

        // Handle an album with one disc like a normal list
        if (numDiscs === 1) {
          discs[0].load('tracks').done(function(disc) {
            disc.tracks.className = 'Album';
            self._init(disc.tracks);
          });

        // Handle an album with multiple discs by creating a new list instance for each disc
        } else {
          var promises = [];
          for (var i = 0; i < numDiscs; i++) {
            promises.push(discs[i].load('tracks'));
          }
          models.Promise.join(promises).done(function() {
            self._createDiscs(discs);
          });
        }
      });

    } else {
      item.load('tracks').done(function() {
        var className;
        if (item instanceof models.Disc) {
          className = 'Disc';
        } else if (item instanceof models.Playlist) {
          className = 'Playlist';
        }
        item.tracks.className = className;
        self._init(item.tracks);
      });
    }
  };

  /**
   * Create a new list instance for each disc.
   *
   * @private
   *
   * @param {Array} discs An array of Disc objects.
   */
  List.prototype._createDiscs = function(discs) {
    if (this.destroyed) { return; }

    var wrapperNode = document.createElement('div');
    wrapperNode.className = 'sp-list sp-list-discs-wrapper';

    var options;
    var lists = [];
    for (var i = 0, l = discs.length; i < l; i++) {
      options = extendObject({}, this._originalOptions);
      options.context = this.options.context;
      options.isDisc = true;
      options.discNumber = i + 1;
      options.parentList = this;
      discs[i].tracks.className = 'Disc';
      lists[i] = new List(discs[i].tracks, options);
      wrapperNode.appendChild(lists[i].node);

      if (lists[i - 1]) {
        lists[i - 1].connect(lists[i]);
      }
    }

    this.numDiscsInitialized = 0;
    this.numDiscs = discs.length;

    if (this.node) {
      var connectedListsIndex = this.node.getAttribute('data-connected-lists-index');
      if (connectedListsIndex) {
        wrapperNode.setAttribute('data-connected-lists-index', connectedListsIndex);
      }
    }

    if (this.node && this.node.parentNode) {
      this.node.parentNode.replaceChild(wrapperNode, this.node);
    }
    this.node = wrapperNode;
    this.isDiscsList = true;
    this.lists = lists;

    this.dispatchEvent({ type: 'list-init', from: 'createDiscs' });
  };

  /**
   * Create a throbber for the list.
   *
   * @private
   */
  List.prototype._createThrobber = function() {
    var throbberOption = this.options.throbber;

    if (throbberOption === 'none') return;

    var throbber = Throbber.forElement(this.node, 50);
    this.throbber = throbber;

    if (throbberOption === 'show-content') {
      throbber.showContent();
    }

    var list = this;
    function hideThrobber() {
      if (list.layout === 'toplist') {
        setTimeout(function() {
          throbber.hide();
        }, 50);
      } else {
        throbber.hide();
      }
    }
    this.eventHandlers.push({ type: 'initial-snapshots-load', handler: hideThrobber, obj: this, dom: false });
    this.addEventListener('initial-snapshots-load', hideThrobber);

    function repositionThrobber() { throbber.setPosition(); }
    this.eventHandlers.push({ type: 'resize', handler: repositionThrobber, obj: window, dom: true });
    dom.addEventListener(window, 'resize', repositionThrobber);
  };

  /**
   * Add a context for a list to a context group.
   * If no context group has been created, one will be created.
   * All connected lists will share the same context group object.
   *
   * @private
   *
   * @param {List} list A list instance.
   */
  List.prototype._addToContextGroup = function(list) {
    if (this.destroyed) { return; }

    // If a context group exists, add context to that
    if (this.contextGroup) {
      var lists = list.lists ? list.lists.concat([list]) : [list];
      var context = list.lists ? list.lists[0].model.context : list.model.context;
      var index = ++this.contextGroup.indexCounter;

      this.contextGroup.contexts.add(context);

      var _list;
      for (var i = 0, l = lists.length; i < l; i++) {
        _list = lists[i];
        _list.contextGroup = this.contextGroup;
        _list._indexInContextGroup = index;
        _list._inContextGroup = true;
      }

    // If the context group is currently being created, add context to waiting list
    } else if (this.contextGroup === false) {
      list.contextGroup = false;
      list._waitingLists = this._waitingLists;
      if (!list._inContextGroup && !~this._waitingLists.indexOf(list)) {
        this._waitingLists.push(list);
      }

    // If there is no context group at all, create one
    } else {
      this._waitingLists = [list];
      list._waitingLists = this._waitingLists;
      this.contextGroup = false;
      list.contextGroup = false;
      var timestamp = new Date().getTime();
      var self = this;

      models.Group.create('tmp_contextgroup_' + timestamp).done(function(group) {
        self.contextGroup = group;
        self.contextGroup.indexCounter = -1;

        // Add waiting contexts to the context group
        var lists = self._waitingLists;
        var context, index, _lists, _list;
        for (var i = 0, l = lists.length; i < l; i++) {
          if (lists[i] === undefined) { continue; }

          _lists = lists[i].lists ? lists[i].lists.concat([lists[i]]) : [lists[i]];
          context = lists[i].lists ? lists[i].lists[0].model.context : lists[i].model.context;
          index = ++self.contextGroup.indexCounter;

          group.contexts.add(context);

          // All sub-lists (discs) should have the same context data
          // If it's not an album with discs, only one iteration will be made
          for (var n = 0, len = _lists.length; n < len; n++) {
            _list = _lists[n];
            _list._indexInContextGroup = index;
            _list.contextGroup = group;
            _list._inContextGroup = true;
          }
        }

        // Clear the waiting list
        self._waitingLists.length = 0;
      });
    }
  };

  /**
   * Reset the context group with current content.
   */
  List.prototype._resetContextGroup = function() {
    if (this.destroyed) { return; }

    if (this.contextGroup) {
      var lists;
      if (this.lists) {
        lists = this.lists[0].model.getListChain(true);
      } else {
        lists = this.model.getListChain(true);
      }

      // Recreate the context group
      for (var i = 0, l = lists.length; i < l; i++) {
        delete lists[i].contextGroup;
        delete lists[i]._indexInContextGroup;
        delete lists[i]._inContextGroup;

        if (i > 0) {
          lists[i - 1]._addToContextGroup(lists[i]);
        } else {
          lists[0]._addToContextGroup(lists[0]);
        }
      }
    }
  };

  /**
   * Call a method for each disc list.
   *
   * @private
   *
   * @param {string} methodName The name of the method.
   * @param {Array}  args       Array of arguments to the method.
   */
  List.prototype._callForEachList = function(methodName, args) {
    if (this.isDiscsList) {
      args = args || [];
      var lists = this.lists;
      var list, method;
      for (var i = 0, l = lists.length; i < l; i++) {
        list = lists[i];
        method = list[methodName];
        if (typeof method === 'function') {
          method.apply(list, args);
        }
      }
    }
  };

  /*
   * @ignore
   */
  function extendObject(target, source) {
    for (var prop in source) {
      target[prop] = source[prop];
    }
    return target;
  }

});
