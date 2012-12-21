'use strict';

var sp = getSpotifyApi();

var r = sp.require('$util/react');
var dom = sp.require('$util/dom');
var kbd = sp.require('$util/keyboard');
var lang = sp.require('$util/language');
var catalog = lang.loadCatalog('$resources/cef_views');
var _ = partial(lang.getString, catalog, 'Profile');

// Some interesting events
var keyDowns = r.fromDOMEvent(window, 'keydown');
var escapes = r.filter(function(e) {
  return 27 === e.keyCode;
}, keyDowns);
var enters = r.filter(function(e) {
  return 13 === e.keyCode;
}, keyDowns);
var arrowDowns = r.filter(function(e) {
  return 40 === e.keyCode;
}, keyDowns);
var arrowUps = r.filter(function(e) {
  return 38 === e.keyCode;
}, keyDowns);

// spotify_link.h for link types
var allowedLinkTypes = [1, // artist
  2, // album
  4
]; // track

var limitResults = partial(limit, 9);

// Input control with token thingies
function TokenInput() {
  var ti = this;
  var inputs;
  var linkEntered;
  var backspacePressed;
  var atStartOfInput;

  ti.tokens = [];

  ti.input = document.createElement('input');
  ti.input.placeholder = _('sProfileFindMusic');

  ti.node = document.createElement('div');
  ti.node.className = 'input token-input';
  ti.node.appendChild(ti.input);

  ti.output = setupAutoComplete(ti);

  ti.message = document.createElement('input');
  ti.message.placeholder = _('sProfileMessage');
  ti.message.setAttribute('id', 'message');
  ti.message.setAttribute('disabled', true);
  ti.message.setAttribute('maxlength', 250);
  ti.messageNode = document.createElement('div');
  ti.messageNode.className = 'input token-message disabled';
  ti.messageNode.appendChild(ti.message);

  inputs = r.fromDOMEvent(ti.input, 'input');
  linkEntered = r.filter(function(e) {
    ti.tokenize();
  }, inputs);

  backspacePressed = r.filter(function(e) {
    return 8 === e.keyCode;
  },
  r.fromDOMEvent(ti.input, 'keydown'));

  atStartOfInput = r.filter(function(e) {
    return 0 === e.currentTarget.selectionStart &&
        0 === e.currentTarget.selectionEnd;
  }, backspacePressed);

  linkEntered.subscribe(function(e) {
    ti.tokenize();
  });

  r.fromDOMEvent(ti.input, 'focus').subscribe(function(e) {
    ti.node.classList.add('focus');
  });

  r.fromDOMEvent(ti.input, 'blur').subscribe(function(e) {
    ti.node.classList.remove('focus');
  });

  r.fromDOMEvent(ti.message, 'focus').subscribe(function(e) {
    ti.messageNode.classList.add('focus');
  });

  r.fromDOMEvent(ti.message, 'blur').subscribe(function(e) {
    ti.messageNode.classList.remove('focus');
  });

  atStartOfInput.subscribe(function(e) {
    ti.removeToken();
  });

  // Escape key pressed while focused
  kbd.whileFocused(ti.input, escapes).subscribe(function(_) {
    ti.input.value = '';
  });

  r.fromDOMEvent(ti.input, 'input').subscribe(
      throttle(
      partial(
      autoComplete,
      partial(searchResultHandler, ti, ti.output)
      ), 500
      )
  );
}

