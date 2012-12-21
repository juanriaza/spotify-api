require(['$api/models'], function(models) {

  var Loadable = models.Loadable;
  var Collection = models.Collection;
  var Album = models.Album;
  var Artist = models.Artist;
  var Playlist = models.Playlist;
  var Track = models.Track;
  var session = models.session;

  /**
   * @class Toplist
   * @classdesc A top list represents the favorite albums, artists, playlists,
   * or tracks for a given user or region. To create a top list instance, use
   * one of the provided static methods. The albums, artists, playlists or
   * tracks are collections, so to get access to the items take a snapshot.
   * Since the top lists will never contain large number of items, it is ok to
   * snapshot the entire collection without paging.
   *
   * Note that not all combinations of top items are supported. For instance,
   * top playlists are only currently available for a user, not for a region or
   * the world.
   * @since 1.0.0
   *
   * @property {Collection} albums A collection of top abums.
   * @property {Collection} artists A collection of top artists.
   * @property {Collection} tracks A collection of top tracks.
   * @property {Collection} playlists A collection of top (most subscribed-to) playlists.
   *
   * @example
   * var list = toplist.Toplist.forCurrentUser();
   * list.tracks.snapshot().done(function(tracks) {
   *   for (var i = 0; i < tracks.length; i++)
   *     doSomethingWithTopTrack(tracks.get(i));
   * });
   */
  function Toplist(request, argument, prefix, suffix) {
    Loadable.call(this);
    this.resolve('uri', prefix + 'tracks' + suffix);
    this.resolve('albums', new Collection(Album, request + '_albums', prefix + 'albums' + suffix, argument));
    this.resolve('artists', new Collection(Artist, request + '_artists', prefix + 'artists' + suffix, argument));
    this.resolve('tracks', new Collection(Track, request + '_tracks', prefix + 'tracks' + suffix, argument));
    this.resolve('playlists', new Collection(Playlist, request + '_playlists', prefix + 'playlists' + suffix, argument));
  }

  SP.inherit(Toplist, Loadable);

  Loadable.define(Toplist, [
    'albums',
    'artists',
    'tracks',
    'playlists',
    'uri'
  ]);

  /**
   * Returns a top list for the current user.
   *
   * @function
   * @name Toplist#forCurrentUser
   * @since 1.0.0
   * @return {Toplist} The toplist.
   */
  Toplist.forCurrentUser = function() {
    // Normally all users of the API are required to always load a property
    // before it can be used. We break this rule here so that we can return a
    // toplist object immediately instead of returning a promise. Since this
    // module is part of the API itself we can break rules like this, but must
    // be careful to make sure that it remains true in the future.
    var prefix = session.user.uri + ':top:';
    var suffix = '';
    return new this('toplist_user', session.user.uri, prefix, suffix);
  };

  /**
   * Returns a top list for a given user. If the user has chosen to not publish
   * the top tracks, albums or artists, the collections in the top list will be
   * empty.
   *
   * @function
   * @name Toplist#forUser
   * @since 1.0.0
   * @param {User} user The user whose top list to return.
   * @return {Toplist} The toplist.
   */
  Toplist.forUser = function(user) {
    var prefix = (user.uri + ':top:');
    var suffix = '';
    return new this('toplist_user', user.uri, prefix, suffix);
  };

  /**
   * Returns the top list for all users of Spotify.
   *
   * @function
   * @name Toplist#forWorld
   * @since 1.0.0
   * @return {Toplist} The toplist.
   */
  Toplist.forWorld = function() {
    var prefix = 'spotify:top:';
    var suffix = '';
    return new this('toplist_region', 'global', prefix, suffix);
  };

  /**
   * Returns the top list for region of the current user.
   *
   * @function
   * @name Toplist#forCurrentRegion
   * @since 1.0.0
   * @return {Toplist} The toplist.
   */
  Toplist.forCurrentRegion = function() {
    var prefix = 'spotify:top:';
    var suffix = ':country:USER';
    return new this('toplist_region', null, prefix, suffix);
  };

  /**
   * Returns the top list for all users of Spotify in a given region. The region
   * must be specified using the two-letter ISO 3166-1 country code, in all
   * capital letters.
   *
   * @function
   * @name Toplist#forRegion
   * @since 1.0.0
   * @param {string} region the region code.
   * @return {Toplist} The toplist.
   * @see <a href="http://en.wikipedia.org/wiki/ISO_3166-1">Wikipedia: ISO 3166-1</a>
   */
  Toplist.forRegion = function(region) {
    var prefix = 'spotify:top:';
    var suffix = ':country:' + region;
    return new this('toplist_region', region, prefix, suffix);
  };

  /**
   * Returns the top list for a given artist, for all regions or in a given
   * region. Only the top tracks and albums are available. Asking for the top
   * artists will result in an error. The region must be specified using the
   * two-letter ISO 3166-1 country code, in all capital letters.
   *
   * @function
   * @name Toplist#forArtist
   * @since 1.0.0
   * @param {Artist} artist The artist.
   * @param {string} region the region code.
   * @return {Toplist} The toplist.
   * @see <a href="http://en.wikipedia.org/wiki/ISO_3166-1">Wikipedia: ISO 3166-1</a>
   */
  Toplist.forArtist = function(artist, region) {
    var prefix = (artist.uri + ':top:');
    var suffix = (region ? ':country:' + region : '');
    return new this('toplist_artist', artist.uri, prefix, suffix);
  };

  exports.Toplist = Toplist;

});
