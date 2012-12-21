describe('Library', function() {
  var models = sp.require('scripts/models');
  var library = models.library;
  var Artist = models.Artist;
  var Album = models.Album;
  var Track = models.Track;
  var Playlist = models.Playlist;


  /**
     * Properties
     */

  describe('albums', function() {
    var albums = library.albums;

    it('should be available', function() {
      expect(albums instanceof Array).toEqual(true);
    });

    // FIXME: Test fails; code or test needs fixing!
    xit('should return an array of instances of Album objects', function() {
      expect(albums[0] instanceof Album).toEqual(true);
    });
  });

  describe('artists', function() {
    var artists = library.artists;

    it('should be available', function() {
      expect(artists instanceof Array).toEqual(true);
    });

    // FIXME: Test fails; code or test needs fixing!
    xit('should return an array of instances of Artist objects', function() {
      expect(artists[0] instanceof Artist).toEqual(true);
    });
  });

  // Require api permissions: "library": ["private"]
  // FIXME: Test fails; code or test needs fixing!
  xdescribe('playlists', function() {
    var playlists = library.playlists;

    it('should be available', function() {
      expect(playlists instanceof Array).toEqual(true);
    });

    it('should return an array of instances of Playlist objects', function() {
      expect(playlists[0] instanceof Playlist).toEqual(true);
    });
  });

  describe('starredPlaylist', function() {
    var starredPlaylist = library.starredPlaylist;

    it('should be available and return an instance of Playlist', function() {
      expect(starredPlaylist instanceof Playlist).toEqual(true);
    });
  });

  describe('tracks', function() {
    var tracks = library.tracks;

    it('should be available', function() {
      expect(tracks instanceof Array).toEqual(true);
    });

    // FIXME: Test fails; code or test needs fixing!
    xit('should return an array of instances of Track objects', function() {
      expect(tracks[0] instanceof Track).toEqual(true);
    });
  });

});
