/**
 * @fileoverview Generic throbber icon.
 * @module views/throbber
 */

require([
  '$views/utils/css',
  '$views/utils/dom',
  '$api/models'
], function(css, dom, models) {

  /**
   * A throbber icon that indicates that something is loading.
   * Call one of the factory methods to create a new throbber.
   *
   * @class Throbber
   *
   * @param {HTMLElement} element The element to put a throbber above.
   * @param {number=} opt_delay Number of milliseconds delay until the throbber shows.
   */
  function Throbber(element, opt_delay) {
    this.contentElement = element;
    this.delay = opt_delay;
    this.position = { x: 0, y: 0 };
    this.isActive = true;

    this._createNode();
    this.hideContent();

    if (typeof opt_delay === 'number') {
      var self = this;
      setTimeout(function() {
        if (self.isActive) {
          self._addNode();
          self.setPosition('center', 'center');
        }
      }, opt_delay);
    } else {
      this._addNode();
      this.setPosition('center', 'center');
    }
  }
  SP.inherit(Throbber, models.Observable);

  /**
   * Creates a throbber for a specific element.
   * It will show the throbber in the middle of the element. When the
   * section has loaded, you should call throbber.hide().
   *
   * @param {HTMLElement} element The element to put a throbber above.
   * @param {number=} opt_delay Number of milliseconds delay until the throbber shows.
   *
   * @return {Throbber} Return new Throbber instance.
   */
  Throbber.forElement = function(element, opt_delay) {
    return new Throbber(element, opt_delay);
  };

  /**
   * Position the throbber within the element.
   * If no arguments are passed in, it will use the current position values
   * and reposition it within the element.
   *
   * @param {number|string=} opt_x Pixels as a number, or keyword as a string. 'left' | 'center' | 'right'.
   * @param {number|string=} opt_y Pixels as a number, or keyword as a string. 'top' | 'center' | 'bottom'.
   */
  Throbber.prototype.setPosition = function(opt_x, opt_y) {
    if (!this.node.parentNode) return;

    var x = opt_x === undefined ? this.position.x : opt_x;
    var y = opt_y === undefined ? this.position.y : opt_y;

    this.position.x = x;
    this.position.y = y;

    var throbberBounds = this.node.getBoundingClientRect();
    var elementBounds = this.contentElement.getBoundingClientRect();
    var scroll = {
      x: document.body.scrollLeft,
      y: document.body.scrollTop
    };

    if (typeof x === 'string') {
      if (x === 'left') { x = 0; }
      if (x === 'right') { x = elementBounds.width - throbberBounds.width; }
      if (x === 'center') { x = (elementBounds.width - throbberBounds.width) / 2; }
    }
    if (typeof y === 'string') {
      if (y === 'top') { y = 0; }
      if (y === 'bottom') { y = elementBounds.height - throbberBounds.height; }
      if (y === 'center') { y = (elementBounds.height - throbberBounds.height) / 2; }
    }

    if (x < 0) x = 0;
    if (y < 0) y = 0;

    this.node.style.left = x + 'px';
    this.node.style.top = y + 'px';
  };

  /**
   * A conversion table of size literals to CSS classes.
   * @enum {string}
   * @private
   */
  Throbber._sizes = {
    normal: '',
    small: 'sp-throbber-small'
  };

  /**
   * Set a size for the throbber.
   *
   * @param {string} size Size keyword. 'normal' | 'small'.
   */
  Throbber.prototype.setSize = function(size) {
    if (this.size === size) return;
    if (!(size in Throbber._sizes)) {
      throw new Error(size + ' is not a valid size');
    }
    css.removeClass(this.node, Throbber._sizes[this.size]);
    css.addClass(this.node, Throbber._sizes[size]);
    this.size = size;
    this.setPosition();
  };

  /**
   * Hide the element that the throbber is placed above.
   */
  Throbber.prototype.hideContent = function() {
    this.contentElement.style.visibility = 'hidden';
    this.contentElement.style.pointerEvents = 'none';
    this.contentHidden = true;
    this._removeBackground();
  };

  /**
   * Show the element that the throbber is placed above.
   */
  Throbber.prototype.showContent = function() {
    this.contentElement.style.visibility = 'visible';
    this.contentElement.style.pointerEvents = 'auto';
    this.contentHidden = false;
    this._addBackground();
  };

  /**
   * Hide the throbber.
   */
  Throbber.prototype.hide = function() {
    if (this.isAddedToDOM) {
      this._removeNode();
    }
    if (this.contentHidden) {
      this.showContent();
    }
    this.isActive = false;
  };

  /**
   * Show the throbber.
   */
  Throbber.prototype.show = function() {
    if (!this.isAddedToDOM) {
      if (typeof this.delay === 'number') {
        var self = this;
        setTimeout(function() {
          self._addNode();
          self.hideContent();
          self.isActive = true;
        }, this.delay);
      } else {
        this._addNode();
        this.hideContent();
        this.isActive = true;
      }
    }
  };

  /**
   * Create the throbber node.
   *
   * @private
   */
  Throbber.prototype._createNode = function() {
    var node = document.createElement('div');
    node.className = 'sp-throbber';
    this.node = node;
  };

  /**
   * Add the node to the DOM, before the referenced element.
   *
   * @private
   */
  Throbber.prototype._addNode = function() {
    if (this.node.parentNode) {
      this._removeNode();
    }
    this.contentElement.appendChild(this.node);
    this.isAddedToDOM = true;
    this.oldContentPosition = css.getStyle(this.contentElement, 'position');
    if (this.oldContentPosition === 'static') {
      this.contentElement.style.position = 'relative';
    }
  };

  /**
   * Remove the node from the DOM.
   *
   * @private
   */
  Throbber.prototype._removeNode = function() {
    this.node.parentNode.removeChild(this.node);
    this.isAddedToDOM = false;
    this.contentElement.style.position = this.oldContentPosition;
  };

  /**
   * Add a background for the throbber to make it stand out from the content.
   * This will be added if the content is shown while the throbber is visible.
   */
  Throbber.prototype._addBackground = function() {
    css.addClass(this.node, 'sp-throbber-background');
    this.setSize('small');
  };

  /**
   * Remove the background from the throbber.
   */
  Throbber.prototype._removeBackground = function() {
    css.removeClass(this.node, 'sp-throbber-background');
    this.setSize('normal');
  };

  exports.Throbber = Throbber;

});
