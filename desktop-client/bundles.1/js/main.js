'use strict';

/**
 * Initialize the app logic.
 */
app.initMain = function() {
  var application, EVENT;

  // Create list contents
  this.runningList = this.constructList('running');
  this.appsList = this.constructList('apps');
  this.frameworksList = this.constructList('frameworks');

  // Get API stuff
  application = this.api.models.application;
  EVENT = this.api.models.EVENT;

  // Add event handlers for app events
  application.observe(EVENT.ARGUMENTSCHANGED, this.argumentsChange.bind(this));
  application.observe(EVENT.FILTERCHANGED, this.filterChange.bind(this));
  application.observe(EVENT.ACTIVATE, this.activeChange.bind(this, true));
  application.observe(EVENT.DEACTIVATE, this.activeChange.bind(this, false));

  // Add event handlers for DOM events
  this.updateAllElem.addEventListener('click', this.getUpdatesForAll.bind(this), false);
  document.addEventListener('mousedown', this.hideRemoveConfirms.bind(this), false);

  // Add countdown for global update check
  var timerElem = document.querySelector('#footer .update-timer');
  var childElems = timerElem.children;
  var updateTimer = app.countdown.create(sp.bundles.timeToNextUpdateCheck, function(hours, minutes, seconds) {
    app.updateCountdown(timerElem, undefined, hours, minutes, seconds);
    if (hours === 0 && minutes === 0 && seconds === 0) {
      setTimeout(function timerHandler() {
        updateTimer.time = sp.bundles.timeToNextUpdateCheck;
        if (updateTimer.time === 0) {
          setTimeout(timerHandler, 500);
          return;
        }
        for (var i = 0, l = childElems.length; i < l; i++) {
          childElems[i].classList.remove('hidden');
        }
        updateTimer.start();
        updateTimer.tick();
      }, 500);
    }
  });

  // Set states
  this.argumentsChange();
  this.updateSummary();
};

/**
 * Switches content when the selected tab changes.
 * Handler for when the app arguments change (tab changes).
 */
app.argumentsChange = function() {
  var tabs, tab, oldView, newView;

  // Get wrapper elements for the sections
  tabs = ['running', 'apps', 'frameworks'];
  tab = app.api.models.application.arguments[0];
  tab = ~tabs.indexOf(tab) ? tab : 'running';
  oldView = app.listsElem.querySelector('.active');
  newView = app.listsElem.querySelector('.' + tab);

  // Set app state
  this.activeTab = tab;

  // Set visibility
  oldView.classList.remove('active');
  newView.classList.add('active');

  // Add enough filler rows to fill the empty area in the viewport
  app.listFiller.update();
};

/**
 * Updates the list contents when the filter input changes.
 * Handler for input changes in filter box.
 */
app.filterChange = function() {
  app.filter.update();
  app.listFiller.update();
};

/**
 * Refreshes the lists automatically when the app is reactivated.
 * Handler for when the app is activated/deactivated.
 *
 * @param {boolean} isActive The new value for the app state.
 */
app.activeChange = function(isActive) {
  this.isActive = isActive;
  if (isActive) {
    app.runningList.refresh();
    app.appsList.refresh();
    app.frameworksList.refresh();
  }
};

/**
 * Creates a list of bundles of a specific type.
 * Get all bundles of that type, add them as list items to the DOM,
 * add event handlers and fill up the viewport with empty rows.
 *
 * @param {string} type Type of bundles to get. Can be `apps` or `frameworks`.
 *
 * @return {BundleList} Bundle list containing all the bundles.
 */
