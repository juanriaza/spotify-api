require(['$api/models'], function(models) {

  var slice = Array.prototype.slice;

  function _updateStarredCache(evt) {
    models.Track._cache.update(evt.uris, {starred: evt.type == 'insert'});
  }

  /**
   * Never construct a library object using the default constructor - use
   * forCurrentUser() and forUser().
   *
   * @class Library
   * @classdesc Represent a user's library.
   * @since 1.0.0
   *
   * @property {Collection} albums A collection of albums in the user's
   *     library.
   * @property {Collection} artists A collection of artists in the user's
   *     library.
   * @property {Collection} playlists A collection of playlists in the the
   *     user's library. Note: This is only vaild for the current user, for
   *     other users an error will be returned.
   * @property {Collection} published A collection of playlists that the user
   *     has published.
   * @property {Playlist} starred A playlist containing the user's starred
   *     tracks.
   * @property {Playlist} toplist A playlist containing the user's top tracks.
   * @property {Collection} tracks A collection of tracks in the user's
   *     library.
   * @property {User} owner The user who owns the library.
   *
   * @see Library#forCurrentUser
   * @see Library#forUser
   */
  function Library(uri) {
    models.BridgeLoadable.call(this);

    var owner = models.User.fromURI(uri);

    this.resolve('owner', owner);
    this.resolve('albums', new models.Collection(models.Album, 'library_albums', null, owner.uri));
    this.resolve('artists', new models.Collection(models.Artist, 'library_artists', null, owner.uri));
    this.resolve('playlists', new models.Collection(models.Playlist, 'library_playlists', null, owner.uri));
    this.resolve('published', new models.Collection(models.Playlist, 'library_published', null, owner.uri));
    this.resolve('starred', models.Playlist.fromURI(owner.uri + ':starred'));
    // NOTE: This uri for the track toplist is marked as deprecated.
    // But the new uri (:top:track) isn't supported in core yet, so let's use this
    // for now and change once that support is implemented (possibly by us).
    this.resolve('toplist', models.Playlist.fromURI(owner.uri + ':toplist'));
    this.resolve('tracks', new models.Collection(models.Track, 'library_tracks', this.uri, owner.uri));

    if (owner.uri == models.session.user.uri) {
      // If this library is for the current user, use a proxy to share events
      // between the models module and this module.
      models.Playlist.getOrCreateLibraryListener().proxyTo(this);
      // Starred events are only relevant if the library is for the currently
      // logged in user.
      this.starred.addEventListener('insert', _updateStarredCache);
      this.starred.addEventListener('remove', _updateStarredCache);
    } else {
      var self = this;
      var observedHandler = function() {
        self.bridgeListen('library_event_wait', [owner.uri]);
      };
      // Start listening for library events if any of the collections get an
      // event listener.
      this.albums._observed = observedHandler;
      this.artists._observed = observedHandler;
      this.playlists._observed = observedHandler;
      this.published._observed = observedHandler;
      this.tracks._observed = observedHandler;
    }

  }
  SP.inherit(Library, models.BridgeLoadable);

  Library.fromURI = models.Cache.lookup;
  Library._cache = new models.Cache(Library);

  models.Loadable.define(Library, [
    'albums',
    'artists',
    'owner',
    'playlists',
    'published',
    'starred',
    'toplist',
    'tracks'
  ]);

  /** @typedef {(module:api/models~Album|module:api/models~Artist|module:api/models~Playlist|module:api/models~Track)} */
  Library.Item;

  /**
   * @function
   * @name Library#publish
   * @since 1.1.0
   * @param {module:api/models~Playlist} playlists One or more playlists to
   *     publish.
   * @return {module:api/models~Promise} A promise for the request.
   */
  Library.prototype.publish = function(playlists) {
    return models.promisedRequest(this, 'library_publish', [this.owner.uri].concat(SP.uris(arguments)));
  };

  /**
   * Stars one or more items for the user.
   *
   * @function
   * @name Library#star
   * @since 1.5.0
   * @param {Array.<Library.Item>|...Library.Item} items One or more items to
   *     star.
   * @return {module:api/models~Promise} A promise for the request.
   */
  Library.prototype.star = function(items) {
    return models.promisedRequest(this, 'library_star', [this.owner.uri].concat(SP.uris(arguments)));
  };

  /**
   * @function
   * @name Library#subscribe
   * @since 1.0.0
   * @param {Array.<Library.Item>|...Library.Item} items One or more items to
   *     subscribe to.
   * @return {module:api/models~Promise} A promise for the request.
   */
  Library.prototype.subscribe = function(items) {
    return models.promisedRequest(this, 'library_subscribe', [this.owner.uri].concat(SP.uris(arguments)));
  };

  /**
   * @function
   * @name Library#unpublish
   * @since 1.1.0
   * @param {module:api/models~Playlist} playlists One or more playlists to
   *     unpublish.
   * @return {module:api/models~Promise} A promise for the request.
   */
  Library.prototype.unpublish = function(playlists) {
    return models.promisedRequest(this, 'library_unpublish', [this.owner.uri].concat(SP.uris(arguments)));
  };

  /**
   * Unstars one or more items for the user.
   *
   * @function
   * @name Library#unstar
   * @since 1.5.0
   * @param {Array.<Library.Item>|...Library.Item} items One or more items to
   *     unstar.
   * @return {module:api/models~Promise} A promise for the request.
   */
  Library.prototype.unstar = function(items) {
    return models.promisedRequest(this, 'library_unstar', [this.owner.uri].concat(SP.uris(arguments)));
  };

  /**
   * @function
   * @name Library#unsubscribe
   * @since 1.0.0
   * @param {Array.<Library.Item>|...Library.Item} items One or more items to
   *     unsubscribe from.
   * @return {module:api/models~Promise} A promise for the request.
   */
  Library.prototype.unsubscribe = function(items) {
    return models.promisedRequest(this, 'library_unsubscribe', [this.owner.uri].concat(SP.uris(arguments)));
  };

  /**
   * @function
   * @name Library#forCurrentUser
   * @since 1.0.0
   * @return {Library} The library for the currently logged in user.
   */
  Library.forCurrentUser = function() {
    // Normally all users of the API are required to always load a property
    // before it can be used. We break this rule here so that we can return a
    // library object immediately instead of returning a promise. Since this
    // module is part of the API itself we can break rules like this, but must
    // be careful to make sure that it remains true in the future.
    return Library.forUser(models.session.user);
  };

  /**
   * @function
   * @name Library#forUser
   * @since 1.0.0
   * @param {User} user The user whose library object to return.
   * @return {Library} The library for the given user.
   */
  Library.forUser = function(user) {
    return Library.fromURI(user.uri);
  };

  exports.Library = Library;
});
