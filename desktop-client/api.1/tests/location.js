require(['$api/location'], function(location) {
  mocha.setup('bdd');

  describe('Geolocation API', function() {
    it('should be possible to query for the current location', function(onDone) {
      var loc = location.Location.query();
      loc.load(['accuracy', 'latitude', 'longitude'])
          .done(function(loc) {
            onDone();
          });
    });
  });
});
