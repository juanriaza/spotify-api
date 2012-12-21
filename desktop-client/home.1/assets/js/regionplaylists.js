'use strict';

var dom = sp.require('$util/dom'),
    array = sp.require('$util/array'),
    wnData = sp.require('assets/js/data');

var loadingEl = dom.queryOne('.loading');
var RegionPlaylists = {

  _key: 'RegionPlaylists',
  _loaded: false,
  _loadEvent: null,
  playlistWrappers: null,
  stepCallback: function() {},
  pagerCalback: function() {},

  /**
   * @constructor
   * @this RegionPlaylists
   * @param {object} data the data to be used in the object.
   */
  init: function(data) {
    this._loadEvent = new dom.Event(this._key + '.load', true);

    if (!data || !data.playlists) {
      this._loaded = true;
      this._loadEvent.dispatch(window);
      return;
    }

    this.extend(data.playlists);
  },

  setPlaylistWrappers: function(playlistWrappers) {
    this.playlistWrappers = playlistWrappers;
  },

  setStepCallback: function(fn) {
    this.stepCallback = fn;
  },

  setPagerCallback: function(fn) {
    this.pagerCallback = fn;
  },

  /**
   * Extend data received from discovery
   * @this RegionPlaylists
   * @param {object} the data to be extended.
   */
  extend: function(data) {
    var final_ = [];
    for (var i = 0; i < data.length; i++) {
      if (data[i].name) {
        final_.push(data[i]);
      }
    }
    wnData.Data.set('RegionPlaylists', final_);
    this._loaded = true;
    this._loadEvent.dispatch(window);
  },

  /**
   * @this RegionPlaylists
   * Calls the build method if it's loaded, otherwise create
   * an event listener for it
   */
  next: function() {
    if (this._loaded) {
      this.build();
    } else {
      dom.listen(window, this._key + '.load', this.build.bind(this));
    }
  },

  /**
   * @this RegionPlaylists
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
    this.pagerCallback(this._key,
        wnData.Data.get(this._key),
        self.playlistWrappers.shift(),
        function() {
          self.stepCallback(true);
        }
    );
  }
};

exports.RegionPlaylists = RegionPlaylists;
