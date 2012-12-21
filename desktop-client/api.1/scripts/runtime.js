require([
  '$api/models',
  '$api/../vendor/js-yaml.min'
], function(models, yaml) {
  yaml = window.jsyaml;

  function resolveModule(module) {
    var _module = module.match(/^(\$([^\/]+)\/)/);
    return _module ? _module[2] : undefined;
  }

  /**
   * Dynamically load bundles as dependencies with require() like semantics.
   *
   * @function
   * @name require
   * @since 1.0.0
   * @param {Array.<string>} modules An array of modules to load. The module names may
   * include an optional version specification to request that a bundle compatible with
   * that version is resolved.
   * @param {function()} callback A callback to invoke when the modules are loaded.
   * @param {function()=} opt_errback An optional callback to invoke if an error is
   *      encountered.
   * @see require
   *
   * @example
   * runtime.require(['$api/models', '$views@1.0/list#List'], function(models, List) {
   *    console.log('Loaded models (', models, ') and List (', List, ')');
   * }));
   */
  function runtimeRequire(modules, callback, opt_errback) {
    var modulesToLoad = [];
    var requirePaths = [];

    for (var i = 0, l = modules.length; i < l; i++) {
      var requestedPath = modules[i];

      var moduleSpec = resolveModule(requestedPath);
      if (!moduleSpec) throw new Error('Empty module name in require.');
      modulesToLoad.push(moduleSpec);

      var parts = moduleSpec.split('@');
      requirePaths.push(requestedPath.replace(moduleSpec, parts[0]));
    }

    var load = function() {
      window.require(requirePaths, callback);
    };
    var fail = function(error) {
      console.error('Error requiring modules', error, modules);
      if (opt_errback) {
        opt_errback(error);
      } else {
        throw new Error('Error requiring modules: ' + modules.join(', '));
      }
    };
    SP.request('application_require', modulesToLoad, this, load, fail);
  }

  /**
   * Query the bridge implementation to determine if a given request is implemented.
   *
   * @function
   * @name isRequestImplemented
   * @since 1.0.0
   * @param {string} requestName The name of the request to check.
   * @return {Promise} A promise that will be fulfilled when lookup has finished.
   */
  function isRequestImplemented(requestName) {
    var promise = new models.Promise();
    function onDone(result) {
      promise.setDone(result['found']);
    }
    function onError() {
      promise.setFail();
    }
    SP.request('core_request_lookup', [requestName], this, onDone, onError);
    return promise;
  }

  /**
   * Returns a JavaScript object that represents the bridge definition.
   * The object currently contains a top level array which objects representing
   * the request groups, and each group in turn contains an array containing
   * the requests in that group (group.requests).
   *
   * @function
   * @name getBridgeDefinition
   * @return {object} An object containing a representation of the bridge
   * definition.
   */
  function getBridgeDefinition() {
    var promise = new models.Promise();
    models.application.readFile('$api/bridge/requests.yaml')
        .done(function(source) {
          promise.setDone(yaml.load(source));
        })
        .fail(function() {
          promise.setFail();
        });
    return promise;
  }

  /**
   * @class
   * @classdesc An object representation of an entry in an application's log.
   * @since 1.6.0
   *
   * @property {string} level The log entry's level. Possible values are 'debug', 'info',
   * 'warning', 'error', and 'fatal'.
   * @property {string} message The log message.
   * @property {Date} timestamp The timestamp of the log entry as a date object.
   */
  function LogEntry(timestamp, message, level) {
    models.Loadable.call(this);
    this.resolve('level', level);
    this.resolve('message', message);
    this.resolve('timestamp', new Date(timestamp));
  }
  SP.inherit(LogEntry, models.Loadable);

  models.Loadable.define(LogEntry, [
    'level',
    'message',
    'timestamp'
  ]);

  LogEntry.fromURI = function(uri, metadata) {
    return new LogEntry(metadata.timestamp, metadata.message, metadata.level);
  };

  /**
   * @class
   * @classdesc An object representation of an application's logs.
   * @since 1.6.0
   *
   * @property {Application} application The application object that owns the log.
   * @property {Collection} entries A collection of LogEntry objects.
   */
  function Log(application) {
    models.BridgeLoadable.call(this);
    this.resolve('application', application);
    this.resolve('entries', new models.Collection(LogEntry, 'log_entries', application.uri));
    this.bridgeListen('log_event_wait', [application.uri]);
  }
  SP.inherit(Log, models.BridgeLoadable);

  models.Loadable.define(Log, ['application', 'entries']);

  /**
   * Creates a new Log object for a given application.
   *
   * @function
   * @name Log#forApplication
   * @param {Application} application The application to create a log for.
   * @return {Log} The log object for the application.
   * @since 1.6.0
   */
  Log.forApplication = function(application) {
    return new Log(application);
  };

  /**
   * Creates a new Log object for the current application.
   *
   * @function
   * @name Log#forCurrentApplication
   * @return {Log} The log object for the current application.
   * @since 1.6.0
   */
  Log.forCurrentApplication = function() {
    return new Log(models.application);
  };

  exports.require = runtimeRequire;
  exports.isRequestImplemented = isRequestImplemented;
  exports.getBridgeDefinition = getBridgeDefinition;
  exports.Log = Log;
});
