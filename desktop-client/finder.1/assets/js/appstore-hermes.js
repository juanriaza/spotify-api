'use strict';
var hermesScheme = sp.require('assets/js/appstore-proto'),
    storage = sp.require('$util/storage');

var bridge = {
  bundle: (function() {
    var allBundles = sp.bundles.all;
    for (var i = 0, l = allBundles.length; i < l; ++i) {
      var bundle = allBundles[i];
      if (bundle.id.match(/^bridge-.*/)) {
        return bundle;
      }
    }
    throw new Error('No bridge bundle found (your client is broken)!');
  })(),

  id: function() {
    return bridge.bundle.id;
  },

  version: function() {
    var versionString = bridge.bundle.versions[0].version;
    var components = versionString.split('.');
    return {
      major: parseInt(components[0], 10),
      minor: parseInt(components[1], 10),
      patch: parseInt(components[2], 10)
    };
  }
};

var storeCom = {
  /**
   * Private variables
   */
  postObj: {
    market: sp.core.country,
    platform: 0,
    bridge_identifier: bridge.id(),
    bridge_version: bridge.version()
  },
  market: sp.core.country,
  /**
   * Cache info
   */
  now: new Date().getTime(),
  cacheTimeout: 3600000, // 1 hour

  cacheBannerConfig: function(donecallback, failcallback) {
    sp.core.getHermes('GET', 'hm://appstore/1.0/banners/finder',
        [
         ['RequestHeader', storeCom.postObj]
        ],
        {
          onSuccess: function() {
            var BannerConfig = sp.core.parseHermesReply('BannerConfig', arguments[0]);
            storage.set('appstore_bannerconfig', JSON.parse(BannerConfig.json[0].decodeForText()));
            donecallback();
          },
          onFailure: function(fail) {
            failcallback();
          },
          onComplete: function() {
          }
        }
    );
  },

  cacheNamedList: function(listName, donecallback, failcallback) {
    sp.core.getHermes(
        'GET',
        'hm://appstore/1.0/list/' + listName + '/' + storeCom.market,
        [
         ['RequestHeader', storeCom.postObj]
        ],
        {
          onSuccess: function() {
            var appList = sp.core.parseHermesReply(
                'IdentifierList',
                arguments[0]);
            donecallback(appList.identifiers);
          },
          onFailure: function(fail) {
            failcallback();
          },
          onComplete: function() {}
        });
  },


  cacheAppDetails: function(donecallback, failcallback) {
    var appDataObj = { items: [] };
    var requestArray = [['RequestHeader', storeCom.postObj]];
    var applist = storage.get('appstore_applist');
    for (var i = 0; i < applist.length; i++) {
      requestArray.push(applist[i]);
    }
    sp.core.getHermes('GET', 'hm://appstore/1.0/apps_details/',
        requestArray,
        {
          onSuccess: function() {
            var resultlist = sp.core.parseHermesReply(
                'AppList',
                arguments[0]);
            var appData = {};
            for (var i = 0; i < resultlist.items.length; i++) {
              var app = resultlist.items[i];
              appData[app.app_name] = app;
            }
            storage.set('appstore_appdata', appData);
            donecallback();
          },
          onFailure: function(fail) {
            failcallback();
          },
          onComplete: function() {}
        });
  },

  cacheCategories: function(donecallback, failcallback) {
    sp.core.getHermes(
        'GET',
        'hm://appstore/1.0/categories/',
        [['RequestHeader', storeCom.postObj]],
        {
          onSuccess: function() {
            var categoryList = sp.core.parseHermesReply(
                'IdentifierList',
                arguments[0]);
            storage.set('appstore_categories', categoryList.identifiers);
            donecallback();
          },
          onFailure: function(fail) {
            failcallback();
          },
          onComplete: function() { }
        });
  },

  /**
   * Ensure that we have the applist AND all it's apps details cached.
   * @param {Function} callback "App data is ready"-callback.
   */
  cacheAppList: function(donecallback, failcallback) {
    sp.core.getHermes('GET', 'hm://appstore/1.0/apps/',
        [['RequestHeader', storeCom.postObj]],
        {
          onSuccess: function() {
            var appList = sp.core.parseHermesReply(
                'IdentifierList',
                arguments[0]);
            storage.set('appstore_applist', appList.identifiers);
            donecallback();
          },
          onFailure: function(fail) {
            failcallback();
          },
          onComplete: function() {
          }
        });
  },

  cacheNewReleases: function(donecallback, failcallback) {
    storeCom.cacheNamedList('new_releases', function(data) {
      storage.set('appstore_newreleases', data);
      donecallback();
    }, failcallback);
  },

  _ensureLoaders: 0,
  _ensureCallbacks: [],

  ensureCache: function(callback) {
    storeCom._ensureCallbacks.push(callback);

    if (storeCom._ensureLoaders > 0) {
      // already loading something, keep waiting...
      return;
    }

    var callAllCallbacks = function() {
      while (storeCom._ensureCallbacks.length > 0) {
        var callback = storeCom._ensureCallbacks.splice(0, 1);
        callback[0]();
      }
      storeCom._ensureCallbacks = [];
      storeCom._ensureLoaders = 0;
    };

    var cached_ts = storage.get('appstore_timestamp');
    if (cached_ts && (cached_ts + storeCom.cacheTimeout) > storeCom.now) {
      var applist = storage.get('appstore_applist');
      var appdata = storage.get('appstore_appdata');
      if (applist && appdata) {
        callAllCallbacks();
        return;
      }
    }

    storeCom._ensureLoaders = 1;

    var saveTimestampAndCallAllCallbacks = function() {
      storage.set('appstore_timestamp', storeCom.now);
      callAllCallbacks();
    };

    var silentlyFail = function() {
      callAllCallbacks();
    };

    storeCom.cacheAppList(function() {
      storeCom.cacheAppDetails(function() {
        saveTimestampAndCallAllCallbacks();
      }, silentlyFail);
    }, silentlyFail);
  },

  _ensureLoaders2: 0,
  _ensureCallbacks2: [],

  ensureCache2: function(callback) {

    storeCom._ensureCallbacks2.push(callback);

    if (storeCom._ensureLoaders2 > 0) {
      // already loading something, keep waiting...
      return;
    }

    var callAllCallbacks2 = function() {
      while (storeCom._ensureCallbacks2.length > 0) {
        var callback = storeCom._ensureCallbacks2.splice(0, 1);
        callback[0]();
      }
      storeCom._ensureCallbacks2 = [];
      storeCom._ensureLoaders2 = 0;
    };

    var cached_ts2 = storage.get('appstore_timestamp2');
    if (cached_ts2 && (cached_ts2 + storeCom.cacheTimeout) > storeCom.now) {
      var newreleases = storage.get('appstore_newreleases');
      var categories = storage.get('appstore_categories');
      var bannerConfig = storage.get('appstore_bannerconfig');
      if (newreleases && categories && bannerConfig) {
        callAllCallbacks2();
        return;
      }
    }

    storeCom._ensureLoaders2 = 1;

    var saveTimestampAndCallAllCallbacks2 = function() {
      // set both timestamps.
      storage.set('appstore_timestamp', storeCom.now);
      storage.set('appstore_timestamp2', storeCom.now);
      callAllCallbacks2();
    };

    var silentlyFail2 = function() {
      callAllCallbacks2();
    };

    // dependency on first cache.
    storeCom.ensureCache(function() {
      // then get the rest....
      storeCom.cacheBannerConfig(function() {
        storeCom.cacheCategories(function() {
          storeCom.cacheNewReleases(function() {
            saveTimestampAndCallAllCallbacks2();
          }, silentlyFail2);
        }, silentlyFail2);
      }, silentlyFail2);
    });
  },

  /**
   * Fetches a list of available app indentifiers
   * @param {Function} callback Hermes callback with an object
   *   contaning an array of app identifiers.
   */
  getAppList: function(callback) {
    storeCom.ensureCache(function() {
      var applist = storage.get('appstore_applist');
      callback(applist);
    });
  },

  /**
   * Fetches multiple app data
   * @param {Array} appIdentifiers App identifiers.
   * @param {Function} callback callback contaning an array of app identifiers.
   */
  getAppData: function(appIdentifiers, callback) {
    storeCom.ensureCache(function() {
      var cachedAppData = storage.get('appstore_appdata');
      var appDataObj = { items: [] };
      for (var i = 0; i < appIdentifiers.length; i++) {
        var appData = cachedAppData[appIdentifiers[i]];
        if (appData && (storeCom.allowSystemApps || appData.requirement == 3)) {
          appDataObj.items.push(appData);
        }
      }
      callback(appDataObj, true);
    });
  },

  /**
  * Fetches a list of available app categories
  * @param {Function} callback callback contaning an array of app categories.
  */
  getAppCategories: function(callback) {
    storeCom.ensureCache2(function() {
      var categories = storage.get('appstore_categories');
      callback(categories);
    });
  },

  /**
   * Fetches a list of new releases
   * @param {Function} callback Hermes callback contaning
   *   an array of app identifiers.
   */
  getNewReleases: function(callback) {
    storeCom.ensureCache2(function() {
      var new_releases = storage.get('appstore_newreleases');
      callback(new_releases);
    });
  },

  /**
   * Fetches a the banner config file from appstore
   * @param {Function} callback Hermes callback containing
   *   the banner config data.
   */
  getBannerConfig: function(callback) {
    storeCom.ensureCache2(function() {
      var bannerConfig = storage.get('appstore_bannerconfig');
      callback(bannerConfig);
    });
  }

};

/**
 * Exports
 */
exports.getAppList = storeCom.getAppList;
exports.getAppData = storeCom.getAppData;
exports.getBannerConfig = storeCom.getBannerConfig;
exports.getNamedListApps = storeCom.getNamedListApps;
exports.getAppCategories = storeCom.getAppCategories;
exports.getNewReleases = storeCom.getNewReleases;