function setupAutoComplete(tokenInput) {
  var ti = tokenInput;
  var output = document.createElement('div');

  var inputFocus = r.fromDOMEvent(ti.input, 'focus');
  var inputBlur = r.fromDOMEvent(ti.input, 'blur');

  // Keyboard nav
  var nodeFocus = r.fromDOMEvent(ti.node, 'focusin');
  var nodeBlur = r.fromDOMEvent(ti.node, 'focusout');

  var outputFocus = r.fromDOMEvent(output, 'focusin');
  var outputBlur = r.fromDOMEvent(output, 'focusout');

  var outputClick = r.fromDOMEvent(output, 'click');
  var windowClick = r.fromDOMEvent(window, 'click');

  output.tabIndex = 1;
  output.classList.add('auto-complete');

  outputClick.subscribe(function(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    ev.currentTarget.classList.remove('show');
    if ('A' === ev.target.tagName) {
      ti.input.value = ev.target.href;
      ti.tokenize();
    }
  });

  r.merge(r.fromDOMEvent(window, 'blur'), windowClick).subscribe(function(e) {
    output.classList.remove('show');
  });

  r['switch'](inputFocus,
      function(e) {
        return r.takeUntil(inputBlur, escapes);
      }).subscribe(function(e) {
    output.classList.remove('show');
  });

  r['switch'](nodeFocus,
      function(e) {
        return r.takeUntil(nodeBlur, escapes);
      }).subscribe(function(e) {
    // Ugly hack to catch clicks
    setTimeout(function() {
      output.classList.remove('show');
    }, 100);
  });

  r['switch'](nodeFocus,
      function(e) {
        return r.takeUntil(nodeBlur, r.merge(arrowUps, arrowDowns));
      }).subscribe(function(e) {
    var links = dom.query('a', output),
        currentLink = dom.queryOne('a.selected', output),
        nextLink,
        dir = 40 === e.keyCode ? 1 : -1;

    if (!currentLink) {
      nextLink = dom.query('a', output).slice(1 === dir ? 0 : dir)[0];
    } else {
      nextLink = links[links.indexOf(currentLink) + dir];
    }
    if (currentLink && nextLink) {
      currentLink.classList.remove('selected');
    }
    if (nextLink) {
      nextLink.classList.add('selected');
    }
    output.focus();
  });

  r['switch'](outputFocus,
      function(e) {
        return r.takeUntil(outputBlur, enters);
      }).subscribe(function(e) {
    e.preventDefault();
    var currentLink = dom.queryOne('a.selected', output);
    if (currentLink) {
      ti.input.value = currentLink;
      ti.tokenize();
      output.classList.remove('show');
    }
  });
  r['switch'](outputFocus,
      function(e) {
        return r.takeUntil(outputBlur, escapes);
      }).subscribe(function(e) {
    e.preventDefault();
    ti.input.value = '';
    ti.input.focus();
  });
  dom.adopt(ti.node, output);

  return output;
}

TokenInput.prototype.tokenize = function() {
  var ti = this;
  if (-1 !== allowedLinkTypes.indexOf(sp.core.getLinkType(ti.input.value)) &&
      ti.tokens.length === 0) {
    ti.addToken();
    ti.disable();
  }
  return ti;
};

TokenInput.prototype.addToken = function() {
  var ti = this,
      val = ti.input.value,
      token = new Token(val, val, ti);

  ti.tokens.push(token);
  ti.node.insertBefore(token.node, ti.input);
  ti.input.value = ' ';
  sp.core.getMetadata(val, {
    onSuccess: function(md) {
      token.setText(md.name.decodeForText());
    },
    onFailure: function() {
      console.log('getMetadata fail.');
    }
  });
  ti.checkForm();
};

TokenInput.prototype.removeToken = function() {
  var ti = this;
  if (0 < ti.tokens.length) {
    ti.tokens.pop().remove();
  }
  if (0 === ti.tokens.length) {
    ti.enable();
    ti.input.select();
  }
  ti.checkForm();
};

TokenInput.prototype.getValues = function() {
  return map(function(t) {
    return t.value;
  }, this.tokens);
};

TokenInput.prototype.checkForm = function() {
  var ti = this,
      button = dom.queryOne('button', this.input.form),
      txtInput = ti.message;

  if (ti.tokens.length > 0) {
    button.removeAttribute('disabled');
    txtInput.removeAttribute('disabled');
    ti.messageNode.classList.remove('disabled');
    txtInput.focus();
  } else {
    button.setAttribute('disabled', true);
    txtInput.setAttribute('disabled', true);
    ti.messageNode.classList.add('disabled');
    ti.input.value = '';
  }
};

TokenInput.prototype.clear = function() {
  var ti = this;
  while (ti.tokens.length) {
    ti.removeToken();
  }
  return ti;
};

TokenInput.prototype.disable = function() {
  this.input.disabled = true;
  return this;
};

TokenInput.prototype.enable = function() {
  this.input.disabled = false;
  return this;
};

