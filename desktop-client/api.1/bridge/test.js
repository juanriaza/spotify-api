exports.BridgeTests = BridgeTests;

function BridgeTests() {
  this.failures = [];
}

BridgeTests.prototype.test = function(done) {
  this.callback = done;
  this.failures = [];
  this._waiting = 0;
  this._success = 0;
  this._failure = 0;

  var tests = this.getTests();
  this._waiting = Object.keys(tests).length;
  this.log('Running ' + this._waiting + ' tests...');

  for (var name in tests) {
    try {
      var test = tests[name];
      this.log(test.name);
      this._name = test.name;
      test.func.call(this);
    } catch (error) {
      this.failure(error.message);
    }
  }
};

BridgeTests.prototype.getTests = function() {
  var tests = {};
  for (var name in this) {
    if (name.indexOf('test') == 0 && name != 'test')
      tests[name] = { name: name, func: this[name] };
  }
  return tests;
};

BridgeTests.prototype.log = function(msg) {
  console.log(msg);
};

BridgeTests.prototype.success = function(test) {
  this._waiting--;
  this._success++;
  this.finish();
};

BridgeTests.prototype.failure = function(msg) {
  this._waiting--;
  this._failure++;
  this.failures.push(msg);
  this.log(msg);
  this.finish();
};

BridgeTests.prototype.finish = function() {
  if (!this._waiting) {
    this.log('Done. ' + this._failure + ' failure(s) out of ' + (this._failure + this._success) + '.');
    if (this.callback) {
      this.callback(this.failures);
      delete this.callback;
    }
  }
};

BridgeTests.prototype.assert = function(condition, msg) {
  if (!condition)
    throw new Error(msg);
};

BridgeTests.prototype.assertEquals = function(name, value, correct) {
  this.assert(value === correct, '"' + name + '" should be "' + correct + '", was "' + value + '"');
};

BridgeTests.prototype.assertMatches = function(name, value, pattern) {
  this.assert(pattern.test(value), '"' + name + '" does match "' + pattern + '", was "' + value + '"');
};

BridgeTests.prototype.assertNumber = function(name, value) {
  this.assert(typeof value === 'number', '"' + name + '" is not a number, was "' + value + '".');
};

BridgeTests.prototype.assertSet = function(name, value) {
  this.assert(value !== undefined, '"' + name + '" is not set.');
};

BridgeTests.prototype.assertRange = function(name, value, min, max) {
  this.assert(value >= min && value <= max, '"' + name + '" is not within the range [' + min + ', ' + max + '], was "' + value + '".');
};

BridgeTests.prototype.assertEnum = function(name, value, valid) {
  this.assert(valid.indexOf(value) != -1, '"' + name + '" is not one of: [' + valid + '], was "' + value + '".');
};

BridgeTests.prototype.request = function(request, args, onsuccess, onfailure) {
  var self = this;
  var done = function(result) { try { if (onsuccess) onsuccess.call(self, result); } catch (error) { self.failure(error.message); } };
  var oops = function(result) { try { if (onfailure) onfailure.call(self, result); } catch (error) { self.failure(error.message); } };
  SP.request(request, args, this, done, oops);
};

/**
 * Tests the album_metadata request with three URIs in the same request. Two of
 * the URIs point to valid albums while the third URI is not a valid album. The
 * request should succeed and provide correct metadata for the two valid URIs.
 * The precense of an invalid URI should not cause the request to fail.
 * Request: album_metadata
 */
