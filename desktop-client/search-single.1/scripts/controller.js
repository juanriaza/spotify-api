/**
 * Copyright (c) 2012 Spotify Ltd
 * @author Martin Jönsson <mart@spotify.com>
 */

require([
  '$api/models',
  '$shared/events#EventHandler',
  '$views/throbber#Throbber',
  'scripts/utils',
  'scripts/env#Environment',
  'scripts/config'
], function(models, EventHandler, Throbber, utils, Environment, config) {

  function Controller(d, v) {
    this.data = d;
    this.view = v;
    this.hasRunOnce = false;
  }

  Controller.prototype.init = function() {
    this.listen();
  };

  Controller.prototype.listen = function() {
    models.application.load('arguments').done(this._argumentsLoaded.bind(this));
    models.application.addEventListener('arguments', this._argumentsChanged.bind(this));
  };

  Controller.prototype.dispose = function() {
    if (this._events) {
      this._events.removeAll();
    }
    this.timeOutCounter = 0;
    this.view.dispose();
  };

  Controller.prototype._argumentsChanged = function(App) {
    console.log(App);
    this.hasRunOnce = false;
    this._argumentsLoaded(App);
  };

  Controller.prototype._argumentsLoaded = function(App) {
    if (this.hasRunOnce) {
      return;
    }
    this.dispose();
    this.view.init();
    this.hasRunOnce = true;
    var args = App.arguments ? App.arguments : App.data.arguments;

    var le = args.length;
    while (le--) {
      console.log(args[le]);
    }

    if (args[0] === 'header') {
      args.splice(0, 1);
    }

    var category = args[args.length - 1] || null;
    var query = args[0];

    // Fix if user search for elvis:but:finishes:with:valid:category:artists
    if (args.length > 2) {
      for (var i = 1, l = args.length - 1; i < l; i += 1) {
        query += ':' + args[i];
      }
    }

    if (!utils.isQueryAndCategoryOK(query, category)) {
      // GOTO FAIL
      this.view._onFail();
      return;
    }

    if (!utils.isCategoryProper(category)) {
      if (Environment.web) {
        query = args.join('/');
      } else {
        query = args.join(':');
      }
      category = null;
    }
    console.log(args, query, category);

    this.query = query;
    this.category = category;
    if (query) {
      this.view.setQueryAndCategory(query, category);
      if (Environment.desktop) {
        _getSpotifyModule('core')._set_body_size(10, 40, true);
      }
      if (category !== null) {
        this.initLoner(query, category);
      } else {
        console.time('INIT HEADER');
        this.initHeader(query, category);
      }
    }
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
    console.log(position, this._scrollTop);
    if (position > 0 && this._scrollTop >= position) {
      if (this._throbber) {
        this._throbber.show();
      }

      var self = this;
      this.execute(this.query, [this.category], this.lonerIndex, config.LONER_AMOUNT, function(data) {
        self.lonerIndex += config.LONER_AMOUNT;
        self.view.addMoreData(data[0], true);
        if (self._throbber) {
          self._throbber.hide();
        }
      }, function(err) {
        this._scrollTop -= 1; // try again.
      });
    }

    this.resizeLoner();
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

  Controller.prototype.resize = function() {
    console.log('-> RESIZE TRIGGERED!');
    console.log('this.width', this.width);
    console.log('utils.getwidth', utils.getWidth());

    if (this.width < utils.getWidth() && !this.isLoadedTwice) {
      this.width = utils.getWidth();
      console.log('LOADING IN MORE!');
      this._throbber = Throbber.forElement(this.view._elements.page);
      this._throbber.showContent();
      this.isLoadedTwice = true;
      var categories = config.CATEGORIES;
      var self = this;
      this.execute(this.query, categories, 0, config.LONER_AMOUNT, function(data) {
        var d = data[0];
        utils.removeAlreadyDisplayedData(d);

        self.view.addMoreData(d);

        self.view.repaintHeader(self.data.getMaxLengths());
        self._throbber.hide();
      }, function(err) {
        this.isLoadedTwice = false;
        console.error('Failed to load in more content.', err);
      });
    } else {
      this.view.repaintHeader(this.data.getMaxLengths());
    }

  };

  Controller.prototype.resizeLoner = function() {
    var firstChild = document.getElement('.grid').getElement('li');
    var height = firstChild.getStyle('height').toInt();
    height += firstChild.getStyle('margin-bottom').toInt();

    this.view.size = height;
    this._sectionHeight = config.ROW_OFFSET * height;
  };

  Controller.prototype.onResizeEvent = function() {
    clearTimeout(this.resizeTimer);
    if (this.category === null) {
      this.resizeTimer = setTimeout(this.resize.bind(this), 100);
    } else {
      this.resizeTimer = setTimeout(this.resizeLoner.bind(this), 100);
    }
  };

  Controller.prototype.onClickEvent = function(e) {
    var target = e.target;
    e.preventDefault();
    if (target.hasClass('see-all') || (target.hasClass('title') && !target.hasClass('no-link'))) {
      var category = target.getParent('.pod').get('data-category');
      if (Environment.desktop) {
        models.application.openURI('spotify:app:search-single:' + this.query + ':' + category);
      } else {
        models.application.openApp('search', this.query, category);
      }
    }
  };

  Controller.prototype.headerListen = function() {
    this._events = new EventHandler(this);
    this._events
      .listen(window, 'resize', this.onResizeEvent)
      .listen(document.body, 'click', this.onClickEvent);
  };

  Controller.prototype.lonerListen = function() {
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

  Controller.prototype.initHeader = function(query, category) {
    document.documentElement.addClass('overflow-hidden');
    var self = this;
    var categories = config.SEARCH_PROPERTIES.search;
    this.view.setSmallSize();
    this.view.setMargin(utils.getMargin(this.view.size));

    var cols = utils.getCols(this.view.size, this.view.margin);
    if (cols < 0 && this.timeOutCounter < 500) {
      setTimeout(function() {
        this.timeOutCounter++;
        self.initHeader(query, category);
      }, 10);
      return;
    } else if (cols < 0) {
      cols = 20;
      console.error('Finding out body width took too long');
    }
    console.timeEnd('INIT HEADER');
    this.width = utils.getWidth();

    this.execute(query, categories, 0, cols, function(data) {
      var headerData = data[0];

      if (Environment.web) {
        var trackList = data[1];
        self.view.paintList(trackList);
      }
      console.log('headerdata', headerData);
      console.log('maxLengths', self.data.getMaxLengths());
      self.view.createHeader(headerData, self.data.getMaxLengths(), query);
      console.timeEnd('- OUR TIME FAULT -> ');
      console.timeEnd('TOTAL');
      self.headerListen();
    }, function(err) {
      console.error('Something went wrong!', err);
      this.view._elements.page.addClass('empty-search');
      document.getElement('.tracks').addClass('hidden');
      this.view._elements.emptySearchResult.set('html', '<div><p>' + mainStrings.get('no-tracks') + '</p></div>');
    });
  };

  Controller.prototype.initLoner = function(query, category) {
    this._throbber = Throbber.forElement(this.view._elements.page);

    this.view.setBigSize();
    var cols = 10;

    console.log('initLoner', category);

    this.view.setBigSize();
    this.lonerIndex = 0;
    var self = this;
    this.execute(query, [category], this.lonerIndex, config.LONER_AMOUNT, function(data) {
      self.lonerIndex += 20;
      self.view.paintLoner(data, category);
      self.lonerListen();
      self.resizeLoner();
      self._throbber.hide();
      self._throbber.node.addClass('down');
    });
  };

  Controller.prototype.execute = function(query, categories, offset, cols, callback, failCallback) {
    var self = this;
    console.timeEnd('- TIME BEFORE REQUEST -> ');
    console.time('- TIME WE CANT DO ANYTHING ABOUT -> ');
    this.data.loadSearch(query, categories, offset, cols).done(function(search) {
      console.timeEnd('- TIME WE CANT DO ANYTHING ABOUT -> ');
      console.time('- TIME BETWEEN LOAD AND GETTING DATA -> ');
      self.view.setFuzzyMatch(self.data.getFuzzyMatch());

      var arr = [];

      var dataToGet = {};

      if (categories.indexOf('fuzzyMatch') !== -1) {
        categories.splice(categories.indexOf('fuzzyMatch'), 1);
      }

      if (categories.indexOf('tracks') !== -1) {
        categories.splice(categories.indexOf('tracks'), 1);
      }

      for (var i = 0; i < categories.length; i++) {
        dataToGet[categories[i]] = search[categories[i]];
      }
      var header = self.data.getData(dataToGet);

      arr.push(header);

      if (Environment.web) {
        var tracks = self.data.initList(search.tracks);
        arr.push(tracks);
      }
      console.timeEnd('- TIME BETWEEN LOAD AND GETTING DATA -> ');
      models.Promise
      .join(arr)
      .done(function(data) {

            console.time('- OUR TIME FAULT -> ');
            callback(data);
          })
      .fail(function(err) { failCallback(err); });
    })
    .fail(function(err) { failCallback(err); });
  };

  exports.Controller = Controller;

});
