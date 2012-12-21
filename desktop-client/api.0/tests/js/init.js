(function() {

  // Get the Spotify API and test specs
  window.sp = getSpotifyApi(1);
  var tests = sp.require('tests/js/tests');

  // Set up Jasmine
  var jasmineEnv = jasmine.getEnv();
  jasmineEnv.updateInterval = 1000;

  // HTML Reporter
  var trivialReporter = new jasmine.TrivialReporter();
  jasmineEnv.addReporter(trivialReporter);
  jasmineEnv.specFilter = function(spec) {
    return trivialReporter.specFilter(spec);
  };

  // Event Reporter
  var eventReporter = new jasmine.EventReporter();
  jasmineEnv.addReporter(eventReporter);
  eventReporter.observe(eventReporter.EVENTS.RUNNER_RESULTS, function(results) {
    results.errors.forEach(function(error) {
      var suite, subSuite, message, details;
      suite = error.suite + ' ';
      subSuite = error.subSuite ? '(' + error.subSuite + ') ' :  '';
      message = error.message;
      details = error.details ? ' (' + error.details + ')' : '';

      console.error(suite + subSuite + message + details);
    });
  });

  // Kick off the tests
  window.addEventListener('load', function() {
    jasmineEnv.execute();
  });

})();
