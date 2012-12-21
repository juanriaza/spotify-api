require(['$api/models'], function(models) {
  /**
   * @class
   * @classdesc Represents a feed activity event of a user.
   * @since 1.0.0
   *
   * @property {Activity.Type} activityType Type of the activity.
   * @property {Album|Artist|Playlist|Track|User} item Item, primary object in
   *     the activity.
   * @property {Album|Artist|Playlist|Track|User} context Context, secondary
   *     object in the activity.
   * @property {{uri: string, name: string, image: string}} referrer Referrer
   *     of the activity.
   * @property {string} message Message attached to the activity.
   * @property {Date} timestamp The timestamp when state was applied.
   * @property {User} user User object, owner of the activity.
   */
  function Activity(identifier, metadata) {
    this.resolve('identifier', identifier);
    this.resolveMany(0, metadata);
  }
  SP.inherit(Activity, models.Loadable);
  models.Loadable.define(Activity, [
    'activityType',
    'context',
    'item',
    'message',
    'referrer',
    'timestamp',
    'user'
  ]);

  /**
   * Different activity types.
   * @enum {string}
   */
  Activity.Type = {
    PLAYLIST_PUBLISHED: 'playlist-published',
    PLAYLIST_TRACK_ADDED: 'playlist-track-added',
    TRACK_FINISHED_PLAYING: 'track-finished-playing',
    APP_ADDED: 'app-added',
    TRACK_STARTED_PLAYING: 'track-started-playing',
    URI_SHARED: 'uri-shared',
    ARTIST_FOLLOWED: 'artist-followed',
    UNKNOWN: 'unknown'
  };

  Activity.prototype._make_activityType = function(value) {
    switch (value) {
      case 1:
        return Activity.Type.PLAYLIST_PUBLISHED;
      case 2:
        return Activity.Type.PLAYLIST_TRACK_ADDED;
      case 3:
        return Activity.Type.TRACK_FINISHED_PLAYING;
      case 4:
        return Activity.Type.APP_ADDED;
      case 5:
        return Activity.Type.TRACK_STARTED_PLAYING;
      case 6:
        return Activity.Type.URI_SHARED;
      case 7:
        return Activity.Type.ARTIST_FOLLOWED;
      default:
        return Activity.Type.UNKNOWN;
    }
  };

  Activity.prototype._make_context = function(value) {
    return value && models.fromURI(value.uri, value);
  };

  Activity.prototype._make_item = function(value) {
    return value && models.fromURI(value.uri, value);
  };

  Activity.prototype._make_referrer = function(value) {
    // TODO(blixt): Make this value return some kind of instance that
    // represents an application in the app store.
    return value;
  };

  Activity.prototype._make_timestamp = function(value) {
    return new Date(value);
  };

  /**
   * This method will be called by the Collection class when a new Activity
   * object should be created. The URI can be ignored since Activitys don't have
   * a URI. All data will come directly in the metadata map.
   * @protected
   * @param {string} identifier The identifier of the activity.
   * @param {object} metadata All properties of the activity will be contained
   * in this map.
   * @return {Activity} An activity.
   */
  Activity.fromURI = function(identifier, metadata) {
    return new Activity(identifier, metadata);
  };

  /**
   * Never construct a feed object using the default constructor - use
   * forCurrentUser(), forUser() and forRelations().
   *
   * @class
   * @classdesc Represents the feed of a user.
   * @since 1.0.0
   *
   * @see Feed#forCurrentUser
   * @see Feed#forUser
   * @see Feed#forRelations
   */
  function Feed(user) {
    models.BridgeLoadable.call(this);

    this.resolve('user', user);
    var uri = user ? user.uri : null;
    this.resolve('activities', new models.Collection(Activity, 'feed_activities', null, uri));
  }
  SP.inherit(Feed, models.BridgeLoadable);
  models.Loadable.define(Feed, [
    'activities',
    'user'
  ]);

  /**
   * Called when the first event listener is added to the feed object. Make a
   * request for the next event for this feed. If a request has already been
   * made for this feed, another request will be made but it will fail because
   * only one event request at a time is allowed. This is ok since it happens
   * fairly rarely and will not cause any incorrect behavior.
   * @private
   */
  Feed.prototype._observed = function() {
    var uri = this.user ? this.user.uri : null;
    this.bridgeListen('feed_event_wait', [uri]);
  };

  /**
   * Creates a Feed that contains the activity of the currently logged in user.
   *
   * @since 1.0.0
   *
   * @return {Feed} The feed for the currently logged in user.
   */
  Feed.forCurrentUser = function() {
    // Normally all users of the API are required to always load a property
    // before it can be used. We break this rule here so that we can return a
    // feed object immediately instead of returning a promise. Since this
    // module is part of the API itself we can break rules like this, but must
    // be careful to make sure that it remains true in the future.
    return new Feed(models.session.user);
  };

  /**
   * Creates a Feed that contains the activity of a given user.
   *
   * @since 1.0.0
   *
   * @param {User} user The user whose feed to return.
   * @return {Feed} The feed for the given user.
   */
  Feed.forUser = function(user) {
    return new Feed(user);
  };

  /**
   * Creates a Feed that contains the activity of all users and artists that
   * the currently logged in user subscribes to.
   *
   * @since 1.0.0
   *
   * @return {Feed} The feed for the given user.
   */
  Feed.forRelations = function() {
    return new Feed(null);
  };

  exports.Feed = Feed;
});
