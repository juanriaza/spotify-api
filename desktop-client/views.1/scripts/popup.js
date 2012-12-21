/**
 * @module views/popup
 */

/**
 * A popup that is shown inside the application with an arrow pointing towards
 * an element that the popup is originating from (attached to) - usually a
 * button.
 *
 * @param {number} width The width of content area of the popup.
 * @param {number} height The height of content area of the popup.
 * @param {string=} opt_cssClass An optional CSS class to add to the popup
 *     element.
 * @private
 *
 * @example
 * require(['$views/popup'], function(popup) {
 *   var h1 = document.createElement('h1');
 *   h1.textContent = 'Hello World!';
 *   var p = document.createElement('p');
 *   p.textContent = 'This is a popup!';
 *
 *   // Using a fragment avoids creating an unnecessary wrapper element, but is
 *   // not required.
 *   var fragment = document.createDocumentFragment();
 *   fragment.appendChild(h1);
 *   fragment.appendChild(p);
 *
 *   var info = popup.Popup.withContent(fragment, 200, 90);
 *   info.show(document.getElementById('some-element'));
 * });
 */
function Popup(width, height, opt_cssClass) {
  this.width = width;
  this.height = height;
  this.cssClass = opt_cssClass ? 'sp-popup ' + opt_cssClass : 'sp-popup';
}

/**
 * Creates a popup containing the specified DOM content.
 * @param {Node} content A DOM node to insert into the popup. Can also be a
 *     document fragment.
 * @param {number} width The width of the popup content area.
 * @param {number} height The height of the popup content area.
 * @param {string=} opt_cssClass An optional CSS class to add to the popup
 *     element.
 * @return {Popup} The popup.
 */
Popup.withContent = function(content, width, height, opt_cssClass) {
  var popup = new Popup(width, height, opt_cssClass);
  popup.setContent(content);
  return popup;
};

/**
 * Creates a popup containing the specified text.
 * @param {string} text The text that the popup should display.
 * @param {string=} opt_cssClass An optional CSS class to add to the popup
 *     element.
 * @return {Popup} The popup.
 */
Popup.withText = function(text, opt_cssClass) {
  var popup = new Popup(0, 0, opt_cssClass ? 'sp-text ' + opt_cssClass : 'sp-text');
  popup.setText(text);
  return popup;
};

/**
 * Updates the position of the popup.
 * @private
 */
Popup.prototype._update = function() {
  if (!this.attachedTo) return;

  var arrowWidth = 6, padding = 10, minimumOverlap = 25;

  // Get the popup element and resize it.
  var node = this.getNode();
  node.style.width = this.width + 'px';
  node.style.height = this.height + 'px';

  // Get the dimensions of the popup.
  var popup = node.getBoundingClientRect();

  // Get information about the location of the element the popup has been
  // attached to.
  var target = this.attachedTo.getBoundingClientRect();

  // Get the mid-point of element, relative to viewport.
  var midX = (target.left + target.right) / 2,
      midY = (target.top + target.bottom) / 2;

  var arrowBorder = this._nodeArrowBorder,
      arrowSolid = this._nodeArrowSolid;

  // Figure out the position of the popup.
  // TODO(blixt): Implement priority between horizontal or vertical placement
  // depending on which direction has the most space available.
  var x, y;

  var fitsVertical = Math.min(_viewportWidth - target.left, target.right) > minimumOverlap + padding,
      fitsAbove = target.top > popup.height + padding,
      fitsBelow = _viewportHeight - target.bottom > popup.height + padding;

  if (fitsVertical && (fitsBelow || fitsAbove)) {
    x = midX - popup.width / 2;

    // Ensure that popup bubble doesn't part too far from the element it's
    // attached to.
    var min = Math.max(padding, target.left - popup.width + minimumOverlap),
        max = Math.min(_viewportWidth - popup.width - padding, target.right - minimumOverlap);
    if (x > max) x = max;
    if (x < min) x = min;

    // Ensure that arrow doesn't go outside the popup bubble.
    var arrowX;
    if (arrowWidth + (minimumOverlap - padding) * 2 > popup.width) {
      // The popup is so narrow that we can't fit the arrow with the padding
      // that we want; so just force center it.
      arrowX = (popup.width - arrowWidth) / 2;
    } else {
      arrowX = midX - x;
      if (arrowX < minimumOverlap - padding) {
        arrowX = minimumOverlap - padding;
      } else if (arrowX > popup.width - minimumOverlap + padding) {
        arrowX = popup.width - minimumOverlap + padding;
      }
    }

    arrowBorder.style.left = arrowSolid.style.left = Math.round(arrowX) + 'px';
    arrowBorder.style.top = arrowSolid.style.top = null;

    if ((_viewportHeight - target.bottom > target.top || !fitsAbove) && fitsBelow) {
      y = target.bottom + padding;
      node.className = this.cssClass + ' sp-popup-below';
    } else {
      y = target.top - padding - popup.height;
      node.className = this.cssClass + ' sp-popup-above';
    }
  } else {
    // We couldn't fit it above or below, so let's put it left or right.
    y = midY - popup.height / 2;

    // Ensure that popup bubble doesn't part too far from the element it's
    // attached to.
    var min = Math.max(padding, target.top - popup.height + minimumOverlap),
        max = Math.min(_viewportHeight - popup.height - padding, target.bottom - minimumOverlap);
    if (y > max) y = max;
    if (y < min) y = min;

    // Ensure that arrow doesn't go outside the popup bubble.
    var arrowY;
    if (arrowWidth + (minimumOverlap - padding) * 2 > popup.height) {
      // The popup is so narrow that we can't fit the arrow with the padding
      // that we want; so just force center it.
      arrowY = (popup.height - arrowWidth) / 2;
    } else {
      arrowY = midY - y;
      if (arrowY < minimumOverlap - padding) {
        arrowY = minimumOverlap - padding;
      } else if (arrowY > popup.height - minimumOverlap + padding) {
        arrowY = popup.height - minimumOverlap + padding;
      }
    }

    arrowBorder.style.top = arrowSolid.style.top = Math.round(arrowY) + 'px';
    arrowBorder.style.left = arrowSolid.style.left = null;

    var fitsLeft = target.left > popup.width + padding,
        fitsRight = _viewportWidth - target.right > popup.width + padding;

    if ((_viewportWidth - target.right > target.left || !fitsLeft) && fitsRight) {
      x = target.right + padding;
      node.className = this.cssClass + ' sp-popup-right';
    } else if (fitsLeft) {
      x = target.left - padding - popup.width;
      node.className = this.cssClass + ' sp-popup-left';
    } else {
      // Uh-oh...
      x = 0;
      node.className = this.cssClass;
    }
  }

  // Set the position of the popup.
  node.style.left = Math.round(_scrollX + x) + 'px';
  node.style.top = Math.round(_scrollY + y) + 'px';
};

