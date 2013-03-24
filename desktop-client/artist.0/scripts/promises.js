'use strict';

require([
  '$api/models#Promise'
], function(Promise) {

  /**
   * A timed promise fails after a set of time
   */
  function TimedPromise(object, timeout) {
    this._promise = new Promise(object);
    var self = this, _sd = function() { self.setDone(); };
    this._timer = window.setTimeout(_sd, timeout);
    return this._promise;
  };

  TimedPromise.prototype.setDone = function() {
    if (this._timer) window.clearTimeout(this._timer);
    this._promise.setDone();
  };

  TimedPromise.prototype.setFail = function() {
    if (this._timer) window.clearTimeout(this._timer);
    this._promise.setFail();
  };

  /**
   * A chained generated promise is a function that runs
   * count amount of times in a sequence.
   *
   * The promiseEmitter is a function that emits a promise.
   * As soon as the promise created by the promiseEmitter
   * resolves, the function will be run again to generate
   * a new promise, for count amount of times.
   *
   * This can be useful when you cannot create a new promise
   * before getting data from the previous promise.
   */
  function ChainedGeneratedPromise(promiseEmitter, object, count, context) {
    this._promise = new Promise(object);
    this._timesLeft = count;
    var self = this;
    var generator = function() {
      if (self._timesLeft == 0) {
        self._promise.setDone();
        return;
      }
      self._timesLeft--;
      var done = promiseEmitter.call(context !== null ? context : self);
      if (done) {
        done.done(generator);
        done.fail(generator);
      } else {
        self._promise.setDone();
      }
    }
    window.setTimeout(generator, 0);
    return this._promise;
  }

  exports.TimedPromise = TimedPromise;
  exports.ChainedGeneratedPromise = ChainedGeneratedPromise;

});
