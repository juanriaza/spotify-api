'use strict';

/**
 * Module for bundle management.
 * Getting data about all installed bundles, removing and updating etc.
 *
 * @module BundleManagement
 *
 * @property {BundleManagement} bundleManagement An instance of the API which you will use to access everything.
 */
var sp = getSpotifyApi();
var semver = sp.require('../vendor/semver');
var models = sp.require('$api/models');
var Observable = models.Observable;
var Collection = models.Collection;
var bundleManagement;

// Constants to keep all bundle type names in one place
var BUNDLE_TYPE_PUBLIC = {
  'Application': 'app',
  'Framework': 'framework',
  'Bridge': 'framework'
};
var BUNDLE_TYPE = {
  APP: 'Application',
  FRAMEWORK: 'Framework',
  BRIDGE: 'Bridge'
};
var LIST_TYPE = {
  APPS: 'apps',
  FRAMEWORKS: 'frameworks',
  RUNNING: 'running'
};
var LIST_TYPES = ['apps', 'frameworks', 'running'];
var BUNDLE_TO_LIST_TYPE = {};
BUNDLE_TO_LIST_TYPE[BUNDLE_TYPE.APP] = LIST_TYPE.APPS;
BUNDLE_TO_LIST_TYPE[BUNDLE_TYPE.FRAMEWORK] = LIST_TYPE.FRAMEWORKS;
BUNDLE_TO_LIST_TYPE[BUNDLE_TYPE.BRIDGE] = LIST_TYPE.FRAMEWORKS;


/**
 * Main object for the Bundle Management API. From this object, you can get bundles or handle them in a generic way.
 * If you use this object to get bundles, you will get Bundle objects inside a BundleList. These are very responsive
 * and will automatically refresh its data if a related bundle need it to refresh.
 *
 * This object will trigger some events, that you can listen to by using `bundleManagement.observe('eventname', function (e) {});`.
 * The events that will be triggered are:
 * `getBundlesComplete`: When the get method has been called and results are fetched. Event object contains the new bundle list in property `list`.
 * `updateMultipleComplete`: When the update process is done for a batch call of multiple bundles.
 *                           Event object contains the bundle ids in property `ids`.
 * `updateComplete`: When one bundle has been updated. Event object contains the bundle id in property `id`.
 *
 * @constructor
 *
 * @property {Array} bundleLists List of all BundleLists created by the get method
 *
 * @implements {Observable}
 */
function BundleManagement() {
  this.bundleLists = [];
  this.observers = {};
  this.cache = {
    ttl: 3600000, // 1 hour
    lastUpdateAll: 0,
    lastUpdateActive: 0,
    allBundles: [],
    activeBundles: []
  };

  //sp.bundles.addEventListener('installComplete', BundleManagement.updateComplete.bind(BundleManagement, this));
}

/**
 * Get list of bundles that the client knows about.
 *
 * @param {Array|string=} opt_ids      Optional. Specifies which bundles to get. Gets all bundles if this is not provided. If a string is passed in,
 *                                     it is interpreted as a bundle type.
 * @param {function=}     opt_callback Optional. Function to call when the bundles have been fetched.
 *
 * @return {BundleList}                A list of bundles.
 */
BundleManagement.prototype.get = function(opt_ids, opt_callback) {
  var isTypeList, bundleList, allBundles, activeBundles,
      activeBundleIds, bundles, version, bundleVersion, i, l, n, len;
  var callback = typeof opt_callback === 'function' ? opt_callback : function() {};

  // Interpret the ids
  //   Array: It fetches the bundles specified in the array.
  //   Omitted: Either only a callback was passed in, or nothing. Either way, set ids to an empty array.
  var ids = (opt_ids === undefined || typeof opt_ids === 'function') ? [] : opt_ids;
  //   String: A string will be interpreted as a bundle type. If not valid, an empty array will be used.
  if (typeof ids === 'string') {
    if (~LIST_TYPES.indexOf(ids)) {
      isTypeList = true;
    } else {
      ids = [];
    }
  }

  // Initialize a new BundleList, and set the right properties for what type of list it is.
  bundleList = new BundleList();
  if (isTypeList) {
    bundleList.isTypeList = true;
    bundleList.listType = ids;
  }
  if (ids instanceof Array && ids.length === 0) {
    bundleList.isFullList = true;
  }

  // This is the actual fetching of bundles.
  //   We get all installed bundles and connect them with all active bundles.
  //   We also need to filter through them based on the user input.
  allBundles = BundleManagement.getBundlesData('all', false, this);
  activeBundles = BundleManagement.getBundlesData('active', false, this);
  activeBundleIds = [];
  bundles = [];

  // Add active states to the real bundle data objects
  for (i = 0, l = activeBundles.length; i < l; i++) {
    version = activeBundles[i];
    activeBundleIds.push(version.id);

    // Set flag that the bundle is in use
    bundleVersion = BundleManagement.getBundleVersion(allBundles, version.id, version.hash);
    bundleVersion.inUse = true;

    // Add data to dependencies, about what bundles are using the dependency (recursively)
    BundleManagement.addInUseBy(allBundles, version);

    // Fix dependency properties for the active bundles
    BundleManagement.fixDependencies(allBundles, version);
  }

  // Fix dependency properties for all bundles
  for (i = 0, l = allBundles.length; i < l; i++) {
    for (n = 0, len = allBundles[i].versions.length; n < len; n++) {
      BundleManagement.fixDependencies(allBundles, allBundles[i].versions[n]);
    }
  }

  // Filter the results to match what was requested
  if (isTypeList) {
    for (i = 0, l = allBundles.length; i < l; i++) {
      if (bundleList.listType === LIST_TYPE.RUNNING) {
        if (~activeBundleIds.indexOf(allBundles[i].id)) {
          bundles.push(allBundles[i]);
        }
      } else if (BUNDLE_TO_LIST_TYPE[allBundles[i].versions[0].type] === ids) {
        bundles.push(allBundles[i]);
      }
    }
  } else if (ids.length > 0) {
    for (i = 0, l = allBundles.length; i < l; i++) {
      if (~ids.indexOf(allBundles[i].id)) {
        bundles.push(allBundles[i]);
      }
    }
  } else {
    bundles = allBundles;
  }

  // Add Bundle instances to the bundle list
  for (i = 0, l = bundles.length; i < l; i++) {
    bundleList.add(new Bundle(bundles[i]));
  }

  // The bundles are returned from the bridge in a special order, but we want another order
  //   This default sorting will sort different types of bundles in groups, and alphabetically within that.
  //   If fetching a type list, the list will only contain one type, and will then be sorted only alphabetically.
  bundleList.sort('type', 'asc');

  // We want to store the bundle list, so the API can be smart and auto-update lists and bundles when other things happen.
  this.bundleLists.push(bundleList);

  // Finally, we trigger the callback and pass along the bundle list, and also return the list
  //   This allows the user to either write it with a callback, or normally like a synchronous call.
  //   We also trigger an event if the user prefers that style more.
  callback(bundleList);
  this.notify('getBundlesComplete', { type: 'getBundlesComplete', list: bundleList });
  return bundleList;
};

