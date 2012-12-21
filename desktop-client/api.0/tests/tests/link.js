describe('Link', function() {
  var models = sp.require('scripts/models');
  var Link = models.Link;
  var link;


  /**
     * Static methods and properties
     */

  it('should have a list of link types', function() {
    expect(Link.TYPE instanceof Object).toEqual(true);
  });

  // Require api permissions: "core": ["private"]
  it('should have a way to create a link from an HTTP URL', function() {
    var link = new Link('http://open.spotify.com/track/6JEK0CvvjDjjMUBFoXShNZ');

    expect(link instanceof Link).toEqual(true);
  });

  it('should have a way to get the link type of a URI string', function() {
    var type = Link.getType('spotify:artist:0gxyHStUsqpMadRV0Di1Qt');
    expect(type).toEqual(Link.TYPE.ARTIST);
  });

  it('should be able to be instantiated', function() {
    link = new Link('spotify:artist:0gxyHStUsqpMadRV0Di1Qt');
    expect(link instanceof Link).toEqual(true);
  });


  /**
     * Instance methods and properties
     */
  describe('Link instances', function() {

    it('should give access to the link type', function() {
      expect(link.type).toBeDefined();
    });

    it('should give access to the URI of the link', function() {
      expect(link.uri).toBeDefined();
    });

    it('should have a toString method that returns the string', function() {
      expect(link.toString).toBeDefined();

      expect(typeof link.toString() === 'string').toEqual(true);
    });

    // Require api permissions: "core": ["private"]
    it('should have a way to get the HTTP URL', function() {
      expect(typeof link.toURL === 'function').toEqual(true);
      expect(typeof link.toURL() === 'string').toEqual(true);
    });

    it('should have a way to get the URI', function() {
      expect(typeof link.valueOf === 'function').toEqual(true);
      expect(typeof link.valueOf() === 'string').toEqual(true);
    });

  });
});
