require([
  '/scripts/logger#Logger',
  '/scripts/utils'
], function(Logger, Utils) {

  function Benchmark() {
    this.logger = new Logger();
    this.events = {};
    this.measurements = {};
  }

  Benchmark.APP_INIT = 1;
  Benchmark.LOAD_FROM_URI = 2;
  Benchmark.RENDER_ABOVE_THE_FOLD = 3;

  Benchmark.prototype.start = function(id) {
    this.events[id] = Utils.performanceNow();
  };

  Benchmark.prototype.measure = function(id, msg, startId) {
    startId = typeof startId !== 'undefined' ? startId : id;

    if (!this.events[startId]) {
      return false;
    }
    if (this.measurements[id]) {
      return false;
    }

    var now = Utils.performanceNow();
    var delta = (now - this.events[startId]).toFixed(2);
    var data = {
      'time': delta,
      'id': id,
      'msg': msg
    };

    this.measurements[id] = data;
    return true;
  };

  Benchmark.prototype.send = function() {
    var data = {};
    for (var key in this.measurements) {
      if (this.measurements[key]['time']) {
        data[key] = this.measurements[key]['time'];
      }
    }
    this.logger.clientEvent('time-measurement', data);
    this.measurements = {};
  }

  exports.Benchmark = Benchmark;
});