/**
 * Update bundles that the client knows about.
 *
 * @param {Array}     ids          Specifies which bundles to update.
 * @param {function=} opt_callback Optional. A callback function that will be called when the update is complete (for all specified bundles).
 */
BundleManagement.prototype.update = function(ids, opt_callback) {
  ids = (ids instanceof Array) ? ids : [];

  var self = this;
  var numUpdatesInProgress = ids.length;

  // Only perform an update if there are any bundle IDs passed in
  if (numUpdatesInProgress > 0) {

    // We need to listen to when bundles are installed, and keep track of how many are left.
    //   When all bundles are installed, we want to trigger a callback and an event
    sp.bundles.addEventListener('installComplete', function handler() {
      numUpdatesInProgress--;

      if (numUpdatesInProgress === 0) {
        sp.bundles.removeEventListener('installComplete', handler);

        if (typeof opt_callback === 'function') {
          opt_callback();
        }
        self.notify('updateMultipleComplete', { type: 'updateMultipleComplete', ids: ids });
      }
    });

    // Update each bundle that was passed in
    for (var i = 0; i < ids.length; i++) {
      if (typeof ids[i] === 'string') {
        sp.bundles.update(ids[i], '');
      }
    }
  }
};

/**
 * Remove a bundle that the client knows about.
 *
 * @param {string} id Specifies which bundle to remove.
 */
BundleManagement.prototype.remove = function(id) {
  if (typeof id === 'string') {
    sp.bundles.remove(id);
  }
};

BundleManagement.prototype.observe = Observable.prototype.observe;
BundleManagement.prototype.ignore = Observable.prototype.ignore;
BundleManagement.prototype.notify = Observable.prototype.notify;


/**
 * A list of Bundles.
 * This implements Collection, but has a few additions.
 *
 * Bundle objects will trigger som events, that you can listen to by using `bundle.observe('eventname', function (e) {});`.
 * The events that will be triggered are:
 * `refresh`: When a bundle in the list has been refreshed.
 * `update`: When a bundle in the list has been updated.
 * `bundleQuit`: When a bundle in the list has been fully closed.
 * `sort`: When the list has been sorted.
 *
 * @constructor
 *
 * @property {Array}  data      The actual data list with all bundle data. You should not access this directly, but only through the methods
 *                              on the bundle.
 * @property {Object} observers All added observers for this list. Should not be used directly, but only through the methods on the bundle.
 *
 * @implements {Collection}
 * @implements {Observable}
 */
function BundleList() {
  this.data = [];
  this.observers = {};
}

/**
 * Refresh all bundles in the list.
 * This will get new data for all bundles in the list and send out events (`refresh`).
 * If this is a type list or a full list, it will get all bundles again, update data
 * for existing ones, adding new ones and removing bundles that aren't present anymore.
 */
BundleList.prototype.refresh = function() {
  var allBundles, activeBundles, bundles, i, l, n, len,
      existingBundle, activeVersion, bundleVersion, newIds, bundle, versions, version;

  // If it's a type list or full list, we can refresh the whole list and add/remove bundles
  if (this.isTypeList || this.isFullList) {
    newIds = [];

    // Get data for active bundles
    activeBundles = BundleManagement.getBundlesData('active', true, bundleManagement);
    for (i = 0, l = activeBundles.length; i < l; i++) {
      activeBundles[activeBundles[i].id] = activeBundles[i];
    }

    // Get new data for all bundles
    allBundles = BundleManagement.getBundlesData('all', true, bundleManagement);
    bundles = [];
    if (this.isTypeList) {
      for (i = 0, l = allBundles.length; i < l; i++) {
        if ((this.listType === LIST_TYPE.RUNNING && activeBundles[allBundles[i].id]) ||
            (BUNDLE_TO_LIST_TYPE[allBundles[i].versions[0].type] === this.listType)) {
          bundles.push(allBundles[i]);
        }
      }
    } else {
      bundles = allBundles;
    }

    // Update data in objects
    for (i = 0, l = bundles.length; i < l; i++) {

      // Add active states
      activeVersion = activeBundles[bundles[i].id];
      if (activeVersion) {
        bundles[i].inUse = true;

        // Set flag that the bundle version is in use
        bundleVersion = BundleManagement.getBundleVersion([bundles[i]], activeVersion.id, activeVersion.hash);
        bundleVersion.inUse = true;

        // Add data to dependencies, about what bundles are using the dependency (recursively)
        BundleManagement.addInUseByToInstances(activeVersion);

        // Fix dependency properties
        BundleManagement.fixDependencies(allBundles, activeVersion);
      }

      // Fix dependency properties
      for (n = 0, len = bundles[i].versions.length; n < len; n++) {
        BundleManagement.fixDependencies(allBundles, bundles[i].versions[n]);
      }

      // Refresh bundle if it's found
      existingBundle = this.findById(bundles[i].id);
      if (existingBundle) {

        // If this is not an active version, we don't want to overrite the inUseBy list
        //   that is already on the bundle version, so we add that list to the new data.
        if (!activeVersion) {
          versions = {};
          for (n = 0, len = bundles[i].versions.length; n < len; n++) {
            versions[bundles[i].versions[n].version] = bundles[i].versions[n];
          }
          for (n = 0, len = existingBundle.versions.length; n < len; n++) {
            version = versions[existingBundle.versions[n].version];
            if (version) {
              version.inUseBy = existingBundle.versions[n].inUseBy;
            }
          }
        }

        // Refresh the bundle object with new data
        existingBundle.refresh(bundles[i], allBundles, activeBundles);

      // Add bundle if it's not found
      } else {
        bundle = new Bundle(bundles[i]);
        this.add(bundle);
        this.sort(this.order, this.direction);
        this.notify('refresh', { type: 'refresh', kind: 'add', bundle: bundle });
      }
      newIds.push(bundles[i].id);
    }

    // Remove bundles that aren't present anymore
    for (i = 0, l = this.data.length; i < l; i++) {
      if (!~newIds.indexOf(this.data[i].id)) {
        this.remove(i);
        i--; l--;
      }
    }

  // If it's a custom list, we only refresh the bundles that are actually in the list
  } else {
    for (i = 0, l = this.data.length; i < l; i++) {
      this.data[i].refresh();
    }
  }
};

