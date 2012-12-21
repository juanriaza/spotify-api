describe('Album', function() {
  var models = sp.require('scripts/models');
  var Album = models.Album;
  var Track = models.Track;


  /**
     * Static methods and properties
     */

  it('should be able to create a new instance without callback', function() {
    expect(typeof Album.fromURI === 'function').toEqual(true);

    var album = Album.fromURI('spotify:album:2mCuMNdJkoyiXFhsQCLLqw');
    waitsFor(function() {
      return album.loaded;
    }, 'album data to get fetched', 1000);

    runs(function() {
      expect(album.data.type).toEqual('album');
      expect(album.loaded).toEqual(true);
    });
  });

  it('should be able to create a new instance with callback', function() {
    expect(typeof Album.fromURI === 'function').toEqual(true);

    var callback = jasmine.createSpy();

    var album = Album.fromURI('spotify:album:2mCuMNdJkoyiXFhsQCLLqw', callback);

    waitsFor(function() {
      return callback.wasCalled;
    }, 'album data to get fetched', 1000);

    runs(function() {
      expect(callback).toHaveBeenCalledWith(album);
      expect(album.data.type).toEqual('album');
      expect(album.loaded).toEqual(true);
    });
  });


  /**
     * Instance methods and properties
     */
  describe('Album instances', function() {
    var album;

    it('should be able to be created', function() {
      album = Album.fromURI('spotify:album:2mCuMNdJkoyiXFhsQCLLqw');

      waitsFor(function() {
        return album.loaded;
      }, 'album data to get fetched', 1000);

      runs(function() {
        expect(album.loaded).toEqual(true);
      });
    });

    it('should give access to the artist data', function() {
      expect(album.artist).toBeDefined();
    });

    it('should give information about if the album is playable or not', function() {
      expect(album.playable).toBeDefined();
    });

    it('should give access to the URI for a cover image', function() {
      expect(album.image).toBeDefined();
    });

    it('should give information about the number of tracks in the album', function() {
      expect(album.length).toBeDefined();
    });

    it('should give access to the name of the album', function() {
      expect(album.name).toBeDefined();
    });

    it('should give access to the tracks data', function() {
      expect(album.tracks).toBeDefined();
    });

    it('should give access to the URI of the album', function() {
      expect(album.uri).toBeDefined();
    });

    it('should offer a way to get only a range of tracks', function() {
      expect(album.getRange).toBeDefined();

      var tracks = album.getRange(2, 3);

      expect(tracks instanceof Array).toEqual(true);
      expect(tracks.length).toEqual(3);
      expect(tracks[0] instanceof Track).toEqual(true);
    });

    it('should offer a way to get only one track from the album', function() {
      expect(album.get).toBeDefined();

      var track = album.get(3);

      expect(track instanceof Track).toEqual(true);
    });

    it('should have a toString method that returns a string', function() {
      expect(album.toString).toBeDefined();

      expect(typeof album.toString() === 'string').toEqual(true);
    });
  });

});
