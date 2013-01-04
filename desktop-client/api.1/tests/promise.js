require(['$api/models#Promise', '$test-utils/assert'], function(Promise, assert) {
  mocha.setup('bdd');

  var always, done, fail;
  function setup(p) {
    p.done(function() { done = true; });
    p.fail(function() { fail = true; });
    p.always(function(v) {
      assert.strictEqual(v, p.object, 'Promise did not pass correct value to always callback');
      always = true;
    });
    return p;
  }

  beforeEach(function() {
    always = false;
    done = false;
    fail = false;
  });

  describe('Promise', function() {
    it('should not call callbacks again if a callback tries to resolve the promise', function() {
      var p = new Promise;
      p.done(function() {
        this.setFail();
      });
      p.fail(function() {
        throw new Error('"fail" callback was called after setDone');
      });
      p.setDone();
    });

    it('should call callbacks bound to the correct object', function() {
      var p, context = {}, i = 0;

      p = new Promise;
      p.always(function() {
        assert.equal(this, p, '"always" callback was bound to the wrong object');
        i++;
      });
      p.always(context, function() {
        assert.equal(this, context, '"always" callback was bound to the wrong object');
        i++;
      });
      p.done(function() {
        assert.equal(this, p, '"done" callback was bound to the wrong object');
        i++;
      });
      p.done(context, function() {
        assert.equal(this, context, '"done" callback was bound to the wrong object');
        i++;
      });
      p.setDone();

      p = new Promise;
      p.fail(function() {
        assert.equal(this, p, '"fail" callback was bound to the wrong object');
        i++;
      });
      p.fail(context, function() {
        assert.equal(this, context, '"fail" callback was bound to the wrong object');
        i++;
      });
      p.setFail();

      // Make sure this value is the same as the number of callbacks above.
      // This check ensures we didn't miss any asserts due to a bug.
      assert.equal(i, 6, 'Not all callbacks were triggered');
    });

    describe('done', function() {
      it('should call the callbacks once it resolves', function() {
        setup(new Promise).setDone();

        assert.ok(always, 'Promise did not call "always" callback');
        assert.ok(done, 'Promise did not call "done" callback');
        assert.equal(fail, false, 'Promise called "fail" callback');
      });

      it('should call the callbacks even if they were added after it resolves', function() {
        var p = new Promise({});
        p.setDone();
        setup(p);

        var secondDone = false;
        p.done(function(v) {
          assert.equal(v, p.object, 'Promise did not pass correct value to "done" callback');
          secondDone = true;
        });

        assert.ok(always, 'Promise did not call "always" callback');
        assert.ok(done, 'Promise did not call "done" callback');
        assert.ok(secondDone, 'Promise did not call second "done" callback');
        assert.equal(fail, false, 'Promise called "fail" callback');
      });
    });

    describe('fail', function() {
      it('should call the callbacks after it fails', function() {
        setup(new Promise).setFail();

        assert.ok(always, 'Promise did not call "always" callback');
        assert.ok(fail, 'Promise did not call "fail" callback');
        assert.equal(done, false, 'Promise called "done" callback');
      });

      it('should call the callbacks even if they were added after it fails', function() {
        var error = {};

        var p = new Promise({});
        p.setFail(error);
        setup(p);

        var secondFail = false;
        p.fail(function(v, e) {
          assert.equal(v, p.object, 'Promise did not pass correct value to "fail" callback');
          assert.equal(e, error, 'Promise did not pass correct error to "fail" callback');
          secondFail = true;
        });

        assert.ok(always, 'Promise did not call "always" callback');
        assert.ok(fail, 'Promise did not call "fail" callback');
        assert.ok(secondFail, 'Promise did not call second "fail" callback');
        assert.equal(done, false, 'Promise called "done" callback');
      });
    });

    describe('join', function() {
      it('should call "done" callbacks after all sub-promises are done', function() {
        var p1 = new Promise, p2 = new Promise, p3 = new Promise,
            p = Promise.join(p1, p2, p3);

        setup(p);

        assert.equal(done, false, 'Joined promise was resolved too early');

        p1.setDone();
        p3.setDone();

        assert.equal(done, false, 'Joined promise was resolved too early');

        p2.setDone();

        assert.ok(done, 'Joined promise did not resolve after sub-promises were done');
      });

      it('should call "fail" callbacks after one sub-promise fails and all sub-promises have resolved', function() {
        var p1 = new Promise, p2 = new Promise, p3 = new Promise,
            p = Promise.join(p1, p2, p3);

        setup(p);

        assert.equal(fail, false, 'Joined promise failed too early');

        p1.setDone();
        p3.setFail();

        assert.equal(fail, false, 'Joined promise failed too early');

        p2.setDone();

        assert.ok(fail, 'Joined promise did not fail after sub-promises were done');
      });

      it('should return values of sub-promises (in correct order)', function() {
        var p1 = new Promise({}), p2 = new Promise({}), p3 = new Promise({}),
            p = Promise.join(p1, p2, p3);

        p.done(function(values) {
          assert.equal(values[0], p1.object, 'Value mismatch for promise 1');
          assert.equal(values[1], p2.object, 'Value mismatch for promise 2');
          assert.equal(values[2], p3.object, 'Value mismatch for promise 3');
          done = true;
        });

        // Resolve out of order to ensure value order is preserved.
        p2.setDone();
        p1.setDone();
        p3.setDone();

        assert.ok(done, 'Promise did not resolve');
      });

      it('should call the "each" callbacks as sub-promises resolve', function() {
        var p1 = new Promise, p2 = new Promise, p3 = new Promise,
            p = Promise.join(p1, p2, p3);

        var i = 0;
        p.each(function() { i++; });

        p3.setFail();

        assert.equal(i, 0, '"each" callback was called for a failure');

        p1.setDone();

        assert.equal(i, 1, '"each" callback was not called correct number of times');

        p2.setDone();

        assert.equal(i, 2, '"each" callback was not called correct number of times');

        p.each(function() { i--; });

        assert.equal(i, 0, '"each" callback added after promise was resolved was not called correct number of times');
      });

      it('should call the "done" callback with an empty array for an empty list of sub-promises', function() {
        var p = Promise.join([]);

        var i = 0;
        p.each(function() { i++; });

        p.done(function(args) {
          assert.deepEqual(args, []);
          done = true;
        });

        assert.equal(i, 0, '"each" callback should not have been called');
        assert.ok(done, 'Promise did not resolve');
      });
    });
  });
});