/**
 * Remove references to the bundle list.
 * When a list is created, it is added to a global array of lists that the API uses to
 * update data of lists and objects automatically.
 * If a list is not used anymore, you can call this method to remove it from the global
 * array of lists, so it will not be looped through each time new data comes.
 * It will also reset the data and observers for the list.
 */
BundleList.prototype.destroy = function() {
  var index = bundleManagement.bundleLists.indexOf(this);
  if (~index) {
    bundleManagement.bundleLists.splice(index, 1);
  }
  this.data = [];
  this.observers = {};
};

/**
 * Find a bundle in the list by searching for its ID
 *
 * @param {string} id The bundle identifier.
 *
 * @return {Bundle} The bundle object. If none is found, undefined is returned.
 */
BundleList.prototype.findById = function(id) {
  var bundles, numBundles, i, bundle;
  bundles = this.data;
  numBundles = bundles.length;
  for (i = 0; i < numBundles; i++) {
    if (bundles[i].id === id) {
      bundle = bundles[i];
      break;
    }
  }
  return bundle;
};

/**
 * Sort the list based on different orders and directions.
 * This also sends out events to notify about the change (`sort` and `refresh`).
 *
 * @param {string}    order     Order to use: 'type' | 'alphabetic' | 'raw' (Default: 'type').
 * @param {direction} direction Direction: 'asc' | 'desc' (Default: 'asc').
 */
BundleList.prototype.sort = function(order, direction, onlyGroupDirection) {
  var orders, directions;
  orders = ['type', 'alphabetic', 'raw'];
  directions = ['asc', 'desc'];

  // Parse out passed in parameters
  order = ~orders.indexOf(order) ? order : 'type';
  direction = ~directions.indexOf(direction) ? direction : 'asc';
  onlyGroupDirection = !!onlyGroupDirection;

  // Set new sorting values so other parts of the API can use that
  this.order = order;
  this.direction = direction;

  // Perform the actual sorting
  BundleList.sortingFunctions[order](this.data, direction, onlyGroupDirection);
  if (direction === 'desc') {
    this.data.reverse();
  }

  // Notify the world about the sort
  this.notify('sort', { type: 'sort', kind: 'sort' });
  this.notify('refresh', { type: 'refresh', kind: 'sort' });
};

/**
 * Definitions for different sorting functions.
 *
 * @ignore
 */
BundleList.sortingFunctions = {
  type: function(data, direction, onlyGroupDirection) {

    var doReverse = direction === 'desc' && onlyGroupDirection;

    // Sort alphabetically by the name
    data.sort(function(a, b) {
      var aName = a.name.toLowerCase(), bName = b.name.toLowerCase();
      return [aName, bName].sort()[0] === aName ? (doReverse ? 1 : -1) : (doReverse ? -1 : 1);
    });

    // Sort by the type of bundle
    data.sort(function(a, b) {
      var aApp = a.type === BUNDLE_TYPE_PUBLIC[BUNDLE_TYPE.APP],
          bApp = b.type === BUNDLE_TYPE_PUBLIC[BUNDLE_TYPE.APP],
          isDifferent = aApp && !bApp,
          bothApp = aApp && bApp;

      if (aApp && !bApp) {
        return -1;
      } else if (!aApp && bApp) {
        return 1;
      } else {

        var aName = a.name.toLowerCase(), bName = b.name.toLowerCase();
        return [aName, bName].sort()[0] === aName ? (doReverse ? 1 : -1) : (doReverse ? -1 : 1);
      }
    });

    return data;
  },
  alphabetic: function(data) {

    data.sort(function(a, b) {
      var aName = a.name.toLowerCase(), bName = b.name.toLowerCase();
      return [aName, bName].sort()[0] === aName ? -1 : 1;
    });

    return data;
  },
  raw: function(data) {
    return data;
  }
};

BundleList.prototype.add = Collection.prototype.add;
BundleList.prototype.remove = Collection.prototype.remove;
BundleList.prototype.get = Collection.prototype.get;
BundleList.prototype.getRange = Collection.prototype.getRange;
BundleList.prototype.indexOf = Collection.prototype.indexOf;
BundleList.prototype.clear = Collection.prototype.clear;

Object.defineProperty(BundleList.prototype, 'length', {
  get: function() {
    return this.data.length;
  }
});

BundleList.prototype.observe = Observable.prototype.observe;
BundleList.prototype.ignore = Observable.prototype.ignore;
BundleList.prototype.notify = Observable.prototype.notify;


/**
 * Object representing one bundle.
 *
 * Bundle objects will trigger some events, that you can listen to by using `bundle.observe('eventname', function (e) {})`;
 * The events that will be triggered are:
 * `refresh`: When the bundle has been refreshed with new or changed data.
 * `update`: When the bundle has been updated to a new version (all the data is then refreshed as well).
 * `quit`: When the bundle has been fully closed.
 * `remove`: When the bundle has been removed from storage.
 * `deactivate`: When the bundle has been deactivated and put in rest state for about a minute before it closes for real and triggers a `quit` event.
 *
 * @constructor
 *
 * @property {string}  id            Bundle identifier.
 * @property {string}  name          Bundle name.
 * @property {string}  type          Type of the bundle. Can be either 'app' or 'framework'.
 * @property {boolean} inUse         Tells whether the bundle is in use at the moment. Setting this will launch/quit the app.
 * @property {string}  updateStatus  The update status of the bundle. Possible values: 'on-disk' | 'updating'
 * @property {string}  latestVersion Quick access to the latest version in the version list. It's an instance of BundleVersion.
 * @property {Array}   versions      Array of all the versions the client knows about. Each array item is an instance of BundleVersion.
 * @property {string}  uri           The app URI.
 *
 * @implements {Observable}
 */
function Bundle(data) {
  this.observers = {};

  // Set up data
  this.data = {};
  this.data.id = data.id;
  this.data.type = data.versions[0].type;
  this.data.updateStatus = 'on-disk';
  this.data.inUse = data.inUse;

  this.versions = [];
  for (var i = 0, l = data.versions.length; i < l; i++) {
    this.versions.push(new BundleVersion(data.versions[i]));
  }

  this.versions.sort(function(a, b) {
    return semver.rcompare(a.data.version, b.data.version);
  });
}

/**
 * Get a bundle version object from a version number.
 *
 * @param {string} hash Version hash string.
 *
 * @return {BundleVersion} Bundle version object, or false if not found.
 */
Bundle.prototype.getVersion = function(hash) {
  for (var i = 0, l = this.versions.length; i < l; i++) {
    if (this.versions[i].hash === hash) {
      return this.versions[i];
    }
  }
  return false;
};