app.constructList = function(type) {

  // Get bundles from the API
  var list = this.api.bundles.get(type, function(bundles) {
    var listElem, i, l, itemHeight;

    listElem = app[type + 'Elem'];

    // Remove the initial loading text
    listElem.classList.remove('loading');
    listElem.removeChild(listElem.children[0]);

    // Initialize each bundle item
    for (i = 0, l = bundles.length; i < l; i++) {
      app.constructListItem(type, bundles.get(i), bundles, true);
    }

    // Add enough filler rows to fill the empty area in the viewport
    app.listFiller.update();

  });

  list.type = type;
  list.observe('sort', app.updateDOM.bind(app, list, 'list'));
  list.observe('refresh', function(e) {
    if (e.kind === 'add') {
      app.listFiller.update();
      app.updateSummary();
    }
  });
  list.sorter = app.sorter.create('.' + type + ' header', list);
  list.toggler = app[type + 'Toggler'];

  return list;
};

/**
 * Creates a single list item for a bundle.
 * Adds a list item to the DOM, adds event handlers for bundle events
 * and DOM events for buttons and such.
 * This method will also be called each time a bundle has been refreshed or updated,
 * to update the DOM element to reflect the changes.
 *
 * @param {string}  type      Type of bundle to create. Can be `apps` or `frameworks`.
 * @param {Bundle}  bundle    Bundle object returned from the get method of the API.
 * @param {boolean} firstTime True if this is the first time it's run for this bundle.
 *
 * @return {HTMLLIElement} List item DOM element.
 */
app.constructListItem = function(type, bundle, list, firstTime) {
  var listElem, itemElem, i, l, timeout, callback, timer, buttons, links, dataset;

  listElem = app[type + 'Elem'];
  bundle.listType = type;
  bundle.containerList = list;

  // Add the DOM item
  if (firstTime) {
    listElem.insertAdjacentHTML('beforeend', app.tmpl(bundle));
  } else {
    itemElem = document.getElementById(type + '-bundle-' + bundle.id);
    if (!itemElem) {
      return;
    }
    itemElem.outerHTML = app.tmpl(bundle);
  }
  itemElem = document.getElementById(type + '-bundle-' + bundle.id);

  // Make the list item smart to auto-update itself when the bundle object changes
  if (firstTime) {
    bundle.observe('update', app.updateDOM.bind(app, bundle, 'bundle'));
    bundle.observe('refresh', app.updateDOM.bind(app, bundle, 'bundle'));
  }

  // Set up a countdown timer for the bundle versions
  if (!firstTime) {
    for (i = 0, l = bundle.timers.length; i < l; i++) {
      bundle.timers[i].stop();
    }
  }
  bundle.timers = [];
  for (i = 0, l = bundle.versions.length; i < l; i++) {
    timeout = bundle.versions[i].cacheTimeout / 1000;
    callback = app.updateCountdown.bind(app, bundle, i);
    timer = app.countdown.create(timeout, callback);
    bundle.timers.push(timer);
  }

  // Get action buttons for this item and add handlers
  buttons = {
    getUpdates: itemElem.querySelector('button.get-updates'),
    quit: itemElem.querySelector('button.quit'),
    remove: itemElem.querySelector('button.remove'),
    confirmRemove: itemElem.querySelector('button.confirm-remove'),
    icon: itemElem.querySelector('.icon')
  };
  links = itemElem.querySelectorAll('.bundle-link');
  if (buttons.getUpdates) {
    buttons.getUpdates.addEventListener('click', app.getUpdates.bind(app, bundle));
  }
  if (buttons.quit) {
    buttons.quit.addEventListener('click', app.quitBundle.bind(app, bundle));
  }
  if (buttons.remove) {
    buttons.remove.addEventListener('click', app.askToRemoveBundle.bind(app));
  }
  if (buttons.confirmRemove) {
    buttons.confirmRemove.addEventListener('click', app.removeBundle.bind(app, bundle));
  }
  if (buttons.icon) {
    buttons.icon.addEventListener('click', app.launchBundle.bind(app, bundle));
  }
  for (i = 0, l = links.length; i < l; i++) {
    dataset = links[i].dataset;
    links[i].addEventListener('click', app.gotoBundle.bind(app, dataset.id, dataset.version, dataset.type), false);
  }

  return itemElem;
};

