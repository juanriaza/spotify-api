'use strict';

/**
 * Item toggler.
 * Toggles contents for an element by clicking on toggle buttons.
 *
 * @module toggler
 */

// The prefixed transitionend event name
var transitionEndEvent = 'webkitTransitionEnd';

/**
 * Object for toggling contents of an element.
 *
 * @constructor
 *
 * @param {Object} options An object of options. These will be mapped to properties with the same names.
 *                         Possible keys:
 *                         `wrapper`: CSS selector for the list wrapper
 *                         `allButton`: CSS selector for a button that will toggle all items
 *                         `closedHeight`: The height the item will have when closed
 *                         `toggleClass`: CSS class for an element inside the wrapper that should trigger a toggle
 *                         `animate`: True if the toggle should animate
 *                         `onToggle`: Function that gets called when the item is toggled through a click.
 *                         `itemSelector`: CSS selector for an item
 *
 * @property {string} allState The state of the toggle all feature. `'open'` or `'closed'`.
 */
function Toggler (options) {

  // Get elements
  this.wrapper = document.querySelector(options.wrapper);
  if (options.allButton) {
    this.allButton = document.querySelector(options.allButton);
  }
  this.closedHeight = options.closedHeight;
  this.toggleClass = options.toggleClass;
  this.animate = options.animate === false ? false : true;
  this.onToggle = options.onToggle || function () {};
  this.itemSelector = options.itemSelector;

  // Set state for the 'toggle all'
  this.allState = 'closed';

  // Add event handlers for toggle buttons
  this.wrapper.addEventListener('click', this.clickHandler.bind(this), false);
  if (this.allButton) {
    this.allButton.addEventListener('click', this.toggleAll.bind(this), false);
  }
}

/**
 * Handler for click events inside the wrapper
 * It catches all clicks, and only performs stuff when a toggle was clicked.
 */
Toggler.prototype.clickHandler = function (e) {
  var id, item, toggles, i, l;

  // We are only interested in clicks on toggles
  if (~e.target.className.indexOf(this.toggleClass)) {

    // Find the item element
    id = e.target.dataset.toggleItem;
    item = document.getElementById(id);

    // Toggle the item if the element was found
    if (item) {
      this.toggleItem(item, this.animate);

      // Set classes for all toggles to be correct
      toggles = e.target.parentNode.querySelectorAll('.' + this.toggleClass);
      for (i = 0, l = toggles.length; i < l; i++) {
        toggles[i].classList.toggle('open');
      }

      // Trigger callback function
      this.onToggle(e.target);
    }
  }
};

/**
 * Get heights for an item's closed state and open state.
 *
 * @return {Object} Object containing the closed item height and full open height, with properties `item` and `full`.
 */
Toggler.prototype.getHeights = function (item) {
  var itemHeight, fullHeight;

  // Get heights for the collapsed and expanded state
  itemHeight = this.closedHeight || 0;
  fullHeight = item.children[0].offsetHeight;

  return {
    item: itemHeight,
    full: fullHeight
  };
};

/**
 * Checks if the passed in item is open or not.
 *
 * @param {HTMLElement} itemElem DOM element for an item.
 *
 * @return {boolean} True if open, false otherwise.
 */
Toggler.prototype.isItemOpen = function (itemElem) {
  return itemElem ? itemElem.classList.contains('open') : false;
};

/**
 * Toggles an item programmatically without clicking.
 *
 * @param {HTMLElement} item    DOM element for an item.
 * @param {boolean}     animate True if the toggling should animate.
 */
Toggler.prototype.toggleItem = function (item, animate) {
  animate = animate === false ? false : true;

  var heights = this.getHeights(item);
  this.toggle(item, {
    minHeight: heights.item,
    fullHeight: heights.full,
    animate: animate
  });
};

/**
 * Opens an item programmatically without clicking.
 *
 * @param {HTMLElement} item    DOM element for an item.
 * @param {boolean}     animate True if the toggling should animate.
 */
Toggler.prototype.openItem = function (item, animate) {
  animate = animate === false ? false : true;

  var heights = this.getHeights(item);
  this.toggle(item, {
    minHeight: heights.item,
    fullHeight: heights.full,
    forceState: 'open',
    animate: animate
  });
};

/**
 * Closes an item programmatically without clicking.
 *
 * @param {HTMLElement} item    DOM element for an item.
 * @param {boolean}     animate True if the toggling should animate.
 */
Toggler.prototype.closeItem = function (item, animate) {
  animate = animate === false ? false : true;

  var heights = this.getHeights(item);
  this.toggle(item, {
    minHeight: heights.item,
    fullHeight: heights.full,
    forceState: 'close',
    animate: animate
  });
};

/**
 * Toggles an item.
 * Wrapper methods exist for this, so you probably want to call them instead.
 *
 * @param {HTMLElement} item    DOM element for an item.
 * @param {Object}      options Object with options for the toggling. `minHeight`, `fullHeight`, `forceState`, `animate`
 */
Toggler.prototype.toggle = function (item, options) {

  // Default settings
  var settings = {
    minHeight: 0,
    fullHeight: 100,
    forceState: undefined,
    animate: true
  };

  // Replace the default settings with the user options
  for (var x in options) {
    settings[x] = options[x];
  }

  // Add animate class to let CSS animations know
  if (settings.animate) {
    item.classList.add('animate');
  }

  // We might want to force open or close an item, and not really toggle
  if (settings.forceState) {
    item.style.height = (settings.forceState === 'open' ? settings.fullHeight : settings.minHeight) + 'px';
    if (settings.forceState === 'open') {
      item.classList.add('open');
    } else {
      item.classList.remove('open');
    }

  // Or we just want to toggle between open and closed
  } else {
    item.style.height = (item.classList.contains('open') ? settings.minHeight : settings.fullHeight) + 'px';
    item.classList.toggle('open');
  }
};

/**
 * Toggles all items.
 * This is called when the allButton is clicked, if specified when the toggler was created.
 */
Toggler.prototype.toggleAll = function () {
  var items, heights;

  this.allState = this.allState === 'closed' ? 'open' : 'closed';
  this.allButton.classList.toggle('open');

  items = this.wrapper.querySelectorAll(this.itemSelector);
  for (var i = 0, l = items.length; i < l; i++) {
    heights = this.getHeights(items[i]);
    this.toggle(items[i], {
      minHeight: heights.item,
      fullHeight: heights.full,
      forceState: this.allState
    });
  }
};

/**
 * Create a new sorter.
 *
 * @param {Object} options Object of options to use when creating the toggle. See the constructor for more info.
 *
 * @return {Toggler} Instance of a toggler.
 */
exports.create = function (options) {
  return new Toggler(options);
};