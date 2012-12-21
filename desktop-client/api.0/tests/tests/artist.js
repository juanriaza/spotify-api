describe('Artist', function() {
  var models = sp.require('scripts/models');
  var Artist = models.Artist;


  /**
     * Static methods and properties
     */

  it('should be able to create a new instance without callback', function() {
    expect(typeof Artist.fromURI === 'function').toEqual(true);

    var artist = Artist.fromURI('spotify:artist:0gxyHStUsqpMadRV0Di1Qt');
    waitsFor(function() {
      return artist.loaded;
    }, 'artist data to get fetched', 1000);

    runs(function() {
      expect(artist.data.type).toEqual('artist');
      expect(artist.loaded).toEqual(true);
    });
  });

  it('should be able to create a new instance with callback', function() {
    expect(typeof Artist.fromURI === 'function').toEqual(true);

    var callback = jasmine.createSpy();

    var artist = Artist.fromURI('spotify:artist:0gxyHStUsqpMadRV0Di1Qt', callback);

    waitsFor(function() {
      return artist.loaded;
    }, 'artist data to get fetched', 1000);

    runs(function() {
      expect(callback).toHaveBeenCalledWith(artist);
      expect(artist.data.type).toEqual('artist');
      expect(artist.loaded).toEqual(true);
    });
  });


  /**
     * Instance methods and properties
     */
  describe('Artist instances', function() {
    var artist;

    it('should be able to be created', function() {
      artist = Artist.fromURI('spotify:artist:0gxyHStUsqpMadRV0Di1Qt');

      waitsFor(function() {
        return artist.loaded;
      }, 'album data to get fetched', 1000);

      runs(function() {
        expect(artist.loaded).toEqual(true);
      });
    });

    it('should give access to an image property for cover image', function() {
      expect(artist.image).toBeDefined();
    });

    it('should give access to the name of the artist', function() {
      expect(artist.name).toBeDefined();
    });

    it('should give access to the URI for the artist', function() {
      expect(artist.uri).toBeDefined();
    });

    it('should have a toString method that returns a string', function() {
      expect(artist.toString).toBeDefined();

      expect(typeof artist.toString() === 'string').toEqual(true);
    });
  });
});