/**
 * Updates list items in the DOM based on new data.
 * If a bundle is passed in, the corresponding list item will be replaced
 * by a new one. If a list is passed in, all list items will be replaced
 * by new ones.
 *
 * It will save the toggle state for the list items and restore it after
 * the items are replaced.
 * When a bundle is removed, it will update the empty filler list items to
 * fill the viewport and update the summary in the footer.
 *
 * This is the receiver function for when an update happens, so this will
 * update the status of how many updates are left, and restore the 'update all'
 * button when done.
 *
 * @param {Bundle|BundleList} obj  Object with all the new data to be used.
 * @param {string}            type Type of object. Either `'bundle'` or `'list'`.
 * @param {Object}            e    Event object. Used for seeing what kind of event the function was called for.
 */
app.updateDOM = function(obj, type, e) {
  var listElem, itemElem, openStates, toggler, listType, isOpen, i, l;

  // Count down for number of updates left (used for the update all button)
  if (type === 'bundle' && e.kind === 'update') {
    app.numUpdatesInProgress--;
    if (app.numUpdatesInProgress <= 0) {
      app.updateAllElem.disabled = false;
    }
  }

  if (type === 'bundle') {
    itemElem = document.getElementById(obj.containerList.listType + '-bundle-' + obj.id);

    if (obj.isRemoved || (obj.listType === 'running' && !obj.inUse)) {
      if (itemElem) {
        itemElem.parentNode.removeChild(itemElem);
        app.listFiller.update();
        if (obj.isRemoved) {
          app.updateSummary();
        }
      }
    } else {
      toggler = app[obj.listType + 'Toggler'];
      listType = obj.listType;
      isOpen = toggler.isItemOpen(itemElem);
      itemElem = app.constructListItem(listType, obj, obj.containerList, false);
      if (isOpen) {
        toggler.openItem(itemElem, false);
      }
    }


  } else if (type === 'list' && (!e || e && e.kind !== 'remove')) {

    listElem = app[obj.type + 'Elem'];

    // Store open states
    openStates = [];
    for (i = 0, l = obj.length; i < l; i++) {
      itemElem = document.getElementById(obj.type + '-bundle-' + obj.get(i).id);
      if (itemElem) {
        openStates.push(obj.toggler.isItemOpen(itemElem));
      }
    }

    // Recreate the bundle list
    listElem.innerHTML = '';
    for (i = 0, l = obj.length; i < l; i++) {
      itemElem = app.constructListItem(obj.type, obj.get(i), obj, true);
      if (openStates[i]) {
        obj.toggler.openItem(itemElem, false);
      }
    }
  }
};

/**
 * Update cache timeout countdown output.
 *
 * @param {Bundle} bundle         Bundle object.
 * @param {string} versionIndex   Version string.
 * @param {number} hours          Number of hours left.
 * @param {number} minutes        Number of minutes left.
 * @param {number} seconds        Number of seconds left.
 */
app.updateCountdown = function(bundle, versionIndex, hours, minutes, seconds) {
  var bundleElem, timeoutElem, numbers, labels, expiredLabel;

  // Get elements from the DOM
  if (bundle.tagName) {
    timeoutElem = bundle;
    expiredLabel = 'Checking for updates...';
  } else {
    bundleElem = document.getElementById(bundle.containerList.listType + '-bundle-' + bundle.id);
    timeoutElem = bundleElem.querySelector('.version-' + versionIndex + ' .cache-timeout');
    expiredLabel = 'Expired';
  }
  numbers = {
    hours: timeoutElem.querySelector('.hours'),
    minutes: timeoutElem.querySelector('.minutes'),
    seconds: timeoutElem.querySelector('.seconds')
  };
  labels = {
    hours: timeoutElem.querySelector('.hours-label'),
    minutes: timeoutElem.querySelector('.minutes-label'),
    seconds: timeoutElem.querySelector('.seconds-label')
  };

  // Set numbers
  numbers.hours.innerHTML = hours;
  numbers.minutes.innerHTML = minutes;
  numbers.seconds.innerHTML = seconds;

  // Set labels
  labels.hours.innerHTML = hours === 1 ? 'hour, ' : 'hours, ';
  labels.minutes.innerHTML = minutes === 1 ? 'minute, ' : 'minutes, ';
  labels.seconds.innerHTML = seconds === 1 ? 'second' : 'seconds';

  // Set visibility
  if (hours === 0) {
    numbers.hours.classList.add('hidden');
    labels.hours.classList.add('hidden');
  }
  if (minutes === 0) {
    numbers.minutes.classList.add('hidden');
    labels.minutes.classList.add('hidden');
  }
  if (hours === 0 && minutes === 0 && seconds === 0) {
    numbers.seconds.classList.add('hidden');
    labels.seconds.innerHTML = expiredLabel;

    if (bundle.tagName) {
      bundle.querySelector('.postfix').classList.add('hidden');
    }
  }
};

