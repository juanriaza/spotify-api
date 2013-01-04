'use strict';

require(['$api/models', '$views/list/fields'], function(models, fields) {
  var LIST_FIELDS = fields.LIST_FIELDS;
  var DEFAULT_FIELDS = fields.DEFAULT_FIELDS;

  exports.ListModel = ListModel;

  /**
   * A list model for all the data logic.
   *
   * @constructor
   * @private
   *
   * @param {Collection} collection A collection of items.
   * @param {List}       list       The list instance.
   */
  function ListModel(collection, list) {
    this.list = list;
    this.setCollection(collection);
    this.reset();

    var self = this;
    models.session.load('device').done(function() {
      self.userDevice = models.session.device;
    });
  }

  /**
   * Set a collection and set up events.
   *
   * @param {Collection} collection The collection to use.
   */
  ListModel.prototype.setCollection = function(collection) {
    var item = this.list.item;

    // Remove the event handlers for the current collection if any
    if (this.collection) {
      item.removeEventListener('insert', this.lastInsertHandler);
      item.removeEventListener('remove', this.lastRemoveHandler);
    }

    // Set new collection
    this.collection = collection;

    // Add event handlers
    var self = this;
    var insertHandler = function(e) { self.insertItemsHandler(e); };
    this.list.eventHandlers.push({ type: 'insert', handler: insertHandler, obj: item, dom: false });
    item.addEventListener('insert', insertHandler);
    this.lastInsertHandler = insertHandler;

    var removeHandler = function(e) { self.removeItemsHandler(e); };
    this.list.eventHandlers.push({ type: 'remove', handler: removeHandler, obj: item, dom: false });
    item.addEventListener('remove', removeHandler);
    this.lastRemoveHandler = removeHandler;
  };

  /**
   * Reset the model.
   */
  ListModel.prototype.reset = function() {
    this.noMoreData = false;
    this.context = this.isOptionContext ? this.context : undefined;
    this.offset = 0;
    this.items = [];
    this.itemData = [];
    this.uris = [];
    this.tracksToAddToContext = [];
    this.snapshots = [];
    this.numFailedItems = 0;

    // Until we have another way to use the context other than creating
    // a temporary playlist, we have to restrict the number of concurrent
    // snapshots to only one, otherwise the tracks in the context will be
    // in the wrong order.
    this.maxConcurrentSnapshots = 1;
    this.numRunningSnapshots = 0;

    if (this.initialized) {
      this.createContext();
    }
  };

  /**
   * Initialize the model.
   */
  ListModel.prototype.init = function() {
    this.initialized = true;
    this.createContext();
    this.fields = this.getFields();
    this.properties = this.getNeededProperties();
    this.calculateTotalFieldWidths();
    this.list.dispatchEvent('fields-loaded');
    if (this.list.parentList) {
      this.list.parentList.dispatchEvent('fields-loaded');
    }

    var self = this;
    this.list.addEventListener('resize', function() {
      self.calculateFieldWidths();
    });
  };

  /**
   * Create a context for the list.
   * If the user has specified one, that one will be used.
   * If not, a temporary playlist will be generated and tracks
   * will be added when snapshots are made.
   */
  ListModel.prototype.createContext = function() {

    // Use the specified context if provided in the options
    if (this.list.options.context) {
      this.context = this.list.options.context;
      this.isOptionContext = true;
      return;
    }

    // Only create a context when the list is a track list
    if (this.list.isTrackList) {
      var self = this;
      var tempID = 'tmp_' + new Date().getTime();
      models.Playlist.createTemporary(tempID).done(function(playlist) {
        playlist.load('uri', 'tracks').done(function() {
          self.context = playlist;

          if (self.tracksToAddToContext.length > 0) {
            playlist.tracks.add(self.tracksToAddToContext);
            self.contextHasUpdates = true;
          }
          self.tracksToAddToContext = null;
        });
      });
    }
  };

  /**
   * Make the initial snapshots when the list is created.
   */
  ListModel.prototype.makeInitialSnapshots = function() {
    var self = this;
    var numItems = this.list.options.numItems;
    var numItemsPerBucket = this.numItemsPerBucket;
    if (numItems <= numItemsPerBucket) {
      this.list.options.numBuckets = 1;
    }
    var numSnapshotsTotal = this.list.options.numBuckets;
    var numSnapshotsDone = 0;
    var snapshotDone = function() {

      // If fetch is set to greedy, get all items
      if (self.list.options.fetch === 'greedy') {
        if (self.offset < (self.totalLength || 1)) {
          self.snapshot(null, null, snapshotDone);
        } else {
          self.list.dispatchEvent('initial-snapshots');
          if (self.list.parentList) {
            self.list.parentList.dispatchEvent('initial-snapshots');
          }
        }

      // otherwise fetch the specified number of buckets
      } else {
        if (numSnapshotsDone++ < numSnapshotsTotal && !self.noMoreData) {
          self.snapshot(null, null, snapshotDone);
        } else {
          self.list.dispatchEvent('initial-snapshots');
          if (self.list.parentList) {
            self.list.parentList.dispatchEvent('initial-snapshots');
          }
        }
      }
    };

    var numSnapshotsLoaded = 0;
    var snapshotLoaded = function() {
      numSnapshotsLoaded++;

      if (numSnapshotsLoaded === numSnapshotsTotal || self.noMoreData) {
        self.list.removeEventListener('snapshot-load', snapshotLoaded);
        self.list.dispatchEvent({ type: 'initial-snapshots-load', snapshots: self.snapshots.slice(0, numSnapshotsTotal) });
        if (self.list.parentList) {
          self.list.parentList.dispatchEvent({ type: 'initial-snapshots-load', snapshots: self.snapshots.slice(0, numSnapshotsTotal) });
        }

        models.player.load('context', 'track').done(function() {
          self.list.view.playerChange(models.player);
        });
      }
    };
    self.list.addEventListener('snapshot-load', snapshotLoaded);

    snapshotDone();
  };

  /**
   * Make a snapshot of the collection for the current offset.
   * The items from the snapshot will be appended to the items array.
   *
   * @param {?number=} opt_offset Offset for the snapshot. If null, default is used.
   * @param {?number=} opt_length Length of the snapshot. If null, default is used.
   * @param {Function=} opt_callback Optional callback for when the snapshot is
   *     done.
   */
  ListModel.prototype.snapshot = function(opt_offset, opt_length, opt_callback) {
    if (this.list.destroyed) { return; }

    if (this.numRunningSnapshots >= this.maxConcurrentSnapshots) {
      return;
    }
    this.numRunningSnapshots++;

    var numItems = this.list.options.numItems;
    if (numItems && (this.offset - this.numFailedItems) >= numItems) {
      return;
    }

    if (this.noMoreData) {
      return;
    }

    this.list.dispatchEvent('snapshot-start');
    if (this.list.parentList) {
      this.list.parentList.dispatchEvent('snapshot-start');
    }

    var self = this;
    var offset = opt_offset || this.offset;
    var length = opt_length || this.numItemsPerBucket;
    this.offset += length;
    this.collection.snapshot(offset, length).done(function(snap) {
      if (self.list.destroyed) { return; }

      self.totalLength = snap.length;
      snap = snap.toArray();

      var start = offset;
      var end = start + snap.length;

      self.snapshots.push({
        start: start,
        end: end,
        numItemsLoaded: 0,
        numItems: snap.length
      });
      var snapshotIndex = self.snapshots.length - 1;

      if (!self.list.view.nodeHeightAdjusted) {
        self.list.view.setNodeHeightFromNumItems();
      }

      var eventObject = { type: 'snapshot', start: start, end: end, length: snap.length, items: [] };

      if (snap.length === 0) {
        self.noMoreData = true;
        self.list.dispatchEvent(eventObject);
        if (self.list.parentList) { self.list.parentList.dispatchEvent(eventObject); }

        if (self.items.length === 0) {
          self.list.dispatchEvent({ type: 'snapshot-load', index: 0, items: [] });
          self.list.dispatchEvent({ type: 'empty' });
          self.list.dispatchEvent({ type: 'visually-empty' });
        }
        return;
      }

      for (var i = 0, l = snap.length, n = start; i < l; i++, n++) {
        self.items[n] = snap[i];
        self.itemData[n] = {snapshotIndex: snapshotIndex};
        self.uris[n] = snap[i].uri;
      }
      self.list.length += l;

      // Add track to context if the user did not provide one
      if (self.list.isTrackList && !self.isOptionContext) {
        if (self.context && self.tracksToAddToContext === null) {
          self.context.tracks.add(snap);
          self.contextHasUpdates = true;
        } else {
          self.tracksToAddToContext = self.tracksToAddToContext.concat(snap);
        }
      }

      self.numRunningSnapshots--;
      if (end === self.totalLength) {
        self.noMoreData = true;
      }
      eventObject.items = self.items.slice(start, end);
      self.list.dispatchEvent(eventObject);
      if (self.list.parentList) { self.list.parentList.dispatchEvent(eventObject); }

      if (opt_callback) opt_callback();
    });
  };

  /**
   * Get all connected lists.
   *
   * @return {Array} An array of lists.
   */
  ListModel.prototype.getListChain = function(onlyTopLevel) {
    var lists = [];
    var rootList = this.list.parentList && onlyTopLevel ? this.list.parentList : this.list;

    // Get all lists before this one
    var previousList = rootList.previousList || (rootList.parentList ? rootList.parentList.previousList : undefined);
    while (previousList) {
      if (previousList.lists && !onlyTopLevel) {
        previousList = previousList.lists[previousList.lists.length - 1];
      }
      lists.push(previousList);
      if (previousList.parentList && !previousList.previousList && !onlyTopLevel) {
        previousList = previousList.parentList;
      }
      previousList = previousList.previousList;
    }
    lists.reverse();

    // Add this list
    var currentListIndex = lists.length;
    lists.push(rootList);

    // Get all lists after this one
    var nextList = rootList.nextList || (rootList.parentList ? rootList.parentList.nextList : undefined);
    while (nextList) {
      if (nextList.lists && !onlyTopLevel) {
        nextList = nextList.lists[0];
      }
      lists.push(nextList);
      if (nextList.parentList && !nextList.nextList && !onlyTopLevel) {
        nextList = nextList.parentList;
      }
      nextList = nextList.nextList;
    }

    lists.currentIndex = currentListIndex;

    return lists;
  };

  /**
   * Replace the field names with a data object.
   */
  ListModel.prototype.getFields = function() {
    var typePrefixes, typePrefix, fields, objectFields, i, l, id, n;

    typePrefixes = {
      tracks: 'track-',
      albums: 'album-',
      artists: 'artist-'
    };
    typePrefix = typePrefixes[this.list.type] || '';

    if (!this.list.options.fields) {
      this.list.options.fields = DEFAULT_FIELDS[this.list.layout][this.list.type];
    }
    fields = this.list.options.fields;

    // The star field should not be used on the web, so it gets replaced
    var starFieldIndex = fields.indexOf('star');
    if (starFieldIndex !== -1) {
      if (this.userDevice === 'web') {
        fields[starFieldIndex] = 'nowplaying';
      }
    }

    objectFields = [];

    for (i = 0, l = fields.length; i < l; i++) {
      if (typeof fields[i] === 'string') {
        id = ~' popularity image '.indexOf(' ' + fields[i] + ' ') ? typePrefix + fields[i] : fields[i];
        id = id === 'trackartist' ? 'artist' : id;
        objectFields[i] = { id: id };

        // Set flag for star field, which will make the number field show the now playing
        // icon if the star field is not included.
        if (id === 'star') {
          this.hasStarField = true;
        }

        // Get field properties
        for (n in LIST_FIELDS[id]) {
          objectFields[i][n] = LIST_FIELDS[id][n];
        }

        if (fields[i] === 'trackartist') {
          objectFields[i].widthWeight = 5;
        }
      } else {
        objectFields[i] = fields[i];
      }
    }

    return objectFields;
  };

  /**
   * Get all needed properties for a list item.
   * Depending on the list type, different properties are needed.
   * We also need to get all properties needed by the chosen fields.
   *
   * @return {Object} An object containing the properties, grouped for different item types.
   */
  ListModel.prototype.getNeededProperties = function() {
    var neededProps = { track: [], album: [], artist: [] };
    var isArtistsNeeded, isAlbumNeeded;

    // Get all properties needed by the chosen fields
    var fieldName, field, itemName, props, i, l, prop;
    for (fieldName in this.fields) {
      field = this.fields[fieldName];
      for (itemName in field.neededProperties) {
        if (itemName === 'artist') { isArtistsNeeded = true; }
        if (itemName === 'album') { isAlbumNeeded = true; }
        props = field.neededProperties[itemName];
        for (i = 0, l = props.length; i < l; i++) {
          prop = props[i];
          if (!~(' ' + neededProps[itemName].toString().replace(/,/g, ' ') + ' ').indexOf(' ' + prop + ' ')) {
            neededProps[itemName].push(prop);
          }
        }
      }
    }

    // The properties artists and album will be added automatically if needed by the fields.
    //  They are sub-items that also need to be loaded separately.
    if (isArtistsNeeded) {
      neededProps.track.push('artists');
      neededProps.album.push('artists');
    }
    if (isAlbumNeeded) { neededProps.track.push('album'); }

    if (this.list.isTrackList) {

      // Needed for detecting unplayable tracks
      neededProps.track.push('playable');

      // Needed for drag tooltips
      if (!~neededProps.track.indexOf('name')) {
        neededProps.track.push('name');
      }
      if (!~neededProps.track.indexOf('artists')) {
        neededProps.track.push('artists');
        if (!~neededProps.artist.indexOf('name')) {
          neededProps.artist.push('name');
        }
      }
    }

    // Get which properties to load for the original item
    var neededTypeProps = {
      tracks: neededProps.track,
      albums: neededProps.album,
      artists: neededProps.artist
    };
    var neededProperties = neededTypeProps[this.list.type];

    // Return the properties
    return {
      item: neededProperties,
      album: neededProps.album,
      artist: neededProps.artist
    };
  };

  /**
   * Get total widths for the fields.
   * That will be used to calculate the width of each field.
   */
  ListModel.prototype.calculateTotalFieldWidths = function() {
    var fields, i, l, totalWeight, totalFixedWidth;

    fields = this.fields;
    totalWeight = 0;
    totalFixedWidth = 0;

    for (i = 0, l = fields.length; i < l; i++) {
      fields[i].fixedWidth = this.list.options.header === 'no' && fields[i].fixedWidthNoHeader || fields[i].fixedWidth;
      if (this.list.layout === 'toplist') {
        if (~fields[i].id.indexOf('-image') && fields[i].fixedWidth) {
          fields[i].fixedWidth = 40;
        }
        if (~fields[i].id === 'ordinal' && fields[i].fixedWidth) {
          fields[i].fixedWidth = 30;
        }
      }

      if (!fields[i].fixedWidth) {
        totalWeight += fields[i].widthWeight || 1;
      } else {
        totalFixedWidth += fields[i].fixedWidth;
      }
    }

    fields.totalWeight = totalWeight;
    fields.totalFixedWidth = totalFixedWidth;
  };

  /**
   * Calculate the width of each field.
   */
  ListModel.prototype.calculateFieldWidths = function() {
    var fields, fullWidth, i, l, field;
    fields = this.fields;

    fullWidth = this.list.view.fullWidth;
    fields.totalDynamicWidth = fullWidth - fields.totalFixedWidth;

    for (i = 0, l = fields.length; i < l; i++) {
      field = fields[i];
      if (field.fixedWidth) {
        field.width = field.fixedWidth;
      } else if (field.widthWeight) {
        if (!field.dynamicWidth) {
          field.dynamicWidth = field.widthWeight / fields.totalWeight;
        }
        field.width = (field.dynamicWidth * fields.totalDynamicWidth) / fullWidth;
      } else {
        field.width = 0;
      }
    }
  };

  /**
   * Load all the needed properties for an item.
   * When everything is loaded, the callback will be fired.
   *
   * @param {number}   index    The index for the item.
   * @param {Function} callback Function that will be called when everything needed has been loaded.
   */
  ListModel.prototype.loadItem = function(index, callback) {
    if (this.list.destroyed) { return; }

    var self = this;
    var list = this.list;
    var properties = this.properties;
    var item = this.items[index];
    var returnObject = { index: index, list: list };

    var isArtistsNeeded = properties.artist.length > 0;
    var isAlbumNeeded = properties.album.length > 0;
    var isTrackList = list.type === 'tracks';
    var isAlbumList = list.type === 'albums';
    var isArtistList = list.type === 'artists';
    var isCustomList = list.type === 'custom';
    var isArtistsLoaded = false;
    var isAlbumLoaded = false;

    var loaded = function(obj, type) {
      if (type === 'album') {
        isAlbumLoaded = true;
        returnObject.album = obj;
      }
      if (type === 'artists') {
        isArtistsLoaded = true;
        returnObject.artists = obj;
      }

      var albumDone = isAlbumNeeded ? isAlbumLoaded : true;
      var artistsDone = isArtistsNeeded ? isArtistsLoaded : true;

      if (albumDone && artistsDone) {
        callback(returnObject);
      }
    };

    item.load(properties.item).done(function() {
      if (self.list.destroyed) { return; }

      if (isTrackList) {
        returnObject.track = item;
      }

      if (isAlbumList) {
        returnObject.album = item;
        isAlbumLoaded = true;
      }

      if (isTrackList && isAlbumNeeded) {
        var loadComplete = function() { loaded(item.album, 'album'); };
        item.album.load(properties.album).done(loadComplete).fail(loadComplete);
      }

      if ((isTrackList || isAlbumList) && isArtistsNeeded) {
        var promises = [];
        for (var i = 0, l = item.artists.length; i < l; i++) {
          promises.push(item.artists[i].load(properties.artist));
        }
        var loadComplete = function() { loaded(item.artists || [], 'artists'); };
        models.Promise.join(promises).done(loadComplete).fail(loadComplete);
      }

      if (isTrackList && !isAlbumNeeded && !isArtistsNeeded) {
        callback(returnObject);
      }

      if (isAlbumList && !isArtistsNeeded) {
        returnObject.album = item;
        callback(returnObject);
      }

      if (isArtistList) {
        returnObject.artists = [item];
        callback(returnObject);
      }

      if (isCustomList) {
        callback(returnObject);
      }
    }).fail(function() {

      // If there should be a specific amount of items in the list,
      // and this item failed, we need to load one more item.
      if (self.list.options.numItems) {
        self.numFailedItems++;
        self.snapshot(null, 1);
      }

      callback({ error: true });
    });
  };

  /**
   * Fetch more items from the collection and add it to the list.
   * Only do it with a certain interval, so we don't get too many
   * in a short amount of time.
   *
   * @param {number} limit Number of milliseconds between tries.
   */
  ListModel.prototype.moreWithLimit = function(limit) {
    if (this.list.destroyed) { return; }

    if (this.list.model.noMoreData) {
      return;
    }

    limit = limit || 1000;
    var timeLastFetch = this.timeLastFetch || 0;
    var timeDiff = new Date().getTime() - timeLastFetch;

    // Fetch more immediately if the time diff is big enough
    if (timeDiff > limit) {
      this.timeLastFetch = new Date().getTime();
      this.isFetchingMore = true;
      this.list.dispatchEvent('scroll-fetch');
      if (this.list.parentList) { this.list.parentList.dispatchEvent('scroll-fetch'); }
      this.list.more();

    // Wait a short period before fetching more if the time diff is not big enough
    } else {
      var self = this;
      setTimeout(function() {
        if (self.timeLastFetch === timeLastFetch) {
          self.timeLastFetch = new Date().getTime();
          self.isFetchingMore = true;
          self.list.dispatchEvent('scroll-fetch');
          if (self.list.parentList) { self.list.parentList.dispatchEvent('scroll-fetch'); }
          self.list.more();
        }
      }, 100);
    }
  };

  /**
   * Handler for inserting items to the list when the data source updates.
   *
   * @param {Object} e Event object with data.
   */
  ListModel.prototype.insertItemsHandler = function(e) {
    var addedUris = e.uris.slice();
    var index = e.index;
    var length = addedUris.length;

    // Abort if the items are not even in the list
    if (index > this.items.length - 1 && !this.noMoreData) {
      return;
    }

    // Add a new snapshot object, as this can be seen as a snapshot since it gets new data
    this.snapshots.push({
      start: index,
      end: index + length,
      numItemsLoaded: 0,
      numItems: length
    });

    // Create track objects from the URIs
    var Track = models.Track;
    var snapshotIndex = this.snapshots.length - 1;
    var addedData = [];
    for (var i = 0; i < length; i++) {
      addedUris[i] = Track.fromURI(addedUris[i]);
      addedData[i] = {snapshotIndex: snapshotIndex};
    }

    // Update the length of the list
    this.list.length += length;
    this.totalLength += length;

    // Add the items to the data storage
    this.items.splice.apply(this.items, [index, 0].concat(addedUris));
    this.itemData.splice.apply(this.itemData, [index, 0].concat(addedData));
    this.uris.splice.apply(this.uris, [index, 0].concat(e.uris));

    // Reset the offset to match the list content
    this.offset += length;

    // Reset height of the list view
    if (this.list.options.numItems > 0) {
      this.list.view.setNodeHeightFromNumItems();
    }

    // Broadcast event to make the view update
    this.list.dispatchEvent({ type: 'insert', start: index, end: index + length });
  };

  /**
   * Handler for removing items from the list when the data source updates.
   *
   * @param {Object} e Event object with data.
   */
  ListModel.prototype.removeItemsHandler = function(e) {
    var items = this.items;
    var itemData = this.itemData;
    var uris = this.uris;
    var removedUris = e.uris;
    var indices = e.indices;
    var toBeRemoved = [];

    // Check each track if it should be removed
    for (var j = 0, l = indices.length; j < l; j++) {
      var index = indices[j];
      if (index > items.length - 1) continue;
      if (items[index].uri == removedUris[j]) toBeRemoved.push(index);
    }
    toBeRemoved.sort(function(a, b) { return a - b; });

    // Save the index that was before the first removed item
    var shownIndices = this.list.view.shownIndices;
    var indexBefore = shownIndices[shownIndices.indexOf(toBeRemoved[0]) - 1] || shownIndices[0];

    // Remove the items from data storage and the view
    for (var i = toBeRemoved.length; i--;) {
      var removeIndex = toBeRemoved[i];

      // Unsubscribe to the change event, if it was subscribed to before
      if (itemData[removeIndex].playableChangeHandler) {
        items[removeIndex].removeEventListener('change:playable', itemData[removeIndex].playableChangeHandler);
      }

      items.splice(removeIndex, 1);
      itemData.splice(removeIndex, 1);
      uris.splice(removeIndex, 1);

      // Broadcast event to make the view update
      this.list.dispatchEvent({ type: 'remove', start: removeIndex, end: removeIndex + 1 });
    }

    // Update the length of the list
    this.list.length -= toBeRemoved.length;
    this.totalLength -= toBeRemoved.length;

    // Reset the offset to match the list content
    this.offset -= toBeRemoved.length;

    // Reset height of the list view
    if (this.list.options.numItems > 0) {
      this.list.view.setNodeHeightFromNumItems();
    }

    // Update the ordinal field if it exists
    shownIndices = this.list.view.shownIndices;
    if (~this.list.options.fields.indexOf('ordinal') && toBeRemoved.length > 0 && shownIndices.length > 0) {
      this.list.view.updateOrdinalsFrom(indexBefore);
    }
  };

});
