require(['$api/models'], function(models) {
  /**
   * @class Location
   * @classdesc An object containing location information for the current session.
   * @since 1.0.0
   *
   * @property {number} accuracy The accuracy level of the latitude and longitude coordinates in meters.
   * @property {number} latitude Geographic latitude, specified in decimal degrees.
   * @property {number} longitude Geographic longitude, specified in decimal degrees.
   * @example
   * var loc = location.Location.query();
   * loc.load(['latitude']).done(function(loc) {
   *   console.log("Latitude: " + loc.latitude);
   * });
   */
  function Location() {
    models.Loadable.call(this);
  }
  SP.inherit(Location, models.Loadable);

  models.Loadable.define(Location, [
    'accuracy',
    'latitude',
    'longitude'
  ], '_query');

  Location.prototype._query = function(props_mask) {
    var load = function(data) { this.resolveMany(props_mask, data); };
    var fail = function(oops) { this.resolveFail(props_mask, oops); };
    SP.request('location_query', [], this, load, fail);
  };

  Location.query = function() {
    return new Location();
  };

  exports.Location = Location;
});
