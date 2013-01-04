/**
 * Used for adding default drag support for elements.
 * The default drag will use a tooltip as drag image (styled
 * in $api).
 *
 * @constructor
 */
function Drag() {
  this.customElementHandlers = [];
  this.hasDragSupport = !!SP.addDragHandler;

  // Add custom elements as a special drag type
  if (this.hasDragSupport) {
    var testCustom = SP.bind(this._testCustom, this);
    var getCustomText = SP.bind(this._getCustomText, this);
    var getCustomData = SP.bind(this._getCustomData, this);
    this.addHandler(testCustom, getCustomText, getCustomData);
  }
}

/**
 * Add a special handler for a specific kind of elements to drag and drop.
 * With this, you will provide functions that will run inside the dragstart
 * event handler, to test for your specific kind, get your drag data and
 * tooltip text.
 *
 * @param {function(HTMLElement): boolean} testFunc Tests whether the element
 *     should be handled by this handler.
 * @param {function(HTMLElement): Object} getDataFunc Gets the data that the
 *     drag event should hold. The object returned should have mime types as
 *     keys and data values as the property value, as a string.
 * @param {function(HTMLElement): string} getTextFunc Gets the text that should
 *     be put in the drag tooltip.
 */
Drag.prototype.addHandler = function(testFunc, getDataFunc, getTextFunc) {
  if (this.hasDragSupport) {
    SP.addDragHandler(testFunc, getDataFunc, getTextFunc);
  }
};

/**
 * Enable the default drag and drop tooltip for an element.
 *
 * @param {HTMLElement} elem The element to be draggable.
 * @param {function(): Object=} opt_getData Function that returns a data object.
 *     The data object should have mime types as keys, and the value should
 *     be the data value for that mime type as a string. If left out,
 *     a default function will return the mime type text/plain with the
 *     title attribute of the element as data (or the text content if title
 *     is not available).
 * @param {function(): string=} opt_getText Function that returns a string to
 *     be used as the text inside the tooltip. If left out, a default function
 *     will return the title attribute of the element (or the text content if
 *     title is not available).
 */
Drag.prototype.enableForElement = function(elem, opt_getData, opt_getText) {
  var getData = opt_getData || function() {
    return {
      'text/plain': elem.title || elem.textContent || ''
    };
  };
  var getText = opt_getText || function() {
    return elem.title || elem.textContent || '';
  };
  var index = this.customElementHandlers.push({
    getText: getText,
    getData: getData
  });
  elem.setAttribute('data-dnd-custom-index', index.toString());
  elem.setAttribute('draggable', 'true');
};

/**
 * Get the custom index from an element.
 *
 * @param {HTMLElement} elem The element to get the custom index from.
 *
 * @return {number|boolean} The index, or false if not found.
 *
 * @private
 */
Drag.prototype._getCustomIndex = function(elem) {
  var dndCustomIndex = elem.getAttribute('data-dnd-custom-index');
  return dndCustomIndex !== null && dndCustomIndex !== '' ? dndCustomIndex : false;
};

/**
 * The test that should happen in the dragstart handler, to test for
 * a custom element added through the enableForElement method.
 *
 * @param {HTMLElement} elem The element that is dragged.
 *
 * @return {boolean} True if this is a custom element.
 *
 * @private
 */
Drag.prototype._testCustom = function(elem) {
  var dndCustomIndex = this._getCustomIndex(elem);
  if (dndCustomIndex !== false) {
    if (this.customElementHandlers[dndCustomIndex]) {
      return true;
    }
  }
  return false;
};

/**
 * Get the tooltip text for an element.
 * This will be called from the dragstart event handler,
 * and use the function provided in the method enableForElement.
 *
 * @param {HTMLElement} elem The element that is dragged.
 *
 * @return {string} The tooltip text.
 *
 * @private
 */
Drag.prototype._getCustomText = function(elem) {
  var dndCustomIndex = this._getCustomIndex(elem);
  return this.customElementHandlers[dndCustomIndex].getText();
};

/**
 * Get the drag data for an element.
 * This will be called from the dragstart event handler,
 * and use the function provided in the method enableForElement.
 *
 * @param {HTMLElement} elem The element that is dragged.
 *
 * @return {Object} Object with data. Keys are mime types, values are strings.
 *
 * @private
 */
Drag.prototype._getCustomData = function(elem) {
  var dndCustomIndex = this._getCustomIndex(elem);
  return this.customElementHandlers[dndCustomIndex].getData();
};

exports.drag = new Drag();
