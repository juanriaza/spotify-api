/**
 * Initialize the drag and drop handling.
 *
 * @private
 */
SpotifyApi.prototype._initDnD = function() {
  this._dragHandlers = [];
  window.addEventListener('dragstart', this.bind(this._onDragStart, this), false);
};

/**
 * Drag start event handler.
 * It it attached to window, so it will catch all dragstart events.
 *
 * @param {Event} e Event object for dragstart event.
 *
 * @private
 */
SpotifyApi.prototype._onDragStart = function(e) {
  var handlers = this._dragHandlers;
  var handler;
  var text = '';

  // Check for any special handlers that have been added
  for (var i = 0, l = handlers.length; i < l; i++) {
    handler = handlers[i];
    if (handler.test(e.target)) {
      text = handler.getText(e.target);
      break;
    }
  }

  // If one of the special handlers gave a positive result
  if (text) {

    var data = handler.getData(e.target);
    for (var mime in data) {
      e.dataTransfer.setData(mime, data[mime]);
    }

  // No special handlers, fall back to checking for links
  } else {
    var link = e.target;
    while (link && !(link instanceof HTMLAnchorElement)) {
      link = link.parentNode;
    }
    if (link) {
      var isSpUrl = !!link.href.match(SpotifyApi.Exps.http);
      var isSpUri = !!link.href.match(SpotifyApi.Exps.spotify);

      if (isSpUrl || isSpUri) {
        text = link.title || link.textContent;

        var url = isSpUrl ? link.href : link.href.toSpotifyURL();
        e.dataTransfer.setData('text/uri-list', url);
        e.dataTransfer.setData('text/plain', url);
        e.dataTransfer.setData('text/html', '<a href="' + url + '">' + text + '</a>');
      }
    }
  }

  if (!text) return false;

  var tooltip = document.createElement('div');
  tooltip.className = 'sp-dnd-tooltip sp-text-truncate';
  tooltip.textContent = text;

  // Position the tooltip element where the pointer is
  // The z-index is lower than body, so it will be hidden behind body
  tooltip.style.left = e.pageX + 'px';
  tooltip.style.top = e.pageY + 'px';

  // Set the tooltip as the drag image.
  // The element needs to be added to the DOM,
  // but we need to wait a bit before removing it agian.
  document.body.appendChild(tooltip);
  e.dataTransfer.setDragImage(tooltip, 0, 20);
  SpotifyApi.api.defer(this, function() {
    document.body.removeChild(tooltip);
  });
};

/**
 * Add a special handler for drag events.
 *
 * @param {function(HTMLElement): boolean} testFunc Tests whether the element
 *     should be handled by this handler.
 * @param {function(HTMLElement): Object} getDataFunc Gets the data that the
 *     drag event should hold.
 * @param {function(HTMLElement): string} getTextFunc Gets the text that should
 *     be put in the drag tooltip.
 */
SpotifyApi.prototype.addDragHandler = function(testFunc, getDataFunc, getTextFunc) {
  this._dragHandlers.push({
    test: testFunc,
    getData: getDataFunc,
    getText: getTextFunc
  });
};

// This file will be included after the SpotifyApi instance has been created,
// so it will be fine to call this init method.
SpotifyApi.api._initDnD();
