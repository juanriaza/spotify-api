describe('Toplist', function() {
  var models = sp.require('scripts/models');
  var Toplist = models.Toplist;
  var EVENT = models.EVENT;
  var toplist;

  var getToplist = function(options, cb) {
    var resultsFetched = false;
    var callback = function() {
      resultsFetched = true;
      toplist.ignore(EVENT.CHANGE, callback);
    };

    if (options.matchType) {
      toplist.matchType = options.matchType;
    }
    if (options.region) {
      toplist.region = options.region;
    }
    if (options.userName) {
      toplist.userName = options.userName;
    }
    toplist.observe(EVENT.CHANGE, callback);
    toplist.run();

    waitsFor(function() {
      return resultsFetched;
    }, 'results to be fetched', 5000);

    runs(function() {
      cb(toplist.results);
    });
  };


  /**
     * Static methods and properties
     */
  it('should be instantiable', function() {
    toplist = new Toplist();
    expect(toplist instanceof Toplist).toEqual(true);
  });


  /**
     * Instance methods and properties
     */
  describe('Toplist instances', function() {

    it('should allow to set the match type', function() {
      expect(toplist.matchType).toBeDefined();

      getToplist({
        matchType: models.TOPLISTMATCHES.ARTISTS
      }, function(results) {
        expect(results instanceof Array).toEqual(true);
      });
    });

    it('should allow to set the geographical region to get results for', function() {
      expect(toplist.region).toBeDefined();

      getToplist({
        matchType: models.TOPLISTMATCHES.ARTISTS,
        region: 'SE'
      }, function(results) {
        expect(results instanceof Array).toEqual(true);
      });
    });

    it('should allow to set a username to get results for', function() {
      expect(toplist.userName).toBeDefined();

      getToplist({
        matchType: models.TOPLISTMATCHES.ARTISTS,
        userName: 'webkittest'
      }, function(results) {
        expect(results instanceof Array).toEqual(true);
      });
    });

    it('should return results to the toplist object', function() {
      expect(toplist.results).toBeDefined();
    });

    it('should indicate if the results are currently being fetched or not', function() {
      expect(toplist.running).toBeDefined();
    });

    it('should inherit ignore() from Observable', function() {
      expect(typeof toplist.ignore === 'function').toEqual(true);
    });

    it('should inherit notify() from Observable', function() {
      expect(typeof toplist.notify === 'function').toEqual(true);
    });

    it('should inherit observe() from Observable', function() {
      expect(typeof toplist.observe === 'function').toEqual(true);
    });

    it('should have a method to get the results for the current settings', function() {
      expect(typeof toplist.run === 'function').toEqual(true);
    });

  });
});
