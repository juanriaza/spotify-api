describe('Reset', function() {
  var models = sp.require('scripts/models');
  var Playlist = models.Playlist;

  it('should reset the playlist', function() {
    var resetCompleted = false;

    var playlist = Playlist.fromURI('spotify:user:webkittest:playlist:13eCJlyPz6Sq46YoQzumu5', function(playlist) {
      while (playlist.length > 0) {
        playlist.remove(0);
      }

      playlist.add('spotify:track:4EZz8Byhbjk0tOKFJlCgPB');
      playlist.add('spotify:track:6I6tcmbox8bSXoxuHhHAE1');
      playlist.add('spotify:track:6JEK0CvvjDjjMUBFoXShNZ');
      playlist.add('spotify:track:2yCR1cwsLA21yWU7EZ2KPr');
      playlist.add('spotify:track:0cq6QwxaOGxeS1IUibScUo');

      resetCompleted = true;
    });

    waitsFor(function() {
      return resetCompleted;
    }, 'playlist to be reset', 5000);

    runs(function() {
      expect(playlist.length).toEqual(5);
    });
  });
});
