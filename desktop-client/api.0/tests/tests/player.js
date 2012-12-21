describe('Player', function() {
  var models = sp.require('scripts/models');
  var Link = models.Link;
  var player = models.player;
  var Artist = models.Artist;
  var Album = models.Album;
  var Playlist = models.Playlist;
  var Track = models.Track;
  var track;


  /**
     * Instance methods and properties
     */

  it('should allow getting and setting of the playing state', function() {
    expect(player.playing).toBeDefined();

    var track = Track.fromURI('spotify:track:6JEK0CvvjDjjMUBFoXShNZ');

    waitsFor(function() {
      return track.loaded;
    }, 'track to be loaded', 5000);

    runs(function() {

      player.playing = false;
      player.play(track);

      waitsFor(function() {
        return player.playing;
      }, 'track to start playing', 5000);

      runs(function() {
        var playing = player.playing;
        player.playing = false;
        expect(player.playing !== playing).toEqual(true);
      });
    });
  });

  it('should allow getting the position in the currently playing track and setting a new one', function() {
    expect(player.position).toBeDefined();

    var currentPos, track;

    track = Track.fromURI('spotify:track:6JEK0CvvjDjjMUBFoXShNZ');

    waitsFor(function() {
      return track.loaded;
    }, 'track to be loaded', 5000);

    runs(function() {

      player.playing = false;
      player.play(track);

      waitsFor(function() {
        return player.playing && player.position > 0;
      }, 'player to start playing a track', 5000);

      runs(function() {
        currentPos = player.position;
        player.position = 15000;

        waitsFor(function() {
          return player.position >= 15000;
        }, 'player to seek to a position', 5000);

        runs(function() {
          player.playing = false;
          expect(player.position !== currentPos).toEqual(true);
        });
      });
    });
  });

  it('should allow getting the repeat mode and set a new value', function() {
    expect(player.repeat).toBeDefined();

    var repeatMode = player.repeat;
    player.repeat = !repeatMode;
    expect(player.repeat !== repeatMode).toEqual(true);
  });

  it('should allow getting the shuffle mode and set a new value', function() {
    expect(player.shuffle).toBeDefined();

    var shuffleMode = player.shuffle;
    player.shuffle = !shuffleMode;
    expect(player.shuffle !== shuffleMode).toEqual(true);
  });

  it('should provide the currently playing track', function() {
    expect(player.track).toBeDefined();
    expect(player.track instanceof Track).toEqual(true);
  });

  // FIXME: Test fails; code or test needs fixing!
  xit('should allow getting and setting of the volume', function() {
    expect(player.volume).toBeDefined();
    expect(player.volume >= 0 && player.volume <= 1).toEqual(true);

    player.volume = 0.8;
    expect(Math.round(player.volume * 1000) / 1000 === 0.8).toEqual(true);
  });

  it('should have flags for knowing what actions can be done', function() {
    expect(player.canChangeRepeat).toBeDefined();
    expect(player.canChangeShuffle).toBeDefined();
    expect(player.canPlayPrevious).toBeDefined();
    expect(player.canPlayNext).toBeDefined();
    expect(player.canPlayPause).toBeDefined();
  });

  it('should inherit ignore() from Observable', function() {
    expect(typeof player.ignore === 'function').toEqual(true);
  });

  it('should inherit notify() from Observable', function() {
    expect(typeof player.notify === 'function').toEqual(true);
  });

  it('should inherit observe() from Observable', function() {
    expect(typeof player.observe === 'function').toEqual(true);
  });

  it('should provide a way to play a track without a context, from a Track instance', function() {
    expect(typeof player.play === 'function').toEqual(true);

    player.playing = false;

    var track = Track.fromURI('spotify:track:6JEK0CvvjDjjMUBFoXShNZ');

    waitsFor(function() {
      return track.loaded;
    }, 'track to be loaded', 5000);

    runs(function() {
      player.playing = false;
      player.play(track);

      waitsFor(function() {
        return player.playing;
      }, 'track to start playing', 5000);

      runs(function() {
        expect(player.playing).toEqual(true);
        player.playing = false;
      });
    });
  });

  it('should provide a way to play a track without a context, from a Link instance', function() {
    expect(typeof player.play === 'function').toEqual(true);

    player.playing = false;
    player.play(new Link('spotify:track:6JEK0CvvjDjjMUBFoXShNZ'));

    waitsFor(function() {
      return player.playing;
    }, 'track to start playing', 5000);

    runs(function() {
      expect(player.playing).toEqual(true);
      player.playing = false;
    });
  });

  it('should provide a way to play a track without a context, from a URI', function() {
    expect(typeof player.play === 'function').toEqual(true);

    player.playing = false;
    player.play('spotify:track:6JEK0CvvjDjjMUBFoXShNZ');

    waitsFor(function() {
      return player.playing;
    }, 'track to start playing', 5000);

    runs(function() {
      expect(player.playing).toEqual(true);
      player.playing = false;
    });
  });

  it('should provide a way to play a track without a context, from an HTTP URL', function() {
    expect(typeof player.play === 'function').toEqual(true);

    player.playing = false;
    player.play('http://open.spotify.com/track/6JEK0CvvjDjjMUBFoXShNZ');

    waitsFor(function() {
      return player.playing;
    }, 'track to start playing', 5000);

    runs(function() {
      expect(player.playing).toEqual(true);
      player.playing = false;
    });
  });

  it('should provide a way to play a track with a context (URI), from a URI', function() {
    expect(typeof player.play === 'function').toEqual(true);

    player.playing = false;
    player.play('spotify:track:6JEK0CvvjDjjMUBFoXShNZ', 'spotify:artist:0gxyHStUsqpMadRV0Di1Qt');

    waitsFor(function() {
      return player.playing;
    }, 'track to start playing', 5000);

    runs(function() {
      expect(player.playing).toEqual(true);

      waitsFor(function() {
        return player.context !== null;
      }, 'context to be set', 5000);

      runs(function() {
        expect(player.context === 'spotify:artist:0gxyHStUsqpMadRV0Di1Qt').toEqual(true);
        player.playing = false;
      });
    });
  });

  it('should provide a way to play a track with a context (HTTP URL), from a URI', function() {
    expect(typeof player.play === 'function').toEqual(true);

    player.playing = false;
    player.play('spotify:track:6JEK0CvvjDjjMUBFoXShNZ', 'http://open.spotify.com/artist/0gxyHStUsqpMadRV0Di1Qt');

    waitsFor(function() {
      return player.playing;
    }, 'track to start playing', 5000);

    runs(function() {
      expect(player.playing).toEqual(true);

      waitsFor(function() {
        return player.context !== null;
      }, 'context to be set', 5000);

      runs(function() {
        expect(player.context === 'spotify:artist:0gxyHStUsqpMadRV0Di1Qt').toEqual(true);
        player.playing = false;
      });
    });
  });

  it('should provide a way to play a track with a context (Link instance), from a URI', function() {
    expect(typeof player.play === 'function').toEqual(true);

    player.playing = false;
    player.play('spotify:track:6JEK0CvvjDjjMUBFoXShNZ', new Link('spotify:artist:0gxyHStUsqpMadRV0Di1Qt'));

    waitsFor(function() {
      return player.playing;
    }, 'track to start playing', 5000);

    runs(function() {
      expect(player.playing).toEqual(true);

      waitsFor(function() {
        return player.context !== null;
      }, 'context to be set', 5000);

      runs(function() {
        expect(player.context === 'spotify:artist:0gxyHStUsqpMadRV0Di1Qt').toEqual(true);
        player.playing = false;
      });
    });
  });

  xit('should provide a way to play a track with a context (Album instance), from a URI', function() {
    expect(typeof player.play === 'function').toEqual(true);

    var album = Album.fromURI('spotify:album:2mCuMNdJkoyiXFhsQCLLqw');

    waitsFor(function() {
      return album.loaded;
    }, 'album to be loaded', 5000);

    runs(function() {
      player.playing = false;
      player.play('spotify:track:6JEK0CvvjDjjMUBFoXShNZ', album);

      waitsFor(function() {
        return player.playing;
      }, 'track to start playing', 5000);

      runs(function() {
        expect(player.playing).toEqual(true);

        waitsFor(function() {
          return player.context !== null;
        }, 'context to be set', 5000);

        runs(function() {
          expect(player.context === 'spotify:album:2mCuMNdJkoyiXFhsQCLLqw').toEqual(true);
          player.playing = false;
        });
      });
    });
  });

  it('should provide a way to play a track with a context (Artist instance), from a URI', function() {
    expect(typeof player.play === 'function').toEqual(true);

    var artist = Artist.fromURI('spotify:artist:0gxyHStUsqpMadRV0Di1Qt');

    waitsFor(function() {
      return artist.loaded;
    }, 'artist to be loaded', 5000);

    runs(function() {
      player.playing = false;
      player.play('spotify:track:6JEK0CvvjDjjMUBFoXShNZ', artist);

      waitsFor(function() {
        return player.playing;
      }, 'track to start playing', 5000);

      runs(function() {
        expect(player.playing).toEqual(true);

        waitsFor(function() {
          return player.context !== null;
        }, 'context to be set', 5000);

        runs(function() {
          expect(player.context === 'spotify:artist:0gxyHStUsqpMadRV0Di1Qt').toEqual(true);
          player.playing = false;
        });
      });
    });
  });

  it('should provide a way to play a track with a context (Playlist instance), from a URI', function() {
    expect(typeof player.play === 'function').toEqual(true);

    var playlist = Playlist.fromURI('spotify:user:webkittest:playlist:13eCJlyPz6Sq46YoQzumu5');

    waitsFor(function() {
      return playlist.loaded;
    }, 'artist to be loaded', 5000);

    runs(function() {
      player.playing = false;
      player.play('spotify:track:6JEK0CvvjDjjMUBFoXShNZ', playlist);

      waitsFor(function() {
        return player.playing;
      }, 'track to start playing', 5000);

      runs(function() {
        expect(player.playing).toEqual(true);

        waitsFor(function() {
          return player.context !== null;
        }, 'context to be set', 5000);

        runs(function() {
          expect(player.context === 'spotify:user:webkittest:playlist:13eCJlyPz6Sq46YoQzumu5').toEqual(true);
          player.playing = false;
        });
      });
    });
  });

  it('should provide a way to play the next track', function() {
    expect(typeof player.next === 'function').toEqual(true);

    var oldTrack = player.track;

    player.next();

    waitsFor(function() {
      return player.track !== oldTrack;
    }, 'player to switch track', 5000);

    runs(function() {
      expect(player.track !== oldTrack).toEqual(true);
      player.playing = false;
    });
  });

  it('should provide a way to play the previous track', function() {
    expect(typeof player.previous === 'function').toEqual(true);

    var oldTrack = player.track;

    player.previous(true);

    waitsFor(function() {
      return player.track !== oldTrack;
    }, 'player to switch track', 5000);

    runs(function() {
      expect(player.track !== oldTrack).toEqual(true);
      player.playing = false;
    });
  });

  it('should provide a way to go to the start of the current track, by using the previous() method', function() {
    expect(typeof player.previous === 'function').toBeDefined();

    var currentPos, track;

    player.play('spotify:track:6JEK0CvvjDjjMUBFoXShNZ');

    waitsFor(function() {
      return player.playing && player.position > 0;
    }, 'track to start playing', 5000);

    runs(function() {

      player.position = 30000;

      waitsFor(function() {
        return player.position >= 30000;
      }, 'player to seek to a position', 5000);

      runs(function() {
        player.previous();

        waitsFor(function() {
          return player.position < 30000;
        }, 'player to set the position to the start', 5000);

        runs(function() {
          expect(player.position < 30000).toEqual(true);
          expect(player.track.data.uri === 'spotify:track:6JEK0CvvjDjjMUBFoXShNZ');
          player.playing = false;
        });
      });
    });
  });

});
