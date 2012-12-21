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
   * Fetches a list of available app indentifiers
   * @param {Function} callback Hermes callback.
   * @return {Array} appList Object contaning an array of app identifiers.
   */
  getAppList: function(callback) {
    if (storeCom.isCached('home_AppList')) {
      return callback(storage.get('home_AppList'));
    } else {
      sp.core.getHermes('GET', 'hm://appstore/1.0/apps/',
          [
           ['RequestHeader', storeCom.postObj]
          ],
          {
            onSuccess: function() {
              var appList = sp.core.parseHermesReply('IdentifierList', arguments[0]);
              storage.set('home_AppList', appList.identifiers);
              storage.set('timestamp', storeCom.now);
              return callback(appList.identifiers);
            },
            onFailure: function(fail) {
              return fail;
            },
            onComplete: function() {}
          }
      );
    }
  },

  /**
   * Fetches multiple app data
   * @param {Array} appIdentifiers App identifiers.
   * @param {Function} callback Hermes callback.
   */
  getAppData: function(appIdentifiers, callback) {
    var appDataObj = {
      items: []
    };
    var requestArray = [['RequestHeader', storeCom.postObj]];
    for (var i in appIdentifiers) {
      var appData = storeCom.getCache(appIdentifiers[i]);
      if (appData) {
        if (storeCom.allowSystemApps || appData.requirement == 3) {
          appDataObj.items.push(appData);
        }
      } else {
        requestArray.push(appIdentifiers[i]);
      }
    }
    if (requestArray.length === 1) {
      return callback(appDataObj, true);
    }
    sp.core.getHermes('GET', 'hm://appstore/1.0/apps_details/',
        requestArray,
        {
          onSuccess: function(e) {
            var appListData = sp.core.parseHermesReply('AppList', arguments[0]);

            for (var i in appListData.items) {
              if (storeCom.allowSystemApps || appListData.items[i].requirement == 3) {
                appDataObj.items.push(appListData.items[i]);
              }
              storeCom.setCache(appListData.items[i].app_name, appListData.items[i]);
            }
            storage.set('timestamp', storeCom.now);
            return callback(appDataObj, false);
          },
          onFailure: function(fail) {
            return fail;
          },
          onComplete: function() {}
        });
  },

  /**
   * Checks if data is cached in client
   * @param {String} storageKey Local storage identifier.
   * @return {Boolean} Value for local storage identifier.
   */
  isCached: function(storageKey) {
    if ((storage.get('timestamp') && storage.get(storageKey)) && ((storage.get('timestamp') + storeCom.cacheTimeout) > storeCom.now)) {
      return true;
    } else {
      return false;
    }
  },

  /**
   * Set the cache for storing against the home key
   * @param {String} storageKey Local storage identifier.
   * @param {String} storageData Data to store.
   */
  setCache: function(storageKey, storageData) {
    var finderData = {};
    if (storeCom.isCached('home')) {
      finderData = storage.get('home');
    }
    finderData[storageKey] = storageData;
    storage.set('home', finderData);
    storage.set('timestamp', storeCom.now);
  },

  /**
   * Returns data stored against the home key
   * @param {String} storageKey Local storage identifier.
   * @return {Object} Contents of the data (or false if none).
   */
  getCache: function(storageKey) {
    var finderData = storage.get('home');
    if (finderData && finderData[storageKey] && ((storage.get('timestamp') + storeCom.cacheTimeout) > storeCom.now)) {
      return finderData[storageKey];
    }
    return false;
  }
};
/**
 * Exports
 */
exports.getAppList = storeCom.getAppList;
exports.getAppData = storeCom.getAppData;
