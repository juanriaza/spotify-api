require(['$api/models'], function(models) {
  /**
   * @class Offline
   * @classdesc Methods to offline sync playlists
   * @since 1.16.0
   *
   * @example
   * var offline = offline.Offline.forCurrentUser();
   * offline.enableSync(models.Playlist.fromURI(...));
   */
  function Offline() {
    models.Loadable.call(this);
  }
  SP.inherit(Offline, models.Loadable);

  /**
   * Returns an offline object for the current user and device.
   *
   * @function
   * @name Offline#forCurrentUser
   * @since 1.16.0
   * @return {Offline} An instance of the class Offline for the current user.
   */
  Offline.forCurrentUser = function() {
    return new this();
  };

  /**
   * Starts to sync an object for offline play.
   *
   * @function
   * @name Offline#enableSync
   * @since 1.16.0
   * @param {Playlist} item The object we want to offline sync.
   * @return {Promise} Promise that resolves once offline syncing has been
   *   enabled for the playlist.
   */
  Offline.prototype.enableSync = function(item) {
    return models.promisedRequest(this, 'offline_enable_sync', [item.uri]);
  };

  /**
   * Stops syncing an object for offline play and removes local files
   *
   * @function
   * @name Offline#disableSync
   * @since 1.16.0
   * @param {Playlist} item The object we want to offline sync.
   * @return {Promise} Promise that resolves once offline syncing has been
   *   disabled for the playlist.
   */
  Offline.prototype.disableSync = function(item) {
    return models.promisedRequest(this, 'offline_disable_sync', [item.uri]);
  };

  /**
   * Stops syncing an object for offline play and removes local files
   *
   * @function
   * @name Offline#getSyncState
   * @since 1.16.0
   * @param {Playlist} item The object we want to get the offline sync state for.
   * @return {Promise} Promise that resolves into an object with two properties:
   *   enabled (true or false) indicates offline syncing for the object is
   *   enabled and status ('not-synced', 'syncing' or 'synced') indicates the
   *   current status of the offline sync.
   */
  Offline.prototype.getSyncState = function(item) {
    var promise = new models.Promise();
    SP.request('offline_query_state', [item.uri], promise, promise.setDone, promise.setFail);
    return promise;
  };

  exports.Offline = Offline;
});
