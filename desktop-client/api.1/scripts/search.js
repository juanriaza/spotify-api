require(['$api/models'], function(models) {

  var Loadable = models.Loadable;
  var Collection = models.Collection;
  var Album = models.Album;
  var Artist = models.Artist;
  var Playlist = models.Playlist;
  var Track = models.Track;

  /**
   * @class Search
   * @classdesc Search needs documentation.
   * @since 1.0.0
   *
   * @property {Collection} albums The albums matching the search query.
   * @property {Collection} artists The artists matching the search query.
   * @property {string} fuzzyMatch If the search did not return enough items,
   * this property will contain an alternate search query that might return
   * more items, e.g., searching for "Koldplay" will suggest "Coldplay" as a
   * fuzzy match. Note that this property is not always available, depending on
   * platforms and search query.
   * @property {Collection} playlists The playlists matching the search query.
   * @property {Collection} tracks The tracks matching the search query.
   * @property {string} query The search query.
   * @example
   * var my_search = search.Search.suggest("Mad");
   */
  function Search(prefix, query) {
    Loadable.call(this);
    var uri = 'spotify:search:' + encodeURIComponent(query).replace(/%20/g, '+');
    this.resolve('uri', uri);
    this.resolve('query', query);
    this.resolve('albums', new Collection(Album, prefix + '_albums', null, query));
    this.resolve('artists', new Collection(Artist, prefix + '_artists', null, query));
    this.resolve('playlists', new Collection(Playlist, prefix + '_playlists', null, query));
    this.resolve('tracks', new Collection(Track, prefix + '_tracks', uri, query));
  }

  SP.inherit(Search, Loadable);

  Loadable.define(Search, [
    'albums',
    'artists',
    'playlists',
    'query',
    'tracks',
    'uri'
  ]);

  Loadable.define(Search, [
    'fuzzyMatch'
  ], '_fuzzy');

  /**
   * Creates a search object for the given query. Be aware that there's no
   * substring matching taking place when using this function, i.e. searching
   * for "Radioh" will not result in any hits for "Radiohead" (but searching
   * for "Fiona" will result in hits for "Fiona Apple").<br />
   * <br />
   * For advanced search syntax, see:<br />
   * http://www.spotify.com/about/features/advanced-search-syntax/
   *
   * @function
   * @name Search#search
   * @param {string} query The query string to perform full match on.
   * @since 1.0.0
   * @see Search#suggest
   */
  Search.search = function(query) {
    return new this('search', query);
  };

  /**
   * Creates a suggestion object for the given query. The suggestion will return
   * results that partially matches the given query, i.e. "Radioh" will result
   * in hits for the artist "Radiohead" (among other artists and tracks with names
   * that contains the query string).<br />
   * Do note that the suggestion functionality only operates on the most popular
   * content in the Spotify catalogue - for full searches, use the search(query)
   * function.
   *
   * @function
   * @name Search#suggest
   * @since 1.0.0
   * @param {string} query The query string to perform partial match on.
   * @see Search#search
   */
  Search.suggest = function(query) {
    return new this('suggest', query);
  };

  Search.prototype._fuzzy = function(props_mask) {
    var load = function(data) { this.resolveMany(props_mask, data); };
    var fail = function(oops) { this.resolveFail(props_mask, oops); };
    SP.request('search_fuzzy_match', [this.query], this, load, fail);
  };

  exports.Search = Search;

});