/**
 * Updates the summary text in the footer.
 * When a bundle is added or removed from the lists, this will update the numbers.
 */
app.updateSummary = function() {
  var numAppsElem, numFrameworksElem, numAppsLabelElem, numFrameworksLabelElem, i, l, type;

  numAppsElem = this.summary.querySelector('.num-apps');
  numAppsLabelElem = this.summary.querySelector('.num-apps-label');
  numFrameworksElem = this.summary.querySelector('.num-frameworks');
  numFrameworksLabelElem = this.summary.querySelector('.num-frameworks-label');

  numAppsElem.innerHTML = this.appsList.length;
  numFrameworksElem.innerHTML = this.frameworksList.length;

  numAppsLabelElem.innerHTML = this.appsList.length === 1 ? 'app' : 'apps';
  numFrameworksLabelElem.innerHTML = this.frameworksList.length === 1 ? 'framework' : 'frameworks';
};

/**
 * Hides the confirm buttons that appear when you try to remove a bundle.
 * Handler for a mouse event, which will hide the buttons when the user clicks
 * somewhere that is not the remove buttons for that bundle.
 *
 * @param {Object} e Event object for a mouse event.
 */
app.hideRemoveConfirms = function(e) {
  var buttons, i, l;
  buttons = document.querySelectorAll('.confirm-remove.confirm, .remove.confirm');
  for (i = 0, l = buttons.length; i < l; i++) {
    if (buttons[i].parentNode !== e.target.parentNode) {
      buttons[i].classList.remove('confirm');
    }
  }
};

/**
 * Updates the specified bundle to the latest version.
 * Events will be sent out and the handlers will then take care of updating the UI.
 *
 * @param {Bundle} bundle Bundle object to update.
 */
app.getUpdates = function(bundle) {
  bundle.update();
};

/**
 * Get the latest updates for all apps.
 * Frameworks are updated when apps need newer versions.
 * Events will be sent out and the handlers will then take care of updating the UI.
 */
app.getUpdatesForAll = function() {
  app.updateAllElem.disabled = true;
  app.numUpdatesInProgress = app.appsList.length;
  for (var i = 0, l = app.appsList.length; i < l; i++) {
    app.appsList.get(i).update();
  }
};

/**
 * Shows a confirm button when trying to remove a bundle.
 *
 * @param {Object} e Event object for a mouse event.
 */
app.askToRemoveBundle = function(e) {
  e.target.classList.toggle('confirm');
  e.target.parentNode.querySelector('.confirm-remove').classList.toggle('confirm');
};

/**
 * Removes a bundle from storage.
 * Events will be sent out and the handlers will then take care of updating the UI.
 *
 * @param {Bundle} bundle Bundle object to remove.
 */
app.removeBundle = function(bundle) {
  bundle.remove();
};

/**
 * Force quit an app.
 * Events will be sent out and the handlers will then take care of updating the UI.
 *
 * @param {Bundle} bundle Bundle object to quit.
 */
