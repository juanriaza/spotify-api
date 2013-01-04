/**
 * Copyright (c) 2012 Spotify Ltd
 * @author Martin Jönsson <mart@spotify.com>
 * @author Kalle Persson <awkalle@spotify.com>
 *
 * This is the Model for the search application,
 * all access to data is handled from here. The idea is to
 * have only one place where the app fetches data.
 * It should also be very easy to switch out the source.
 * For instance - to do a raw hermes call instead.
 */

require([
  '$api/models',
  '$api/search#Search',
  '$api/hermes',
  'scripts/config'.toPath()
], function(models, Search, Hermes, config) {


  function Data(logger) {
    this.logger = logger;
    this.database = [];
  }

  Data.prototype.getMaxLengths = function() {
    return this.maxLengths;
  };

  Data.prototype.getDatabase = function() {
    return this.database;
  };

  Data.prototype.loadSearch = function(query, options) {
    this.loadPromise = new models.Promise();
    this.options = options || {};

    this.search = Search.search(query);
    this.startTimeout(this.loadPromise);

    var self = this;
    this.search.load(this.options.categories)
      .done(function(data) { self.onLoadDone(data, self.loadPromise); })
      .fail(function(err) { self.onFail(err, self.loadPromise, 'loadFail'); });

    return this.loadPromise;
  };

  Data.prototype.getPeople = function(query) {
    this.peoplePromise = new models.Promise();
    this.startTimeout(this.peoplePromise);

    //TODO: Replace with people proto schema
    this.SUGGEST_PROTO_SCHEMA = Hermes.Schema.fromURL(['suggest.proto']);
    this.SUGGEST_PROTO_SCHEMA.transform('Album#gid', 'album_uri');
    this.SUGGEST_PROTO_SCHEMA.transform('Album#image', 'image_uri');
    this.SUGGEST_PROTO_SCHEMA.transform('Album#artist_gid', 'artist_uri');
    this.SUGGEST_PROTO_SCHEMA.transform('Artist#gid', 'artist_uri');
    this.SUGGEST_PROTO_SCHEMA.transform('Artist#image', 'image_uri');
    this.SUGGEST_PROTO_SCHEMA.transform('Track#gid', 'track_uri');
    this.SUGGEST_PROTO_SCHEMA.transform('Track#image', 'image_uri');
    this.SUGGEST_PROTO_SCHEMA.transform('Track#artist_gid', 'artist_uri');

    //Clearly this is not a request to get people,
    //but let's pretend that for now :)
    var peopleRequest = Hermes.Hermes.get(
        'hm://searchsuggest/suggest/' + query + '?country=SE',
        [this.SUGGEST_PROTO_SCHEMA.type('Suggestions')],
        []);

    var self = this;
    peopleRequest.send()
      .done(function(data) { self.maxLengths.people = 10; self.onLoadDone(data, self.peoplePromise); })
      .fail(function(err) { self.onFail(err, self.peoplePromise, 'peopleFail'); });

    return this.peoplePromise;
  };

  Data.prototype.onLoadDone = function(data, promise) {
    promise.object = data;
    this.stopTimeout(promise);
    promise.setDone();
  };

  Data.prototype.onFail = function(err, promise, reason) {
    if (promise) {
      promise.setFail();
    }
    console.error('Data failed!', err, reason);
  };

  Data.prototype.getFuzzyMatch = function() {
    var p = new models.Promise();

    if (this.search.fuzzyMatch) {
      p.object = this.search.fuzzyMatch;
      p.setDone();
    } else {
      this.search.load('fuzzyMatch').done(function(s) {
        p.object = s.fuzzyMatch;
        p.setDone();
      });
    }
    return p;
  };

  Data.prototype.getData = function(collections, categories) {
    this.categories = categories;
    this.dataPromise = new models.Promise();
    this.startTimeout(this.dataPromise);

    var promises = [];
    for (var i = 0, l = categories.length; i < l; i += 1) {
      promises[i] = collections[categories[i]].snapshot(this.options.start, this.options.amount);
    }

    var self = this;
    models.Promise.join(promises)
      .done(this.onSnapshotDone.bind(this))
      .fail(function(err) { self.onFail(err, self.dataPromise, 'dataFail'); });

    return this.dataPromise;
  };

  Data.prototype.onSnapshotDone = function(snapshot) {
    var promises = [];
    this.maxLengths = {};
    //this.p.setFail();

    for (var i = 0, l = snapshot.length; i < l; i += 1) {
      if (snapshot[i].length > 0) {
        this.maxLengths[this.categories[i]] = snapshot[i].length;
      }
      promises[i] = snapshot[i].loadAll(config.PROPERTIES[this.categories[i]]);
    }

    models.Promise.join(promises)
      .done(this.onSnapshotsLoaded.bind(this))
      .fail(this.onFail);
  };

  Data.prototype.onSnapshotsLoaded = function(data) {
    var obj = {};
    for (var i = 0, l = data.length; i < l; i += 1) {
      if (data[i] && data[i].length > 0) {
        this.database.push(data[i]);
        obj[this.categories[i]] = data[i];
      }
    }
    this.onLoadDone(obj, this.dataPromise);
  };

  Data.prototype.startTimeout = function(promise) {
    var self = this;
    clearTimeout(promise.timeOut);
    this.timeOut = setTimeout(function() {
      self.logger.clientEvent('promise timed out');
      promise.setFail();
    }, config.TIMEOUT);
  };

  Data.prototype.stopTimeout = function(promise) {
    clearTimeout(promise.timeOut);
  };

  exports.Data = Data;

});
