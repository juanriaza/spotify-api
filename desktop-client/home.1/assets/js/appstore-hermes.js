'use strict';
var hermesScheme = sp.require('assets/js/appstore-proto'),
    storage = sp.require('$util/storage');

var storeCom = {
  /**
   * Private variables
   */
  postObj: {
    market: sp.core.country,
    platform: 0
  },

  /**
   * Cache info
   */
  now: new Date().getTime(),
  cacheTimeout: 3600000, // 1 hour
  allowSystemApps: true, // Whether we can list/get details for system apps

  /**
   * Ensure that we have the applist AND all it's apps details cached.
   * @param {Function} callback "App data is ready"-callback.
   */
  ensureAppCache: function(callback) {
    var cached_ts = storage.get('appstore_timestamp');
    if (cached_ts && (cached_ts + storeCom.cacheTimeout) > storeCom.now) {
      if (storage.get('appstore_applist') && storage.get('appstore_appdata') && storage.get('appstore_bannerconfig')) {
        callback();
        return;
      }
    }
    sp.core.getHermes('GET', 'hm://appstore/1.0/banners/home',
        [['RequestHeader', storeCom.postObj]],
        {
          onSuccess: function() {
            var bc = sp.core.parseHermesReply('BannerConfig', arguments[0]);
            bc = JSON.parse(bc.json[0].decodeForText());

            sp.core.getHermes('GET', 'hm://appstore/1.0/apps/',
                [['RequestHeader', storeCom.postObj]],
                {
                  onSuccess: function() {
                    var appList = sp.core.parseHermesReply(
                        'IdentifierList',
                        arguments[0]);
                    var appDataObj = { items: [] };
                    var requestArray = [['RequestHeader', storeCom.postObj]];
                    for (var i = 0; i < appList.identifiers.length; i++) {
                      requestArray.push(appList.identifiers[i]);
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
                            storage.set('appstore_bannerconfig', bc);
                            storage.set('appstore_applist', appList.identifiers);
                            storage.set('appstore_appdata', appData);
                            storage.set('appstore_timestamp', storeCom.now);
                            callback();
                          },
                          onFailure: function(fail) {
                            callback();
                            return fail;
                          },
                          onComplete: function() {}
                        });
                    // return callback(appList.identifiers);
                  },
                  onFailure: function(fail) {
                    callback();
                    return fail;
                  },
                  onComplete: function() {
                  }
                });
          },
          onFailure: function(fail) {
            callback();
            return fail;
          },
          onComplete: function() {
          }
        }
    );
  },

  /**
   * Fetches a list of available app indentifiers
   * @param {Function} callback Hermes callback.
   */
  getAppList: function(callback) {
    storeCom.ensureAppCache(function() {
      var list = storage.get('appstore_applist');
      callback(list, true);
    });
  },

  /**
   * Fetches multiple app data
   * @param {Array} appIdentifiers App identifiers.
   * @param {Function} callback Hermes callback.
   */
  getAppData: function(appIdentifiers, callback) {
    storeCom.ensureAppCache(function() {
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
   * Fetches a the banner config file from appstore
   * @param {Function} callback Hermes callback.
   */
  getBannerConfig: function(callback) {
    storeCom.ensureAppCache(function() {
      var bannerConfig = storage.get('appstore_bannerconfig');
      callback(bannerConfig, true);
    });
  }
};
/**
 * Exports
 */
exports.getBannerConfig = storeCom.getBannerConfig;
exports.getAppList = storeCom.getAppList;
exports.getAppData = storeCom.getAppData;
