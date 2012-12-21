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

    it('should work when null is passed as context', function() {
      var bound1 = SP.bind(argsParse, null, 1, 2);
      var bound2 = SP.bind(argsParse, null);

      var results1 = bound1(3, 4);
      var results2 = bound2(1, 2);

      assert.deepEqual(results1, [null, 1, 2, 3, 4]);
      assert.deepEqual(results2, [null, 1, 2]);

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

    it('should set a Spotify header on same-domain requests', function() {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', window.location.href, true);
      assert.equal(header['X-Spotify-Requested-With'], 'XMLHttpRequest');

    });

    it('should not set a Spotify header on cross-domain request', function() {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', 'sp://undef.ined.com', true);
      assert.equal(header['X-Spotify-Requested-With'], null);
    });

    it('should set a Spotify header on relative uris', function() {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', 'relative', true);
      assert.equal(header['X-Spotify-Requested-With'], 'XMLHttpRequest');
    });

    it('should set a Spotify header on relative uris starting with //', function() {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', '//relative', true);
      assert.equal(header['X-Spotify-Requested-With'], 'XMLHttpRequest');
    });

  });

});
