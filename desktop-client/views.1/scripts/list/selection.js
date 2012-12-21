'use strict';

exports.ListSelection = ListSelection;

/**
 * Selection handling for the list view.
 *
 * @constructor
 * @private
 */
function ListSelection() {
  this.indices = [];
  this.uris = [];
  this.items = [];
  this.lists = [];
  this.isDirectionDown = false;
  this.isDirectionUp = false;
  this.focus = {
    item: 0,
    list: 0
  };
  this.origin = {
    item: 0,
    list: 0
  };

  this.multiselectEnabled = true;
}

/**
 * Add a new list to the index registry.
 */
ListSelection.prototype.addList = function(list) {
  this.indices.push([]);
  this.uris.push([]);
  this.items.push([]);
  var listIndex = this.lists.push(list) - 1;

  // Only enable multi-select for desktop so far
  if (listIndex === 0) {
    this.multiselectEnabled = list.model.userDevice === 'desktop';
  }

  var self = this;
  list.addEventListener('insert', function(e) { self._onItemInsert(listIndex, e); });
  list.addEventListener('remove', function(e) { self._onItemRemove(listIndex, e); });
};

/**
 * Add a single item to the selection.
 *
 * @param {number} index     Index for the item within the list.
 * @param {number} listIndex Index for the list within the list chain.
 */
ListSelection.prototype.add = function(index, listIndex) {
  var list = this.lists[listIndex];
  if (!list) {
    return;
  }

  if (!this.multiselectEnabled) {
    this.clear();
  }

  var indexList = this.indices[listIndex];
  var uriList = this.uris[listIndex];
  var itemList = this.items[listIndex];
  var uris = list.model.uris;
  var items = list.model.items;

  indexList.push(index);
  uriList.push({ index: index, uri: uris[index] });
  itemList.push({ index: index, item: items[index] });

  indexList.sort(function(a, b) { return a - b; });
  uriList.sort(function(a, b) { return a.index - b.index; });
  itemList.sort(function(a, b) { return a.index - b.index; });

  this.setFocus(index, listIndex);
  this.isDirectionUp = false;
  this.isDirectionDown = false;

  list.view.selectItem(index);
};

/**
 * Remove a single item from the selection.
 *
 * @param {number} index     Index for the item within the list.
 * @param {number} listIndex Index for the list within the list chain.
 */
ListSelection.prototype.remove = function(index, listIndex) {
  var indexList = this.indices[listIndex];
  var uriList = this.uris[listIndex];
  var itemList = this.items[listIndex];
  var list = this.lists[listIndex];

  if (!indexList) {
    return;
  }

  var i = indexList.indexOf(index);
  if (~i) {
    indexList.splice(i, 1);
    uriList.splice(i, 1);
    itemList.splice(i, 1);

    list.view.deselectItem(index);

    var focusIndex = index + (this.isDirectionDown ? -1 : (this.isDirectionUp ? 1 : 0));
    if (list.model.items[focusIndex] === undefined) {
      listIndex = this.isDirectionDown ? listIndex - 1 : listIndex + 1;
      if (this.lists[listIndex] === undefined) {
        return;
      }
      focusIndex = this.isDirectionDown ? this.lists[listIndex].model.items.length - 1 : 0;
    }
    this.setFocus(focusIndex, listIndex);
  }
};

/**
 * Add a range of items to the selection in one list.
 *
 * @param {number} start     Index for the start item within the list.
 * @param {number} end       Index for the end item within the list.
 * @param {number} listIndex Index for the list within the list chain.
 */
ListSelection.prototype.addRange = function(start, end, listIndex) {
  var indexList = this.indices[listIndex];
  var uriList = this.uris[listIndex];
  var itemList = this.items[listIndex];
  var list = this.lists[listIndex];

  var uris = list.model.uris;
  var items = list.model.items;

  if (indexList) {
    var indices = [];
    var newURIs = [];
    var newItems = [];

    if (!this.multiselectEnabled) {
      this.clear();
      start = end;
    }

    for (var i = start; i < end + 1; i++) {
      if (!~indexList.indexOf(i)) {
        indices.push(i);
        newURIs.push({ index: i, uri: uris[i] });
        newItems.push({ index: i, item: items[i] });
      }
    }
    indexList = indexList.concat(indices);
    uriList = uriList.concat(newURIs);
    itemList = itemList.concat(newItems);

    indexList.sort(function(a, b) { return a - b; });
    uriList.sort(function(a, b) { return a.index - b.index; });
    itemList.sort(function(a, b) { return a.index - b.index; });

    this.indices[listIndex] = indexList;
    this.uris[listIndex] = uriList;
    this.items[listIndex] = itemList;

    for (var i = 0, l = indices.length; i < l; i++) {
      list.view.selectItem(indices[i]);
    }
  }
};

