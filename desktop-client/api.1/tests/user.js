require([
  '$api/models',
  '$test-utils/assert'
], function(models, assert) {
  mocha.setup('bdd');

  describe('User', function() {
    describe('#fromUsername', function() {
      it('should generate the correct URI for names with special characters', function() {
        var user = models.User.fromUsername('tést');
        assert.equal(user.uri, 'spotify:user:t%c3%a9st', 'Incorrect user URI generated by fromUsername');
      });
    });
  });
});