/**
 * Update the bundle to the latest version.
 * Prior to the update, it will update the property updateStatus and
 * send out `refresh` events to both bundle and list.
 *
 * When the update process is done, the objects will be automatically updated
 * with new data, and events will be sent out (`refresh` or `update`) to both this bundle and its
 * dependencies, and also its lists.
 */
Bundle.prototype.update = function() {

  // Set the update status and broadcast the change
  var objects, i, l;
  objects = BundleManagement.getBundleObjects(this.id);
  for (i = 0, l = objects.bundles.length; i < l; i++) {
    objects.bundles[i].updateStatus = 'updating';
    objects.bundles[i].notify('refresh', { type: 'refresh', kind: 'refresh' });
  }
  for (i = 0, l = objects.lists.length; i < l; i++) {
    objects.lists[i].notify('refresh', { type: 'refresh', kind: 'refresh' });
  }

  // Perform the update
  sp.bundles.update(this.id, '');
};

/**
 * Refresh the data for the bundle.
 * A `refresh` event is sent out when it's done.
 *
 * @param {Object=} opt_data Data to refresh the object with. If not provided, it will get new from the client.
 */
Bundle.prototype.refresh = function(opt_data, allBundles, activeBundles) {
  var versionNumbers, allBundles, activeBundles, i, l, activeVersion, bundleVersion, version;
  versionNumbers = [];

  // Get data for active bundles
  allBundles = allBundles || BundleManagement.getBundlesData('all', true, bundleManagement);
  activeBundles = activeBundles || BundleManagement.getBundlesData('active', true, bundleManagement);
  for (i = 0, l = activeBundles.length; i < l; i++) {
    activeBundles[activeBundles[i].id] = activeBundles[i];
  }
  activeVersion = activeBundles[this.id];

  // Get new data for this bundle id
  var data = opt_data;
  if (data === undefined) {
    for (i = 0, l = allBundles.length; i < l; i++) {
      if (allBundles[i].id === this.id) {
        data = allBundles[i];
        break;
      }
    }

    // Add active states
    if (activeVersion) {

      // Set flag that the bundle version is in use
      bundleVersion = BundleManagement.getBundleVersion([data], activeVersion.id, activeVersion.hash);
      bundleVersion.inUse = true;

      // Add data to dependencies, about what bundles are using the dependency (recursively)
      BundleManagement.addInUseBy(allBundles, activeVersion);

      // Fix dependency properties
      BundleManagement.fixDependencies(allBundles, activeVersion);
    }

    // Fix dependency properties
    for (i = 0, l = data.versions.length; i < l; i++) {
      BundleManagement.fixDependencies(allBundles, data.versions[i]);
    }
  }

  if (data !== undefined) {

    // Set flag if the bundle is in use
    if (activeVersion) {
      this.data.inUse = true;
    }

    // Update version data with new data
    for (i = 0, l = data.versions.length; i < l; i++) {
      version = this.getVersion(data.versions[i].hash);
      if (version) {
        version.updateData(data.versions[i]);
      } else {
        this.versions.push(new BundleVersion(data.versions[i]));
      }
      versionNumbers.push(data.versions[i].version);
    }

    // Remove any version that is no longer present
    for (i = 0, l = this.versions.length; i < l; i++) {
      if (!~versionNumbers.indexOf(this.versions[i].version)) {
        this.versions.splice(i, 1);
        i--; l--;
      }
    }

  }

  // Notify the bundle about the changes
  this.notify('refresh', { type: 'refresh', kind: 'refresh' });
};

/**
 * Remove the bundle from storage. This will make the app reinstall when
 * it's loaded the next time.
 * Before removing, it will force quit the bundle if it's already running.
 * After removing from storage, it will also remove the bundle from its lists,
 * and send out events (`remove` and `refresh` for bundle and `refresh` for lists).
 *
 * If the bundle is removed, the bundle object will get the property isRemoved set to true.
 *
 * @return {boolean} True if the bundle was actually removed.
 */
Bundle.prototype.remove = function() {
  var wasRemoved, lists, bundles, i, l, list, n, len, listsToRefresh, bundle;

  if (this.versions[0].origin === 'remote') {

    this.quit(true);

    wasRemoved = sp.bundles.remove(this.id);
    wasRemoved = wasRemoved === undefined ? true : wasRemoved;

    if (wasRemoved) {

      // Notify all instances of this bundle id
      bundles = BundleManagement.getBundleObjects(this.id).bundles;
      for (i = 0, l = bundles.length; i < l; i++) {
        bundles[i].isRemoved = true;
        bundles[i].notify('remove', { type: 'remove', kind: 'remove' });
        bundles[i].notify('refresh', { type: 'refresh', kind: 'remove' });
      }

      // Get all lists that this bundle is part of
      listsToRefresh = [];
      lists = BundleManagement.getBundleObjects(this.id).lists;
      for (i = 0, l = lists.length; i < l; i++) {
        list = lists[i];
        bundle = list.findById(this.id);
        if (bundle) {
          list.remove(bundle);
          listsToRefresh.push(list);
        }
      }

      // Notify the lists of the changes
      if (listsToRefresh.length > 0) {
        for (i = 0, l = listsToRefresh.length; i < l; i++) {
          listsToRefresh[i].notify('refresh', { type: 'refresh', kind: 'remove' });
        }
      }

    }
  }

  return !!wasRemoved;
};

/**
 * Launch the bundle.
 * This only works for apps. Frameworks can only be loaded when apps are loaded.
 */
Bundle.prototype.launch = function() {
  window.location = this.uri;
};

/**
 * Quit the bundle.
 * This only works for apps. Frameworks will be unloaded when no app is using it anymore.
 * If the app is set to soft quit (`doForce !== true`), the bundle property `inactive` will
 * be set to `true` until the app is closed for real. The event `deactivate` will also be sent.
 *
 * @param {boolean} doForce Force quit the app. If false, the app will stay in the background for a short time to let the app save state and such.
 *                          Default is false.
 */
Bundle.prototype.quit = function(doForce) {
  var timeout, bundles, i, l, bundle;
  doForce = !!doForce;

  // Only try to quit the bundle if it's in use
  if (this.inUse) {
    timeout = sp.bundles.quit(this.id, doForce);

    // We need to update all bundle objects, so everything is up to date
    bundles = BundleManagement.getBundleObjects(this.id).bundles;
    for (i = 0, l = bundles.length; i < l; i++) {
      bundle = bundles[i];

      // If we should not force quit it, set a timer to update the bundle object after a certain amount of time
      if (!doForce) {
        bundle.inactive = true;
        bundle.notify('deactivate', { type: 'deactivate', kind: 'deactivate', timeout: timeout });
        setTimeout((function(bundleObj) { return function() {
          bundleObj.inactive = false;
          BundleManagement.quitBundleObject(bundleObj);
        }; }(bundle)), timeout);

      // If we should force quit it, update the bundle object immediately.
      } else {
        BundleManagement.quitBundleObject(bundle);
      }
    }
  }
};

