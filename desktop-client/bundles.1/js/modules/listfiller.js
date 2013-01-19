'use strict';

/**
 * List filler for a nicer GUI.
 * This will add enough empty list items to fill the viewport.
 *
 * @module listFiller
 */
var listFiller = {

  isInitialized: false,
  bundleItemCount: 0,

  /**
   * Updates the filler list to have just enough items to fill the viewport.
   *
   * @param {boolean} fromResize True if the function is called from a resize event.
   */
  update: function(fromResize) {
    var viewHeight, currentNumFillerItems, newNumFillerItems, diff, numBundleItems, i;

    // Set list heights
    viewHeight = window.innerHeight - this.footerElem.clientHeight;
    this.wrapperElem.style.height = window.innerHeight + 'px';
    this.listsElem.style.maxHeight = viewHeight + 'px';

    // Add starter items the first time it's called
    if (!this.isInitialized) {
      this.isInitialized = true;

      this.addStartItems();
      this.setOrderClass();

    // All calls after the first one will just add or remove items
    } else {

      // Calculate the difference in number of filler items
      newNumFillerItems = this.calcNumFillerItems(fromResize ? this.bundleItemCount : undefined);
      currentNumFillerItems = this.fillerItemCount;
      diff = newNumFillerItems - currentNumFillerItems;

      // Either add or remove items, depending on what the difference in number of items is
      if (diff > 0) {
        for (i = 0; i < diff; i++) {
          this.addItem();
        }
      } else if (diff < 0) {
        for (i = 0; i < Math.abs(diff); i++) {
          this.removeItem();
        }
      }

      // Switch the order class to keep the correct item style
      //  (the items cycle between two background colors)
      this.setOrderClass();
    }
  },

  /**
   * Get the number of real bundle items in the list
   *
   * @return {number} Number of items.
   */
  getNumItems: function() {
    var bundles = this.listsElem.querySelectorAll('.list.active .bundle');
    this.bundleItemCount = bundles.length;

    return bundles ? this.bundleItemCount : 0;
  },

  /**
   * Switches class for the filler list, so the items are styled correctly.
   * Every other item in the list has a different appearance to differentiate
   * between items more easily.
   */
  setOrderClass: function() {
    var numBundleItems = this.getNumItems();
    this.bundlesFillerElem.classList.remove('odd');
    this.bundlesFillerElem.classList.remove('even');
    this.bundlesFillerElem.classList.add(numBundleItems % 2 === 0 ? 'even' : 'odd');
  },

  /**
   * Get the number of filler items needed to fill the viewport.
   *
   * @return {number} Number of items.
   */
  calcNumFillerItems: function(numBundleItems) {
    var viewHeight, bundle, itemHeight, num;

    numBundleItems = numBundleItems || this.getNumItems();
    viewHeight = window.innerHeight - this.footerElem.clientHeight;
    bundle = this.listsElem.children[0].querySelector('.bundle');
    itemHeight = numBundleItems > 0 ? (bundle ? bundle.clientHeight : 0) : 60;
    num = itemHeight > 0 ? Math.ceil((viewHeight - numBundleItems * itemHeight) / itemHeight) : 0;

    return num;
  },

  /**
   * Add the first items the first time we update the list.
   */
  addStartItems: function() {
    for (var i = 0, l = this.calcNumFillerItems(); i < l; i++) {
      this.addItem();
    }
    this.fillerItemCount = l;
  },

  /**
   * Add a new filler list item to the DOM.
   */
  addItem: function() {
    this.bundlesFillerElem.insertAdjacentHTML('beforeend', '<li class="bundle"></li>');
    this.fillerItemCount++;
  },

  /**
   * Remove a filler list item from the DOM.
   */
  removeItem: function() {
    var child = this.bundlesFillerElem.lastElementChild;
    if (child) {
      this.bundlesFillerElem.removeChild(child);
      this.fillerItemCount--;
    }
  }
};

/**
 * Set up data that the module needs.
 *
 * @param {Object} app Main app object.
 */
exports.setup = function(app) {
  listFiller.wrapperElem = app.wrapperElem;
  listFiller.listsElem = app.listsElem;
  listFiller.bundlesFillerElem = app.bundlesFillerElem;
  listFiller.footerElem = app.footerElem;

  // Always update the list filler items to fit the viewport when the window is resized
  window.addEventListener('resize', function() {
    listFiller.update(true);
  }, false);
};

exports.update = listFiller.update.bind(listFiller);
