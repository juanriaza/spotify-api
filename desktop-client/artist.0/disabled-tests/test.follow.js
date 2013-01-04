require(['$artist/../tests/mockery', '$artist/follow', '$test-utils/assert', '$artist/../tests/mock.follow'],
    function(Mockery, Target, assert, MockModel) {

      mocha.setup('bdd');

      describe('The Follow Model', function() {

        var model;

        beforeEach(function() {
          model = new Target.FollowModel();
          model._request = MockModel.mockedRequest;
          model.init('spotify:artist:xyz');
        });

        it('Returns false if you are not following the artist', function(done) {
          model.isFollowing().done(function(model) { assert.ok(model.following === false); done(); });
        });

        it('Returns true if you follow the artist', function(done) {
          model.follow().done(function(model) {
            model.isFollowing().done(function(model) { assert.ok(model.following); done(); });
          });
        });

        it('Returns a count of zero if the artist has no followers', function(done) {
          model.followCount().done(function(model) { assert.ok(model.followers === 0); done(); });
        });

        it('Returns zero if you unfollow from an artist without followers', function(done) {
          model.unfollow().done(function(model) {
            model.followCount().done(function(model) { assert.ok(model.followers === 0); done(); });
          });
        });

      });

      describe('Following a user', function() {

      });
    });
