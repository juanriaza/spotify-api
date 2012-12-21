require('$test-utils/../vendor/mocha/mocha', function(mochaModule) {
  /*
   * Configure the DOM so Mocha tests can be run.
   */
  (function() {
    var spotifyStyle = document.createElement('style');
    spotifyStyle.textContent = 'html, body { background-color: #ecebe8 }';
    document.head.appendChild(spotifyStyle);

    var mochaStyles = document.createElement('link');
    mochaStyles.href = '$test-utils/vendor/mocha/mocha.css';
    mochaStyles.rel = 'stylesheet';
    mochaStyles.type = 'text/mochaStyles';
    document.head.appendChild(mochaStyles);

    var div = document.createElement('mocha');
    div.id = 'mocha';
    document.body.appendChild(div);
  })();

  /**
   * Runs any mocha tests that have been registered.
   *
   * @function
   * @name runTests
   * @since 0.1.0
   * @param {object} An optional target test module as imported using require()
   * If a test module is provided and it exports addTests() function it
   * will be called before tests are run: it may optionally return a Promise
   * which will delay test execution until it is fullfilled.
   * @param {Function} An optional callback to invoke when test execution
   * finishes: will be called with a single parameter containing the number
   * of test failures.
   */
  exports.runTests = function(testModule, onDone, runFunction) {
    function run() {
      runFunction = runFunction || mocha.run;
      runFunction(onDone !== undefined ? onDone : function() {});
    };
    if (testModule && testModule.addTests !== undefined) {
      var promise = testModule.addTests();
      if (promise !== undefined) {
        promise.done(run);
      }
    } else {
      run();
    }
  }

  exports.mocha = mocha;
});
