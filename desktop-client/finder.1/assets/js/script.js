'use strict';

var fs = sp.require('$util/fs'),
    request = sp.require('$util/request'),
    dom = sp.require('$util/dom'),
    hermesScheme = sp.require('assets/js/appstore-proto'),
    lang = sp.require('$util/language'),
    CATALOG = JSON.parse(fs.readFile('finder.splang')),
    _ = partial(lang.getString, CATALOG, 'Finder'),
    storage = sp.require('$util/storage'),
    dnd = sp.require('$util/dnd'),
    logger = sp.require('$util/logger'),
    models = sp.require('$api/models');

var banner = sp.require('/assets/js/banner'),
    storeCom = sp.require('/assets/js/appstore-hermes');

/**
 * Private variables
 */
var market = sp.core.country,
    language = sp.core.language,
    popularappsjson = JSON.parse(fs.readFile('assets/popular-apps.json')),
    startedOnline = (models.session.state == 1) ? true : false,
    appData = {},
    showCategories = true;


/**
 * Tracking variables
 * No A/B test currently running
 */
var testGroup = sp.core.getAbTestGroup(),
    testVersion = 'base',
    loggingVersion = '4',
    freeApps = ['sifter']; // apps in "New Apps" that will only show to free users

/**
 * Enable testers to override A/B assignments
 *
 * We have to detect the format of the args, due to client differences:
 * Older: ['key1','val1','key2','val2']
 * Newer: [{'key1':'val1'},{'key2':'val2'}]
 */
var appArgs = (sp.core.getArguments());
if (appArgs.length === 2 && appArgs[0] == 'testVersion') {
  console.log('You are now viewing testVersion ' + appArgs[1]);
  testVersion = appArgs[1];
} else if (appArgs.length === 1 && (typeof appArgs[0] === 'object') && appArgs[0]['testVersion']) {
  console.log('You are now viewing testVersion ' + appArgs[0]);
  testVersion = appArgs[0].testVersion;
}

/**
 * App Finder
 */
