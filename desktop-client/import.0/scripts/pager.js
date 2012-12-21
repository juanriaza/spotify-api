"use strict";

var sp = getSpotifyApi(1);

exports.Pager = Pager;

var dom = sp.require('sp://import/scripts/dom');
var logger = sp.require('sp://import/scripts/logger');

function Pager(datasource, options)
{
	options = options || {};
	this.datasource = datasource;
	this._pages = {};
	this._bullets = [];
	this._orientation = options.orientation === 'vertical' ? 'vertical' : 'horizontal';
	this._pagingLocation = options.pagingLocation === 'top' ? 'top' : 'bottom';
	this._showBullets = options.bullets !== undefined ? options.bullets : true;
	this._perPage = options.perPage ? options.perPage : 5;
	this._hidePartials = options.hidePartials ? options.hidePartials : false;
	this._listType = options.listType === 'table' ? 'table' : 'list';
	this._currentPage = 0;
	this._context = options.context !== undefined ? options.context : 'pager';
	this._currentPageEl = null;
	this._pageSize = null;
	this._running = 0;
	this._heightLocked = false;

	// Hide partial pages?
	if (this._hidePartials) {
		this._pageCount = Math.floor(this.datasource.count() / this._perPage);
	} else {
		this._pageCount = Math.ceil(this.datasource.count() / this._perPage);
	}

	_build.call(this);
	_buildPage.call(this, 0);
}

Pager.prototype.setOptions = function(options)
{
	if (options.perPage) {
		this._perPage = options.perPage;

		if (this._hidePartials) {
			this._pageCount = Math.floor(this.datasource.count() / this._perPage);
		} else {
			this._pageCount = Math.ceil(this.datasource.count() / this._perPage);
		}
	}
};

Pager.prototype.reflow = function()
{
	var self = this;
	this._window.classList.add('no-animations');
	var unused = this._window.offsetWidth;
	this.displayPage(0, true);

	// Time out needed otherwise the class gets removed too quickly again
	setTimeout(function() {
		self._window.classList.remove('no-animations');
	}, 10)

	if (this._showBullets) {
		if (this._pageCount < this._bullets.length) {
			for (var i = this._pageCount; i < this._bullets.length; i++) {
				dom.destroy(this._bullets[i]);
			}
			this._bullets = this._bullets.slice(0, this._pageCount);
		} else if (this._pageCount > this._bullets.length) {
			for (var p = this._bullets.length; p < this._pageCount; p++) {
				var li = new dom.Element('li', {html: '<a href="#'+p+'">Page '+(p + 1)+'</a>'});
				this._bullets.push(li);
				dom.inject(li, this.nextButton, 'before');
			}
		}
	}
};

/**
 * Display a page
 */
Pager.prototype.displayPage = function(index, force)
{
	force = force === true ? true : false;

	// Make sure it's a valid page
	if (index < 0) { index = 0; }
	if (index > (this._pageCount - 1)) { index = this._pageCount - 1; }

	if (this._currentPage === index && !force) { return; }
	if (index < 0 || index > (this._pageCount - 1)) { return; }

	_buildPage.call(this, index);

	// Proper display of paging
	if (this._pageCount === 1) {
		this.prevButton.classList.remove('inactive');
		this.nextButton.classList.remove('inactive');
		if (this._showBullets) {
			this._bullets[this.currentPage].classList.remove('inactive');
		}
		this._paging.classList.remove('active');
	} else {
		this._paging.classList.add('active');
		if (index === 0) {
			this.prevButton.classList.add('inactive');
		} else if (this._currentPage === 0) {
			this.prevButton.classList.remove('inactive');
		}

		if (index === (this._pageCount - 1)) {
			this.nextButton.classList.add('inactive');
		} else {
			this.nextButton.classList.remove('inactive');
		}
		if (this._showBullets) {
			this._bullets[this._currentPage].classList.remove('active');
			this._bullets[index].classList.add('active');
		}
	}

	// Set current page
	this._currentPage = index;
};

/**
 * Build up required elements for the pager
 *
 * @private
 */
function _build()
{
	this.h2 = new dom.Element('h2');
	this.node = new dom.Element('div', {className: 'pager'})
	this._window = new dom.Element('div', {className: 'window'});
	this._paging = new dom.Element('div', {className: 'paging'});
	if (this._orientation === 'vertical') {
		this.node.classList.add('vertical');
	}

	_buildPaging.call(this);

	if (this._pagingLocation === 'top') {
		this.node.classList.add('paging-top');
		dom.adopt(this.node, this.h2, this._paging, this._window);
	} else {
		dom.adopt(this.node, this.h2, this._window, this._paging);
	}
}

/**
 * Build up the paging element
 *
 * @private
 */
