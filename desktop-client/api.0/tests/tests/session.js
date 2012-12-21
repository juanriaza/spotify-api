describe('Session', function() {
  var models = sp.require('scripts/models');
  var session = models.session;

  /**
     * Instance methods and properties
     */

  it('should provide the current connection state', function() {
    expect(session.state).toBeDefined();
  });

  it('should provide the country code of the logged in user', function() {
    var country = session.country;
    expect(country).toBeDefined();
    expect(typeof country === 'string').toEqual(true);
    expect(country.length).toEqual(2);
  });

  it('should provide the language code of the logged in user', function() {
    var language = session.language;
    expect(language).toBeDefined();
    expect(typeof language === 'string').toEqual(true);
    expect(language.length).toEqual(2);
  });

  it('should provide a flag to see if the logged in user has a Spotify developer account', function() {
    expect(session.developer).toBeDefined();
  });

  it('should provide an anonymous user ID', function() {
    expect(session.anonymousUserID).toBeDefined();
  });

  it('should inherit ignore() from Observable', function() {
    expect(typeof session.ignore === 'function').toEqual(true);
  });

  it('should inherit notify() from Observable', function() {
    expect(typeof session.notify === 'function').toEqual(true);
  });

  it('should inherit observe() from Observable', function() {
    expect(typeof session.observe === 'function').toEqual(true);
  });
});
