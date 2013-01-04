/**
 * @fileoverview Various UI buttons.
 * @module views/buttons
 */

require([
  '$api/library#Library',
  '$api/models',
  '$api/relations#Relations',
  '$views/popup#Popup',
  '$views/strings/buttons.lang',
  '$views/utils/css',
  '$views/utils/dom'
], function(Library, models, Relations, Popup, buttonsStrings, css, dom) {
  var _ = SP.bind(buttonsStrings.get, buttonsStrings);

  /**
   * This is the base button class for all buttons in Spotify. It is not used
   * directly but instead serves as the base class for the two public button
   * base classes we have: the CustomButton and the Button. It has no particular
   * appearance and handles the basic button tracking behavior and setting the
   * label and icon of the button.
   *
   * @class BaseButton
   * @private
   *
   * @param {string} cssClass The CSS class to apply to the button element.
   * @param {string=} opt_label The button label.
   * @param {string=} opt_icon The icon URL.
   *
   * @property {string} label The button label. Use the setLabel method to
   *     change the label of the button. Directly changing the property will
   *     have no effect.
   * @property {string} icon The icon URL. Use the setIcon method to change
   *     the icon of the button. Directly changing the property will have no
   *     effect.
   *
   * @see Button
   * @see CustomButton
   */
  function BaseButton(cssClass, opt_label, opt_icon) {
    this.accentuated = false;
    this.disabled = false;
    this._accentuatedEffect = null;
    this._nodeClass = cssClass;

    this._setupTouch();
    this._buildButton();
    this._addBehavior();

    this.label = '';
    if (typeof opt_label === 'string') {
      this.setLabel(opt_label);
    }

    this.icon = '';
    if (typeof opt_icon === 'string') {
      this.setIcon(opt_icon);
    }

    this.addEventListener('click', this._clicked);
  }
  SP.inherit(BaseButton, models.Observable);

  /**
   * Gets the width the provided text would have if the button label was set to
   * it.
   * @param {string} text The text to get the width for.
   * @param {string=} opt_cssClass The CSS class to test for. Defaults to the
   *     CSS class(es) that the button currently has.
   * @return {number} The width of the text, in pixels.
   */
  BaseButton.prototype.getTextWidth = function(text, opt_cssClass) {
    // Get measurement nodes which will be used to determine the width of the
    // text.
    var node, span;
    if (BaseButton._measureNode) {
      node = BaseButton._measureNode;
      span = BaseButton._measureNodeSpan;
    } else {
      node = document.createElement('button');
      node.style.position = 'absolute';
      node.style.visibility = 'hidden';

      span = document.createElement('span');
      span.className = 'sp-button-text';
      node.appendChild(span);

      BaseButton._measureNode = node;
      BaseButton._measureNodeSpan = span;
    }

    // Apply the CSS classes to the measurement nodes.
    document.body.appendChild(node);
    node.className = (typeof opt_cssClass == 'string') ? opt_cssClass : this.node.className;
    span.textContent = text;
    var width = span.getBoundingClientRect().width;
    document.body.removeChild(node);

    return width;
  };

  /**
   * Set the label of the button. The label should be a regular string without
   * any HTML tags. Any HTML tags will just show up as text in the button face.
   *
   * @since 1.0.0
   *
   * @param {string} label The button label.
   * @example
   * var button = Button.withLabel('Show Review');
   * ...
   * button.setLabel('Hide Review');
   */
  BaseButton.prototype.setLabel = function(label) {
    this.label = label;
    this._label.data = label || '';
  };

  /**
   * Set the icon of the button. The icon must be 15x15 pixels, otherwise it
   * will be scaled down to fit. Double resolution icon should be 30x30 pixels.
   *
   * @since 1.0.0
   *
   * @param {string} url The URL of the icon. The URL must be a relative URL
   *     pointing to a file in the application's bundle.
   * @param {string=} opt_cssClass An optional CSS class to apply to the icon.
   *     This should be used when using icons from sprite sheets to offset the
   *     sheet properly. The CSS class should affect only the
   *     background-position of the element.
   */
  BaseButton.prototype.setIcon = function(url, opt_cssClass) {
    if (typeof opt_cssClass === 'string') {
      this.setIconClass(opt_cssClass);
    }

    this.icon = url;
    this._icon.style.backgroundImage = (url ? 'url("' + url + '")' : null);
    this._icon.style.display = (url ? 'inline-block' : 'none');
  };

  /**
   * Set the icon class of the button. The icon file will stay the same.
   *
   * @since 1.0.0
   *
   * @param {string} cssClass The CSS class to apply to the icon.
   *     This should be used when using icons from sprite sheets to offset the
   *     sheet properly. The CSS class should affect only the
   *     background-position of the element.
   */
  BaseButton.prototype.setIconClass = function(cssClass) {
    css.removeClass(this._icon, this._iconClass);
    css.addClass(this._icon, cssClass);
    this._iconClass = cssClass;
  };

  /**
   * Set the button to be disabled.
   *
   * @param {boolean} disabled Whether the button should be disabled or not.
   */
  BaseButton.prototype.setDisabled = function(disabled) {
    this.disabled = !!disabled;

    if (this.disabled) {
      this.node.setAttribute('disabled', 'disabled');
    } else {
      this.node.removeAttribute('disabled');
    }
  };

  /**
   * A conversion table of accentuation effect literals to CSS classes.
   * @enum {string}
   * @private
   */
  BaseButton._accentuationEffects = {
    'positive': 'sp-button-accentuated-positive',
    'negative': 'sp-button-accentuated-negative'
  };

  /**
   * Set the accentuation of the button. An accentuated button will appear in a
   * way such as to draw the attention of the user. In the current version of
   * Spotify the button will have a green tint. This might change in the
   * future.
   *
   * @since 1.0.0
   *
   * @param {boolean} accentuated Whether the button should be accentuated or
   *     not.
   * @param {string=} opt_effect The effect of the button.
   *     Not considered if the first argument is false.
   *     'positive': Use a positive color (green in this version). Default.
   *     'negative': Use a negative color (red in this version).
   *
   * @example
   * var button = Button.withLabel('Create Room');
   * button.setAccentuated(true);
   */
  BaseButton.prototype.setAccentuated = function(accentuated, opt_effect) {
    this.accentuated = accentuated;

    var effects = BaseButton._accentuationEffects;

    if (this._accentuatedEffect in effects) {
      css.removeClass(this.node, effects[this._accentuatedEffect]);
      this._accentuatedEffect = null;
    }

    if (accentuated) {
      var defaultEffect = 'positive';
      var effect = effects[opt_effect] ? opt_effect : defaultEffect;
      var effectCSSClass = effects[effect];

      css.addClass(this.node, 'sp-button-accentuated');
      css.addClass(this.node, effectCSSClass);
      this._accentuatedEffect = effect;
    } else {
      css.removeClass(this.node, 'sp-button-accentuated');
    }
  };

  BaseButton.prototype._setupTouch = function() {
    this._touchDevice = ('ontouchstart' in window || 'createTouch' in document);
    this.touchPreventsScrolling = true;
  }

  BaseButton.prototype._buildButton = function() {
    this.node = document.createElement('button');
    this.node.setAttribute('type', 'button');
    css.addClass(this.node, this._nodeClass);

    var text = document.createElement('span');
    css.addClass(text, 'sp-button-text');
    this.node.appendChild(text);

    this._icon = document.createElement('div');
    css.addClass(this._icon, 'sp-button-icon');
    if (this.icon) {
      this._icon.style.backgroundImage = 'url("' + this.icon + '")';
    }
    text.appendChild(this._icon);

    this._label = document.createTextNode(this.label || '');
    text.appendChild(this._label);
  };

  /**
   * Add the right behavior for the button.
   * This includes fixing click events and active states for the button.
   * Touch devices will be using touch events instead of click to be more responsive.
   *
   * @private
   */
  BaseButton.prototype._addBehavior = function() {
    var self = this;
    dom.addEventListener(this.node, this._touchDevice ? 'touchstart' : 'mousedown', function(event) { self._startHandler(event); });
    dom.addEventListener(document, this._touchDevice ? 'touchmove' : 'mousemove', function(event) { self._moveHandler(event); });
    dom.addEventListener(document, this._touchDevice ? 'touchend' : 'mouseup', function(event) { self._endHandler(event); });
  };

  /**
   * Event handler for touchstart or mousedown, depending on the platform. Used
   * to find the center point of the button and start tracking the button. The
   * button state is set to active. For touch devices the default event handler
   * will be prevented, so that the page does not scroll when moving the finger
   * while tracking the button.
   *
   * @private
   * @param {Event} event DOM event object.
   */
  BaseButton.prototype._startHandler = function(event) {
    if (this.disabled) { return; }
    if (!this._touchDevice || !this.touchPreventsScrolling)
      event.preventDefault();

    this._buttonPos = this._getPos();

    this._active = true;
    css.addClass(this.node, 'sp-button-active');
  };

  /**
   * Event handler for touchmove or mousemove, depending on the platform. Used
   * to switch the active state when the pointer is moved out of or into the
   * button. For touch devices, a padding outside the element is added to make
   * the hit area larger.
   *
   * @private
   * @param {Event} event DOM event object.
   */
  BaseButton.prototype._moveHandler = function(event) {
    if (!this.disabled && this._active) {
      if (this._isPointerInside(event))
        css.addClass(this.node, 'sp-button-active');
      else
        css.removeClass(this.node, 'sp-button-active');
    }
  };

  /**
   * Event handler for touchend or mouseup, depending on the platform. Used to
   * only trigger the click behavior when the pointer is actually still inside
   * the element. iOS will trigger the end event on the button element even if
   * the pointer is released outside the element, so we must check to verify
   * that the click handler should be called. For touch devices, a padding
   * outside the element is added to make the hit area larger.
   *
   * @private
   * @param {Event} event DOM event object.
   */
  BaseButton.prototype._endHandler = function(event) {
    if (!this.disabled && this._active) {
      this._active = false;
      css.removeClass(this.node, 'sp-button-active');
      this.dispatchEvent('pointerend');

      if (this._isPointerInside(event)) {
        // Dispatch a synthetic click event with the original browserEvent as a
        // property, in case anyone needs to do something exceptionally fancy.
        var newEvent = {type: 'click', browserEvent: event};
        this.dispatchEvent(newEvent);
      }
    }
  };

  /**
   * Get position of the button.
   *
   * @private
   *
   * @return {Object} Position object with top/bottom/left/right,
   *     including some padding for hit area.
   */
  BaseButton.prototype._getPos = function() {
    var scrollValues = this._scrollValues || {};
    scrollValues.x = (window.pageXOffset || document.documentElement.scrollLeft);
    scrollValues.y = (window.pageYOffset || document.documentElement.scrollTop);
    this._scrollValues = scrollValues;

    var buttonPos = this._buttonPos || {};
    var rect = this.node.getBoundingClientRect();
    var paddingX = (this._touchDevice ? 20 : -1);
    var paddingY = (this._touchDevice ? 20 : -1);

    buttonPos.left = (rect.left + scrollValues.x) - paddingX;
    buttonPos.top = (rect.top + scrollValues.y) - paddingY;
    buttonPos.right = buttonPos.left + rect.width + (paddingX * 2);
    buttonPos.bottom = buttonPos.top + rect.height + (paddingY * 2);

    return buttonPos;
  };

  /**
   * Find out if the pointer is inside the button element. On touch devices we
   * include some extra padding around the button that is considered to be
   * still within the button. This mimics the standard behavior for native
   * buttons on iOS and helps with activating the buttons on small screens.
   *
   * @private
   * @param {Event} event DOM event object.
   */
  BaseButton.prototype._isPointerInside = function(event) {
    var pos = {
      x: (this._touchDevice ? event.changedTouches[0].pageX : event.pageX),
      y: (this._touchDevice ? event.changedTouches[0].pageY : event.pageY)
    };

    var buttonPos = this._buttonPos || this._getPos();
    var isInsideX = (pos.x > buttonPos.left) && (pos.x <= buttonPos.right);
    var isInsideY = (pos.y > buttonPos.top) && (pos.y <= buttonPos.bottom);

    return (isInsideX && isInsideY);
  };

  /**
   * All buttons in the application should be created with this class. This
   * ensures that the appearance and behavior of the button is consistent with
   * other applications within Spotify. Not using this class, or one of its
   * subclasses, will create buttons that will look out of place in the Spotify
   * platform. On mobile devices the tracking behavior of regular HTML buttons
   * has a built-in delay that the Spotify button does not suffer from.
   *
   * @class Button
   * @extends {BaseButton}
   */
  function Button(opt_label, opt_icon) {
    BaseButton.call(this, 'sp-button', opt_label, opt_icon);
    /**
     * The current size of this button. To change the size, use
     * {@link Button#setSize} because changing this property has no effect.
     * @type {string}
     */
    this.size = 'normal';
  }
  SP.inherit(Button, BaseButton);

  /**
   * Creates a Button with a given label and, optionally, an icon.
   *
   * @since 1.0.0
   *
   * @param {string=} opt_label The button label.
   * @param {string=} opt_icon The URL of the icon. The URL must be a relative
   *     URL pointing to a file in the application's bundle. This parameter is
   *     optional.
   * @return {Button} A Button instance.
   *
   * @example
   * var post = Button.withLabel('Post Comments');
   */
  Button.withLabel = function(opt_label, opt_icon) {
    return new Button(opt_label, opt_icon);
  }

  /**
   * A conversion table of size literals to CSS classes.
   * @enum {string}
   * @private
   */
  Button._sizes = {
    normal: '',
    small: 'sp-button-small'
  };

  /**
   * Sets the size of the button.
   * @param {string} size The size to set the button to. Valid sizes are:
   *     "normal": The default size of the button.
   *     "small": A smaller, more compact version of the button.
   */
  Button.prototype.setSize = function(size) {
    if (this.size == size) return;
    if (!(size in Button._sizes)) {
      throw new Error(size + ' is not a valid size');
    }
    css.removeClass(this.node, Button._sizes[this.size]);
    css.addClass(this.node, Button._sizes[size]);
    this.size = size;
  };

  /**
   * The BaseButton does not have a background element so we need to override
   * the build function to append it to the DOM after the node has been
   * constructed.
   *
   * @private
   */
  Button.prototype._buildButton = function() {
    Button._superClass._buildButton.call(this);

    var bg = document.createElement('span');
    css.addClass(bg, 'sp-button-background');
    this.node.appendChild(bg);
  };

  /**
   * A button without any appearance, optionally with a label. The custom button
   * must by styled with regular CSS by adding custom CSS classes to the node.
   * It is better to use the this button as a base for a customized button
   * rather than a regular HTML button element, because they will not track well
   * on all platforms, such as iOS and Android. To create an instance of this
   * button, call the withClass factory method.
   *
   * @class CustomButton
   * @extends {BaseButton}
   * @since 1.0.0
   *
   * @see CustomButton#withClass
   */
  function CustomButton(cssClass, label, icon) {
    BaseButton.call(this, 'sp-button-empty ' + cssClass, label, icon);
  }
  SP.inherit(CustomButton, BaseButton);

  /**
   * Creates a CustomButton with a given CSS class and, optionally, a label and
   * an icon.
   *
   * @since 1.0.0
   *
   * @param {string} cssClass The CSS class to apply to the button element.
   * @param {string=} opt_label The button label. This parameter is optional.
   * @param {string=} opt_icon The URL of the icon. The URL must be a relative
   *     URL pointing to a file in the application's bundle. This parameter is
   *     optional.
   * @return {CustomButton} A CustomButton instance.
   *
   * @example
   * var randomize = CustomButton.withClass('randomize');
   */
  CustomButton.withClass = function(cssClass, opt_label, opt_icon) {
    return new CustomButton(cssClass, opt_label, opt_icon);
  };

  /**
   * A share button for an album, artist, playlist or track. The share button
   * will show the standard share popup when clicked. Do not customize the
   * behavior of the share buttons to present another type of sharing dialog.
   * Call one of the factory methods to create a new instance of this button
   * type.
   *
   * @class ShareButton
   * @extends {Button}
   * @since 1.0.0
   *
   * @see ShareButton#forAlbum
   * @see ShareButton#forArtist
   * @see ShareButton#forPlaylist
   * @see ShareButton#forTrack
   */
  function ShareButton(item) {
    Button.call(this, _('ButtonShare'));
    this.setIconClass('sp-icon-share');
    this.item = item;
  }
  SP.inherit(ShareButton, Button);

  /**
   * The share button will when clicked open the client's share UI relative to
   * itself.
   *
   * @private
   */
  ShareButton.prototype._clicked = function() {
    var message = '';

    var rect = this.node.getBoundingClientRect();
    var x = rect.left + rect.width / 2;
    var y = rect.top + rect.height / 2;
    var point = { x: x, y: y };

    models.client.showShareUI(this.item.uri, message, point);
  };

  /**
   * Creates a ShareButton with a given album.
   *
   * @since 1.0.0
   *
   * @param {Album} album The album to share when clicking the button.
   * @return {ShareButton} A ShareButton instance.
   */
  ShareButton.forAlbum = function(album) {
    return new ShareButton(album);
  };

  /**
   * Creates a ShareButton with a given artist.
   *
   * @since 1.0.0
   *
   * @param {Artist} artist The artist to share when clicking the button.
   * @return {ShareButton} A ShareButton instance.
   */
  ShareButton.forArtist = function(artist) {
    return new ShareButton(artist);
  };

  /**
   * Creates a ShareButton with a given playlist.
   *
   * @since 1.0.0
   *
   * @param {Playlist} playlist The playlist to share when clicking the button.
   * @return {ShareButton} A ShareButton instance.
   */
  ShareButton.forPlaylist = function(playlist) {
    return new ShareButton(playlist);
  };

  /**
   * Creates a ShareButton with a given track.
   *
   * @since 1.0.0
   *
   * @param {Track} track The track to share when clicking the button.
   * @return {ShareButton} A ShareButton instance.
   */
  ShareButton.forTrack = function(track) {
    return new ShareButton(track);
  };

  /**
   * A button to start a Spotify radio station with an album, artist, playlist
   * or track. Do not customize the behavior of the standard radio button to
   * start any other type of radio station. To start a custom radio within your
   * application, use a standard button with a custom icon, to distinguish it
   * from the Spotify radio. Call one of the factory methods to create a new
   * instance of this button type.
   *
   * @class StartRadioButton
   * @extends {Button}
   * @since 1.0.0
   *
   * @see StartRadioButton#forAlbum
   * @see StartRadioButton#forArtist
   * @see StartRadioButton#forPlaylist
   * @see StartRadioButton#forTrack
   */
  function StartRadioButton(item) {
    Button.call(this, _('ButtonStartRadio'));
    this.setIconClass('sp-icon-radio');
    this.item = item;
  }
  SP.inherit(StartRadioButton, Button);

  /**
   * The button will open the radio app when click and give it the URI of the
   * item that was used to create the button. The label or icon of the button
   * does not change to match the fact that the radio station is now playing.
   *
   * @private
   */
  StartRadioButton.prototype._clicked = function() {
    var uri = this.item.uri.replace(/^spotify:/, 'spotify:radio:');
    models.application.openURI(uri);
  };

  /**
   * Creates a StartRadioButton with a given album.
   *
   * @since 1.0.0
   *
   * @param {Album} album The album to seed the radio with when clicking
   *     the button.
   * @return {StartRadioButton} A StartRadioButton instance.
   */
  StartRadioButton.forAlbum = function(album) {
    if (!(album instanceof models.Album)) throw new Error('not an Album');
    return new StartRadioButton(album);
  };

  /**
   * Creates a StartRadioButton with a given artist.
   *
   * @since 1.0.0
   *
   * @param {Artist} artist The artist to seed the radio with when clicking
   *     the button.
   * @return {StartRadioButton} A StartRadioButton instance.
   */
  StartRadioButton.forArtist = function(artist) {
    if (!(artist instanceof models.Artist)) throw new Error('not an Artist');
    return new StartRadioButton(artist);
  };

  /**
   * Creates a StartRadioButton with a given playlist.
   *
   * @since 1.0.0
   *
   * @param {Playlist} playlist The playlist to seed the radio with when clicking
   *     the button.
   * @return {StartRadioButton} A StartRadioButton instance.
   */
  StartRadioButton.forPlaylist = function(playlist) {
    if (!(playlist instanceof models.Playlist)) throw new Error('not a Playlist');
    return new StartRadioButton(playlist);
  };

  /**
   * Creates a StartRadioButton with a given track.
   *
   * @since 1.0.0
   *
   * @param {Track} track The track to seed the radio with when clicking the
   *     button.
   * @return {StartRadioButton} A StartRadioButton instance.
   */
  StartRadioButton.forTrack = function(track) {
    if (!(track instanceof models.Track)) throw new Error('not a Track');
    return new StartRadioButton(track);
  };

  /**
   * A subscribe button for an artist, playlist or user. The subscribe button
   * will subscribe to the item when clicked or unsubscribe if the item is
   * already subscribed to. Do not customize the behavior of the subscribe
   * buttons to perform any other type of action. Call one of the factory
   * methods to create a new instance of this button type.
   *
   * @class SubscribeButton
   * @extends {Button}
   * @since 1.0.0
   *
   * @see SubscribeButton#forArtist
   * @see SubscribeButton#forPlaylist
   * @see SubscribeButton#forUser
   */
  function SubscribeButton(item) {
    var self = this;

    Button.call(this, _('ButtonSubscribe'));
    this.setIconClass('sp-icon-add');

    // Set a special subscribe CSS class for the button.
    css.addClass(this.node, 'sp-button-subscribe');

    // Update the minimum width of the button based on possible texts.
    this._updateMinWidth();

    /**
     * Whether a request is currently pending.
     * @type {boolean}
     * @private
     */
    this._pending = false;
    /**
     * Whether the visual state of the button is "subscribed".
     * @type {?boolean}
     * @private
     */
    this._subscribed = null;

    // Set the follow/unfollow mode
    var setMode = function(e, hover) {
      self.setAccentuated(!!hover, !!hover ? 'negative' : undefined);
      self.setLabel(!!hover ? _('ButtonUnsubscribe') : _('ButtonSubscribed'));
    };

    // Set the mode to Following if the pointer was released outside,
    // and the current state is subscribed.
    this.addEventListener('pointerend', function(e) {
      if (self._subscribed) {
        setMode(e, false);
      }
    });

    // Detect mouse events on the button, to set the follow/unfollow mode
    var mouseHandler = function(e) {
      if (self.disabled) { return; }
      self._isMouseHovering = e.type === 'mouseover';
      if (self._subscribed) {
        if ((self._active && self._isMouseHovering) || !self._active) {
          setMode(e, self._isMouseHovering);
        }
      }
    };
    dom.addEventListener(this.node, 'mouseover', mouseHandler);
    dom.addEventListener(this.node, 'mouseout', mouseHandler);
    this._mouseHandler = mouseHandler;

    // Set initial state to being not subscribed
    this._setSubscribed(false);

    // Set the item that the button subscribes to.
    this.setItem(item);
  }
  SP.inherit(SubscribeButton, Button);

  /**
   * The button will subscribe to the item that was passed in to the button.
   * If it is already subscribed to, it will unsubscribe.
   *
   * @private
   */
  SubscribeButton.prototype._clicked = function() {
    var subscribed = this.item.subscribed;
    // Don't do anything if we don't know the state or a request is pending.
    if (typeof subscribed != 'boolean' || this._pending) return;

    // Simulate the change visually before kicking off the request.
    this._setSubscribed(!subscribed);

    // Perform the actual subscription request.
    this._updateSubscription(!subscribed);
  };

  /**
   * Convenience function to perform an API call and handle its response.
   * @param {Object} object The object to perform the call on.
   * @param {string} method The name of the method to call on the object.
   * @return {module:api/models~Promise} A promise.
   * @private
   */
  SubscribeButton.prototype._call = function(object, method) {
    this._pending = true;
    return object[method](this.item)
        .done(this, this._done)
        .fail(this, this._fail);
  };

  /**
   * Handler for when a request finishes.
   * @private
   */
  SubscribeButton.prototype._done = function() {
    this._pending = false;

    this.dispatchEvent({
      type: (this._subscribed ? 'subscribe' : 'unsubscribe'),
      item: this.item
    });
  };

  /**
   * Error handler for dispatching an error event.
   * @param {Object} error An error object.
   * @private
   */
  SubscribeButton.prototype._fail = function(error) {
    this._pending = false;

    this.dispatchEvent({
      type: (this._subscribed ? 'subscribe' : 'unsubscribe') + '-fail',
      item: this.item,
      error: error
    });

    // Revert subscribe state.
    this._setSubscribed(this.item.subscribed);
  };

  /**
   * Update the visual state of the button.
   * @param {boolean} subscribe True to show as subscribed, false to show as
   *     not subscribed.
   * @private
   */
  SubscribeButton.prototype._setSubscribed = function(subscribe) {
    if (this._subscribed === subscribe) return;
    this._subscribed = subscribe;

    this.setAccentuated(!subscribe);

    this.setLabel(subscribe ? _('ButtonSubscribed') : _('ButtonSubscribe'));
    this.setIconClass(subscribe ? '' : 'sp-icon-add');

    // Trigger the mouse handler to update the state if the mouse is hovering over the button
    if (this._isMouseHovering) {
      this._mouseHandler.call(this.node, { type: 'mouseover' });
    }
  };

  /**
   * Sets the minimum width of the button based on localized text width.
   */
  SubscribeButton.prototype._updateMinWidth = function() {
    var padding = 4;
    var iconWidth = 20;
    var stringWidths = [
      this.getTextWidth(_('ButtonSubscribe')) + iconWidth,
      this.getTextWidth(_('ButtonSubscribed')),
      this.getTextWidth(_('ButtonUnsubscribe'))
    ];
    var minWidth = Math.max.apply(Math, stringWidths) + padding * 2;
    this.node.style.minWidth = minWidth + 'px';
  };

  /**
   * Update the actual subscription state in the backend.
   * @param {boolean} subscribe True to subscribe, false to unsubscribe.
   * @private
   */
  SubscribeButton.prototype._updateSubscription = function(subscribe) {
    throw new Error('SubscribeButton _updateSubscription not implemented');
  };

  SubscribeButton.prototype.setItem = function(item) {
    if (this.item) {
      this.item.removeEventListener('change:subscribed', this._update);
    }
    this.item = item;

    // Method for updating whether the button is in a subscribed state or not.
    var self = this;
    function update() {
      self._setSubscribed(item.subscribed);
    };
    this._update = update;

    // Do an initial update of the subscribed state, then listen for changes.
    item.load('subscribed').done(function() {
      update();
      item.addEventListener('change:subscribed', update);
    });
  };

  SubscribeButton.prototype.setSize = function(size) {
    SubscribeButton._superClass.setSize.call(this, size);
    this._updateMinWidth();
  };

  /**
   * A subclass of SubscribeButton that knows how to subscribe to playlists and to
   * properly update itself in response to the user it is targeting being
   * subscribed from somewhere else.
   *
   * @class SubscribePlaylistButton
   * @extends {SubscribeButton}
   * @private
   *
   * @param {Playlist} playlist The playlist to subscribe to when the button is
   *     clicked.
   */
  function SubscribePlaylistButton(playlist) {
    if (!(playlist instanceof models.Playlist)) throw new Error('not a Playlist');
    SubscribeButton.call(this, playlist);
  }
  SP.inherit(SubscribePlaylistButton, SubscribeButton);

  /**
   * Display a popup that informs the user they are also following the owner of
   * the playlist they just subscribed to. This popup also lets them unfollow
   * that user if they did not want to follow them after all.
   * @private
   *
   * @since 1.22.0
   */
  SubscribePlaylistButton.prototype._showPopup = function() {
    if (this._popup) {
      this._popup.dispose();
    }

    var fragment = document.createDocumentFragment();

    // Popup text.
    var paragraph = document.createElement('p');
    paragraph.innerHTML =
        _('PopupPlaylistSubscribeLine1',
            '<strong>' + this.item.owner.name.decodeForHtml() + '</strong>') +
        '<br><br>' +
        _('PopupPlaylistSubscribeLine2');
    fragment.appendChild(paragraph);

    // Controls container.
    var controls = document.createElement('p');
    controls.className = 'sp-popup-buttons';
    fragment.appendChild(controls);

    // Buttons.
    var unsubscribe = Button.withLabel(_('PopupPlaylistSubscribeCancel'));
    controls.appendChild(unsubscribe.node);

    var okay = Button.withLabel(_('PopupPlaylistSubscribeConfirm'));
    okay.setAccentuated(true);
    controls.appendChild(okay.node);

    // Note: The height of the popup is set in the _updateSubscription method.
    var popup = Popup.withContent(fragment, 250, 0, 'sp-playlist-subscribed');

    // Close the popup when either button is clicked.
    var user = this.item.owner;
    unsubscribe.addEventListener('click', function() {
      this.setDisabled(true);
      Relations.forCurrentUser().unsubscribe(user);
      popup.hide(100);
    });
    okay.addEventListener('click', function() { popup.hide(); });

    // Display the popup.
    popup.showFor(this.node);

    // Adjust the size of the popup so that the text fits snugly.
    var rect = paragraph.getBoundingClientRect();
    popup.resize(popup.width, rect.height + 44);

    this._popup = popup;
  };

  /**
   * Subscribe or unsubscribe to a playlist.
   * @param {boolean} subscribe True to subscribe, false to unsubscribe.
   * @private
   */
  SubscribePlaylistButton.prototype._updateSubscription = function(subscribe) {
    if (!subscribe) {
      // If this is an unsubscribe of the playlist, just do it and disregard
      // the rest of this function.
      this._call(Library.forCurrentUser(), 'unsubscribe');
      return;
    }

    var self = this;
    models.client.load('features').done(function(client) {
      // If the client has the auto-follow playlist owners feature enabled, show a
      // popup telling the user that they subscribed to the owner of the playlist
      // and giving them the option to unsubscribe from the owner.
      //
      // We won't actually subscribe to the playlist until we know whether the
      // user is subscribed to the owner or not, since subscribing to the
      // playlist will change that state.
      if (client.features['autoFollowPlaylistOwners']) {
        self.item.load('owner').done(function(playlist) {
          playlist.owner.load('name', 'subscribed').done(function(user) {
            if (!user.subscribed) {
              self._showPopup();
            }

            // Now that we've dealt with the popup, subscribe to the playlist.
            self._call(Library.forCurrentUser(), 'subscribe');
          });
        });
      } else {
        // 'Auto-follow playlist owners' feature is not enabled - just subscribe to
        // the playlist.
        self._call(Library.forCurrentUser(), 'subscribe');
      }
    });
  };

  /**
   * A subclass of SubscribeButton that knows how to subscribe to artists and
   * users. It will properly update itself in response to the artist or user it
   * is targeting being subscribed to/unsubscribed from somewhere else.
   *
   * @class SubscribeProfileButton
   * @extends {SubscribeButton}
   *
   * @param {Artist|User} profile The artist or user to subscribe to when the
   *     button is clicked.
   *
   * @since 1.24.0
   */
  function SubscribeProfileButton(profile) {
    if (!((profile instanceof models.User) || (profile instanceof models.Artist)))
      throw new Error(profile + ' not a User or Artist');
    SubscribeButton.call(this, profile);
  }
  SP.inherit(SubscribeProfileButton, SubscribeButton);

  /**
   * Subscribe to or unsubscribe from an artist or a user.
   *
   * @private
   *
   * @param {boolean} subscribe True to subscribe, false to unsubscribe.
   *
   * @since 1.24.0
   */
  SubscribeProfileButton.prototype._updateSubscription = function(subscribe) {
    this._call(Relations.forCurrentUser(), subscribe ? 'subscribe' : 'unsubscribe');
  };

  /**
   * Creates a SubscribeButton for a given artist.
   *
   * @since 1.0.0
   *
   * @param {Artist} artist The artist to subscribe to when clicking the button.
   * @return {SubscribeButton} A SubscribeButton instance.
   */
  SubscribeButton.forArtist = function(artist) {
    return new SubscribeProfileButton(artist);
  };

  /**
   * Creates a SubscribeButton for a given profile. A profile can be either an
   * artist or a user.
   *
   * @param {Artist|User} profile The artist or user to subscribe to when
   *     clicking the button.
   * @return {SubscribeButton} A SubscribeButton instance.
   *
   * @since 1.24.0
   */
  SubscribeButton.forProfile = function(profile) {
    return new SubscribeProfileButton(profile);
  }

  /**
   * Creates a SubscribeButton for a given playlist.
   *
   * @since 1.0.0
   *
   * @param {Playlist} playlist The playlist to subscribe to when clicking the
   *     button.
   * @return {SubscribeButton} A SubscribeButton instance.
   */
  SubscribeButton.forPlaylist = function(playlist) {
    return new SubscribePlaylistButton(playlist);
  };

  /**
   * Creates a SubscribeButton for a given user.
   *
   * @since 1.0.0
   *
   * @param {User} user The user to subscribe to when clicking the button.
   * @return {SubscribeButton} A SubscribeButton instance.
   */
  SubscribeButton.forUser = function(user) {
    return new SubscribeProfileButton(user);
  };

  exports.Button = Button;
  exports.CustomButton = CustomButton;
  exports.ShareButton = ShareButton;
  exports.StartRadioButton = StartRadioButton;
  exports.SubscribeButton = SubscribeButton;
});
