require([
  '$api/models#Promise',
  '$test-utils/assert'
], function(Promise, assert) {
  mocha.setup('bdd');

  describe('Analytics contexts', function() {
    describe('Promise integration', function() {
      it('should use the current stack when reusing fullfilled promises', function(onDone) {
        var promise;
        SP.analyticsContext('first-context', function() {
          promise = new Promise();
          promise.done(function() {
            assert.equal(SP._contextStack[0].name, 'first-context');
          });
          promise.setDone();
        });

        SP.analyticsContext('second-context', function() {
          promise.done(function() {
            assert.equal(SP._contextStack.length, 1);
            assert.equal(SP._contextStack[0].name, 'second-context');
            onDone();
          });
        });
      });
    });
  });
});
