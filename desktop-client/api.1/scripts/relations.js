require(['$api/models'], function(models) {
  /**
   * Never construct a relations object using the default constructor; instead,
   * use forCurrentUser() and forUser(user).
   *
   * @class Relations
   * @classdesc Represent a user's relations.
   * @since 1.0.0
   * @private
   *
   * @property {User} owner The user whom the relations belong to.
   * @property {Collection} subscribers A collection of users subscribing to
   *     the user.
   * @property {Collection} subscriptions A collection of users the user is
   *     subscribing to.
   *
   * @param {string} uri A URI that represents this set of relations. This
   *     URI will match the user URI.
   */
  function Relations(uri) {
    models.BridgeLoadable.call(this);

    var owner = models.User.fromURI(uri);

    this.resolve('owner', owner);
    this.resolve('subscribers', new models.Collection(models.User, 'relations_subscribers_users', null, owner.uri));
    this.resolve('subscriptions', new models.Collection(models.User, 'relations_subscriptions_users', null, owner.uri));
  }
  SP.inherit(Relations, models.BridgeLoadable);

  Relations.fromURI = models.Cache.lookup;
  Relations._cache = new models.Cache(Relations);

  models.Loadable.define(Relations, [
    'owner',
    'subscribers',
    'subscriptions'
  ]);

  /**
   * Never construct a relations object using the default constructor; instead,
   * use forCurrentUser() and forUser(user).
   *
   * @class CurrentUserRelations
   * @classdesc Represent the current user's relations.
   * @extends {Relations}
   * @since 1.0.0
   * @private
   *
   * @property {User} owner The user whom the relations belong to.
   * @property {Collection} blocked A collection of users the user has blocked.
   * @property {Collection} dismissed A collection of users the user has
   *     dismissed. Supports listening for event "add".
   * @property {Collection} hidden A collection of users that have dismissed
   *     the user.
   * @property {Collection} subscribers A collection of users subscribing to
   *     the user.
   * @property {Collection} subscriptions A collection of users the user is
   *     subscribing to. Supports listening for events "add" and "remove".
   *
   * @param {string} uri A URI that represents this set of relations. This
   *     URI will match the user URI.
   */
  function CurrentUserRelations(uri) {
    Relations.call(this, uri);

    this.resolve('blocked', new models.Collection(models.User, 'relations_blocked_users', null, this.owner.uri));
    this.resolve('dismissed', new models.Collection(models.User, 'relations_dismissed_users', null, this.owner.uri));
    this.resolve('hidden', new models.Collection(models.User, 'relations_hidden_users', null, this.owner.uri));

    models.User.getOrCreateRelationsListener().proxyTo(this);
  }
  SP.inherit(CurrentUserRelations, Relations);

  models.Loadable.define(CurrentUserRelations, [
    'blocked',
    'dismissed',
    'hidden'
  ]);

  /**
   * Blocks a user from interacting with the current user.
   *
   * @function
   * @name CurrentUserRelations#block
   * @since 1.0.0
   * @param {Array.<module:api/models~User>|...module:api/models~User} users
   *     One or more users to block.
   * @return {module:api/models~Promise} A promise for the request.
   */
  CurrentUserRelations.prototype.block = function(users) {
    return models.promisedRequest(this, 'relations_block', [this.owner.uri].concat(SP.uris(arguments)));
  };

  /**
   * Dismisses a user suggestion so that they won't be suggested to the user in
   * for example the feed or the people page.
   *
   * @function
   * @name CurrentUserRelations#dismiss
   * @since 1.0.0
   * @param {Array.<module:api/models~User>|...module:api/models~User} users
   *     One or more users to dismiss.
   * @return {module:api/models~Promise} A promise for the request.
   */
  CurrentUserRelations.prototype.dismiss = function(users) {
    return models.promisedRequest(this, 'relations_dismiss', [this.owner.uri].concat(SP.uris(arguments)));
  };

  /**
   * Subscribes the current user to updates for the specified user.
   *
   * @function
   * @name CurrentUserRelations#subscribe
   * @since 1.0.0
   * @param {Array.<module:api/models~User>|...module:api/models~User} users
   *     One or more users to subscribe to.
   * @return {module:api/models~Promise} A promise for the request.
   */
  CurrentUserRelations.prototype.subscribe = function(users) {
    return models.promisedRequest(this, 'relations_subscribe', [this.owner.uri].concat(SP.uris(arguments)));
  };

  /**
   * Unblocks a user.
   *
   * @function
   * @name CurrentUserRelations#unblock
   * @since 1.0.0
   * @param {Array.<module:api/models~User>|...module:api/models~User} users
   *     One or more users to unblock.
   * @return {module:api/models~Promise} A promise for the request.
   */
  CurrentUserRelations.prototype.unblock = function(users) {
    return models.promisedRequest(this, 'relations_unblock', [this.owner.uri].concat(SP.uris(arguments)));
  };

  /**
   * Unsubscribes the current user from updates for the specified user.
   *
   * @function
   * @name CurrentUserRelations#unsubscribe
   * @since 1.0.0
   * @param {Array.<module:api/models~User>|...module:api/models~User} users
   *     One or more users to unsubscribe from.
   * @return {module:api/models~Promise} A promise for the request.
   */
  CurrentUserRelations.prototype.unsubscribe = function(users) {
    return models.promisedRequest(this, 'relations_unsubscribe', [this.owner.uri].concat(SP.uris(arguments)));
  };

  /**
   * A reference to the CurrentUserRelations instance that represents the
   * relations for the current user.
   * @type {CurrentUserRelations}
   * @private
   */
  Relations._currentUser = null;

  /**
   * Gets the relations for the current user.
   *
   * @function
   * @name Relations#forCurrentUser
   * @since 1.0.0
   * @return {CurrentUserRelations} An object that represents the relations of
   *     the currently logged in user.
   */
  Relations.forCurrentUser = function() {
    if (!Relations._currentUser) {
      Relations._currentUser = new CurrentUserRelations(models.session.user.uri);
    }
    return Relations._currentUser;
  };

  /**
   * Gets the relations for a user.
   *
   * @function
   * @name Relations#forUser
   * @since 1.0.0
   * @param {User} user The user whose relations object to return.
   * @return {Relations} An object that represents the relations of the
   *     provided user.
   */
  Relations.forUser = function(user) {
    return Relations.fromURI(user.uri);
  };

  exports.Relations = Relations;
});
