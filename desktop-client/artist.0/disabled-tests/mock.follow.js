require(['$api/models#Promise'], function(Promise) {

  /** Something that emulates the Hermes responses but in memory */
  exports.mockedRequest = function(root, space, method, requestType, replyType, args, onData) {
    var DEFAULT_ID = '123';
    var _contains = function(array, val) {
      for (var i = 0; i < array.length; i++) { if (array[i] === val) return true; }
      return false;
    };
    var promise = new Promise(this);
    if (!('_source' in this)) {
      this._source = {};
    }
    switch (space) {
      case 'exists':
        var response = (args in this._source && _contains(this._source[args], DEFAULT_ID)) ? 'True' : 'False';
        onData.call(this, [{reply: [response]}]);
        break;
      case 'count':
        var response = (this.artistId in this._source) ? this._source[this.artistId].length : 0;
        onData.call(this, [{counts: [response]}]);
        break;
    }
    switch (method) {
      case 'POST':
        if (!(this.artistId in this._source)) this._source[this.artistId] = [];
        this._source[this.artistId].push(DEFAULT_ID);
        onData.call(this);
        break;
      case 'DELETE':
        if (this.artistId in this._source) {
          var idx = this._source[this.artistId].indexOf(DEFAULT_ID);
          if (idx >= 0) {
            this._source[this.artistId].splice(idx, 1);
          }
        }
        onData.call(this);
        break;
    }
    promise.setDone();
    return promise;

  };
});