function _buildPaging()
{
	this.prevButton = new dom.Element('li', {className: 'prev', html: '<a href="#previous">Previous</a>'});
	this.nextButton = new dom.Element('li', {className: 'next', html: '<a href="#next">Next</a>'});
	if (this._pageCount > 1) {
		this.prevButton.classList.add('inactive');
	}

	var self = this, bullets = '', ul = new dom.Element('ul');

	dom.adopt(ul, this.prevButton);
	if (this._showBullets) {
		for (var p = 0; p < this._pageCount; p++) {
			var li = new dom.Element('li', {html: '<a href="#'+p+'">Page '+(p + 1)+'</a>'});
			if (p === 0) {
				li.classList.add('active');
			}
			this._bullets.push(li);
			dom.adopt(ul, li);
		}
	}
	dom.adopt(ul, this.nextButton);
	dom.adopt(this._paging, ul);

	if (this._pageCount > 1) {
		this._paging.classList.add('active');
	}

	dom.listen(this._paging, 'click', function(e) {
		e.preventDefault();
		if (e.target.tagName === 'A') {
			if (e.target.parentNode === self.prevButton) {
				logger.logClientEvent(self._context+' paging','click','1','1',{'page':'-1'});
				self.displayPage(self._currentPage - 1);
			} else if (e.target.parentNode === self.nextButton) {
				logger.logClientEvent(self._context+' paging','click','1','1',{'page':'+1'});
				self.displayPage(self._currentPage + 1);
			} else {
				logger.logClientEvent(self._context+' paging','click','1','1',{'page':self._bullets.indexOf(e.target.parentNode)});
				self.displayPage(self._bullets.indexOf(e.target.parentNode));
			}
		}
	});
}

/**
 * @private
 */
function _buildPage(index)
{
	if (index < 0 || index > this._pageCount) {
		return;
	}

	if (this._listType === 'table') {
		var pageEl = new dom.Element('table');
		// pageEl.cellPadding = 0;
		pageEl.cellSpacing = 0;
	} else {
		var pageEl = new dom.Element('ul');
	}

	var offset = (this._perPage * index);

	for (var i = offset; i < (offset + this._perPage) && i < this.datasource.count(); i++) {
		var child = this.datasource.makeNode(i);
		dom.adopt(pageEl, child);
	}

	// Inject in the right place
	if (this._currentPageEl) {
		var dir = index < this._currentPage ? -1 : 1;

		// Increase the amount of running animations
		this._running++;
		_lock.call(this);

		// Position the next page
		pageEl.style.position = 'absolute';
		if (this._orientation === 'vertical') {
			pageEl.style.top = (dir === -1 ? '-' : '')+this._pageSize.y+'px';
			pageEl.style.left = 0;
		} else {
			pageEl.style.top = 0;
			pageEl.style.left = (dir === -1 ? '-' : '')+this._pageSize.x+'px';
		}

		dom.inject(pageEl, this._window);
		var unused = pageEl.offsetHeight; // Sometimes JS is too smart for it's own good

		if (this._orientation === 'vertical') {
			this._currentPageEl.style.top = (dir === 1 ? '-' : '')+this._pageSize.y+'px';
			pageEl.style.top = 0;
		} else {
			this._currentPageEl.style.left = (dir === 1 ? '-' : '')+this._pageSize.x+'px';
			pageEl.style.left = 0;
		}

		var self = this, fired = false;
		if (this._window.classList.contains('no-animations')) {
			dom.destroy(this._currentPageEl);
			self._running--;
			if (self._running === 0) {
				_unlock.call(this);
			}
		} else {
			dom.listen(this._currentPageEl, 'webkitTransitionEnd', function(e) {
				if (!fired) {
					dom.destroy(e.target);
					self._running--;
					if (self._running === 0) {
						_unlock.call(self);
					}
					fired = true;
				}
			});
		}
		this._currentPageEl = pageEl;
	} else {
		dom.inject(pageEl, this._window);
		this._currentPageEl = pageEl;
	}
}

/**
 * Lock the pager's dimensions
 */
function _lock()
{
	this._pageSize = dom.getSize(this._currentPageEl);

	// Only lock the height once, and keep it locked
	if (!this._heightLocked) {
		this._window.style.height = this._pageSize.y+'px';
		this._heightLocked = true;
	}
	// Only lock width for horizontal pagers
	if (this._orientation === 'horizontal') {
		this._window.style.width = this._pageSize.x+'px';
	}
	this._currentPageEl.style.position = 'absolute';
	this._currentPageEl.style.top = 0;
	this._currentPageEl.style.left = 0;
}

/**
 * Unlock the pager's dimensions
 */
function _unlock()
{
	this._currentPageEl.style.removeProperty('position');
	this._currentPageEl.style.removeProperty('top');
	this._currentPageEl.style.removeProperty('left');
	this._window.style.removeProperty('width');
}
