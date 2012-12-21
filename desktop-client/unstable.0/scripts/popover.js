/**
 * @fileoverview Functions for showing a popup bubble over an element that for example shows a track to play.
 */

'use strict';

var sp = getSpotifyApi();

/*
 * Imports
 */
var md = sp.require('$api/metadata');
var dom = sp.require('$util/dom');
var fs = sp.require('$util/fs');
var lang = sp.require('$util/language');
var log = sp.require('$util/logger');
var react = sp.require('$util/react');
var social = sp.require('$unstable/social');
var util = sp.require('$util/util');
var ui = sp.require('$unstable/ui');

/*
 * Constants
 */
var CATALOG = lang.loadCatalog('$resources/cef_views');
var _ = partial(lang.getString, CATALOG, 'Generic');

/*
 * Exports
 */
exports.showPopover = popover;
exports.sharePopup = showSharePopover;
exports.shareSocialPopup = showSocialSharePopover;
exports.hidePopover = function() {
  if (null !== _popover) {
    hidePopover(_popover);
  }
};
Object.defineProperty(exports, 'popover', {
  get: function() {
    return _popover;
  }
});

/*
 * Private variables
 */
var shareTemplate = lang.format(fs.readFile('$unstable/templates/share.html'),
    _('sGenericShareMessagePlaceholder'),
    _('sGenericCancel'),
    _('sGenericSend'),
    _('sGenericLoading'));

var DEFAULTS = {
  contentNode: null,
  relativeNode: document.body,
  offsetLeft: 0,
  offsetFlippedLeft: 0,
  offsetTop: 0,
  offsetInvertedTop: 0,
  sharePopoverPrependElem: null
};

var _popover = null;


/**
 * Get the position of an element.
 * @param {Element} element The element to get the position of.
 * @return {{x: number, y: number, width: number, height: number, dX: number, dY: number}} An object with the
 *   coordinates and size of the given element.
 */
function getPosition(element) {
  var pos = findPos(element);
  return {
    x: element.offsetLeft,
    y: element.offsetTop,
    width: element.clientWidth,
    height: element.clientHeight,
    dX: pos[0],
    dY: pos[1]
  };
}


/**
 * Finds the offset of the specified element.
 * @param {Element} obj The element to get the offset of.
 * @return {Array.<number>} The X and Y offsets of the element.
 */
function findPos(obj) {
  var curleft = 0, curtop = 0;
  if (obj.offsetParent) {
    do {
      curleft += obj.offsetLeft;
      curtop += obj.offsetTop;
    } while (obj = obj.offsetParent);
  }
  return [curleft, curtop];
}


/**
 * Removes a Popover from the DOM.
 * @param {Popover} popover The Popover to remove from the DOM.
 * @return {Popover} The Popover.
 */
function removePopover(popover) {
  if (popover.node.parentNode && !popover.visible)
    popover.node.parentNode.removeChild(popover.node);
  return popover;
}


/**
 * Hides a Popover.
 * @param {Popover} popover The Popover to hide.
 * @param {boolean} instant Whether to instantly remove the Popover from the DOM.
 * @param {boolean} sent Whether to apply a style to the Popover indicating it was "sent" (for certain actions).
 * @return {Popover} The Popover.
 */
function hidePopover(popover, instant, sent) {
  if (false === popover.visible)
    return popover;
  popover.visible = false;
  popover.targetNode.classList.remove('selected');
  if (true === instant) {
    removePopover(popover);
    return popover;
  }
  popover.targetNode = null;
  popover.node.offsetWidth;
  if (true === sent) {
    popover.node.classList.add('sent');
  } else {
    popover.node.classList.add('hidden');
  }
  react.takeFirst(react.fromDOMEvent(popover.node, 'webkitAnimationEnd'))
      .subscribe(partial(removePopover, popover));
  return popover;
}


/**
 * Shows a Popover.
 * @param {Popover} popover Popover to show.
 * @param {Element} targetNode The element to attach the Popover to.
 * @return {Popover} The Popover.
 */
