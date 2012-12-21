'use strict';

/**
 * List sorter.
 *
 * @module sorter
 */

/**
 * A sorter object.
 * It will keep sort data for a list.
 *
 * @constructor
 * @param {string}     wrapper CSS selector for a wrapper element containing the the sortable columns
 * @param {BundleList} list    Bundle list to sort.
 *
 * @property {HTMLElement} wrapper DOM element for the passed in CSS selector.
 * @property {BundleList} list Bundle list to sort.
 */
function Sorter (wrapper, list) {
  var cols, i, l;

  // Set the objects
  this.wrapper = document.querySelector(wrapper);
  this.list = list;

  // Get all sortable columns inside the wrapper and add event handlers
  //   to sort the list when the columns are being clicked.
  cols = this.wrapper.querySelectorAll('.sortable');
  for (i = 0, l = cols.length; i < l; i++) {
    cols[i].addEventListener('click', this.sort.bind(this, cols[i]), false);
  }
}

/**
 * Sort the list in the next order.
 *
 * @param {HTMLElement} elem DOM element that triggers the sorting.
 */
Sorter.prototype.sort = function (elem) {
  var conversion, order, direction;

  // Get the sort config
  order = elem.dataset.sortOrder || 'type';
  direction = elem.dataset.sortDirection || 'asc';

  // Add class to set specific style for the column when the list is actually sorted
  elem.classList.add('sorted');

  // Toggle between ascending and descending type lists
  if (order === 'type' && direction === 'asc') {
    this.list.sort('type', 'desc');
    elem.dataset.sortOrder = 'type';
    elem.dataset.sortDirection = 'desc';
    elem.classList.remove('sorted-asc');
    elem.classList.add('sorted-desc');
  } else if (order === 'type' && direction === 'desc') {
    this.list.sort('type', 'asc');
    elem.dataset.sortOrder = 'type';
    elem.dataset.sortDirection = 'asc';
    elem.classList.remove('sorted-desc');
    elem.classList.add('sorted-asc');
  }
}

/**
 * Create a new sorter.
 *
 * @param {string}     wrapper CSS selector for a wrapper element containing the the sortable columns
 * @param {BundleList} list    Bundle list to sort.
 *
 * @return {Sorter} Instance of a sorter.
 */
exports.create = function (wrapper, list) {
  return new Sorter(wrapper, list);
};