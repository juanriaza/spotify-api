/**
 * Copyright (c) 2012 Spotify Ltd
 * @author Martin Jönsson <mart@spotify.com>
 */

require([
  '$views/throbber#Throbber',
  'scripts/utils'
], function(throbber, utils) {

  /**
   * A grid that will unload elements from the DOM as the user scrolls.
   * @constructor
   * @param {DataSource} datasource The DataSource object to be used with the grid.
   * @param {Element} node The Element which the grid should attach to.
   */
  function Grid(datasource, node) {
    /**
     * The datasource for the grid.
     * @type {Datasource}
     * @private
     */
    this._datasource = datasource;

    /**
     * The container node.
     * @type {Element}
     * @private
     */
    this._containerNode = node;

    /**
     * The distance the user has scrolled from the top.
     * @type {number}
     * @private
     */
    this._scrollTop = 0;

    /**
     * The amount of current padding-top for the grid.
     * @type {number}
     * @private
     */
    this._paddingTop = 0;

    /**
     * The height of a ui element.
     * @type {number}
     * @private
     */
    this._uiHeight = 0;

    /**
     * The total height of a section.
     * @type {number}
     * @private
     */
    this._sectionHeight = 0;
  }

  /**
   * The amount of rows in each section.
   * @type {number}
   * @const
   */
  Grid.ROW_OFFSET = 60;

  /**
   * The amount of columns.
   * @type {number}
   * @const
   */
  Grid.COLS = 3;

  /**
   * The length of one section in covers
   * @type {number}
   * @const
   */
  Grid.ROW_OFFSET_LENGTH = Grid.ROW_OFFSET * Grid.COLS;

  /**
   * Initialize the grid.
   */
  Grid.prototype.init = function() {
    if (this._datasource.collection) {
      this._throbber = throbber.forElement(this._containerNode);
      this._throbber.node.addClass('down');
      this._throbber.hide();
    }
    this._makeGrid();
    this._listen();
    this._build(this._datasource.elements);
  };

  /**
   * Initialize the necessary events attached with the grid.
   * @private
   */
  Grid.prototype._listen = function() {
    var self = this;

    if (this._datasource.collection) {
      window.addEventListener('resize', utils.throttle(function() {
        self._setSizeAndHeight();
      }, 100));

      setInterval(function() {
        if (!self._datasource.finishedLoading) {
          self._isSameView();
        }
      }, 500);
    }
  };

  /**
   * Set the distances and offsets based on current layout (essential when resizing)
   * @private
   */
  Grid.prototype._setSizeAndHeight = function() {
    var firstChild = this.node.getElement('li');
    this._uiHeight = firstChild.getStyle('height').toInt();
    this._uiHeight += firstChild.getStyle('margin-bottom').toInt();

    this._sectionHeight = Grid.ROW_OFFSET * this._uiHeight;
    var grid = document.getElement('.grid');

    if (grid) {
      document.body.setStyle('height', grid.getSize().y + grid.getPosition().y);
    } else {
      var self = this;
      setTimeout(function() {
        self._setSizeAndHeight();
      }, 100);
    }
  };

  /**
   * Create the grid node and attach it.
   * @private
   */
  Grid.prototype._makeGrid = function() {
    this.node = new Element('ul', {
      'class': 'grid',
      styles: {
        'width': '100%'
      }
    });

    this._containerNode.adopt(this.node);
  };

  /**
   * Based on which section the user is in,
   * this function determines wether to prune or add items from the top.
   * @param {number} section The section in which the user currently resides.
   */
  Grid.prototype._pruneOrAdd = function(section) {
    var scrollSection = (section === 0) ? 0 : section - 1;
    var startIndexShouldBe = scrollSection * Grid.ROW_OFFSET_LENGTH;
    var startIndexIs = this.node.getElement('li').get('data-index').toInt();
    if (startIndexIs === startIndexShouldBe) {
      return;
    } else if (startIndexIs > startIndexShouldBe) {
      while (startIndexIs > startIndexShouldBe) {
        if (this._datasource.elements[startIndexIs - 1]) {
          this._datasource.elements[startIndexIs - 1].inject(this.node, 'top');
          startIndexIs -= 1;
        }
      }
    } else if (startIndexIs < startIndexShouldBe) {
      while (startIndexIs < startIndexShouldBe) {
        this.node.childNodes[0].dispose();
        startIndexIs += 1;
      }
    }
    var paddingTop = Math.floor(startIndexShouldBe / Grid.COLS * this._uiHeight);
    if (this._paddingTop !== paddingTop) {
      this.node.setStyle('padding-top', paddingTop);
      this._paddingTop = paddingTop;
    }
  };

  /**
   * Returns a boolean based on the user's current and old scroll position.
   *
   * @return {boolean} Tells whether it should build a new view or not.
   */
  Grid.prototype._isSameView = function() {
    if (utils.getScrollTop() === this._scrollTop) {
      return;
    }
    this._scrollTop = utils.getScrollTop();

    var position = this.node.getSize().y - window.innerHeight;

    // should we load in more objects?
    if (position > 0 && this._scrollTop > position) {
      if (this._throbber) {
        this._throbber.show();
      }

      var self = this;
      this._datasource.loadData().done(function(data) {
        self._build(data);
      }).fail(function() {
        self._throbber.hide();
      });
    }

    var scrollSection = Math.floor(this._scrollTop / this._sectionHeight);
    this._pruneOrAdd(scrollSection);
  };

  /**
   * Build items on the bottom of the grid.
   * @param {Array.<Element>} data The elements from the datasource.
   */
  Grid.prototype._build = function(data) {
    var docFrag = document.createDocumentFragment();

    for (var i = 0, len = data.length; i < len; i += 1) {
      docFrag.appendChild(data[i]);
    }

    this.node.appendChild(docFrag);

    if (this._datasource.collection) {
      this._setSizeAndHeight();
    }

    if (this._throbber) {
      this._throbber.hide();
    }
  };

  exports.Grid = Grid;
});

