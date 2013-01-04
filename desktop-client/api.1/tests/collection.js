require(['$api/models', '$test-utils/assert'], function(models, assert) {
  mocha.setup('bdd');

  function factory(uri, metadata) {
    assert.ok(uri.match(/^spotify:track:/), 'factory: Got an unexpected URI');
    assert.ok(metadata.name, 'factory: Did not get a name in metadata');

    var track = models.Track.fromURI(uri, metadata);
    track.__createdByFactory = true;
    return track;
  }

  function getItems(args, offset, length, raw) {
    assert.ok(this instanceof models.Collection, 'getItems: Not in context of Collection');
    assert.equal(this.uri, 'test:uri', 'getItems: Wrong Collection URI');
    assert.equal(args, 'test:args', 'getItems: Wrong value for "args"');
    assert.strictEqual(offset, 0, 'getItems: Wrong value for "offset"');
    assert.strictEqual(length, 5, 'getItems: Wrong value for "length"');
    assert.strictEqual(raw, false, 'getItems: Wrong value for "raw"');

    var promise = new models.Promise;

    promise.setDone({
      array: [
        'spotify:track:1111111111111111111111',
        'spotify:track:2222222222222222222222',
        'spotify:track:3333333333333333333333',
        'spotify:track:4444444444444444444444',
        'spotify:track:5555555555555555555555'
      ],
      metadata: [
        {name: 'Dummy Track 1'},
        {name: 'Dummy Track 2'},
        {name: 'Dummy Track 3'},
        {name: 'Dummy Track 4'},
        {name: 'Dummy Track 5'}
      ],
      length: 1337
    });

    return promise;
  }

  var customCollection = new models.Collection(models.Track, 'test:uri', getItems, 'test:args');
  var customCollectionWithFactory = new models.Collection(models.Track, 'test:uri', getItems, 'test:args', factory);

  describe('Collection', function() {
    it('should provide snapshots', function(done) {
      customCollection.snapshot(0, 5).done(function(snapshot) {
        var track = snapshot.get(0);
        assert.ok(track instanceof models.Track, 'Track object not constructed correctly');
        assert.equal(track.name, 'Dummy Track 1', 'Track object did not get correct metadata');

        assert.equal(snapshot.length, 1337, 'Incorrect collection length reported');
        assert.equal(snapshot.toArray().length, 5, 'Incorrect number of items in snapshot');

        done();
      });
    });

    it('should allow custom item factories', function(done) {
      customCollectionWithFactory.snapshot(0, 5).done(function(snapshot) {
        var track = snapshot.get(0);
        assert.ok(track instanceof models.Track, 'Track object not constructed correctly');
        assert.ok(track.__createdByFactory, 'Track object was not created by factory');
        done();
      });
    });
  });
});
