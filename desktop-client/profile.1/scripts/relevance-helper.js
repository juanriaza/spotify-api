require([
  '$api/hermes',
  '$api/models#Observable',
  '$api/models#User'
], function(hermes, Observable, User) {

  /**
   * Protobuf for loading common friends
   **/
  var SCHEMA = hermes.Schema.fromURL('proto/socialgraph.proto');

  /**
   * Root URI for socialgraph hermes requests
   * @type {String}
   */
  var SOCIAL_GRAPH_ROOT = 'hm://socialgraph/';
  /**
   * Definition of the types of events the followers helper will emit.
   * @enum {string}
   */
  var EVENTS = {
    RELATIONS_LOADED: 'related_relations_loaded'
  };

  var RelevanceHelper = function(type, username) {
    if (!type || !username) {
      return;
    }
    this.type = type;
    this.username = username;
  };

  SP.inherit(RelevanceHelper, Observable);

  RelevanceHelper.prototype.load = function() {
    this.uri = [
      SOCIAL_GRAPH_ROOT,
      this.type,
      'user',
      encodeURIComponent(this.username),
      'relevant'
    ].join('/');
    this._load();
  };

  RelevanceHelper.prototype._load = function() {
    var rTypes = [SCHEMA.type('UserListReply')];
    var aTypes = [SCHEMA.type('UserListRequest')];

    var req = hermes.Hermes.get(this.uri, rTypes, aTypes);
    req.send().done(this, this._requestComplete);
  };

  /**
   * Callback for when common relations are loaded.
   * @type {Function}
   * @param {Object} reply The reply of the hermes call.
   * @private
   */
  RelevanceHelper.prototype._requestComplete = function(reply) {
    var e = new Event(EVENTS.RELATIONS_LOADED), data;

    if (!reply[0].users) {
      data = [];
    } else {
      data = reply[0].users.map(this._createUser);
    }

    e.data = {
      relevantPeople: data
    };

    this.dispatchEvent(e);
  };

  /**
   * Creates a user object from an object.username and returns it.
   * @type {Function}
   * @param {{username: string}} obj An object with the username attached.
   * @return {models.User} Returns a created userobject.
   * @private
   */
  RelevanceHelper.prototype._createUser = function(obj) {
    return User.fromUsername(obj.username);
  };

  exports.RelevanceHelper = RelevanceHelper;
  exports.RelevanceEvent = EVENTS;
});
