require([
  '$api/models',
  '$views/utils/css',
  '$views/tabbar#TabBar'
],
/**
 * A module for handling basic UI setup.
 * It can create a header section in the top of the app, as well as
 * setting up a main tab bar, that toggles between different views.
 * It deals with the application arguments too for the tabs.
 *
 * @exports views/ui
 *
 * @example
 * require(['$views/ui#UI'], function(UI) {
 *
 *   var ui = UI.init({
 *     header: true,
 *     views: [
 *       {id: 'overview', element: document.getElementById('view-overview')},
 *       {id: 'related', element: document.getElementById('view-related')},
 *       {id: 'biography', element: document.getElementById('view-biography')}
 *     ],
 *     tabs: [
 *       {viewId: 'overview', name: 'Overview'},
 *       {viewId: 'related', name: 'Related Artists'},
 *       {viewId: 'biography', name: 'Biography'}
 *     ]
 *   });
 *
 *   // Switch view programmatically
 *   ui.setActiveView('related');
 *
 *   // Listen for when the view changes
 *   ui.addEventListener('viewchange', function(e) {
 *     e.id; // Id for the view/tab that it changed to
 *     e.previousId; // Id for the view/tab that was active before
 *   });
 *
 *   // Access the tab bar instance (refer to the TabBar view)
 *   ui.tabBar;
 *
 *   // Access the header element
 *   ui.header;
 * });
 */
function(models, css, TabBar) {

  /**
   * @class
   * @implements {Observable}
   * @classdesc An object representing the app UI. It will handle things like
   *     tabs and their associated views, app header etc.
   *
   * @param {Object=} opt_options An object with options.
   *
   * @property {?string} activeView Currently active view id.
   * @property {?module:views/tabbar~TabBar} tabBar The TabBar instance.
   * @property {?HTMLElement} header The header element.
   *
   * @since 1.23.0
   */
  function UI(opt_options) {
    this._parseOptions(opt_options);

    this.activeView = null;
    this._views = null;

    // Create header
    if (this.options.header) {
      this._createHeader();
    }

    // Create views
    if (this.options.views) {
      this._addViews();
    }

    // Create tabs
    if (this.options.tabs) {
      this._createTabBar();
    }
  }
  SP.inherit(UI, models.Observable);

  /**
   * Returns a new initialized UI controller.
   * This can only be created once.
   *
   * @param {Object=} opt_options An object with options.
   *     header {boolean=} Whether to create an app header. Default: false.
   *     views {?Array.<Object>=} An array of the view definitions. Each view
   *       definition should have two properties: id and element. The property id
   *       is an id of your choosing, and element is an element that will be shown
   *       when the view is activated. Default: null.
   *     tabs {?Array.<Object>=} An array of tab definitions. Each tab
   *       definition should have two properties: viewId and name. The viewId
   *       connects the tab with the view with that id. The name will be displayed
   *       on the tab. Default: null.
   *     tabArgumentIndex {number=} The position in the application argument list
   *       where the tab is defined. Default: 0.
   *     activeTab {?string=} Id of the tab that should be active at start.
   *       Default: Taken from the arguments if it exists, otherwise the first tab.
   *     container {HTMLElement=} The app container element. The header will be
   *       placed as the first child in this element. Default: document.body.
   *
   * @return {module:views/ui~UI} A new UI instance.
   *
   * @since 1.23.0
   */
  UI.init = function(opt_options) {
    if (UI._initialized) {
      throw new Error('UI can only be initialized once.');
    }
    UI._initialized = true;
    return new UI(opt_options);
  };

  /**
   * Set which view that should be active.
   *
   * @param {string} id The id of the view that should be activated.
   *
   * @since 1.23.0
   */
  UI.prototype.setActiveView = function(id) {
    if (!this._views) return;
    if (this.activeView === id) return;

    // Hide the previous view
    if (this.activeView && this._views[this.activeView]) {
      var oldView = this.activeView;
      this._views[oldView].style.display = 'none';
      this.activeView = null;
    }

    // Show the new view
    if (this._views[id]) {
      this._views[id].style.display = 'block';
      this.activeView = id;
    } else {
      id = null;

      // If there was no old active view and no new, don't dispatch event
      if (!oldView) return;
    }

    // Send event about the change of view
    this.dispatchEvent({type: 'viewchange', id: id, previousId: oldView});
  };

  /**
   * Parse the options.
   *
   * @param {Object=} opt_options An object with options.
   *
   * @private
   *
   * @since 1.23.0
   */
  UI.prototype._parseOptions = function(opt_options) {
    var options = {
      header: false,
      tabs: null,
      tabArgumentIndex: 0,
      activeTab: null,
      views: null,
      container: document.body
    };

    if (opt_options) {
      for (var prop in opt_options) {
        options[prop] = opt_options[prop];
      }
    }

    this.options = options;
  };

  /**
   * Create a tab bar for the application.
   *
   * @private
   *
   * @since 1.23.0
   */
  UI.prototype._createTabBar = function() {
    if (!this.options.views) {
      throw new Error('Tabs must be connected to views, but no views were defined.');
    }

    var self = this;

    // Create a tab bar with specified tabs
    var tabs = this.options.tabs.map(function(tab) { return {id: tab.viewId, name: tab.name}; });
    var tabBar = TabBar.withTabs(tabs);

    // Add the tab bar to the DOM
    if (this.header) {
      tabBar.addToDom(this.header, 'after');
    } else {
      tabBar.addToDom(this.options.container, 'prepend');
    }

    // Activate a tab
    tabBar.setActiveTab(this.options.activeTab);

    // Load the application arguments, to update the tab when
    // the arguments change.
    var app = models.application;
    app.load('arguments', 'uri').done(function() {
      self._appArguments = app.arguments;
      self._appName = app.uri.replace('spotify:app:', '');

      // If there was no activeTab set in the options, it will try to find
      // which tab to activate from the arguments. If not found, it will
      // activate the first tab.
      if (!self.options.activeTab) {
        var tabArg = self._getTabFromArguments() || tabs[0].id;
        self.options.activeTab = tabArg;
        tabBar.setActiveTab(tabArg);
        self.setActiveView(tabArg);
      }

      // Update tabs when the arguments change
      app.addEventListener('arguments', function(e) {
        self._onArgumentsChange(e);
      });
    });

    // Update the arguments when the active tab changes.
    // Also activate the associated view.
    tabBar.addEventListener('tabchange', function(e) {
      self._onTabChange(e);
    });

    // When the view changes, change the tab.
    // If a view that is not connected to a tab is activated,
    // the active tab will just be deactivated.
    this.addEventListener('viewchange', function(e) {
      if (tabBar.activeTab === e.id) return;
      tabBar.setActiveTab(e.id);
    });

    // Load the device, to be able to know how to handle the arguments
    models.session.load('device');

    this.tabBar = tabBar;
  };

  /**
   * Add views to a storage where it's easy to get
   * a specific view from a tab id.
   *
   * @private
   *
   * @since 1.23.0
   */
  UI.prototype._addViews = function() {
    this._views = {};

    var views = this.options.views;
    for (var i = 0, l = views.length; i < l; i++) {
      if (this._views[views[i].id]) {
        throw new Error('There are multiple views defined with the same id.');
      }
      this._views[views[i].id] = views[i].element;

      // Hide all the views at start, so only one will be shown at once
      views[i].element.style.display = 'none';
    }
  };

  /**
   * Create a header section for the app.
   *
   * @private
   *
   * @since 1.23.0
   */
  UI.prototype._createHeader = function() {
    var header = document.createElement('header');

    // This CSS class is defined in a CSS file in the api framework,
    // which is injected automatically for all apps.
    header.className = 'sp-header';

    // Add the header to the DOM.
    // The parent is set in the options.
    var container = this.options.container;
    container.insertBefore(header, container.firstChild);

    this.header = header;
  };

  /**
   * Update the tab bar when the arguments change.
   *
   * @param {Object} e Event object for the arguments event.
   *
   * @private
   *
   * @since 1.23.0
   */
  UI.prototype._onArgumentsChange = function(e) {
    this._appArguments = models.application.arguments;

    // Abort if this is called due to setting the arguments from a tabchange event.
    // This is to prevent an infinite loop.
    if (this._updatingArguments) {
      this._updatingArguments = false;
      return;
    }

    // Set the active tab based on the tab argument
    this._updatingTabBar = true;
    this.tabBar.setActiveTab(this._getTabFromArguments());
  };

  /**
   * Activate the associated view when the tab changes.
   * Also update the arguments.
   *
   * @param {Object} e Event object for the tachange event.
   *
   * @private
   *
   * @since 1.23.0
   */
  UI.prototype._onTabChange = function(e) {

    // If a view exists for this tab, activate it
    if (this._views && this._views[e.id]) {

      // Use defer to postpone the activation of the view,
      // until all handlers for the tabchange event have been called.
      // This is to make sure that the viewchange event is not triggered
      // before all handlers for tabchange are done.
      SP.defer(this, function() {
        this.setActiveView(e.id);
      });
    }

    // Abort if this is called due to setting the tab bar from the arguments.
    // This is to prevent an infinite loop.
    if (this._updatingTabBar) {
      this._updatingTabBar = false;
      return;
    }

    // Set the new arguments.
    // This is only supported on desktop so far.
    if (models.session.device === 'desktop') {
      this._updatingArguments = true;
      models.application.openApp(this._appName, this._getParsedArguments(e.id));
    }
  };

  /**
   * Get all app arguments with the specified tab within it.
   *
   * @param {string} tabId The id of the current tab.
   *
   * @return {Array.<string>} Array of all the arguments, unencoded.
   *
   * @private
   *
   * @since 1.23.0
   */
  UI.prototype._getParsedArguments = function(tabId) {
    var args = [];
    var appArgs = this._appArguments;
    var tabArgumentIndex = this.options.tabArgumentIndex;

    // Add each existing argument (or fall back to empty string if not there).
    // It will add as many arguments as it needs to fill up until the tab argument.
    // The tab argument is also included. If the tag argument is not the last argument,
    // the following will also be added.
    for (var i = 0, l = Math.max(appArgs.length, tabArgumentIndex + 1); i < l; i++) {
      args.push(i === tabArgumentIndex ? tabId : appArgs[i] || '');
    }

    return args;
  };

  /**
   * Get the current tab from the arguments.
   * If the arguments does not contain a tab, use the activeTab option.
   *
   * @return {string} Id for the current tab.
   *
   * @private
   *
   * @since 1.23.0
   */
  UI.prototype._getTabFromArguments = function() {
    return this._appArguments[this.options.tabArgumentIndex] || this.options.activeTab;
  };

  exports.UI = UI;

});
