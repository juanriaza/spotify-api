require([
  '$api/messaging',
  '$api/models',
  '$test-utils/assert',
  '$test-utils/mock'
], function(messaging, models, assert, mock) {
  mocha.setup('bdd');

  describe('Messaging', function() {
    after(function() {
      mock.clear();
    });

    it('should call the proper request when sending', function() {
      var called = false;
      mock.request('messaging_send', function(request) {
        assert.equal(request.args[0].length, 1,
            'Wrong number of user URIs');
        assert.equal(request.args[0][0], 'spotify:user:dummy',
            'Did not get the correct user URI');
        assert.equal(request.args[1], 'Hello World',
            'Did not get the correct message');
        assert.equal(request.args[2], 'spotify:track:6JEK0CvvjDjjMUBFoXShNZ',
            'Did not get the correct attachment');

        called = true;
        request.succeed({uri: 'spotify:conversation:1'});
      });

      var promise = messaging.send(
          [models.User.fromURI('spotify:user:dummy')],
          'Hello World',
          models.Track.fromURI('spotify:track:6JEK0CvvjDjjMUBFoXShNZ'));

      promise.done(function(convo) {
        assert.equal(convo.uri, 'spotify:conversation:1',
            'Conversation was not created correctly');
      });

      assert.ok(called, 'messaging_send was never called');
    });
  });
});

