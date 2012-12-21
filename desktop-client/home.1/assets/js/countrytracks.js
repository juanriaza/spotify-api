'use strict';

var dom = sp.require('$util/dom'),
    array = sp.require('$util/array'),
    wnData = sp.require('assets/js/data');

var loadingEl = dom.queryOne('.loading');


var CountryTracks = {

  _key: 'CountryTracks',
  _loaded: false,
  _loadEvent: null,
  playlistWrappers: null,
  stepCallback: function() {},
  pagerCalback: function() {},

  /**
   * @constructor
   * @this CountryTracks
   */
  init: function() {
    var self = this;
    this.failureTimeout = this.failureTimeout || 5000;
    this._loadEvent = new dom.Event(this._key + '.load', true);

    var useCache = setTimeout(function() {
      self.triggerFailure('Country');
    }, this.failureTimeout);

    sp.social.getToplist('track',
        sp.core.country,
        sp.core.user.canonicalUsername, {
          onSuccess: function(result) {
            clearTimeout(useCache);

            if (result.tracks && result.tracks.length) {
              array.shuffle(result.tracks);
              wnData.Data.set(self._key, result.tracks);
              self._loaded = true;
              self._loadEvent.dispatch(window);
            }
            else {
              self._loaded = true;
              self._loadEvent.dispatch(window);
            }
          },
          onFailure: function() {
            self._loaded = true;
            self._loadEvent.dispatch(window);
            self.triggerFailure('Country');
          }
        }
    );
  },

  setTriggerTimeout: function(ms) {
    this.failureTimeout = ms;
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
   * @this CountryTracks
   * Calls the build function if it's loaded, otherwise create an
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
   * @this CountryTracks
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

    var d = wnData.Data.get(this._key);
    d.forEach(function(track, index) {
      track.metadata = track;
    });

    self.tableCallback(
        this._key,
        d,
        self.trackWrappers.shift(),
        function() {
          self.stepCallback(true);
        }
    );
  }
};

exports.CountryTracks = CountryTracks;
