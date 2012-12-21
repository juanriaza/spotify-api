require([
  '$test-utils/mocha',
  '$api/models',
  '$api/runtime'
], function(mocha, models, runtime) {
  var application = new models.Application();

  function runTests() {
    application.load('arguments').done(function(app) {
      var bundle = app.arguments[0] || 'test-utils';
      var testsPath = '$' + bundle + '/../tests/tests';
      runtime.require([testsPath], function(tests) {
        mocha.runTests(tests);
      });
    });
  };

  models.application.addEventListener('arguments', function() {
    document.location.reload();
  });

  exports.runTests = runTests;
});
