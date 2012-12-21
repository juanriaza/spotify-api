describe('Search', function() {
  var models = sp.require('scripts/models');
  var Search = models.Search;
  var EVENT = models.EVENT;
  var search;

  var doSearch = function(query, options, cb) {

    var resultsFetched = false;
    var callback = function() {
      resultsFetched = true;
    };

    var search = new Search(query, options);

    search.observe(EVENT.CHANGE, callback);
    search.appendNext();

    waitsFor(function() {
      return resultsFetched;
    }, 'results to be fetched', 30000);

    runs(function() {
      cb(search);
      search.ignore(EVENT.CHANGE, callback);
    });
  };


  /**
     * Static methods and properties
     */

  it('should be able to perform a search', function() {
    search = new Search('Rick Astley');

    var callback = jasmine.createSpy();

    search.observe(EVENT.CHANGE, callback);

    waitsFor(function() {
      return callback.wasCalled;
    }, 'search to get the results', 30000);

    runs(function() {
      expect(search.tracks.length > 0).toEqual(true);
      search.ignore(EVENT.CHANGE, callback);
    });

    search.appendNext();
  });


  /**
     * Instance methods and properties
     */
  describe('Searches', function() {

    it('should provide a way to get/set the number of items per page', function() {
      doSearch('Rick Astley', {
        pageSize: 10
      }, function(search) {
        expect(search.tracks.length).toEqual(10);
      });
    });

    it('should provide a setting for including/excluding albums from results', function() {
      doSearch('Rick Astley', {
        searchAlbums: false
      }, function(search) {
        expect(search.searchAlbums).toEqual(false);
        expect(search.albums.length).toEqual(0);
      });
    });

    it('should provide a setting for including/excluding artists from results', function() {
      doSearch('Rick Astley', {
        searchArtists: false
      }, function(search) {
        expect(search.searchArtists).toEqual(false);
        expect(search.artists.length).toEqual(0);
      });
    });

    it('should provide a setting for including/excluding tracks from results', function() {
      doSearch('Rick Astley', {
        searchTracks: false
      }, function(search) {
        expect(search.searchTracks).toEqual(false);
        expect(search.tracks.length).toEqual(0);
      });
    });

    it('should provide a setting for including/excluding playlists from results', function() {
      doSearch('Rick Astley', {
        searchPlaylists: false
      }, function(search) {
        expect(search.searchPlaylists).toEqual(false);
        expect(search.playlists.length).toEqual(0);
      });
    });

    it('should provide a setting for how local files are added to the results', function() {
      expect(search.localResults).toBeDefined();
    });

    it('should provide a setting for the search type (normal or live search)', function() {
      expect(search.searchType).toBeDefined();
    });

    it('should provide the query', function() {
      expect(search.query).toEqual('Rick Astley');
    });

    it('should provide the results for tracks', function() {
      expect(search.tracks instanceof Array).toEqual(true);
    });

    it('should provide the results for albums', function() {
      expect(search.albums instanceof Array).toEqual(true);
    });

    it('should provide the results for artists', function() {
      expect(search.artists instanceof Array).toEqual(true);
    });

    it('should provide the results for playlists', function() {
      expect(search.playlists instanceof Array).toEqual(true);
    });

    it('should provide a flag to indicate if the search is currently running', function() {
      expect(search.running).toBeDefined();
    });

    it('should provide the total number of album results', function() {
      expect(search.totalAlbums).toBeDefined();
    });

    it('should provide the total number of artists results', function() {
      expect(search.totalArtists).toBeDefined();
    });

    it('should provide the total number of tracks results', function() {
      expect(search.totalTracks).toBeDefined();
    });

    it('should provide the total number of playlists results', function() {
      expect(search.totalPlaylists).toBeDefined();
    });

    it('should inherit ignore() from Observable', function() {
      expect(typeof search.ignore === 'function').toEqual(true);
    });

    it('should inherit notify() from Observable', function() {
      expect(typeof search.notify === 'function').toEqual(true);
    });

    it('should inherit observe() from Observable', function() {
      expect(typeof search.observe === 'function').toEqual(true);
    });

    it('should have a method to get the next page of results', function() {
      expect(typeof search.appendNext === 'function').toEqual(true);
    });

  });
});
