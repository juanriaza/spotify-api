require([
  'scripts/profile-utils',
  'scripts/header.controller#Header',
  'scripts/playlist.controller#Playlists',
  'scripts/toplists.controller#Toplists',
  'scripts/activity.controller#Activity',
  'scripts/relations.controller#Relations',
  'scripts/share.controller#Share',
  'scripts/logger#Logger',
  '$api/models',
  '$views/image#Image',
  '$views/utils/css',
  '$views/tabbar#TabBar',
  '$shared/events#EventHandler',
  'strings/main.lang',
  'scripts/relations-helper#RelationCollection'
], function(utils, Header, Playlists, Toplists, Activity, Relations, Share, Logger,
    modelsApi, Image, css, TabBar, EventHandler, mainStrings, RelationCollection) {

  'use strict';

  // Set up a shorthand for getting a translated string.
  var _ = SP.bind(mainStrings.get, mainStrings);

  /**
   * Enum for easy cross-referencing views
   * @enum {string}
   */
  var Views = {
    OVERVIEW: 0,
    FOLLOWERS: 1,
    FOLLOWING: 2
  };

  /**
   * Object constructor
   * @param {?String} username A Spotify canonical username.
   * @param {modelsApi.User} currentUser A Spotify user.
   * @constructor
   */
  var Profile = function() {
    this.events = new EventHandler(this);
  };

  /**
   * Main load method for the module. Called by the constructor
   * @param {?String} username A Spotify canonical username.
   * @param {modelsApi.User} currentUser A Spotify user.
   * @param {?Number} view Which view to load at start.
   * @param {?SlabTemplate} view Which view to load at start.
   */
  Profile.prototype.load = function(username, currentUser, view, templates, session) {
    var _this = this;

    SP.analyticsContext('LOAD: Profile', function() {
      _this.st = 0;
      _this.username = username;
      _this.currentUser = currentUser;
      _this.initView = view;
      _this.templates = templates;
      _this.session = session;

      if (_this.currentUser.username === _this.username) {
        _this.maybeLoadArtist(currentUser);
      } else {
        _this.loadUserByUsername();
      }
    });
  };

  /**
   * Object where the currently active tabs scrollhandler is saved.
   * @type {Function}
   */
  Profile.prototype.currentView = null;

  /**
   * Loads a user by uri
   * @param {string} uri A Spotify user uri.
   */
  Profile.prototype.loadUserByUsername = function() {
    var usr = modelsApi.User.fromUsername(this.username), _this = this;

    SP.analyticsContext('MAIN: loading the user', function() {
      usr.load('name', 'username', 'uri', 'image').
          done(_this, _this.maybeLoadArtist).
          fail(_this, _this.handleError);
    });
  };

  /**
   * Load artist separately from the other properties and only for desktop
   * @param {modelsApi.User} user A Spotify user object.
   */
  Profile.prototype.maybeLoadArtist = function(user) {
    var _this = this;

    SP.analyticsContext('MAIN: loading artist property on user', function() {
      user.load('artist').
          done(_this, _this.initPage).
          fail(function() {
            _this.initPage(user);
          });
    });
  };

  /**
   * Initialise the views only if we have a user object
   * @param {modelsApi.User} user A Spotify user object.
   */
  Profile.prototype.initPage = function(user) {
    this.user = user;
    this.isSelf = this.user.currentUser;

    if (this.user.artist) {
      this.getArtistData();
    } else {
      this.initTemplates();
    }
  };

  /**
   * Gets data for artist for merged profiles
   */
  Profile.prototype.getArtistData = function() {
    var _this = this;

    SP.analyticsContext('MAIN: loading properties on artist', function() {
      _this.user.artist.load('name', 'image').done(_this, _this.artistDataLoaded).fail(_this, _this.initTemplates);
    });
  };

  /**
   * Sets name and image of the artist for profile
   */
  Profile.prototype.artistDataLoaded = function(artist) {
    this.user.name = artist.name;
    this.initTemplates();
  };

  /**
   * Processes the loaded templates file, init modules and switches to the right one
   */
  Profile.prototype.initTemplates = function() {
    this.initNavigation();
    this.initHeader();
    this.switchView(this.initView);

    this.events.listen(window, 'scroll', this.scrollHandler);
    this.events.listen(modelsApi.application, 'deactivate', this.deactivateListener);
  };

  Profile.prototype.deactivateListener = function() {

    // Event 'activate' must only be bound AFTER deactivate to avoid sync/async
    // data cache race conditions. If data is immediately available (such as on a back
    // button), the 'arguments' event will run to completion in this tick, including
    // attaching the 'activate' listener. THEN 'activate' is fired by the client,
    // resulting in a race condition.

    this.events.unlisten(modelsApi.application, 'deactivate', this.deactivateListener);
    this.events.listen(modelsApi.application, 'activate', this.activateListener);
  };

  Profile.prototype.activateListener = function() {

    // see `Profile#deactivateListener` for why this unlisten/listen happens
    this.events.unlisten(modelsApi.application, 'activate', this.activateListener);
    this.events.listen(modelsApi.application, 'deactivate', this.deactivateListener);

    if (this.activity) {
      this.activity.loadActivities();
    }
    if (this.playlists) {
      var current = this.currentView === this.playlists;
      // only set this up if its the current users profile
      if (this.isSelf) {
        this.playlists.destroy();
        this.playlists.conceal();
        this.playlists.initialize(this.isSelf, this.user, this.templates,
            current ? this.playlists.show : null, this);
      }
    }
  };

  Profile.prototype.initNavigation = function() {
    var _this = this;
    var navigationPlaceholder = document.querySelector('.app-content');

    if (!this.navigation) {
      this.navigation = TabBar.withTabs([
        {id: 'nav-overview', name: _('overview')},
        {id: 'nav-followers', name: _('followers')},
        {id: 'nav-following', name: _('following')}
      ]);

      this.navigation.addToDom(navigationPlaceholder, 'prepend');
    }

    this.events.listen(this.navigation, 'tabchange', function(e) {
      var tab = e.id.split('-')[1];
      var uri = 'spotify:user:' + _this.username + (tab === 'overview' ? '' : ':' + tab);

      Logger.log({ type: 'Tab ' + tab + ' opened', uri: uri});
      modelsApi.application.openURI(uri);
    });
  };

  /**
   * Initiates the header controller and shows it
   */
  Profile.prototype.initHeader = function() {
    var handlers = {
      share: this.shareButtonClicked
    }, _this = this;

    SP.analyticsContext('INIT: Header', function() {
      _this.header = new Header();
      _this.header.initialize(_this.isSelf, _this.user, _this.templates, handlers,
          _this);
    });
  };

  /**
   * Initiates the toplists controller and shows it
   */
  Profile.prototype.initToplists = function() {
    var _this = this;

    SP.analyticsContext('INIT: Toplists', function() {
      if (!_this.toplists) {
        var playlists = _this.playlists ? _this.playlists.getPlaylists() : 0;
        _this.toplists = new Toplists();
        _this.toplists.initialize(_this.isSelf, _this.user, _this.templates, playlists);
      }

      if (_this.currentView === _this.playlists || _this.currentView === undefined) {
        _this.toplists.show();
      }
    });
  };

  /**
   * Initiates the recent activity controller and shows it
   */
  Profile.prototype.initActivity = function() {
    var _this = this;

    SP.analyticsContext('INIT: Activity', function() {
      if (!_this.activity) {
        _this.activity = new Activity();
        _this.activity.initialize(_this.isSelf, _this.user, _this.templates,
            _this.currentUser);
      } else {
        // To load new activities if they appear when coming back from other tab
        _this.activity.loadActivities();
      }
      _this.activity.show();
    });
  };

  /**
   * Initiates the followers controller and shows it
   */
  Profile.prototype.initFollowers = function() {
    var _this = this;

    SP.analyticsContext('INIT: Followers', function() {
      if (!_this.followers) {
        _this.followers = new Relations();
        _this.followers.initialize(_this.user, _this.isSelf, _this.templates,
            RelationCollection.FOLLOWERS);
      }
      _this.followers.show();
    });
  };

  /**
   * Initiates the following controller and shows it
   */
  Profile.prototype.initFollowing = function() {
    var _this = this;

    SP.analyticsContext('INIT: Followings', function() {
      if (!_this.following) {
        _this.following = new Relations();
        _this.following.initialize(_this.user, _this.isSelf, _this.templates,
            RelationCollection.FOLLOWING);
      }
      _this.following.show();
    });
  };

  /**
   * Initiates the playlist controller and shows it
   */
  Profile.prototype.initPlaylists = function() {
    var _this = this;

    SP.analyticsContext('INIT: Playlists', function() {
      if (!_this.playlists) {
        _this.playlists = new Playlists();
        _this.playlists.initialize(_this.isSelf, _this.user, _this.templates,
            _this.initToplists, _this);
      }
      _this.playlists.show();
    });
  };

  /**
   * Initiates share window controller
   */
  Profile.prototype.initShare = function() {
    this.share = new Share();
    this.share.initialize(this.isSelf, this.user, this.templates);
  };

  /**
   * Hides section
   * @param {string} section Section's name (the same as controllers).
   */
  Profile.prototype.hideSection = function(section) {
    if (this[section]) {
      this[section].hide();
    }

    var node = document.querySelector('.app-' + section);
    if (node) {
      css.addClass(node, 'hidden');
    }
  };

  /**
   * Destroy controller
   * @param {string} controller Controller's name.
   */
  Profile.prototype.destroyController = function(controller) {
    if (this[controller]) {
      this[controller].destroy();
      delete this[controller];
    }
  };

  /**
   * Generic error-catching
   * TODO: make less generic
   * @param {Object} user The object that failed.
   * @param {Object} err The error object.
   */
  Profile.prototype.handleError = function(user, err) {
    //console.error('(Profile.handleError) failed to load:', user, err);
    if (err && (err.error === 'unknown' || err.error === 'invalid-uri')) {
      this.header = new Header();
      this.header.initialize(false, null, this.templates, null, this);
    }
  };

  /**
   * Disposes the profile and all it's disposable controllers
   */
  Profile.prototype.dispose = function() {
    this.destroyController('playlists');
    this.destroyController('header');
    this.destroyController('activity');
    this.destroyController('toplists');
    this.destroyController('following');
    this.destroyController('followers');
    this.destroyController('share');
    this.events.removeAll();

    delete this.initView;
    delete this.user;
    delete this.username;
  };

  /**
   * Switches to right view
   */
  Profile.prototype.switchView = function(view) {
    switch (view) {
      case Views.FOLLOWERS:
        this.showFollowers();
        break;
      case Views.FOLLOWING:
        this.showFollowing();
        break;
      default:
        this.showOverview();
        break;
    }
  };

  /**
   * Handler for the overview navigation option
   */
  Profile.prototype.showOverview = function() {
    this.hideSection('following');
    this.hideSection('followers');
    this.initPlaylists();
    if (this.toplists) {
      this.toplists.show();
    }
    this.initActivity();

    this.currentView = this.playlists;
    this.setScrollPos();
    this.navigation.setActiveTab('nav-overview');
  };

  /**
   * Handler for the followers navigation object
   */
  Profile.prototype.showFollowers = function() {
    this.hideSection('playlists');
    this.hideSection('activity');
    this.hideSection('toplists');
    this.hideSection('following');

    this.initFollowers();

    this.currentView = this.followers;
    this.setScrollPos();
    this.navigation.setActiveTab('nav-followers');
  };

  /**
   * Handler for the following navigation object
   */
  Profile.prototype.showFollowing = function() {
    this.hideSection('playlists');
    this.hideSection('activity');
    this.hideSection('toplists');
    this.hideSection('followers');

    this.initFollowing();

    this.currentView = this.following;
    this.setScrollPos();
    this.navigation.setActiveTab('nav-following');
  };

  Profile.prototype.setScrollPos = function(button) {
    var scrollTop = this.st;
    if (scrollTop >= 168) {
      scrollTop = this.currentView.getScrollPos();
    }
    window.scrollTo(0, scrollTop);
  };
  /**
   * Shows the share popup
   * @this {Profile} keeps constructor context.
   * @param {Button} the button that was clicked.
   */
  Profile.prototype.shareButtonClicked = function(button) {
    // console.log('(Profile.header) Share button clicked', this);

    if (!this.share) {
      this.initShare();
    }

    this.share.show(button.node, {
      x: 37,
      y: 35
    });
  };

  /**
   * Handler for scrolling document.body. Passes the scrollY position to the
   *    currently active view.
   */
  Profile.prototype.scrollHandler = function() {
    this.st = window.scrollY;
    this.currentView.scrollHandler(this.st);
  };

  exports.Profile = Profile;
  exports.Views = Views;
});
