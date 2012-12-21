'use strict';

(function(g) {
  var sp,
      cache = {},
      moduleCache = {};

  function _getModule(module) {
    return moduleCache[module] || (moduleCache[module] = window._getSpotifyModule(module));
  }

  function _getSpotifyApi() {
    return sp || (sp = {
      get bridge() { return _getModule('bridge'); },
      get core() { return _getModule('core'); },
      get desktop() { return _getModule('desktop'); },
      get social() { return _getModule('social'); },
      get trackPlayer() { return _getModule('trackPlayer'); },
      get tutorial() { return _getModule('tutorial'); },
      get whatsnew() { return _getModule('whatsnew'); },
      get installer() { return _getModule('installer'); },
      get bundles() { return _getModule('bundles'); },
      get require() { return _require; },
      get requireAsync() { return _requireAsync; }
    });
  }

  Object.defineProperty(g, 'getSpotifyApi', {
    get: function() {
      return _getSpotifyApi;
    }
  });

  function _require(module) {
    var _name = module.match(/^(\$(?:[^\/]+)\/)(?!scripts)(.*)/);
    if (_name) module = _name[1] + 'scripts/' + _name[2];
    module += '.js';

    if (cache[module]) {
      return cache[module];
    }

    var code = sp.core.readFile(module);
    if (undefined === code) {
      throw new Error('Could not load module: ' + module);
    }

    var exports = {};
    code += '\n//@ sourceURL=' + module + '\n';
    try {
      // NOTE: we still have to pass require as an argument for legacy apps.
      // TODO: remove this when all apps have been updated to use the new frameworks.
      new Function('exports, require, __code', 'eval(__code)').call({}, exports, sp.require, code);
    } catch (error) {
      error.message += error.stack + '\n\n';
      error.message += 'Code: \n\n' + code;
      throw error;
    }

    return (cache[module] = exports);
  }

  function _requireAsync(module, callback) {
    setTimeout(function() {
      var m = _require(module);
      callback(m);
    }, 0);
  }


  /*
   * String Extensions to prevent scripting injections
   */

  var entityMatcher = /&(amp|lt|gt|quot|apos|equals);/g,
      entityToChar = {
        'lt': '<',
        'gt': '>',
        'amp': '&',
        'quot': '"',
        'apos': '\'',
        'equals': '='
      };

  function mapEntityToChar(_, entity) {
    return entityToChar[entity];
  }

  String.prototype.decodeForText = function() {
    return this.replace(entityMatcher, mapEntityToChar);
  };

  String.prototype.decodeForLink = function() {
    return encodeURI(this.decodeForText());
  };


  var charMatcher = /([<>&"'=])/g,
      charToEntity = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        '\'': '&apos;',
        '=': '&equals;'
      };

  function mapCharToEntity(_, ch) {
    return charToEntity[ch];
  }

  String.prototype.encodeForHTML = function() {
    return this.replace(charMatcher, mapCharToEntity);
  };

  String.prototype.decodeForHTML = function() {
    return this;
  };

}(this));

function compare(x, y) {
  return x === y ? 0 : x <= y ? -1 : 1;
}

function id(x) {
  return x;
}

function constant(x, _) {
  return x;
}

function eq(a, b) {
  return a === b;
}

function not(b) {
  return !b;
}

function map(f, xs) {
  var length = xs.length;
  var ys = [];
  var i = 0;
  while (i < length) {
    ys[i] = f(xs[i++]);
  }
  return ys;
}

function filter(p, xs) {
  var length = xs.length;
  var ys = [];
  var i = 0;
  var j = 0;
  while (j < length) {
    if (true === p(xs[j])) {
      ys[i++] = xs[j];
    }
    ++j;
  }
  return ys;
}

function foldl(f, z, xs) {
  var length = xs.length;
  var i = 0;
  while (i < length) {
    z = f(z, xs[i++]);
  }
  return z;
}

function foldr(f, z, xs) {
  var i = xs.length;
  while (i--) {
    z = f(xs[i], z);
  }
  return z;
}

function force(f, x) {
  return f(x);
}

function flip(f) {
  return function(x, y) {
    return f(y, x);
  };
}

function compose() {
  var fs = arguments;
  return function(x) {
    return foldr(force, x, fs);
  };
}

function partial() {
  var args = idMap(arguments);
  var f = args.shift();
  return function() {
    return f.apply(null,
                   args.concat(idMap(arguments)));
  };
}

function idMap(xs) {
  return map(id, xs);
}