Bundle.prototype.observe = Observable.prototype.observe;
Bundle.prototype.ignore = Observable.prototype.ignore;
Bundle.prototype.notify = Observable.prototype.notify;

Object.defineProperties(Bundle.prototype, {
  id: {
    get: function() {
      return this.data.id;
    }
  },
  name: {
    get: function() {
      return this.versions[0].name;
    }
  },
  type: {
    get: function() {
      return BUNDLE_TYPE_PUBLIC[this.data.type];
    }
  },
  inUse: {
    get: function() {
      if (this.data.inUse === undefined) {
        this.data.inUse = false;
        for (var i = 0, l = this.versions.length; i < l; i++) {
          if (this.versions[i].inUse) {
            this.data.inUse = true;
          }
        }
      }
      return this.data.inUse;
    },
    set: function(value) {
      value = !!value;

      if (this.data.type === BUNDLE_TYPE.APP) {
        if (this.inUse && !value) {
          this.quit();
        } else if (!this.inUse && value) {
          this.launch();
        }
      }
      this.data.inUse = value;
    }
  },
  updateStatus: {
    get: function() {
      return this.data.updateStatus;
    }
  },
  latestVersion: {
    get: function() {
      return this.versions[0];
    }
  },
  uri: {
    get: function() {
      return 'spotify:app:' + this.data.id;
    }
  }
});


/**
 * Object representing a bundle version.
 *
 * Bundle version objects will trigger some events, that you can listen to by using `version.observe('eventname', function (e) {})`;
 * The events that will be triggered are:
 * `refresh`: When the bundle version has been refreshed with new or changed data.
 *
 * @constructor
 *
 * @property {string}  id           Bundle identifier.
 * @property {string}  name         Bundle name.
 * @property {string}  image        Bundle icon URL.
 * @property {string}  description  Short description of the bundle.
 * @property {string}  type         Type of the bundle. Can be either 'app' or 'framework'.
 * @property {boolean} inUse        Tells whether the bundle is in use at the moment.
 * @property {Array}   inUseBy      List of bundles that is using this bundle. Each item is an object with properties `id`, `name` and `version`.
 * @property {Array}   dependencies List of dependencies for this bundle. Each item is an object with properties `id` and `minimumVersion`.
 *                                  Running bundles will also have properties `name` and `currentVersion`.
 * @property {string}  origin       Origin of the bundle. 'local - /path/to/bundle' | 'bundled' | 'remote'. Bundles are fetched from three different
 *                                  places: Local Spotify folder, bundled with the Spotify application, or downloaded remotely from the app store.
 * @property {string}  version      Version number.
 * @property {string}  manifest     Manifest file, JSON data formatted with multiple lines and indentation of four spaces.
 * @property {number}  cacheTimeout Number of milliseconds until the cache is no longer valid.
 * @property {string}  tag          A tag for the version. Will be the git revision if available, otherwise an empty string.
 *
 * @implements {Observable}
 */
function BundleVersion(data) {
  this.observers = {};

  // Fix the manifest string to be pretty-printed
  var manifest = data.manifest || '{}';
  delete data.manifest;
  data.manifest = JSON.stringify(JSON.parse(manifest.decodeForText()), null, 4);

  // Add the data
  this.data = data;
}

/**
 * Updates the version data.
 * Used internally.
 *
 * @ignore
 */
BundleVersion.prototype.updateData = function(data) {

  // Fix the manifest string to be pretty-printed
  var manifest = data.manifest || '{}';
  delete data.manifest;
  data.manifest = JSON.stringify(JSON.parse(manifest.decodeForText()), null, 4);

  // Add the data
  this.data = data;

  // Tell the world
  this.notify('refresh', { type: 'refresh', kind: 'refresh' });
};

/**
 * Launch the bundle.
 * This only works for apps. Frameworks can only be loaded when apps are loaded.
 */
BundleVersion.prototype.launch = function() {
  window.location = this.uri;
};

BundleVersion.prototype.observe = Observable.prototype.observe;
BundleVersion.prototype.ignore = Observable.prototype.ignore;
BundleVersion.prototype.notify = Observable.prototype.notify;

Object.defineProperties(BundleVersion.prototype, {
  id: {
    get: function() {
      return this.data.id;
    }
  },
  hash: {
    get: function() {
      return this.data.hash;
    }
  },
  name: {
    get: function() {
      return this.data.name;
    }
  },
  image: {
    get: function() {
      return this.data.image;
    }
  },
  description: {
    get: function() {
      return this.data.description;
    }
  },
  type: {
    get: function() {
      return BUNDLE_TYPE_PUBLIC[this.data.type];
    }
  },
  inUse: {
    get: function() {
      return this.data.inUse;
    }
  },
  inUseBy: {
    get: function() {
      return this.data.inUseBy;
    }
  },
  bridgeDependencies: {
    get: function() {
      return this.data.bridgeDependencies;
    }
  },
  dependencies: {
    get: function() {
      return this.data.dependencies;
    }
  },
  origin: {
    get: function() {
      return this.data.origin;
    }
  },
  version: {
    get: function() {
      return this.data.version;
    }
  },
  manifest: {
    get: function() {
      return this.data.manifest;
    }
  },
  cacheTimeout: {
    get: function() {
      return this.data.cacheTimeout;
    }
  },
  tag: {
    get: function() {
      return this.data.tag;
    }
  },
  uri: {
    get: function() {
      return 'spotify:app:' + this.data.id + '@' + this.data.version;
    }
  }
});







// INTERNAL HELPERS
// Below are helper functions that are used internally in this API, but are not supposed
// to be used outside. They live on the BundleManagement object, but only an instance will
// be exported so these functions are not available outside of this file.





/**
 * Get the name of all dependency list properties on a BundleManagement object.
 *
 * @ignore
 */
BundleManagement._getDependencyListIds = function() {
  return ['dependencies', 'bridgeDependencies'];
};

/**
 * Get new bundles data from the bridge layer.
 * Using a cache to not call the bridge to often.
 *
 * @param {string}           type     Type of data to get. 'all' or 'active'.
 * @param {boolean}          forceNew Whether to force it to be a bridge call or not.
 * @param {BundleManagement} instance Instance of the API.
 *
 * @ignore
 */
