require([
  '$shared/scripts/select#parseSelector',
  '$test-utils/assert'
], function(parseSelector, assert) {
  mocha.setup('bdd');

  describe('parse selectors', function() {
    describe('simple', function() {
      it('should parse "name"', function() {
        assert.deepEqual(parseSelector('name'), [{
          name: 'name'
        }]);
      });

      it('should parse "owner.name"', function() {
        assert.deepEqual(parseSelector('owner.name'), [{
          name: 'owner',
          properties: [{
            name: 'name'
          }]
        }]);
      });
    });

    describe('groups', function() {
      it('should parse "{ name, image }"', function() {
        assert.deepEqual(parseSelector('{ name, image }'), [{
          name: 'name'
        }, {
          name: 'image'
        }]);
      });

      it('should parse "name, image"', function() {
        assert.deepEqual(parseSelector('name, image'), [{
          name: 'name'
        }, {
          name: 'image'
        }]);
      });

      it('should parse "owner.{ name, image }"', function() {
        assert.deepEqual(parseSelector('owner.{ name, image }'), [{
          name: 'owner',
          properties: [{
            name: 'name'
          }, {
            name: 'image'
          }]
        }]);
      });

      it('should parse ["name", "image"]', function() {
        assert.deepEqual(parseSelector(['name', 'image']), [{
          name: 'name'
        }, {
          name: 'image'
        }]);
      });

      it('should parse "{ l1p1.{ l2p1.{ l3p1, l3p2 }, l2p2 }, l1p2.{ l2p3 }}"', function() {
        assert.deepEqual(parseSelector('{ l1p1.{ l2p1.{ l3p1, l3p2 }, l2p2 }, l1p2.{ l2p3 }}'), [{
          name: 'l1p1',
          properties: [{
            name: 'l2p1',
            properties: [{
              name: 'l3p1'
            }, {
              name: 'l3p2'
            }]
          }, {
            name: 'l2p2'
          }]
        }, {
          name: 'l1p2',
          properties: [{
            name: 'l2p3'
          }]
        }]);
      });
    });

    describe('collections', function() {
      it('should parse "tracks[0]"', function() {
        assert.deepEqual(parseSelector('tracks[0]'), [{
          name: 'tracks',
          slice: true,
          start: 0,
          end: 1
        }]);
      });

      it('should parse "tracks[]"', function() {
        assert.deepEqual(parseSelector('tracks[]'), [{
          name: 'tracks',
          slice: true,
          start: 0,
          end: Infinity
        }]);
      });

      it('should parse "tracks[0..10]"', function() {
        assert.deepEqual(parseSelector('tracks[0..10]'), [{
          name: 'tracks',
          slice: true,
          start: 0,
          end: 10
        }]);
      });

      it('should parse "tracks[0...10]"', function() {
        assert.deepEqual(parseSelector('tracks[0...10]'), [{
          name: 'tracks',
          slice: true,
          start: 0,
          end: 11
        }]);
      });

      it('should parse "tracks[10..]"', function() {
        assert.deepEqual(parseSelector('tracks[10..]'), [{
          name: 'tracks',
          slice: true,
          start: 10,
          end: Infinity
        }]);
      });
    });

    describe('real world', function() {
      it('should parse "playlists[0..5].{name, image, uri, subscribers.length, owner.{name, username, uri}}"', function() {
        assert.deepEqual(parseSelector('playlists[0..5].{name, image, uri, subscribers.length, owner.{name, username, uri}}'), [{
          name: 'playlists',
          slice: true,
          start: 0,
          end: 5,
          properties: [{
            name: 'name'
          }, {
            name: 'image'
          }, {
            name: 'uri'
          }, {
            name: 'subscribers',
            properties: [{
              name: 'length'
            }]
          }, {
            name: 'owner',
            properties: [{
              name: 'name'
            }, {
              name: 'username'
            }, {
              name: 'uri'
            }]
          }]
        }]);
      });

      it('should parse "tracks[0..10].{ image, artists[].image }"', function() {
        assert.deepEqual(parseSelector('tracks[0..10].{ image, artists[].image }'), [{
          name: 'tracks',
          slice: true,
          start: 0,
          end: 10,
          properties: [{
            name: 'image'
          }, {
            name: 'artists',
            slice: true,
            start: 0,
            end: Infinity,
            properties: [{
              name: 'image'
            }]
          }]
        }]);
      });
    });

    describe('handle malformed', function() {
      it('should fail on "{ unclosed, group"', function() {
        assert.throws(function() { parseSelector('{ unclosed, group') }, SyntaxError);
      });

      it('should fail on "unstarted, group }"', function() {
        assert.throws(function() { parseSelector('unstarted, group }') }, SyntaxError);
      });

      it('should fail on "åäö"', function() {
        assert.throws(function() { parseSelector('åäö') }, SyntaxError);
      });
    });
  });
});