function showPopover(popover, targetNode) {
  var p = popover.options.relativeNode;

  if (true === popover.visible) {
    targetNode.classList.remove('selected');
    if (popover.targetNode === targetNode) {
      popover.hide(false);
      return popover;
    } else {
      popover.hide(true);
    }
  }

  sp.core.activate();
  popover.visible = true;
  popover.targetNode = targetNode;
  targetNode.classList.add('selected');

  var pos = getPosition(targetNode);
  var pPos = getPosition(p);
  var top = pos.dY - p.scrollTop;
  var left = pos.dX - p.scrollLeft;

  var bottomProximity = -50; // Some extra pixels for the bouncy animation
  var rightProximity = 0;
  var initialScroll = p.scrollTop; // Stupid, so tied to the DOM, but will do for now

  react.throttle(react.fromDOMEvent(p, 'scroll'), 50).subscribe(function(e) {
    var scrollDiff = Math.abs(initialScroll - e.target.scrollTop);
    if (5 < scrollDiff) popover.hide();
  });
  react.takeFirst(react.filter(function(e) { return 27 === e.which; }, react.fromDOMEvent(window, 'keyup')))
      .subscribe(partial(hidePopover, popover));
  react.fromDOMEvent(window, 'resize').subscribe(partial(hidePopover, popover));

  document.body.appendChild(popover.node);
  popover.node.offsetWidth;

  bottomProximity += document.documentElement.clientHeight - top - popover.node.clientHeight;
  rightProximity += document.documentElement.clientWidth - left - popover.node.clientWidth - popover.options.offsetLeft;

  if (bottomProximity <= 0) {
    popover.node.classList.add('inverted');
    popover.node.style.top = top - popover.node.clientHeight + popover.options.offsetInvertedTop + 'px';
  } else {
    popover.node.classList.remove('inverted');
    popover.node.style.top = top + popover.options.offsetTop + 'px';
  }

  if (rightProximity <= 0) {
    popover.node.classList.add('flipped');
    popover.node.style.left = left - popover.node.clientWidth + popover.options.offsetFlippedLeft + 'px';
  } else {
    popover.node.classList.remove('flipped');
    popover.node.style.left = left + popover.options.offsetLeft + 'px';
  }

  popover.node.classList.remove('hidden');
  popover.node.classList.remove('sent');

  return popover;
}


/**
 * [showSharePopover description]
 * @param {Object} data [description].
 * @param {[type]} uri [description].
 * @param {[type]} elem [description].
 * @param {[type]} options [description].
 * @return {Object} The data that was provided.
 */
function showSharePopover(data, uri, elem, options) {
  var node = document.createElement('div');
  var linkType = sp.core.getLinkType(uri);
  var image;
  var pl;

  node.innerHTML = shareTemplate;
  if (options && options.sharePopoverPrependElem) {
    node.insertBefore(options.sharePopoverPrependElem, node.firstChild);
  }
  node.classList.add('popover-share');

  var artwork = dom.queryOne('.artwork', node);
  var title = dom.queryOne('.title', node);
  var artist = dom.queryOne('.artist', node);
  var form = dom.queryOne('form', node);
  var textarea = dom.queryOne('textarea', form);
  var cancelButton = dom.queryOne('.cancel', form);

  setTimeout(function() {
    textarea.select(); // Refuses to select without the timeout >:|
  }, 10);

  // Special case for playlists, to get a proper mosaic image.
  if (5 === linkType) {
    pl = sp.core.getPlaylist(uri);
    if (pl.loaded) {
      image = new ui.SPImage(pl.cover, pl.uri, pl.name);
      title.textContent = pl.name.decodeForText();
      artist.textContent = pl.owner.name.decodeForText();
      artwork.appendChild(image.node);
    } else {
      pl.addEventListener('change', function onChange(e) {
        if (pl.loaded) {
          image = new ui.SPImage(pl.cover, pl.uri, pl.name);
          title.textContent = pl.name.decodeForText();
          artist.textContent = pl.owner.name.decodeForText();
          artwork.appendChild(image.node);
          pl.removeEventListener('change', onChange);
        }
      });
    }
  } else {
    md.getMetadata(uri, function(md) {
      if (null === md) return;
      if ('track' === md.type) {
        image = new ui.SPImage(md.album.cover, md.uri, md.name);
        title.innerHTML = lang.format('<a href=\"{0}\">{1}</a>', md.uri, md.name);
        artist.innerHTML = map(function(a) {
          return lang.format('<a href=\"{0}\">{1}</a>', a.uri, a.name);
        }, md.artists).join(', ');
      } else if ('artist' === md.type) {
        image = new ui.SPImage(md.portrait, md.uri, md.name);
        title.textContent = md.name.decodeForText();
        dom.empty(artist);
      } else if ('album' === md.type) {
        image = new ui.SPImage(md.cover, md.uri, md.name);
        title.textContent = md.name.decodeForText();
        artist.textContent = md.artist.name.decodeForText();
      } else if ('playlist' === md.type) {
        image = new ui.SPImage(md.cover, md.uri, md.name);
        title.textContent = md.name.decodeForText();
        artist.textContent = md.owner.name.decodeForText();
      }
      image.node.classList.add(md.type);
      artwork.appendChild(image.node);
    });
  }

  if (options)
    options.contentNode = node;
  var sharePopover = popover(options);

  var popupId = +new Date();
  log.logClientEvent('share popover', 'open', '1', '1', {
    popupId: popupId,
    uri: uri
  });
  node.addEventListener('click', function(e) {
    if (e.target.tagName !== 'A' || !e.target.href) return;
    log.logClientEvent('share popover', 'link', '1', '1', {
      popupId: popupId,
      uri: e.target.href
    });
  });

  react.fromDOMEvent(cancelButton, 'click').subscribe(function() {
    log.logClientEvent('share popover', 'cancel', '1', '1', {
      popupId: popupId,
      message: !!textarea.value
    });
    hidePopover(sharePopover);
  });

  react.merge(react.fromDOMEvent(form, 'submit'), react.fromDOMEvent(textarea, 'keyup'))
      .subscribe(function(e) {
        // Detect enter
        if ('keyup' === e.type && 13 !== e.which) return;
        e.preventDefault();

        var node = sharePopover.node;
        var failure = 0;
        var onFailureCb = partial(sp.core.showClientMessage, 2, _('sGenericSendMessageError'));
        var onCompleteCb = function() {
          if (null !== data.facebookUid && 2 === failure || null === data.facebookUid && 1 === failure) {
            onFailureCb();
          }
        };

        var throbber = new dom.Element('div', {className: 'checkmark'});
        throbber.style.height = node.clientHeight - 16 + 'px';
        throbber.style.width = node.clientWidth - 8 + 'px';
        dom.adopt(throbber, document.createElement('div'));
        dom.adopt(node, throbber);

        // Send to Spotify Inbox, if available
        if (data.canonicalUsername) {
          sp.social.sendToInbox(data.canonicalUsername,
              textarea.value,
              uri, {
                onSuccess: function() {},
                onFailure: function() {
                  failure++;
                },
                onComplete: onCompleteCb
              });
        }

        // Send to Facebook, if available
        if (data.facebookUid) {
          social.sendFacebookMessage(
              data.facebookUid,
              textarea.value,
              sp.core.spotifyUriToHttpLink(uri),
              null,
              function() { failure++; },
              onCompleteCb);
        }

        log.logClientEvent('popover', 'share-send', '', '', {
          id: sharePopover.id,
          toFacebook: !!data.facebookUid,
          toSpotify: !!data.canonicalUsername,
          message: !!textarea.value
        });

        setTimeout(function() {
          sharePopover.hide(false, true);
        }, 400);
      });

  sharePopover.show(elem);
  return data;
}