app.quitBundle = function(bundle) {
  bundle.quit(true);
};

/**
 * Launch an app.
 *
 * @param {Bundle} bundle Bundle object to launch.
 */
app.launchBundle = function(bundle) {
  bundle.launch();
};

/**
 * Go to a specific bundle or bundle version within the listings.
 *
 * @param {string} id      Bundle identifier.
 * @param {string} version Bundle version.
 * @param {string} type    Bundle type. 'app' or 'framework'.
 */
app.gotoBundle = function(id, version, type) {
  var tabs, tab, afterTabSwitch;

  // Get new tab
  tabs = { 'app': 'apps', 'framework': 'frameworks' };
  tab = tabs[type];

  // Set up a callback function that will be run when the tab has been switched
  afterTabSwitch = function() {

    // Open item in the list
    app.openItem(id, tab);

    // Scroll the viewport so the item is as high up as possible
    app.scrollToItem(id, tab);

    // Highlight the version of the bundle to attract attention
    app.highlightBundleVersion(id, version, tab);
  };

  // Switch to the correct tab
  if (this.activeTab !== tab) {
    this.gotoTab(tab, afterTabSwitch);
  } else {
    afterTabSwitch();
  }
};

/**
 * Open a specific app tab.
 *
 * @param {string}    tab          Tab id to switch to.
 * @param {function=} opt_callback Function to be called when the tab has been switched.
 */
app.gotoTab = function(tab, opt_callback) {
  if (typeof opt_callback === 'function') {
    var application, EVENT;
    application = this.api.models.application;
    EVENT = this.api.models.EVENT;
    application.observe(EVENT.ARGUMENTSCHANGED, function handler() {
      application.ignore(EVENT.ARGUMENTSCHANGED, handler);
      opt_callback();
    });
  }
  window.location = 'spotify:app:bundles:' + tab;
};

/**
 * Open an item within a list.
 *
 * @param {string} id       Bundle identifier.
 * @param {string} listType The list id, same as tab name.
 */
app.openItem = function(id, listType) {
  var toggler, itemElem;

  toggler = app[listType + 'Toggler'];
  itemElem = document.getElementById(listType + '-bundle-' + id);

  if (itemElem) {
    toggler.openItem(itemElem, false);
  }
};

/**
 * Scroll the viewport so the item is as high up as possible within view.
 *
 * @param {string} id       Bundle identifier.
 * @param {string} listType The list id, same as tab name.
 */
app.scrollToItem = function(id, listType) {
  var itemElem, listWrapper, headerHeight, offset;

  itemElem = document.getElementById(listType + '-bundle-' + id);
  if (itemElem) {
    listWrapper = document.getElementById('lists');
    headerHeight = listWrapper.querySelector('.active header').getBoundingClientRect().height;
    offset = itemElem.offsetTop - headerHeight;

    listWrapper.scrollTop = offset;
  }
};

/**
 * Highlight a bundle version to attract attention.
 *
 * @param {string} id       Bundle identifier.
 * @param {string} version  Bundle version.
 * @param {string} listType The list id, same as tab name.
 */
app.highlightBundleVersion = function(id, version, listType) {
  var itemElem, versionElems, i, l, inUse, versionElem;

  itemElem = document.getElementById(listType + '-bundle-' + id);
  if (itemElem) {
    versionElems = itemElem.querySelectorAll('.version');

    if (version) {
      for (i = 0, l = versionElems.length; i < l; i++) {
        inUse = versionElems[i].classList.contains('version-in-use');
        if (versionElems[i].dataset.version === version && inUse) {
          versionElem = versionElems[i];
          break;
        }
      }
    }

    if (versionElem) {
      versionElem.classList.add('highlight');
      setTimeout(function() {
        versionElem.classList.remove('highlight');
      }, 600);
    } else {
      itemElem.classList.add('highlight');
      setTimeout(function() {
        itemElem.classList.remove('highlight');
      }, 600);
    }
  }
};