/**
 * Returns an HTML element that represents the popup.
 * @return {Element} The element that represents the popup.
 */
Popup.prototype.getNode = function() {
  if (this._node) return this._node;

  var node = document.createElement('div');
  node.className = this.cssClass;
  node.style.visibility = 'hidden';

  var arrowBorder = document.createElement('div');
  arrowBorder.className = 'sp-arrow-border';
  node.appendChild(arrowBorder);

  var arrowSolid = document.createElement('div');
  arrowSolid.className = 'sp-arrow-solid';
  node.appendChild(arrowSolid);

  if (this.content) {
    node.appendChild(this.content);
  }

  this._node = node;
  this._nodeArrowBorder = arrowBorder;
  this._nodeArrowSolid = arrowSolid;

  return node;
};

/**
 * Hides the popup.
 * @param {number=} opt_delay An optional time (in milliseconds) to delay the
 *     hiding of the popup by. If the popup is shown again before this time has
 *     passed, the delay will be cancelled and the popup will not be hidden.
 */
Popup.prototype.hide = function(opt_delay) {
  if (!this.attachedTo) return;

  if (opt_delay) {
    // We add 50ms here to avoid timestamp inaccuracies. Even in the worst case
    // that an element is hidden 50ms later than it's supposed to, the
    // difference should be imperceptible.
    if (this._hideTimeout && this._hideTimeoutTime - +new Date > opt_delay + 50) {
      // There is already a delayed hide in progress, but it's later than this
      // one, so replace it.
      clearTimeout(this._hideTimeout);
    } else if (this._hideTimeout) {
      // The delayed hide in progress will happen before this one, so don't do
      // anything.
      return;
    }

    var self = this;
    this._hideTimeout = setTimeout(function() { self.hide(); }, opt_delay);
    this._hideTimeoutTime = +new Date + opt_delay;

    return;
  }

  if (this._hideTimeout) {
    clearTimeout(this._hideTimeout);
    delete this._hideTimeout;
    delete this._hideTimeoutTime;
  }

  document.removeEventListener('mousedown', this._clickToHideHandler);

  // Remove the popup from the DOM.
  this._node.parentNode.removeChild(this._node);
  this._node.style.visibility = 'hidden';
  delete this.attachedTo;

  _unregister(this);
};

/**
 * Unreferences resources used by the popup so that it can be garbage
 * collected.
 */
Popup.prototype.dispose = function() {
  _unregister(this);

  if (this._clickToHideHandler) {
    document.removeEventListener('mousedown', this._clickToHideHandler);
    delete this._clickToHideHandler;
  }

  if (this.content && this.content.parentNode == this._node) {
    this._node.removeChild(this.content);
  }

  if (this._node && this._node.parentNode) {
    this._node.parentNode.removeChild(this._node);
  }

  if (this._hideTimeout) {
    clearTimeout(this._hideTimeout);
    delete this._hideTimeout;
    delete this._hideTimeoutTime;
  }

  delete this.attachedTo;
  delete this.content;
  delete this._node;
  delete this._nodeArrowBorder;
  delete this._nodeArrowSolid;
  delete this._textContainer;
};

