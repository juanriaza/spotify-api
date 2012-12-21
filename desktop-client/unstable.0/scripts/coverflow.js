/**
 * @fileoverview Classes for creating a coverflow widget.
 */

'use strict';

var sp = getSpotifyApi();

exports.Coverflow = Coverflow;

var dom = sp.require('$util/dom');
var util = sp.require('$util/util');



/**
 * A coverflow widget.
 * @constructor
 */
function Coverflow(datasource, options) {
  this.datasource = datasource;
  this._itemCount = this.datasource.count();

  var DEFAULTS = {
    itemCount: this._itemCount
  };

  this.options = util.merge({}, DEFAULTS, options || {});

  _build.call(this);
}


/**
 * @private
 */
function _build() {
  this.node = new dom.Element('ul', {
    className: 'sp-coverflow'
  });

  for (var i = 0, count = this.options.itemCount; i < count; i++) {
    var child = this.datasource.makeNode(i);
    child.dataset['offset'] = i - 2;
    dom.adopt(this.node, child);
    dom.listen(child, 'click', coverClickHandler);
  }
}


/**
 * @private
 */
function coverClickHandler(e) {
  var items = this.parentNode.childNodes;
  var delta = Number(this.dataset['offset']);
  if (0 !== delta)
    e.preventDefault();

  for (var i = 0, l = items.length; i < l; i++) {
    var offset = Number(items[i].dataset['offset']);
    var nOffset = offset - delta;

    if (nOffset < -2) {
      nOffset = nOffset + 5;
    } else if (nOffset > 2) {
      nOffset = nOffset - 5;
    }

    items[i].dataset['offset'] = nOffset;
  }
}
