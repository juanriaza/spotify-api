describe('Application', function() {
  var models = sp.require('scripts/models');
  var application = models.application;


  /**
     * Instance methods and properties
     */

  it('should give access to the arguments that were used to start the app', function() {
    expect(application.arguments instanceof Array).toEqual(true);
  });

  it('should give access to the most recent URIs that were dropped on the application', function() {
    expect(application.links instanceof Array).toEqual(true);
  });

  it('should inherit ignore() from Observable', function() {
    expect(typeof application.ignore === 'function').toEqual(true);
  });

  it('should inherit notify() from Observable', function() {
    expect(typeof application.notify === 'function').toEqual(true);
  });

  it('should inherit observe() from Observable', function() {
    expect(typeof application.observe === 'function').toEqual(true);
  });

  it('should provide a way to activate the app view', function() {
    expect(typeof application.activate === 'function').toEqual(true);
  });

  it('should provide a way to show a share popup', function() {
    expect(typeof application.showSharePopup === 'function').toEqual(true);

    application.showSharePopup(document.querySelector('.banner .title'), 'spotify:track:6JEK0CvvjDjjMUBFoXShNZ');
  });

  it('should provide a way to hide a share popup', function() {
    expect(typeof application.hideSharePopup === 'function').toEqual(true);

    application.hideSharePopup();
  });

});