BundleManagement.getBundlesData = function(type, forceNew, instance) {
  var time, cache;

  time = (new Date()).getTime();
  cache = instance.cache;

  if (type === 'all') {
    if (forceNew || time - cache.lastUpdateAll > cache.ttl) {
      cache.allBundles = sp.bundles.all;
      cache.lastUpdateAll = time;
    }
    return cache.allBundles;
  } else if (type === 'active') {
    if (forceNew || time - cache.lastUpdateActive > cache.ttl) {
      cache.activeBundles = sp.bundles.active;
      cache.lastUpdateActive = time;
    }
    return cache.activeBundles;
  }
};

/**
 * Get data object for a bundle version.
 * Used internally when bundles are fetched in BundleManagement.get.
 *
 * @param {Array}  bundles Array of all installed bundles.
 * @param {string} id      Bundle identifier.
 * @param {string} hash    Bundle version hash.
 *
 * @return {Object|boolean} Version object, or false if not found.
 *
 * @ignore
 */
BundleManagement.getBundleVersion = function(bundles, id, hash) {
  var a, b, la, lb, bundle, bundleVersion;
  for (a = 0, la = bundles.length; a < la; a++) {
    bundle = bundles[a];
    if (bundle.id === id) {
      for (b = 0, lb = bundle.versions.length; b < lb; b++) {
        bundleVersion = bundle.versions[b];
        if (bundleVersion.hash === hash) {
          return bundleVersion;
        }
      }
      break;
    }
  }
  return false;
};

/**
 * Helper method to addInUseBy that runs the logic for the requested dependency list.
 *
 * @param {Array}  bundles Array of all installed bundles.
 * @param {Object} version Version object from sp.bundles.active.
 * @param {string} depPropertyName Name of dependency property to use as source.
 *
 * @ignore
 */
BundleManagement._addInUseByHelper = function(bundles, version, depPropertyName) {
  if (!version[depPropertyName]) {
    return;
  }

  var i, l, activeDep, dep, n, len, versionFound;
  for (i = 0, l = version[depPropertyName].length; i < l; i++) {
    activeDep = version[depPropertyName][i].bundle;
    if (activeDep) {
      dep = BundleManagement.getBundleVersion(bundles, activeDep.id, activeDep.hash);
      if (dep) {
        if (!dep.inUseBy) {
          dep.inUseBy = [];
        }
        for (n = 0, len = dep.inUseBy.length; n < len; n++) {
          if (dep.inUseBy[n].id === version.id && dep.inUseBy[n].version === version.version) {
            versionFound = true;
            break;
          }
        }
        if (!versionFound) {
          dep.inUseBy.push({
            id: version.id,
            name: version.name,
            type: BUNDLE_TYPE_PUBLIC[version.type],
            version: version.version
          });
          dep.inUse = true;
        }

        // Run it recursively for all sub-dependencies
        if (activeDep) {
          BundleManagement.addInUseBy(bundles, activeDep);
        }
      }
    }
  }
};

/**
 * Set up the connections between bundles.
 * Frameworks should have an inUseBy property to know which bundles are using the framework.
 *
 * @param {Array}  bundles Array of all installed bundles.
 * @param {Object} version Version object from sp.bundles.active.
 *
 * @ignore
 */
BundleManagement.addInUseBy = function(bundles, version) {
  var depListNames = BundleManagement._getDependencyListIds();
  for (var i in depListNames) {
    BundleManagement._addInUseByHelper(bundles, version, depListNames[i]);
  }
};

/**
 * Helper method to addInUseByToInstances that runs the logic for the requested dependency list.
 *
 * @param {Object} activeVersion Version object from sp.bundles.active.
 * @param {string} depPropertyName Name of dependency property to use as source.
 *
 * @ignore
 */
BundleManagement._addInUseByToInstancesHelper = function(activeVersion, depPropertyName) {
  if (activeVersion.depPropertyName === undefined) {
    return;
  }

  var a, b, c, d, la, lb, lc, ld, dep, bundles, bundle, version, versionFound;

  for (a = 0, la = activeVersion[depPropertyName].length; a < la; a++) {
    dep = activeVersion[depPropertyName][a];
    bundles = BundleManagement.getBundleObjects(dep.id).bundles;
    for (b = 0, lb = bundles.length; b < lb; b++) {
      bundle = bundles[b];
      for (c = 0, lc = bundle.versions.length; c < lc; c++) {
        version = bundle.versions[c];
        if (version.version === dep.bundle.version) {
          if (version.inUseBy === undefined) {
            version.inUseBy = [];
          }
          for (d = 0, ld = version.inUseBy.length; d < ld; d++) {
            if (version.inUseBy[d].id === activeVersion.id && version.inUseBy[d].version === activeVersion.version) {
              versionFound = true;
              break;
            }
          }
          if (!versionFound) {
            version.inUseBy.push({
              id: activeVersion.id,
              name: activeVersion.name,
              type: BUNDLE_TYPE_PUBLIC[activeVersion.type],
              version: activeVersion.version
            });
            version.data.inUse = true;
          }
        }
      }
    }
  }
};

/**
 * Set up the connections between bundles, on created Bundle instances
 * Frameworks should have an inUseBy property to know which bundles are using the framework.
 *
 * @param {Object} activeVersion Version object from sp.bundles.active.
 *
 * @ignore
 */
BundleManagement.addInUseByToInstances = function(activeVersion) {
  var depListNames = BundleManagement._getDependencyListIds();
  for (var i in depListNames) {
    BundleManagement._addInUseByToInstancesHelper(activeVersion, depListNames[i]);
  }
};

/**
 * Helper method to fixDependencies that runs the logic for the requested dependency list.
 *
 * @param {Array}  bundles Array of all installed bundles.
 * @param {Object} version Version object from either sp.bundles.active or sp.bundles.all.
 * @param {string} depPropertyName Name of dependency property to use as source.
 *
 * @ignore
 */
BundleManagement._fixDependenciesHelper = function(bundles, version, depPropertyName) {
  if (!version[depPropertyName]) {
    return;
  }

  var i, l, bundleVersion, dep, bundle;
  bundleVersion = BundleManagement.getBundleVersion(bundles, version.id, version.hash);
  for (i = 0, l = version[depPropertyName].length; i < l; i++) {
    dep = version[depPropertyName][i];
    bundle = dep.bundle;

    if (bundleVersion) {

      if (!bundleVersion[depPropertyName][i].minimumVersion) {
        bundleVersion[depPropertyName][i] = {
          id: bundle ? bundle.id : dep.id,
          name: bundle ? bundle.name : undefined,
          minimumVersion: dep.version,
          currentVersion: bundle ? bundle.version : undefined
        };
      }
    }

    if (bundle) {
      BundleManagement.fixDependencies(bundles, bundle);
    }
  }
};

