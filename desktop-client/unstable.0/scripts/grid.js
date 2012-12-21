/**
 * @fileoverview Utilities for creating UI layout grids.
 */

'use strict';

var sp = getSpotifyApi();

exports.Grid = Grid;

var storage = sp.require('$util/storage');
var r = sp.require('$util/react');



/**
 * @param {function} identifier a unique idenifier for this grid to be used when
 * persisting the grid attributes, such as the scroll position.
 * @param {function} datasource the datasource that will create the nodes of the
 * grid.
 * @param {function} node if set, will be used as the node of the grid, instead
 * of the grid creating its own node, e.g., the body of the document, if the
 * grid should occupy the entire space.
 * @constructor
 */
function Grid(identifier, datasource, node) {
  this.identifier = identifier;
  this.datasource = datasource;
  this.node = node;
  this._generation = 0;
  this._restored = false;
  this._items = {};

  _makeNode.call(this);
  _clear.call(this);
}


/**
 * Call this method to rebuild the grid view when the items in the grid change.
 * Only call this method when items are added, moved or removed; not when the
 * items themselves have updated state. The item nodes are responsible for
 * correctly representing the item's state, and to update itself when it changes.
 */
Grid.prototype.rebuild = function() {
  _clear.call(this);
  _build.call(this);
};


/**
 * Call this method when the node has been resized. It will reflow the items in
 * the grid view to match the new size of the view.
 */
Grid.prototype.resize = function() {
  _build.call(this);
};


/**
 * @private
 */
function _makeNode() {
  this._grid = document.createElement('div');
  this._grid.classList.add('grid');
  this._grid.classList.add('vertical');

  if (!this.node)
    this.node = document.createElement('div');

  this.node.classList.add('viewport');
  this.node.appendChild(this._grid);

  var scroller = (this.node == document.body ? document : this.node);
  r.throttle(r.fromDOMEvent(scroller, 'scroll'), 100).subscribe(_build.bind(this));
  r.throttle(r.fromDOMEvent(scroller, 'scroll'), 2000).subscribe(_persist.bind(this));
}


/**
 * @private
 */
function _persist() {
  var x = this.node.scrollLeft;
  var y = this.node.scrollTop;
  storage.set(this.identifier + '_scroll_position', [x, y]);
}


/**
 * @private
 */
function _restore() {
  if (!this._restored) {
    var pos = storage.getWithDefault(this.identifier + '_scroll_position', [0, 0]);
    this.node.scrollLeft = pos[0];
    this.node.scrollTop = pos[1];
    this._restored = true;

  }
}


/**
 * @private
 */
function _clear() {
  this._generation = 0;
  _pruneItems.call(this);

  this._col_first = -1;
  this._row_first = -1;
  this._col_last = -1;
  this._row_last = -1;
  this._offset_x = -1;
  this._offset_y = -1;
}


/**
 * Build the contents of the grid view, by laying out the item views that are
 * visible, based on the current scroll position of the parent view. We also
 * include a few items outside the viewport, so that they can be scrolled into
 * view without leaving an empty gap while they are loaded. This method can be
 * called either when the entire view must be reconstructed, or when it just
 * needs to be layed out again.
 * @private
 */
