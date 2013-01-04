/**
 * Copyright (c) 2012 Spotify Ltd
 * @author Martin Jönsson <mart@spotify.com>
 * @author Kalle Persson <awkalle@spotify.com>
 */

require([
  '$api/models',
  '$views/image#Image',
  '$shared/events#EventHandler',
  '$views/throbber#Throbber',
  '$views/list#List',
  'scripts/utils'.toPath(),
  'scripts/env#Environment'.toPath(),
  'scripts/config'.toPath(),
  'strings/main.lang'.toPath()
], function(models, Image, EventHandler, Throbber, List, utils, Environment, config, mainStrings) {

  /**
   * This is the view of the search app.
   * All layout is handled here.
   * @constructor
   * @param {Logger} logger The logger.
   */
  function View(logger) {
    this._logger = logger;
    this._elements = {};
    this._events = new EventHandler(this);
    this.database = [];
  }

  /**
   * Describe your function here if appropriate.
   * @param {number} n Some number. Note lowercase type name.
   * @param {string} s Some string. Note lowercase type name.
   * @param {boolean} b Some boolean. Note lowercase type name.
   * @param {Object} o Some arbitrary object - don't use this unless there is no more specific type.
   * @param {MyClass} myclass An instance of MyClass.
   * @return {Array.<number>} An array of numbers, somehow related to all the crazy parameters
   *     above. Note that you indent a line continuation 4 spaces after the '@' in jsdoc.
   */
  /**
   * Initialize the view and build all necessary nodes.
   */
  View.prototype.init = function() {
    var elements = this._elements;

    elements.page = new Element('div', {
      'class': 'page'
    });

    elements.searchQuery = new Element('div', {
      'class': 'search-query hidden'
    });

    this._events.listen(elements.searchQuery, 'click', function(e) {
      e.preventDefault();

      if (e.target.href) {
        models.application.openURI(e.target.href);
      }
    });

    elements.searchParagraph = new Element('p', {
      'class': 'search-paragraph',
      'html': '<p>' + mainStrings.get('search-paragraph-results', '&ldquo;<a></a>&rdquo;') + '</p>'
    });

    elements.fuzzyMatch = new Element('p', {
      'class': 'fuzzy-match hidden',
      'html': mainStrings.get('did-you-mean', '&ldquo;<a></a>&rdquo;')
    });
    elements.fuzzyMatchAnchor = $$(elements.fuzzyMatch.getElement('a'));

    elements.emptySearchResult = new Element('div', {
      'class': 'empty-search-result',
      'html': '<div><p>' + mainStrings.get('empty-search-result', '&ldquo;<strong></strong>&rdquo;') + '</p></div>'
    });
    elements.emptySearchResultText = $$(elements.emptySearchResult.getElement('strong'));

    elements.searchResult = new Element('div', {
      'class': 'search-result'
    });

    document.body.adopt(
        elements.page.adopt(
        elements.searchQuery.adopt(elements.searchParagraph, elements.fuzzyMatch),
        elements.searchResult,
        elements.emptySearchResult
        )
    );
    this._showThrobber();
  };

  /**
   * Disposes all events and elements.
   */
  View.prototype.dispose = function() {
    this._events.removeAll();
    if (this._elements.page) {
      this._elements.page.dispose();
    }
  };

  /**
   * Sets the view to use small sized covers with calculated margin.
   */
  View.prototype.setSmallSize = function() {
    this.size = 128;
    this.margin = utils.getMargin(this.size);
  };

  /**
   * Sets the view to use big sized covers with no margin.
   */
  View.prototype.setBigSize = function() {
    this.size = 230;
    this.margin = 0;
  };

  /**
   * Set the query and category in the top most white bar.
   * Showing <category> for <query>.
   * @param {string} query The query.
   * @param {string} category The category.
   */
  View.prototype.setQueryAndCategory = function(query, category) {
    var queryElement = new Element('a', {
      'href': 'spotify:search:' + query,
      'text': query
    });
    var searchParagraphClass = 'search-paragraph-';
    searchParagraphClass += (category === null) ? 'results' : category;
    this._elements.searchParagraph.set('html', mainStrings.get(searchParagraphClass, queryElement.outerHTML));
    this._elements.searchQuery.removeClass('hidden');
  };

  /**
   * Sets the fuzzy match string if one is found.
   * @param {string} fuzzy The fuzzy match returned from search.
   */
  View.prototype.setFuzzyMatch = function(fuzzy) {
    if (fuzzy) {
      this._elements.fuzzyMatchAnchor.set('href', 'spotify:search:' + fuzzy);
      this._elements.fuzzyMatchAnchor.set('text', fuzzy);
      this._elements.fuzzyMatch.removeClass('hidden');
    }
  };

  /**
   * Show the throbber in the view, send in options.
   * TODO: What options?
   * @param {Object} options Some options.
   */
  View.prototype._showThrobber = function(options) {
    if (this._throbber) {
      this._throbber.hide();
    }
    options = options || {};
    var element = this._elements[options.element] || this._elements.page;
    this._throbber = Throbber.forElement(element);
    if (options.showContent) {
      this._throbber.showContent();
    }
    if (options.addClass) {
      this._throbber.node.addClass(options.addClass);
    }
  };

  /**
   * Hide the throbber
   */
  View.prototype._hideThrobber = function() {
    this._throbber.hide();
  };

  /**
   * This is an event for clicks on covers. Ideally, this would
   * be handled in the controller but since Image#Image doesn't
   * propagate events we have to attach it directly on the image node
   * to be able to do logging.
   * @param {EventObject} e The EventObject.
   */
  View.prototype._onClick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    var xInElement = e.offsetX;
    var yInElement = e.offsetY;
    var xInDocument = e.target.getPosition().x;
    var yInDocument = e.target.getPosition().y;
    var obj = {
      'type': e.target.getParent('.ui').get('data-uri'),
      'x-mouse-pos': xInElement,
      'y-mouse-pos': yInElement,
      'x-target-pos': xInDocument,
      'y-target-pos': yInDocument
    };
    this._logger.clientEvent('click-on-ui-element-in-search', obj);
  };

  View.prototype.replaceImages = function() {
    var pods = document.getElements('.pod');

    var children;
    for (var i = 0, l = pods.length; i < l; i += 1) {
      children = pods[i].getElement('ul').childNodes;
      for (var j = 0, jL = children.length; j < jL; j += 1) {
        models.children[j].get('data-uri');
      }
    }
  };

  /**
   * Gets a list item based on a object (artists/albums/playlists/people)
   * @param {Object} obj An API object.
   */
  View.prototype.getListItem = function(obj, placeholder) {
    var li = new Element('li', {
      'class': 'ui',
      'data-uri': obj.uri
    });

    var image = null;
    if (placeholder) {
      if (obj instanceof models.Artist) {
        li.addClass('artist-ui');
      } else if (obj instanceof models.Album) {
        li.addClass('album-ui');
      } else if (obj instanceof models.Playlist) {
        li.addClass('playlist-ui');
      }

      image = new Element('div', {
        'class': 'sp-image-placeholder-visible'
      });
    } else {
      var imageOptions = {
        'width': this.size,
        'height': this.size,
        'link': obj.uri,
        'player': true,
        'overlay': [obj.name]
      };

      var img = null;
      if (obj instanceof models.Artist) {
        li.addClass('artist-ui');
        img = Image.forArtist(obj, imageOptions);
      } else if (obj instanceof models.Album) {
        li.addClass('album-ui');
        var name = obj.artists[0].name;
        var href = (name.toLowerCase() !== 'various artists') ? obj.artists[0].uri.toSpotifyURL() : '';
        var artistLink = new Element('a', {
          'html': name,
          'href': href
        });

        imageOptions.overlay.push(artistLink.outerHTML);
        img = Image.forAlbum(obj, imageOptions);

        if (href !== '') {
          img.node.getElement('.sp-image-overlay a').addEventListener('click', function(e) {
            var uri = e.target.get('href').toSpotifyURI();
            models.application.openURI(uri);
            return false;
          });
        }
      } else if (obj instanceof models.Playlist) {
        li.addClass('playlist-ui');
        img = Image.fromSource(obj, imageOptions);
      } else {
        li.addClass('people-ui');
        img = Image.fromSource(obj.image_uri, imageOptions);
      }

      image = img.node;
      this._events.listen(image, 'click', this._onClick);
      this.database.push(li);
    }

    li.adopt(image);
    return li;
  };

  /**
   * Paints the loner view (single search page)
   * @param {Object} data All the data that should be displayed.
   * @param {string} category The category for the single page.
   */
  View.prototype.paintLoner = function(data, category) {
    var self = this;
    this._elements.page.addClass('loner');

    var node = new Element('section', {
      'class': 'pod ' + category
    });

    var hgroup = new Element('hgroup', {
      'class': 'hgroup'
    });

    var h2 = new Element('h2', {
      'text': mainStrings.get(category)
    });

    var ul = new Element('ul', {
      'class': 'grid'
    });

    var categoryData = data[category];
    var li;
    for (var j = 0, jL = categoryData.length; j < jL; j += 1) {
      li = this.getListItem(categoryData[j]);
      li.set('data-index', j);
      ul.adopt(li);
    }

    node.adopt(hgroup.adopt(h2), ul);

    this._elements.searchResult.adopt(node);
  };

  /**
   * Repaints the header (fixes the margin and absolute positioning)
   * @param {Object} maxLengths The maximum lengths of each category.
   */
  View.prototype.repaintHeader = function(maxLengths) {
    if (Object.keys(maxLengths).length === 0) {
      return;
    }
    this.setSmallSize();
    var cols = utils.getCols(this.size, this.margin);
    var rows = this.setRows(cols, maxLengths);
    if (Environment.desktop) {
      this.setHeaderSize(rows);
    }

    var fitted = utils.trimData(cols, maxLengths);
    var containerPadding = document.getElement('.search-result').getStyle('padding-left').toInt();

    var categoryMaxLength, section, ul, button, h2, li, width = 0, left;
    for (var row = 0, l = fitted.length; row < l; row += 1) {
      left = containerPadding;
      for (var key in fitted[row]) {
        categoryMaxLength = fitted[row][key];

        section = document.getElement('.' + key);
        ul = section.getElement('ul');

        button = section.getElement('button');
        h2 = section.getElement('h2');

        h2.addClass('no-link');
        button.addClass('hidden');
        if (categoryMaxLength < maxLengths[key]) {
          h2.removeClass('no-link');
          button.removeClass('hidden');
        }
        button.setStyle('right', this.margin - 2);

        for (var j = 0, jL = ul.childNodes.length; j < jL; j += 1) {
          li = ul.childNodes[j];
          li.removeClass('hidden');

          if (j === 0) {
            li.setStyle('margin-left', 0);
          } else {
            li.setStyle('margin-left', this.margin);
          }

          if (j >= categoryMaxLength) {
            li.addClass('hidden');
          }
        }

        width = (this.size + this.margin) * categoryMaxLength;

        section.setStyles({
          'width': width,
          'top': 0,
          'left': left
        });

        if (row > 0) {
          section.setStyle('top', config.POD_HEIGHT);
        }

        left += width;
      }
    }
  };

  /**
   * Set the header size in desktop (hacki-hack)
   * @param {number} rows The amount of rows.
   */
  View.prototype.setHeaderSize = function(rows) {
    var _size = 40;

    if (rows === 2) {
      _size = 414;
    } else if (rows === 1) {
      _size = 237;
    }

    _getSpotifyModule('core')._set_body_size(10, _size, true);
    console.timeEnd('TOTAL TIME UNTIL RESIZE');
  };

  /**
   * Create the skeleton for the header. All the header nodes
   * @param {Object} data The headerData.
   */
  View.prototype.createHeaderNodes = function(headerData) {
    var docFrag = document.createDocumentFragment();
    var section, hgroup, h2, button, ul;
    for (var key in headerData) {
      section = new Element('section', {
        'class': 'pod ' + key,
        'data-category': key
      });

      hgroup = new Element('hgroup', {
        'class': 'hgroup'
      });

      h2 = new Element('h2', {
        'text': mainStrings.get(key),
        'class': 'title no-link'
      });

      button = new Element('button', {
        'class': 'see-all hidden',
        'text': mainStrings.get('see-all'),
        'styles': {
          'right': this.margin - 2
        }
      });

      ul = new Element('ul', {
        'class': 'grid'
      });

      docFrag.appendChild(section.adopt(hgroup.adopt(h2), button, ul));
    }
    this._elements.searchResult.appendChild(docFrag);
  };

  /**
   * Sets the correct rows class on the page element
   * @param {number} cols The amount of columns.
   * @param {Object} maxLengths The maximum amount in each category.
   */
  View.prototype.setRows = function(cols, maxLengths) {
    var rows = utils.getRows(cols, maxLengths);
    this._elements.page
        .removeClass('rows-1')
        .removeClass('rows-2')
        .addClass('rows-' + rows);
    return rows;
  };

  /**
   * Add data to an unordered list.
   * @param {Object} data The data.
   * @param {boolean} show Wether or not the cover should be shown directly.
   */
  View.prototype.addMoreData = function(data, options) {
    options = options || {};
    var replace = options.replace || false;
    var hidden = options.hidden || false;
    var placeholders = options.placeholders || false;

    // if it's an object, wrap it in an array to make the loop work
    if (!data.length) {
      data = [data];
    }

    if (data[0].length === 0) {
      return;
    }

    var docFrag, ul, li, lastChild, dataIndex, cat;
    for (var row = 0, rL = data.length; row < rL; row += 1) {
      for (var key in data[row]) {
        cat = data[row][key];

        docFrag = document.createDocumentFragment();
        ul = document.getElement('.' + key + ' ul');

        lastChild = ul.getElement('li:last-child');

        dataIndex = lastChild && !replace ? lastChild.get('data-index').toInt() : 0;
        console.time('loop');
        for (var i = 0, l = cat.length; i < l; i += 1) {
          li = this.getListItem(cat[i], placeholders);
          dataIndex += 1;
          li.set('data-index', dataIndex);
          if (hidden) {
            li.addClass('hidden');
          }
          docFrag.appendChild(li);
        }
        console.timeEnd('loop');
        if (replace) {
          ul.empty();
        }
        ul.appendChild(docFrag);
      }
    }
  };

  /**
   * Handler for when there are no tracks in the track list.
   */
  View.prototype._onNoTracks = function() {
    if (!this._elements.page.hasClass('error')) {
      this._throbber.hide();
      this._elements.page.addClass('no-tracks');
      if (this._elements.searchResult.firstChild.hasClass('tracks')) {
        this._elements.searchResult.setStyle('height', 0);
      }
      this._elements.emptySearchResult.set('html', '<div><p>' + mainStrings.get('no-tracks') + '</p></div>');
    }
  };

  /**
   * Handler for when there is an error.
   */
  View.prototype._onError = function() {
    if (this._throbber) {
      this._throbber.hide();
    }
    if (this._elements.searchResult.children.length === 0 ||
        this._elements.searchResult.firstChild.hasClass('tracks')) {
      this._elements.searchResult.setStyle('height', 0);
    }
    this._elements.page.addClass('error');
    this._elements.emptySearchResult.set('html', '<div><p>' + mainStrings.get('snapshot-failed') + '</p></div>');
  };

  /**
   * This creates and initiates the track list.
   * @param {Collection} collection The track collection.
   */
  View.prototype.paintList = function(collection) {
    console.time('PAINTING LIST');
    var list = List.forCollection(collection, {
      fields: ['star', 'track', 'artist', 'time', 'album', 'popularity'],
      height: 'fixed',
      throbber: 'hide-content'
    });
    var self = this;
    list.addEventListener('empty', function() {
      self._onNoTracks();
    });
    list.addEventListener('initial-snapshots-load', function() {
      console.timeEnd('PAINTING LIST');
      console.timeEnd('TOTAL');
    });
    var section = new Element('section', {
      'class': 'tracks',
      'data-category': 'tracks'
    });
    this._elements.searchResult.adopt(section.adopt(list.node));
    list.init();
  };

  exports.View = View;

});