/**
 * Change the size of the popup.
 * @param {number} width New width of the popup.
 * @param {number} height New height of the popup.
 */
Popup.prototype.resize = function(width, height) {
  this.width = width;
  this.height = height;
  this._update();
};

/**
 * Updates the content of the popup.
 * @param {Node} content A DOM node that should be used to represent the
 *     content of the popup.
 * @param {number=} opt_width Optional width to resize the popup to. Height
 *     also needs to be specified for this to take effect.
 * @param {number=} opt_height Optional height to resize the popup to.
 */
Popup.prototype.setContent = function(content, opt_width, opt_height) {
  if (content == this.content) return;

  if (this.content) {
    this._node.removeChild(this.content);
  }

  this.content = content;
  if (this._node) {
    this._node.appendChild(content);
  }

  if (opt_width && opt_height) {
    this.resize(opt_width, opt_height);
  }
};

/**
 * Sets the contents of the popup to be a simple string.
 * @param {string} text The text to display in the popup.
 * @param {number=} opt_maxWidth The width at which the text will start
 *     wrapping.
 */
Popup.prototype.setText = function(text, opt_maxWidth) {
  // Get an element container for the text so we can calculate its size.
  var container = this._textContainer;
  if (!container) {
    container = document.createElement('span');
    this._textContainer = container;
  }
  container.textContent = text;

  // This ensures the popup element has been created.
  var node = this.getNode();

  // This affects the width at which the text will wrap at.
  node.style.width = (opt_maxWidth || 200) + 'px';

  // Set the content of the popup.
  this.setContent(container);

  // Calculate the size of the text container.
  var rect;
  if (!node.parentNode) {
    // Temporarily add the popup to the DOM if needed.
    node.style.visibility = 'hidden';
    document.body.appendChild(node);
    rect = container.getBoundingClientRect();
    document.body.removeChild(node);
  } else {
    rect = container.getBoundingClientRect();
  }

  // Resize the popup to fit the text.
  this.resize(rect.width, rect.height);
};

/**
 * Attaches the popup to a DOM element and displays it.
 * @param {Element} attachTo Element to attach to.
 */
Popup.prototype.showFor = function(attachTo) {
  if (attachTo == this.attachedTo) {
    // Clear any timeout to hide this popup.
    if (this._hideTimeout) {
      clearTimeout(this._hideTimeout);
      delete this._hideTimeout;
      delete this._hideTimeoutTime;
    }

    return;
  }

  var node = this.getNode();

  if (this.attachedTo) this.hide();
  this.attachedTo = attachTo;

  // Add the popup to the DOM and register it for updates.
  document.body.appendChild(node);
  _register(this);

  // Do one initial update, then show the popup.
  this._update();
  node.style.visibility = 'visible';

  var self = this;

  // Create a handler that will hide this popup if the user clicks outside of
  // it.
  if (!this._clickToHideHandler) {
    this._clickToHideHandler = function(evt) {
      var t = evt.target, inside = false;
      while (t) {
        if (t == self._node) {
          inside = true;
          break;
        }
        t = t.parentNode;
      }

      if (!inside) self.hide();
    };
  }

  // Add the above handler with a very slight delay so that any queued up click
  // events won't instantly close it.
  setTimeout(function() {
    if (!self._node.parentNode) return;
    document.addEventListener('mousedown', self._clickToHideHandler);
  }, 0);
};

/**
 * A list of registered popups.
 * @type {Array.<Popup>}
 * @private
 */
var _popups = [];

/**
 * Register a popup so that it can be updated by the module.
 * @param {Popup} popup Popup to register.
 * @private
 */
function _register(popup) {
  if (_popups.indexOf(popup) >= 0) return;

  if (!_popups.length) {
    // First popup to be registered; listen for viewport events.
    _viewportHandler();
    window.addEventListener('resize', _viewportHandler);
    window.addEventListener('scroll', _viewportHandler);
  }

  _popups.push(popup);
}

/**
 * Unregisters a popup so that it is no longer updated by the module.
 * @param {Popup} popup Popup to unregister.
 * @private
 */
function _unregister(popup) {
  var index = _popups.indexOf(popup);
  if (index >= 0) {
    _popups.splice(index, 1);
    if (!_popups.length) {
      // No need to listen for viewport events if there are no popups.
      window.removeEventListener('resize', _viewportHandler);
      window.removeEventListener('scroll', _viewportHandler);
    }
  }
}

var _viewportWidth, _viewportHeight, _scrollX, _scrollY;

/**
 * Event handler for viewport change events.
 * @private
 */
function _viewportHandler() {
  var root = document.documentElement;
  _viewportWidth = root.clientWidth;
  _viewportHeight = root.clientHeight;
  _scrollX = window.pageXOffset || root.scrollLeft;
  _scrollY = window.pageYOffset || root.scrollTop;

  // Update all popups.
  for (var i = 0; i < _popups.length; i++) {
    _popups[i]._update();
  }
}

exports.Popup = Popup;