function _build() {
  var has_padding = this.datasource.padding;
  var padding_t = (has_padding ? this.datasource.padding()[0] : 0);
  var padding_r = (has_padding ? this.datasource.padding()[1] : 0);
  var padding_b = (has_padding ? this.datasource.padding()[2] : 0);
  var padding_l = (has_padding ? this.datasource.padding()[3] : 0);

  var node_w = this.datasource.size()[0];
  var node_h = this.datasource.size()[1];
  var view_w = Math.min(this.node.clientWidth, this.node.offsetWidth) - padding_l - padding_r;
  var view_h = Math.min(this.node.clientHeight, this.node.offsetHeight) - padding_t - padding_b;

  // The view size is sometimes zero or negative (minus "scroller width") when
  // the application is first loaded into a new application view. Don't do any
  // layouting then, since the view will have to be resized before any nodes
  // will be visible anyway.
  if (view_w <= 0 || view_h <= 0)
    return;

  var count = this.datasource.count();
  var cols = Math.max(1, Math.min(count, Math.floor(this._grid.offsetWidth / node_w)));
  var rows = Math.ceil(count / cols);

  // Size the grid container to fit the number of rows we know we need, even
  // though the items do not exist all the way down. This way we get the
  // correct scrollbars, and can just fill the content when we scroll to it.
  // If the new height is different from the current height, we need to
  // restart the entire layout procedure, because added scrollbars might cause
  // the number of rows and columns to be different.
  var old_height = this._grid.style.height;
  var new_height = (rows * node_h + padding_t + padding_b) + 'px';
  if (old_height != new_height) {
    this._grid.style.height = new_height;
    _build.call(this);
    return;
  }

  // Try to restore the scroll position from the last time the grid was loaded
  // in the application. This allows the view to appear as if it was never
  // unloaded, when switching between different applications.
  _restore.call(this);
  var x = this.node.scrollLeft;
  var y = this.node.scrollTop;

  // Include some extra rows above and below the viewport, so that we load the
  // items that are soon to be scrolled into view. Will make the page feel a
  // bit faster, and we should be able to avoid showing empty cells, except
  // for when we jump to a new page, where we have nothing preloaded.
  var extra_cols = 10;
  var extra_rows = 10;
  var col_first = Math.max(0, Math.floor(x / node_w) - extra_cols);
  var row_first = Math.max(0, Math.floor(y / node_h) - extra_rows);
  var col_last = Math.min(cols - 1, Math.ceil((x + view_w) / node_w + extra_cols));
  var row_last = Math.min(rows - 1, Math.ceil((y + view_h) / node_h + extra_rows));

  var offset_x = padding_l;
  var offset_y = padding_t;

  // Only center the columns when there are more items than can fit in a
  // single row. As soon as the grid grows to two rows, we'll start centering.
  if (count > cols)
    offset_x += Math.round(this._grid.offsetWidth - cols * node_w) / 2;

  // Only rebuild the items if a new combination of rows and columns have
  // scrolled into view (or if we are rebuilding the entire view). We could
  // extend this to avoid rebuilding if we have items already created for what
  // needs to be displayed, but this at least avoids us doing this every pixel.
  var offset_changed = (offset_x != this._offset_x || offset_y != this._offset_y);
  var scroll_changed = (col_first != this._col_first || row_first != this._row_first || col_last != this._col_last || row_last != this._row_last);
  if (scroll_changed || offset_changed) {
    this._generation++;
    this._col_first = col_first;
    this._row_first = row_first;
    this._col_last = col_last;
    this._row_last = row_last;

    // Create and position all the items that are visible in the viewport,
    // and the items below and above that we decided to create ahead of time.
    // The index can point to items past the actual item count, so make sure
    // we do not ask for those items.
    for (var row = row_first; row <= row_last; row++)
      for (var col = col_first; col <= col_last; col++) {
        var index = row * cols + col;
        if (index < count) {
          var item = _makeItem.call(this, index);
          item.style.left = (col * node_w + offset_x) + 'px';
          item.style.top = (row * node_h + offset_y) + 'px';
          item.style.width = node_w + 'px';
          item.style.height = node_h + 'px';
          item._generation = this._generation;
        }
      }

      _pruneItems.call(this);
  }
}


/**
 * Look in the cache to see if an item for the given index has already been
 * created, and then return it. If it is not in the cache, ask the data source
 * to create it. The created item is added to the cache, and the grid view.
 * @private
 */
function _makeItem(index) {
  var item = this._items[index];

  if (!item) {
    item = this.datasource.makeNode(index);
    item.style.position = 'absolute';
    this._grid.appendChild(item);
    this._items[index] = item;
  }

  return item;
}


/**
 * Removes all items that are no longer in the viewport or at least near it.
 * When the items are being placed in view, they get assigned a "generation".
 * All items with older generations will be removed from the view and the cache.
 * @private
 */
function _pruneItems() {
  var _this = this;
  Object.keys(this._items).forEach(function(key) {
    var node = _this._items[key];
    if (node._generation != _this._generation) {
      _this._grid.removeChild(node);
      _this.datasource.dropNode(node);
      delete _this._items[key];
    }
  });
}
