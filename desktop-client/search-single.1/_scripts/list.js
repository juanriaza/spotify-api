/**
 * Copyright (c) 2012 Spotify Ltd
 * @author Gabriel Bonander <gabbon@spotify.com>
 */

require([
  '$api/models',
  '$views/list#List'
], function(models, List) {
  'use strict';

  /**
   * TrackList constructor.
   * @constructor
   */
  function TrackList() {}

  TrackList.prototype.init = function(id, collection, logger, options) {
    var that = this;
    if (!id || !collection) return;

    this._id = id;
    this._collection = collection;

    if (this.initialized) {
      this.List.setItem(this._collection, options.context || null);
      return;
    }

    this.node = new Element('section', {
      id: this._id,
      'class': this._id + ' wrapper-list'
    });

    this.attach(options);
    this.node.adopt(this.List.node);

    this.fill();
  };

  TrackList.prototype.empty = function() {
    this.initialized = false;
    if (this.node && this.node.parentNode)
      this.node.parentNode.removeChild(this.node);
  };

  TrackList.prototype.fill = function() {
    document.getElement('.search-result').adopt(this.node);
    this.List.init();
    this.initialized = true;
  };

  TrackList.prototype.attach = function(options) {
    this.List = List.forCollection(this._collection, options);
  };

  exports.TrackList = new TrackList();

});
