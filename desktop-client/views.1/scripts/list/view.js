'use strict';

require([
  '$api/models',
  '$views/list/selection#ListSelection',
  '$views/utils/css',
  '$views/utils/dom',
  '$views/utils/dnd',
  '$views/contextapp#ContextApp',
  '$api/library#Library'
], function(models, ListSelection, css, dom, dnd, ContextApp, Library) {

  exports.ListView = ListView;

  /**
   * A list view for all the UI handling.
   *
   * @constructor
   * @private
   *
   * @param {List} list The list instance.
   */
  function ListView(list) {
    this.list = list;
    this.rows = [];

    this.selection = new ListSelection();
    this.selection.addList(list);

    this.popupShown = false;
    this.numLoadedItems = 0;
    this.shownIndices = [];

    this.createBase();
  }

  /**
   * Reset the view.
   */
  ListView.prototype.reset = function() {
    this.rows = [];
    this.numLoadedItems = 0;
    this.nodes.tableBody.innerHTML = '';
    this.setFixedHeight(false);
    this.getNumItemsPerBucket();
  };

  /**
   * Initialize the view.
   */
  ListView.prototype.init = function() {

    var options = this.list.options;
    var isFixedHeight = options.height === 'fixed';
    var isFixedHeader = options.header === 'fixed';
    var appScrollElement = options.scrollElement || window;
    this.scrollElement = isFixedHeight ? (isFixedHeader ? this.nodes.body : this.node) : appScrollElement;

    this.makeFocusable();
    this.makeSelectable();
    this.fixWidgetButtonVisibility();
    this.fixConnectedListsFocus();

    if (dnd.drag.hasDragSupport) {
      this.addDragListener();
    }

    if (typeof options.getItem === 'function') {
      this.getItem = options.getItem;
    }

    var self = this;

    var resize = function() {
      self.updateWidths();
      self.checkResizeEdge();
    };
    this.list.eventHandlers.push({ type: 'resize', handler: resize, obj: window, dom: true });
    dom.addEventListener(window, 'resize', resize);

    if ((options.header === 'fixed' && options.height === 'dynamic') || (options.fetch === 'scroll')) {
      var scroll = function(e) {
        self.onScroll(e);
      };
      this.list.eventHandlers.push({ type: 'scroll', handler: scroll, obj: this.scrollElement, dom: true });
      dom.addEventListener(this.scrollElement, 'scroll', scroll, false);
    }

    var playerChange = function(e) {
      self.playerChange(e);
    };
    this.list.eventHandlers.push({ type: 'change', handler: playerChange, obj: models.player, dom: false });
    models.player.addEventListener('change', playerChange);

    // Observe the starred list for changes if the 'star' field is used
    var hasStarField = this.list.options.fields.indexOf('star') > -1;
    if (hasStarField && this.list.isTrackList) {

      // Don't do it for the starred list, since the tracks will disappear there
      var isStarredList = this.list.item.uri.indexOf(':starred') > -1;
      if (!isStarredList) {
        var library = Library.forCurrentUser();
        library.load('starred').done(function() {
          var starredHandler = function(e) { self.updateStarred(e.type, e.uris); };

          self.list.eventHandlers.push({ type: 'insert', handler: starredHandler, obj: library.starred, dom: false });
          library.starred.addEventListener('insert', starredHandler);

          self.list.eventHandlers.push({ type: 'remove', handler: starredHandler, obj: library.starred, dom: false });
          library.starred.addEventListener('remove', starredHandler);
        });
      }
    }
  };

  /**
   * Called when the list is initialized (which must happen
   * after the list is added to the DOM).
   */
  ListView.prototype.addedToDOM = function() {
    this.updateWidths();
    this.getNumItemsPerBucket();
    this.setFixedHeight();
    this.setNodeHeightFromNumItems();
  };

  /**
   * Set focus to the list.
   * If the selected element is out of view, it will first scroll it
   * into view, so that the page isn't scrolled in an undesirable way.
   */
  ListView.prototype.focus = function() {
    if (this.selection.focus.list === this.list.listIndex) {
      var row = this.rows[this.selection.focus.item];

      if (row) {
        var offset = row.getBoundingClientRect().top;
        if (offset < 0 || offset > window.innerHeight) {
          row.scrollIntoView(offset < 0);
        }
      }
    }

    this.node.focus();
  };

  /**
   * Unfocus this list.
   */
  ListView.prototype.blur = function() {
    this.node.blur();
  };

  /**
   * Set CSS classes that will add some styles to the list,
   * especially a height. Removing the classes will reset the height of the list.
   *
   * @param {boolean} doAdd Whether the CSS classes should be added or removed.
   */
  ListView.prototype.setFixedHeight = function(doAdd) {
    var options = this.list.options;
    var method = doAdd === false ? 'removeClass' : 'addClass';

    if (options.header !== 'no') {
      css[method](this.node, 'sp-list-using-header');
    }
    if (options.height === 'fixed' || doAdd === false) {
      css[method](this.node, 'sp-list-fixed-height');
    }
    if (options.header === 'fixed' || doAdd === false) {
      css[method](this.node, 'sp-list-wrapper-fixed-header');
    }
    if ((options.height === 'fixed' && options.header === 'fixed') || doAdd === false) {
      css[method](this.nodes.headerWrapper, 'sp-list-header-fixed-with-fixed-height');
    }
  };

  /**
   * Set the height of the public list node based on the specified number of items.
   * If no more data can be snapshotted, that number of items will be used.
   */
  ListView.prototype.setNodeHeightFromNumItems = function() {
    var options = this.list.options;
    var numItems = options.numItems;
    var isFixed = options.height === 'fixed';

    if (!isFixed && numItems > 0) {
      var model = this.list.model;
      if (model.snapshots.length > 0) {
        this.nodeHeightAdjusted = true;
        if (numItems > model.totalLength) {
          numItems = model.totalLength;
        }
      }
      var headerHeight = (this.nodes.headerWrapper ? this.nodes.headerWrapper.offsetHeight : 0);
      var totalItemsHeight = this.itemHeight * numItems;
      var totalHeight = headerHeight + totalItemsHeight;
      this.node.style.height = totalHeight + 'px';
    }
  };

  /**
   * Create the base DOM structure.
   * This will set the node property of the view, which the
   * list instance will then set to its node property.
   */
  ListView.prototype.createBase = function() {
    this.node = this.list.node || getDOMFromTemplate('base');
    css.addClass(this.node, 'sp-list-type-' + this.list.type.toLowerCase());
    css.addClass(this.node, 'sp-list-layout-' + this.list.layout.toLowerCase());
    this.createList();

    if (this.list.isDisc) {
      this.node.setAttribute('data-is-disc', 'true');
    }

    // Prevent selection of content above the list.
    // Selection is prevented by CSS for the list itself, but at least Safari
    // will start selecting other content when double clicking the list.
    var selectstart = function(e) { e.preventDefault(); };
    this.list.eventHandlers.push({ type: 'selectstart', handler: selectstart, obj: this.node, dom: true });
    dom.addEventListener(this.node, 'selectstart', selectstart);
  };

  /**
   * Create the DOM needed by the actual list.
   */
  ListView.prototype.createList = function() {
    var node = this.node;
    var discNumber = this.list.isPartOfDiscsList ? getDOMFromTemplate('discNumber') : null;
    var list = getDOMFromTemplate('list');
    var body = getDOMFromTemplate('body');

    css.addClass(node, 'sp-list-style-' + this.list.options.style);

    if (this.list.options.header !== 'no') {
      var header = getDOMFromTemplate('header');
      list.appendChild(header);
    }

    list.appendChild(body);

    if (discNumber) {
      discNumber.innerHTML = this.list.discNumber;
      node.appendChild(discNumber);
    }
    node.appendChild(list);

    this.nodes = {
      wrapper: list,

      body: body,
      tableBody: list.querySelector('.sp-list-table-body'),

      headerWrapper: list.querySelector('.sp-list-header'),
      headerContent: list.querySelector('.sp-list-header-table-wrapper'),
      headerRow: list.querySelector('.sp-list-header-row'),

      colgroups: {
        header: list.querySelector('.sp-list-header .sp-list-colgroup'),
        body: list.querySelector('.sp-list-body .sp-list-colgroup')
      }
    };
  };

  /**
   * Add fields to the list header.
   */
  ListView.prototype.addFields = function() {
    var isUsingHeader, fields, header, colgroups, i, l, cell, handle, colHeader, colBody, anyDynamicFieldYet;
    isUsingHeader = this.list.options.header !== 'no';
    fields = this.list.model.fields;
    header = this.nodes.headerRow;
    colgroups = this.nodes.colgroups;

    for (i = 0, l = fields.length; i < l; i++) {
      if (isUsingHeader) {
        cell = document.createElement('th');
        cell.className = 'sp-list-heading ' + fields[i].className;
        cell.innerHTML = fields[i].title || '&nbsp;';

        if (!anyDynamicFieldYet && !fields[i].fixedWidth) {
          anyDynamicFieldYet = true;
        }

        if (
            // If either this field or the next does not have a fixed width, but only if there has been a flexible field yet
            ((!fields[i].fixedWidth || (fields[i + 1] && !fields[i + 1].fixedWidth)) && anyDynamicFieldYet) &&
            // If the first field has a fixed width and this is another field than the first, or if the first is not fixed
            ((fields[0].fixedWidth && i > 0) || !fields[0].fixedWidth) &&
            // If the last field has a fixed width and this is an earler field than the one before the last, or if the last is not fixed
            ((fields[l - 1].fixedWidth && i < l - 2) || !fields[l - 1].fixedWidth)
        ) {
          handle = document.createElement('div');
          handle.className = 'sp-list-heading-handle';
          handle.colIndex = i;
          this.makeResizable(handle);
          cell.appendChild(handle);
        }
        header.appendChild(cell);

        colHeader = document.createElement('col');
        colgroups.header.appendChild(colHeader);
      }

      colBody = document.createElement('col');
      colgroups.body.appendChild(colBody);
    }
  };

  /**
   * Update the widths for all columns.
   * The widths are set on col elements, which the browser will then use to
   * set the widths of all the cells.
   *
   * It also sets the total width of the header when it is fixed.
   */
  ListView.prototype.updateWidths = function() {
    this.fullWidth = this.node.offsetWidth;
    this.list.dispatchEvent('resize');
    if (this.list.parentList) { this.list.parentList.dispatchEvent('resize'); }

    var options = this.list.options;
    if (options.height === 'dynamic' && options.header === 'fixed' && this.nodes.headerWrapper.fixed) {
      this.nodes.headerWrapper.style.width = this.fullWidth + 'px';
    }
    if (options.height === 'fixed' && options.header === 'fixed') {
      var bodyWidth = this.nodes.tableBody.offsetWidth || this.nodes.body.offsetWidth;
      this.nodes.headerContent.style.width = bodyWidth + 'px';
    }

    var isUsingHeader, isTopTracks, fields, colgroups, headerCols, bodyCols, rows, cells, i, l, n, len, width;
    isUsingHeader = this.list.options.header !== 'no';
    isTopTracks = this.list.layout === 'toplist';
    fields = this.list.model.fields;
    colgroups = this.nodes.colgroups;
    headerCols = colgroups.header && colgroups.header.children;
    bodyCols = colgroups.body.children;
    rows = isTopTracks ? this.nodes.tableBody.querySelectorAll('.sp-list-item') : undefined;

    if (isTopTracks) {
      var sumFixedWidth = 0;
      for (i = 0, l = rows.length; i < l; i++) {
        cells = rows[i].children;
        sumFixedWidth = 0;
        for (n = 0, len = cells.length; n < len; n++) {
          if (!fields[n].fixedWidth) {
            if (fields[n].id === 'track') {
              var paddingRight = parseInt(css.getStyle(cells[n], 'padding-right'), 10);
              cells[n].style.paddingLeft = (sumFixedWidth + paddingRight) + 'px';
            } else {
              cells[n].style.width = (fields[n].width * 100) + '%';
            }
          } else {
            sumFixedWidth += fields[n].fixedWidth;
          }
        }
      }

    } else {

      for (i = 0, l = fields.length; i < l; i++) {
        width = fields[i].fixedWidth ? fields[i].width + 'px' : (fields[i].width * 100) + '%';
        bodyCols[i].style.width = width;

        if (isUsingHeader) {
          headerCols[i].style.width = width;
        }
      }
    }
  };

  /**
   * Check where the resize edge is and load more items if we get
   * past the edge where you would normally get more items due to
   * a scroll event.
   *
   * @param {Object} e The event object from a resize event.
   */
  ListView.prototype.checkResizeEdge = function(e) {

    var listHeight = this.node.getBoundingClientRect().height;
    var listBodyHeight = this.nodes.tableBody.getBoundingClientRect().height;
    var isFetchingMore = this.list.model.isFetchingMore;
    var compareHeight = listHeight === this.visibleHeight ? listBodyHeight : listBodyHeight - this.visibleHeight * 2;

    this.updateVisibleHeight();

    if (!isFetchingMore && listHeight > compareHeight) {
      this.list.model.moreWithLimit(1000);
    }
  };

  /**
   * Get the number of items to fetch for each bucket.
   * This is based on the height of the visible part of the list.
   * If the list height is set to 'dynamic', the height used in
   * these calculations is the viewport height. If set to 'fixed',
   * it will use the height of the parent node for the outer node
   * (parent of list.node).
   */
  ListView.prototype.getNumItemsPerBucket = function() {
    var numItems = this.list.options.numItems;
    var fetch = this.list.options.fetch;

    if (numItems > 0 || (fetch !== 'greedy')) {
      this.updateVisibleHeight();

      var fakeRow = document.createElement('tr');
      fakeRow.className = 'sp-list-item';
      fakeRow.innerHTML = '<td class="sp-list-cell"></td>';
      this.nodes.tableBody.appendChild(fakeRow);

      this.itemHeight = fakeRow.offsetHeight;
      this.nodes.tableBody.removeChild(fakeRow);
    }

    if (numItems > 0) {
      this.list.model.numItemsPerBucket = numItems;
    } else if (fetch === 'greedy') {
      this.list.model.numItemsPerBucket = 50;
    } else {
      var num = Math.floor(this.visibleHeight / this.itemHeight);
      num = num > 50 ? 50 : num;
      this.list.model.numItemsPerBucket = num;
    }
  };

  /**
   * Update the visibleHeight property with the current value.
   */
  ListView.prototype.updateVisibleHeight = function() {
    var scrollElement = this.list.options.scrollElement || (this.list.options.height === 'fixed' ? this.node.parentNode : undefined);
    this.visibleHeight = scrollElement ? scrollElement.offsetHeight : window.innerHeight;
  };

  /**
   * Remove DOM nodes for the items in the specified range.
   *
   * @param {number} start The start index within the items array.
   * @param {number} end   The end index within the items array.
   */
  ListView.prototype.removeItems = function(start, end) {
    var rows = this.rows;
    var shownIndices = this.shownIndices;
    var parent = this.rows[0].parentNode;

    for (var i = start; i < end; i++) {
      parent.removeChild(rows[i]);
    }

    rows.splice(start, end - start);

    // Update the storage of which indices that are shown in the list
    var arrBeginning = shownIndices.slice(0, start);
    var arrEnd = this.shownIndices.slice(end, shownIndices.length);
    var diff = end - start;
    arrEnd = arrEnd.map(function(i) { return i - diff; });
    this.shownIndices = arrBeginning.concat(arrEnd);
  };

  /**
   * Create DOM nodes for the items in the specified range.
   *
   * @param {number} start The start index within the items array.
   * @param {number} end   The end index within the items array.
   */
  ListView.prototype.createItems = function(start, end) {
    if (this.list.destroyed) { return; }

    var items = this.list.model.items;
    var fragment = document.createDocumentFragment();
    var row;
    for (var i = start; i < end; i++) {
      row = this.getItem(items[i], i);
      fragment.appendChild(row);
    }

    var refRow = this.nodes.tableBody.children[start - 1];
    var nextRow = refRow && refRow.nextSibling;
    if (refRow && nextRow) {
      this.nodes.tableBody.insertBefore(fragment, nextRow);
    } else {
      this.nodes.tableBody.appendChild(fragment);
    }
    this.list.model.isFetchingMore = false;
  };

  /**
   * Get an item node to be inserted into the DOM.
   * This is the default function, but the user can pass in
   * a custom function in the options to the list constructor.
   *
   * @param {Loadable} item  An item that is loadable.
   * @param {number}   index The index within the list.
   */
  ListView.prototype.getItem = function(item, index) {
    if (this.list.destroyed) { return; }

    var self = this;
    var row = document.createElement('tr');
    if (dnd.drag.hasDragSupport) {
      row.setAttribute('draggable', 'true');
    }
    row.className = 'sp-list-item';
    row.setAttribute('data-uri', item.uri);
    if (this.rows[index]) {
      this.rows.splice(index, 0, row);
    } else {
      this.rows[index] = row;
    }

    this.list.model.loadItem(index, function(data) {
      if (self.list.destroyed) { return; }
      self.numLoadedItems++;

      var model = self.list.model;
      var items = model.items;
      var item = items[index];
      var itemData = model.itemData[index];
      var list = self.list;
      var options = list.options;

      var snapshot = model.snapshots[itemData.snapshotIndex];
      snapshot.numItemsLoaded++;

      // If the item called the fail callback when loaded
      if (data.error) {
        itemData.hidden = true;

        if (self.numLoadedItems === model.totalLength && !self.hasFoundPlayableTrack) {
          list.dispatchEvent({ type: 'visually-empty' });
        }

        list.dispatchEvent({ type: 'item-load-fail', index: index, item: item, row: row });
        if (list.parentList) {
          list.parentList.dispatchEvent({ type: 'item-load-fail', index: index, item: item, row: row });
        }

        if (snapshot.numItemsLoaded === snapshot.numItems) {
          list.dispatchEvent({ type: 'snapshot-load', index: itemData.snapshotIndex, items: items.slice(snapshot.start, snapshot.end) });
          if (list.parentList) {
            list.parentList.dispatchEvent({ type: 'snapshot-load', index: itemData.snapshotIndex, items: items.slice(snapshot.start, snapshot.end) });
          }
        }
        return;
      }

      data.imageOptions = list.options.imageOptions;

      if (list.isTrackList && options.unplayable === 'hidden') {
        if (data.track.playable) {
          self.hasFoundPlayableTrack = true;
        }

        if (self.numLoadedItems === model.totalLength && !self.hasFoundPlayableTrack) {
          list.dispatchEvent({ type: 'visually-empty' });
        }
      }

      if (list.isTrackList) {
        self.updatePlayability(item, itemData, row, data.track.playable);

        // If the track isn't playable, subscribe to change event.
        // The change event will be triggered if and when the track has been relinked.
        if (!data.track.playable) {
          itemData.playableChangeHandler = function() {
            self.updatePlayability(item, itemData, row, item.playable);
          };
          item.addEventListener('change:playable', itemData.playableChangeHandler);
          self.list.eventHandlers.push({ type: 'change:playable', handler: itemData.playableChangeHandler, obj: item, dom: false });
        }
      }

      self.createRowFromData(data, row);

      itemData.loaded = true;
      list.dispatchEvent({ type: 'item-load', index: index, item: item, row: row });
      if (list.parentList) { list.parentList.dispatchEvent({ type: 'item-load', index: index, item: item, row: row }); }

      if (snapshot.numItemsLoaded === snapshot.numItems) {
        list.dispatchEvent({ type: 'snapshot-load', index: itemData.snapshotIndex, items: items.slice(snapshot.start, snapshot.end) });
        if (list.parentList) {
          list.parentList.dispatchEvent({ type: 'snapshot-load', index: itemData.snapshotIndex, items: items.slice(snapshot.start, snapshot.end) });
        }
      }

      if (options.height === 'fixed' && options.header === 'fixed') {
        var bodyWidth = self.nodes.tableBody.offsetWidth || self.nodes.body.offsetWidth;
        self.nodes.headerContent.style.width = bodyWidth + 'px';
      }
    });

    return row;
  };

  /**
   * Update the visual playability for a specific item.
   *
   * @param {Track} item The track item.
   * @param {Object} itemData Data object for the item.
   * @param {HTMLElement} row The HTML element for the row.
   * @param {boolean} isPlayable If it should be set to playable or not.
   *
   * @since 1.21.0
   */
  ListView.prototype.updatePlayability = function(item, itemData, row, isPlayable) {
    if (this.list.isTrackList && !isPlayable) {
      css.addClass(row, 'sp-list-item-unplayable');

      if (this.list.options.unplayable === 'hidden') {
        css.addClass(row, 'sp-list-item-unplayable-hidden');
        itemData.hidden = true;
      }
    } else {
      css.removeClass(row, 'sp-list-item-unplayable');
      css.removeClass(row, 'sp-list-item-unplayable-hidden');
      itemData.hidden = false;
    }
  };

  /**
   * Create a row with content based on a data object.
   * All the needed properties will be loaded in the data object
   * when this method is called.
   *
   * @param {Object}      data Data object with all the needed content.
   * @param {HTMLElement} node DOM node for the row.
   */
  ListView.prototype.createRowFromData = function(data, node) {
    var isTopTracks, fragment, fields, optionFields, i, l, cell, cellContent, trackCell, albumCell;

    isTopTracks = this.list.layout === 'toplist';
    fragment = document.createDocumentFragment();
    fields = this.list.model.fields;
    optionFields = this.list.options.fields;
    var isTrackList = this.list.isTrackList;
    var isAlbumItem = this.list.isAlbumItem;
    var albumArtists = this.list.albumArtists;
    var totalFixedWidth = 0;
    var trackArtists = [];
    var isTrackArtist, isDifferentArtist, contextButton, isTrackTitle, isTrackExplicit;

    // Join all artist URIs for the track
    if (data.artists) {
      for (var n = 0, len = data.artists.length; n < len; n++) {
        trackArtists.push(data.artists[n].uri);
      }
    }
    trackArtists = trackArtists.join(' ');

    // Compare that list of URIs to the list of artist URIs for the album
    isDifferentArtist = trackArtists !== albumArtists;

    // Check if we should render explicit flag for this row
    isTrackExplicit = data.track.explicit;

    for (i = 0, l = fields.length; i < l; i++) {
      cellContent = undefined;

      // Handle the 'trackartist' field, which should only appear if the aritst differs from the album aritst
      isTrackArtist = optionFields[i] === 'trackartist';
      isTrackTitle = optionFields[i] === 'track';
      if (isTrackList && !isTopTracks && isAlbumItem && isTrackArtist) {

        if (!isDifferentArtist) {

          // If a previous cell exists, set that width to both its own and this field's width
          if (cell && cell.fixedWidth === undefined) {
            cell.style.width = ((fields[i - 1].width * 100) + (fields[i].width * 100)) + '%';
            cell.setAttribute('colspan', '2');

            // Abort this iteration and continue with the next
            continue;

          // If the previous cell has a fixed width, a cell for the track artist must be created
          } else {

            // The content will be cleared, so the artist is only shown if it differs from the album artist
            cellContent = '';
          }

        // Different artists for track and album
        } else {

          // Remove the context button from the track cell
          if (cell && css.hasClass(cell, 'sp-list-cell-track')) {
            contextButton = cell.querySelector('.sp-list-contextbutton');
            if (contextButton) {
              cell.removeChild(contextButton);
            }
          }
        }
      }

      cell = document.createElement('td');
      cell.className = 'sp-list-cell ' + (fields[i].className || '');
      if (isTrackArtist) {
        cell.className += ' sp-list-cell-trackartist';
      }

      cellContent = cellContent === undefined ? fields[i].get(data) : cellContent;

      // Place the context button in the artist field
      if (isTrackArtist && isDifferentArtist && contextButton) {
        cell.appendChild(contextButton);
        contextButton = null;

        // Wrap the artist names in a span to adjust for the context button
        if (typeof cellContent === 'string') {
          cellContent = '<span class="sp-list-cell-artist-names">' + cellContent + '</span>';
        } else {
          var cellContentWrapper = document.createElement('span');
          span.className = 'sp-list-cell-artist-names';
          cellContentWrapper.appendChild(cellContent);
          cellContent = cellContentWrapper;
        }
      }

      if (typeof cellContent === 'string') {
        cell.innerHTML = cell.innerHTML + cellContent;
      } else {
        cell.appendChild(cellContent);
      }

      // Append explicit content icon into either artist or trackartist cell
      if (isTrackExplicit) {
        if ((isTrackTitle && isTopTracks) ||
            (isTrackTitle && !isDifferentArtist) ||
            (isTrackArtist && isDifferentArtist)) {
          var explicitNode = document.createElement('span');
          explicitNode.className = 'sp-icon-explicit';
          contextButton = cell.querySelector('.sp-list-contextbutton');
          if (contextButton) {
            contextButton.parentNode.insertBefore(explicitNode, contextButton.nextSibling);
          } else {
            cell.insertBefore(explicitNode, cell.firstChild);
          }
        }
      }

      if (!fields[i].fixedWidth) {
        if (!isTopTracks || (isTopTracks && !~'track album'.indexOf(fields[i].id))) {
          cell.style.width = (fields[i].width * 100) + '%';
        }
      } else {
        cell.fixedWidth = fields[i].fixedWidth;
        totalFixedWidth += fields[i].fixedWidth;
      }

      fragment.appendChild(cell);

      if (fields[i].id === 'track') { trackCell = cell; }
      if (fields[i].id === 'album') { albumCell = cell; }
    }

    node.appendChild(fragment);

    // Update ordinal field for items that are visible
    if (this.list.options.fields.indexOf('ordinal') > -1) {

      var hideUnplayable = this.list.options.unplayable === 'hidden';
      var isVisible = !this.list.model.itemData[data.index].hidden;
      var isPlayable = data.track.playable;

      if (isVisible && (!hideUnplayable || isPlayable)) {

        // The index for this item might already exist, in which case we
        // must add this index and increment all the following indices.
        var indexForThisIndex = this.shownIndices.indexOf(data.index);
        if (indexForThisIndex > -1) {
          var beginning = this.shownIndices.slice(0, indexForThisIndex);
          var end = this.shownIndices.slice(indexForThisIndex, this.shownIndices.length);
          end = end.map(function(i) { return i + 1; });
          this.shownIndices = beginning.concat([data.index]).concat(end);

        // If this index didn't exist before, we simply add it
        } else {
          this.shownIndices.push(data.index);
          this.shownIndices.sort(function(a, b) { return a - b; });
        }

        this.updateOrdinalsFrom(data.index);
      }
    }

    if (isTopTracks) {
      if (trackCell || albumCell) {
        this.setToplistCellOffset(trackCell, albumCell, node, totalFixedWidth);
      }
    }
  };

  /**
   * Set the offset using padding for track name and album name in toplists.
   *
   * @param {HTMLElement} trackCell Element for the track cell. Can be undefined.
   * @param {HTMLElement} albumCell Element for the album cell. Can be undefined.
   * @param {HTMLElement} rowNode Element for the whole row.
   * @param {number} totalFixedWidth The total width of all the fixed fields.
   */
  ListView.prototype.setToplistCellOffset = function(trackCell, albumCell, rowNode, totalFixedWidth) {
    var paddingRightStyle = css.getStyle(trackCell || albumCell, 'padding-right');

    // Handle the edge case where the CSS has not been applied yet
    // This will retry a few times until the padding has been set
    if (paddingRightStyle === '') {
      var self = this;
      var cell = trackCell || albumCell;
      cell.numOffsetTries = (cell.numOffsetTries || 0) + 1;
      if (cell.numOffsetTries >= 10) {
        delete cell.numOffsetTries;
      } else {
        setTimeout(function() {
          self.setToplistCellOffset(trackCell, albumCell, rowNode, totalFixedWidth);
        }, 50);
        return;
      }
    }

    // Set the padding to offset the cell correctly
    var paddingRight = parseInt(paddingRightStyle || 0, 10);
    totalFixedWidth += paddingRight;
    if (trackCell && albumCell) {
      var cellWrapper = document.createElement('div');
      cellWrapper.className = 'sp-list-cell sp-list-cell-trackalbum-wrapper';
      rowNode.replaceChild(cellWrapper, albumCell);
      rowNode.removeChild(trackCell);
      cellWrapper.appendChild(trackCell);
      cellWrapper.appendChild(albumCell);
      cellWrapper.style.paddingLeft = totalFixedWidth + 'px';
    } else if (trackCell) {
      trackCell.style.paddingLeft = totalFixedWidth + 'px';
    } else if (albumCell) {
      albumCell.style.paddingLeft = totalFixedWidth + 'px';
    }
  };

  /**
   * Make a handle able to resize the surrounding columns.
   *
   * @param {HTMLElement} handle The handle element.
   */
  ListView.prototype.makeResizable = function(handle) {
    var self = this;
    var mousedown = function(e) { self.handleDragStart(handle, e); };
    var mousemove = function(e) { self.handleDragMove(handle, e); };
    var mouseup = function(e) { self.handleDragEnd(handle, e); };
    this.list.eventHandlers.push({ type: 'mousedown', handler: mousedown, obj: handle, dom: true });
    this.list.eventHandlers.push({ type: 'mousemove', handler: mousemove, obj: document, dom: true });
    this.list.eventHandlers.push({ type: 'mouseup', handler: mouseup, obj: document, dom: true });
    dom.addEventListener(handle, 'mousedown', mousedown);
    dom.addEventListener(document, 'mousemove', mousemove, true);
    dom.addEventListener(document, 'mouseup', mouseup, true);
  };

  /**
   * Handler for when the user starts dragging a resize handle.
   *
   * @param {HTMLElement} handle The handle node.
   * @param {Object}      e      The event object.
   */
  ListView.prototype.handleDragStart = function(handle, e) {
    var fields = this.list.model.fields;

    // Get left column
    var leftIndex = handle.colIndex;
    while (fields[leftIndex] && fields[leftIndex].fixedWidth) {
      leftIndex--;
    }

    // Get right column
    var rightIndex = handle.colIndex + 1;
    while (fields[rightIndex] && fields[rightIndex].fixedWidth) {
      rightIndex++;
    }

    // Abort resizing if one of the fields does not exist
    if (!fields[leftIndex] || !fields[rightIndex]) {
      return;
    }

    this.currentHandle = handle;
    handle.isDragging = true;
    handle.startPos = e.pageX || e.clientX;
    handle.leftIndex = leftIndex;
    handle.rightIndex = rightIndex;
    handle.startLeftWidth = fields[leftIndex].dynamicWidth;
    handle.startRightWidth = fields[rightIndex].dynamicWidth;
  };

  /**
   * Handler for when the user drags a resize handle.
   *
   * @param {HTMLElement} handle The handle node.
   * @param {Object}      e      The event object.
   */
  ListView.prototype.handleDragMove = function(handle, e) {
    if (!handle.isDragging || handle !== this.currentHandle) {
      return;
    }

    // Update width numbers
    var diff = (e.pageX || e.clientX) - handle.startPos;
    var fields = this.list.model.fields;
    var newLeftWidthPx = handle.startLeftWidth * fields.totalDynamicWidth + diff;
    var newRightWidthPx = handle.startRightWidth * fields.totalDynamicWidth - diff;

    if (newLeftWidthPx > 50 && newRightWidthPx > 50) {
      fields[handle.leftIndex].dynamicWidth = newLeftWidthPx / fields.totalDynamicWidth;
      fields[handle.rightIndex].dynamicWidth = newRightWidthPx / fields.totalDynamicWidth;

      this.updateWidths();
    }
  }

  /**
   * Handler for when the user stops dragging a resize handle.
   *
   * @param {HTMLElement} handle The handle node.
   * @param {Object}      e      The event object.
   */
  ListView.prototype.handleDragEnd = function(handle, e) {
    if (handle !== this.currentHandle) {
      return;
    }

    handle.isDragging = false;
    this.currentHandle = null;

    var fields = this.list.model.fields;
    var eventObject = {
      type: 'column-resize',
      left: {
        index: handle.leftIndex,
        startWidth: handle.startLeftWidth,
        endWidth: fields[handle.leftIndex].dynamicWidth
      },
      right: {
        index: handle.rightIndex,
        startWidth: handle.startRightWidth,
        endWidth: fields[handle.rightIndex].dynamicWidth
      }
    };
    this.list.dispatchEvent(eventObject);
    if (this.list.parentList) { this.list.parentList.dispatchEvent(eventObject); }
  };

  /**
   * Handler for when the list is scrolled.
   * If the header is set to 'fixed' and height to 'dynamic',
   * this will set the CSS classes needed to fix the header.
   * If scroll to bottom should fetch new items, it will do so.
   *
   * @param {Object} e The event object.
   */
  ListView.prototype.onScroll = function(e) {
    var options = this.list.options;
    var header = this.nodes.headerWrapper;
    var scrollElement = this.scrollElement;
    var model = this.list.model;

    var listOffset = this.node.getBoundingClientRect();

    if (options.header === 'fixed' && options.height === 'dynamic') {

      var headerHeight = header.offsetHeight;
      var headerOffset = header.getBoundingClientRect().top;
      var topEdge = 0;

      if (scrollElement !== window) {
        var scrollElementBorder = parseFloat(css.getStyle(scrollElement, 'border-top-width'), 10);
        scrollElementBorder = isNaN(scrollElementBorder) ? 0 : scrollElementBorder;
        topEdge = scrollElement.getBoundingClientRect().top + scrollElementBorder;
      }

      if (!header.fixed && (headerOffset <= topEdge && listOffset.bottom > topEdge + headerHeight)) {
        css.addClass(header, 'sp-list-header-fixed');
        css.addClass(this.node, 'sp-list-wrapper-header-fixed');
        var bodyWidth = this.nodes.tableBody.offsetWidth || this.nodes.body.offsetWidth;
        header.style.width = bodyWidth + 'px';
        header.style.top = topEdge + 'px';
        header.fixed = true;
      } else if (header.fixed && (headerOffset > topEdge || listOffset.top > topEdge || listOffset.bottom < topEdge + headerHeight)) {
        css.removeClass(header, 'sp-list-header-fixed');
        css.removeClass(this.node, 'sp-list-wrapper-header-fixed');
        header.style.width = '100%';
        header.style.top = 'auto';
        header.fixed = false;
      }
    }

    if (!this.list.options.numItems && (this.list.options.fetch === 'scroll') && !this.list.model.noMoreData) {
      var listBodyOffset = this.nodes.tableBody.getBoundingClientRect();
      var scrollTop = scrollElement.pageYOffset || (scrollElement === window ? document.documentElement.scrollTop : scrollElement.scrollTop);
      var listTop = scrollElement === (this.list.options.scrollElement || window) ? scrollTop + listBodyOffset.top : 0;

      if (!model.isFetchingMore && scrollTop > listTop + listBodyOffset.height - this.visibleHeight * 2) {
        model.moreWithLimit(1000);
      }
    }
  };

  /**
   * Select an item visually.
   *
   * @param {number} index The index within the list.
   */
  ListView.prototype.selectItem = function(index) {
    var connectedLists = this.list.model.getListChain();
    if (connectedLists.length > 1) {
      for (var i = 0, l = connectedLists.length; i < l; i++) {
        connectedLists[i].view.dontBlur = true;
      }
    }

    // Select the row
    var row = this.rows[index];
    css.addClass(row, 'sp-list-item-selected');

    // Broadcast events
    this.list.dispatchEvent({ type: 'item-select', index: index, item: this.list.model.items[index], row: row });
    if (this.list.parentList) {
      this.list.parentList.dispatchEvent({ type: 'item-select', index: index, item: this.list.model.items[index], row: row });
    }
  };

  /**
   * Deselect an item visually.
   *
   * @param {number} index The index within the list.
   */
  ListView.prototype.deselectItem = function(index) {

    // Deselect the item
    var row = this.rows[index];
    css.removeClass(row, 'sp-list-item-selected');

    // Broadcast event
    this.list.dispatchEvent({ type: 'item-deselect', index: index, item: this.list.model.items[index], row: row });
    if (this.list.parentList) {
      this.list.parentList.dispatchEvent({ type: 'item-deselect', index: index, item: this.list.model.items[index], row: row });
    }
  };

  /**
   * Deselect all items in this list.
   */
  ListView.prototype.deselect = function() {
    var indices = this.selection.getSelectionForList(this.list.listIndex);
    for (var i = 0, l = indices.length; i < l; i++) {
      this.deselectItem(indices[i]);
    }
  };

  /**
   * Make the list focusable.
   */
  ListView.prototype.makeFocusable = function() {
    this.dontBlur = false;
    var self = this;
    var node = this.node;
    var focusInSupport = window.onfocusin !== undefined;
    var focusEventName = focusInSupport ? 'focusin' : 'focus';
    var blurEventName = focusInSupport ? 'focusout' : 'blur';

    // Fix for making the list focusable
    node.tabIndex = 0;

    var focus = function() { css.addClass(this, 'sp-list-wrapper-focus'); };
    this.list.eventHandlers.push({ type: focusEventName, handler: focus, obj: node, dom: true });
    dom.addEventListener(node, focusEventName, focus, false);

    var blur = function() {
      if (!self.dontBlur) {
        css.removeClass(this, 'sp-list-wrapper-focus');
      }
    };
    this.list.eventHandlers.push({ type: blurEventName, handler: blur, obj: node, dom: true });
    dom.addEventListener(node, blurEventName, blur, false);

    // When the header is fixed, it will trigger blur for the list when the header
    // is clicked, even though the header is within the list element. We need to
    // work around this by setting a flag and focusing the list when the mouse is released.
    if (this.list.options.header !== 'no') {
      var mousedown = function() { self.dontBlurHeader = true; };
      this.list.eventHandlers.push({ type: 'mousedown', handler: mousedown, obj: this.nodes.headerWrapper, dom: true });
      dom.addEventListener(this.nodes.headerWrapper, 'mousedown', mousedown, false);

      var mouseup = function() {
        if (self.dontBlurHeader) {
          node.focus();
        }
        self.dontBlurHeader = false;
      };
      this.list.eventHandlers.push({ type: 'mouseup', handler: mouseup, obj: document, dom: true });
      dom.addEventListener(document, 'mouseup', mouseup, false);
    }
  };

  /**
   * Checks if the provided element is inside any list view.
   *
   * @param {HTMLElement} element The element to test.
   *
   * @return {boolean} True if the element is inside a list view.
   */
  ListView.prototype.isElementInAnyListView = function(element) {
    while (element !== document && !css.hasClass(element, 'sp-list')) {
      element = element.parentNode;
    }

    return element !== document ? true : false;
  };

  /**
   * Checks if the provided element is inside any list view that is
   * connected to this one, or inside this list itself.
   *
   * @param {HTMLElement} element The element to test.
   *
   * @return {boolean} True if the element is inside a list view connected to this.
   */
  ListView.prototype.isElementInAnyConnectedListView = function(element) {
    while (element !== document && !css.hasClass(element, 'sp-list')) {
      element = element.parentNode;
    }
    var lists = this.list.model.getListChain();
    for (var i = 0, l = lists.length; i < l; i++) {
      lists[i] = lists[i].node;
    }
    return element !== document ? !!~lists.indexOf(element) : false;
  };

  /**
   * Get the list node from an element inside a list.
   * If the passed in element is the node itself, it returns that node.
   *
   * @param {HTMLElement} element An element inside a list.
   *
   * @return {?HTMLElement} The list element or null if not found.
   */
  ListView.prototype.getListNodeFromElement = function(element) {
    var body = document.body;
    while (element !== body && (!css.hasClass(element, 'sp-list') || !!element.getAttribute('data-is-disc'))) {
      element = element.parentNode;
    }

    return element === body ? null : element;
  };

  /**
   * Add an event listener for mousedown events on the apps's document, to be able to handle
   * selection focus between multiple lists. Clicking in one list should set the CSS focus
   * for all connected lists to be focused. Clicking outside any of the connected lists
   * should unfocus all lists.
   */
  ListView.prototype.fixConnectedListsFocus = function() {
    var self = this;
    var isParentList = false;
    var list = this.list;
    var listView = this;
    var listModel = this.list.model;

    // A container array for connected lists.
    // This array will contain one array for each group of connected lists.
    if (!ListView.listViewConnectedContainerArray) {
      ListView.listViewConnectedContainerArray = [];
    }

    // Handle disc lists.
    // If a sub-list is encountered, add the parent list only
    if (this.list.parentList) {
      isParentList = true;
      list = this.list.parentList;
      listView = list.lists[0].view;
      listModel = list.lists[0].model;
    }

    // Try getting the index for the group from this list
    var connectedListsIndex = list._connectedListsIndex;

    // If this list doesn't have the index, try from other connected lists
    if (connectedListsIndex === undefined) {
      var listChain = listModel.getListChain();
      for (var i = 0, l = listChain.length; i < l; i++) {
        if (listChain[i]._connectedListsIndex !== undefined) {
          connectedListsIndex = listChain[i]._connectedListsIndex;
          break;
        }
      }
    }

    // Set a flag to see if the list has been added before
    var hasBeenAdded = false;
    if (isParentList) {
      var groups = ListView.listViewConnectedContainerArray;
      var lists;
      for (var i = 0, l = groups.length; i < l; i++) {
        lists = groups[i];
        for (var n = 0, len = lists.length; n < len; n++) {
          if (lists[n] === list) {
            hasBeenAdded = true;
          }
        }
      }
    }

    // Initialize list storage and event listener for this group if not done already
    if (connectedListsIndex === undefined && !hasBeenAdded) {
      connectedListsIndex = ListView.listViewConnectedContainerArray.push([list]) - 1;
      list._connectedListsIndex = connectedListsIndex;
      list.node.setAttribute('data-connected-lists-index', connectedListsIndex);

      if (!ListView.listViewDocMouseDownHandler) {

        ListView.listViewDocMouseDownHandler = function(e) {
          var connectedLists = [];
          var listsToUnfocus = [];

          // Get all lists that has been created in this app
          var allLists = [];
          var groups = ListView.listViewConnectedContainerArray;
          for (var i = 0, l = groups.length; i < l; i++) {
            allLists = allLists.concat(groups[i]);
          }

          // If the click happens inside a list view
          if (self.isElementInAnyListView(e.target)) {

            // Get list views that are connected to the one clicked on (including that one)
            var listNode = self.getListNodeFromElement(e.target);
            var index = listNode.getAttribute('data-connected-lists-index');
            connectedLists = ListView.listViewConnectedContainerArray[index];

            // Set visual focus to all lists connected to the one clicked on
            for (var i = 0, l = connectedLists.length; i < l; i++) {
              var list = connectedLists[i];
              var listGroup = list.isDiscsList ? list.lists : [list];
              for (var n = 0, len = listGroup.length; n < len; n++) {
                css.addClass(listGroup[n].view.node, 'sp-list-wrapper-focus');
              }
            }

            // Get an array of lists to deselect (all except the connected above)
            for (var i = 0, l = allLists.length; i < l; i++) {
              if (connectedLists.indexOf(allLists[i]) === -1) {
                listsToUnfocus.push(allLists[i]);
              }
            }

          // If clicked outside of a list, unfocus all lists
          } else {
            listsToUnfocus = allLists;
          }

          // Remove visual focus from the lists that have been chosen above
          for (var i = 0, l = listsToUnfocus.length; i < l; i++) {
            var list = listsToUnfocus[i];

            // Disc lists are sublists of a parent list, and must all be reset
            var listGroup = list.isDiscsList ? list.lists : [list];
            for (var n = 0, len = listGroup.length; n < len; n++) {
              listGroup[n].view.dontBlur = false;
              css.removeClass(listGroup[n].view.node, 'sp-list-wrapper-focus');
            }
          }
        };

        dom.addEventListener(document, 'mousedown', ListView.listViewDocMouseDownHandler);
      }

    } else if (!isParentList || !hasBeenAdded) {

      // Add this list to the group of connected lists
      ListView.listViewConnectedContainerArray[connectedListsIndex].push(list);
      list._connectedListsIndex = connectedListsIndex;
      list.node.setAttribute('data-connected-lists-index', connectedListsIndex);
    }
  };

  /**
   * Add a dragstart event listener for this list chain.
   * Dragging an item from the list will use the standard tooltip as drag image.
   */
  ListView.prototype.addDragListener = function() {
    var self = this;

    // Initialize the event listener if not done already
    if (!this.selection.isDndAdded) {
      this.selection.isDndAdded = true;

      var selection;

      var dndTest = function(elem) {
        var isLink = elem instanceof HTMLAnchorElement;
        if (!isLink && self.isElementInAnyConnectedListView(elem)) {
          selection = self.selection.getSelectionData();
          return selection.uris.length > 0;
        } else {
          return false;
        }
      };

      var dndGetData = function(elem) {
        var urls = selection.urls.join('\n');
        var links = selection.urls.map(function(url, i) {
          var item = selection.items[i];
          if (item instanceof models.Track) {
            var artists = self.getArtistsAsString(item.artists);
            var text = item.name + ' by ' + artists;
          } else {
            var text = url;
          }
          return '<a href="' + url + '">' + text + '</a>';
        }).join('<br>\n');

        return {
          'text/plain': urls,
          'text/html': links
        };
      };

      var dndGetText = function(elem) {
        var numItems = selection.uris.length;
        var isTracks = self.list.isTrackList;

        if (numItems === 1 && isTracks) {
          var track = selection.items[0];
          var artists = self.getArtistsAsString(track.artists);
          return track.name + ' by ' + artists;
        } else {
          return numItems + ' ' + (isTracks ? 'tracks' : 'items');
        }
      };

      dnd.drag.addHandler(dndTest, dndGetData, dndGetText);
    }
  };

  /**
   * Get artists as a string.
   *
   * @param {Array} artists Artist objects, with loaded name property.
   *
   * @return {string} Artists separated by comma and space.
   */
  ListView.prototype.getArtistsAsString = function(artists) {
    var output = '';
    for (var i = 0, l = artists.length; i < l; i++) {
      output += artists[i].name + (i < l - 1 ? ', ' : '');
    }
    return output;
  };

  /**
   * Make the items selectable.
   */
  ListView.prototype.makeSelectable = function() {
    var self = this;

    // Show the custom context menu for list items
    // We only do this for desktop for now, but might enable it for web later
    if (this.list.model.userDevice === 'desktop') {
      this.nodes.tableBody.oncontextmenu = function(e) {

        // If clicked on a link, show menu for the linked item
        if (e.target.tagName.toLowerCase() === 'a') {
          var uri = e.target.getAttribute('data-uri');
          if (uri) {
            var item = models.fromURI(uri);
            if (item) {
              var x = e.pageX - window.pageXOffset;
              var y = e.pageY - window.pageYOffset;
              models.client.showContextUI(item, { x: x, y: y });
              return false;
            }
            return;
          }
          return;
        }

        // Only show the custom menu when there are selected items
        var selectionData = self.selection.getSelectionData();
        if (selectionData.items.length > 0) {

          // Based on if all items are from the same list, the origin will be set and passed to the client
          var fromSameList = selectionData.fromSameList;
          var origin = fromSameList ? self.list.item : undefined;
          var x = e.pageX - window.pageXOffset;
          var y = e.pageY - window.pageYOffset;
          models.client.showContextUI(selectionData.items, { x: x, y: y }, origin);

          // Disable default context menu
          return false;
        }
      };
    }

    var mousedown = function(e) { self.listMouseDown(e, this); };
    this.list.eventHandlers.push({ type: 'mousedown', handler: mousedown, obj: this.nodes.tableBody, dom: true });
    dom.addEventListener(this.nodes.tableBody, 'mousedown', mousedown);

    var keydown = function(e) { self.listKeyDown(e, this); };
    this.list.eventHandlers.push({ type: 'keydown', handler: keydown, obj: this.node, dom: true });
    dom.addEventListener(this.node, 'keydown', keydown, true);

    if (this.list.isTrackList) {
      var dblclick = function(e) { self.listDblClick(e, this); };
      this.list.eventHandlers.push({ type: 'dblclick', handler: dblclick, obj: this.nodes.tableBody, dom: true });
      dom.addEventListener(this.nodes.tableBody, 'dblclick', dblclick);
    }

    var click = function(e) { self.listClick(e, this); };
    this.list.eventHandlers.push({ type: 'click', handler: click, obj: this.nodes.tableBody, dom: true });
    dom.addEventListener(this.nodes.tableBody, 'click', click);
  };

  /**
   * Add an event listener for mousemove events on the apps's document, to be able to hide
   * widget buttons that should be hidden when the popup has closed.
   */
  ListView.prototype.fixWidgetButtonVisibility = function() {

    // Initialize list storage and event listener if not done already
    if (!ListView.listViewDocMouseMoveHandler) {
      ListView.listViewContainerArray = [this.list];

      // Add the event handler to the window object so it can be reached from all lists
      ListView.listViewDocMouseMoveHandler = function(e) {
        var containerArray = ListView.listViewContainerArray;

        // Loop through all lists and if the state is that it's showing a popup, hide the buttons.
        // Since no mouse events will be triggered  when the popup is open, we can be sure that
        // the popup is closed when we get mouse events, and can therefore hide the button.
        if (containerArray) {
          for (var i = 0, l = containerArray.length; i < l; i++) {
            var list = containerArray[i];

            if (list.destroyed) {
              containerArray.splice(i, 1);
              i--; l--;
              continue;
            }

            if (list.view.popupShown) {
              list.view.hideWidgetButtons();
            }
          }
        }
      };

      dom.addEventListener(document, 'mousemove', ListView.listViewDocMouseMoveHandler);

    // If another list has already added the event listener, just add this list to the storage
    // so the event listener can loop through the lists and check for popup state.
    } else if (ListView.listViewContainerArray) {
      ListView.listViewContainerArray.push(this.list);
    }
  };

  /**
   * Hide the widget buttons that are currently visible.
   */
  ListView.prototype.hideWidgetButtons = function() {
    var buttons = dom.queryClasses('sp-list-contextbutton-popup', this.nodes.listBody);

    /* Remove fixed hover state */
    for (var index = 0; index < buttons.length; index++) {
      css.removeClass(buttons[index], 'sp-list-contextbutton-popup');
    }

    this.popupShown = false;
  };

  /**
   * Handler for when the pointer is pressed down somewhere in the list.
   * This will select the item underneath the pointer.
   *
   * @param {Object}      e        The event object.
   * @param {HTMLElement} listBody The list body element.
   */
  ListView.prototype.listMouseDown = function(e, listBody) {

    // Don't change the selection if the pointer was pressed down on a star
    if (css.hasClass(e.target, 'sp-icon-star') || css.hasClass(e.target, 'sp-icon-star-hitarea')) {
      return;
    }

    // Don't change the selection if the pointer was pressed down on a share button
    if (css.hasClass(e.target, 'sp-list-sharebutton') || css.hasClass(e.target, 'sp-list-share-hitarea')) {
      return;
    }

    // Don't change the selection if the pointer was pressed down on a link
    if (e.target.tagName.toLowerCase() === 'a') {
      return;
    }

    // Don't change the selection if the pointer was pressed down on a context menu button
    // Instead, open the context menu
    if (~this.list.options.fields.indexOf('track') && this.list.model.userDevice === 'web') {
      if (css.hasClass(e.target, 'sp-list-contextbutton')) {
        var uri = e.target.parentNode.parentNode.getAttribute('data-uri');
        var origin = this.list.item.uri;

        /* Add fixed hover state */
        css.addClass(e.target, 'sp-list-contextbutton-popup');

        this.popupShown = true;
        ContextApp.show('context-actions', [uri], e.target, origin);

        return;
      }
    }

    // Find list item element and select it
    var elem = this.getListRowNode(e.target);
    if (elem) {
      this.handleMouseSelection(elem, e);
    }
  };

  /**
   * Handle mouse selection in the list view.
   *
   * @param {HTMLElement} elem The table row for the item that was clicked.
   * @param {Object}      e    The event object from the mouse event.
   * @param {boolean=} opt_isMouseUp True if this is called when the mouse button is released.
   */
  ListView.prototype.handleMouseSelection = function(elem, e, opt_isMouseUp) {
    var children = elem.parentNode.children;
    children = Array.prototype.slice.call(children, 0, children.length);
    var index = children.indexOf(elem);

    // Don't handle the mouse up, if the mouse down deselected
    if (opt_isMouseUp && this.changedSelectionOnMouseDown) {
      return;
    }
    this.changedSelectionOnMouseDown = false;

    if (~index) {

      var buttonConversion = {
        0: 1, // 1: Primary button (usually left)
        2: 2, // 2: Secondary button (usually right)
        1: 3, // 3: Middle (usually the wheel)
        'default': 0 // 0: No button pressed
      };
      var button = buttonConversion[e.button] || buttonConversion['default'];
      var isPrimaryButton = button === 1;
      var isSecondaryButton = button === 2;

      var listIndex = this.list.listIndex;
      var selection = this.selection;
      var multiselect = e.shiftKey || e.metaKey || e.ctrlKey;
      var singleClick = !e.shiftKey;
      var isSelected = selection.isSelected(index, listIndex);

      // Remove selection if a selected item is clicked with cmd/ctrl
      if (multiselect && singleClick && isSelected && isPrimaryButton) {

        // We need to calculate some to know if and what to set the selection origin to
        var indexList = selection.indices[listIndex];
        var focus = { item: selection.focus.item, list: selection.focus.list };
        var origin = selection.origin;
        var isSameList = focus.list === origin.list;
        var isFocusMoreThanOrigin = focus.item > origin.item;
        var isSelUp = isSameList ? (isFocusMoreThanOrigin ? false : true) : (focus.list > origin.list ? false : true);
        var siblingIndex = index + (isSelUp ? -1 : 1);
        var isSelGroup = indexList.indexOf(siblingIndex) > -1;
        var originIndex = isSelGroup ? siblingIndex : false;

        // Remove the clicked item from selection.
        // We also need to set the selection origin.
        // When removed, focus will be moved, so we need to reset the focus too.
        this.changedSelectionOnMouseDown = true;
        selection.remove(index, listIndex);
        if (originIndex !== false) {
          selection.setOrigin(originIndex, listIndex);
        }
        selection.setFocus(focus.item, focus.list);

      // Select multiple items if clicked with shift key down
      } else if (!singleClick) {
        if (selection.isInCurrentGroup(index, listIndex)) {
          selection.removeTo(index + (selection.isDirectionDown ? 1 : -1), listIndex);
        } else {
          selection.addTo(index, listIndex);
        }
        this.changedSelectionOnMouseDown = true;

      // Select a single item
      } else {

        // Don't change selection if clicked with secondary button on selected item
        if (!isSecondaryButton || !isSelected) {

          // Handle the case when the primary button is pressed down on a selected item.
          // The method will be called once again in that case, on mouse up. This is
          // to allow the drag and drop to abort the selection change.
          if (isPrimaryButton && isSelected && !opt_isMouseUp) {
            return;
          }

          // Clear all selections if clicked without cmd/ctrl
          if (!multiselect) {
            selection.clear();
          }

          // Add item to selection
          selection.add(index, listIndex);
          selection.setOrigin(index, listIndex);
          this.changedSelectionOnMouseDown = true;
        }
      }
    }
  };

  /**
   * Handler for when a key is pressed down in the list.
   * Depending on the key, this will either play a track
   * (for enter key) or move the selection (up and down
   * arrows).
   *
   * @param {Object} e The event object.
   */
  ListView.prototype.listKeyDown = function(e) {
    var isUp = e.keyCode === 38;
    var isDown = e.keyCode === 40;
    var isEnter = e.keyCode === 13;

    if (isEnter && this.selection.hasSelection(this.list.listIndex) && this.list.isTrackList) {
      e.preventDefault();
      e.stopPropagation();
      this.list.playTrack(this.selection.getIndex(0, this.list.listIndex), this.list.discNumber - 1);
    }

    if (isUp || isDown) {
      this.moveSelection(isDown, e);
    }
  };

  /**
   * Handler for when the pointer double clicks somewhere
   * in the list. If this didn't happen on a link, it will
   * start playing the item (if playable).
   *
   * @param {Object} e The event object.
   */
  ListView.prototype.listDblClick = function(e) {
    if (css.hasClass(e.target, 'sp-icon-star') || css.hasClass(e.target, 'sp-icon-star-hitarea')) {
      return;
    }

    var tagName = e.target.tagName.toLowerCase();
    if (tagName !== 'a' && tagName !== 'button') {
      this.list.playTrack(this.selection.getIndex(0, this.list.listIndex), this.list.discNumber - 1);
    }
  };

  /**
   * Handler for when the pointer clicks somewhere in the
   * list. If this happens on a link to a Spotify URI, it
   * will intercept the link and open the corresponding page.
   * If the click happens on the star icon, it will star the track.
   */
  ListView.prototype.listClick = function(e, listBody) {
    var elem = e.target;

    // Link detection
    var uri = elem.getAttribute('data-uri');
    var isLink = !!uri && uri.indexOf('spotify:') === 0;

    // Share button detection
    var buttonAttr = elem.getAttribute('data-button');
    var isShare = !!buttonAttr && buttonAttr === 'share';

    // Star button detection
    var isStar = css.hasClass(e.target, 'sp-icon-star') || css.hasClass(e.target, 'sp-icon-star-hitarea');

    if (isLink) {
      e.preventDefault();
      e.stopPropagation();
      models.application.openURI(uri);

    } else if (isShare) {
      this.openShareUI(elem);

    } else if (isStar) {
      var row = this.getListRowNode(e.target);
      if (row) {
        var starIcon = row.querySelector('.sp-icon-star');
        var iconStarred = !!row.querySelector('.sp-icon-starred');
        var uri = row.getAttribute('data-uri');
        var track = models.Track.fromURI(uri);

        // Set visual state
        css[iconStarred ? 'removeClass' : 'addClass'](starIcon, 'sp-icon-starred');

        // Load current starred state for the track
        track.load('starred').done(function() {

          // If the state matches the visual state, do the correct action
          if (track.starred === iconStarred) {
            track[track.starred ? 'unstar' : 'star']().fail(function() {

              // Change back the visual state if the action failed
              css[iconStarred ? 'addClass' : 'removeClass'](starIcon, 'sp-icon-starred');
            });
          }
        });
      }

    } else {
      var row = this.getListRowNode(e.target);

      // Handle selection if clicked on a selected item
      if (row) {
        this.handleMouseSelection(row, e, true);
      }
    }
  };

  /**
   * Open the share UI from the button.
   *
   * @param {HTMLElement} element The button element inside a list row.
   */
  ListView.prototype.openShareUI = function(element) {
    var listRow = this.getListRowNode(element);

    if (listRow) {
      var uri = listRow.getAttribute('data-uri');
      var rect = element.getBoundingClientRect();
      var x = rect.left + rect.width / 2;
      var y = rect.top + rect.height / 2;

      models.client.showShareUI(uri, '', { x: x, y: y });
    }
  };

  /**
   * Get a list item node from an element inside a row.
   * If the passed in element is the node itself, it returns that node.
   *
   * @param {HTMLElement} element An element inside a list row.
   *
   * @return {?HTMLElement} The list row element or null if not found.
   */
  ListView.prototype.getListRowNode = function(element) {
    var listBody = this.nodes.tableBody;

    while (element !== listBody && !css.hasClass(element, 'sp-list-item')) {
      element = element.parentNode;
    }

    return element === listBody ? null : element;
  };

  /**
   * Move the selection up or down.
   *
   * @param {boolean} isDown Whether the direction is down or not.
   * @param {Object}  e      The event object.
   */
  ListView.prototype.moveSelection = function(isDown, e) {
    if (this.selection.focus.list !== this.list.listIndex) {
      return;
    }

    var items = this.list.model.items;
    var itemData = this.list.model.itemData;
    var currentIndex = this.selection.focus.item;
    var newIndex = currentIndex + (isDown ? 1 : -1);
    var newItem = items[newIndex];
    var newItemData = itemData[newIndex];
    var isInTop = !isDown && currentIndex === 0;
    var isInBottom = isDown && currentIndex === items.length - 1;

    var selection = this.selection;
    var selIsDown = selection.isDirectionDown;
    var selIsUp = selection.isDirectionUp;
    var listIndex = this.list.listIndex;
    var originList = selection.origin.list;
    var originItem = selection.origin.item;

    if (isInTop || isInBottom) {

      // Find which list to switch to
      var newList = isInTop ? this.list.previousList : this.list.nextList;
      while (true) {

        // If the new list contains sub-lists, get the correct sub-list
        if (newList && newList.lists) {
          newList = isInTop ? newList.lists[newList.lists.length - 1] : newList.lists[0];
          break;
        }

        // If this is the last disc in a parent list, get the next list for the parent
        if (this.list.isPartOfDiscsList && !newList) {
          newList = isInTop ? this.list.parentList.previousList : this.list.parentList.nextList;
          if (newList) {
            continue;
          }
        }

        break;
      }

      if (newList) {
        if (e) { e.preventDefault(); }

        var itemIndex = isInTop ? newList.model.items.length - 1 : 0;
        var newListIndex = newList.listIndex;
        var newListSelection = newList.view.selection;
        if (!e || !e.shiftKey || !selection.multiselectEnabled) {
          newListSelection.clear();
          newListSelection.setOrigin(itemIndex, newList.listIndex);
          originItem = itemIndex;
          originList = newList.listIndex;
          selIsUp = false;
          selIsDown = false;
        }

        var addMoreToSelection = (selIsDown && isDown) || (selIsUp && !isDown) || (!selIsDown && !selIsUp);
        if (!newListSelection.isSelected(itemIndex, newListIndex) && addMoreToSelection) {

          newListSelection.add(itemIndex, newListIndex);

          if (e && e.shiftKey) {
            newListSelection.isDirectionDown = listIndex > originList ?
                true : (listIndex < originList ?
                    false : (newIndex > originItem ?
                        true : false
                    )
                );
            newListSelection.isDirectionUp = listIndex < originList ?
                true : (listIndex > originList ?
                    false : (newIndex < originItem ?
                        true : false
                    )
                );

          } else {
            newListSelection.isDirectionDown = false;
            newListSelection.isDirectionUp = false;
          }

        } else if (addMoreToSelection) {
          newListSelection.setFocus(itemIndex, newListIndex);
        } else {
          selection.remove(currentIndex, listIndex);
        }
        newList.focus();
      }
      return;
    }

    // Get the new loaded item
    while (newIndex < items.length - 1 && newIndex > -1 && !newItem || (newItemData && !newItemData.loaded) || (newItemData && newItemData.hidden)) {
      newIndex += isDown ? 1 : -1;
      newItem = items[newIndex];
      newItemData = itemData[newIndex];
    }

    if (newItem) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (!e || !e.shiftKey || !selection.multiselectEnabled) {
        selection.clear();
        selection.setOrigin(newIndex, listIndex);
        originItem = newIndex;
        originList = listIndex;
        selIsUp = false;
        selIsDown = false;
      }
      var addMoreToSelection = ((selIsDown && isDown) || (selIsUp && !isDown) || (!selIsDown && !selIsUp));
      if (!selection.isSelected(newIndex, listIndex) && addMoreToSelection) {
        selection.add(newIndex, listIndex);
        if (e && e.shiftKey) {
          selection.isDirectionDown = listIndex > originList ? true : (listIndex < originList ? false : (newIndex > originItem ? true : false));
          selection.isDirectionUp = listIndex < originList ? true : (listIndex > originList ? false : (newIndex < originItem ? true : false));
        } else {
          selection.isDirectionDown = false;
          selection.isDirectionUp = false;
        }
      } else if (addMoreToSelection) {
        selection.setFocus(currentIndex + (isDown ? 1 : -1), listIndex);
      } else if (selection.isSelected(currentIndex, listIndex)) {
        selection.remove(currentIndex, listIndex);
      } else {
        selection.setFocus(currentIndex + (isDown ? 1 : -1), listIndex);
      }

      // Scroll the item into view
      var scrollElement = this.scrollElement;
      var isWindow = scrollElement === window;
      var row = this.rows[newIndex];
      var rowOffset = row.getBoundingClientRect();
      var header = this.nodes.headerWrapper;
      var headerBottom = header && header.getBoundingClientRect().bottom;
      var top = isWindow ? 0 : this.node.getBoundingClientRect().top;
      var hasFixedHeader = this.list.options.header === 'fixed';
      var hasDynamicHeight = this.list.options.height === 'dynamic';
      var listOffset = {
        top: hasFixedHeader ? headerBottom : top,
        bottom: isWindow ? window.innerHeight : scrollElement.getBoundingClientRect().bottom
      };
      var topEdge = scrollElement === window ? 0 : top;

      if (rowOffset.top < listOffset.top || rowOffset.bottom > listOffset.bottom) {
        var scrollLeft = scrollElement.pageXOffset || (scrollElement === window ? document.documentElement.scrollLeft : scrollElement.scrollLeft);
        var scrollTop = scrollElement.pageYOffset || (scrollElement === window ? document.documentElement.scrollTop : scrollElement.scrollTop);

        var change;
        if (scrollElement === window) {
          change = isDown ? rowOffset.bottom - window.innerHeight : rowOffset.top;
        } else {
          change = isDown ? rowOffset.bottom - listOffset.bottom : rowOffset.top - listOffset.top;
        }

        var doSubtractHeader = !isDown && hasFixedHeader && hasDynamicHeight && isWindow;
        var headerHeight = doSubtractHeader ? header.offsetHeight : 0;

        if (scrollElement.scrollTo) {
          scrollElement.scrollTo(scrollLeft, scrollTop + change - headerHeight);
        } else {
          scrollElement.scrollTop = scrollTop + change - headerHeight;
        }
      }
    }
  };

  /**
   * Handler for when the player changes state.
   * This will update the playing state shown in the list.
   *
   * @param {Object} e The event object.
   */
  ListView.prototype.playerChange = function(e) {
    if (this.list.destroyed) { return; }

    var self = this;
    var player = models.player;
    var track = player.track;
    var model = this.list.model;

    if (this.list.isDisc && track) {
      track.load('disc', 'number').done(function() {
        continueUpdate();
      });
    } else {
      continueUpdate();
    }

    function continueUpdate() {
      if (self.list.destroyed) { return; }

      var isSameContext = !!(model.context && player.context && model.context.uri === player.context.uri);
      var isSameDisc = track ? (self.list.isDisc ? self.list.discNumber === track.disc : true) : false;

      if (isSameContext && self.isPlaying && self.list.model.contextHasUpdates && self.list.model.items[self.playingIndex + 1]) {
        self.list.model.contextHasUpdates = false;
        self.list.playTrack(self.playingIndex + 1, self.list.discNumber - 1);
        return;
      }

      if (!isSameContext || !track || !isSameDisc) {
        return self.setPlayingState(false);
      }

      var index = self.list.isDisc ? track.number - 1 : player.index;
      var item = model.items[index];
      item ? self.setPlayingState(index, player.playing) : self.setPlayingState(false);

      if (index === model.items.length - 1) {
        self.list.more();
      }
    }
  };

  /**
   * Set the playing state shown in the list.
   *
   * @param {number}  index   The index within the list.
   * @param {boolean} playing Whether the new state is playing or not.
   */
  ListView.prototype.setPlayingState = function(index, playing) {

    // Wait for the row to be created if an index is passed in
    if (index !== false && !this.rows[index]) {
      var self = this;
      setTimeout(function() {
        self.setPlayingState(index, playing);
      }, 50);
      return;
    }

    if (this.playingRow && this.playingIndex === index && playing === this.playingRow.playing) {
      return;
    }

    if (this.playingRow) {
      css.removeClass(this.playingRow, 'sp-list-item-playing');
      css.removeClass(this.playingRow, 'sp-list-item-paused');
      this.isPlaying = false;
      this.playingRow = null;
      this.playingIndex = null;
    }

    if (index !== false) {
      var row = this.rows[index];
      css.addClass(row, playing ? 'sp-list-item-playing' : 'sp-list-item-paused');
      this.playingRow = row;
      this.playingRow.playing = playing;
      this.isPlaying = true;
      this.playingIndex = index;
    }
  };

  /**
   * Update the 'star' field for all tracks that had 'starred' changed.
   *
   * @param {string} type The action type, 'insert' or 'remove'.
   * @param {Array} uris List of uris that changed star state.
   */
  ListView.prototype.updateStarred = function(type, uris) {
    var listURIs = this.list.model.uris;
    var listRows = this.rows;
    var willBeStarred = type === 'insert';
    var index, row, starIcon, isStarred;

    for (var i = 0, l = uris.length; i < l; i++) {
      index = listURIs.indexOf(uris[i]);
      if (index > -1) {
        row = listRows[index];
        if (row) {
          starIcon = row.querySelector('.sp-icon-star');
          isStarred = css.hasClass(starIcon, 'sp-icon-starred');

          if (isStarred !== willBeStarred) {
            css[willBeStarred ? 'addClass' : 'removeClass'](starIcon, 'sp-icon-starred');
          }
        }
      }
    }
  };

  /**
   * Update the numbers in the ordinal field after a certain index in the list.
   *
   * @param {number} index Position in list to start updating from.
   */
  ListView.prototype.updateOrdinalsFrom = function(index) {
    var cellIndex = this.list.options.fields.indexOf('ordinal');
    if (!~cellIndex) {
      return;
    }

    var list = this.list;
    var rows = this.rows;
    var items = list.model.items;
    var itemData = list.model.itemData;
    var fields = list.model.fields;
    var hideUnplayable = list.options.unplayable === 'hidden';

    var startIndex = this.shownIndices.indexOf(index);
    if (startIndex === -1) {
      startIndex = this.shownIndices.indexOf(index - 1);
    }

    for (var i = startIndex, l = this.shownIndices.length; i < l; i++) {
      var itemIndex = this.shownIndices[i];
      if (itemData[itemIndex] && !itemData[itemIndex].hidden || !hideUnplayable || items[itemIndex].playable) {
        var ordinalCell = rows[itemIndex].children[cellIndex];
        if (ordinalCell) {
          fields[cellIndex].update({ index: i, list: list }, ordinalCell);
        }
      }
    }
  };

  /**
   * Convert a template string to a DOM representation.
   *
   * @ignore
   *
   * @param {string} name The template name.
   *
   * @return {HTMLElement} The outer DOM node specified in the template.
   */
  function getDOMFromTemplate(name) {
    var temp = document.createElement('div');
    temp.innerHTML = templates[name];
    return temp.children[0];
  }

  /**
   * The base HTML template.
   *
   * @ignore
   */
  var templates = {
    base: '<div class="sp-list"></div>',

    header: '' +
        '<div class="sp-list-header">\n' +
        '  <div class="sp-list-header-table-wrapper">\n' +
        '    <table class="sp-list-header-table">\n' +
        '      <colgroup class="sp-list-colgroup"></colgroup>\n' +
        '      <tbody>\n' +
        '        <tr class="sp-list-header-row"></tr>\n' +
        '      </tbody>\n' +
        '    </table>\n' +
        '  </div>\n' +
        '</div>',

    body: '' +
        '<div class="sp-list-body">\n' +
        '  <table class="sp-list-table">\n' +
        '    <colgroup class="sp-list-colgroup">\n' +
        '    </colgroup>\n' +
        '    <tbody class="sp-list-table-body">\n' +
        '    </tbody>\n' +
        '  </table>\n' +
        '</div>',

    list: '<div class="sp-list-wrapper"></div>',

    discNumber: '<span class="sp-list-disc-number"></span>'
  };
});
