var css = exports;

var head = document.head || document.getElementsByTagName('head')[0];

// cache
var importCache = {};

css.importSheet = function(name) {
  var _name = name.match(/^(\$(?:[^\/]+)\/)(?!css)(.*)/);
  if (_name) name = _name[1].replace('$', '') + 'css/' + _name[2];
  name += '.css';

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

/**
 * Trims whitespace from the start and end of a given string.
 * @private
 * @param {string} string The string to trim.
 * @return {string} The trimmed string.
 */
function _trim(string) {
  return string.replace(/^\s+|\s+$/g, '');
}

/**
 * Adds a named CSS class to the element's class list. This method is slightly
 * different from using classList.add in that it will not add 'undefined' to
 * the list if no class name is given. If the class name is already in the list,
 * nothing will happen when.
 *
 * @param {Element} element The DOM element whose class list to modify.
 * @param {string=} opt_className The name of the class to add to the list.
 */
exports.addClass = function(element, opt_className) {
  if (element && opt_className && (' ' + element.className + ' ').indexOf(' ' + opt_className + ' ') == -1) {
    var modified = element.className + ' ' + opt_className;
    element.className = _trim(modified);
  }
};

/**
 * Removes a named CSS class from the element's class list. This method is
 * slightly different from using classList.remove in that it will not remove
 * 'undefined' from the list if no class name is given. If the class name is
 * not in the list, nothing will happen when.
 *
 * @param {Element} element The DOM element whose class list to modify.
 * @param {string=} opt_className The name of the class to remove from the list.
 */
exports.removeClass = function(element, opt_className) {
  if (element && opt_className) {
    var modified = element.className.replace(new RegExp('(\\s|^)' + opt_className + '(\\s|$)', 'gi'), ' ');
    element.className = _trim(modified);
  }
};

/**
 * Check if the element has a certain CSS class.
 *
 * @param {Element} element The DOM element whose class list to modify.
 * @param {string} className The name of the class to check for existance.
 */
exports.hasClass = function(element, className) {
  if (!element) return false;
  return !!~(' ' + element.className + ' ').indexOf(' ' + className + ' ');
};

/**
 * The following CSS functions are deprecated. Will be removed once no one is
 * using them. Instead use the functions above.
 *
 * @deprecated Use addClass and removeClass.
 * @see addClass
 * @see removeClass
 */
css.classList = {
  add: function(elem, className) {
    if (elem && !this.contains(elem, className)) {
      elem.className = this.trim(elem.className + ' ' + className);
    }
  },
  remove: function(elem, className) {
    if (elem) {
      elem.className = this.trim(elem.className.replace(new RegExp('(\\s|^)' + className + '(\\s|$)', 'gi'), ' '));
    }
  },
  contains: function(elem, className) {
    return elem ? !!~(' ' + elem.className + ' ').indexOf(' ' + className + ' ') : false;
  },
  trim: function(string) {
    return string.replace(/^\s+|\s+$/g, '');
  }
};
