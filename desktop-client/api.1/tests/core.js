require([
  '$test-utils/assert'
], function(assert) {

  mocha.setup('bdd');

  var langModule = new SpotifyApi.LangModule('strings/test.lang', {
    TestString1: 'Hello, {0}! Today is a {1} day.',
    TestString2: 'Hello, {0}. This{1} {is} a {test'
  });

  describe('Language module', function() {
    it('should fetch strings and support string substitution', function() {
      var string = langModule.get('TestString1', 'World', 'wonderful');
      assert.equal(string, 'Hello, World! Today is a wonderful day.', 'String substitution failed');
    });

    it('should leave unknown substitutions alone', function() {
      var string = langModule.get('TestString2', 'World');
      assert.equal(string, 'Hello, World. This{1} {is} a {test', 'String substitution failed');
    });
  });

  describe('SP.bind', function() {

    var object = {};

    var argsParse = function() {
      return [this].concat(Array.prototype.slice.call(arguments));
    };

    var returnSelf = function() {
      return this;
    };

    it('should change the context of a function', function() {
      var object = {};
      var bound1 = SP.bind(returnSelf, object, 1, 2);
      var bound2 = SP.bind(returnSelf, object);
      assert.strictEqual(bound1(1, 2), object);
      assert.strictEqual(bound2(), object);
    });

    it('should change the context of a function which accepts additional arguments', function() {
      var bound = SP.bind(argsParse, object);
      var results = bound(1, 2);
      assert.strictEqual(results[0], object);
      assert.deepEqual(results, [object, 1, 2]);
    });

    it('should change the context of a function which accepts additional arguments, and concat those to the original function', function() {
      var bound = SP.bind(argsParse, object, 1, 2);
      var results = bound(3, 4);
      assert.strictEqual(results[0], object);
      assert.deepEqual(results, [object, 1, 2, 3, 4]);
    });

    /*
     * nullContext is variable: could be null or the global object, depending on browser and/or "use strict" directive.
     * In internet explorer it will always be window
     * In environments where the "use strict" directive is supported (and in use) it will always be null.
    */

    var nullContext = (function() {
      return this;
    }).call(null);

    it('should work when null is passed as context', function() {
      var bound1 = SP.bind(argsParse, null, 1, 2);
      var bound2 = SP.bind(argsParse, null);

      var results1 = bound1(3, 4);
      var results2 = bound2(1, 2);

      assert.deepEqual(results1, [nullContext, 1, 2, 3, 4]);
      assert.deepEqual(results2, [nullContext, 1, 2]);

    });

    it('should never use thisFunction.bind, rather Function.prototype.bind when available, or apply on thisFunction', function() {
      returnSelf.bind = function() {
        return {};
      };
      var bound = SP.bind(returnSelf, object);
      assert.strictEqual(bound(), object);
    });

    it('should allow to call SP.bind with any JavaScript object containing a method named "apply" as its first argument', function() {

      var fakeMethod = {

        apply: function(ctx, args) {
          return [ctx, args || []];
        }

      };

      var bound1 = SP.bind(fakeMethod, object);
      var bound2 = SP.bind(fakeMethod, object, 1, 2);
      var res1 = bound1(1, 2);
      var res2 = bound2();

      assert.strictEqual(res1[0], object);
      assert.strictEqual(res1[1][0], 1);
      assert.strictEqual(res1[1][1], 2);

      assert.strictEqual(res2[0], object);
      assert.strictEqual(res2[1][0], 1);
      assert.strictEqual(res2[1][1], 2);

    });

  });

  describe('SP.varargs', function() {

    var route = function() {
      return SP.varargs(arguments);
    };

    var indexRoute = function() {
      return SP.varargs(arguments, 1);
    };

    var slice = Array.prototype.slice;

    it('should accept an arguments list', function() {

      assert.deepEqual(slice.call(route(1, 2, 3, 4)), [1, 2, 3, 4]);

    });

    it('should accept an arguments list with an array as first item', function() {
      var expected = [1, 2, 3, 4];

      assert.deepEqual(route(expected), expected);

    });

    it('should throw if the first argument is an array and more arguments are passed', function() {

      assert.throws(function() {
        route([1, 2, 3, 4], 5);
      });

    });

    it('should allow arrays in the arguments list (?)', function() {

      assert.deepEqual(slice.call(route(1, [1, 2, 3, 4], 5)), [1, [1, 2, 3, 4], 5]);

    });

    it('should allow selecting the array index', function() {

      assert.deepEqual(slice.call(indexRoute(1, [1, 2, 3, 4])), [1, 2, 3, 4]);

    });

    it('should only consider arguments after the index if the index argument is not an array', function() {

      assert.deepEqual(slice.call(indexRoute(1, 2, 3, 4)), [2, 3, 4]);

    });

    it('should throw if more arguments are passed after index, and the index argument is an array', function() {

      assert.throws(function() {
        indexRoute(1, [1, 2, 3, 4], 2);
      });

    });

    it('should copy an array if opt_copy is set', function() {
      var original = [1, 2, 3, 4];
      var copy = SP.varargs(original, 0, true);
      assert.notStrictEqual(original, copy);
    });

    it('should convert an arguments list to a new array if opt_copy is set', function() {
      var original = (function() {
        return arguments;
      })(1, 2, 3, 4);

      var copy = SP.varargs(original, 0, true);
      assert.notStrictEqual(original, copy);
    });

  });

  describe('SP.defer', function() {

    it('should delay the execution of one function and assign the correct context', function(done) {

      var object = {};

      SP.defer(object, function() {
        assert.strictEqual(object, this);
        done();
      });

    });

    it('should delay the execution of multiple nested functions', function(done) {
      var index = 0;
      var check = function() {
        if (index++ == 2) done();
      };

      SP.defer(window, function() {
        SP.defer(window, function() {
          check();
        });
        check();
      });

      SP.defer(window, function() {
        check();
      });

    });

    it('should delay the execution of multiple nested functions in the specified order', function(done) {
      var index = 0;
      var globaln = 0;
      var check = function(n) {
        assert.equal(n, globaln);

        if (n != globaln++) return;
        if (index++ == 2) done();
      };

      SP.defer(window, function() {
        SP.defer(window, function() {
          check(2);
        });
        check(0);
      });

      SP.defer(window, function() {
        check(1);
      });

    });

  });

  describe('XMLHttpRequest', function() {

    var setRequestHeader;
    var header = {};

    before(function() {
      setRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

      XMLHttpRequest.prototype.setRequestHeader = function(name, value) {
        header[name] = value;
        return setRequestHeader.apply(this, arguments);
      };
    });

    after(function() {
      XMLHttpRequest.prototype.setRequestHeader = setRequestHeader;
    });

    afterEach(function() {
      header = {};
    });

    describe('same domain requests', function() {

      it('should set a Spotify header on same-domain requests', function() {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', window.location.href, true);
        assert.equal(header['X-Spotify-Requested-With'], 'XMLHttpRequest');
      });

      it('should set a Spotify header on relative urls', function() {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', '/home', true);
        assert.equal(header['X-Spotify-Requested-With'], 'XMLHttpRequest');
      });

    });

    /*
      Skip cross domain tests for Internet Explorer
    */

    var desc = (window.XDomainRequest) ? describe.skip : describe;

    desc('cross domain requests', function() {

      it('should not set a Spotify header on cross domain requests with implicit protocol', function() {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', '//host.com', true);
        assert.equal(header['X-Spotify-Requested-With'], null);
      });

      it('should not set a Spotify header on cross domain requests when a <base> is present', function() {
        var base = document.createElement('base');
        base.href = 'http://google.com';
        document.documentElement.appendChild(base);
        var xhr = new XMLHttpRequest();
        xhr.open('GET', '/', true);
        assert.equal(header['X-Spotify-Requested-With'], null);
        document.documentElement.removeChild(base);
      });

      it('should not set a Spotify header on cross-domain request', function() {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'sp://oti.fy', true);
        assert.equal(header['X-Spotify-Requested-With'], null);
      });

    });

  });

  describe('SP._createRequest', function(done) {

    it('should work with or without a native readFile implementation', function(done) {
      SP._createRequest('$api/manifest.json', function(json) {
        assert.equal(JSON.parse(json).BundleIdentifier, 'api');
        done();
      });
    });

  });

});
