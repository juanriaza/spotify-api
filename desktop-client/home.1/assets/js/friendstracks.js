'use strict';

var dom = sp.require('$util/dom'),
    array = sp.require('$util/array'),
    wnData = sp.require('assets/js/data');

var loadingEl = dom.queryOne('.loading');

var FriendsTracks = {

  _key: 'FriendsTracks',
  _loaded: false,
  _loadEvent: null,
  trackWrappers: null,
  stepCallback: function() {},
  tableCallback: function() {},

  /**
   * @this FriendsTracks
   * @constructor
   * @param {object} The data for friends' tracks.
   */
  init: function(data) {

    this._loadEvent = new dom.Event(this._key + '.load', true);
    if (!data || !data.tracks) {
      this._loaded = true;
      this._loadEvent.dispatch(window);
      return;
    }
    this.extend(data.tracks);
  },

  setTrackWrappers: function(trackWrappers) {
    this.trackWrappers = trackWrappers;
  },

  setStepCallback: function(fn) {
    this.stepCallback = fn;
  },

  setTableCallback: function(fn) {
    this.tableCallback = fn;
  },

  /**
   * Extend data received from discovery
   * @this FriendsTracks
   * @param {object} the data to be extended.
   */
  extend: function(data) {
    var self = this;
    sp.core.getMetadata(map(function(track) { return track.uri; }, data), {
      onSuccess: function(metadata) {
        for (var i = 0; i < data.length; i++) {
          data[i].metadata = metadata[i];
        }

        wnData.Data.set(self._key, data);
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
   * @this FriendsTracks
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
   * @this FriendsTracks
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

    self.tableCallback(this._key,
        wnData.Data.get(this._key),
        self.trackWrappers.shift(),
        function() {
          self.stepCallback(true);
        }
    );
  }
};

exports.FriendsTracks = FriendsTracks;