var appFinder = {

  /**
   * Init. the Finder. Loads from local storage,
   * otherwise from hermes call - adds class no-cache.
   */
  init: function() {
    // Run the necessary function
    appFinder.buildPage();
    if (!startedOnline) { checkOffline(startedOnline);}
    appFinder.buildAllCategories();
    appFinder.buildNewApps();
    appFinder.buildAllApps();
    banner.AnimatedBanner.init(testVersion);

    if (appArgs[0] === 'category') {
      var filter = appArgs[1];
      appFinder.filterCategory(filter);
    }

    // Add listeners
    sp.installer.addEventListener('favoriteRemoved', function(appData) {
      appFinder.updateFavourite(appData);
    });
    sp.installer.addEventListener('favoriteAdded', function(appData) {
      appFinder.updateFavourite(appData);
    });
    models.session.observe(models.EVENT.STATECHANGED, function() {
      checkOffline((models.session.state == 1) ? true : false);
    });

    // Baseline tracking
    var mediaObject = document.querySelector('#all-apps-container'),
        activeMediaQuery = window.getComputedStyle(mediaObject).getPropertyCSSValue('content').cssText;
    logger.logClientEvent('PageShowed', 'finder', loggingVersion, testVersion, {
      'activeMediaQuery': activeMediaQuery
    });
  },

  /**
   * Builds and renders the main page layout
   */
  buildPage: function() {
    var layout = fs.readFile('assets/templates/app-home.html'),
        homeContent = [
          _('sPopularApps'),
          _('sFeatureApps'),
          _('sTopApps'),
          _('sAllApps'),
          _('sNewApps'),
          _('sCategoryName'),
          _('sSortOn')
        ];
    document.querySelector('body').innerHTML = lang.format(layout, homeContent);
  },

  /**
   * Checks and sets/removes app in favorite state
   * @param {Object} appData Contains app id and state.
   * @param {Object} node App node.
   */
  updateFavourite: function(appData, node) {
    if (node) {
      var appButton = node.querySelector('button');
      if (appData.type == 'favoriteRemoved') {
        appButton.disabled = false;
        appButton.classList.add('primary');
      } else {
        appButton.disabled = true;
        appButton.classList.remove('primary');
      }
    } else {
      var appElements = node ? node : document.querySelectorAll('.' + appData.data);
      for (var i = appElements.length - 1; i >= 0; i--) {

        var appButton = appElements[i].querySelector('button');

        if (appData.type == 'favoriteRemoved') {
          appButton.disabled = false;
          appButton.classList.add('primary');
        } else {
          appButton.disabled = true;
          appButton.classList.remove('primary');
        }
      }
    }
  },

  /**
  * Builds the category section and adds category to each app
  */
  buildAllCategories: function() {
    storeCom.getAppCategories(function(categories) {
      if (categories) {
        // Add 'All' to front of category list
        categories.unshift('all');

        var categoryContainer = document.getElementById('all-categories'),
            i, l = categories.length,
            wrapper = categoryContainer.getElementsByTagName('div')[0],
            ul = categoryContainer.getElementsByTagName('ul')[0],
            h3 = categoryContainer.getElementsByTagName('h3')[0];

        h3.addEventListener('click', function() {
          if (wrapper.style.display === 'block') {
            wrapper.style.display = 'none';
            document.body.removeEventListener('click', appFinder.bodyClickEvent, false);
          } else {
            wrapper.style.display = 'block';
            document.body.addEventListener('click', appFinder.bodyClickEvent, false);
          }
        });

        for (i = 0; i < l; i += 1) {
          appFinder.renderCategories(categories[i], ul);
        }
        categoryContainer.getElementsByTagName('a')[0].className = 'active';
      }
    });
  },
  bodyClickEvent: function(e) {
    var wrapper = document.getElementById('all-categories').getElementsByTagName('div')[0];
    if (e.target.tagName !== 'H3') {
      if (wrapper.style.display === 'block') {
        wrapper.style.display = 'none';
        document.body.removeEventListener('click', appFinder.bodyClickEvent, false);
      }
    }
  },
  /**
   * Builds all apps sections
   */
  buildAllApps: function() {
    var throbber = document.querySelector('#throbber'),
        tf = setTimeout(function() {
          throbber.style.display = 'block';
        }, 500),
        popCount = 1;

    storeCom.getAppList(function(identifierList) {
      storeCom.getAppData(identifierList, function(appData, isCached) {
        for (var i in appData.items) {
          if (appFinder.renderApp(appData.items[i], popCount, 'all-apps')) {
            popCount++;
          }
        }
        var appContainer = document.getElementById('app-list-all');
        appContainer.classList.add('loaded');
        appContainer.classList.add(isCached ? 'from-cache' : 'no-cache');
        dom.destroy(throbber);
        document.getElementById('all-categories').classList.add('ready');
      });
    });
  },

  /**
   * Builds all apps sections
   */
  buildNewApps: function() {
    var newAppsThrobber = document.querySelector('#newAppsThrobber'),
        tf = setTimeout(function() {
          newAppsThrobber.style.display = 'block';
        }, 500);
    storeCom.getNamedListApps('new_releases', function(identifierList) {
      storeCom.getAppData(identifierList, function(appData, isCached) {
        var i = 0,
            appsDisplayed = 0;
        while (appsDisplayed < 4 && appData.items[i]) {
          if ((freeApps.indexOf(appData.items[i].app_name) > -1) &&
              (sp.core.product === 'Spotify Premium' || sp.core.product === 'Spotify Unlimited')) {
          } else {
            appFinder.renderApp(appData.items[i], false, 'new-apps');
          }
          i++;
          appsDisplayed++;
        }
        var appContainer = document.getElementById('app-list-new');
        appContainer.classList.add('loaded');
        appContainer.classList.add(isCached ? 'from-cache' : 'no-cache');
        dom.destroy(newAppsThrobber);
      });
    });
  },

  /**
   * Get correct category translation from finder.splang
   * @return {String} category name correctly translated.
   */
  getCategoryNames: function(category) {
    switch (category) {
      case 'all' : {
        category = _('sCategoryAll');
        break;
      }
      case 'charts' : {
        category = _('sCategoryCharts');
        break;
      }
      case 'discovery' : {
        category = _('sCategoryDiscovery');
        break;
      }
      case 'events' : {
        category = _('sCategoryEvents');
        break;
      }
      case 'games' : {
        category = _('sCategoryGames');
        break;
      }
      case 'lyrics' : {
        category = _('sCategoryLyrics');
        break;
      }
      case 'reviews' : {
        category = _('sCategoryReviews');
        break;
      }
      case 'social' : {
        category = _('sCategorySocial');
        break;
      }
    }
    return category;
  },

  /**
   * Renders the app information in the "All Apps" list
   *
   * @param {Object} appData Individual app information as returned by getAppData.
   * @return {Boolean} boolean depening on if the try statment works.
   */
  renderApp: function(appData, toplistPlacement, container) {
    var appList = document.getElementById(container),
        hasLanguageSupport;

    var appHolder = new dom.Element('li', {
      id: appData.app_name,
      className: appData.app_name
    });

    var appLanguage = language.toLowerCase(),
        manifest = JSON.parse(appData.manifest.decodeForText());
    try {

      if (manifest.SupportedLanguages) {
        hasLanguageSupport = manifest.SupportedLanguages.some(function(langSupport) {
          return (langSupport == appLanguage);
        });
      } else {
        hasLanguageSupport = false;
      }

      var name = hasLanguageSupport ? manifest.AppName[appLanguage] : manifest.AppName.en,
          description = hasLanguageSupport ? manifest.AppDescription[appLanguage] : manifest.AppDescription.en,
          link;

      if (appData.app_name === 'toplist') {
        link = 'spotify:internal:toplist';
      } else {
        link = 'spotify:app:' + appData.app_name;
      }

      var category = appData.categories ? appData.categories.identifiers[0] : false;

      if (category) {
        appHolder.classList.add(category);
        category = appFinder.getCategoryNames(category);
      }

      var appTemplate = (showCategories && category) ? fs.readFile('assets/templates/node-app.html') :
          fs.readFile('assets/templates/node-app-nocategory.html');

      var appInfo = [
        name,
        description,
        link,
        _('sAddApp'),
        _('sAddedApp'),
        category
      ];

      appHolder.innerHTML = lang.format(appTemplate, appInfo);
      appHolder.querySelector('img').style.backgroundImage = 'url(' + appData.medium_icon_uri + ')';

      var isFavourite = sp.installer.isApplicationFavorite(appData.app_name);
      if (isFavourite) {
        appData = {
          data: appData.app_name,
          type: 'favoriteAdded'
        };
        appFinder.updateFavourite(appData, appHolder);
      }

      appHolder.addEventListener('click', function(e) {
        var appId = this.id,
            element = e.target,
            tag = e.target.tagName;

        if (element.className === 'app-link' || element.className === 'app-image') {
          logger.logClientEvent('AppList', 'click', loggingVersion, testVersion, {
            'app': appId,
            'clickpoint': element.classList[0]
          });
        }

        if ((element.parentNode.tagName == 'BUTTON' && element.className === 'add') || (element.tagName == 'BUTTON' && element.disabled === false)) {
          logger.logClientEvent('AppFavorised', 'click', loggingVersion, testVersion, {
            'app': appId
          });
          sp.installer.addApplicationFavorite(appId);
        }
      }, false);

      if (appHolder.querySelector('.category')) {
        var categoryButton = appHolder.querySelector('.category');

        categoryButton.addEventListener('click', function() {
          var h3 = document.getElementById('all-categories').getElementsByTagName('h3')[0].className,
              name = this.parentNode.classList[1];
          // Only trigger if not already filtered
          if (name !== h3) {
            appFinder.filterCategory(name);
            logger.logClientEvent('Category', 'click', loggingVersion, 'A', {
              'category': this.id,
              'clickpoint': 'filter-list'
            });
          }
        }, false);
      }

      var appLink = appHolder.querySelector('.app-link');
      if (toplistPlacement) {
        appLink.innerHTML = toplistPlacement + '. ' + appLink.innerHTML;
      }
      dom.adopt(appList, appHolder);
      return true;
    } catch (err) {
      return false;
    }
  },

  /**
   * Handles action when filtering on a category
   *
   * @param {String} category categoryId name fetched  when activly clicking a link in the filtering menu,
   *   or from arguments when loading the app and arguments are set.
   */
  filterCategory: function(categoryId) {
    var appsHolder = document.getElementById('all-apps'),
        categoryWrapper = document.getElementById('all-categories'),
        h3 = categoryWrapper.getElementsByTagName('h3')[0],
        box = categoryWrapper.getElementsByTagName('div')[0],
        category = document.getElementById(categoryId);

    h3.innerHTML = category.innerHTML;
    box.style.display = 'none';

    var links = categoryWrapper.querySelectorAll('a'),
        l = links.length, i;

    // Remove class active from filter list
    for (i = 0; i < l; i += 1) {
      links[i].className = '';
    }

    //
    [].forEach.call(appsHolder.querySelectorAll('li'), function(el, index) {
      el.classList.remove('hidden');
      if (categoryId !== 'all') {
        if (el.classList[1] !== categoryId) {
          el.classList.add('hidden');
        }
      }
    });

    category.classList.add('active');
    document.body.removeEventListener('click', appFinder.bodyClickEvent, false);
  },

  /**
   * Renders the app information in the "All Apps" list
   *
   * @param {String} category Category name returned from category list in Storecom.
   * @param {Element} container Placeholder to add <li>'s into.
   */
  renderCategories: function(category,  container) {
    var hasLanguageSupport,
        li = document.createElement('li');

    var categoryHolder = new dom.Element('a', {
      id: category,
      text: appFinder.getCategoryNames(category)
    });

    li.appendChild(categoryHolder);

    categoryHolder.addEventListener('click', function(e) {
      e.preventDefault();

      var filter = this.id;

      appFinder.filterCategory(filter);

      logger.logClientEvent('Category', 'click', loggingVersion, 'A', {
        'category': this.id,
        'clickpoint': 'filter-list'
      });
    }, false);
    container.appendChild(li);
  },

  /**
   * Listens for changed arguments
   */
  argChanged: function() {
    var args = models.application.arguments;
    if ('category' === args[0]) {
      var filter = args[1];
      appFinder.filterCategory(filter);
    }
  }
};

/**
 * Puts application offline/online
 * @param {boolean} online Online state.
 */
function checkOffline(online) {
  var sections = document.querySelectorAll('section');
  for (var i = 0; i < sections.length; i++) {
    if (!startedOnline && !online) {
      sections[i].style.display = 'none';
    } else if (online) {
      window.location.reload();
    } else {
      sections[i].classList.add('offline-mode');
      sections[i].addEventListener('webkitAnimationEnd', animListener, false);
    }
  }
  if (!online) {
    var offlineEl = new dom.Element('p', {id: 'offline-p', text: _('sUnavailableOffline').decodeForText()});
    dom.inject(offlineEl, document.body);
  }
}

/**
 * Animation listener
 * @param {event} e WebKitAnimationEvent.
 */
function animListener(e) {
  e.target.style.display = 'none';
}

/**
 * Exports
 */
exports.init = appFinder.init;
exports.argChanged = appFinder.argChanged;