function Token(value, text, tokenInput) {
  var t = this;
  t.value = value;
  t.node = document.createElement('div');
  t.contentNode = t.node.cloneNode();
  t.removeNode = t.node.cloneNode();
  t.node.className = 'token';
  t.removeNode.className = 'remove';
  t.node.appendChild(t.contentNode);
  t.node.appendChild(t.removeNode);
  t.setText(text);
  r.fromDOMEvent(this.removeNode, 'click').subscribe(function(e) {
    tokenInput.removeToken();
  });
}

Token.prototype.remove = function() {
  this.node.parentNode.removeChild(this.node);
};

Token.prototype.setText = function(text) {
  this.contentNode.textContent = text;
};

/**
 * @param {function(...):*} f desc TODO.
 * @param {number} t desc TODO.
 * @return {function(...):*} desc TODO..
 */
function throttle(f, t) {
  var toID = null;
  var prevTs = null;
  return function(/*args...*/) {
    var args = arguments;
    var ts = Date.now();
    var elapsed = ts - (prevTs || 0);
    if (toID) {
      clearTimeout(toID);
      toID = null;
    }
    if (elapsed >= t) {
      prevTs = ts;
      f.apply(f, args);
    } else {
      toID = setTimeout(function() {
        prevTs = ts;
        f.apply(f, args);
      }, t - elapsed);
    }
  }
}

// Gross
function limit(max, results) {
  var i = 0;
  var ret = { tracks: [], artists: [], albums: [] };
  while (i < max) {
    if (results.tracks.length) {
      ++i;
      ret.tracks.push(results.tracks.shift());
    }
    if (results.artists.length) {
      ++i;
      ret.artists.push(results.artists.shift());
    }
    if (results.albums.length) {
      ++i;
      ret.albums.push(results.albums.shift());
    }
    if (!results.tracks.length &&
        !results.artists.length &&
        !results.albums.length) {
      break;
    }
  }
  return ret;
}

function autoComplete(handler, event) {
  var searchString = event.target.value,
      lastSearch = searchString;
  if (searchString.trim()) {
    sp.core.search(searchString, {
      onSuccess: function(result) {
        if (lastSearch === searchString) {
          handler(limitResults(result));
        }
      }
    });
  } else {
    handler(null);
  }
}

function searchResultHandler(tokenInput, outputElement, result) {
  if (null === result || (0 === result.tracks.length &&
      0 === result.artists.length &&
      0 === result.albums.length)) {
    outputElement.classList.remove('show');
    return;
  }
  outputElement.classList.add('show');
  outputElement.innerHTML = resultToHtml(result);
}

var resultString = lang.getString(catalog, 'Misc', 'Item by artists');
function artistsString(as) {
  return lang.truncate(map(
      function(a) {
        return a.name;
      }, as).join(', '), 30);
}

function resultToHtml(result) {
  var tracks = '', artists = '', albums = '',
      trackFunc = function(track) {
        return lang.format('<a href="{0}">{1}{2}</a>', track.uri,
            (track.album.cover ? lang.format('<img src="{0}">', track.album.cover) : ''),
            lang.format(resultString, lang.format('<span>{0}</span>', track.name), artistsString(track.artists)));
      },
      albumFunc = function(album) {
        return lang.format('<a href="{0}">{1}{2}</a>', album.uri,
            (album.cover ? lang.format('<img src="{0}">', album.cover) : ''),
            lang.format(resultString, lang.format('<span>{0}</span>', album.name), album.artist.name));
      },
      artistFunc = function(artist) {
        return lang.format('<a href="{0}">{1}{2}</a>', artist.uri,
            (artist.portrait ? lang.format('<img src="{0}">', artist.portrait) : ''),
            lang.format('<span>{0}</span>', artist.name));
      };
  if (result.tracks.length) {
    tracks = lang.format('<div class="tracks">{0}</div>', map(trackFunc, result.tracks).join(''));
  }
  if (result.albums.length) {
    albums = lang.format('<div class="albums">{0}</div>', map(albumFunc, result.albums).join(''));
  }
  if (result.artists.length) {
    artists = lang.format('<div class="artists">{0}</div>', map(artistFunc, result.artists).join(''));
  }
  return lang.format('{0}{1}{2}', tracks, artists, albums);
}

function truncate(str, max) {
  max = max || 15;
  if (str.length > max) {
    return str.slice(0, max) + '…';
  }
  return str;
}

exports.TokenInput = TokenInput;
