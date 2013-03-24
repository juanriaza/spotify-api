var Environment = (function() {
  var protocol = window.location.protocol;

  var _web = function() {
    return !desktop();
  };

  var _desktop = function() {
    return protocol === 'sp:';
  };

  var web = !_desktop();
  var desktop = _desktop();

  return {
    web: web,
    desktop: desktop
  };
})();

exports.Environment = Environment;
