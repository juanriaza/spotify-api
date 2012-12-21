describe('Track', function() {
  var models = sp.require('scripts/models');
  var Track = models.Track;
  var Album = models.Album;
  var Artist = models.Artist;
  var track;


  /**
     * Static methods and properties
     */

  it('should be able to create a new instance without callback', function() {
    expect(typeof Track.fromURI === 'function').toEqual(true);

    var track = Track.fromURI('spotify:track:6JEK0CvvjDjjMUBFoXShNZ');
    waitsFor(function() {
      return track.loaded;
    }, 'track data to get fetched', 1000);

    runs(function() {
      expect(track.data.type).toEqual('track');
      expect(track.loaded).toEqual(true);
    });
  });

  it('should be able to create a new instance with callback', function() {
    expect(typeof Track.fromURI === 'function').toEqual(true);

    var callback = jasmine.createSpy();

    var track = Track.fromURI('spotify:track:6JEK0CvvjDjjMUBFoXShNZ', callback);

    waitsFor(function() {
      return track.loaded;
    }, 'track data to get fetched', 1000);

    runs(function() {
      expect(callback).toHaveBeenCalledWith(track);
      expect(track.data.type).toEqual('track');
      expect(track.loaded).toEqual(true);
    });
  });


  /**
     * Instance methods and properties
     */

  describe('Track instances', function() {
    var track;

    it('should be able to be created', function() {
      track = Track.fromURI('spotify:track:6JEK0CvvjDjjMUBFoXShNZ');

      waitsFor(function() {
        return track.loaded;
      }, 'track to be loaded', 5000);

      runs(function() {
        expect(track.loaded).toEqual(true);
      });
    });

    it('should provide the album of the track', function() {
      expect(track.album instanceof Album).toEqual(true);
    });

    it('should provide the artists of the track', function() {
      expect(track.artists instanceof Array).toEqual(true);
      expect(track.artists[0] instanceof Artist).toEqual(true);
    });

    it('should indicate whether the track is playable or not', function() {
      expect(track.playable).toBeDefined();
    });

    it('should provide the duration of the track', function() {
      expect(track.duration).toBeDefined();
    });

    it('should provide an image representing the track', function() {
      expect(track.image).toBeDefined();
    });

    it('should indicate whether the track is loaded or not', function() {
      expect(track.loaded).toBeDefined();
    });

    it('should provide the name of the track', function() {
      expect(track.name).toBeDefined();
    });

    it('should provide the popularity of the track', function() {
      expect(track.popularity).toBeDefined();
    });

    it('should allow getting/setting the star status of the track', function() {
      expect(track.starred).toBeDefined();

      var oldValue = track.starred;
      track.starred = !oldValue;
      expect(track.starred !== oldValue).toEqual(true);
      track.starred = oldValue;
    });

    it('should provide the uri of the track', function() {
      expect(track.uri).toBeDefined();
    });

    it('should have a toString method that returns a string', function() {
      expect(track.toString).toBeDefined();

      expect(typeof track.toString() === 'string').toEqual(true);
    });

  });
});