/**
 * Fix dependency data.
 * We want more data about dependencies to be present, so this is added here.
 *
 * @param {Array}  bundles Array of all installed bundles.
 * @param {Object} version Version object from either sp.bundles.active or sp.bundles.all.
 *
 * @ignore
 */
BundleManagement.fixDependencies = function(bundles, version) {
  var depListNames = BundleManagement._getDependencyListIds();
  for (var i in depListNames) {
    BundleManagement._fixDependenciesHelper(bundles, version, depListNames[i]);
  }
};

/**
 * Callback for the `installComplete` event.
 * It will update any bundle objects that have been created for the current bundle ID.
 * It will also find the dependencies and update those objects.
 * This method is only used internally, so it will not be available outside of this module.
 *
 * @param {Object} instance An instance of BundleManagement.
 * @param {Object} e        Event object passed in from the bridge.
 *
 * @ignore
 */
BundleManagement.updateComplete = function(instance, e) {
  var objects, bundles, lists, a, la, isUpdated, oldDeps, newDeps,
      oldDepVersions, newDepVersions, newCompleteDeps, newVersionDeps;

  // Get all bundle and list objects for this bundle id
  objects = BundleManagement.getBundleObjects(e.data.id);
  bundles = objects.bundles;
  lists = objects.lists;

  var depListNames = BundleManagement._getDependencyListIds();
  for (var depListName in depListNames) {
    var depPropertyName = depListNames[depListName];

    // Update bundle objects
    for (a = 0, la = bundles.length; a < la; a++) {
      isUpdated = bundles[a].latestVersion.version !== e.data.version;

      oldDeps = oldDeps || bundles[a].versions[0][depPropertyName];
      bundles[a].data = e.data;
      bundles[a].data.updateStatus = 'on-disk';
      newDeps = newDeps || bundles[a].versions[0][depPropertyName];

      if (isUpdated) {
        bundles[a].notify('update', { type: 'update', kind: 'update' });
      } else {
        bundles[a].notify('refresh', { type: 'refresh', kind: 'update' });
      }
    }

    // Notify the lists about changed bundles
    for (a = 0, la = lists.length; a < la; a++) {
      if (isUpdated) {
        lists[a].notify('update', { type: 'update', kind: 'update' });
      } else {
        lists[a].notify('refresh', { type: 'refresh', kind: 'update' });
      }
    }

    // Notify the BundleManagement instance of the update
    instance.notify('updateComplete', { type: 'updateComplete', id: e.data.id });

    // Collect dependency ids
    oldDepVersions = {};
    newDepVersions = {};
    for (a = 0, la = oldDeps.length; a < la; a++) {
      oldDepVersions[oldDeps[a].id] = oldDeps[a].currentVersion;
    }
    for (a = 0, la = newDeps.length; a < la; a++) {
      newDepVersions[newDeps[a].id] = newDeps[a].currentVersion;
    }

    // Check dependency differences
    newCompleteDeps = [];
    newVersionDeps = [];
    for (a = 0, la = newDeps.length; a < la; a++) {
      if (!(newDeps[a].id in oldDepVersions)) {
        newCompleteDeps.push(newDeps[a]);
      } else if (newDeps[a].currentVersion !== oldDepVersions[newDeps[a].id]) {
        newVersionDeps.push(newDeps[a]);
      }
    }

    // Update dependency bundles
    BundleManagement.updateDependencies(newCompleteDeps);
    BundleManagement.updateDependencies(newVersionDeps);
  }
};

/**
 * Helper function for BundleManagement.updateComplete. Only used internally.
 * Loops through the passed in dependency objects and updates/refreshes the right bundles,
 * and also adds them to lists that should contain the bundles, if missing.
 *
 * @param {Array} dependencies Array of all the dependency objects (found in bundle.versions[n].dependencies
 *                             or bundle.verions[n].bridgeDependencies).
 *
 * @ignore
 */
BundleManagement.updateDependencies = function(dependencies) {
  var a, b, c, la, lb, lc, deps, data, dep, list, versionFound, version;

  for (a = 0, la = dependencies.length; a < la; a++) {

    // Get all created bundle objects for this bundle id
    deps = BundleManagement.getBundleObjects(dependencies[a].id);

    // If none were found, add it to all lists that are either framework lists or full lists
    if (deps.bundles.length === 0) {
      BundleManagement.addDependencyToLists(dependencies[a].id);

    // If objects were found, check if the version exists already, and either update or refresh bundle object
    } else {
      for (b = 0, lb = deps.bundles.length; b < lb; b++) {
        dep = deps.bundles[b];
        versionFound = false;
        for (c = 0, lc = dep.versions.length; c < lc; c++) {
          version = dep.versions[c];
          if (version.version === dependencies[a].currentVersion) {
            versionFound = true;
            break;
          }
        }

        if (!versionFound) {
          dep.update();
        } else {
          dep.refresh();
        }
      }
    }
  }
};

/**
 * Used internally in BundleManagement.updateDependencies.
 * It adds a dependency bundle to all appropriate lists that have been created before.
 * Apps can't depend on other apps, so the dependency will always be a framework.
 * That means the bundle can only be added to lists that are type lists of type 'frameworks',
 * or full lists containing all bundles. Custom bundle lists will not be affected.
 *
 * This function is called after an update has happened, so the dependencies might not be
 * installed yet (the event installComplete is sent after the original bundle is updated,
 * but before dependencies are updated). For that reason, this function will try to execute
 * every 500 ms (if the bundle can't be found), but a maximum of 10 times.
 *
 * @param {string}  id           Bundle ID for the dependency.
 * @param {number=} opt_numTries Number of times it has currently tried. Will not be passed the first time it's called.
 *
 * @ignore
 */
BundleManagement.addDependencyToLists = function(id, opt_numTries) {
  var maxTries, interval, bundles, i, l, data, dep, list;

  maxTries = 10;
  interval = 500;

  // Get bundle data object
  bundles = BundleManagement.getBundlesData('all', false, bundleManagement);
  for (i = 0, l = bundles.length; i < l; i++) {
    if (bundles[i].id === this.id) {
      data = bundles[i];
      break;
    }
  }

  // If no data was found for this bundle id, try again
  if (data === undefined) {
    var numTries = opt_numTries;
    numTries = numTries === undefined ? 0 : parseInt(numTries, 10);
    if (numTries < maxTries - 1) {
      numTries = numTries + 1;
      setTimeout(function() {
        BundleManagement.addDependencyToLists(id, numTries);
      }, interval);
    }
    return;
  }

  // Create bundle object and add it to the lists
  dep = new Bundle(data);
  for (i = 0, l = bundleManagement.bundleLists.length; i < l; i++) {
    list = bundleManagement.bundleLists[i];
    if ((list.isTypeList && list.listType === LIST_TYPE.FRAMEWORKS) || list.isFullList) {
      if (list.findById(dep.id) === undefined) {
        list.add(dep);
        list.sort(list.order, list.direction);
        list.notify('refresh', { type: 'refresh', kind: 'add' });
      }
    }
  }
};

