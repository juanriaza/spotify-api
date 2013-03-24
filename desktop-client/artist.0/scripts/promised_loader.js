require([
  '$api/models'
], function(models) {

  function PromisedLoader() {
    this.stack = [];
  }

  PromisedLoader.prototype.enqueue = function(result, fn, ctx) {
    var args = Array.prototype.slice.call(arguments, 3),
        done = new models.Promise(result);
    if (this.stack.length === 0) {
      var promise = fn.apply(ctx, args);
      this.stack.push(promise);
      promise.done(function() {
        done.setDone();
      });
    } else {
      var last = this.stack[this.stack.length - 1];
      last.done(function() {
        var promise = fn.apply(ctx, args);
        promise.done(function() {
          done.setDone();
        });
      });
    }
    this.stack.push(done);
    return done;
  };

  PromisedLoader.prototype.destroy = function() {
    if (this.stack.length > 0) {
      var last = this.stack[this.stack.length - 1];
      last.setFail();
      this.stack = [];
    }
  }


  exports.PromisedLoader = PromisedLoader;

});
