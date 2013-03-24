require([
  'scripts/profile-utils',
  'scripts/playlist-helper',
  'scripts/controller#Controller',
  'scripts/context-menu',
  'scripts/logger#Logger',
  '$api/i18n',
  '$api/library#Library',
  '$api/models#Playlist',
  '$api/models#Promise',
  '$api/models#application',
  '$views/list#List',
  '$views/image#Image',
  '$views/buttons#SubscribeButton',
  '$views/buttons#CustomButton',
  '$views/throbber#Throbber',
  '$views/utils/css',
  'strings/playlist.lang'
], function(utils, helper, Controller, menus, Logger, i18n, Library, Playlist, Promise, application,
            List, Image, SubscribeButton, CustomButton, Throbber, css, playlistStrings) {

  'use strict';

  var DEBUG = false;

  // Set up a shorthand for getting a translated string.
  var _ = SP.bind(playlistStrings.get, playlistStrings);

  /**
   * Class names for elements used by this controller
   * @type {Object}
   * @private
   */
  var _elems = {
    container: '.app-playlists',
    header: '.section-header',
    content: '.playlists',
    listview: '.playlist-listview',
    followers: '.playlist-followers',
    buttonview: '.playlist-buttonview',
    imageview: '.playlist-image',
    icon: '.playlist-icon'
  };

  /**
   * Collection of constants used in the controller
   * @type {Object}
   * @private
   */
  var _const = {
    INIT_BATCH_TO_LOAD: 5,
    SCROLL_BATCH_TO_LOAD: 3
  };

  /**
   * Instances of Playlist
   * @type {Array.<List>}
   * @private
   */
  var _lists = [];

  /**
   * Constructor for the controller
   * @constructor
   * @extends {Controller}
   */
  var PlaylistController = function() {
    this.scrollHandler = this.scrollHandler.bind(this);
    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);
    this.init();
  };

  /**
   * Inherit the Controller interface
   */
  SP.inherit(PlaylistController, Controller);

  /**
   * Initialises the controller
   * @param {boolean} isSelf Bool indicating that it's the current user we want to load.
   * @param {models.User} user A Spotify user object.
   * @param {Object} templates A Slab template object.
   * @param {?function} doneCallback A callback function to be fired when playlists are loaded.
   * @param {Object} scope The scope for the above callback.
   */
  PlaylistController.prototype.initialize = function(isSelf, user, templates,
                                                     doneCallback, scope) {
    this.playlists = null;
    this.batchindex = 0;
    this.user = user;
    this.templates = templates;
    this.isSelf = isSelf;
    this.container = document.querySelector(_elems.container);
    this.renderedPlaylistsByIndex = [];
    this.renderHeader();
    this.doneCallback = doneCallback || null;
    this.externalScope = scope || null;
    helper.registerCallback(this.playlistsLoaded.bind(this));

    this.library = isSelf ? Library.forCurrentUser() : Library.forUser(this.user);
    helper.setLibrary(this.library);
    helper.registerEventHandlers({
      onInsert: true,
      onRemove: this.updateOnRemove.bind(this),
      onPublishedInsert: isSelf ? this.updateOnPublishedInsert.bind(this) : true,
      onPublishedRemove: isSelf ? this.updateOnPublishedRemove.bind(this) : true
    });
    helper.load(isSelf, scope.session);
  };

  /**
   * Process loaded playlists
   * @param {Array} playlists An array of helper.IndexObjects.
   */
  PlaylistController.prototype.playlistsLoaded = function(playlists) {
    console.log('(PlaylistController.playlistsLoaded) playlists loaded:', playlists.length);
    this.removeNoPlaylistMessage();
    if (playlists.length) {
      this.playlists = playlists;
      this.render();
    } else {
      this.renderNoPlaylistsMessage();
    }
    if (this.doneCallback && typeof this.doneCallback === 'function') {
      this.doneCallback.call(this.externalScope || this);
    }
  };

  /**
   * Displays a message when a user has no playlists
   * TODO: do this better and make this part of the error controller?
   */
  PlaylistController.prototype.renderNoPlaylistsMessage = function() {
    var message;

    if (this.throbber.isActive) {
      this.throbber.hide();
    }
    if (this.isSelf) {
      message = _('currentUserNoPlaylists');
    } else {
      var userName = utils.userFirstName(this.user);
      message = _('userNoPlaylists', userName);
    }

    var content = document.createElement('div');
    css.addClass(content, 'no-playlists');
    css.addClass(content, 'apply-width');
    content.innerHTML = this.templates.empty_message({
      message: message
    });
    this.container.querySelector(_elems.content).appendChild(content);
  };

  /**
   * Removes no playlist message
   */
  PlaylistController.prototype.removeNoPlaylistMessage = function() {
    var msg = this.container.querySelector('.no-playlists');
    if (msg) {
      msg.parentNode.removeChild(msg);
    }
  };

  /**
   * Renders the view for this controller
   */
  PlaylistController.prototype.render = function() {
    this.loadBatch();
  };

  PlaylistController.prototype.renderHeader = function() {
    this.container.innerHTML = this.templates.playlists({
      playlists: {
        heading: _('playlistsHeading')
      }
    });
    this.throbber = Throbber.forElement(this.container.querySelector(_elems.content));
    this.throbber.setPosition(0, 0);
  };

  /**
   * Scroll handler for this view
   */
  PlaylistController.prototype.scrollHandler = function(st) {
    var _this = this;

    if (this.timer) {
      clearTimeout(this.timer);
    }

    if (st >= this.lastScrollY && _this.playlists && _this.renderedPlaylistsByIndex.length < _this.playlists.length) {
      _this.timer = setTimeout(_this.loadBatch.bind(_this), 100);
    }

    this.lastScrollY = st;
  };

  /**
   * Loads a batch of playlists from the index. Called by the scrollhandler, or on init
   */
  PlaylistController.prototype.loadBatch = function() {
    if (!this.playlists) {
      return;
    }
    var i, playlistsLength = this.playlists.length,
        maxIndexToRender = this.batchindex === 0 ? _const.INIT_BATCH_TO_LOAD :
        this.batchindex + _const.SCROLL_BATCH_TO_LOAD, _this = this;

    SP.analyticsContext('PLAYLISTS: loading a batch of playlists',
        function() {
          for (i = _this.batchindex; i < maxIndexToRender && i < playlistsLength; i++) {
            _this.preRenderPlaylist(i);
          }
          _this.batchindex = maxIndexToRender;
        }
    );
  };

  /**
   * Get data for a playlist
   * @param {number} i The index position from the snapshot.
   */
  PlaylistController.prototype.preRenderPlaylist = function(i) {
    var obj = this.playlists[i];

    if (obj) {
      var identifier = obj.getIdentifier();
      if (identifier.indexOf(this.user.username + ':publishedstarred') > -1) {
        console.log('(PlaylistController.render) skipping', identifier);
        // TODO: how to handle publishstarred, if at all?
      } else {
        this.getPlaylist(obj.getDataObject(), i);
      }
      this.renderedPlaylistsByIndex.push(i);
    }
  };

  /**
   * Get data for a playlist
   * @param {models.Playlist} playlist A Spotify Playlist.
   * @param {number} i The index position from the snapshot.
   */
  PlaylistController.prototype.getPlaylist = function(playlist, i) {
    var _this = this;

    SP.analyticsContext('PLAYLIST: load playlist', function() {
      playlist.load('name', 'owner', 'subscribers', 'published', 'collaborative').done(function(p) {
        _this.getPlaylistOwner(p, i);
      }).fail(function() {
        console.error('(PlaylistController.getPlaylist) playlist failed to load', arguments);
      });
    });

  };

  /**
   * Loads the playlists owner object
   * @param {models.Playlist} playlist A Spotify playlist object.
   * @param {number} popcount An integer indicating the total number of subscribers.
   */
  PlaylistController.prototype.getPlaylistOwner = function(playlist, index) {
    var _this = this;

    SP.analyticsContext('PLAYLIST: load playlist owner', function() {
      playlist.owner.load('name', 'username', 'currentUser').done(function() {
        _this.getPlaylistSnapshot(playlist, index);
      }).fail(function() {
        _this.getPlaylistSnapshot(playlist, index);
      });
    });
  };

  /**
   * Loads the playlists snapshot
   * @param {models.Playlist} playlist A Spotify playlist object.
   * @param {number} index The position of the playlist in the snapshot.
   */
  PlaylistController.prototype.getPlaylistSnapshot = function(playlist, index) {
    playlist.tracks.snapshot(0, 0).done(this.renderPlaylist.bind(this, playlist, index)).fail(this.renderPlaylist.bind(this, playlist, index));
  };

  PlaylistController.prototype.isOwnPlaylist = function(playlist) {
    return (playlist.owner.currentUser && this.isSelf) || playlist.owner.username === this.user.username;
  };

  /**
   * Renders the playlist
   * @param {models.Playlist} playlist A Spotify playlist object.
   * @param {number} index The position of the playlist in the snapshot.
   * @param {models.Snapshot} snapshot A snapshot of subscribers.
   */
  PlaylistController.prototype.renderPlaylist = function(playlist, index, snapshot) {
    var playlistItemContainer = document.createElement('article'),
        isStarred = utils.linkTypeHelper.isStarredPlaylist(playlist.uri),
        isToplist = utils.linkTypeHelper.isToplist(playlist.uri),
        image, title, list;

    // TODO:(huge)
    // per SOC-539 it's for starred list only and we have to
    // confirm if this rule is applied for every single playlist
    if (isStarred && 0 === snapshot.length) {
      return;
    }

    playlistItemContainer.setAttribute('id', 'playlist-' + index);
    playlistItemContainer.setAttribute('data-uri', playlist.uri);
    playlistItemContainer.setAttribute('data-index', index);

    // creates a header for the playlist based on what type of playlist it is
    if (isStarred) {
      title = this.isOwnPlaylist(playlist) ?
          utils.createLinkHelper(playlist.uri, _('starredTracks')) :
          utils.createLinkHelper(playlist.uri, _('starredTracks')) + ' <span>' + _('by') + '</span> ' +
          utils.createLinkHelper(playlist.owner.uri, playlist.owner.name);
    } else if (isToplist) {
      title = this.isOwnPlaylist(playlist) ?
          utils.createLinkHelper(playlist.uri, _('topTracks')) :
          utils.createLinkHelper(playlist.uri, _('topTracks')) + ' <span>' + _('by') + '</span> ' +
          utils.createLinkHelper(playlist.owner.uri, playlist.owner.name);
    } else {
      title = this.isOwnPlaylist(playlist) ?
          utils.createLinkHelper(playlist.uri, playlist.name) :
          utils.createLinkHelper(playlist.uri, playlist.name) + ' <span>' + _('by') + '</span> ' +
          utils.createLinkHelper(playlist.owner.uri, playlist.owner.name);
    }

    var headerPrefix = DEBUG ? (index + '# ') : '';
    // render to the template
    css.addClass(playlistItemContainer, 'playlist');
    css.addClass(playlistItemContainer, 'apply-width');
    playlistItemContainer.innerHTML = this.templates.playlist({
      playlist: {
        title: headerPrefix + title
      }
    });

    var imgSettings = {
      animate: true,
      height: 128,
      width: 128,
      placeholder: 'playlist',
      playerItem: playlist,
      player: true,
      link: playlist.uri
    };

    // selects the right image for this playlist
    if (isStarred) {
      image = Image.fromSource('img/starred.png', imgSettings);
    } else if (isToplist) {
      image = Image.fromSource('img/toptracks.png', imgSettings);
    } else {
      image = Image.forPlaylist(playlist, imgSettings);
    }

    // creates the listview
    list = List.forPlaylist(playlist, {
      context: playlist,
      type: 'tracks',
      fields: ['star', 'share', 'track', 'artist', 'time', 'album', 'popularity'],
      header: 'yes',
      unplayable: 'hidden',
      numItems: 5
    });

    // In order to free each playlist memory usage
    // We collect list instance to _lists array so
    // it can be garbage collected
    _lists.push(list);

    // create buttons
    var buttonContainer = playlistItemContainer.querySelector(_elems.buttonview),
        followButton = SubscribeButton.forPlaylist(playlist),
        publishButton,
        hasPublishButton = this.isSelf && !playlist.collaborative && !isToplist;

    // append the image
    playlistItemContainer.querySelector(_elems.imageview).appendChild(image.node);

    // listen to events from button
    this.listenToFollowbutton(followButton, playlist.uri);

    // check to see if we should render the publish button
    if (hasPublishButton) {
      if (playlist.published) {
        publishButton = CustomButton.withClass('playlist-publishbutton ' +
            'playlist-publishbutton-public', _('public'));
      } else {
        publishButton = CustomButton.withClass('playlist-publishbutton ' +
            'playlist-publishbutton-secret', _('secret'));
      }
      playlistItemContainer.querySelector(_elems.imageview).appendChild(publishButton.node);
    }

    // adds collaborative icon and text
    if (playlist.collaborative) {
      var icon = playlistItemContainer.querySelector(_elems.icon);
      css.addClass(icon, 'collaborative');
    }
    playlistItemContainer.querySelector(_elems.listview).appendChild(list.node);

    // only append follow if it's not the current users playlist
    if (!playlist.owner.currentUser) {
      buttonContainer.appendChild(followButton.node);
      buttonContainer.style.paddingLeft = followButton.offsetWidth + 10 + 'px';
    }

    this.insertPlaylistNode(playlistItemContainer, index, playlist);
    this.getPlaylistPopcount(playlistItemContainer, buttonContainer, playlist);
    this.renderMoreButton(playlistItemContainer, playlist, snapshot.length);

    // create the public/secret menu
    if (hasPublishButton) {
      var showMenu = this.createPublishMenu(playlist, publishButton.node,
          playlistItemContainer.querySelector(_elems.imageview));

      // show the menu after mouse click or on mouse hover
      this.events.listen(publishButton.node, 'mouseup', showMenu);
      this.events.listen(publishButton.node, 'mouseover', showMenu);
    }
    list.init();
  };

  /**
   * Creates a context menu to allow toggling of Public/Secret status for a given playlist
   * @param {models.Playlist} playlist A Spotify playlist object.
   * @param {views.Button} button The button that controls the menu.
   * @param {Element} playlistImageView The element that contains the playlist image + links.
   * @return {Function} A function that makes the context menu visible.
   */
  PlaylistController.prototype.createPublishMenu = function(playlist, button, playlistImageView) {
    var contextMenu = new menus.ContextMenu();
    contextMenu.setOptions(this.createPublishOptions(playlist, contextMenu));
    return function() {
      contextMenu.setElements(button, playlistImageView);
      contextMenu.show(button);
    };
  };

  /**
   * Sets up listeners to the playlists followbutton so we can update the popcount
   * visually on click
   * @param {modelsApi.SubscribeButton} button The followbutton.
   * @param {string} uri The playlist uri.
   */
  PlaylistController.prototype.listenToFollowbutton = function(button, uri) {
    var _this = this;

    this.events.listen(button, 'subscribe', function() {
      Logger.log({ type: 'subscribeToPlaylist', uri: uri });
      _this.updatePopcount(true, uri);
    });
    this.events.listen(button, 'unsubscribe', function() {
      Logger.log({ type: 'unsubscribeFromPlaylist', uri: uri });
      _this.updatePopcount(false, uri);
    });
  };

  /**
   * Renders the see more tracks button
   * @param {Element} container The current playlist container.
   * @param {models.Playlist} playlist A Spotify playlist object.
   * @param {number} trackcount The number of tracks in the playlist.
   */
  PlaylistController.prototype.renderMoreButton = function(container, playlist, trackcount) {
    var moreButton = CustomButton.withClass('playlist-morebutton', _('seeAllTracks'));

    if (trackcount && trackcount > 1) {
      this.events.listen(moreButton, 'click', function() {
        application.openURI(playlist.uri);
      });
      container.appendChild(moreButton.node);
    }
  };

  /**
   * Takes a playlist and loads its subscribers
   * @param {Element} container The current playlist container.
   * @param {Element} buttonContainer The current playlist button container.
   * @param {models.Playlist} playlist A Spotify playlist object.
   */
  PlaylistController.prototype.getPlaylistPopcount = function(container, buttonContainer, playlist) {
    var _this = this;

    SP.analyticsContext('PLAYLIST: loading subscribers', function() {
      playlist.subscribers.snapshot(0, 10).done(function(ss) {
        _this.resolveUserPromises(container, buttonContainer, ss);
      });
    });
  };

  /**
   * Takes the current playlist and the previously loaded playlist and starts
   * loading user objects from the subscribers collection
   * @param {Element} container The current playlist container.
   * @param {Element} buttonContainer The current playlist button container.
   * @param {models.Snapshot} snapshot A snapshot of subscribers.
   */
  PlaylistController.prototype.resolveUserPromises = function(container, buttonContainer, snapshot) {
    var i = 0, l = snapshot.range.length, promises = [], _this = this;

    for (; i < l; i++) {
      promises.push(snapshot.get(i).load('name', 'username', 'uri'));
    }
    Promise.join(promises).done(function(users) {
      _this.renderFollowerMarkup(container, buttonContainer, users, snapshot.length);
    }).fail(function() {
      _this.renderFollowerMarkup(container, buttonContainer, null, snapshot.length);
    });
  };

  /**
   *
   * @param {Element} container The current playlist container.
   * @param {Element} buttonContainer The current playlist button container.
   * @param {Array} followers A set of user objects.
   * @param {number} popcount How many subscribers the playlist has.
   */
  PlaylistController.prototype.renderFollowerMarkup = function(container, buttonContainer, followers, popcount) {
    var followersArray = [], followersString = null, playlistFollowersContainer,
        followButton = buttonContainer.querySelector('.sp-button-subscribe');

    container.querySelector(_elems.followers).innerHTML = this.templates.playlistfollowers({
      playlist: {
        followersText: _('followers'),
        popcount: i18n.number(popcount)
      }
    });

    container.setAttribute('data-popcount', popcount);

    // adds the names of the first few followers, if any
    if (followers && followers.length) {
      var i = 0, toRender = 0, l = followers.length;

      for (; i < l && toRender < 5; i++) {
        if (!/^\d+$/.test(followers[i].name)) {
          followersArray.push(utils.createLinkHelper(followers[i].uri, followers[i].name));
          toRender++;
        }
      }
      followersString = followersArray.join(', ');
      followersString += '.';
      playlistFollowersContainer = document.createElement('p');
      css.addClass(playlistFollowersContainer, 'playlist-followers-container');

      if (followButton) {
        buttonContainer.style.paddingLeft = followButton.offsetWidth + 10 + 'px';
      }
    }
    if (followersString) {
      playlistFollowersContainer.innerHTML = _('followedBy', followersString);
      buttonContainer.appendChild(playlistFollowersContainer);
    }
  };

  /**
   * Increments or decreases the popcount value of a playlist
   * @param {boolean} add If this is true we add value or 1, otherwise decrease by 1.
   * @param {string} uri The playlist uri.
   * @param {?Number} value How much to add/subtract from the popcount.
   */
  PlaylistController.prototype.updatePopcount = function(add, uri, value) {
    var amt = value ? value : 1;
    var playlistContainer = this.container.querySelector('[data-uri="' + uri + '"]');
    var element = playlistContainer.querySelector('.popcount-value');
    var current = parseInt(playlistContainer.getAttribute('data-popcount'), 10);

    if (add) {
      current = current + amt;
    } else {
      current = current - amt;
      current = current < 0 ? 0 : current;
    }
    element.innerText = i18n.number(current);
    playlistContainer.setAttribute('data-popcount', current);
  };

  /**
   * Removes an element from the DOM
   * @param {Element} element The element to remove.
   */
  PlaylistController.prototype.removeElement = function(element) {
    var _this = this;

    css.addClass(element, 'element-hide');
    var to = setTimeout(function() {
      css.addClass(element, 'hidden');
      var content = _this.container.querySelector(_elems.content);
      var allHidden = content.querySelectorAll('.element-hide');
      if (content && allHidden.length) {
        var i = 0, l = allHidden.length;
        for (; i < l; i++) {
          content.removeChild(allHidden[i]);
        }
      }
      clearTimeout(to);
    }, 500);
  };

  /**
   * Inserts the playlist container in the right place in the DOM
   * @param {Element} container The playlist html.
   * @param {number} index The sequence index which the playlist was loaded.
   */
  PlaylistController.prototype.insertPlaylistNode = function(container, index, playlist) {
    var content = this.container.querySelector(_elems.content),
        playlistItemDivider = document.createElement('hr'),
        playlists = content.querySelectorAll('.playlist'),
        l = playlists.length,
        i = 0, indexToInsert = 0;

    playlistItemDivider.setAttribute('data-divider-for', playlist.uri);
    if (l === 0 || playlists[l - 1].getAttribute('data-index') < index) {
      content.appendChild(container);
      content.appendChild(playlistItemDivider);
    } else {
      for (; i < l; i++) {
        if (playlists[i].getAttribute('data-index') < index) {
          indexToInsert++;
        }
        content.insertBefore(container, playlists[indexToInsert]);
        content.insertBefore(playlistItemDivider, playlists[indexToInsert]);
      }
    }

    if (this.throbber.isActive) {
      this.throbber.hide();
    }
  };

  /**
   * Destroys the helper and calls the inherited destroy
   */
  PlaylistController.prototype.destroy = function() {
    var i, len;

    helper.destroy();
    for (i = 0, len = _lists.length; i < len; i++) {
      _lists[i].destroy();
    }
    Controller.prototype.destroy.call(this);
  };

  /**
   * Callback to fire when library gets a remove event
   */
  PlaylistController.prototype.updateOnRemove = function() {
    var playlistUris = helper.getLatestChange(), element, divider;
    var i = 0, l = playlistUris.length;

    for (; i < l; i++) {
      element = this.container.querySelector('[data-uri="' + playlistUris[i] + '"]');
      divider = this.container.querySelector('[data-divider-for="' + playlistUris[i] + '"]');
      if (element) {
        this.removeElement(element);
      }
      if (divider) {
        this.removeElement(divider);
      }
    }
  };

  /**
   * Callback to fire when library gets a insert event on current user's
   * published list
   */
  PlaylistController.prototype.updateOnPublishedInsert = function() {
    var playlistUris = helper.getLatestChange(), element;
    var i = 0, l = playlistUris.length;

    for (; i < l; i++) {
      element = this.container.querySelector('[data-uri="' + playlistUris[i] + '"]');
      if (element) {
        var button = element.getElementsByClassName('playlist-publishbutton')[0];
        var menu_public = element.getElementsByClassName('menu-item-public')[0];
        var menu_secret = element.getElementsByClassName('menu-item-secret')[0];
        button.innerText = _('public');
        css.removeClass(button, 'playlist-publishbutton-secret');
        css.addClass(button, 'playlist-publishbutton-public');
        css.removeClass(menu_secret, 'active');
        css.addClass(menu_public, 'active');
      }
    }
  };

  /**
   * Callback to fire when library gets a insert event on current user's
   * published list
   */
  PlaylistController.prototype.updateOnPublishedRemove = function() {
    var playlistUris = helper.getLatestChange(), element;
    var i = 0, l = playlistUris.length;

    for (; i < l; i++) {
      element = this.container.querySelector('[data-uri="' + playlistUris[i] + '"]');
      if (element) {
        var button = element.getElementsByClassName('playlist-publishbutton')[0];
        var menu_public = element.getElementsByClassName('menu-item-public')[0];
        var menu_secret = element.getElementsByClassName('menu-item-secret')[0];
        button.innerText = _('secret');
        css.removeClass(button, 'playlist-publishbutton-public');
        css.addClass(button, 'playlist-publishbutton-secret');
        css.removeClass(menu_public, 'active');
        css.addClass(menu_secret, 'active');
      }
    }
  };

  /**
   *
   * @param {models.Playlist} playlist A Spotify playlist object.
   * @param {ContextMenu} menu The actual instance of the menu, for reference.
   * @return {Array} An array of ContextMenuItems.
   */
  PlaylistController.prototype.createPublishOptions = function(playlist, menu) {
    var options = [], _this = this;

    var publish = new menus.ContextMenuItem({
      text: _('public'),
      cssClass: 'menu-item-public',
      active: playlist.published,
      handler: function() {
        menu.clearActive();
        css.addClass(this.element, 'active');
        _this.library.publish(playlist);
        menu.close();
      }
    });
    options.push(publish);

    var unpublish = new menus.ContextMenuItem({
      text: _('secret'),
      cssClass: 'menu-item-secret',
      active: !playlist.published,
      handler: function() {
        menu.clearActive();
        css.addClass(this.element, 'active');
        _this.library.unpublish(playlist);
        menu.close();
      }
    });
    options.push(unpublish);

    return options;
  };

  /**
   * Getter for returning the controllers array of playlist objects
   */
  PlaylistController.prototype.getPlaylists = function() {
    return this.playlists || [];
  };

  exports.Playlists = PlaylistController;
});