/**
 * Simple wrapper for displaying social share.
 * @param {Event} event [description].
 * @param {[type]} uri [description].
 */
function showSocialSharePopover(event, uri) {
  sp.social.showSharePopup(event.clientX, event.clientY, uri);
}


/**
 * Wrapper that gets/creates the "singleton" Popover.
 * @param {Object} options [description].
 * @return {Popover} The Popover object.
 */
function popover(options) {
  if (null === _popover) {
    _popover = new Popover(options);
  }
  _popover.id = +new Date();
  _popover.setContent(options);

  var ev = {id: _popover.id};
  if (options && options.type) ev.type = options.type;
  if (options && options.uri) ev.uri = options.uri;
  log.logClientEvent('popover', 'open', '', '', ev);

  return _popover;
}



/**
 * Popover constructor
 * @constructor
 * @param {[type]} options [description].
 */
function Popover(options) {
  var self = this;
  this.options = util.merge({}, DEFAULTS, options || {});
  this.node = document.createElement('div');
  this.targetNode = null;
  this.visible = false;
  this.node.classList.add('popover');

  react.fromDOMEvent(this.node, 'click').subscribe(function(e) {
    var isPopOverElement = (e.target.classList.contains('popover')),
            onXBorder,
            onYBorder;

    // Log link clicks
    if (e.target.tagName === 'A' && e.target.href) {
      log.logClientEvent('popover', 'link', '', '', {
        id: self.id,
        uri: e.target.href
      });
    }

    // If the popover element is clicked, trim shadow space
    // around the borders to give the illusion that only
    // the bubble is clickable
    if (isPopOverElement) {
      onXBorder = !!(e.offsetX - 10 < 0 ||
          e.offsetX - 5 > e.target.clientWidth
          );

      if (e.target.classList.contains('inverted')) {
        onYBorder = !!(
            e.offsetY - 7 < 0 ||
            e.offsetY > e.target.clientHeight
                    );
      } else {
        onYBorder = !!(
            e.offsetY - 12 < 0 ||
            e.offsetY - 3 > e.target.clientHeight
                    );
      }
    }

    // Prevent clicks on/in the popover from hiding it
    // unless the click happened in the border image
    if (!(isPopOverElement && (onXBorder || onYBorder))) {
      e.stopPropagation();
    }
  });

  var kaka = react.fromDOMEvent(window, 'click');
  var maka = react.fromDOMEvent(window, 'blur');
  react.merge(kaka, maka).subscribe(function(e) {
    if (sp.core.isApplicationFocused) {
      self.hide();
    }
  });
}


/**
 * Set the content of the Popover.
 * @param {Object} options [description].
 */
Popover.prototype.setContent = function(options) {
  this.options.relativeNode = options.relativeNode || DEFAULTS.relativeNode;
  while (this.node.firstChild) {
    this.node.removeChild(this.node.firstChild);
  }
  this.node.appendChild(options.contentNode);
};


/**
 * Show the Popover.
 * @param {[type]} targetNode [description].
 * @return {Popover} The Popover.
 */
Popover.prototype.show = function(targetNode) {
  return showPopover(this, targetNode);
};


/**
 * Hide the Popover.
 * @param {[type]} instant [description].
 * @param  {[type]} sent [description].
 * @return {Popover} The Popover.
 */
Popover.prototype.hide = function(instant, sent) {
  return hidePopover(this, instant, sent);
};