/**
 * Remove a range of items from the selection in one list.
 *
 * @param {number} start     Index for the start item within the list.
 * @param {number} end       Index for the end item within the list.
 * @param {number} listIndex Index for the list within the list chain.
 */
ListSelection.prototype.removeRange = function(start, end, listIndex) {
  var indexList = this.indices[listIndex];
  var uriList = this.uris[listIndex];
  var itemList = this.items[listIndex];
  var list = this.lists[listIndex];

  if (!indexList) {
    return;
  }

  var i = indexList.indexOf(start);
  if (~i) {
    indexList.splice(i, end - start + 1);
    uriList.splice(i, end - start + 1);
    itemList.splice(i, end - start + 1);
  }

  for (var i = start; i < end + 1; i++) {
    list.view.deselectItem(i);
  }
};

/**
 * Add multiple items to the selection.
 * It will add all items between the current focus and the specified position.
 *
 * @param {number} index     Index for the item within the list.
 * @param {number} listIndex Index for the list within the list chain.
 */
ListSelection.prototype.addTo = function(index, listIndex) {
  this._removeOverflowingItems(index, listIndex);

  this.isDirectionUp = listIndex < this.origin.list ? true : (listIndex === this.origin.list ? (index < this.origin.item ? true : false) : false);
  this.isDirectionDown = listIndex > this.origin.list ? true : (listIndex === this.origin.list ? (index > this.origin.item ? true : false) : false);

  var newFocus = { item: index, list: listIndex };
  var currentFocus = { item: this.focus.item, list: this.focus.list };
  var topBound = this.isDirectionDown ? currentFocus : newFocus;
  var bottomBound = this.isDirectionDown ? newFocus : currentFocus;

  if (!this.multiselectEnabled) {
    this.clear();
    topBound = newFocus;
    bottomBound = newFocus;
  }

  if (topBound.list === bottomBound.list) {
    this.addRange(topBound.item, bottomBound.item, topBound.list);
    this.setFocus(index, listIndex);

  } else {
    for (var i = topBound.list, l = bottomBound.list + 1; i < l; i++) {
      if (i === topBound.list) {
        this.addRange(topBound.item, this.lists[i].model.items.length - 1, i);
      } else if (i === bottomBound.list) {
        this.addRange(0, bottomBound.item, i);
      } else {
        this.addRange(0, this.lists[i].model.items.length - 1, i);
      }
      if (i === listIndex) {
        this.setFocus(index, listIndex);
      }
    }
  }
};

/**
 * Remove multiple items from the selection.
 * It will remove all items between the current focus and the specified position.
 *
 * @param {number} index     Index for the item within the list.
 * @param {number} listIndex Index for the list within the list chain.
 */
ListSelection.prototype.removeTo = function(index, listIndex) {

  var newFocus = { item: index, list: listIndex };
  var currentFocus = { item: this.focus.item, list: this.focus.list };
  var topBound = this.isDirectionDown ? newFocus : currentFocus;
  var bottomBound = this.isDirectionDown ? currentFocus : newFocus;

  if (topBound.list === bottomBound.list) {
    this.removeRange(topBound.item, bottomBound.item, topBound.list);
    this.setFocus(index + (this.isDirectionDown ? -1 : 1), listIndex);

  } else {
    for (var i = topBound.list, l = bottomBound.list + 1; i < l; i++) {
      if (i === topBound.list) {
        this.removeRange(topBound.item, this.lists[i].model.items.length - 1, i);
      } else if (i === bottomBound.list) {
        this.removeRange(0, bottomBound.item, i);
      } else {
        this.removeRange(0, this.lists[i].model.items.length - 1, i);
      }
      if (i === listIndex) {
        this.setFocus(index + (this.isDirectionDown ? -1 : 1), listIndex);
      }
    }
  }
};

/**
 * Clear all selections.
 */
ListSelection.prototype.clear = function() {
  var lists = this.lists;
  for (var i = 0, l = lists.length; i < l; i++) {
    lists[i].view.deselect();
  }

  var indexLists = this.indices;
  var uriLists = this.uris;
  var itemLists = this.items;
  for (var i = 0, l = indexLists.length; i < l; i++) {
    indexLists[i].length = 0;
    uriLists[i].length = 0;
    itemLists[i].length = 0;
  }
  this.isDirectionUp = false;
  this.isDirectionDown = false;
};

