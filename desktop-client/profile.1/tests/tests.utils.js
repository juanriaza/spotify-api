require([
  '$profile/profile-utils',
  '$test-utils/assert'
], function(Target, assert) {

  var testUser = {
    currentUser: false,
    identifier: '2b276a1713e133aba9aa5d366b09b1e38277bcd2',
    image: 'spotify:image:2b276a1713e133aba9aa5d366b09b1e38277bcd2',
    name: 'Curated by Spotify',
    subscribed: false,
    uri: 'spotify:user:spotify',
    username: 'spotify'
  };

  mocha.setup('bdd');

  describe('test link type helper', function() {
    var linkTarget;

    beforeEach(function() {
      linkTarget = Target.linkTypeHelper;
    });

    it('is starred playlist', function() {
      assert.equal(true, linkTarget.isStarredPlaylist('spotify:user:spotify:starred'));
      assert.equal(true, linkTarget.isStarredPlaylist('spotify:user:spotify:publishedstarred'));
      assert.equal(false, linkTarget.isStarredPlaylist('spotify:user:spotify'));
    });

    it('is toplist', function() {
      assert.equal(true, linkTarget.isToplist('spotify:user:spotify:toplist'));
      assert.equal(false, linkTarget.isToplist('spotify:user:spotify:publishedstarred'));
    });

    it('is track', function() {
      assert.equal(true, linkTarget.isTrack('spotify:track:2s5j2PTrKA08NUnyUJDgiG'));
      assert.equal(false, linkTarget.isTrack('spotify:user:spotify:publishedstarred'));
    });

    it('is playlist', function() {
      assert.equal(true, linkTarget.isPlaylist('spotify:user:labelrelations:playlist:2bfz2UXVym6LqnYLGhOY19'));
      assert.equal(false, linkTarget.isPlaylist('spotify:track:2s5j2PTrKA08NUnyUJDgiG'));
    });

    it('is album', function() {
      assert.equal(true, linkTarget.isAlbum('spotify:album:2cRMVS71c49Pf5SnIlJX3U'));
      assert.equal(false, linkTarget.isAlbum('spotify:user:spotify:toplist'));
    });

    it('is artist', function() {
      assert.equal(true, linkTarget.isArtist('spotify:artist:3iOvXCl6edW5Um0fXEBRXy'));
      assert.equal(false, linkTarget.isArtist('spotify:album:2cRMVS71c49Pf5SnIlJX3U'));
    });

    it('is user', function() {
      assert.equal(true, linkTarget.isUser('spotify:user:daniel'));
      assert.equal(false, linkTarget.isUser('spotify:album:2cRMVS71c49Pf5SnIlJX3U'));
      assert.equal(false, linkTarget.isUser('spotify:user:labelrelations:playlist:2bfz2UXVym6LqnYLGhOY19'));
      assert.equal(false, linkTarget.isUser('spotify:user:spotify:toplist'));
      assert.equal(false, linkTarget.isUser('spotify:user:spotify:starred'));
      assert.equal(false, linkTarget.isUser('spotify:user:spotify:publishedstarred'));
    });
  });

});
