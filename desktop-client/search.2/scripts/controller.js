/**
 * Copyright (c) 2012 Spotify Ltd
 * @author Martin Jönsson <mart@spotify.com>
 * @author Kalle Persson <awkalle@spotify.com>
 *
 * This is the controller of the search application.
 * Here's where everything but the actual data and the view layer
 * gets computed.
 */

require([
  '$api/models',
  '$shared/events#EventHandler',
  '$views/throbber#Throbber',
  'scripts/utils'.toPath(),
  'scripts/env#Environment'.toPath(),
  'scripts/config'.toPath()
], function(models, EventHandler, Throbber, utils, Environment, config) {

  /**
   * The controller
   * @constructor
   * @param {Data} d The data (model) associated with the controller.
   * @param {View} v The view associated with the controller.
   */
  function Controller(d, v) {
    /**
     * The model.
     * @type {Data}
     */
    this.data = d;

    /**
     * The view.
     * @type {View}
     */
    this.view = v;

    /**
     * Whether the app has already run once or not.
     * @type {boolean}
     */
    this._hasRunOnce = false;
  }

  /**
   * Initialize the controller by listening to events.
   */
  Controller.prototype.init = function() {
    this.listen();
  };

  /**
   * Listen to two events, when arguments gets loaded and changed.
   */
  Controller.prototype.listen = function() {
    models.application.load('arguments').done(this.argumentsLoaded.bind(this));
    models.application.addEventListener('arguments', this.argumentsChanged.bind(this));
  };

  /**
   * This triggers on arguments changed. It resets 'hasRunOnce'
   * to be able to run Controller#argumentsLoaded again properly.
   * @param {Application} app The application itself.
   */
  Controller.prototype.argumentsChanged = function(app) {
    console.log('* ARGUMENTS CHANGED!');
    this._hasRunOnce = false;
    this._isLoadedTwice = false;

    this.argumentsLoaded(app);
  };

  /**
   * This triggers when arguments are loaded. It will
   * make sure that the arguments are OK (not long enough + !undefined).
   * If there are many arguments, the last one will go to category and
   * the rest will be concatenated into a query.
   * When query and category are decided it will either trigger the loner view
   * or normal view depending on the value of category.
   * @param {Application} app The application itself.
   */
  Controller.prototype.argumentsLoaded = function(app) {
    console.log('* ARGUMENTS LOADED!');
    if (this._hasRunOnce) {
      return;
    }
    this._hasRunOnce = true;

    this._dispose();
    this.view.init();

    var args = app.arguments ? app.arguments : app.data.arguments;
    if (!utils.areArgumentsOK(args)) {
      this.view._onError.call(this.view);
      return;
    }

    var category = (args.length > 1) ? args.splice(-1, 1).join() : null;
    if (category && !utils.isCategoryProper(category)) {
      args.push(category);
      category = null;
    }

    var query = '';
    var separator = (Environment.desktop) ? ':' : '/';
    query = args.join(separator);

    this.query = query;
    this.category = category;

    this.view.setQueryAndCategory(query, category);
    if (Environment.desktop) {
      console.log('--> THE BODY SHOULD BE ADJUSTED <--');
      _getSpotifyModule('core')._set_body_size(10, 40, true);
    }

    if (category) {
      this.initLoner(query, category);
    } else {
      console.time('(GETTING COLS)');
      this.initHeader(query, category);
    }
  };

  /**
   * Initialize the header. Firsly, get how many objects
   * we can fit on one page. This is done by getting the body width
   * (through a timeout, until it's completely loaded). If it takes too long
   * (> 3000ms) it will default to config.LONER_AMOUNT items.
   * Then make a request to the model for x number of objects and
   * then create the header.
   * @param {string} query The query.
   * @param {string} category The category.
   */
  Controller.prototype.initHeader = function(query, category) {
    // make sure we don't have any scrollbar in search-header
    document.documentElement.addClass('overflow-hidden');

    this.view._showThrobber({ 'element': 'searchResult' });
    this.view.setSmallSize();
    var self = this;

    var cols = utils.getCols(this.view.size, this.view.margin);
    if (cols < 0 && this.timeOutCounter < 300) {
      setTimeout(function() {
        self.timeOutCounter += 1;
        self.initHeader(query, category);
      }, 10);
      return;
    } else if (cols < 0) {
      cols = config.LONER_AMOUNT;
      console.error('Getting body width took too long, > 3000ms');
    }
    console.timeEnd('(GETTING COLS)');

    this.width = utils.getWidth();

    var options = {
      'amount': cols
    };
    this.execute(options, function(data) {
      console.time('APP TIME AFTER GETTING DATA');
      var d = data[0];
      // TEMP HACK
      if (config.ALLOW_PEOPLE) {
        d.people = data[1][0].playlist;
      }
      // ----------
      self.view.createHeaderNodes(d);
      var trimmedData = utils.trimData(cols, self.data.maxLengths, d);

      self.view.addMoreData(trimmedData, { 'placeholders': true });
      self.view.repaintHeader(self.data.maxLengths);
      self.view.addMoreData(trimmedData, { 'replace': true });
      self.view.repaintHeader(self.data.maxLengths);

      self.data.getFuzzyMatch().done(function(fuzzyMatch) {
        self.view.setFuzzyMatch(fuzzyMatch);
        console.log('fuzzymatch', fuzzyMatch);
      });

      if (Object.keys(self.data.maxLengths).length > 0) {
        self._headerListen();
      }
      self.view._hideThrobber();
      console.timeEnd('APP TIME AFTER GETTING DATA');
      if (Environment.desktop) {
        console.timeEnd('TOTAL');
      }
    }, function(err) { console.log(err); });
  };

  /**
   * Initialize the search single page. lonerIndex is used
   * to keep track of how many objects the user has loaded in.
   * @param {string} query The query.
   * @param {string} category The category.
   */
  Controller.prototype.initLoner = function(query, category) {
    this.view._showThrobber();
    this.view.setBigSize();

    this.lonerIndex = 0;
    var options = {
      'categories': [category],
      'amount': config.LONER_AMOUNT
    };

    var self = this;
    this.execute(options, function(data) {
      var d = data[0];
      self.lonerIndex += config.LONER_AMOUNT;
      self.view.paintLoner(d, category);
      self._lonerListen();
      self._resizeLoner();
      self.view._hideThrobber();
    });
  };

  /**
   * Describe your function here if appropriate.
   * @param {string} query The query.
   * @param {string} options Some string. Note lowercase type name.
   * @param {Function} callback Some boolean. Note lowercase type name.
   * @param {Function} failCallback Some arbitrary object - don't use this unless there is no more specific type.
   */
  Controller.prototype.execute = function(options, callback, failCallback) {
    failCallback = failCallback ? function(err) { failCallback(err); } : this.view._onError.bind(this.view);

    options = options || {};
    options.start = options.start || 0;
    options.amount = options.amount || 50;
    options.categories = options.categories || config.SEARCH_CATEGORIES;

    var self = this;
    console.timeEnd('TIME BEFORE REQUEST');
    console.time('LOADING SEARCH');
    this.data.loadSearch(this.query, options)
      .done(function(search) { self.onLoadSearch(search, options, callback, failCallback); })
      .fail(failCallback);
  };

  /**
   * This is where the search will be loaded. The fuzzy match will be set
   * if there is no fuzzy match the view will handle it properly.
   * The track list gets initiated in here as soon as possible since
   * it takes a long time to load. It then gets the data and calls the callback
   * to get immediately run
   * @param {Search} search The search object, holds collections.
   * @param {Object} options Options for the search.
   * @param {Function} callback The callback on finished successfully.
   * @param {Function} failCallback The callback if something fails.
   */
  Controller.prototype.onLoadSearch = function(search, options, callback, failCallback) {
    console.timeEnd('LOADING SEARCH');
    console.time('TIME BETWEEN LOAD AND GETTING DATA');

    var fuzzyIndex = options.categories.indexOf('fuzzyMatch');
    if (fuzzyIndex > -1) {
      options.categories.splice(fuzzyIndex, 1);
    }

    var trackIndex = options.categories.indexOf('tracks');
    if (trackIndex > -1) {
      options.categories.splice(trackIndex, 1);
      if (Environment.web && !this.category) {
        this.view.paintList(search.tracks);
      }
    }

    var promises = [];
    promises.push(this.data.getData(search, options.categories));

    if (config.ALLOW_PEOPLE && Environment.desktop) {
      promises.push(this.data.getPeople(this.query));
    }

    console.timeEnd('TIME BETWEEN LOAD AND GETTING DATA');
    console.time('SNAPSHOTTING AND LOADING DATA');
    models.Promise.join(promises)
      .done(function(data) { console.timeEnd('SNAPSHOTTING AND LOADING DATA'); callback(data); })
      .fail(failCallback);
  };

  /**
   * This handles all events for the search header.
   * Currently, on window resizes and document.body clicks
   */
  Controller.prototype._headerListen = function() {
    this._events = new EventHandler(this);
    this._events
      .listen(window, 'resize', this._onResizeEvent)
      .listen(document.body, 'click', this._onClickEvent);
  };

  /**
   * This handles all events for the search single page.
   * Currently, on window resizes. It will also initiate
   * an interval that checks if the user has scrolled into a
   * new view in which the user should load in more content.
   */
  Controller.prototype._lonerListen = function() {
    this._events = new EventHandler(this);
    this._events
      .listen(window, 'resize', this.onResizeEvent);

    var self = this;
    this.interval = setInterval(function() {
      //if (!self.data.finishedLoading) {
      self._isSameView();
      //}
    }, 500);
  };

  /**
   * This function handles the resize event. It sets a timer so if
   * the user resizes again within 100 ms, it will reset the current
   * timer and make a new one.
   */
  Controller.prototype._onResizeEvent = function() {
    clearTimeout(this._resizeTimer);
    var fn = (this.category) ? this._resizeLoner.bind(this) : this._resize.bind(this);
    this._resizeTimer = setTimeout(fn, 100);
  };

  /**
   * This triggers on resize of viewport. If there is an increase in width
   * and it hasn't loaded in more content before it will make a request to
   * fetch more data and then display it. Otherwise it will repaint the header.
   */
  Controller.prototype._resize = function() {
    console.log('---> RESIZE TRIGGERED!');
    // - 4px because of padding-left in stack overlay (shadow) (doh)
    if (this.width > 0 && this.width < (utils.getWidth() - 14) && !this._isLoadedTwice) {
      this._isLoadedTwice = true;
      this.width = utils.getWidth();

      this.view._showThrobber({ 'showContent': true });

      var options = {
        'categories': config.CATEGORIES,
        'amount': 20
      };
      this.execute(options, this._onResizeExecution.bind(this), this._onResizeExecutionFail.bind(this));
    } else {
      this.view.repaintHeader(this.data.maxLengths);
    }
  };

  /**
   * This triggers when resize triggers a new load of data.
   * It removes all the previous displayed data and adds
   * the remaining data to the corresponding lists.
   * Finally, it repaints the header.
   * @param {Object} data The data returned from the model.
   */
  Controller.prototype._onResizeExecution = function(data) {
    var d = data[0];
    if (config.ALLOW_PEOPLE) {
      d.people = data[1][0].playlist;
    }

    utils.removeAlreadyDisplayedData(d);
    this.view.addMoreData(d, { 'hidden': true });
    this.view.repaintHeader(this.data.maxLengths);

    this.view._hideThrobber();
  };

  /**
   * If something goes wrong while getting more data during resizing
   * make sure it's possible to get data again and repaint the header.
   * @param {string} error The error.
   */
  Controller.prototype._onResizeExecutionFail = function(error) {
    this._isLoadedTwice = false;
    this.view.repaintHeader(this.data.maxLengths);
    this.view._hideThrobber();
    console.error('Failed to load in more content.', error);
  };

  /**
   * This function is for the click event on the document.
   * If the target is either the see-all button or the title
   * (if it's linkable) it will navigate to the search single page.
   * @param {EventObject} e The event object.
   */
  Controller.prototype._onClickEvent = function(e) {
    e.preventDefault();
    if (e.target.hasClass('see-all') || (e.target.hasClass('title') && !e.target.hasClass('no-link'))) {
      var category = e.target.getParent('.pod').get('data-category');
      if (Environment.desktop) {
        // hack because we can't navigate within the same app on desktop
        models.application.openURI('spotify:app:search-single:' + this.query + ':' + category);
      } else {
        models.application.openApp('search', this.query, category);
      }
    }
  };

  /**
   * Dispose the events, reset the time-out counter and dispose the view.
   */
  Controller.prototype._dispose = function() {
    if (this._events) {
      this._events.removeAll();
    }
    this.timeOutCounter = 0;
    this.view.dispose();
  };

  /* Functions to deal with scrolling behaviour, should be in its own controller */
  Controller.prototype._resizeLoner = function() {
    var firstChild = document.getElement('.grid').getElement('li');
    var height = firstChild.getStyle('height').toInt();
    height += firstChild.getStyle('margin-bottom').toInt();

    this.view.size = height;
    this._sectionHeight = config.ROW_OFFSET * height;
  };

  Controller.prototype._isSameView = function() {
    if (utils.getScrollTop() === this._scrollTop) {
      return;
    }
    this._scrollTop = utils.getScrollTop();

    if (this.data.maxLengths[this.category] === document.getElement('.grid').children.length) {
      clearInterval(this.interval);
    }

    var loner = document.getElement('.grid');

    var position = loner.getSize().y - window.innerHeight;
    // should we load in more objects?
    if (position > 0 && this._scrollTop >= position) {
      this.view._showThrobber({ 'addClass': 'down' });

      var self = this;
      var options = {
        'categories': [this.category],
        'start': this.lonerIndex,
        'amount': config.LONER_AMOUNT
      };
      this.execute(options, function(data) {
        var d = data[0];
        self.lonerIndex += config.LONER_AMOUNT;
        self.view.addMoreData(d, { 'hidden': false });
        self.view._hideThrobber();
      });
    }

    this._resizeLoner();
    var scrollSection = Math.floor(this._scrollTop / this._sectionHeight);
    if (this.scrollSection !== scrollSection) {
      this.scrollSection = scrollSection;
      this._pruneOrAdd(scrollSection);
    }
  };

  Controller.prototype._pruneOrAdd = function(section) {
    var scrollSection = (section === 0) ? 0 : section - 1;
    var startIndexShouldBe = scrollSection * config.ROW_OFFSET_LENGTH;
    var grid = document.getElement('.grid');
    var startIndexIs = grid.getElement('li').get('data-index').toInt();
    if (startIndexIs === startIndexShouldBe) {
      return;
    } else if (startIndexIs > startIndexShouldBe) {
      while (startIndexIs > startIndexShouldBe) {
        if (this.view.database[startIndexIs - 1]) {
          this.view.database[startIndexIs - 1].inject(grid, 'top');
        }
        startIndexIs -= 1;
      }
    } else if (startIndexIs < startIndexShouldBe) {
      while (startIndexIs < startIndexShouldBe) {
        grid.childNodes[0].dispose();
        startIndexIs += 1;
      }
    }
    var paddingTop = Math.floor(startIndexShouldBe / config.COLS * this.view.size);
    if (this._paddingTop !== paddingTop) {
      grid.setStyle('padding-top', paddingTop);
      this._paddingTop = paddingTop;
    }
  };

  exports.Controller = Controller;

});
