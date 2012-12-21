var base = exports;
var slice = Array.prototype.slice;

base.bind = (Function.prototype.bind) ? function(fn, thisValue) {
  return fn.bind(thisValue);
} : function(fn, thisValue) {
  return function() {
    return (!arguments.length) ? fn.call(thisValue) : fn.apply(thisValue, arguments);
  };
};

base.partial = (Function.prototype.bind) ? function(fn, thisValue) {
  var args = slice.call(arguments, 1);
  return fn.bind.apply(fn, args);
} : function(fn, thisValue) {
  var args = slice.call(arguments, 2);
  if (!args.length) return this.bind(fn, thisValue);
  return function() {
    return fn.apply(thisValue, !arguments.length ? args : args.concat(slice.call(arguments)));
  };
};

