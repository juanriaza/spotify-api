require(['$api/models'], function(models) {

  var RETRY_BASE_MS = 1000,
      NUM_RETRIES = 5,
      DEFAULT_TIMEOUT = 3000;

  function FunctionWithRetry(retries, baseWait, fnOrCtx, opt_fn) {
    this._retries = retries;
    this._baseWait = baseWait;
    if (opt_fn) {
      this._fn = opt_fn;
      this._ctx = fnOrCtx;
    } else {
      this._fn = fnOrCtx;
      this._ctx = this;
    }
  }

  FunctionWithRetry.prototype.execute = function() {
    this._retryCount = 0;
    this._promise = new models.Promise;
    this._executeBound = this._execute.bind(this);
    this._execute();
    return this._promise;
  };

  FunctionWithRetry.prototype._execute = function() {
    var timeoutFn = functionWithTimeout(this._getTimeout(), this._ctx, this._fn);
    var responsePromise = timeoutFn();
    responsePromise.done(this, this._succeed);
    responsePromise.fail(this, this._retryOrFail);
  };

  FunctionWithRetry.prototype._retryOrFail = function(error) {
    if (this._retryCount === this._retries - 1) {
      this._fail();
      this._retryCount = 0;
    } else {
      this._retryCount++;
      this._execute();
    }
  };

  FunctionWithRetry.prototype._getTimeout = function() {
    var backoff = 1 << this._retryCount;
    var waitWithoutJitter = this._baseWait * backoff;
    var jitter = (Math.random() - 0.5) * (waitWithoutJitter / 10);
    return waitWithoutJitter + jitter;
  };

  FunctionWithRetry.prototype._fail = function() {
    this._promise.setFail('Execution failed after ' + this._retries + ' tries');
  };

  FunctionWithRetry.prototype._succeed = function(result) {
    this._promise.setDone(result);
  };

  function functionWithRetry(retries, baseWait, fnOrCtx, opt_fn) {
    var retryableObject = new FunctionWithRetry(retries, baseWait, fnOrCtx, opt_fn);
    return retryableObject.execute();
  };

  function ResponseWithTimeout(timeout) {
    this.promise = new models.Promise;
    this._failed = false;
    this.timeout = timeout;
    this._timer = window.setTimeout(this._onTimeout.bind(this), this.timeout);
  }

  ResponseWithTimeout.prototype.done = function(response) {
    if (!this._failed) {
      window.clearTimeout(this._timer);
      this.promise.setDone(response);
    }
  };

  ResponseWithTimeout.prototype.fail = function(_, err) {
    this._failed = true;
    this.promise.setFail(err);
  };

  ResponseWithTimeout.prototype._onTimeout = function() {
    this._failed = true;
    this.promise.setFail('Promise timed out after ' + this.timeout + ' ms');
  };

  function functionWithTimeout(timeout, fnOrCtx, opt_fn) {
    var fn, ctx;
    if (opt_fn) {
      fn = opt_fn;
      ctx = fnOrCtx;
    } else {
      fn = fnOrCtx;
      ctx = this;
    }
    return function() {
      var response = new ResponseWithTimeout(timeout);
      var snapshotPromise = fn.apply(ctx, arguments);
      snapshotPromise.done(response, response.done);
      snapshotPromise.fail(response, response.fail);
      return response.promise;
    }
  }

  function SnapshotWithRetry(collection) {
    this._collection = collection;
  }

  SnapshotWithRetry.prototype.snapshot = function(opt_start, opt_length, opt_raw) {
    return functionWithRetry(NUM_RETRIES, RETRY_BASE_MS, this, function() {
      return this._collection.snapshot(opt_start, opt_length, opt_raw);
    });
  };

  function LoadableWithRetry(loadable) {
    this._loadable = loadable;
  }

  LoadableWithRetry.prototype.load = function() {
    var args = arguments;
    return functionWithRetry(NUM_RETRIES, RETRY_BASE_MS, this, function() {
      return this._loadable.load.apply(this._loadable, args);
    });
  };


  function snapshotWithRetry(collection) {
    return new SnapshotWithRetry(collection);
  }

  function loadableWithRetry(loadable) {
    return new LoadableWithRetry(loadable);
  }

  exports.snapshotWithRetry = snapshotWithRetry;
  exports.loadableWithRetry = loadableWithRetry;
  exports.functionWithTimeout = functionWithTimeout;
  exports.functionWithRetry = functionWithRetry;

});
