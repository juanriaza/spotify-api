/**
 * Copyright (c) 2012 Spotify Ltd
 * @author Martin Jönsson <mart@spotify.com>
 */

require([
  '$api/models'
], function(models) {

  /**
   * A datasource that will keep track of data from a collection
   * @constructor
   * @extends {models.Observable}
   *
   * @param {Array.<object>} data The initial data.
   * @param {UI} ui The UI that should be used to render elements.
   * @param {Collection} collection The collection from which to fetch data.
   */
  function DataSource(data, ui, collection) {
    this.collection = collection || null;
    this.ui = ui;
    this.index = 0;
    this.isLoading = false;
    this.finishedLoading = false;
    this.elements = [];

    this.fillElements(data);
  }
  SP.inherit(DataSource, models.Observable);

  DataSource.prototype.fillElements = function(data) {
    var el;
    for (var i = 0, len = data.length; i < len; i += 1) {
      el = this.ui.makeNode(data[i]);
      el.set('data-index', this.index);
      this.elements.push(el);
      this.index += 1;
    }
  };

  /**
   * Loads the data and creates elements for each item
   * @param {number} start From where to snapshot.
   * @param {number} count The amount of data to snapshot.
   * @return {Promise} A promise which will go done once all data is loaded.
   */
  DataSource.prototype.loadData = function(count) {
    var p = new models.Promise();
    var self = this;
    if (this.finishedLoading || this.isLoading) {
      p.setFail();
    } else {

      this.isLoading = true;
      var _els = [];
      count = count || 20;


      this.collection.snapshot(this.index, count).done(function(snapshot) {
        snapshot.loadAll(self.ui.properties).done(function(data) {
          if (data) {
            var oldIndex = self.index;
            self.fillElements(data);
            p.object = self.elements.filter(function(item, index) {
              return index >= oldIndex;
            });

            if (self.elements.length >= snapshot.length) {
              self.finishedLoading = true;
            }
            p.setDone();
            self.isLoading = false;
          } else {
            p.setFail();
          }
        });
      });
    }

    return p;
  };

  /**
   * Will initialize the loading of the data. Makes sure no extra request is being sent while loading.
   * @param {number} index From where the offset should be.
   */
  DataSource.prototype.fetchData = function() {
    if (!this.isLoading) {
      this.isLoading = true;
      var min = this.index;
      var max = 50;
      var self = this;
      this.loadData(min, max).done(function() {
        self.dispatchEvent('load-complete');
        this.index += 50;
        self.isLoading = false;
      });
    }
  };

  exports.DataSource = DataSource;

});
