/**
 * Just a simple mocking function.
 * Should probably be replaced with a serious mocking library in the future.
 */
'use strict';

/**
 * Creates a mock object with methods based on the string input
 * arguments. Can also take a list of objects and return the
 * union of those objects as a mock.
 *
 * Does not mock private arguments, that is arguments that start
 * with _.
 * mock('foo','bar','baz') => F.prototype.foo,bar,baz} = _;
 *
 * @return {Object} a mocked object.
 *
 */
exports.mock = function() {
  function F() {};
  var args = arguments, _ = function() {};
  if (typeof(args[0]) === 'string') {
    [].forEach.call(args, function(m) { F.prototype[m] = _ });
  } else {
    [].forEach.call(args, function(m) {
      for (var k in m.prototype) {
        if (!F.prototype.hasOwnProperty(k) && k.indexOf('_') != 0) {
          switch (typeof(m.prototype[k])) {
            case 'function': F.prototype[k] = _; break;
            case 'string': F.prototype[k] = ''; break;
            case 'number': F.prototype[k] = 0; break;
            default: F.prototype[k] = undefined;
          }
        }
      }
    });
  }
  return F;
};
