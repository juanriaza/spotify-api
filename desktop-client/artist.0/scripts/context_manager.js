require([
  '$api/models'
], function(models) {

  var THUNK = -1;

  function ContextManager() {
    this.previousContext = null;
    this.contexts = [];
    this.contextMapping = {};
    this.index = 0;
    this.offset = 0;
    window.contexts = this.contexts;
    window.contextMapping = this.contextMapping;
  }

  ContextManager.prototype.place = function(idx, list) {
    this.allocate(idx);
    this.evaluate(idx, list);
  }

  ContextManager.prototype.setOffset = function(offset) {
    // is required since album list doesnt want to know
    // about how many lists came before it, so the top tracks
    // specify that instead.
    this.offset = offset;
  }

  ContextManager.prototype.incrementOffset = function(offsetDelta) {
    if (offsetDelta >= 0) {
      this.offset += offsetDelta;
    }
  }

  ContextManager.prototype.allocate = function(idx, evaluator) {
    this.contexts[this.index] = evaluator;
    this.contextMapping[idx + this.offset] = this.index;
    this.index++;
    return idx + this.offset;
  }

  ContextManager.prototype.isThunk = function(obj) {
    return typeof(obj) === 'function';
  }

  ContextManager.prototype.evaluateNext = function(id) {
    var idx = this.contextMapping[id];
    var ctx = this.contexts[idx + 1];
    if (ctx && this.isThunk(ctx)) {
      ctx.call(this);
    }
  }

  ContextManager.prototype._failConnectErr = function(list, conn) {
    return 'ContextManager: The list for ' + list.item.uri +
        ' is already connected to ' + conn.item.uri + '.' +
        ' Re-connecting it will break selection logic' +
        ' and should be avoided.';
  };

  ContextManager.prototype.evaluate = function(key, list) {
    var idx = this.contextMapping[key];
    if (idx && idx > 0) {
      var previous = this.findPrevious(idx - 1); //this.contexts[idx - 1];
      if ((previous && previous.nextList)) {
        throw this._failConnectErr(previous, previous.nextList);
      }
      if ((list && list.previousList)) {
        throw this._failConnectErr(list, list.previousList);
      }
      this.contexts[idx] = { group: list, index: THUNK };
      if (previous && !this.isThunk(previous)) {
        previous.group.connect(list);
        if (previous.index !== THUNK) {
          this.contexts[idx].index = previous.index + 1;
        }
      }
      var next = this.contexts[idx + 1];
      if (next && !this.isThunk(next)) {
        if (next.index !== THUNK) {
          this.contexts[idx].index = next.index - 1;
        }
      }
    } else {
      this.contexts[0] = { group: list, index: 0 };
    }
  }

  ContextManager.prototype.findPrevious = function(index) {
    if (index < 1) {
      return false;
    } if (typeof this.contexts[index] === 'function') {
      return this.findPrevious(index - 1);
    } else {
      return this.contexts[index];
    }
  }

  ContextManager.prototype.contextAt = function(index) {
    var ctx = this.contexts[this.contextMapping[index]];
    if (ctx && !this.isThunk(ctx) && ctx.index !== THUNK && ctx.group) {
      ctx.group.uri = ctx.group.item.uri;
      return ctx;
    } else {
      return null;
    }
  }

  exports.ContextManager = ContextManager;

});
