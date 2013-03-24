exports.$ = function(selector, ctx) {
  return (ctx || document).querySelector(selector);
};
