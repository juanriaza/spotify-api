require([
  '$test-utils/assert',
  '$api/models',
  '$views/list#List'
], function(assert, models, List) {
  mocha.setup('bdd');

  var playlist = models.Playlist.fromURI('spotify:user:spotify:playlist:2p9jkSudWhl1Go1z0sWdPG');

  describe('List', function() {

    describe('Factory methods', function() {

      it('should be possible to create a list instance for a collection', function() {
        playlist.load('tracks').done(function() {
          var list = List.forCollection(playlist.tracks);
          assert.equal(list instanceof List, true);
        });
      });

    });

  });

});