/**
 * Get all created Bundle objects and their lists for a specific bundle ID.
 *
 * Bundle objects are created internally when the user calls bundleManagement.get().
 * These objects are put in a BundleList, and the lists are stored inside the API instance.
 * That way, all BundleLists can be reached, and then also all Bundle objects.
 *
 * This is used internally in various places to automatically update data in different
 * objects and send events.
 *
 * @param {string} id Bundle ID to get Bundle objects and BundleLists for.
 *
 * @return {Object} Returns an object with two properties: bundles and lists. These are
 *                  both arrays of Bundles and BundleLists.
 *
 * @ignore
 */
BundleManagement.getBundleObjects = function(id) {
  var lists, list, bundle,
      a, b, la, lb,
      response;

  response = { bundles: [], lists: [] };
  lists = bundleManagement.bundleLists;

  // Loop lists
  for (a = 0, la = lists.length; a < la; a++) {
    list = lists[a];

    // Loop bundles in the list
    for (b = 0, lb = list.length; b < lb; b++) {
      bundle = list.get(b);

      // Add this bundle and parent list if this is the requested bundle
      if (bundle.id === id) {
        response.bundles.push(bundle);
        response.lists.push(list);
      }
    }
  }

  return response;
};

/**
 * Update data of a bundle object that has been told to quit.
 * It also updates the status of dependencies.
 * Used internally by the quit method on Bundle objects.
 *
 * @param {Bundle} bundle Bundle object.
 *
 * @ignore
 */
BundleManagement.quitBundleObject = function(bundle) {

  var a, b, la, lb, version;

  // Update the status of the bundle
  bundle.data.inUse = false;

  // Loop versions of this bundle and update the status
  for (a = 0, la = bundle.versions.length; a < la; a++) {
    version = bundle.versions[a];
    if (version.data.inUse) {
      version.data.inUse = false;

      var depListNames = BundleManagement._getDependencyListIds();
      for (var depListName in depListNames) {
        var depPropertyName = depListNames[depListName];
        for (b = 0, lb = version[depPropertyName].length; b < lb; b++) {
          version[depPropertyName][b].name = undefined;
          version[depPropertyName][b].currentVersion = undefined;
        }
      }
    }
  }

  // Tell the world about these changes
  bundle.notify('quit', { type: 'quit', kind: 'quit' });
  bundle.notify('refresh', { type: 'refresh', kind: 'quit' });

  // Loop versions of this bundle and refresh dependencies with changed data
  for (a = 0, la = bundle.versions.length; a < la; a++) {
    version = bundle.versions[a];

    // Loop dependencies for this version
    BundleManagement.updateDependencyStatuses(version, bundle);
  }

};

/**
 * Helper method to updateDependencyStatuses that runs the logic for the requested dependency list.
 *
 * @param {Object} version    Version object, instance of BundleVersion (bundle.versions[n]).
 * @param {Bundle} rootBundle Bundle object that was quit, or the dependency object when calling recursively.
 * @param {string} depPropertyName Name of dependency property to use as source.
 *
 * @ignore
 */
BundleManagement._updateDependencyStatusesHelper = function(version, rootBundle, depPropertyName) {
  if (!version[depPropertyName]) {
    return;
  }

  // Iterator vars
  var a, b, c, d, la, lb, lc, ld;
  var objects, dep, numDepInUseVersions, depVersion, bundle, list;

  // Only loop if there are dependencies
  if (version[depPropertyName] && version[depPropertyName].length > 0) {

    for (a = 0, la = version[depPropertyName].length; a < la; a++) {
      objects = BundleManagement.getBundleObjects(version[depPropertyName][a].id);

      // Loop dependency objects for this dependency bundle id
      for (b = 0, lb = objects.bundles.length; b < lb; b++) {
        dep = objects.bundles[b];

        // Loop dependency versions
        numDepInUseVersions = 0;
        for (c = 0, lc = dep.versions.length; c < lc; c++) {
          depVersion = dep.versions[c];
          if (depVersion.inUse) {
            numDepInUseVersions++;
          }

          // Loop all bundles that are using this dependency version
          if (depVersion.inUseBy && depVersion.inUseBy.length > 0) {
            for (d = 0, ld = depVersion.inUseBy.length; d < ld; d++) {
              bundle = depVersion.inUseBy[d];

              // Remove the bundle from the dependency and trigger events
              if (bundle.id === rootBundle.id) {
                depVersion.inUseBy.splice(d, 1); d--; ld--;
                if (ld === 0) {
                  depVersion.data.inUse = false;
                  numDepInUseVersions--;
                  if (numDepInUseVersions === 0) {
                    dep.data.inUse = false;
                    BundleManagement.updateDependencyStatuses(depVersion, dep);
                  }
                }
                dep.notify('refresh', { type: 'refresh', kind: 'change' });
              }

            }
          }

        }

      }
    }

    // Loop list wrappers for this dependency bundle and trigger events
    for (b = 0, lb = objects.lists.length; b < lb; b++) {
      list = objects.lists[b];
      list.notify('bundleQuit', { type: 'bundleQuit', kind: 'bundleQuit' });
      list.notify('refresh', { type: 'refresh', kind: 'bundleQuit' });
    }
  }
};

/**
 * Loops through all dependencies and updates inUseBy and status.
 * This method is called from BundleManagement.quitBundleObject, so the task
 * for this method is to remove the bundle from inUseBy of dependencies,
 * and also update the status of that version if it was the last item in inUseBy.
 *
 * It will notify both the bundle objects and the lists they are in, about the changes.
 *
 * @param {Object} version    Version object, instance of BundleVersion (bundle.versions[n]).
 * @param {Bundle} rootBundle Bundle object that was quit, or the dependency object when calling recursively.
 *
 * @ignore
 */
BundleManagement.updateDependencyStatuses = function(version, rootBundle) {
  var depListNames = BundleManagement._getDependencyListIds();
  for (var i in depListNames) {
    BundleManagement._updateDependencyStatusesHelper(version, rootBundle, depListNames[i]);
  }
};


// Create a new instance of the API and export everything
//   Bundle and BundleList are mostly exported so the user can do checks like `bundle instanceof Bundle`
bundleManagement = new BundleManagement();
exports.bundleManagement = bundleManagement;
exports.Bundle = Bundle;
exports.BundleList = BundleList;
