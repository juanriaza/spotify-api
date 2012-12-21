require(['$api/strings/i18n.lang'], function(i18nStrings) {
  /**
   * Combines an array of strings into a localized string representation of the
   * list.
   *
   * @param {...string|Array.<string>} var_args A list of strings to return a
   *     list string for.
   * @return {string} A localized string listing the provided items.
   *
   * @example
   * require(['$api/i18n', function(i18n) {
   *   console.log(i18n.list('One', 'Two', 'Three'));
   *   // => "One, Two, and Three"
   * }]);
   */
  function list(var_args) {
    var items = SP.varargs(arguments);

    if (items.length == 0) {
      return '';
    } else if (items.length == 1) {
      return items[0];
    } else if (items.length == 2) {
      return i18nStrings.get('ListTwo', items[0], items[1]);
    }

    // Use prototype in case we're working with an arguments object here.
    return Array.prototype.reduce.call(items, function(a, b, idx) {
      if (idx == items.length - 1) return i18nStrings.get('ListEnd', a, b);
      return i18nStrings.get(idx == 0 ? 'ListStart' : 'ListMiddle', a, b);
    });
  }

  /**
   * Character which separates the whole part from the fractional part in a
   * number (decimal mark).
   * @const
   */
  var DECIMAL_SEPARATOR = i18nStrings.get('NumberDecimalSeparator');

  /**
   * Character which separates groups of thousands in the whole part of a
   * number.
   * @const
   */
  var THOUSANDS_SEPARATOR = i18nStrings.get('NumberThousandsSeparator');

  /**
   * Formats a number according to the current locale.
   *
   * @param {number} value The number to format.
   * @param {number=} opt_precision The decimal precision to use to format the
   *     number. If this is not provided, the number will be presented as an
   *     integer.
   * @return {string} A string representation of the number according to the
   *     current locale.
   *
   * @example
   * require(['$api/i18n', function(i18n) {
   *   console.log(i18n.number(12345.6789, 2));
   *   // => "12,345.68"
   * }]);
   */
  function number(value, opt_precision) {
    // TODO(blixt): Support Lakh/Crore grouping?
    value = value.toFixed(opt_precision || 0);

    // First deal with the decimal point (if any).
    var idx = value.indexOf('.');
    if (idx > -1) {
      value = value.substring(0, idx) + DECIMAL_SEPARATOR + value.substring(idx + 1);
    } else {
      idx = value.length;
    }

    // Insert a delimiter between every set of three numbers.
    var end = (value[0] == '-' ? 1 : 0);
    while ((idx -= 3) > end) {
      value = value.substring(0, idx) + THOUSANDS_SEPARATOR + value.substring(idx);
    }

    return value;
  }

  exports.DECIMAL_SEPARATOR = DECIMAL_SEPARATOR;
  exports.THOUSANDS_SEPARATOR = THOUSANDS_SEPARATOR;
  exports.list = list;
  exports.number = number;
});
