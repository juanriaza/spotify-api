require([
  '$api/models',
  '/scripts/onemoretime',
  '/scripts/logger#Logger'
], function(models, omt, Logger) {

  var logger = new Logger();
  var CURRENT_YEAR = new Date().getFullYear();

  /**
   * Filters and batches the snapshot loading of a collection of albums.
   * Also contains logic for retrying.
   *
   * @param {api/models~Artist} artist The artist associated with the snapshot,
   *   used for collectiong log metrics on performance.
   * @param {Function} snapshotSource A function returning a collection.
   * @param {AlbumsSnapshot.Metric=} opt_metric An optional metric to use for
   *   scoring, defaulting to scoring by year.
   *
   */
  function AlbumsSnapshot(artist, snapshotSource, opt_metric) {
    this.artist = artist;
    this.objectsSnapshot = null;
    this.snapshotSource = snapshotSource;
    this.uris = {};
    this._selectCandidate = opt_metric ? opt_metric : AlbumsSnapshot.Metric.RELEASE_YEAR;
  };
  SP.inherit(AlbumsSnapshot, models.Observable);

  AlbumsSnapshot.prototype.destroy = function() {};

  /**
   * Returns at most 'length' items starting at offset 'offset' from the
   * collection. Filters for playable albums and scores according to the
   * specifed scoring metric.
   */
  AlbumsSnapshot.prototype.get = function(offset, length) {
    var objectsPromise = new models.Promise;
    if (this.objectsSnapshot && offset > this.objectsSnapshot.length) {
      objectsPromise.setDone([]);
    } else {
      this._getObjects(offset, length).done(this, function(snapshot) {
        this._onSnapshot(snapshot).done(this, function(albums) {
          objectsPromise.setDone({
            albums: albums,
            next: offset + length,
            done: offset + length > this.objectsSnapshot.length
          });
        });
      });
    }
    return objectsPromise;
  };

  AlbumsSnapshot.prototype._getObjects = function(offset, length) {
    var objectPromise = new models.Promise, snapPromise = null;
    if (this.objectsSnapshot === null) {
      var retryableSource = omt.snapshotWithRetry(this.snapshotSource());
      snapPromise = retryableSource.snapshot().done(this, function(snap) {
        this.dispatchEvent({ type: 'first-snapshot', data: snap });
        // snapshot.toArray is generally fairly expensive since it requires us
        // to bootstrap all objects. Since what we're dealing with here though
        // are Album Groups, and they are synthetic in the sense that they do
        // not have an URI, there's really no nice way around it.
        this.objectsSnapshot = snap.toArray();
      }).fail(this, function(_, err) {
        logger.clientEvent('snapshot-timeout-album',
            { artist: this.artist.uri,
              sectionOffset: this.offset,
              itemOffset: this.globalOffset,
              length: this.snapLen });
      });
    } else {
      snapPromise = new models.Promise;
      snapPromise.setDone();
    }
    snapPromise.done(this, function() {
      objectPromise.setDone(this.objectsSnapshot.slice(offset, offset + length));
    });
    return objectPromise;
  };

  AlbumsSnapshot.prototype._onSnapshot = function(snapshot) {
    var albumsPromise = new models.Promise, additional = {};
    this._getAvailableObjects(snapshot).done(this, function(array) {
      var loadables = array.map(function(albumInfo) {
        if (albumInfo) {
          additional[albumInfo.album.uri] = albumInfo.additional;
          var albumWithRetry = omt.loadableWithRetry(albumInfo.album);
          return albumWithRetry.load('name', 'image', 'playable', 'date', 'discs', 'tracks', 'uri');
        } else {
          var nullPromise = new models.Promise;
          nullPromise.setDone(null);
          return nullPromise;
        }
      });
      models.Promise.join(loadables).always(this, function(albumsOrNull, err) {
        var result = [], albums = albumsOrNull ? albumsOrNull : [];
        for (var i = 0, len = albums.length; i < len; i++) {
          if (albums[i] !== null) {
            this.uris[albums[i].uri] = true;
            result.push({ album: albums[i], additional: additional[albums[i].uri] });
          } else {
            result.push(null);
          }
        }
        result = result.sort(function(a, b) {
          if (a && b) {
            return b.album.date - a.album.date;
          } else if (a) {
            return 1;
          } else if (b) {
            return -1;
          } else {
            return 0;
          }
        });
        albumsPromise.setDone(result);
      });
    });
    return albumsPromise;
  };

  AlbumsSnapshot.prototype._getAvailableObjects = function(snapshot) {
    var result = [], done = new models.Promise(result), albumLoads = [];
    for (var i = 0, len = snapshot.length; i < len; i++) {
      albumLoads.push(snapshot[i].load('albums'));
    }
    models.Promise.join(albumLoads).always(this, function(groups, error) {
      var groupings = [];
      var len = groups !== undefined ? groups.length : 0;
      for (var i = 0; i < len; i++) {
        groupings.push(this._getPlayableAlbum(groups[i]));
      }
      models.Promise.join(groupings).always(function(albums, error) {
        var len = albums !== undefined ? albums.length : 0;
        for (var i = 0; i < len; i++) {
          var album = albums[i];
          if (album) {
            result.push(album);
          } else {
            result.push(null);
          }
        }
        done.setDone();
      });
    });
    return done;
  };

  AlbumsSnapshot.prototype._loadPlayable = function(albumGroup) {
    var albumPromises = albumGroup.albums.map(function(album) {
      // No need to retry the load since playable is part of artist response
      return album.load('playable');
    });
    return models.Promise.join(albumPromises);
  };

  AlbumsSnapshot.prototype._getPlayableAlbum = function(albumGroup) {
    var albumCandidates = [], // Albums that are playable, that we should score
        validAlbumsPromise = new models.Promise, // Resolves to the best album
        defaultAlbum = null; // Used if only one album in the group

    if (albumGroup.albums.length > 0) {
      this._loadPlayable(albumGroup).each(this, function(album) {
        if (!!album.playable) {
          defaultAlbum = album;
          albumCandidates.push(this._scoreAlbumCandidate(album));
        }
      }).always(this, function() {
        if (albumCandidates.length === 1) {
          validAlbumsPromise.setDone({ album: defaultAlbum, additional: [] });
        } else {
          this._selectCandidate(albumCandidates)
            .done(this, function(album) {
                var otherAlbums = [];
                for (var i = 0, len = albumGroup.albums.length; i < len; i++) {
                  if (albumGroup.albums[i].uri != album.uri) {
                    otherAlbums.push(albumGroup.albums[i]);
                  }
                }
                validAlbumsPromise.setDone({ album: album, additional: otherAlbums });
              }).fail(validAlbumsPromise, validAlbumsPromise.setFail);
        }
      });
    } else {
      validAlbumsPromise.setFail();
    }
    return validAlbumsPromise;
  };

  /**
   * Selects the best album from a list of candidates.
   */
  AlbumsSnapshot.prototype._selectCandidateByScore = function(candidateArray) {
    var validAlbumsPromise = new models.Promise;
    models.Promise.join(candidateArray).always(this, function(scoredAlbums) {
      if (scoredAlbums === undefined || scoredAlbums.length === 0) {
        validAlbumsPromise.setFail();
      } else {
        var topAlbum = null, topScore = -1;
        for (var i = 0, len = scoredAlbums.length; i < len; i++) {
          if (scoredAlbums[i].score > topScore) {
            topAlbum = scoredAlbums[i].album;
            topScore = scoredAlbums[i].score;
          }
        }
        if (topAlbum !== null) {
          validAlbumsPromise.setDone(topAlbum);
        } else {
          validAlbumsPromise.setFail();
        }
      }
    });
    return validAlbumsPromise;
  };

  /**
   * Scoring currently based on a numerical score
   * defined as 4 * (currentYear - releaseYear) + tracksOnAlbum
   */
  AlbumsSnapshot.prototype._scoreAlbumCandidate = function(album) {
    var scorePromise = new models.Promise;
    var albumWithRetry = omt.loadableWithRetry(album);
    albumWithRetry.load('tracks', 'date').done(function(album) {
      album.tracks.snapshot(0, 0).done(function(snapshot) {
        var date = album.date.hasOwnProperty('year') ? album.date.year : album.date;
        var score = 4 * (CURRENT_YEAR - date) + snapshot.length;
        scorePromise.setDone({ album: album, score: score });
      });
    });
    return scorePromise;
  };

  /**
   * Available metrics to use when scoring albums.
   */
  AlbumsSnapshot.Metric = {
    /** Selects album based on the earliest release year and number of tracks */
    RELEASE_YEAR: AlbumsSnapshot.prototype._selectCandidateByScore,
    /** Selects the first album */
    FIRST_ALBUM: AlbumsSnapshot.prototype._selectFirstCandidate
  };

  exports.AlbumsSnapshot = AlbumsSnapshot;
});