/**
 * Check if the specified item is selected.
 *
 * @param {number} index     Index for the item within the list.
 * @param {number} listIndex Index for the list within the list chain.
 *
 * @return {boolean} True if selected, false otherwise.
 */
ListSelection.prototype.isSelected = function(index, listIndex) {
  var list = this.indices[listIndex];
  var res = list ? !!~list.indexOf(index) : false;
  return res;
};

/**
 * Check if the specified list has a selected item.
 *
 * @param {number} listIndex Index for the list within the list chain.
 *
 * @return {boolean} True if it has a selection, false otherwise.
 */
ListSelection.prototype.hasSelection = function(listIndex) {
  var list = this.indices[listIndex];
  return list ? list.length > 0 : false;
};

/**
 * Check if the specified item is within the current selection group.
 *
 * @param {number} index     Index for the item within the list.
 * @param {number} listIndex Index for the list within the list chain.
 *
 * @return {boolean} True if within group, false otherwise.
 */
ListSelection.prototype.isInCurrentGroup = function(index, listIndex) {
  if (!this.isSelected(index, listIndex)) { return false; }

  var topBound = this.isDirectionDown ? this.origin : this.focus;
  var bottomBound = this.isDirectionDown ? this.focus : this.origin;

  if (listIndex > topBound.list && listIndex < bottomBound.list) {
    return true;
  } else if (listIndex === topBound.list || listIndex === bottomBound.list) {
    if (topBound.list === listIndex && index >= topBound.item) {
      return true;
    } else if (bottomBound.list === listIndex && index <= bottomBound.item) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
};

/**
 * Get a specific item index for a specific list.
 *
 * @param {number} index     Index for the item within the list.
 * @param {number} listIndex Index for the list within the list chain.
 *
 * @return {number|boolean} The index in that position, or false if not found.
 */
ListSelection.prototype.getIndex = function(index, listIndex) {
  var list = this.indices[listIndex];
  return list ? (list[index] !== undefined ? list[index] : false) : false;
};

/**
 * Get all the selected indices within a list.
 *
 * @param {number} listIndex Index for the list within the list chain.
 *
 * @return {Array|boolean} An array of indices that are selected. False if not found.
 */
ListSelection.prototype.getSelectionForList = function(listIndex) {
  return this.indices[listIndex] || false;
};

/**
 * Set the position of the selection origin.
 *
 * @param {number} index     Index for the item within the list.
 * @param {number} listIndex Index for the list within the list chain.
 */
ListSelection.prototype.setOrigin = function(index, listIndex) {
  var list = this.indices[listIndex];
  if (list) {
    this.origin.item = index;
    this.origin.list = listIndex;
  }
};

/**
 * Set the position of the selection focus.
 *
 * @param {number} index     Index for the item within the list.
 * @param {number} listIndex Index for the list within the list chain.
 */
ListSelection.prototype.setFocus = function(index, listIndex) {
  var list = this.indices[listIndex];
  if (list) {
    this.focus.item = index;
    this.focus.list = listIndex;

    if (listIndex === this.origin.list && index === this.origin.item) {
      this.isDirectionDown = false;
      this.isDirectionUp = false;
    }
  }
};

/**
 * Remove items that are overflowing the current group.
 * This happens when you select say items 6 to 10, then select to something
 * lower than 6, like 2. In that case, items 7 to 10 should be deselected
 * and 2 to 5 should be added to selection. This method handles the deselection.
 *
 * @private
 *
 * @param {number} index     Index for the item within the list.
 * @param {number} listIndex Index for the list within the list chain.
 */
ListSelection.prototype._removeOverflowingItems = function(index, listIndex) {
  var removeFirst = false;
  var originItem = this.origin.item;
  var originList = this.origin.list;

  if (this.isDirectionDown) {
    if (listIndex < originList) {
      removeFirst = true;
    } else if (listIndex === originList && index < originItem) {
      removeFirst = true;
    }
  } else if (this.isDirectionUp) {
    if (listIndex > originList) {
      removeFirst = true;
    } else if (listIndex === originList && index > originItem) {
      removeFirst = true;
    }
  }

  if (removeFirst) {
    this.removeTo(originItem + (this.isDirectionDown ? 1 : -1), originList);
  }
};


/**
 * Get data for all selected items.
 *
 * @return {Object} Object containing indices, uris and items for selection.
 */
ListSelection.prototype.getSelectionData = function(specificListIndex) {
  var indices = [];
  var uris = [];
  var urls = [];
  var items = [];

  var indexLists = this.indices;
  var uriLists = this.uris;
  var itemLists = this.items;
  var indexList, uriList, itemList;

  var firstSelectedListIndex;
  var isSelectionFromSameList = true;
  for (var i = 0, l = indexLists.length; i < l; i++) {
    if (specificListIndex === undefined || i === specificListIndex) {
      indexList = indexLists[i];
      uriList = uriLists[i];
      itemList = itemLists[i];

      // Check if the selected items are all from the same list
      if (indexList.length > 0) {
        if (firstSelectedListIndex === undefined) {
          firstSelectedListIndex = i;
        }
        if (firstSelectedListIndex !== i) {
          isSelectionFromSameList = false;
        }
      }

      for (var n = 0, len = indexList.length; n < len; n++) {
        indices.push({ item: indexList[n], list: i });
        uris.push(uriList[n].uri);
        urls.push(uriList[n].uri.toSpotifyURL());
        items.push(itemList[n].item);
      }
    }
  }

  return {
    indices: indices,
    uris: uris,
    urls: urls,
    items: items,
    fromSameList: isSelectionFromSameList
  };
};

/**
 *
 * @param {number} listIndex List index within the chain of lists.
 * @param {Object} e Event object for the list event.
 *
 * @private
 */
ListSelection.prototype._onItemInsert = function(listIndex, e) {
  var start = e.start;
  var end = e.end;
  var num = end - start;

  var indexList = this.indices[listIndex];
  var uriList = this.uris[listIndex];
  var itemList = this.items[listIndex];

  // Update selection storage
  for (var i = 0, l = indexList.length; i < l; i++) {
    if (indexList[i] >= start) {
      indexList[i] += num;
      uriList[i].index += num;
      itemList[i].index += num;
    }
  }

  // Adjust the origin of the selection
  if (this.origin.list === listIndex && this.origin.item >= start) {
    this.setOrigin(this.origin.item + num, listIndex);
  }

  // Adjust the focus of the selection
  if (this.focus.list === listIndex && this.focus.item >= start) {
    this.setFocus(this.focus.item + num, listIndex);
  }
};

/**
 *
 * @param {Object} e Event object for the list event.
 *
 * @private
 */
ListSelection.prototype._onItemRemove = function(listIndex, e) {
  var start = e.start;
  var end = e.end;
  var num = end - start;

  var indexList = this.indices[listIndex];
  var uriList = this.uris[listIndex];
  var itemList = this.items[listIndex];
  var list = this.lists[listIndex];

  // Update selection storage and send events (through view.deselectItem)
  for (var i = 0, l = indexList.length; i < l; i++) {
    if (indexList[i] >= start && indexList[i] < end) {
      var currentIndex = indexList[i];
      indexList.splice(i, 1);
      uriList.splice(i, 1);
      itemList.splice(i, 1);
      list.view.deselectItem(currentIndex);
      i--;
      l--;
    } else if (indexList[i] >= end) {
      indexList[i] = Math.max(indexList[i] - num, 0);
      uriList[i].index = Math.max(uriList[i].index - num, 0);
      itemList[i].index = Math.max(itemList[i].index - num, 0);
    }
  }

  // Adjust the origin of the selection
  if (this.origin.list === listIndex && this.origin.item >= start) {
    if (this.origin.item < end) {
      var isSameList = this.focus.list === this.origin.list;
      var isFocusMoreThanOrigin = this.focus.item > this.origin.item;
      var isSelUp = isSameList ? (isFocusMoreThanOrigin ? false : true) : (this.focus.list > this.origin.list ? false : true);
      var siblingIndex = start + (isSelUp ? -1 : 0);
      var isSelGroup = indexList.indexOf(siblingIndex) > -1;
      var originIndex = isSelGroup ? siblingIndex : start;
      this.setOrigin(originIndex, listIndex);
    } else {
      this.setOrigin(this.origin.item - num, listIndex);
    }
  }

  // Adjust the focus of the position
  if (this.focus.list === listIndex && this.focus.item >= start) {
    if (this.focus.item < end) {
      this.setFocus(Math.max(start - 1, 0), listIndex);
    } else {
      this.setFocus(this.focus.item - num, listIndex);
    }
  }
};
