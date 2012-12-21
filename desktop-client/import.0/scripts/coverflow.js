"use strict";

var sp = getSpotifyApi(1);

exports.Coverflow = Coverflow;

var dom = sp.require('sp://import/scripts/dom');
var util = sp.require('sp://import/scripts/util');

function Coverflow(datasource, options)
{
	this.datasource = datasource;
	this._itemCount = this.datasource.count();

	var DEFAULTS = {
		itemCount: this._itemCount
	};

	this.options = util.merge({}, DEFAULTS, options || {});

	_build.call(this);
}

function _build()
{
	this.node = new dom.Element('ul', {
		className: 'sp-coverflow'
	});

	for (var i = 0, count = this.options.itemCount; i < count; i++) {
		var child = this.datasource.makeNode(i);
		child.dataset['offset'] = i - 2;
		dom.adopt(this.node, child);
		dom.listen(child, "click", coverClickHandler);
	}
}

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