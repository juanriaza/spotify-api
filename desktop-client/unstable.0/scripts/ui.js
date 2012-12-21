/**
 * @fileoverview User interface related utility functions.
 */

'use strict';

var sp = getSpotifyApi();

exports.SPImage = SPImage;
exports.ContextMenu = ContextMenu;
exports.NodeObject = NodeObject;
exports.SubscribeButton = SubscribeButton;

var base = sp.require('$util/base');
var events = sp.require('$util/events');
var promise = sp.require('$util/promise');
var social = sp.require('$unstable/social');

/*
 * Image object supporting spotify URIs and mosaics.
 * Uses a bg image for awesome scaling, until we get (-webkit-)object-fit.
 */
function SPImage(src, uri, title) {
  var self = this;

  if (uri) {
    self.node = document.createElement('a');
    self.node.href = uri;
    self.node.style.display = 'none';
  } else {
    self.node = document.createElement('div');
  }

  if (title) {
    self.node.title = title;
  }

  self.node.classList.add('image');

  if (src.indexOf('spotify:mosaic:') == 0) {
    var promises = [];
    var srcs = map(function(src) { return 'spotify:image:' + src },
        src.slice(15).split(/[,;:]/));
    var domNodeInserted = new promise.Promise();
    self.node.addEventListener('DOMNodeInserted', function domNodeListener() {
      self.node.style.display = 'block';
      domNodeInserted.resolve();
      self.node.removeEventListener('DOMNodeInserted', domNodeListener);
    });
    promises.push(domNodeInserted);
    srcs.forEach(function(src, index) {
      var img = new Image(), p = new promise.Promise();
      img.src = src;
      if (img.complete) {
        p.resolve(img);
      } else {
        img.addEventListener('load', function onLoad() {
          p.resolve(img);
          img.removeEventListener('load', onLoad);
        });
        img.addEventListener('error', function onError() {
          p.reject(img);
          img.removeEventListener('error', onError);
        });
      }
      promises.push(p);
    });

    var p = promise.join.apply(promise, promises);
    p.always(function() {
      var w = self.node.offsetWidth * 2 || 300, // Used as a fallback if all else fails
          h = self.node.offsetHeight * 2 || 300,
          n = Math.floor(Math.sqrt(arguments.length)),
          id = ~~(Math.random() * 1000000),
          context = document.getCSSCanvasContext('2d', 'cover-' + id, w, h);
      context.clearRect(0, 0, w, h);
      for (var i = 0; i < arguments.length && i < n * n; i++) {
        var img = arguments[i];
        var x = i % n, y = Math.floor(i / n);
        context.drawImage(img, x * w / n, y * h / n, w / n, h / n);
      }
      self.node.style.backgroundImage = '-webkit-canvas(cover-' + id + ')';
    });
  }
  else if (src.length) {
    var img = new Image();
    img.src = src;
    if (img.complete) {
      self.node.style.backgroundImage = 'url(\"' + src + '\")';
      self.node.style.display = 'block';
    } else {
      img.addEventListener('load', function onLoad() {
        self.node.style.backgroundImage = 'url(\"' + src + '\")';
        self.node.style.display = 'block';
        img.removeEventListener('load', onLoad);
      });
    }
  }
}

/*
 * Get a node attribute and fall back to an empty string if it doesn't exist.
 */
var attr = function(node, name) {
  if (node.attributes[name] != undefined)
    return node.attributes[name].value;
  else
    return '';
};

/*
 * Parse a string to a boolean.
 *
 * "true"          => true
 * "1"             => true
 * everything else => false
 */
var bool = function(str) {
  return /^(true|1)$/i.test(str);
};

/*
 * Represents a context menu item structure.
 */
function ContextMenuData(label, flags, callback) {
  var self = this;

  self.label = label || '';
  self.flags = flags || 0;
  self.onSelect = callback || null;
  self.onMenu = null;

  self.addItem = function(label, flags, callback) {
    self.add(new ContextMenuData(label, flags, callback));
  };

  self.addSeparator = function() {
    self.add(new ContextMenuData());
  };

  self.addSubMenu = function(label, flags) {
    var sub = new ContextMenuData(label, flags);
    self.add(sub);
    return sub;
  };

  self.add = function(data) {
    if (self.onMenu == null) {
      self.onMenu = [];
    }

    self.onMenu.push(data);
  };

  self.addFromElementById = function(id) {
    self.addNode(document.getElementById(id));
  };

  self.addNode = function(node) {
    if (node.localName != 'menu' || attr(node, 'type') != 'context') {
      return;
    }

    for (var i = 0; i < node.children.length; i++) {
      var child = node.children[i];

      if (child.localName == 'command') {
        self.addItem(
            attr(child, 'label'),
            bool(attr(child, 'disabled')) * ContextMenu.FLAGS.DISABLED |
            bool(attr(child, 'checked')) * ContextMenu.FLAGS.CHECKED |
            (child.style.fontWeight == 'bold') * ContextMenu.FLAGS.BOLD,
            child.onclick
        );
      }
      else if (child.localName == 'menu') {
        var sub = self.addSubMenu(attr(child, 'label'));
        sub.addNode(child);
      }
    }
  };
}

/*
 * A context menu which can be attached to different links or just shown manually.
 */