BridgeTests.prototype.testAlbumMetadata = function() {
  var uri_1 = 'spotify:album:1pFUGy3ABpLRRE3oNMPbDb'; // Little Earthquakes
  var uri_2 = 'spotify:album:3J0cqaTOzb8lNaY4zh8dMh'; // Hyperballad
  var uri_3 = 'spotify:album:3J0cqaTOzb8lNaY4zh8aaa'; // [invalid uri]
  this.request('album_metadata', [uri_1, uri_2, uri_3], function(result) {
    var md_1 = result[uri_1];
    this.assert(md_1, '"' + uri_1 + '" is not set in metadata results.');
    this.assertSet('artists', md_1.artists);
    this.assertSet('image', md_1.image);
    this.assertEquals('artists[0].uri', md_1.artists[0].uri, 'spotify:artist:1KsASRNugxU85T0u6zSg32');
    this.assertEquals('date', md_1.date, '1991');
    this.assertEquals('name', md_1.name, 'Little Earthquakes');
    this.assertEquals('type', md_1.type, 'album');
    this.assertEnum('availability', md_1.availability, ['available', 'banned', 'regional', 'premium', 'unavailable']);
    this.assertEnum('playable', md_1.playable, [false, true]);

    var md_2 = result[uri_2];
    this.assert(md_2, '"' + uri_2 + '" is not set in metadata results.');
    this.assertSet('artists', md_2.artists);
    this.assertSet('image', md_2.image);
    this.assertEquals('artists[0].uri', md_2.artists[0].uri, 'spotify:artist:7w29UYBi0qsHi5RTcv3lmA');
    this.assertEquals('date', md_2.date, '1996');
    this.assertEquals('name', md_2.name, 'Hyperballad');
    this.assertEquals('type', md_2.type, 'single');
    this.assertEnum('availability', md_2.availability, ['available', 'banned', 'regional', 'premium', 'unavailable']);
    this.assertEnum('playable', md_2.playable, [false, true]);

    var md_3 = result[uri_3];
    this.assert(md_3, '"' + uri_3 + '" is not set in metadata results.');
    this.assertEquals('error', md_3.error, 'invalid-uri');

    this.success('testAlbumMetadata');
  }, function(result) {
    this.failure('testAlbumMetadata failed: ' + result.message);
  });
};

/**
 * Request: album_metadata
 */
BridgeTests.prototype.testAlbumMetadataWithArtistShouldFail = function() {
  var uri = 'spotify:artist:1KsASRNugxU85T0u6zSg32'; // Tori Amos
  this.request('album_metadata', [uri], function(result) {
    var md = result[uri];
    this.assert(md, '"' + uri + '" is not set in metadata results.');
    this.assertEquals('error', md.error, 'invalid-uri');
  }, function(result) {
    this.failure('Request should succeed but not contain invalid URI.');
  });
};

/**
 * Request: album_metadata
 */
BridgeTests.prototype.testAlbumMetadataWithPlaylistShouldFail = function() {
  var uri = 'spotify:user:erik.johan.lindstrom:playlist:4TmNdlY2615aZCWNop9rvn'; // Emerging Chart | WAH (3 May)
  this.request('album_metadata', [uri], function(result) {
    var md = result[uri];
    this.assert(md, '"' + uri + '" is not set in metadata results.');
    this.assertEquals('error', md.error, 'invalid-uri');
  }, function(result) {
    this.failure('Request should succeed but not contain invalid URI.');
  });
};

/**
 * Request: album_metadata
 */
BridgeTests.prototype.testAlbumMetadataWithTrackShouldFail = function() {
  var uri = 'spotify:track:3lK1d2P6LBsSz4bL4c1dJr'; // Hey Jupiter
  this.request('album_metadata', [uri], function(result) {
    var md = result[uri];
    this.assert(md, '"' + uri + '" is not set in metadata results.');
    this.assertEquals('error', md.error, 'invalid-uri');
  }, function(result) {
    this.failure('Request should succeed but not contain invalid URI.');
  });
};

/**
 * Request: album_metadata
 */
BridgeTests.prototype.testAlbumMetadataWithUserShouldFail = function() {
  var uri = 'spotify:user:webkittest'; // Bred Jan
  this.request('album_metadata', [uri], function(result) {
    var md = result[uri];
    this.assert(md, '"' + uri + '" is not set in metadata results.');
    this.assertEquals('error', md.error, 'invalid-uri');
  }, function(result) {
    this.failure('Request should succeed but not contain invalid URI.');
  });
};

