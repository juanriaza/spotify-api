'use strict';

var dom = sp.require('$util/dom'),
    array = sp.require('$util/array'),
    wnData = sp.require('assets/js/data');

var loadingEl = dom.queryOne('.loading');

var CountryPlaylists = {

  _key: 'CountryPlaylists',
  _loaded: false,
  _loadEvent: null,
  playlistWrappers: null,
  stepCallback: function() {},
  pagerCalback: function() {},

  /**
   * @constructor
   * @this CountryPlaylists
   * @param {object} data the data to be used in the object.
   */
  init: function(data) {
    this._loaded = true;

    /*
    this._loadEvent = new dom.Event(this._key+ '.load', true);

    if (!data || !data.playlists) {
      this._loaded = true;
      this._loadEvent.dispatch(window);
      return;
    }

    this.extend(data.playlists);
    */
  },


  setPlaylistWrappers: function(playlistWrappers) {
    this.playlistWrappers = playlistWrappers;
  },

  setStepCallback: function(fn) {
    this.stepCallback = fn;
  },

  /**
   * Extend data received from discovery
   * @this CountryPlaylists
   * @param {object} the data to be extended.
   */
  extend: function(data) {
    /*
    var final_ = [];
    for (var i = 0; i < data.length; i++) {
      if (data[i].name) {
        final_.push(data[i]);
      }
    }

    Data.set('RegionPlaylists', final_);
    this._loaded = true;
    this._loadEvent.dispatch(window);
    */
  },

  /**
   * @this CountryPlaylists
   * Calls the build function if it's loaded, otherwise create an
   * event listener for it
   */
  next: function() {
    if (this._loaded) {
      this.build();
      // if (Data.has(this._key)) {
      // } else {
      // }
    } else {
      // step(false);
      //dom.listen(window, this._key+ '.load', this.build.bind(this));
    }
  },

  /**
   * @this CountryPlaylists
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

    /*
    This element is currently empty because of missing Discovery data
    We're manually adding the key as a class to the wrapper so we can
    adjust the margin
    */
    if (self.playlistWrappers.length > 0) {
      self.playlistWrappers[0].classList.add('CountryPlaylists');
    }
    //playlistWrappers.shift().classList.add('CountryPlaylists');
    //dom.id(playlistWrappers.shift())
    self.stepCallback(true);
    /*
    buildPlaylistPager(this._key,
    Data.get(this._key),
    playlistWrappers.shift(),
    function() {
      step(true);
    });
    */
  }
};

exports.CountryPlaylists = CountryPlaylists;
