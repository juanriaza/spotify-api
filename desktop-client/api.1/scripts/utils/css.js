var css = exports;

var slice = Array.prototype.slice;

var head = document.head || document.getElementsByTagName('head')[0];

// cache
var importCache = {};

css.importSheet = function(name) {
  var _name = name.match(/^(\$(?:[^\/]+)\/)(?!css)(.*)/);
  if (_name) name = _name[1] + 'css/' + _name[2];
  name += '.css';
  console.log(name);

  if (importCache[name]) return this;
  importCache[name] = 1;

  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = name;
  head.appendChild(link);

  return this;
};

css.importSheets = function() {
  if (!arguments.length) return this;
  if (arguments.length == 1) return this.importSheet(arguments[0]);
  for (var i = 0, l = arguments.length; i < l; i++) {
    this.importSheet(arguments[0]);
  }
  return this;
};


var insertedStyles = {};

css.appendStyles = function(id, selectors) {
  id = 'sp-' + id;
  if (insertedStyles[id]) return getElementById(id);
  insertedStyles[id] = 1;

  var style = document.createElement('style');
  style.id = style.name = id;
  if (!selectors) return style;
  var styleStr = '', rules, key;
  for (key in selectors) {
    if (!selectors.hasOwnProperty(key)) continue;
    var selector = selectors[key];
    styleStr += key;
    rules = [];
    for (key in selector) {
      if (!selector.hasOwnProperty(key)) continue;
      rules.push(key + ': ' + selector[key]);
    }
    styleStr += ' {' + rules.join('; ') + '}\n';
  }
  style.innerHTML = styleStr;
  head.appendChild(style);
  return style;
};


css.getStyle = ('currentStyle' in head) ? function(el, style) {
  return el.currentStyle[style];
} : function(el, style) {
  var defaultView = el.ownerDocument.defaultView;
  if (!defaultView) return null;
  var computed = defaultView.getComputedStyle(el, null);
  return (!computed) ? null : computed.getPropertyValue(style);
};