/**
 * Tests the artist_metadata request with three URIs in the same request. Two of
 * the URIs point to valid artists while the third URI is not a valid artist. The
 * request should succeed and provide correct metadata for the two valid URIs.
 * The precense of an invalid URI should not cause the request to fail.
 * Request: artist_metadata
 */
BridgeTests.prototype.testArtistMetadata = function() {
  var uri_1 = 'spotify:artist:1KsASRNugxU85T0u6zSg32'; // Tori Amos
  var uri_2 = 'spotify:artist:7w29UYBi0qsHi5RTcv3lmA'; // Björk
  var uri_3 = 'spotify:artist:7w29UaTOzb8lNaY4zh8aaa'; // [invalid uri]
  this.request('artist_metadata', [uri_1, uri_2, uri_3], function(result) {
    var md_1 = result[uri_1];
    this.assert(md_1, '"' + uri_1 + '" is not set in metadata results.');
    this.assertSet('image', md_1.image);
    this.assertEquals('name', md_1.name, 'Tori Amos');
    this.assertRange('popularity', md_1.popularity, 0, 100);

    var md_2 = result[uri_2];
    this.assert(md_2, '"' + uri_2 + '" is not set in metadata results.');
    this.assertSet('image', md_2.image);
    this.assertEquals('name', md_2.name, 'Björk');
    this.assertRange('popularity', md_2.popularity, 0, 100);

    var md_3 = result[uri_3];
    this.assert(md_3, '"' + uri_3 + '" is not set in metadata results.');
    this.assertEquals('error', md_3.error, 'invalid-uri');

    this.success('testArtistMetadata');
  }, function(result) {
    this.failure('testArtistMetadata failed: ' + result.message);
  });
};

/**
 * Tests the playist_metadata request with three URIs in the same request. Two
 * of the URIs point to valid playlists while the third URI is not a valid
 * playlist. The request should succeed and provide correct metadata for the
 * two valid URIs. The precense of an invalid URI should not cause the request
 * to fail.
 * Request: playlist_metadata
 */
BridgeTests.prototype.testPlaylistMetadata = function() {
  var uri_1 = 'spotify:user:erik.johan.lindstrom:playlist:4TmNdlY2615aZCWNop9rvn'; // Emerging Chart | WAH (3 May)
  var uri_2 = 'spotify:user:erik.johan.lindstrom:playlist:07QQ3N8horVVccuO3P0XvS'; // Emerging Chart | WAH (2 May)
  var uri_3 = 'spotify:user:erik.johan.lindstrom:playlist:07QQ3N8horVaZCWNop9rvn'; // [invalid uri]
  this.request('playlist_metadata', [uri_1, uri_2, uri_3], function(result) {
    var md_1 = result[uri_1];
    this.assert(md_1, '"' + uri_1 + '" is not set in metadata results.');
    this.assertSet('image', md_1.image);
    this.assertSet('owner', md_1.owner);
    this.assertEquals('collaborative', md_1.collaborative, false);
    this.assertEquals('name', md_1.name, 'Emerging Chart | WAH (3 May)');
    this.assertEnum('published', md_1.published, [false, true]);
    this.assertEnum('subscribed', md_1.subscribed, [false, true]);

    var md_2 = result[uri_2];
    this.assertSet('image', md_2.image);
    this.assertSet('owner', md_2.owner);
    this.assertEquals('collaborative', md_2.collaborative, false);
    this.assertEquals('name', md_2.name, 'Emerging Chart | WAH (2 May)');
    this.assertEnum('published', md_2.published, [false, true]);
    this.assertEnum('subscribed', md_2.subscribed, [false, true]);

    var md_3 = result[uri_3];
    this.assert(md_3, '"' + uri_3 + '" is not set in metadata results.');
    this.assertEquals('error', md_3.error, 'invalid-uri');

    this.success('testPlaylistMetadata');
  }, function(result) {
    this.failure('testPlaylistMetadata failed: ' + result.message);
  });
};

/**
 * Tests the track_metadata request with three URIs in the same request. Two of
 * the URIs point to valid tracks while the third URI is not a valid track. The
 * request should succeed and provide correct metadata for the two valid URIs.
 * The precense of an invalid URI should not cause the request to fail.
 * Request: track_metadata
 */
