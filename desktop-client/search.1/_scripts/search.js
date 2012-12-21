/**
 * Copyright (c) 2012 Spotify Ltd
 * @author Gabriel Bonander <gabbon@spotify.com>
 * @author Martin Jönsson <mart@spotify.com>
 * @author Kalle Persson <awkalle@spotify.com>
 */

require([
  '$api/search#Search',
  '$api/models',
  '$shared/events',
  '$views/throbber#Throbber',
  'scripts/pod',
  'scripts/list',
  'scripts/grid',
  'scripts/ui',
  'scripts/datasource',
  'scripts/logger',
  'scripts/utils'
], function(SpotifySearch, models, events, throbber, pod, list, grid, ui, datasource, log, utils) {
  'use strict';

  /**
   * Search handles all search-related tasks
   * @constructor
   */
  function Search(logger) {
    /**
     * The logger for the search app.
     * @type {Logger}
     * @private
     */
    this._logger = logger;

    /**
     * The current category that is searched for.
     * @type {string}
     * @private
     */
    this._currentCategory = null;

    /**
     * The current query that is being searched for.
     * @type {string}
     * @private
     */
    this._currentQuery = null;

    /**
     * The different categories to include in the search.
     * @type {array.<string>}
     */
    this.categories = ['artists', 'albums', 'playlists'];

    /**
     * The amount of items to display
     * @type {object}
     * @private
     */
    this._amount = {};

    /**
     * The pods in which the categories are placed.
     * @type {array.<Pod>}
     * @private
     */
    this._pods = [];

    /**
     * The search that is done gets stored in this variable.
     * @type {array.<Pod>}
     * @private
     */
    this._spotifySearch = null;

    /**
     * The elements
     * @type {Object}
     * @private
     */
    this._elements = {};
  }

  /**
   * The amount of items to snapshot for each category
   * @type {number}
   * @const
   */
  Search.METADATA_COUNT = 15;

  /**
   * The maximum amount of allowed characters in a search query
   * @type {number}
   * @const
   */
  Search.CHARACTER_LIMIT = 300;

  /**
   * The minimal margin between suggest items.
   * @type {number}
   * @const
   */
  Search.MINIMAL_MARGIN = 10;

  /**
   * The properties for each category to load
   * @type {Object}
   * @const
   */
  Search.PROPERTIES = {
    'artists': ['image', 'name', 'uri'],
    'albums': ['image', 'name', 'uri', 'artists'],
    'tracks': ['uri'],
    'playlists': ['image', 'name', 'uri'],
    'search': ['fuzzyMatch', 'artists', 'albums', 'tracks', 'playlists']
  };

  /**
   * The time-out before snapshots/loads fail.
   * @type {number}
   * @const
   */
  Search.TIMEOUT = 15000;

  /**
   * Initialize Search.
   */
  Search.prototype.init = function() {
    var self = this;

    models.session.load('testGroup').done(function() {
      self._logger.setTestGroup(models.session.testGroup);
      self._testGroup = models.session.testGroup.toInt();
    });

    //Disable selection for IE
    document.body.onselectstart = function(e) {
      e.preventDefault();
      return false;
    };

    this._listen();
    this._makeNodes();
  };

  /**
   * Setup listeners for argument changes.
   * @private
   */
  Search.prototype._listen = function() {
    models.application.load('arguments').done(this._argumentsLoaded.bind(this));

    var self = this;
    window.addEventListener('resize', utils.throttle(function() {
      if (typeof self._pods !== 'undefined' && self._pods.length > 0) {
        self._resizePods();
      }
    }, 100));

  };

  /**
   * Make all necessary nodes.
   * @private
   */
  Search.prototype._makeNodes = function() {
    var elements = this._elements;
    elements.page = $('page');


    this._throbber = throbber.forElement(elements.page);

    elements.searchQuery = new Element('div', {
      'class': 'search-query',
      events: {
        click: function(e) {
          e.preventDefault();

          if (e.target.href) {
            models.application.openURI(e.target.href);
          }
        }
      }
    });

    elements.searchParagraph = new Element('p', {
      'class': 'search-paragraph',
      'html': '<p>Showing <span class="search-category-type">results</span> for &ldquo;<strong></strong>&rdquo;.</p>'
    });
    elements.searchQueryText = $$(elements.searchParagraph.getElement('strong'));
    elements.searchCategoryText = $$(elements.searchParagraph.getElement('.search-category-type'));

    elements.fuzzyMatch = new Element('p', {
      'class': 'fuzzy-match',
      'html': 'Did you mean &ldquo;<a></a>&rdquo;?'
    });
    elements.fuzzyMatchAnchor = $$(elements.fuzzyMatch.getElement('a'));

    elements.emptySearchResult = new Element('div', {
      'class': 'empty-search-result',
      'html': '<div><p>No search results for &ldquo;<strong></strong>&rdquo;.</p></div>'
    });
    elements.emptySearchResultText = $$(elements.emptySearchResult.getElement('strong'));

    elements.searchResult = new Element('div', {
      'class': 'search-result'
    });

    elements.page.adopt(
        elements.searchQuery.adopt(elements.searchParagraph, elements.fuzzyMatch),
        elements.searchResult,
        elements.emptySearchResult
    );
  };

  /**
   * Triggers when arguments loaded (page loaded)
   * @param {application} App The application (API).
   * @private
   */
  Search.prototype._argumentsLoaded = function(App) {
    var elements = this._elements;
    var query = utils.trimArgument(App.arguments[0]);
    var category = utils.trimArgument(App.arguments[1]);
    if ((query && query.length > Search.CHARACTER_LIMIT) || (category && category.length > Search.CHARACTER_LIMIT)) {
      this._throbber.hide();
      elements.page.addClass('empty-search');
      elements.searchQuery.addClass('hidden');
      elements.emptySearchResult.set('html', '<div><p>The search keyword is too long, ' +
                                     '<br>please try something shorter.</div>');
    } else {
      this._logger.clientEvent('arguments-loaded', { 'query': query, 'category': category });
      if (category !== undefined && this.categories.indexOf(category) === -1) {
        var len = App.arguments.length;
        for (var i = 1; i < len; i += 1) {
          query += '/';
          query += App.arguments[i];
        }

        category = null;
      }

      if (query) {
        this.execute(query, category);
      }
    }
  };

  /**
   * Executes the search and loads the necessary properties.
   * @param {string} query The search query.
   * @param {string} category The search category.
   */
  Search.prototype.execute = function(query, category) {
    this._currentQuery = query || null;
    this._currentCategory = category || null;
    this._spotifySearch = SpotifySearch.search(query);

    var properties = Search.PROPERTIES.search;
    if (category) {
      properties = category;
    }

    this._spotifySearch.load(properties).done(this._onSearchLoaded.bind(this));
  };

  /**
   * When search is loaded, do DOM operations.
   * @private
   */
  Search.prototype._onSearchLoaded = function() {
    var elements = this._elements;
    elements.fuzzyMatch.addClass('hidden');
    elements.searchParagraph.addClass('hidden');
    elements.page.addClass('search');
    elements.searchQueryText.set('text', this._currentQuery);
    var category = this._currentCategory || 'results';
    elements.searchCategoryText.set('text', category);

    if (this._spotifySearch.fuzzyMatch) {
      var uriArgument = utils.encodeArgument(this._spotifySearch.fuzzyMatch).replace(/%20/g, '+');

      elements.fuzzyMatchAnchor.set({
        'text': this._spotifySearch.fuzzyMatch,
        'title': this._spotifySearch.fuzzyMatch,
        'href': 'spotify:search:' + uriArgument
      });
      elements.fuzzyMatch.removeClass('hidden');
    }

    elements.searchParagraph.removeClass('hidden');

    this._doSnapshots();
  };

  /**
   * Make the necessary snapshots
   * @private
   */
  Search.prototype._doSnapshots = function() {
    var self = this;
    this._snapshotTimeout = setTimeout(function() {
      self._onSnapShotFailed('time-out');
    }, Search.TIMEOUT);

    this._promise = models.Promise.join(
        this._spotifySearch.artists.snapshot(0, Search.METADATA_COUNT),
        this._spotifySearch.albums.snapshot(0, Search.METADATA_COUNT),
        this._spotifySearch.tracks.snapshot(0, Search.METADATA_COUNT),
        this._spotifySearch.playlists.snapshot(0, Search.METADATA_COUNT))
        .done(this._onSnapshotsDone.bind(this))
        .fail(this._onSnapShotFailed.bind(this));
  };

  /**
   * Fail function for snapshots.
   * @param {string} err The error.
   * @private
   */
  Search.prototype._onSnapShotFailed = function(err) {
    this._promise.setFail();
    this._logger.clientEvent('snapshot-failed', { 'error': err, 'query': this._currentQuery });
    this._elements.emptySearchResultText.set('text', this._currentQuery);
    this._elements.page.addClass('empty-search');
    this._elements.emptySearchResult.set('html', '<div><p>An error occurred, please try searching again.</div>');
    this._throbber.hide();
  };

  /**
   * Load all the necessary properties.
   * @param {Array.<Snapshot>} snapshots The snapshots.
   * @private
   */
  Search.prototype._onSnapshotsDone = function(snapshots) {
    clearTimeout(this._snapshotTimeout);
    var self = this;
    this._loadTimeout = setTimeout(function() {
      self._onSnapShotFailed('time-out');
    }, Search.TIMEOUT);

    this._promise = models.Promise.join(
        snapshots[0].loadAll(Search.PROPERTIES.artists),
        snapshots[1].loadAll(Search.PROPERTIES.albums),
        snapshots[2].loadAll(Search.PROPERTIES.tracks),
        snapshots[3].loadAll(Search.PROPERTIES.playlists))
        .done(this._onLoadDone.bind(this))
        .fail(this._onSnapShotFailed.bind(this));
  };

  /**
   * Triggers when snapshots are made. Perform necessary DOM operations.
   * @param {Array.<Array>} snapshots The snapshotted data.
   * @private
   */
  Search.prototype._onLoadDone = function(snapshots) {
    clearTimeout(this._loadTimeout);
    this._artists = snapshots[0] || [];
    this._albums = snapshots[1] || [];
    this._tracks = snapshots[2] || [];
    this._playlists = snapshots[3] || [];

    if (!!this._artists.length + !!this._albums.length + !!this._tracks.length + !!this._playlists.length < 1) {
      this._elements.page.addClass('no-tracks');
      var emptySearchResultText = '<div><p>Your search did not match any tracks in ' +
          'our catalogue. Please ensure all words are spelled correctly. You could ' +
          'also try different or simpler searches.</div>';
      this._elements.emptySearchResult.set('html', emptySearchResultText);
      this._throbber.hide();
    } else {
      this._elements.page.addClass('search');
      var pods = !!this._artists.length + !!this._albums.length + !!this._playlists.length;
      this._elements.page.addClass('pods-' + pods);

      if (this._currentCategory) {
        this._buildLonerView(this._currentCategory);
      } else {
        this._buildExpandedView();
      }
    }
  };

  /**
   * Build the loner view of search.
   * @param {string} category The type of category.
   * @private
   */
  Search.prototype._buildLonerView = function(category) {
    this._elements.page.addClass('loner');
    var lonerPod = new pod.Pod(category, this['_' + category], this._logger, this._spotifySearch[category]);
    lonerPod.init();
    this._elements.searchResult.adopt(lonerPod.node);
    this._throbber.hide();
  };

  /**
   * Build the expanded view (original view)
   * @private
   */
  Search.prototype._buildExpandedView = function() {
    this._elements.page.removeClass('loner');

    var _pod;

    if (this._artists.length > 0) {
      _pod = new pod.Pod('artists', this._artists, this._logger);
      _pod.init();
      this._elements.searchResult.adopt(_pod.node);
      this._pods.push(_pod);
      this._amount['artists'] = this._artists.length;
    }

    if (this._albums.length > 0) {
      _pod = new pod.Pod('albums', this._albums, this._logger);
      _pod.init();
      this._elements.searchResult.adopt(_pod.node);
      this._pods.push(_pod);
      this._amount['albums'] = this._albums.length;
    }

    if (this._playlists.length > 0) {
      _pod = new pod.Pod('playlists', this._playlists, this._logger);
      _pod.init();
      this._elements.searchResult.adopt(_pod.node);
      this._pods.push(_pod);
      this._amount['playlists'] = this._playlists.length;
    }

    if (this._pods.length > 0) {
      this._resizePods();
    } else {
      this._throbber.hide();
    }

    if (this._tracks.length === 0) {
      this._elements.page.addClass('no-tracks');
      var emptySearchResultText = '<div><p>Your search did not match any tracks in ' +
          'our catalogue. Please ensure all words are spelled correctly. You could ' +
          'also try different or simpler searches.</div>';
      this._elements.emptySearchResult.set('html', emptySearchResultText);
    } else {
      list.TrackList.init('tracks', this._spotifySearch.tracks, this._logger, {
        context: this._spotifySearch.tracks,
        fields: ['star', 'track', 'artist', 'time', 'album', 'popularity'],
        header: 'fixed',
        height: 'fixed',
        throbber: 'hide-content',
        type: 'tracks'
      });
    }
  };

  /**
   * Resize the pods to fit.
   * @private
   */
  Search.prototype._resizePods = function() {
    var size = this._pods[0].ui._size[0];
    var cols = this._calculateCols(size);
    var rows = this._calculateRows(size);
    var visible = this._readjustAmount(rows, cols, this._amount);
    var margin = this._calculateMargin(size);
    this._displayPods(visible, margin, cols);
    this._throbber.hide();
  };

  /**
   * Resize the pods to fit.
   * @private
   */
  Search.prototype._calculateRows = function(size) {
    var cols = this._calculateCols(size);
    if (Object.keys(this._amount).length > 2 && // three categories
        this._amount['playlists'] >= cols && // playlists have enough
        this._amount['artists'] + this._amount['albums'] >= cols && // albums and artists have enough
        utils.getTotal(this._amount) / cols >= 2) { // enough elements
      return 2;
    } else {
      return 1;
    }
  };

  /**
   * Get the width of the page.
   * @private
   */
  Search.prototype._getWidth = function() {
    var sr = document.getElement('.search-result');
    var width = sr.getSize().x;
    var padding = sr.getStyle('padding-left').toInt();
    width -= 2 * padding;

    return width;
  };

  /**
   * Calculate the amount of possible columns that fit.
   * @param {number} size The size of the cover (the UI._size).
   * @private
   */
  Search.prototype._calculateCols = function(size) {
    var width = this._getWidth();
    return Math.floor((width + Search.MINIMAL_MARGIN) / (size + Search.MINIMAL_MARGIN));
  };

  /**
   * Calculate the margin we can add between each cover to fill out
   * @param {number} size The size of the cover (the UI._size).
   * @private
   */
  Search.prototype._calculateMargin = function(size) {
    var cols = this._calculateCols(size);
    var width = this._getWidth();
    return Math.floor((width - (cols * size)) / (cols - 1));
  };

  /**
   * Display the pods and arrange the covers in correct order.
   * @param {Array.<Array.<Object>>} visible Contains how many of each should we show.
   * @param {number} margin The possible margin that we can assign to each cover.
   * @param {number} cols The amount of possible columns.
   * @private
   */
  Search.prototype._displayPods = function(visible, margin, cols) {
    var rows = visible.length;
    this._elements.page.removeClass('rows-1').removeClass('rows-2').addClass('rows-' + rows);

    var pod,
        counter = 0,
        containerPadding = document.getElement('.search-result').getStyle('padding-left').toInt(),
        left,
        gridNode,
        type,
        maxAmount,
        child;

    if (rows === 1 && utils.getVisibleTotal(visible) < cols) {
      utils.fillOutWithFakes(visible, 0, cols);
    }

    for (var r = 0; r < rows; r += 1) {
      left = containerPadding;
      for (var i = 0, l = visible[r].length; i < l; i += 1) {
        pod = this._pods[counter];
        gridNode = pod.grid.node;
        type = pod.ui._type;
        maxAmount = visible[r][i][type];

        for (var j = 0, jL = pod.ds.elements.length; j < jL; j += 1) {
          child = gridNode.childNodes[j];

          if (j > 0) {
            child.setStyle('margin-left', margin);
          }

          if (j < maxAmount) {
            child.removeClass('hidden');
          } else {
            child.addClass('hidden');
          }
        }

        var width = maxAmount * (pod.ui._size[0] + margin);
        pod.node.setStyle('width', width);
        pod.node.setStyle('top', 0);
        pod.node.setStyle('left', left);

        if (r > 0) {
          pod.node.setStyle('top', pod.node.getStyle('height').toInt());
        }

        left += width;
        counter += 1;

        var seeAll = pod.node.getElement('.see-all');
        seeAll.addClass('hidden');
        seeAll.setStyle('right', margin);
        if (pod.ds.elements.length > maxAmount) {
          seeAll.removeClass('hidden');
        }
      }
    }
  };

  /**
   * Readjust the amount of covers so we can fit nicely into the designated area.
   * @param {number} rows The amount of rows we can have.
   * @param {number} cols The amount of columns we can have.
   * @param {number} amount The amount of data.
   * @private
   */
  Search.prototype._readjustAmount = function(rows, cols, amount) {
    var arr = [], row = [];
    var firstRow, key, obj;

    if (rows > 1) {
      firstRow = utils.subset(amount, this.categories.slice(0).splice(0, 2));
      firstRow = utils.trim(firstRow, cols);
      var secondRow = utils.subset(amount, this.categories.slice(0).splice(2, this.categories.length - 2));
      secondRow = utils.trim(secondRow, cols);

      for (key in firstRow) {
        if (firstRow.hasOwnProperty(key)) {
          obj = {};
          obj[key] = firstRow[key];
          row.push(obj);
        }
      }
      arr.push(row);

      row = [];
      for (key in secondRow) {
        if (secondRow.hasOwnProperty(key)) {
          obj = {};
          obj[key] = secondRow[key];
          row.push(obj);
        }
      }
      arr.push(row);


    } else {
      firstRow = utils.clone(amount);
      firstRow = utils.trim(firstRow, cols);
      for (key in firstRow) {
        if (firstRow.hasOwnProperty(key)) {
          obj = {};
          obj[key] = firstRow[key];
          row.push(obj);
        }
      }
      arr.push(row);
    }

    return arr;
  };

  exports.Search = Search;

});

