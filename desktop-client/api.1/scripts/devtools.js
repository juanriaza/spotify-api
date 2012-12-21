require(['$api/models'], function(models) {

  /**
   * @class
   * @classdesc A Stats object can be used to retrieve runtime
   * statistics about the Spotify application as a whole or an
   * individual Stitch app running inside it.
   * @since 1.1.0
   *
   * @property {string} app The app id the stats related to or
   * undefined if they are global.
   * @property {Array.<CallStats>} usage An array containing the
   * usage statistics for any bridged API call that has been invoked
   * by the target app (or globally if the instance was constructed
   * using Stats.forAllApps.
   *
   * @see Stats#forApp
   * @see Stats#forAllApps
   */
  function Stats(app) {
    this.resolve('app', app);
  }
  SP.inherit(Stats, models.Loadable);
  models.Loadable.define(Stats, [
    'app',
    'usage'
  ], '_metadata');

  /**
   * Constructs and object that returns stats for a given app.
   *
   * @function
   * @name Stats#forApp
   * @since 1.1.0
   * @param {String} app The id of the app to retrieve stats for.
   * Can be in the form 'app-id' or 'app-id@version'.
   * @return {Stats} The stats object.
   *
   * @example
   * stats.Stats.forApp('home@1.0.0').load('usage').done(function(stats) {
   *   console.log('Got app usage stats for ' + stats.usage.length() + ' calls');
   * });
   */
  Stats.forApp = function(app) {
    return new Stats(app);
  };

  /**
   * Constructs and object that returns stats aggregated for all apps.
   *
   * @function
   * @name Stats#forAllApps
   * @since 1.1.0
   * @return {Stats} The stats object.
   *
   * @example
   * stats.Stats.forAllApps().load('usage').done(function(stats) {
   *   console.log('Got global usage stats for ' + stats.usage.length() + ' calls');
   * });
   */
  Stats.forAllApps = function() {
    return new Stats;
  };

  Stats.prototype._loadDone = function(data) {
    var usage = [];
    for (var key in data) {
      usage.push(new CallStats(key, data[key]));
    }
    this.resolve('usage', usage);
    this.resolveDone();
  };

  Stats.prototype._metadata = function(props_mask) {
    var fail = function(oops) { this.resolveFail(props_mask, oops); };
    SP.request('devtools_api_usage', [this.app], this, this._loadDone, fail);
  };

  /**
   * @class
   * @classdesc A CallStats object provides access to usaged statistics for
   * a single bridged API call.
   * @since 1.1.0
   *
   * @property {string} name The name of the bridged request.
   * @property {Number} total The total number of times the call has been made.
   * @property {Number} succeeded The number of times the call has succeeded.
   * @property {Number} failed The number of times the call has failed.
   * @property {Number} aborted The number of times the call has been aborted.
   * spread of durations for each call that has been made.
   */
  function CallStats(name, data) {
    this.resolve('name', name);
    this.resolve('succeeded', data['succeeded']);
    this.resolve('failed', data['failed']);
    this.resolve('aborted', data['aborted']);
    this.resolve('total', this.succeeded + this.failed + this.aborted);
    this.resolveDone();
  }
  SP.inherit(CallStats, models.Loadable);
  models.Loadable.define(CallStats, [
    'name',
    'total',
    'succeeded',
    'failed',
    'aborted'
  ]);

  function ProfilingDataListener(callback) {
    models.BridgeLoadable.call(this);
    this._callback = callback;
    this.bridgeListen('devtools_profiling_event_wait', []);
  }
  SP.inherit(ProfilingDataListener, models.BridgeLoadable);

  ProfilingDataListener.prototype.eventDone = function(event) {
    this._callback(event);
  };

  var profilingListener;

  function enableProfiling(callback) {
    SP.request('devtools_enable_profiling', []);
    if (profilingListener === undefined) {
      profilingListener = new ProfilingDataListener(callback);
    }
  }

  function disableProfiling() {
    SP.request('devtools_disable_profiling', []);
    if (profilingListener !== undefined) {
      profilingListener = undefined;
    }
  }

  exports.Stats = Stats;
  exports.enableProfiling = enableProfiling;
  exports.disableProfiling = disableProfiling;

});
