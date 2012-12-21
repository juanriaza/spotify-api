/**
 * Copyright (c) 2012 Spotify Ltd
 * @author Martin Jönsson <mart@spotify.com>
 */

require([
  '$api/models',
  '$views/throbber#Throbber',
  'scripts/datasource',
  'scripts/ui',
  'scripts/grid',
  'scripts/utils'
], function(models, throbber, datasource, ui, grid, utils) {
  'use strict';

  /**
   * The Pod which holds a grid of data.
   * @constructor
   * @param {Object} data The snapshotted data.
   * @param {Logger} logger The logger.
   * @param {Collection=} opt_collection The collection from which to fetch more data.
   */
  function Pod(name, data, logger, collection) {
    /**
     * The designed data.
     * @type {Array.<Object>}
     * @private
     */
    this._data = data;

    /**
     * The collection
     * @type {Array.<number>}
     * @private
     */
    this._collection = collection || null;

    /**
     * The logger.
     * @type {Logger}
     * @private
     */
    this._logger = logger;

    /**
     * The UI manager for this pod.
     * @type {UI}
     * @private
     */
    this.ui = null;

    this._name = name;
  }

  /**
   * The properties for each category to load
   * @type {Object}
   * @const
   */
  Pod.PROPERTIES = {
    'artists': ['image', 'name', 'uri'],
    'albums': ['image', 'name', 'uri', 'artists'],
    'tracks': ['uri'],
    'playlists': ['image', 'name', 'uri']
  };

  /**
   * Initialize the Pod.
   */
  Pod.prototype.init = function() {
    var type = this._name;

    if (this._collection) {
      this.ui = new ui.BigUI(type, this._logger);
    } else {
      this.ui = new ui.UI(type, this._logger);
    }
    this._makeNode();
    this.ds = new datasource.DataSource(this._data, this.ui, this._collection);
    this.grid = new grid.Grid(this.ds, this.node);
    this.grid.init();
  };

  /**
   * Make the Pod node
   * @private
   */
  Pod.prototype._makeNode = function() {
    var self = this;

    this.node = new Element('section', {
      'id': this.ui._type,
      'class': 'pod'
    });

    if (this._collection) {
      this.node.addClass('loner');
    }
    var h2 = new Element('h2', {
      'text': this.ui._type.charAt(0).toUpperCase() + this.ui._type.slice(1)
    });

    if (!this._collection) {

      var button = new Element('button', {
        'class': 'see-all hidden',
        'text': 'See all',
        'events': {
          click: function(e) {
            var query = models.application.arguments[0];
            var category = e.target.parentNode.id;
            console.log(query, category);
            self._logger.clientEvent('click-on-see-all-button', { 'query': query, 'category': category });
            models.application.openApp('search', query, category);
          }
        }
      });
      this.node.adopt(h2, button);

    } else {
      this.node.adopt(h2);
    }
  };

  exports.Pod = Pod;

});
