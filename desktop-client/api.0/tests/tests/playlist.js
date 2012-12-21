describe('Playlist', function() {
  var models = sp.require('scripts/models');
  var Link = models.Link;
  var Playlist = models.Playlist;
  var Track = models.Track;


  /**
     * Static methods and properties
     */

  it('should be able to create a new instance without callback', function() {
    expect(typeof Playlist.fromURI === 'function').toEqual(true);

    var playlist = Playlist.fromURI('spotify:user:webkittest:playlist:13eCJlyPz6Sq46YoQzumu5');

    waitsFor(function() {
      return playlist.loaded;
    }, 'playlist data to get fetched', 5000);

    runs(function() {
      expect(playlist.data.type).toEqual('playlist');
      expect(playlist.loaded).toEqual(true);
    });
  });

  it('should be able to create a new instance with callback', function() {
    expect(typeof Playlist.fromURI === 'function').toEqual(true);

    var callback = jasmine.createSpy();

    var playlist = Playlist.fromURI('spotify:user:webkittest:playlist:13eCJlyPz6Sq46YoQzumu5', callback);

    waitsFor(function() {
      return playlist.loaded;
    }, 'playlist data to get fetched', 5000);

    runs(function() {
      expect(callback).toHaveBeenCalledWith(playlist);
      expect(playlist.data.type).toEqual('playlist');
      expect(playlist.loaded).toEqual(true);
    });
  });

  /**
     * Instance methods and properties
     */
  describe('Playlist instances', function() {
    var playlist;

    it('should be able to be created', function() {

      playlist = Playlist.fromURI('spotify:user:webkittest:playlist:13eCJlyPz6Sq46YoQzumu5');

      waitsFor(function() {
        return playlist.loaded;
      }, 'playlist data to get fetched', 1000);

      runs(function() {
        expect(playlist.loaded).toEqual(true);
      });
    });

    it("should indicate whether it's collaborative or not", function() {
      expect(playlist.collaborative).toBeDefined();
    });

    // Require api permissions: "playlist": ["private"]
    // FIXME: Test fails; code or test needs fixing!
    xit('should provide the description of the playlist', function() {
      expect(playlist.description).toBeDefined();
    });

    it('should provide an image for the playlist', function() {
      expect(playlist.image).toBeDefined();
    });

    it('should provide the number of tracks within the playlist', function() {
      expect(playlist.length).toBeDefined();
    });

    it('should provide the name of the playlist', function() {
      expect(playlist.name).toBeDefined();
    });

    it('should provide the owner of the playlist', function() {
      expect(playlist.owner).toBeDefined();
    });

    it('should be able to tell if the current user subscribes to the playlist or not', function() {
      expect(playlist.subscribed).toBeDefined();
    });

    // Require api permissions: "playlist": ["private"]
    // FIXME: Test fails; code or test needs fixing!
    xit('should provide the number of subscribers for the playlist', function() {
      expect(playlist.subscribers).toBeDefined();
    });

    it('should provide all the tracks within the playlist', function() {
      expect(playlist.tracks).toBeDefined();
    });

    it('should provide the URI for the playlist', function() {
      expect(playlist.uri).toBeDefined();
    });

    it('should inherit ignore() from Observable', function() {
      expect(typeof playlist.ignore === 'function').toEqual(true);
    });

    it('should inherit notify() from Observable', function() {
      expect(typeof playlist.notify === 'function').toEqual(true);
    });

    it('should inherit observe() from Observable', function() {
      expect(typeof playlist.observe === 'function').toEqual(true);
    });

    // Adding tracks only work on playlists you own, or collaborative ones. This uses user webkittest
    it('should allow adding tracks to the playlist, by using a Track instance', function() {
      expect(typeof playlist.add === 'function').toEqual(true);

      var track = Track.fromURI('spotify:track:3m89sQ6cPOzN8BO7UnsB7M');

      waitsFor(function() {
        return track.loaded;
      }, 'track to be loaded', 5000);

      runs(function() {
        var oldLength = playlist.length;
        playlist.add(track);

        expect(playlist.length === oldLength + 1).toEqual(true);
      });
    });

    // Adding tracks only work on playlists you own, or collaborative ones. This uses user webkittest
    it('should allow adding tracks to the playlist, by using a Link instance', function() {
      expect(typeof playlist.add === 'function').toEqual(true);

      var oldLength = playlist.length;
      playlist.add(new Link('spotify:track:1j0q1Ljv4gdFYiwtw3vGPU'));

      expect(playlist.length === oldLength + 1).toEqual(true);
    });

    // Adding tracks only work on playlists you own, or collaborative ones. This uses user webkittest
    it('should allow adding tracks to the playlist, by using a URI string', function() {
      expect(typeof playlist.add === 'function').toEqual(true);

      var oldLength = playlist.length;
      playlist.add('spotify:track:5P3ILaZ7cQVf5QKT1v03aO');

      expect(playlist.length === oldLength + 1).toEqual(true);
    });

    // Removing tracks only work on playlists you own, or collaborative ones. This uses user webkittest
    it('should allow removing tracks from the playlist, by using a Track instance', function() {
      expect(typeof playlist.remove === 'function').toEqual(true);

      var track = Track.fromURI('spotify:track:3m89sQ6cPOzN8BO7UnsB7M');

      waitsFor(function() {
        return track.loaded;
      }, 'track to be loaded', 5000);

      runs(function() {
        var oldLength = playlist.length;
        playlist.remove(track);

        expect(playlist.length === oldLength - 1).toEqual(true);
      });
    });

    // Removing tracks only work on playlists you own, or collaborative ones. This uses user webkittest
    it('should allow removing tracks from the playlist, by using a Link instance', function() {
      expect(typeof playlist.remove === 'function').toEqual(true);

      var oldLength = playlist.length;
      playlist.remove(new Link('spotify:track:1j0q1Ljv4gdFYiwtw3vGPU'));

      expect(playlist.length === oldLength - 1).toEqual(true);
    });

    // Removing tracks only work on playlists you own, or collaborative ones. This uses user webkittest
    it('should allow removing tracks from the playlist, by using a URI string', function() {
      expect(typeof playlist.remove === 'function').toEqual(true);

      var oldLength = playlist.length;
      playlist.remove('spotify:track:5P3ILaZ7cQVf5QKT1v03aO');

      expect(playlist.length === oldLength - 1).toEqual(true);
    });

    // Removing tracks only work on playlists you own, or collaborative ones. This uses user webkittest
    it('should allow removing tracks from the playlist, by using an index', function() {
      expect(typeof playlist.remove === 'function').toEqual(true);

      playlist.add('spotify:track:5P3ILaZ7cQVf5QKT1v03aO');

      var oldLength = playlist.length;
      playlist.remove(oldLength - 1);

      expect(playlist.length === oldLength - 1).toEqual(true);
      expect(!!~playlist.indexOf('spotify:track:5P3ILaZ7cQVf5QKT1v03aO')).toEqual(false);
    });

    it('should provide a way to get the index of a certain track within the playlist', function() {
      expect(typeof playlist.indexOf === 'function').toEqual(true);

      var lastIndex = playlist.length - 1;

      playlist.add('spotify:track:5P3ILaZ7cQVf5QKT1v03aO');
      playlist.add('spotify:track:1j0q1Ljv4gdFYiwtw3vGPU');
      expect(playlist.indexOf('spotify:track:5P3ILaZ7cQVf5QKT1v03aO')).toEqual(lastIndex + 1);
      playlist.remove('spotify:track:1j0q1Ljv4gdFYiwtw3vGPU');
      playlist.remove('spotify:track:5P3ILaZ7cQVf5QKT1v03aO');
    });

    // FIXME: Test fails; code or test needs fixing!
    xit('should have a toString method that returns a string', function() {
      expect(playlist.toString).toBeDefined();

      expect(typeof playlist.toString() === 'string').toEqual(true);
    });

  });

});
