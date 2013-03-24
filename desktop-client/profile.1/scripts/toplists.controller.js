require([
  'scripts/controller#Controller',
  '$api/i18n',
  '$api/toplists#Toplist',
  '$api/models#Promise',
  '$api/models#Playlist',
  '$api/library#Library',
  '$views/image#Image',
  '$views/throbber#Throbber',
  '$views/utils/css',
  'strings/playlist.lang'
], function(Controller, i18n, Toplist, Promise, Playlist, Library, Image,
            Throbber, css, playlistStrings) {

  'use strict';

  var TOPLISTS_THRESHOLD = 3;

  // Set up a shorthand for getting a translated string.
  var _ = SP.bind(playlistStrings.get, playlistStrings);

  /**
   * Class names for elements used by this controller
   * @type {Object}
   * @private
   */
  var _elems = {
    container: '.app-toplists',
    playlistHolder: '.top-playlists',
    imageview: '.playlist-image',
    playlistContainer: '.playlist',
    playlistFollowers: '.playlist-followers'
  };

  /**
   * Constructor for the controller
   * @constructor
   */
  var ToplistsController = function() {
    this.init();
  };

  /**
   * Inherit the Controller interface
   */
  SP.inherit(ToplistsController, Controller);

  /**
   * Initialises the controller
   * @param {models.User} user A Spotify user object.
   * @param {Object} templates A Slab template object.
   * @param {?Number} numberOfPlaylists The number of playlists the user has.
   */
  ToplistsController.prototype.initialize = function(isSelf, user, templates,
                                                     playlists) {
    this.user = user;
    this.isSelf = isSelf;
    this.templates = templates;
    this.container = document.querySelector(_elems.container);
    this.topPlaylists = [];
    this.toplists = [];
    this.playlistCache = [];
    this.popcounts = {};
    this.progress = 0;
    if (!playlists) {
      this.loadLibrary();
    } else {
      this.parsePlaylists(playlists);
    }

  };

  /**
   * Go through the playlists and create a cache of uris
   */
  ToplistsController.prototype.parsePlaylists = function(playlists) {
    playlists.map(this.transformIndexItem, this);
    this.loadPlaylists(this.playlistCache.length);
  };

  /**
   * Adds a uri to the playlist cache array
   * @param {IndexItem} obj An IndexItem from the PlaylistHelper.
   */
  ToplistsController.prototype.transformIndexItem = function(obj) {
    this.playlistCache.push(obj.getIdentifier());
  };

  /**
   * Loads the library for the current user to see if they have enough playlists
   */
  ToplistsController.prototype.loadLibrary = function() {
    this.library = this.isSelf ? Library.forCurrentUser() : Library.forUser(this.user);
    this.library.published.snapshot(0, 0).done(this, this.resolveLibrarySnapshot)
      .fail(this, this.destroy);
  };

  /**
   * Resolves the data from the snapshot and passes the length to the toplist loader
   * @param {models.Snapshot} snapshot A snapshot of playlists.
   */
  ToplistsController.prototype.resolveLibrarySnapshot = function(snapshot) {
    var i = 0, l = snapshot.length;
    for (; i < l; i++) {
      this.playlistCache.push(snapshot.get(i).uri);
    }
    this.loadPlaylists(snapshot.length);
  };

  /**
   * Initiates the loading of playlists from the Toplist api
   */
  ToplistsController.prototype.loadPlaylists = function(nbr) {
    if (nbr > TOPLISTS_THRESHOLD) {
      var _this = this;
      SP.analyticsContext('TOPLISTS: loading Toplist.forUser', function() {
        Toplist.forUser(_this.user).load('playlists').done(_this.takePlaylistsSnapshot.bind(_this));
      });
    } else {
      console.log('(ToplistsController.loadPlaylists) not enough playlists', nbr);
      this.destroy();
    }
  };

  /**
   * Takes a snapshot on the loaded collection
   * @param {models.Collection} toplist A collection of Playlists.
   */
  ToplistsController.prototype.takePlaylistsSnapshot = function(toplist) {
    toplist.playlists.snapshot(0, 5).done(this, this.resolveSnapshot);
    // TODO: handle fail
  };

  /**
   * Resolves the playlists in the snapshot and loads them as joined promises
   * @param {models.Snapshot} snapshot A snapshot of the Toplist collection.
   */
  ToplistsController.prototype.resolveSnapshot = function(snapshot) {
    var i = 0, l = snapshot.range.length, promises = [];

    for (; i < l; i++) {
      promises.push(snapshot.get(i).load('name', 'image', 'subscribers', 'uri'));
    }
    Promise.join(promises)
      .each(this, this.addResolvedPlaylist)
      .always(this, this.playlistsLoaded);
  };

  /**
   * Stores successful playlists in an array on the object
   * @param {models.Playlist} playlist A playlist object.
   */
  ToplistsController.prototype.addResolvedPlaylist = function(playlist) {
    this.topPlaylists.push(playlist);
  };

  /**
   * Fires when all snapshot promises have completed, whether failed or not. Successful
   * loads have been taken care of in addResolvedPlaylist. We might want to do something
   * with the errors here, otherwise we can skip to load subscribers count.
   * @param {Array} playlists An array with either playlists or error objects.
   */
  ToplistsController.prototype.playlistsLoaded = function(playlists) {
    var i = 0, l = this.topPlaylists.length;
    this.progress = l;
    for (; i < l; i++) {
      this.loadSubscribersForPlaylist(this.topPlaylists[i]);
    }
  };

  /**
   * Renders the view for this controller. If we don't get enough playlists
   * here, quit and destroy this module.
   */

  ToplistsController.prototype.render = function() {
    // filter playlists with 0 subscribers, and those no longer in the
    // published list (deleted by owner but still in old backend snapshot),
    // then sort by subscriber count
    var i = 0, l = this.topPlaylists.length, playlist, popcount;

    for (; i < l; i++) {
      playlist = this.topPlaylists[i];
      if (!this.popcounts.hasOwnProperty(playlist.uri)) {
        continue;
      }
      if (this.playlistCache.indexOf(playlist.uri) < 0) {
        continue;
      }
      popcount = this.popcounts[playlist.uri];
      if (popcount <= 0) {
        continue;
      }
      this.toplists.push({playlist: playlist, popcount: popcount});
    }
    this.toplists.sort(this.sortList);

    console.log('(ToplistController.render) found playlists in toplists', this.toplists.length);

    if (this.toplists.length > 3) {
      this.container.innerHTML = this.templates.toplists({
        toplists: {
          heading: _('topPlaylistsHeading')
        }
      });
      this.throbber = Throbber.forElement(this.container);
      this.renderPlaylists();
    } else {
      console.log('(ToplistsController.render) not enough playlists in toplist', this.toplists.length);
      this.destroy();
      return false;
    }
  };

  ToplistsController.prototype.sortList = function(a, b) {
    return b.popcount - a.popcount;
  };

  /**
   * Render cleaned up top playlists
   */
  ToplistsController.prototype.renderPlaylists = function() {
    var i = 0, l = this.toplists.length;
    for (; i < l; i++) {
      this.renderPlaylist(this.toplists[i].playlist, this.toplists[i].popcount);
    }
  };

  /**
   * Initiates load of subscribers for a playlist
   * @param {models.Playlist} playlist A Spotify playlist.
   */
  ToplistsController.prototype.loadSubscribersForPlaylist = function(playlist) {
    var _this = this;

    SP.analyticsContext('TOPLISTS: loading playlist subscribers', function() {
      playlist.subscribers.load().done(function(collection) {
        _this.loadSubscribersSnapshot(collection, playlist);
      });
    });
    // TODO: HANDLE FAIL
  };

  /**
   * Takes a snapshot of the subscriber collection
   * @param {models.Collection} collection A collection of user objects.
   * @param {models.Playlist} playlist The current playlist is passed through.
   */
  ToplistsController.prototype.loadSubscribersSnapshot = function(collection, playlist) {
    var _this = this;

    collection.snapshot(0, 0).done(function(snapshot) {
      _this.popcounts[playlist.uri] = snapshot.length;
      _this.progress--;
      if (_this.progress === 0)
        _this.render();
    });
    // TODO: maybe we should handle fail here as well?
  };

  /**
   * Renders a playlist
   * @param {models.Playlist} playlist A Spotify playlist object.
   * @param {models.User} owner A Spotify user object.
   * @param {number} playlist The subscriber count for this playlist.
   */
  ToplistsController.prototype.renderPlaylist = function(playlist, popcount) {
    var playlistItemContainer = document.createElement('div'), ownerlink,
        formattedPopcount = i18n.number(popcount);

    css.addClass(playlistItemContainer, 'playlist');
    playlistItemContainer.setAttribute('data-popcount', popcount);

    playlistItemContainer.innerHTML = this.templates.toplistplaylist({
      playlist: {
        name: playlist.name.decodeForHtml(),
        uri: playlist.uri,
        followers: popcount === 1 ? _('followerCountSingle', '<strong>' + formattedPopcount + '</strong>') :
            _('followerCountPlural', '<strong>' + formattedPopcount + '</strong>')
      }
    });

    var image = Image.forPlaylist(playlist, {
      animate: true,
      height: 128,
      width: 128,
      player: true,
      link: playlist.uri
    });

    playlistItemContainer.querySelector(_elems.imageview).appendChild(image.node);

    if (this.throbber.isActive) {
      this.throbber.hide();
    }

    this.appendPlaylistNode(playlistItemContainer);
  };

  /**
   * Inserts playlist node in the right place
   * @param {object} node HTML node to insert.
   */
  ToplistsController.prototype.appendPlaylistNode = function(node) {
    this.container.querySelector(_elems.playlistHolder).appendChild(node);
  };

  exports.Toplists = ToplistsController;
});
