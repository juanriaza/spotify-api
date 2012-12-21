var slice = Array.prototype.slice;

exports.id = function(id) {
  return document.getElementById(id);
};

exports.query = function(selector, context) {
  context = context || document;
  return context.querySelector(selector);
};

exports.queryAll = function(selector, context) {
  context = context || document;
  return slice.call(context.querySelectorAll(selector));
};

exports.queryClasses = function(className, context) {
  context = context || document;
  return slice.call(context.getElementsByClassName(className));
};

exports.queryTags = function(tag, context) {
  context = context || document;
  return slice.call(context.getElementsByTagName(className));
};
