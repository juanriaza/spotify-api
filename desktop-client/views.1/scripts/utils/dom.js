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

exports.addEventListener = function(elem, event, handler, useCapture) {
  if (elem.addEventListener) {
    elem.addEventListener(event, handler, !!useCapture);
  } else if (elem.attachEvent) {
    var wrapperHandler = function(e) {
      handler.call(elem, e);
    };
    handler.wrapperHandler = wrapperHandler;
    elem.attachEvent('on' + event, wrapperHandler);
  }
};

exports.removeEventListener = function(elem, event, handler, useCapture) {
  if (elem.removeEventListener) {
    elem.removeEventListener(event, handler, !!useCapture);
  } else if (elem.detachEvent) {
    elem.detachEvent('on' + event, handler.wrapperHandler || handler);
  }
};