function ContextMenu(data) {
  var self = this;

  if (data instanceof ContextMenuData) {
    self.data = data;
  }
  else {
    self.data = new ContextMenuData();

    if (typeof data == 'string') {
      self.data.addFromElementById(data);
    }
  }

  self.attach = function() {
    if (arguments.length == 0) {
      return;
    }

    var regexps = arguments;

    window.addEventListener('contextmenu', function(e) {
      if (e.target.href == undefined) {
        return;
      }
      for (var i = 0; i < regexps.length; i++) {
        if (regexps[i].test(e.target.href)) {
          self.show(e.clientX, e.clientY);
          e.preventDefault();
          return;
        }
      }
    });
  };

  self.show = function(x, y) {
    sp.desktop.showContextMenu(self.data, x, y);
  };
}

ContextMenu.FLAGS = {
  CHECKED: 1,
  DISABLED: 2,
  BOLD: 4
};

ContextMenu.REGEXP = {
  ARTIST: /^spotify:artist:[0-9a-zA-Z]{22}$/,
  ALBUM: /^spotify:album:[0-9a-zA-Z]{22}$/,
  SEARCH: /^spotify:search:[^:]+$/,
  TRACK: /^spotify:track:[0-9a-zA-Z]{22}(\?.+)*(#[0-9]+:[0-9]+)*$/,
  PLAYLIST: /^spotify:user:[^:]+:playlist:[0-9a-zA-Z]{22}$/,
  PROFILE: /^spotify:user:[^:]+$/,
  STARRED: /^spotify:user:[^:]+:starred$/,
  AD: /^spotify:ad:[0-9a-zA-Z]{22}$/,
  IMAGE: /^spotify:image:[0-9a-zA-Z]{22}$/,
  APP: /^spotify:app:[^:]+$/
};


/**
 * An object that has a node (DOM element) presenting it.
 * @constructor
 * @implements {module:api/views~View}
 */
function NodeObject() {
  events.EventTarget.call(this);

  /**
   * Element that represents the object.
   * @type {Element}
   * @private
   */
  this._node = null;
}
base.inherit(NodeObject, events.EventTarget);

/**
 * Builds a DOM element that represents the object.
 * @return {Element} The DOM element.
 * @protected
 */
NodeObject.prototype._buildNode = function() {
  throw new Error('Unimplemented _buildNode called on ' + this.constructor.name);
};

/**
 * An element representing the object.
 * @member NodeObject.prototype.node
 * @type {Element}
 */
Object.defineProperty(NodeObject.prototype, 'node', {
  get: function() {
    if (this._node) return this._node;
    return this._node = this._buildNode();
  }});

/**
 * Removes the object's node.
 */
NodeObject.prototype.remove = function() {
  NodeObject._superClass.remove.call(this);

  var n = this._node;
  if (n.parentNode) {
    n.parentNode.removeChild(n);
  }
  this._node = null;
};


/**
 * Cache for {@link SubscribeButton}.
 * @type {Object.<string, Array.<SubscribeButton>}
 * @private
 */
var _subscribeButtons = {};

function _subscriptionChange(username, subscribed) {
  var buttons = _subscribeButtons[username];
  if (!buttons) return;
  buttons.forEach(function(button) {
    button.dispatchEvent({type: 'subscriptionchange', username: username, subscribed: subscribed});
  });
}

social.addEventListener(social.SUBSCRIPTION_ADDED_EVENT, function(evt) {
  evt.detail.forEach(function(username) {
    _subscriptionChange(username, true);
  });
});

social.addEventListener(social.SUBSCRIPTION_REMOVED_EVENT, function(evt) {
  evt.detail.forEach(function(username) {
    _subscriptionChange(username, false);
  });
});

/**
 * A button widget for handling subscriptions.
 * @constructor
 * @extends {NodeObject}
 * @param {string} username The user that the button toggles the subscription of.
 */
function SubscribeButton(username) {
  NodeObject.call(this);

  /**
   * The username of the user to subscribe to/unsubscribe from.
   * @type {string}
   */
  this.username = username;

  if (!_subscribeButtons[username]) _subscribeButtons[username] = [];
  _subscribeButtons[username].push(this);
}
base.inherit(SubscribeButton, NodeObject);

/**
 * Builds a DOM element that represents the widget.
 * @return {Element} The DOM element.
 * @protected
 */
SubscribeButton.prototype._buildNode = function() {
  var node = document.createElement('button');
  node.className = 'sp-button sp-subscription';

  var sub;
  this.addEventListener('subscriptionchange', function(evt) {
    sub = evt.subscribed;
    if (sub) {
      node.classList.add('sp-subscribed');
      // TODO(blixt): Translation.
      node.textContent = 'Following';
    } else {
      node.classList.remove('sp-subscribed');
      // TODO(blixt): Translation.
      node.textContent = 'Follow';
    }
  });

  this.dispatchEvent({
    type: 'subscriptionchange',
    username: this.username,
    subscribed: social.isSubscribed(this.username)});

  var button = this;
  node.addEventListener('click', function() {
    if (button.dispatchEvent({type: 'click'})) {
      var call = (sub ? social.unsubscribe : social.subscribe);
      call(button.username);
    }
  });

  return node;
};

/**
 * Change the user that the button is bound to.
 * @param {string} username The user that the button toggles the subscription of.
 */
SubscribeButton.prototype.setUser = function(username) {
  var oldUsername = this.username;
  if (username == oldUsername) return;
  this.username = username;

  // Remove the button from the old list of subscribe buttons.
  var list = _subscribeButtons[oldUsername];
  list.splice(list.indexOf(this), 1);

  // Add the button to the new list of subscribe buttons.
  list = _subscribeButtons[username];
  if (!list) list = _subscribeButtons[username] = [];
  list.push(this);

  this.dispatchEvent({
    type: 'subscriptionchange',
    username: username,
    subscribed: social.isSubscribed(username)});
};
