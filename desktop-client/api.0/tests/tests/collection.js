describe('Collection', function() {
  var models = sp.require('scripts/models');
  var Collection = models.Collection;
  var collection;


  it('should be able to be instantiated', function() {
    collection = new Collection();
    expect(collection instanceof Collection).toEqual(true);
  });

  describe('Collection instances', function() {

    it('should be able to add an item and return the new length', function() {
      var length = collection.add('test');
      expect(collection.length === length).toEqual(true);
    });

    it('should be able to return a single item', function() {
      var item = collection.get(0);
      expect(item).toBeDefined();
    });

    it('should be able to return a range of items', function() {
      collection.clear();
      collection.add('abc');
      collection.add('def');
      collection.add('ghi');
      collection.add('jkl');
      collection.add('mno');
      var items = collection.getRange(1, 3);

      expect(items.length === 3).toEqual(true);
    });

    it('should be able to return the index of an item or return -1 if not found', function() {
      expect(collection.indexOf('ghi')).toEqual(2);
      expect(collection.indexOf('ghijkl')).toEqual(-1);
    });

    it('should be able to remove an item', function() {
      var oldLength = collection.length;
      collection.remove('ghi');
      expect(collection.length).toEqual(oldLength - 1);
    });
  });
});
