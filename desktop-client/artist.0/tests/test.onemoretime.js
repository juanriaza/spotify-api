require([
  '$api/models',
  '$artist/onemoretime',
  '$test-utils/assert'],
function(models, omt, assert) {

  mocha.setup('bdd');

  describe('A retrying function', function() {

    var functionWithRetry = omt.functionWithRetry;

    it('succeeds even after multiple failures', function(done) {
      var target = functionWithRetry(3, 10, okAfterNAttempts(3));
      target.done(function(runs) {
        assert.ok(runs === 3, 'The retry was run twice');
        done();
      });
      target.fail(function() {
        assert.ok(false, 'The retry failed');
      });
    });

    it('fails if it doesnt succeed after specified number of retries', function(done) {
      var target = functionWithRetry(3, 10, okAfterNAttempts(4));
      target.fail(function() {
        done();
      });
      target.done(function() {
        assert.ok(false);
      });
    });

    it('doubles the expected timeout on every try', function(done) {
      var counters = [], attempts = [], targets = [], iterations = 100;
      // We run a 100 passes to get a wider spread of data.
      for (var i = 0; i < iterations; i++) {
        // Calculates timings for 100
        var target = functionWithRetry(4, 100, (function(i) {
          return function() {
            var promise = new models.Promise;
            window.setTimeout(function() {
              if (counters[i] === undefined) {
                counters[i] = 0;
                attempts[i] = [];
              } else {
                counters[i]++;
              }
              attempts[i][counters[i]] = window.performance.webkitNow();
              if (counters[i] === 3) {
                promise.setDone();
              } else {
                promise.setFail();
              }
            }, 400);
            return promise;
          }
        })(i));
        targets.push(target);
      }
      // When we've run the function a whole bunch of times, we want to calculate
      // expected values and make sure that for each attempt, the function was not
      // beyond the expected boundaries between retries -- e.g. 0ms, 100ms, 200ms, 400ms
      // and a 15% uniform jitter (10% jitter we introduce + 5% jitter from the machine,
      // since setTimoute is very non-exact).
      models.Promise.join(targets).always(function() {
        var cleanedAttempts = [], avg = [], i, j, k;
        for (i = 0; i < attempts.length; i++) {
          cleanedAttempts[i] = [];
          for (j = 1; j < attempts[i].length; j++) {
            cleanedAttempts[i][j - 1] = attempts[i][j] - attempts[i][j - 1];
          }
          // Verify each individual sample keeps within the expectancy bounds,
          // and start summing up for average calculations.
          for (k = 0; k < cleanedAttempts[i].length; k++) {
            var expected = 100 * (1 << k), upper = expected + expected * 0.2, lower = expected - expected * 0.2;
            var value = cleanedAttempts[i][k];
            if (avg[k] === undefined) avg[k] = 0;
            avg[k] += value;
            assert.ok(value >= lower && value <= upper,
                value + ' not between ' + lower + ' and ' + upper);
          }
        }
        // Verify that the average value of each sample tends towards the non-jittery
        // version of the timeout time. This shows us that the jitter doesn't over-compensate
        // on either the lower or the upper bound.
        for (i = 0; i < avg.length; i++) {
          var N = cleanedAttempts.length;
          // First calculate the average
          avg[i] = avg[i] / iterations;
          // Then calculate the standard deviation
          var rl = 0, skewn = 0, stdev = 0, skew = 0;
          for (j = 0; j < N; j++) {
            var val = cleanedAttempts[j][i] - avg[i];
            rl += val * val;
          }
          // Using sample standard dev sqrt(1/(N-!)*sum(sqrt(sample-avg)))
          stdev = Math.sqrt(1 / (N - 1) * rl);
          // Now verify that the standard deviation is less than 5% of the expected value
          var expected = 100 * (1 << i);
          assert.ok(stdev / expected < 0.05,
              'Standard deviation ' + stdev / expected + ' >= 5%');
        }
        done();
      });
    });

  });

  function okAfterNAttempts(attempts) {
    var counter = 0;
    return function() {
      var promise = new models.Promise;
      counter++;
      if (counter === attempts) {
        promise.setDone(counter);
      } else {
        promise.setFail();
      }
      return promise;
    }
  };

});
