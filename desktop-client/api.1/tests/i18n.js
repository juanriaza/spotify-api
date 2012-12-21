require(['$api/i18n', '$test-utils/assert'], function(i18n, assert) {
  mocha.setup('bdd');

  // TODO(blixt): This currently assumes en locale. We should probably have
  // tests that are more extensive and work even if test machine has another
  // locale.
  describe('Internationalization', function() {
    describe('list formatting', function() {
      it('should return an empty string with no items', function() {
        assert.strictEqual(i18n.list([]), '', 'Did not return empty string');
      });

      it('should return the item when given one item', function() {
        assert.equal(i18n.list(['One']), 'One', 'Did not format single item correctly');
      });

      it('should format two items correctly', function() {
        assert.equal(
            i18n.list(['One', 'Two']),
            'One and Two',
            'Did not format two items correctly');
      });

      it('should format three items correctly', function() {
        assert.equal(
            i18n.list(['One', 'Two', 'Three']),
            'One, Two, and Three',
            'Did not format three items correctly');
      });

      it('should format many items correctly', function() {
        assert.equal(
            i18n.list(['One', 'Two', 'Three', 'Four', 'Five', 'Six']),
            'One, Two, Three, Four, Five, and Six',
            'Did not format many items correctly');
      });

      it('should accept both an argument list and array', function() {
        assert.equal(i18n.list(), i18n.list([]), 'Calling with empty argument list and array returned different values');
        assert.equal(
            i18n.list('One', 'Two', 'Three', 'Four', 'Five', 'Six'),
            i18n.list(['One', 'Two', 'Three', 'Four', 'Five', 'Six']),
            'Calling with argument list and array returned different values');
      });
    });

    describe('number formatting', function() {
      it('should format an integer correctly', function() {
        assert.strictEqual(i18n.number(1), '1', 'Failed to format an integer');
        assert.strictEqual(i18n.number(0), '0', 'Failed to format 0');
        assert.equal(i18n.number(12), '12', 'Failed with 2 integers');
        assert.equal(i18n.number(123), '123', 'Failed with 3 integers');
        assert.equal(i18n.number(1234), '1,234', 'Failed with 4 integers');
        assert.equal(i18n.number(12345), '12,345', 'Failed with 5 integers');
        assert.equal(i18n.number(123456), '123,456', 'Failed with 6 integers');
        assert.equal(i18n.number(1234567), '1,234,567', 'Failed with 7 integers');
        assert.equal(i18n.number(12345678), '12,345,678', 'Failed with 8 integers');
        assert.equal(i18n.number(123456789), '123,456,789', 'Failed with 9 integers');
        assert.equal(i18n.number(1234567890), '1,234,567,890', 'Failed with 10 integers');
      });

      it('should support decimal place precision', function() {
        assert.equal(i18n.number(1234.1234, 2), '1,234.12', 'Floating point number incorrectly formatted');
        assert.equal(i18n.number(1234.5678, 0), '1,235', 'Incorrect rounding of number');
        assert.equal(i18n.number(1234.5678, 2), '1,234.57', 'Incorrect rounding of number');
        assert.equal(i18n.number(1234, 2), '1,234.00', 'Precision not implemented properly');
        assert.equal(i18n.number(1234.1, 2), '1,234.10', 'Precision not implemented properly');
        assert.equal(i18n.number(1234.5678, 3), '1,234.568', 'Precision not implemented properly');
        assert.equal(i18n.number(1234.5678), i18n.number(1234.5678, 0), 'Precision does not default to 0');
      });

      it('should format a negative number correctly', function() {
        // Note regarding the rounding below:
        // JavaScript rounds to closest, which basically means it rounds the
        // same way no matter if the number is negative or positive.
        assert.strictEqual(i18n.number(-1), '-1', 'Failed with negative integer');
        assert.equal(i18n.number(-123456789), '-123,456,789', 'Failed with 9 negative integers');
        assert.equal(i18n.number(-1234567890), '-1,234,567,890', 'Failed with 10 negative integers');
        assert.equal(i18n.number(-12345.5), '-12,346', 'Failed with negative floating point number');
        assert.equal(i18n.number(-12.9876, 2), '-12.99', 'Failed with negative floating point number');
        assert.equal(i18n.number(-123.9876, 2), '-123.99', 'Failed with negative floating point number');
        assert.equal(i18n.number(-1234.9876, 2), '-1,234.99', 'Failed with negative floating point number');
        assert.equal(i18n.number(-1234567890.9876, 2), '-1,234,567,890.99', 'Failed with negative floating point number');
      });
    });
  });
});
