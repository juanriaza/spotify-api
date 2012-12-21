/**
 * Copyright (c) 2012 Spotify Ltd
 * @author Martin Jönsson <mart@spotify.com>
 */

require([
  '$api/models',
  '$api/search#Search',
  '$views/list#List'
], function(models, Search, List) {

  function Data() {
    this.database = [];
  }

  Data.TIMEOUT = 5000;

  Data.PROPERTIES = {
    'artists': ['name', 'uri'],
    'albums': ['name', 'uri', 'artists'],
    'playlists': ['name', 'uri']
  };

  Data.prototype.getFuzzyMatch = function() {
    if (this.search.fuzzyMatch) {
      return this.search.fuzzyMatch;
    } else {
      return false;
    }
  };

  Data.prototype.getMaxLengths = function() {
    return this.maxLengths;
  };

  Data.prototype.getDatabase = function() {
    return this.database;
  };

  Data.prototype.loadSearch = function(query, categories, offset, maxAmount) {
    this.p = new models.Promise();
    this.search = Search.search(query);
    this.offset = offset;
    this.maxAmount = maxAmount;
    this.categories = categories;

    this.timeOut = setTimeout(function() {
      self.p.setFail();
    }, Data.TIMEOUT);

    this.search.load(this.categories)
      .done(this.onLoadDone.bind(this))
      .fail(this.onFail);

    var self = this;

    return this.p;
  };

  Data.prototype.onLoadDone = function() {
    clearTimeout(this.timeOut);
    this.p.object = this.search;
    this.p.setDone();
  };

  Data.prototype.onFail = function(err) {
    console.error(err);
  };

  Data.prototype.initList = function(collection) {
    console.log(collection);
    this.initTrackPromise = new models.Promise();
    var list = List.forCollection(collection, {
      context: collection,
      fields: ['star', 'track', 'artist', 'time', 'album', 'popularity'],
      height: 'fixed',
      throbber: 'hide-content'
    });
    this.initTrackPromise.object = list;
    this.initTrackPromise.setDone();

    return this.initTrackPromise;
  };

  Data.prototype.getData = function(collections) {
    this.dataPromise = new models.Promise();
    this.keys = Object.keys(collections);

    var promises = [];
    for (var i = 0, l = this.keys.length; i < l; i += 1) {
      promises[i] = collections[this.keys[i]].snapshot(this.offset, this.maxAmount);
    }

    models.Promise.join(promises)
      .done(this.onSnapshotDone.bind(this))
      .fail(this.onFail);

    return this.dataPromise;
  };

  Data.prototype.onSnapshotDone = function(snapshot) {
    var promises = [];
    this.maxLengths = {};

    for (var i = 0, l = snapshot.length; i < l; i += 1) {
      this.maxLengths[this.keys[i]] = snapshot[i].length;
      promises[i] = snapshot[i].loadAll(Data.PROPERTIES[this.keys[i]]);
    }

    models.Promise.join(promises)
      .done(this.onSnapshotsLoaded.bind(this))
      .fail(this.onFail);
  };

  Data.prototype.onSnapshotsLoaded = function(data) {
    var obj = {};
    for (var i = 0, l = data.length; i < l; i += 1) {
      if (data[i]) {
        this.database.push(data[i]);
        obj[this.keys[i]] = data[i];
      }
    }
    this.dataPromise.object = obj;
    this.dataPromise.setDone();
  };

  exports.Data = Data;

});