BridgeTests.prototype.testTrackMetadata = function() {
  var uri_1 = 'spotify:track:3lK1d2P6LBsSz4bL4c1dJr'; // Hey Jupiter
  var uri_2 = 'spotify:track:6LBD2UfaLQLXxEFOvKcyim'; // Bachelorette
  var uri_3 = 'spotify:track:3lK1d2P6LBsXxEFOvKcyim'; // [invalid uri]
  this.request('track_metadata', [uri_1, uri_2, uri_3], function(result) {
    var md_1 = result[uri_1];
    this.assert(md_1, '"' + uri_1 + '" is not set in metadata results.');
    this.assertSet('artists', md_1.artists);
    this.assertSet('image', md_1.image);
    this.assertEquals('advertisement', md_1.advertisement, false);
    this.assertEquals('album.uri', md_1.album.uri, 'spotify:album:5sVoASsvq8oq0iPZSsimgk');
    this.assertEquals('artists[0].uri', md_1.artists[0].uri, 'spotify:artist:1KsASRNugxU85T0u6zSg32');
    this.assertEquals('disc', md_1.disc, 0);
    this.assertEquals('explicit', md_1.explicit, false);
    this.assertEquals('local', md_1.local, false);
    this.assertEquals('name', md_1.name, 'Hey Jupiter');
    this.assertEquals('placeholder', md_1.placeholder, false);
    this.assertEnum('availability', md_1.availability, ['available', 'banned', 'regional', 'premium', 'unavailable']);
    this.assertEnum('playable', md_1.playable, [false, true]);
    this.assertEnum('starred', md_1.starred, [false, true]);
    this.assertRange('duration', md_1.duration, 311000, 313000);
    this.assertRange('popularity', md_1.popularity, 0, 100);

    var md_2 = result[uri_2];
    this.assert(md_2, '"' + uri_2 + '" is not set in metadata results.');
    this.assertSet('artists', md_2.artists);
    this.assertSet('image', md_2.image);
    this.assertEquals('advertisement', md_2.advertisement, false);
    this.assertEquals('album.uri', md_2.album.uri, 'spotify:album:6HLUZogZcItLXDTnIEmUZv');
    this.assertEquals('artists[0].uri', md_2.artists[0].uri, 'spotify:artist:7w29UYBi0qsHi5RTcv3lmA');
    this.assertEquals('disc', md_2.disc, 0);
    this.assertEquals('explicit', md_2.explicit, false);
    this.assertEquals('local', md_2.local, false);
    this.assertEquals('name', md_2.name, 'Bachelorette');
    this.assertEquals('placeholder', md_2.placeholder, false);
    this.assertEnum('availability', md_2.availability, ['available', 'banned', 'regional', 'premium', 'unavailable']);
    this.assertEnum('playable', md_2.playable, [false, true]);
    this.assertEnum('starred', md_2.starred, [false, true]);
    this.assertRange('duration', md_2.duration, 312000, 314000);
    this.assertRange('popularity', md_2.popularity, 0, 100);

    var md_3 = result[uri_3];
    this.assert(md_3, '"' + uri_3 + '" is not set in metadata results.');
    this.assertEquals('error', md_3.error, 'invalid-uri');

    this.success('testTrackMetadata');
  }, function(result) {
    this.failure('testTrackMetadata failed: ' + result.message);
  });
};

/**
 * Tests the user_metadata request with three URIs in the same request. Two of
 * the URIs point to valid users while the third URI is not a valid user. The
 * request should succeed and provide correct metadata for the two valid URIs.
 * The precense of an invalid URI should not cause the request to fail.
 * Request: user_metadata
 */
