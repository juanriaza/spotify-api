require(['$api/models'], function(models) {

  var Loadable = models.Loadable;
  var Promise = models.Promise;

  /**
   * Helper function to be used in map() to convert a schema type into a schema
   * type string that can be passed over the bridge. Broken out into a separate
   * function so that we can avoid creating anonymous functions each time when
   * sending a request.
   * @private
   */
  function _type(type) {
    return (type.schema.id + '#' + type.name);
  }

  /**
   * @private
   * @class Hermes
   * @classdesc Hermes needs description.
   * @since 1.0.0
   */
  function Hermes() {}

  /**
   * Constructs a Hermes GET request with a given URI and description of the
   * result and argument types. The types come from a Schema that was created
   * earlier.
   * @param {string} uri The Hermes hm:// URI for the GET request.
   * @param {array} resultTypes An array of types for each of the results of
   * the request.
   * @param {array} argumentTypes An array of types for each of the arguments
   * of the request.
   * @param {number} timeout The timeout of the request, in milliseconds.
   *
   * @private
   * @function
   * @name Hermes#get
   * @since 1.0.0
   * @param {array} resultTypes An array of types for the result of the Hermes
   * request. Can be empty if you do not care about the result.
   * @return {Request} A Hermes request.
   *
   * @see Schema#fromURL
   * @see Schema#type
   */
  Hermes.get = function(uri, resultTypes, argumentTypes, timeout) {
    return new Request('GET', uri, resultTypes, argumentTypes, timeout);
  };

  /**
   * Constructs a Hermes request with a given method, URI and description of the
   * result and argument types. The types come from a Schema that was created
   * earlier.
   * @param {string} method Hermes-method to use; GET, PUT, PATCH etc.
   * @param {string} uri The Hermes hm:// URI for the request.
   * @param {array} resultTypes An array of types for each of the results of
   * the request.
   * @param {array} argumentTypes An array of types for each of the arguments
   * of the request.
   * @param {number} timeout The timeout of the request, in milliseconds.
   *
   * @private
   * @function
   * @name Hermes#request
   * @since 1.7.3
   * @param {array} resultTypes An array of types for the result of the Hermes
   * request. Can be empty if you do not care about the result.
   * @return {Request} A Hermes request.
   *
   * @see Schema#fromURL
   * @see Schema#type
   */
  Hermes.request = function(method, uri, resultTypes, argumentTypes, timeout) {
    return new Request(method, uri, resultTypes, argumentTypes, timeout);
  };

  /**
   * @private
   * @class Request
   * @classdesc A Hermes request that can be sent multiple times with different
   * arguments. To create a new request, use of the methods of the Hermes helper
   * class.
   * @since 1.0.0
   *
   * @see Hermes#get
   */
  function Request(method, uri, resultTypes, argumentTypes, timeout) {
    Loadable.call(this);

    this.resolve('uri', uri);
    this.resolve('method', method);
    this.resolve('timeout', timeout || 0);
    this._rtypes = resultTypes;
    this._atypes = argumentTypes;

    // Start loading the schemas of the result and argument types. This might be
    // a combination of different schemas, or it might be the same one for all
    // types. Everything is joined together into a single promise.
    var rload = Promise.join(this._rtypes.map(function(type) { return type.schema.load('id'); }));
    var aload = Promise.join(this._atypes.map(function(type) { return type.schema.load('id'); }));
    this._load = Promise.join(rload, aload);
  };

  SP.inherit(Request, Loadable);

  Loadable.define(Request, ['uri', 'method', 'timeout']);

  /**
   * Sends the Hermes request with a unique set of arguments. The number of
   * arguments should match the number of argument types used when creating the
   * request.
   *
   * @private
   * @function
   * @name Hermes#send
   * @since 1.0.0
   * @param {object} args A number of arguments.
   * @return {Promise} A promise for the request. When the promise has been
   * fulfilled, the request has completed. The object of the promise is an array
   * containing all of the replies. Even if there is only one reply, it will be
   * contained in an array of one element.
   */
  Request.prototype.send = function(args) {
    var promise = new Promise();
    var request = this;
    var req_arg = [].slice.call(arguments);
    this._load.done(function() {
      var done = function(data) { promise.setDone(data.result); };
      var rtypes = request._rtypes.map(_type);
      var atypes = request._atypes.map(_type);
      var request_args = [request.uri, request.method, rtypes, atypes, req_arg, request.timeout];
      SP.request('hermes_send_request', request_args, promise, done, promise.setFail);
    }).fail(function(o, error) {
      promise.setFail(error);
    });
    return promise;
  };

  /**
   * To create an instance of this class, use the fromURL method.
   *
   * @private
   * @class Schema
   * @classdesc A Hermes schema contains a collection of messages and enumerations.
   * Messages that are contained within the same schema can refer each other, but
   * not to messages in other schemas.
   * @since 1.0.0
   *
   * @see Schema#fromURL
   */
  function Schema(urls) {
    Loadable.call(this);
    this._urls = urls;
  }

  SP.inherit(Schema, Loadable);

  Loadable.define(Schema, ['id'], '_register');

  /**
   * Call this method to load a new schema from a collection of .proto files.
   * The .proto files must be contained within the application's bundle.
   * @param {array|string} urls An array of URL strings. Each URL must point
   * to an existing and valid .proto file. The parameter can also be a single
   * URL string.
   *
   * @private
   * @function
   * @name Schema#fromURL
   * @since 1.0.0
   */
  Schema.fromURL = function(urls) {
    if (typeof urls === 'string') urls = [urls];
    return new this(urls);
  };

  Schema.prototype.type = function(name) {
    return { schema: this, name: name };
  };

  Schema.prototype._register = function(props_mask) {
    var load = function(data) { this.resolveMany(props_mask, data); };
    var fail = function(oops) { this.resolveFail(props_mask, oops); };
    SP.request('hermes_register_schema', this._urls, this, load, fail);
  };

  exports.Hermes = Hermes;
  exports.Schema = Schema;

});
