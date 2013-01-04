require([
  '$api/models#Observable',
  '$views/utils/css'
],
/**
 * A tab bar that can be used either for the whole app,
 * or smaller sections.
 *
 * @exports views/tabbar
 *
 * @example
 * require(['$views/tabbar#TabBar'], function(TabBar) {
 *   var tabBar = TabBar.withTabs([
 *     {id: 'overview', name: 'Overview', active: true},
 *     {id: 'followers', name: 'Followers'},
 *     {id: 'following', name: 'Following'}
 *   ]);
 *   tabBar.addToDom(document.body, 'prepend');
 *
 *   // Use this event to know when to change content based on the tab
 *   tabBar.addEventListener('tabchange', function(e) {
 *     e.id; // Id for the tab it changed to
 *     e.previousId; // Id for the tab that was active before
 *   });
 *
 *   // Use this event to be able to preload content before the user switched to the tab
 *   tabBar.addEventListener('tabhover', function(e) {
 *     e.id; // Id for the tab that the cursor hovers over
 *     e.active; // Whether the tab is currently active
 *   });
 * });
 */
function(Observable, css) {

  /**
   * @class
   * @implements {Observable}
   * @classdesc An object representing a tab bar.
   *
   * @param {Object=} opt_options An object with options.
   *
   * @property {?string} activeTab Currently active tab id.
   *
   * @since 1.22.0
   */
  function TabBar(opt_options) {
    this.activeTab = null;

    this._parseOptions(opt_options);

    this._tabs = {};
    this._createNode();
    this._addPointerListeners();

    if (this.options.sticky) {
      this._stickyData = {left: 0, right: 0};
      this._addScrollListener();
      this._addResizeListener();
    }
    this._isSticky = false;

    // Enable scroll-to-top when the tab changes, and when the active tab is clicked
    var self = this;
    var scrollElement = this._getScrollElement();
    this.addEventListener('scrolltotop', function(e) {
      if (e.causedBy === 'secondclick' && !self.options.scrollOnSecondClick) return;

      // Get the new scroll value.
      // This value is not to the top of the app,
      // but rather to the top of the content below the tab bar.
      var currentScroll = scrollElement.scrollTop;
      var newScroll = currentScroll + self.node.getBoundingClientRect().top;

      if (currentScroll > newScroll) {
        if (e.causedBy === 'tabchange') {
          scrollElement.scrollTop = newScroll;
        } else {
          self._animateScroll(scrollElement, {scrollTop: newScroll}, 500);
        }
      }
    });
  }
  SP.inherit(TabBar, Observable);

  /**
   * Returns a tab bar with the specified tabs.
   *
   * @param {Array.<Object>} tabs An array of tab definitions.
   * @param {Object=} opt_options An object with options. These are available:
   *     secondClickScrolls: Whether to scroll to the top when a tab is clicked
   *       the second time. First click activates tab, second scrolls to top.
   *     sticky: Whether to stick to the top when scrolled past. Default: true.
   *
   * @return {module:views/tabbar~TabBar} A new tab bar.
   *
   * @since 1.22.0
   */
  TabBar.withTabs = function(tabs, opt_options) {
    var tabBar = new TabBar(opt_options);
    tabBar.addTabs(tabs);

    return tabBar;
  };

  /**
   * Add multiple tabs to the tab bar.
   *
   * @param {Array.<Object>} tabs An array of tab definitions.
   *
   * @see module:views/tabbar~TabBar#addTab
   *
   * @since 1.22.0
   */
  TabBar.prototype.addTabs = function(tabs) {
    for (var i = 0, l = tabs.length; i < l; i++) {
      this.addTab(tabs[i]);
    }
  };

  /**
   * Add one tab to the tab bar.
   *
   * @param {Object} tab A tab definition object, containing these properties:
   *     is an object that has these properties:
   *     id {string} Unique identifier for this tab.
   *     name {string} Name of the tab (text to be displayed).
   *     active {boolean=} True if this tab should be set as the active tab. Optional.
   *
   * @since 1.22.0
   */
  TabBar.prototype.addTab = function(tab) {
    if (this._tabs[tab.id]) return;

    var tabElement = document.createElement('button');
    tabElement.className = 'sp-tabbar-tab';
    tabElement.innerHTML = tab.name;
    tabElement.setAttribute('data-tab-id', tab.id);
    this.contentNode.appendChild(tabElement);

    this._tabs[tab.id] = {
      id: tab.id,
      name: tab.name,
      element: tabElement
    };

    if (tab.active) {
      this.setActiveTab(tab.id);
    }
  };

  /**
   * Remove one tab from the tab bar.
   *
   * @param {string} id The tab identifier.
   *
   * @since 1.22.0
   */
  TabBar.prototype.removeTab = function(id) {
    if (!this._tabs[id]) return;

    this.contentNode.removeChild(this._tabs[id].element);
    delete this._tabs[id];

    if (this.activeTab === id) {
      this.activeTab = null;
    }
  };

  /**
   * Remove multiple tabs from the tab bar.
   *
   * @param {Array.<string>} ids An array of tab identifiers.
   *
   * @since 1.22.0
   */
  TabBar.prototype.removeTabs = function(ids) {
    for (var i = 0, l = ids.length; i < l; i++) {
      if (this._tabs[ids[i]]) {
        this.removeTab(ids[i]);
      }
    }
  };

  /**
   * Set a tab to be active.
   *
   * @param {string} id A tab identifier.
   *
   * @since 1.22.0
   */
  TabBar.prototype.setActiveTab = function(id) {
    if (!id) return;
    if (this.activeTab === id) return;

    if (this.activeTab) {
      var oldTab = this._tabs[this.activeTab];
      css.removeClass(oldTab.element, 'sp-tabbar-tab-active');
      this.activeTab = null;
    }

    if (this._tabs[id]) {
      this.activeTab = id;
      css.addClass(this._tabs[id].element, 'sp-tabbar-tab-active');
    } else {
      id = null;

      // If there was no old active tab and no new, don't dispatch event
      if (!oldTab) return;
    }

    this.dispatchEvent({type: 'tabchange', id: id, previousId: oldTab && oldTab.id});

    if (id) {
      this.dispatchEvent({type: 'scrolltotop', causedBy: 'tabchange'});
    }
  };

  /**
   * Add the tab bar to the DOM.
   *
   * @param {HTMLElement} element Reference element for insertion point.
   * @param {string} position Where to add it, relative to the reference element.
   *
   * @since 1.22.0
   */
  TabBar.prototype.addToDom = function(element, position) {
    switch (position) {
      case 'append': element.appendChild(this.node); break;
      case 'prepend': element.insertBefore(this.node, element.firstChild); break;
      case 'after':
        if (element.nextSibling) {
          element.parentNode.insertBefore(this.node, element.nextSibling);
        } else {
          element.parentNode.appendChild(this.node);
        }
        break;
      case 'before': element.parentNode.insertBefore(this.node, element); break;
    }

    // Set the CSS position, to keep the tab bar inside its container.
    // The tab bar uses absolute positioning, so the container's position
    // needs to be something else then static.
    var cssPosition = css.getStyle(this.node.parentNode, 'position');
    if (cssPosition === 'static') {
      this.node.parentNode.style.position = 'relative';
    }

    // Only activate the sticky feature if active in the options
    if (this.options.sticky) {
      this._setSticky();
    }
  };

  /**
   * Parse the options.
   *
   * @param {Object=} opt_options An object with options.
   *
   * @private
   *
   * @since 1.22.0
   */
  TabBar.prototype._parseOptions = function(opt_options) {
    var options = {
      sticky: true,
      scrollOnSecondClick: true
    };

    if (opt_options) {
      for (var prop in opt_options) {
        options[prop] = opt_options[prop];
      }
    }

    this.options = options;
  };

  /**
   * Create the outer node for the tab bar.
   *
   * @private
   *
   * @since 1.22.0
   */
  TabBar.prototype._createNode = function() {
    this.node = document.createElement('div');
    this.node.className = 'sp-tabbar';

    this.placeholderNode = document.createElement('div');
    this.placeholderNode.className = 'sp-tabbar-placeholder';
    this.node.appendChild(this.placeholderNode);

    this.contentNode = document.createElement('div');
    this.contentNode.className = 'sp-tabbar-content';
    this.placeholderNode.appendChild(this.contentNode);
  };

  /**
   * Add event listeners for pointer events.
   * This will catch all clicks inside the tab bar,
   * as well as catching hovers to enable preloading of content.
   *
   * @private
   *
   * @since 1.22.0
   */
  TabBar.prototype._addPointerListeners = function() {
    var self = this;
    this._isTouchDevice = ('ontouchstart' in window || 'createTouch' in document);

    this.node.addEventListener(this._isTouchDevice ? 'touchstart' : 'mousedown', function(e) {
      self._onPointerDown(e);
    }, false);

    if (!this._isTouchDevice) {
      this.node.addEventListener('mouseover', function(e) {
        self._onPointerMove(e);
      }, false);
    }
  };

  /**
   * Add an event listener for the scroll event.
   * This will make the tab bar stick to the top when scrolled past.
   *
   * @private
   *
   * @since 1.22.0
   */
  TabBar.prototype._addScrollListener = function() {
    var self = this;
    window.addEventListener('scroll', function(e) { self._onScroll(e); }, false);
  };

  /**
   * Add an event listener for the resize event.
   * This will resize the sticky tab bar to fit the parent.
   *
   * @private
   *
   * @since 1.22.0
   */
  TabBar.prototype._addResizeListener = function() {
    var self = this;
    window.addEventListener('resize', function(e) { self._onResize(e); }, false);
  };

  /**
   * Event handler for the mousedown/touchstart event.
   * This will be called for each click inside the tab bar.
   * If a tab was clicked, it will activate that tab.
   *
   * @param {Event} e Event object from the pointer event.
   *
   * @private
   *
   * @since 1.22.0
   */
  TabBar.prototype._onPointerDown = function(e) {
    if (e.target.tagName.toLowerCase() !== 'button') return;

    var id = e.target.getAttribute('data-tab-id');
    if (id && this._tabs[id]) {
      if (this.activeTab !== id) {
        this.setActiveTab(id);
      } else {
        this.dispatchEvent({type: 'scrolltotop', causedBy: 'secondclick'});
      }
    }
  };

  /**
   * Event handler for the mouseover event.
   * The event comes from the tab bar node, but fires for each tab.
   *
   * @param {Event} e Event object from the pointer event.
   *
   * @private
   *
   * @since 1.22.0
   */
  TabBar.prototype._onPointerMove = function(e) {
    if (e.target.tagName.toLowerCase() !== 'button') return;

    var id = e.target.getAttribute('data-tab-id');
    if (id && this._tabs[id]) {
      this.dispatchEvent({type: 'tabhover', id: id, active: this.activeTab !== id});
    }
  };

  /**
   * Event handler for the resize event.
   * When the window is resized, the sitcky tab bar needs to be adjusted in size.
   *
   * @private
   *
   * @since 1.22.0
   */
  TabBar.prototype._onResize = function(e) {
    if (!this._isSticky) return;

    var rect = this.node.getBoundingClientRect();
    this.contentNode.style.width = rect.width + 'px';
  };

  /**
   * Event handler for the scroll event.
   * When the app is scrolled past the tab bar, it will stick to the top.
   *
   * @private
   *
   * @since 1.22.0
   */
  TabBar.prototype._onScroll = function(e) {
    this._setSticky();
  };

  /**
   * Set the tab bar to be sticky, depending on where it is,
   * in relation to the viewport.
   *
   * @private
   *
   * @since 1.22.0
   */
  TabBar.prototype._setSticky = function() {

    // Get position and size of this tab bar
    var rect = this.node.getBoundingClientRect();
    var barHeight = rect.height;
    this._stickyData.left = rect.left;
    this._stickyData.right = rect.left + rect.width;

    // Get position of the parent node
    var parentRect = this.node.parentNode.getBoundingClientRect();

    // Get the offset for the sticky line.
    // When scrolled past this line, the tab bar is set to sticky.
    var offset = this._getStickyNestingLevel() * barHeight;

    var isPastTop = rect.top <= offset;
    var isBeforeBottom = parentRect.bottom > offset + barHeight;
    var isBeforeTop = rect.top > (offset - barHeight);
    var isPastBottom = parentRect.bottom <= offset;

    // Test if it should enable sticky
    if (!this._isSticky && isPastTop && isBeforeBottom) {
      this._enableSticky(offset, rect);

    // Test if it should disable sticky
    } else if (this._isSticky && (isBeforeTop || isPastBottom)) {
      this._disableSticky();
    }
  };

  /**
   * Make the tab bar sticky.
   *
   * @param {number=} opt_offset Offset in y axis, relative to viewport.
   * @param {Object=} opt_rect Rectangle object, from node.getBoundingClientRect().
   *
   * @private
   *
   * @since 1.22.0
   */
  TabBar.prototype._enableSticky = function(opt_offset, opt_rect) {
    var offset = opt_offset || 0;
    var rect = opt_rect || this.node.getBoundingClientRect();

    this._isSticky = true;

    // Add data object to storage of all sticky tab bars
    TabBar._stickyTabBars.push(this._stickyData);

    // Set visual styles to sticky
    css.addClass(this.contentNode, 'sp-tabbar-sticky');
    this.contentNode.style.top = offset + 'px';
    this.contentNode.style.left = rect.left + 'px';
    this.contentNode.style.width = rect.width + 'px';
  };

  /**
   * Make the tab bar not sticky.
   *
   * @private
   *
   * @since 1.22.0
   */
  TabBar.prototype._disableSticky = function() {
    this._isSticky = false;

    // Remove data object from storage of all sticky tab bars
    var index = TabBar._stickyTabBars.indexOf(this._stickyData);
    if (index > -1) TabBar._stickyTabBars.splice(index, 1);

    // Remove visual styles for sticky
    css.removeClass(this.contentNode, 'sp-tabbar-sticky');
    this.contentNode.style.top = '';
    this.contentNode.style.left = '';
    this.contentNode.style.width = '';
  };

  /**
   * Get the nesting level for sticky tab bars.
   * If this tab bar overlaps (in x axis) any other tab bar that
   * is currently sticky, it will be put one level down, so you get multiple
   * tab bars that are stuck to each other.
   *
   * @return {number} The level for this tab bar. 0 means first level.
   *
   * @private
   *
   * @since 1.22.0
   */
  TabBar.prototype._getStickyNestingLevel = function() {
    var level = 0;
    var data = this._stickyData;
    var barsData = TabBar._stickyTabBars;

    // Loop through all the current tab bars that are sticky
    for (var i = 0, l = barsData.length; i < l; i++) {

      // If this tab bar overlaps with the current sticky tab bar in the loop,
      // the level is increased.
      if ((barsData[i].left < data.right) && (barsData[i].right > data.left)) {
        level++;
      }
    }

    return level;
  };

  /**
   * Animate the scroll value.
   *
   * @param {HTMLElement} element An element that is scrollable.
   * @param {Object} properties The properties of the element to change, and their end values.
   * @param {number} duration The duration of the animation, in ms.
   *
   * @private
   *
   * @since 1.22.0
   */
  TabBar.prototype._animateScroll = function(element, properties, duration) {
    var running = true;

    var fps = 60;
    var interval = 1000 / fps;
    var numFrames = Math.ceil(duration / interval);
    var startTime = +new Date();

    // Get start and difference values
    var start = {};
    var diff = {};
    for (var prop in properties) {
      start[prop] = element[prop];
      diff[prop] = properties[prop] - (element[prop] || 0);
    }

    // Set animation function
    var self = this;
    var timer = setInterval(function() {
      if (running) {

        // Get position in animation, based on an easing function
        var timeDiff = +new Date() - startTime;
        var pos = self._animationEasing(timeDiff, duration);

        for (var prop in properties) {
          element[prop] = start[prop] + diff[prop] * pos;
        }
      }
    }, interval);

    // Stop animation after set duration
    setTimeout(function() {
      running = false;
      clearInterval(timer);

      // Set end values
      for (var prop in properties) {
        element[prop] = properties[prop];
      }

    }, duration);
  };

  /**
   * Get position in the animation for a given point in time, with easing.
   *
   * @param {number} time Time passed so far, in ms.
   * @param {number} duration Total duration for the animation, in ms.
   *
   * @return {number} A percentage number (around 0–1).
   *
   * @private
   *
   * @since 1.22.0
   */
  TabBar.prototype._animationEasing = function(time, duration) {
    if ((time /= duration / 2) < 1) {
      return (time * time * time) / 2;
    } else {
      time -= 2;
      return (time * time * time) / 2 + 1;
    }
  };

  /**
   * Feature detect which element should be used to set the scroll value.
   * Different browsers use different elements, so it needs to be tested to know which.
   *
   * @return {HTMLElement} The element where the scroll can be set.
   *
   * @private
   *
   * @since 1.23.0
   */
  TabBar.prototype._getScrollElement = function() {
    if (TabBar._scrollElement) return TabBar._scrollElement;

    var dummy = document.createElement('div');
    dummy.style.height = '10000px';
    document.body.insertBefore(dummy, document.body.firstChild);

    var currentScroll = document.body.scrollTop;
    var preferredNewScroll = currentScroll + 500;
    document.body.scrollTop = preferredNewScroll;
    var newScroll = document.body.scrollTop;
    var didChangeScroll = newScroll === preferredNewScroll;

    document.body.removeChild(dummy);
    document.body.scrollTop = scroll;

    TabBar._scrollElement = didChangeScroll ? document.body : document.documentElement;
    return TabBar._scrollElement;
  };

  // Storage for tab bar data, to be able to handle multiple tab bars
  TabBar._stickyTabBars = [];

  exports.TabBar = TabBar;

});