BridgeTests.prototype.testUserMetadata = function() {
  var uri_1 = 'spotify:user:webkittest'; // Bred Jan
  var uri_2 = 'spotify:user:1110446926'; // Panda Spotify
  var uri_3 = 'spotify:user:webki46926'; // [invalid uri]
  this.request('user_metadata', [uri_1, uri_2, uri_3], function(result) {
    var md_1 = result[uri_1];
    this.assert(md_1, '"' + uri_1 + '" is not set in metadata results.');
    this.assertSet('image', md_1.image);
    this.assertEquals('canonical', md_1.canonical, 'webkittest');
    this.assertEquals('name', md_1.name, 'Bred Jan');

    var md_2 = result[uri_2];
    this.assert(md_2, '"' + uri_2 + '" is not set in metadata results.');
    this.assertSet('image', md_2.image);
    this.assertEquals('canonical', md_2.canonical, '1110446926');
    this.assertEquals('name', md_2.name, 'Panda Spotify');

    this.success('testUserMetadata');
  }, function(result) {
    this.failure('testUserMetadata failed: ' + result.message);
  });
};

/**
 * Request: core_ping
 */
BridgeTests.prototype.testCorePing = function() {
  this.request('core_ping', ['A', 'B', 'C'], function(result) {
    this.assertSet('arguments', result.arguments);
    this.assertEquals('arguments[0]', result.arguments[0], 'A');
    this.assertEquals('arguments[1]', result.arguments[1], 'B');
    this.assertEquals('arguments[2]', result.arguments[2], 'C');
    this.success('testCorePing');
  }, function(result) {
    this.failure('testCorePing failed: ' + result.message);
  });
};

/**
 * Request: application_query
 */
BridgeTests.prototype.testApplicationQuery = function() {
  this.request('application_query', [], function(result) {
    this.assertSet('arguments', result.arguments);
    this.assertEquals('arguments', result.arguments.length, 0);
    this.assertMatches('uri', result.uri, /^spotify:app:\w+/);
    this.success('testApplicationQuery');
  }, function(result) {
    this.failure('testApplicationQuery failed: ' + result.message);
  });
};

/**
 * Request: session_query
 */
BridgeTests.prototype.testSessionQuery = function() {
  this.request('session_query', [], function(result) {
    this.assertSet('user', result.user);
    this.assertEnum('connecting', result.connecting, [false, true]);
    this.assertEnum('connection', result.connection, ['none', 'gprs', 'edge', '3g', 'wlan', 'ethernet', 'unknown']);
    this.assertEnum('developer', result.developer, [false, true]);
    this.assertEnum('device', result.device, ['mobile', 'tablet', 'desktop', 'web', 'tv', 'unknown']);
    this.assertEnum('incognito', result.incognito, [false, true]);
    this.assertEnum('online', result.online, [false, true]);
    this.assertEnum('product', result.product, ['daypass', 'free', 'premium']);
    this.assertEnum('resolution', result.resolution, [1, 2, 3, 4]);
    this.assertNumber('testGroup', result.testGroup);
    this.assertMatches('country', result.country, /^\w\w/);
    this.assertMatches('language', result.language, /^\w\w/);
    this.assertMatches('user.uri', result.user.uri, /^spotify:user:.+/);
    this.success('testSessionQuery');
  }, function(result) {
    this.failure('testSessionQuery failed: ' + result.message);
  });
};

/**
 * Request: search_fuzzy_match
 */
BridgeTests.prototype.testFuzzyMatchShouldFindMatch = function() {
  this.request('search_fuzzy_match', ['Koldplay'], function(result) {
    this.assertEquals('fuzzyMatch', result.fuzzyMatch, 'Coldplay');
    this.success('testFuzzyMatchShouldFindMatch');
  }, function(result) {
    this.failure('testFuzzyMatchShouldFindMatch failed: ' + result.message);
  });
};

/**
 * Request: search_fuzzy_match
 */
BridgeTests.prototype.testFuzzyMatchShouldNotFindMatch = function() {
  this.request('search_fuzzy_match', ['Madonna'], function(result) {
    this.assertEquals('fuzzyMatch', result.fuzzyMatch, null);
    this.success('testFuzzyMatchShouldNotFindMatch');
  }, function(result) {
    this.failure('testFuzzyMatchShouldNotFindMatch failed: ' + result.message);
  });
};
