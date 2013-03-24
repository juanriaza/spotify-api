require([
  '$playlist-header/scripts/sanitize-description#sanitizeDescription',
  '$playlist-header/../tests/xss-attack-vectors#xssAttackVectors',
  '$test-utils/assert'
], function(sanitizeDescription, xssAttackVectors, assert) {
  mocha.setup({
    ui: 'bdd',
    globals: ['xss']
  });

  var allowed = {
    a: ['href', 'target'],
    b: [],
    i: []
  };

  function isSafe(str) {
    var div = document.createElement('div');
    div.innerHTML = str;

    Array.prototype.forEach.call(div.querySelectorAll('*'), function(el) {
      var nodeName = el.nodeName.toLowerCase();
      if (!allowed.hasOwnProperty(nodeName)) {
        throw new Error('Contained disallowed element "' + nodeName + '"');
      } else {
        var allowedAttributes = allowed[nodeName];

        for (var i = 0; i < el.attributes.length; i++) {
          var attributeName = el.attributes.item(i).nodeName.toLowerCase();
          if (allowedAttributes.indexOf(attributeName) === -1) {
            throw new Error('Contained disallowed attribute "' + attributeName + '" for element "' + nodeName + '"');
          }
        }
      }
    });

    return true;
  }

  describe('let through b and i in certain cases', function() {

    it('allow <b>spotify</b>', function() {
      assert.equal(sanitizeDescription('<b>spotify</b>'), '<b>spotify</b>');
    });

    it('allow but normalize <B>spotify</B>', function() {
      assert.equal(sanitizeDescription('<B>spotify</B>'), '<b>spotify</b>');
    });

    it('allow but normalize <B>spotify</b>', function() {
      assert.equal(sanitizeDescription('<B>spotify</b>'), '<b>spotify</b>');
    });

    it('allow <i>spotify</i>', function() {
      assert.equal(sanitizeDescription('<i>spotify</i>'), '<i>spotify</i>');
    });

    it('allow but normalize <I>spotify</I>', function() {
      assert.equal(sanitizeDescription('<I>spotify</I>'), '<i>spotify</i>');
    });

    it('allow but normalize <I>spotify</i>', function() {
      assert.equal(sanitizeDescription('<I>spotify</i>'), '<i>spotify</i>');
    });

    it('remove all attributes on b and i such as <i href="javascript:alert(1337)">spotify</i> becomes <i>spotify</i>', function() {
      assert.equal(sanitizeDescription('<i href="javascript:alert(1337)">spotify</i>'), '<i>spotify</i>');
    });

  });

  describe('let through a in certain cases', function() {

    it('allow <a href="http://www.spotify.com" target="_blank">spotify</a>', function() {
      assert.equal(
          sanitizeDescription('<a href="http://www.spotify.com" target="_blank">spotify</a>'),
          '<a href="http://www.spotify.com" target="_blank">spotify</a>'
      );
    });

    it('allow but normalize <A href="http://www.spotify.com" target="_blank">spotify</A>', function() {
      assert.equal(
          sanitizeDescription('<A href="http://www.spotify.com" target="_blank">spotify</A>'),
          '<a href="http://www.spotify.com" target="_blank">spotify</a>'
      );
    });

    it('allow but normalize <A href="http://www.spotify.com" target="_blank">spotify</a>', function() {
      assert.equal(
          sanitizeDescription('<A href="http://www.spotify.com" target="_blank">spotify</a>'),
          '<a href="http://www.spotify.com" target="_blank">spotify</a>'
      );
    });

    it('enforce target="_blank" for remote links such as <a href="http://www.spotify.com">spotify</a>', function() {
      var sanitized = sanitizeDescription('<a href="http://www.spotify.com">spotify</a>');
      assert.equal(sanitized, '<a href="http://www.spotify.com" target="_blank">spotify</a>');
    });

    it('convert spotify:*-uris to open.spotify-uris for eg. <a href="spotify:user:daniel">daniel</a>', function() {
      assert.equal(sanitizeDescription('<a href="spotify:user:daniel">daniel</a>'), '<a href="http://open.spotify.com/user/daniel">daniel</a>');
    });

    it('escape any link whose href doesn\' start with http or spotify, such as <a href="xss">xss</a>', function() {
      assert.equal(sanitizeDescription('<a href="xss">xss</a>'), '&lt;a href=\"xss\"&gt;xss&lt;/a&gt;');
    });

    it('make extra sure that <a href="javascript:alert(1)">alert</a> is properly escaped', function() {
      assert.equal(sanitizeDescription('<a href="javascript:alert(1)">alert</a>'), '&lt;a href=\"javascript:alert(1)\"&gt;alert&lt;/a&gt;');
    });

  });

  describe('safely sanitize potential XSSAttackVectors', function() {

    window.xss = function(msg) {
      throw new Error('XSS slipped through with the message: ' + msg);
    };

    Object.keys(xssAttackVectors).forEach(function(xssAttackVectorName) {

      var xssAttackVector = xssAttackVectors[xssAttackVectorName];
      it(xssAttackVectorName, function() {
        assert.equal(isSafe(sanitizeDescription(xssAttackVector)), true);
      });

    });
  });


});
