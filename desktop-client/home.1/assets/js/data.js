'use strict';

var storage = sp.require('$util/storage');
var util = sp.require('$util/util');

/**
 *
 */
var Data = {
  _cachedData: {},
  _liveData: {},

  /**
   * @constructor
   * @this Data
   */
  init: function() {
    // this._cachedData = storage.getWithDefault('whatsnewData', {});
  },

  /**
   * @this Data
   * @param {string} key The key representing the data you want to set.
   * @param {string} value The value you want to set.
   */
  set: function(key, value)  {
    this._liveData[key] = value;
    //this.store();
  },

  /**
   * @this Data
   * @param {string} key The key representing the data.
   * @return {object} The data the key represents. If not found, returns false.
   */
  get: function(key) {
    if (this._liveData[key]) {
      return this._liveData[key];
    } else if (this._cachedData[key]) {
      return this._cachedData[key];
    }
    return false;
  },

  /**
   * Check if data exists for a key
   * @this Data
   * @param {string} key The key representing the data.
   * @return {bool} If the key exists true, otherwise false.
   */
  has: function(key) {
    if (this._liveData[key] || this._cachedData[key]) {
      return true;
    }
    return false;
  },

  /**
   * Merge cached and live data and cache it
   * @this Data
   */
  store: function()
  {
    storage.set('whatsnewData', util.merge(
        {},
        this._cachedData,
        this._liveData)
    );
  }
};

exports.Data = Data;
