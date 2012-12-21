'use strict';

require([
  '$api/models',
  '$api/toplists#Toplist',
  '$views/utils/css',
  '$views/utils/dom',
  '$views/utils/dnd',
  '$views/buttons'], function(models, Toplist, css, dom, dnd, buttons) {


  exports.Image = Image;

  var apiPlayer = models.player;
  var Observable = models.Observable;

  /**
   * Create a new image that will keep its proportions.
   *
   * @constructor
   * @implements {Observable}
   *
   * @param {Album|Artist|Track|Playlist|string} item The item to display an
   *     image for. If a string is provided, it will be interpreted as an image
   *     path.
   * @param {Object} options An object containing different options for the
   *     image.
   *
   *     title: A regular tooltip that will pop up when hovering the image.
   *         Default: No tooltip.
   *     link: A URL. Setting this will wrap the image in a link to that URL.
   *         Default: No link.
   *     animate: Whether to animate the image when it's loaded. Default: true
   *     placeholder: What kind of placeholder to use. 'none' | 'empty' |
   *         'auto' | 'artist' | 'album' | 'track' | 'playlist' | 'user'.
   *         Default: 'auto'
   *     width: The width of the image. Default: 200
   *     height: The height of the image. Default: 200
   *     player: Whether to add a play button and make the image (item)
   *         playable. Default: false
   *     playerItem: An item that is used when playing from the player. Could be
   *         used if you want a custom image, but still want a player for the image.
   *         The item types that are valid are the same as for the first parameter.
   *     style: The style of the image. 'plain' | 'inset' | 'rounded' |
   *         'embossed' . Default: 'inset'
   *     getContextGroupData: A function that returns an object with properties
   *         group and index. Group is a context group and index is an index
   *         within the group. Used for playing within a context group instead
   *         of just this single context.
   *     overlay: An array of strings for the overlay. Max items is 2. First
   *         item will be displayed larger than the second one. Default: Empty
   *         array, means no overlay.
   */
  function Image(item, options) {
    options = options || {};
    this._title = options.title;
    this._link = options.link || '';
    this._animateLoaded = options.animate === undefined ? true : options.animate;
    this._placeholder = options.placeholder === undefined ? 'auto' : options.placeholder;
    this._player = !!options.player;
    this._playerItem = options.playerItem;
    this._swap = options.swap === 'immediate' ? 'immediate' : 'wait';
    this._overlay = options.overlay === undefined ? [] : options.overlay;

    var styles = ['plain', 'inset', 'rounded', 'embossed'];
    this._style = ~styles.indexOf(options.style) ? options.style : 'inset';
    this._getContextGroupData = options.getContextGroupData;

    this._width = options.width || options.height || 200;
    this._height = options.height || options.width || 200;

    // Conversion between placeholder keyword and constructor name
    var placeholderTypes = {
      'artist': 'Artist',
      'album': 'Album',
      'track': 'Track',
      'playlist': 'Playlist',
      'user': 'User'
    };

    // If the placeholder value is not a recognized value, set it to auto
    if (!~' auto none empty '.indexOf(' ' + this._placeholder + ' ') && !(this._placeholder in placeholderTypes)) {
      this._placeholder = 'auto';
    }

    // Set which item type the placeholder should represent
    this._placeholderType = placeholderTypes[this._placeholder] || 'auto';

    // Build the main wrapper node for the image
    this._buildNode();

    // Set initial flag for if it's a custom image or not
    this._isCustomImage = item ? (typeof item === 'string' ? true : false) : true;

    // Build the placeholder node
    if (this._placeholder !== 'none') {
      this._buildPlaceholder();
    }

    // If an image was passed in, set the image
    if (item) {
      this.setImage(item);
    } else if (this._placeholder !== 'none') {
      this._setPlaceholder(this._getSuitableSize('placeholder'));
    }

    // Build player
    if (this._player) {
      this._buildPlayer();
    }

    if (this._player) {
      this._playStateChanged();
    }

    if (this._link) {
      this.setLink(this._link);
    }

    this._addDragHandler();

    // Load the device info, to decide if we should enable the custom context menu.
    // Currently, this will only be done for desktop.
    var self = this;
    models.session.load('device').done(function() {
      if (models.session.device === 'desktop') {
        self._addContextUIHandler();
      }
    });
  }
  SP.inherit(Image, Observable);

  /**
   * Create an Image for the given album.
   *
   * @since 1.0.0
   *
   * @param {Album} album The album object to create an image for.
   * @param {Object=} opt_options An optional options object.
   *
   * @return {Image} An Image instance.
   */

  /**
   * Create an Image for the given artist.
   *
   * @since 1.0.0
   *
   * @param {Artist} artist The artist object to create an image for.
   * @param {Object=} opt_options An optional options object.
   *
   * @return {Image} An Image instance.
   */

  /**
   * Create an Image for the given playlist.
   *
   * @since 1.0.0
   *
   * @param {Playlist} playlist The playlist object to create an image for.
   * @param {Object=} opt_options An optional options object.
   *
   * @return {Image} An Image instance.
   */

  /**
   * Create an Image for the given track.
   *
   * @since 1.0.0
   *
   * @param {Track} track The track object to create an image for.
   * @param {Object=} opt_options An optional options object.
   *
   * @return {Image} An Image instance.
   */

  /**
   * Create an Image for the given user.
   *
   * @since 1.12.0
   *
   * @param {User} user The user object to create an image for.
   * @param {Object=} opt_options An optional options object.
   *
   * @return {Image} An Image instance.
   */

  ['Album', 'Artist', 'Playlist', 'Track', 'User'].forEach(function(type) {

    Image['for' + type] = function(item, opt_options) {

      var Model = models[type];

      if (typeof item === 'string') {
        item = Model.fromURI(item);
      } else if (!(item instanceof Model)) {
        throw new Error('The type of the object is not ' + type);
      }

      return new Image(item, opt_options);

    };

  });

  /**
   * Create an Image for the given source string.
   *
   * @since 1.0.0
   *
   * @param {string} src The source to create an image for.
   * @param {Object=} opt_options An optional options object.
   *
   * @return {Image} An Image instance.
   */
  Image.fromSource = function(src, opt_options) {
    return new Image(src, opt_options);
  };

  /**
   * Set what image to use.
   *
   * If a Spotify catalog item is passed in, the image will be fetched
   * automatically. This can be called multiple times and will change the image
   * to the new one.
   *
   * @param {Album|Artist|Track|Playlist|string} item The item to display an
   *     image for. If a string is provided, it will be interpreted as an image
   *     path.
   *
   * @return {Image} Returns itself to allow chaining.
   */
  Image.prototype.setImage = function(item) {
    this.isLoaded = false;

    // Check which image type was passed in
    this._isCustomImage = typeof item === 'string';
    if (this._isCustomImage) {
      this._item = null;
      this._src = item;
    } else {

      var isOldTrack = this._item instanceof models.Track;
      var isOldPlaylist = this._item instanceof models.Playlist;

      if (this._item && (isOldTrack || isOldPlaylist)) {
        this._item.removeEventListener('change:image', this._changeEventHandler);
        this._changeEventHandler = null;
      }

      this._src = null;
      this._item = item;

      var isNewTrack = item instanceof models.Track;
      var isNewPlaylist = item instanceof models.Playlist;

      if (isNewTrack || isNewPlaylist) {
        var self = this;
        item.load('image').done(function() {
          self._changeEventHandler = function() {
            self._resetImage();
            self._buildImage();
          };
          item.addEventListener('change:image', self._changeEventHandler);
        });
      }
    }

    // Set the placeholder based on what image was passed in
    if (this._placeholder !== 'none') {
      this._setPlaceholder(this._getSuitableSize('placeholder'));
    }

    // Reset the wrapper node to prepare for the new image
    if (this._swap === 'immediate') {
      this._resetImage();
    }

    // Create the actual image
    this._buildImage();

    // Build the overlay node
    if (this._overlay.length > 0) {
      this._buildOverlay();
    }

    // Set up the context used when playing
    if (this._player && this.playerButton && !this._playerItem) {
      this._createContext();

      // Hide play button if there are no tracks
      var self = this;
      this._checkForTracks(function(hasTracks) {
        css[hasTracks ? 'removeClass' : 'addClass'](self.playerButton.node, 'sp-image-player-hidden');
      });
    }

    return this;
  };

  /**
   * Set the link url.
   *
   * @param {string} link A URL or Spotify URI, or 'auto'.
   */
  Image.prototype.setLink = function(link) {
    var node = this.node;

    // Store link value
    this._link = link || '';

    // Set the link automatically based on the item
    if (this._link === 'auto' && !this._isCustomImage) {
      if (this._item && this._item.uri) {
        node.href = this._item.uri.toSpotifyLink();
        node.setAttribute('data-uri', this._item.uri);
      } else {
        node.href = '#';
        node.setAttribute('data-uri', '');
      }

    // Set the link the user passed in.
    // If it's a Spotify URI, the correct URL will be resolved.
    } else {
      var isSpotifyURI = this._link.indexOf('spotify:') === 0;
      var link = isSpotifyURI ? this._link.toSpotifyLink() : this._link;
      link = this._isCustomImage ? '#' : link;

      node.href = link;
      node.setAttribute('data-uri', isSpotifyURI ? this._link : '');
    }
  };

  /**
   * Set the size of the whole image.
   * This will set the size of the wrapper node, and the actual image will scale
   * accordingly without losing proportions.
   *
   * @param {number} width  The new width.
   * @param {number} height The new height.
   *
   * @return {Image} Returns itself to allow chaining.
   */
  Image.prototype.setSize = function(width, height) {
    this.node.style.width = width + 'px';
    this.node.style.height = height + 'px';

    this._width = width;
    this._height = height;

    // Set the placeholder based on the new size
    if (this._placeholder !== 'none' && this.node.placeholder) {
      this._setPlaceholder(this._getSuitableSize('placeholder'));
    }

    // Set size of the button
    if (this.isImageInitialized && this._player) {
      this._setPlayButtonSize();
    }

    this.dispatchEvent('resize');
    return this;
  };

  /**
   * Create the wrapper node.
   * A wrapper is used to be able to resize the image without losing proportions.
   * If a link URL was specified in the options, the wrapper will be a link, otherwise a div.
   *
   * @private
   */
  Image.prototype._buildNode = function() {
    var node, wrapper;
    var self = this;

    // Create wrapper node
    if (this._link) {
      this.node = node = document.createElement('a');
      this.setLink(this._link);
      dom.addEventListener(node, 'click', function(e) {
        var isPlayButton = !!self.playerButton && e.target === self.playerButton.node;
        var uri = this.getAttribute('data-uri');
        if (!isPlayButton && uri && uri.indexOf('spotify:') === 0) {
          e.preventDefault();
          e.stopPropagation();
          models.application.openURI(uri);
        }
      });
    } else {
      this.node = node = document.createElement('div');
    }

    this.node.setAttribute('draggable', 'true');

    // Set title (tooltip)
    if (this._title) {
      node.title = this._title;
    }

    // Set up the outer wrapper element
    this.setSize(this._width, this._height);
    css.addClass(node, 'sp-image');
    if (this._animateLoaded) {
      css.addClass(node, 'sp-image-animated');
    }

    // Set CSS class for the chosen style
    css.addClass(node, 'sp-image-style-' + this._style);

    if (this._style === 'inset' || this._style === 'embossed') {

      // Add the rounded CSS class for styles that should have rounded corners
      css.addClass(node, 'sp-image-style-rounded');

      // Create an extra element for the inset shadow that will be on top of everything else
      var inset = document.createElement('div');
      css.addClass(inset, 'sp-image-inset');
      node.appendChild(inset);
    }

    this.isImageInitialized = true;
    return this;
  };

  /**
   * Build the placeholder node.
   * A placeholder node will show an image underneath the actual image,
   * and will be visible until the actual image is loaded.
   * The placeholder image will be different depending on the type of item
   * passed as the input image.
   *
   * @private
   */
  Image.prototype._buildPlaceholder = function() {

    // Create a dummy element and add it to DOM to get path to placeholder image
    var dummy = document.createElement('div');
    css.addClass(dummy, 'sp-image-placeholder-visible');
    dummy.style.position = 'absolute';
    dummy.style.top = '-9999px';
    document.body.appendChild(dummy);
    var style = /url\("?(.*?)"?\)/.exec(css.getStyle(dummy, 'background-image'));
    document.body.removeChild(dummy);

    // Create the placeholder node
    var node = document.createElement('div');
    css.addClass(node, 'sp-image-placeholder');
    if (style && typeof style[1] === 'string') {
      var ph = this._placeholder;
      var isCustom = this._isCustomImage;
      if ((ph !== 'empty' && !isCustom) || (isCustom && ph !== 'auto' && ph !== 'empty')) {
        css.addClass(node, 'sp-image-placeholder-visible');
      }
    }
    this.node.appendChild(node);
    this.node.placeholder = node;
  };

  /**
   * Build the player.
   * This will create a play button so the user can start the music that is
   * connected to the item passed in.
   *
   * @private
   */
  Image.prototype._buildPlayer = function() {
    var self = this;

    // Create play button
    var button = buttons.CustomButton.withClass('sp-image-player sp-image-player-play');
    this.node.appendChild(button.node);
    this.playerButton = button;
    this.isPlaying = false;

    // Conversion between widths and button sizes
    this._playButtonSizes = {
      40: 'xs',
      64: 'small',
      128: 'medium',
      200: 'large',
      300: 'xl'
    };

    // Set size of the button
    this._setPlayButtonSize();

    // Add functionality
    // This uses a custom event from the Button class, that will make the click
    // more responsive on touch devices.
    button.addEventListener('click', function() {
      self._playClick();
    });

    dom.addEventListener(this.node, 'click', function(e) {
      if (e.target === button.node) {
        e.preventDefault();
        e.stopPropagation();
      }
    });

    // Make the button change state when the player changes state
    apiPlayer.addEventListener('change', function() {
      self._playStateChanged();
    });

    // Set up the context used when playing
    this._createContext();

    // Hide play button if there are no tracks
    this._checkForTracks(function(hasTracks) {
      if (!hasTracks) {
        css.addClass(button.node, 'sp-image-player-hidden');
      }
    });
  };

  /**
   * Builds the overlay
   *
   * @private
   */
  Image.prototype._buildOverlay = function() {
    var container = document.createElement('div');
    css.addClass(container, 'sp-image-overlay');

    var firstLine = document.createElement('p');
    firstLine.className = 'sp-image-overlay-line1';
    firstLine.innerHTML = this._overlay[0] || '';
    container.appendChild(firstLine);

    var secondLine;

    if (this._overlay.length > 1) {
      secondLine = document.createElement('p');
      secondLine.className = 'sp-image-overlay-line2';
      secondLine.innerHTML = this._overlay[1] || '';

      container.appendChild(secondLine);
      css.addClass(container, 'sp-image-overlay-2-lines');
    }

    this.node.appendChild(container);

    this.node.overlay = container;
    this.node.overlay.firstLine = firstLine;
    this.node.overlay.secondLine = secondLine;
  };

  /**
   * Reset the image wrapper.
   *
   * @private
   */
  Image.prototype._resetImage = function() {
    if (this.node.wrapper) {
      this.node.wrapper.innerHTML = '';
    }
    css.removeClass(this.node, 'sp-image-loaded');
    this.dispatchEvent('reset');
  };

  /**
   * Set up the context for the current item.
   * If the context is valid, the play button will be shown.
   *
   * @private
   */
  Image.prototype._createContext = function() {

    // Remove the play button if it is in the DOM
    if (this.playerButton.node.parentNode) {
      this.node.removeChild(this.playerButton.node);
    }

    var item = this._playerItem || this._item;

    // Load top tracks for an artist object
    if (item instanceof models.Artist) {
      Toplist.forArtist(item).load('tracks').done(this, function(toplist) {
        if (toplist.tracks) {
          toplist.tracks.snapshot(0, 1).done(this, function(snap) {
            if (snap.range.length > 0) {
              this.context = toplist.tracks;
              this.node.appendChild(this.playerButton.node);
              this._playStateChanged();
            }
          });
        }
      });

    } else {
      this.context = item;
      this.node.appendChild(this.playerButton.node);
      this._playStateChanged();
    }
  };

  /**
   * Test the item that was passed in if it has any tracks.
   * Used to test if the play button should be visible.
   *
   * @private
   *
   * @param {function} callback Callback function. First argument to this function
   *    is a boolean for the result.
   */
  Image.prototype._checkForTracks = function(callback) {

    // A custom image from a string will not have any tracks
    if (this._isCustomImage && !this._playerItem) {
      callback(false);
      return;
    }

    var item = this._playerItem || this._item;

    if (item instanceof models.Track) {
      callback(true);
      return;
    }

    // Handled by _createContext for artists
    if (item instanceof models.Artist) {
      callback(true);
      return;
    }

    if (item instanceof models.Album || item instanceof models.Playlist) {
      item.load('tracks').done(function() {
        item.tracks.snapshot(0, 0).done(function(snapshot) {
          callback(snapshot.length > 0);
        }).fail(function() {
          callback(false);
        });
      }).fail(function() {
        callback(false);
      });
    } else {
      callback(false);
    }
  };

  /**
   * Set the play button size, based on the image size.
   */
  Image.prototype._setPlayButtonSize = function() {
    var lastWidth, width;
    for (width in this._playButtonSizes) {
      if (width > this._width) {
        break;
      }
      lastWidth = width;
    }

    // Remove the current size if any
    if (this._currentPlayButtonSize) {
      css.removeClass(this.playerButton.node, 'sp-image-player-' + this._currentPlayButtonSize);
    }

    // Add the new size, or hide it if the image is too small
    if (lastWidth) {
      css.addClass(this.playerButton.node, 'sp-image-player-' + this._playButtonSizes[lastWidth]);
      css.removeClass(this.playerButton.node, 'sp-image-player-hidden');
      // If the overlay is enabled the button should be centered
      if (this._overlay.length > 0) {
        css.addClass(this.playerButton.node, 'sp-image-player-centered');
      }
      // Hide players for xs size if the item is not a track
      if (this._playButtonSizes[lastWidth] === 'xs' &&
          !(this._item instanceof models.Track || this._playerItem instanceof models.Track)) {
        css.addClass(this.playerButton.node, 'sp-image-player-hidden');
      }
    } else {
      css.addClass(this.playerButton.node, 'sp-image-player-hidden');
    }

    // Save the current size
    this._currentPlayButtonSize = this._playButtonSizes[lastWidth];
  };

  /**
   * Handle click event on the play button.
   *
   * @private
   */
  Image.prototype._playClick = function() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  };

  /**
   * Handle changes of the player state.
   *
   * @private
   */
  Image.prototype._playStateChanged = function(forceLocalMode) {
    apiPlayer.load('playing').done(this, function() {

      var isTrack = this._item instanceof models.Track;
      var playerItem = isTrack ? apiPlayer.track : apiPlayer.context;
      var isSameContext = playerItem ? !!(this._item && playerItem.uri === this._item.uri ||
          (this._link && playerItem.uri === this._link.toSpotifyURI()) ||
          (this.context && playerItem.uri === this.context.uri)) : false;
      var setPlaying = false;

      // If the image view is not forcing the state to something special
      if (!forceLocalMode) {

        // If the player context and the view context are the same
        if (isSameContext) {

          // Block out any requests that does not change the playing state
          if (apiPlayer.playing === this.isPlaying) {
            return;

          // If the playing state in the player differs, set the view state
          } else {
            if (apiPlayer.playing) {
              setPlaying = true;
            } else {
              setPlaying = false;
            }
          }

        // If not the same context and the view is playing, set state
        } else {
          if (this.isPlaying) {
            setPlaying = false;
          }
        }

      // If the image view is forcing a specific state, set it
      } else {
        if (this.isPlaying) {
          setPlaying = true;
        } else {
          setPlaying = false;
        }
      }

      // Switch CSS classes to change the now playing icon
      if (setPlaying) {
        css.removeClass(this.playerButton.node, 'sp-image-player-play');
        css.addClass(this.playerButton.node, 'sp-image-player-pause');
        this.isPlaying = true;
      } else {
        css.removeClass(this.playerButton.node, 'sp-image-player-pause');
        css.addClass(this.playerButton.node, 'sp-image-player-play');
        this.isPlaying = false;
      }
    });
  };

  /**
   * Play a track from the item passed in to the view.
   * It will use the item as a context if the item is not a track.
   */
  Image.prototype.play = function() {

    // Set state to update the button immediately
    this.isPlaying = true;
    this._playStateChanged(true);

    // Check to see if this track is the same as the one already playing (if any).
    // For it to be seen as the same, it also needs to come from the same player image.
    var item = this._playerItem || this._item;
    var isTrack = item instanceof models.Track;
    var playerItem = isTrack ? apiPlayer.track : apiPlayer.context;
    var isSameContext = playerItem ? !!(playerItem.uri === item.uri || (this.context && playerItem.uri === this.context.uri)) : false;

    // If it's the same context that is in the player now, just unpause
    if (isSameContext) {
      apiPlayer.play();

    // Play through the user-defined context group
    } else if (typeof this._getContextGroupData === 'function') {
      var contextGroupData = this._getContextGroupData();
      if (contextGroupData.group) {
        apiPlayer.playContextGroup(contextGroupData.group, contextGroupData.index || 0, 0);
      }

    // Play track
    } else if (isTrack) {
      apiPlayer.playTrack(item);

    // Play context (for anything other than track)
    } else if (this.context) {
      apiPlayer.playContext(this.context);
    }
  };

  /**
   * Pause the player.
   */
  Image.prototype.pause = function() {
    this.isPlaying = false;
    this._playStateChanged(true);

    apiPlayer.pause();
  };

  /**
   * Create an image based on what image was set.
   *
   * @private
   */
  Image.prototype._buildImage = function() {
    // Create a normal image from a path
    if (this._isCustomImage) {
      this._createImage(this._src);

    // Create a normal image from a Spotify catalog object
    } else {
      var props;
      if (this._item instanceof models.Album || this._item instanceof models.Track) {
        props = ['image', 'name', 'artists'];
      } else {
        props = ['image', 'name'];
      }
      this._item.load(props).done(this, function(item) {
        var size = Math.max(this._width, this._height);
        var image = item.imageForSize(size);
        if (image) {
          this._createImage(image);
        } else {
          this._resetImage();
        }

        // Load the name of each artist, if the artists property was loaded.
        // This is later used for dnd.
        if (item.artists) {
          var promises = [];
          for (var i = 0, l = item.artists.length; i < l; i++) {
            promises.push(item.artists[i].load('name'));
          }
          models.Promise.join(promises).done(this, function(artists) {
            this.node.setAttribute('data-tooltip', item.name + ' by ' + this._getArtistsAsString(artists));
          });
        } else {
          this.node.setAttribute('data-tooltip', item.name);
        }
        this.node.setAttribute('data-uri', item.uri);

      }).fail(this, function() {
        this._resetImage();
      });
    }
  };

  /**
   * Create the actual image element.
   * The element is only created, but not added to DOM. It will be added
   * to DOM when the image has loaded.
   *
   * @private
   *
   * @param {string} src Path to the image.
   */
  Image.prototype._createImage = function(src) {
    var self = this;
    var dummyImg = document.createElement('img');
    var img = document.createElement('div');
    css.addClass(img, 'sp-image-img');
    dummyImg.src = src;
    dummyImg.onload = function() { self._onLoad(img); };
    dummyImg.onerror = function() { self._resetImage(); };
    img.style.backgroundImage = 'url(' + src + ')';
  };

  /**
   * Add the image to DOM when it's loaded.
   * When added to DOM, it will also get the CSS class sp-image-loaded
   * to let the CSS know it's loaded and can be displayed.
   *
   * @private
   *
   * @param {HTMLImageElement} img The image element.
   */
  Image.prototype._onLoad = function(img) {
    var killOld = false;

    // Change state of the current image wrapper
    if (this.hasBuiltOnce && this._swap === 'wait') {
      css.addClass(this.node.wrapper, 'sp-image-wrapper-waiting-kill');
      css.removeClass(this.node, 'sp-image-loaded');
      killOld = true;
      var oldWrapper = this.node.wrapper;
    }

    // Create a new image wrapper
    var wrapper = document.createElement('div');
    css.addClass(wrapper, 'sp-image-wrapper');
    wrapper.appendChild(img);

    var playerButtnNode;
    if (this.playerButton) playerButtnNode = this.playerButton.node;
    // Add the new wrapper to the DOM
    var refElem = this.node.wrapper || this.node.placeholder || playerButtnNode;
    if (refElem) {
      this.node.insertBefore(wrapper, refElem);
    } else {
      this.node.appendChild(wrapper);
    }
    this.node.wrapper = wrapper;

    // Set state for new wrapper
    // (that it's waiting for the old wrapper to be removed)
    if (this.hasBuiltOnce && this._swap === 'wait') {
      css.addClass(wrapper, 'sp-image-wrapper-waiting');
    }

    // Set flag that we actually have one wrapper in the DOM
    this.hasBuiltOnce = true;
    this.isLoaded = true;

    // We need to defer setting the CSS class until the next runloop iteration
    // for the transition animation to work. Otherwise it will just set it
    // directly without animating.
    SP.defer(this, function() {
      css.addClass(this.node, 'sp-image-loaded');
      if (this._link) {
        this.setLink(this._link);
      }
      this.dispatchEvent('load');
      this.dispatchEvent('change');

      // Remove the old wrapper after the animation has finished
      if (killOld) {
        var self = this;
        setTimeout(function() {
          oldWrapper.parentNode.removeChild(oldWrapper);
          if (self._swap === 'wait') {
            css.removeClass(wrapper, 'sp-image-wrapper-waiting');
          }
        }, this._animateLoaded ? 100 : 1);
      }
    });
  };

  /**
   * Get the current size of the image
   *
   * @private
   *
   * @return {Object} Object with properties width and height.
   */
  Image.prototype._getSize = function() {
    return {
      width: parseInt(css.getStyle(this.node, 'width')) || this._width,
      height: parseInt(css.getStyle(this.node, 'height')) || this._height
    };
  };

  /**
   * Find a suitable image size based on the set size.
   * Artists, albums, tracks and playlists have images in different sizes,
   * so we want the best suitable image for the set size to maximize
   * quality and download speed. We also want to get the best suitable
   * placeholder image size.
   *
   * @private
   *
   * @param {string} type The type of image to calculate for. 'placeholder' or 'image'.
   *
   * @return {string} Key within the SIZES.placeholder.images object.
   */
  Image.prototype._getSuitableSize = function(type) {
    var imageSize = this._getSize();
    var sizeKey, size, placeholderSize;

    // Only placeholders are supported so far
    if (type === 'placeholder') {

      // If the user has chosen to have an empty placeholder
      if (this._placeholder === 'empty' || (this._isCustomImage && this._placeholder === 'auto')) {
        return 'empty';
      }

      // Get the best suitable size keyword
      var images = SIZES.placeholder.images;
      for (sizeKey in images) {
        size = images[sizeKey];
        if ((size.width < imageSize.width || size.height < imageSize.height) || (size.width === undefined)) {
          break;
        }
        placeholderSize = sizeKey;
      }

      // Return keyword based on what was found
      if (placeholderSize) {
        return placeholderSize;
      } else {
        return sizeKey;
      }
    }
  };

  /**
   * Set the correct placeholder image in the correct size.
   * The placeholder image file contains all placeholder types, and each type has four
   * different sizes. Based on the size keyword passed in, it will resize and position
   * the placeholder image so only the correct section is displayed within the image
   * container. The rest is masked out.
   *
   * @private
   *
   * @param {string} size A size keyword from SIZES.placeholder.images.
   */
  Image.prototype._setPlaceholder = function(size) {
    var imageSize = this._getSize();
    var placeholder = this.node.placeholder;
    if (size === 'empty' || (this._placeholder === 'auto' && !this._item && !this._src)) {
      css.removeClass(placeholder, 'sp-image-placeholder-visible');
    } else if (this._item || (this._placeholder !== 'auto')) {
      css.addClass(placeholder, 'sp-image-placeholder-visible');
      size = SIZES.placeholder.images[size];

      if (size) {

        var total, factorX, factorY, widthOfResized, newPercentage, leftOfResized, topOfResized, newLeftPercentage,
            newTopPercentage, itemType, typeOffset, offsetOfResized, newOffsetPercentage;

        total = SIZES.placeholder.total;

        // Find the factor of how much the placeholder is resized when width is 100% is the container
        factorX = imageSize.width / size.width;
        factorY = imageSize.height / size.height;

        // Find the new placeholder width in % based on which placeholder image size is used
        newPercentage = factorX * total.width / imageSize.width * 100;

        // Find the new position of the placeholder based on the placeholder image size
        newLeftPercentage = (factorX * size.x) / (total.width * factorX - imageSize.width) * 100;
        newTopPercentage = (factorY * size.y) / (total.height * factorY - imageSize.height) * 100;

        // Find the instance name of the item
        var itemName;
        if (this._item instanceof models.Album) {
          itemName = 'Album';
        } else if (this._item instanceof models.Artist) {
          itemName = 'Artist';
        } else if (this._item instanceof models.Playlist) {
          itemName = 'Playlist';
        } else if (this._item instanceof models.Track) {
          itemName = 'Track';
        } else if (this._item instanceof models.User) {
          itemName = 'User';
        }

        // Offset the top position based on which of the placeholder types that is used
        itemType = this._placeholder === 'auto' ? itemName : this._placeholderType;
        typeOffset = total.height / total.numTypes * SIZES.placeholder.offsets[itemType];
        offsetOfResized = typeOffset * factorY;
        newTopPercentage += offsetOfResized / (total.height * factorY - imageSize.height) * 100;

        // Set the size and position
        var placeholderRatio = total.height / total.width;
        placeholder.style.backgroundSize = newPercentage + '% ' + (newPercentage * placeholderRatio) + '%';
        placeholder.style.backgroundPosition = newLeftPercentage + '% ' + newTopPercentage + '%';
      }
    }
  };

  /**
   * Add a drag handler for the image view.
   * This will only be added once per app, and it will handle
   * all image views.
   *
   * @private
   */
  Image.prototype._addDragHandler = function() {
    if (!Image.sp_isDndAddedForImages) {
      Image.sp_isDndAddedForImages = true;

      var self = this;

      var dndTest = function(element) {
        if (self._isElementInAnyImage(element)) {
          var imageNode = self._getImageNodeFromElement(element);
          var hasUri = !!imageNode.getAttribute('data-uri');
          var hasText = !!imageNode.getAttribute('data-tooltip');
          return hasUri && hasText;
        } else {
          return false;
        }
      };

      var dndGetData = function(element) {
        var imageNode = self._getImageNodeFromElement(element);
        var uri = imageNode.getAttribute('data-uri');
        var text = imageNode.getAttribute('data-tooltip');
        var urls = [uri.toSpotifyURL()];
        var links = ['<a href="' + urls[0] + '">' + text + '</a>'];
        return {
          'text/plain': urls,
          'text/html': links
        };
      };

      var dndGetText = function(element) {
        var imageNode = self._getImageNodeFromElement(element);
        return imageNode.getAttribute('data-tooltip');
      };

      dnd.drag.addHandler(dndTest, dndGetData, dndGetText);
    }
  };

  /**
   * Add an event handler for showing the Spotify context menu.
   *
   * @private
   */
  Image.prototype._addContextUIHandler = function() {
    var self = this;

    // Show the custom context menu for items
    this.node.oncontextmenu = function(e) {

      // Catch links inside the image (could be in overlay)
      var isTargetLink = e.target.tagName.toLowerCase() === 'a';
      var isNodeLink = this.tagName.toLowerCase() === 'a';
      if (isTargetLink || isNodeLink) {

        // Parse uri
        // If a data-uri attribute is not specified, it uses href
        var link = isTargetLink ? e.target : this;
        var uri = link.getAttribute('data-uri');
        uri = uri || link.href;
        var testSpotifyURI = SpotifyApi.Exps.spotify;
        var testSpotifyURL = SpotifyApi.Exps.http;
        if (!uri.match(testSpotifyURI) && !uri.match(testSpotifyURL)) {
          return;
        }

        // Create object and show context UI for it
        var item = models.fromURI(uri);
        if (item) {
          var x = e.pageX - window.pageXOffset;
          var y = e.pageY - window.pageYOffset;
          models.client.showContextUI(item, { x: x, y: y });
          return false;
        }

        return;
      }

      // Only show the custom menu for Spotify resources
      if (self._item) {

        // Show custom context menu
        var x = e.pageX - window.pageXOffset;
        var y = e.pageY - window.pageYOffset;
        models.client.showContextUI(self._item, { x: x, y: y });

        // Disable default context menu
        return false;
      }
    };
  };

  /**
   * Check if an element is in any image view in the current app.
   * The element can be either inside the image node, or the node itself.
   *
   * @private
   *
   * @param {HTMLElement} element The HTML element to test.
   *
   * @return {boolean} True if the element is inside an image view.
   */
  Image.prototype._isElementInAnyImage = function(element) {
    return this._getImageNodeFromElement(element) !== document.documentElement ? true : false;
  };

  /**
   * Get the image node from an element that exists inside the image node.
   *
   * @private
   *
   * @param {HTMLElement} element The HTML element to start from.
   *
   * @return {HTMLElement} The image node.
   */
  Image.prototype._getImageNodeFromElement = function(element) {
    while (!css.hasClass(element, 'sp-image') && element !== document) {
      element = element.parentNode;
    }

    return element !== document ? element : document.documentElement;
  };

  /**
   * Get artists as a string.
   *
   * @param {Array} artists Artist objects, with loaded name property.
   *
   * @return {string} Artists separated by comma and space.
   */
  Image.prototype._getArtistsAsString = function(artists) {
    var output = '';
    for (var i = 0, l = artists.length; i < l; i++) {
      output += artists[i].name + (i < l - 1 ? ', ' : '');
    }
    return output;
  };

  /**
   * Internal definition of the size information.
   * This contains positions and sizes for the placeholders.
   * The placeholder image contains all types and sizes needed.
   *
   * @ignore
   *
   * @type {Object}
   */
  var SIZES = {
    placeholder: {
      images: {
        '1': { x: 0, y: 0, width: 300, height: 300 },
        '2': { x: 300, y: 0, width: 150, height: 150 },
        '3': { x: 450, y: 0, width: 128, height: 128 },
        '4': { x: 300, y: 150, width: 64, height: 64 },
        '5': { x: 300, y: 214, width: 40, height: 40 },
        'empty': {}
      },
      total: { width: 578, height: 1500, numTypes: 5 },
      offsets: {
        'Album': 0,
        'Artist': 1,
        'Playlist': 2,
        'Track': 3,
        'User': 4
      }
    }
  };

  // Preload the placeholder image
  var tempImage = document.createElement('div');
  tempImage.className = 'sp-image-preloader';
  document.body.appendChild(tempImage);
  setTimeout(function() {
    document.body.removeChild(tempImage);
  }, 5000);

});
