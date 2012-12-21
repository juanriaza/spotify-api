describe('Observable', function() {
  var models = sp.require('scripts/models');
  var Observable = models.Observable;
  var observable, observer, hasObserverBeenCalled;


  /**
     * Static methods and properties
     */

  it('should be able to be instantiated', function() {
    observable = new Observable();
    expect(observable instanceof Observable).toEqual(true);
  });


  /**
     * Instance methods and properties
     */
  describe('Observable instances', function() {

    it('should give access to all observers', function() {
      expect(observable.observers).toBeDefined();
    });

    it('should provide a way to add an observer', function() {
      observer = function() {
        hasObserverBeenCalled = true;
      };
      observable.observe('testevent', observer);
      expect(!!~observable.observers['testevent'].indexOf(observer)).toEqual(true);
    });

    it('should provide a way to notify an observer of an event', function() {
      observable.notify('testevent', { key: 'value' });
      expect(hasObserverBeenCalled).toEqual(true);
    });

    it('should provide a way to remove an observer', function() {
      observable.ignore('testevent', observer);
      expect(!!~observable.observers['testevent'].indexOf(observer)).toEqual(false);
    });

  });
});
