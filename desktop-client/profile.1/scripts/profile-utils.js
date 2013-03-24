'use strict';

/**
 * Empty a node of all its children
 * @param {Element} node A HTML node.
 * @return {Element} The empty node.
 */
function _empty(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
  return node;
}

/**
 * Helps building a link
 * @param {string} href The href.
 * @param {string} text The link text.
 * @param {?String} cssClass The css class, if any.
 * @return {string} A HTML string.
 */
function _createLinkHelper(href, text, cssClass) {
  var c = cssClass ? ' class="' + cssClass + '"' : '';
  return '<a href="' + href.toSpotifyLink() + '"' + c + '>' + text.decodeForHtml() + '</a>';
}


/**
 * Finds a specific item in an array
 * @param {*} needle Some value.
 * @param {Array} haystack An array.
 * @return {boolean} Whether the item was found or not.
 * @private
 */
function _inArray(needle, haystack) {
  var length = haystack.length;
  for (var i = 0; i < length; i++) {
    if (haystack[i] == needle) return true;
  }
  return false;
}

/**
 * Wraps the console in a singleton, which if enabled will try to detect if a console
 * is available and then log to it
 * @type {Notifier}
 */
var Notifier = function() {
  /**
   * Keeps track of what method to use
   * @type {string}
   * @private
   */
  var _method = 'log';
  /**
   * Settable name for the logger
   * @type {string}
   * @private
   */
  var _name = 'Playlist notifier';
  /**
   * Whether the notifier is active
   * @type {boolean}
   * @private
   */
  var _active = false;
  /**
   * Prints to the console
   * @private
   */
  var _output = function() {
    if (_active) {
      if (window.console && window.console[_method] && window.console[_method].apply) {
        window.console[_method].apply(console, [_name, arguments]);
      }
    }
  };

  return {
    /**
     * Standard log method
     */
    log: function() {
      _method = 'log';
      _output.apply(this, arguments);
    },
    /**
     * Logs with the info method
     */
    info: function() {
      _method = 'info';
      _output.apply(this, arguments);
    },
    /**
     * Logs with the warn method
     */
    warn: function() {
      _method = 'warn';
      _output.apply(this, arguments);
    },
    /**
     * Logs with the error method
     */
    error: function() {
      _method = 'error';
      _output.apply(this, arguments);
    },

    enable: function() {
      _active = true;
    },

    setName: function(name) {
      _name = name;
    }
  };
}();

/**
 * Link type helper to check the type of URI
 * @constructor
 */
function LinkTypeHelper() {
}
LinkTypeHelper.prototype = {
  // TODO: investigate using models.fromURI and inspecting the returned object
  // instead of doing our own parsing.

  isStarredPlaylist: function(uri) {
    var a = ':starred', b = ':publishedstarred';
    return uri.indexOf(a, uri.length - a.length) !== -1 ||
        uri.indexOf(b, uri.length - b.length) !== -1;
  },

  isToplist: function(uri) {
    var a = ':toplist';
    return uri.indexOf(a) !== -1;
  },

  isTrack: function(uri) {
    var a = 'spotify:track:';
    return uri.indexOf(a) === 0;
  },

  isPlaylist: function(uri) {
    var a = 'spotify:user:', b = ':playlist:';
    return (uri.indexOf(a) === 0 && uri.indexOf(b) !== -1) ||
        this.isStarredPlaylist(uri);
  },

  isAlbum: function(uri) {
    var a = 'spotify:album:';
    return uri.indexOf(a) === 0;
  },

  isArtist: function(uri) {
    var a = 'spotify:artist:';
    return uri.indexOf(a) === 0;
  },

  isUser: function(uri) {
    var a = 'spotify:user:';
    return uri.indexOf(a) === 0 && !this.isPlaylist(uri) && !this.isToplist(uri);
  }
};

function _getUserFirstName(user) {
  if (user.artist) {
    return user.name;
  } else {
    if (user.name === user.username) {
      return decodeURIComponent(user.username);
    } else {
      return user.name.split(' ')[0];
    }
  }
}

/**
 * Exports
 */
exports.empty = _empty;
exports.createLinkHelper = _createLinkHelper;
exports.inArray = _inArray;
exports.Notifier = Notifier;
exports.linkTypeHelper = new LinkTypeHelper();
exports.userFirstName = _getUserFirstName;

require('$profile/strings/utils.lang', function(utilsStrings) {
  // Set up a shorthand for getting a translated string.
  var _ = SP.bind(utilsStrings.get, utilsStrings);

  var timeFormats = [
    ['minuteAgoSingle', 120, 60],
    ['minuteAgoPlural', 3600, 60],
    ['hourAgoSingle', 7200, 3600],
    ['hourAgoPlural', 86400, 3600],
    ['dayAgoSingle', 172800, 86400],
    ['dayAgoPlural', 604800, 86400]
  ];

  /**
   * Gets how long ago the provided date/time was.
   * @param {Date|number} time The point in time to show time since.
   * @return {string} A formatted, localized string representing the amount of time between now and the specified time.
   */
  function timeAgo(time) {
    var seconds = (Date.now() - new Date(time)) / 1000;
    var i = 0;
    var number;
    var format;

    if (10 > seconds) {
      return _('now');
    } else if (60 > seconds) {
      return _('momentAgo');
    } else if (604800 < seconds) {
      // More than a week ago, just show date
      return dateString(new Date(time));
    }

    while (timeFormats[i]) {
      format = timeFormats[i];
      if (seconds < format[1]) {
        number = Math.floor(seconds / format[2]);

        return _(format[0], number);
      }
      i++;
    }
  }

  /**
   * Formats the given date according to ISO 8601
   * @param {Date} d The date to format.
   * @return {string} The formatted date, according to ISO 8601.
   * @private
   */
  function dateString(d) {
    return d.getFullYear() + '-' +
        ('0' + (d.getMonth() + 1)).slice(-2) + '-' +
        ('0' + d.getDate()).slice(-2);
  }

  exports.timeAgo = timeAgo;
});
