var Config = (function() {
  var _s = {};

  var init = function(settings) {
    for (var key in settings) {
      _s[key] = new Object();
      (function() {
        var k = key;
        _s[key].value = function() {
          return settings[k];
        };
        _s[key].has = function(value) {
          return settings[k].indexOf(value) > -1;
        };
        _s[key].is = function(value) {
          return settings[k] === value;
        };
      })();
    }
  };

  var get = function(key) {
    return _s[key];
  };

  return {
    init: init,
    get: get
  };
})();

exports.Config = Config;
