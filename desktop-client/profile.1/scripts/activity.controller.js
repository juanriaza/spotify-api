require([
  'scripts/profile-utils',
  'scripts/controller#Controller',
  '$api/activity#Feed',
  '$api/models',
  '$views/image#Image',
  '$views/utils/css',
  'strings/activity.lang',
  'strings/playlist.lang'
], function(utils, Controller, Feed, modelsApi, Image, css, activityStrings, playlistStrings) {

  'use strict';

  // Set up a shorthand for getting a translated string.
  var _ = SP.bind(activityStrings.get, activityStrings);
  var _p = SP.bind(playlistStrings.get, playlistStrings);

  /**
   * Class names for elements used by this controller
   * @type {Object}
   * @private
   */
  var _elems = {
    container: '.app-activity',
    itemsContainer: '.recent-activity',
    imageContainer: '.item-image'
  };

  var _user;
  var _currentUser;
  var MAX_NUMBER_OF_ACTIVITIES = 5;

  /**
   * Constructor for the controller
   * @constructor
   */
  var ActivityController = function() {
    this.init();
  };

  /**
   * Inherit the Controller interface
   */
  SP.inherit(ActivityController, Controller);

  /**
   * Initialises the controller
   * @param {models.User} user A Spotify user object.
   * @param {Object} templates A Slab template object.
   */
  ActivityController.prototype.initialize = function(isSelf, user, templates, currentUser) {
    this.isSelf = isSelf;
    this.user = user;
    _user = user;
    _currentUser = currentUser;
    this.feed = null;
    this.activities = [];
    this.activitiesSnapshot = null;
    this.templates = templates;
    this.container = document.querySelector(_elems.container);
    this.itemsNode = null;
    this.numberOfRenderedItems = 0;
    this.reloadTimeout = null;
    this.reloadFlag = true;
    this.reloadCounter = 0;

    this.loadActivities();
  };

  /**
   * Reloads recent activities if reload flag is on
   */
  ActivityController.prototype.reload = function() {
    clearTimeout(this.reloadTimeout);
    if (this.reloadFlag && this.reloadCounter < 3) {
      this.loadActivities();
      this.reloadCounter++;
    } else if (this.reloadCounter >= 3 && this.numberOfRenderedItems === 0) {
      this.hide();
    }
  };

  /**
   * Loads recent activities for user
   */
  ActivityController.prototype.loadActivities = function() {
    // reset number of rendered items for activate listener
    this.numberOfRenderedItems = 0;

    if (!this.feed) {
      this.feed = Feed.forUser(this.user);
    }
    this.feed.load('activities').done(this.loadSnaphot.bind(this)).fail(function(s, e) {
      console.error('(ActivityController) loading activities failed', s, e);
    });
  };

  /**
   * Loads a snapshot of recent activities
   * @param {models.Feed} feed An activity object.
   */
  ActivityController.prototype.loadSnaphot = function() {
    this.feed.activities.snapshot().done(this.resolveSnapshot.bind(this)).fail(function(s, e) {
      console.error('(ActivityController) activities snapshot failed', s, e);
    });
  };

  /**
   * Resolves snapshot of recent activities
   * @param {models.Snapshot} snapshot Snapshot of activities.
   */
  ActivityController.prototype.resolveSnapshot = function(snapshot) {
    // console.log('(Activity) snapshot loaded', snapshot, snapshot.range.length);
    // Snapshot may become empty on activate if the user disables sharing to Spotify Social.
    if (snapshot.length === 0) {
      this.container.style.display = 'none';
      return;
    } else {
      this.container.style.display = '';
    }

    var promises = [];
    this.activitiesSnapshot = snapshot;
    for (var i = snapshot.range.length - 1, activitiesToRender = 0; i >= 0 && activitiesToRender < MAX_NUMBER_OF_ACTIVITIES; i--) {
      var activity = snapshot.get(i);
      var activityType = ActivityParser.getType(activity);
      if (activityType === 'UNKNOWN') {
        continue;
      }

      // Filter out listening stories
      if (activityType === 'TRACK_FINISHED_PLAYING' ||
          activityType === 'APP_TRACK_FINISHED_PLAYING' ||
          activityType === 'RADIO_TRACK_FINISHED_PLAYING') {
        continue;
      }
      promises.push(activity.load('activityType', 'item', 'timestamp'));
      activitiesToRender++;
    }

    modelsApi.Promise.join(promises).always(this.activitiesLoaded.bind(this));
  };

  /**
   * Renders activities or information about no activities
   * @param {array} activities An array of activities to render.
   */
  ActivityController.prototype.activitiesLoaded = function(activities) {
    // console.log('(Activity) activities loaded', activities);
    if (activities) {
      this.activities = activities;
    }

    this.render();
  };

  /**
   * Renders the view for this controller
   * Show nothing if there is no recent activities
   */
  ActivityController.prototype.render = function() {
    var shouldRender = this.activities && this.activities.length > 0;

    if (shouldRender) {
      this.renderHeader();
      this.renderLoader();

      this.itemsNode = this.container.querySelector(_elems.itemsContainer);

      for (var i = 0, l = this.activities.length; i < l; i++) {
        var activity = this.activities[i];

        this.loadActivityData(activity, i);
      }

      this.reloadTimeout = setTimeout(this.reload.bind(this), 5000);
    }
  };

  /**
   * Renders loader before activities loaded
   */
  ActivityController.prototype.renderLoader = function() {
    var itemsNode = this.container.querySelector(_elems.itemsContainer);

    var msg = document.createElement('div');
    css.addClass(msg, 'loader');
    msg.innerHTML = _('loadingActivities');

    itemsNode.appendChild(msg);
  };

  /**
   * Removes loader
   */
  ActivityController.prototype.removeLoader = function() {
    var loader = this.container.querySelector('.loader');
    if (loader) {
      loader.parentNode.removeChild(loader);
    }
  };

  /**
   * Renders header for activity container
   */
  ActivityController.prototype.renderHeader = function() {
    this.container.innerHTML = this.templates.activity({
      activity: {
        heading: _('recentActivity')
      }
    });
  };

  /**
   * Collects what objects are needed for certain activity
   * and load them in promise
   *
   * @param {models.Activity} activity Activity to load.
   */
  ActivityController.prototype.loadActivityData = function(activity) {
    // console.log('(Activity) loading activity', activity);
    var promises = [];

    if (ActivityParser.getType(activity) === 'PLAYLIST_TRACK_STARRED') {
      var uri = activity.item.uri.split(':');
      uri[3] = 'starred';
      activity.item.uri = uri.join(':');
    }

    promises.push(activity.item.load('name', 'image'));

    if ((ActivityParser.getType(activity) === 'PLAYLIST_TRACK_STARRED' ||
        ActivityParser.getType(activity) === 'PLAYLIST_TRACK_ADDED' ||
        ActivityParser.getType(activity) === 'TRACK_SHARED') &&
        activity.context) {
      promises.push(activity.context.load('name'));
    }

    if (ActivityParser.getType(activity) === 'PLAYLIST_TRACK_STARRED' ||
        ActivityParser.getType(activity) === 'TRACK_SHARED' ||
        ActivityParser.getType(activity) === 'ALBUM_SHARED') {
      modelsApi.Promise.join(promises).done(this.loadMoreData.bind(this, activity)).fail(this.loadingActivityFail.bind(this));
    } else {
      modelsApi.Promise.join(promises).done(this.renderItem.bind(this, activity)).fail(this.loadingActivityFail.bind(this));
    }
  };

  ActivityController.prototype.loadMoreData = function(activity) {
    var data = activity.item;

    if (ActivityParser.getType(activity) === 'PLAYLIST_TRACK_STARRED') {
      data = activity.context;
    }

    if (data && data.artists && data.artists[0]) {
      data.artists[0].load('name').done(this.renderItem.bind(this, activity)).fail(this.loadingActivityFail.bind(this));
    }
  };

  /**
   * Loads next activity from snapshot which was not loaded yet
   */
  ActivityController.prototype.loadingActivityFail = function() {
    console.error('(Activity) promise loading activities failed', arguments);
  };

  /**
   * Renders HTML for loaded activity
   * @param {models.Activity} activity Activity to load.
   */
  ActivityController.prototype.renderItem = function(activity) {
    if (this.numberOfRenderedItems >= MAX_NUMBER_OF_ACTIVITIES) {
      // console.log('(Activity) enough activities - activity not rendered', activity);
      return false;
    }
    this.removeLoader();
    this.reloadFlag = false;

    // console.log('(Activity) activity rendered', this.numberOfRenderedItems, activity);
    var type = ActivityParser.getType(activity);
    var activityContainer = document.createElement('div');

    css.addClass(activityContainer, 'item');
    if (activity.message) {
      css.addClass(activityContainer, 'with-message');
    }
    activityContainer.dataset.timestamp = Number(activity.timestamp);
    activityContainer.innerHTML = this.templates.activity_item({
      activity: {
        duration: Number(activity.timestamp) !== 0 ? utils.timeAgo(activity.timestamp) : '',
        message: activity.message ? activity.message : '',
        text: this.activityText(activity)
      }
    });

    var imageNode = activityContainer.querySelector(_elems.imageContainer);
    this.insertActivityNode(activityContainer);

    var imageSetting = {
      animate: true,
      height: 40,
      width: 40
    };

    var image = Image.forUser(this.user, imageSetting);

    this.numberOfRenderedItems++;
    imageNode.appendChild(image.node);

    this.renderExtendedInfo(activity, activityContainer);
  };

  /**
   * Inserts activity node in the right place
   * @param {object} node HTML node to insert.
   */
  ActivityController.prototype.insertActivityNode = function(node) {
    var items = this.itemsNode.querySelectorAll('.item'),
        i = 0, l = items.length,
        indexToInsert = 0,
        itemData;

    for (; i < l; i++) {
      itemData = items[i].dataset;
      if (itemData.timestamp > node.dataset.timestamp) {
        indexToInsert++;
      }

      if (itemData.timestamp == node.dataset.timestamp) {
        // activity has already been rendered, replace
        this.itemsNode.replaceChild(node, items[indexToInsert]);
        return;
      }
    }
    this.itemsNode.insertBefore(node, items[indexToInsert]);
  };

  /**
   * Gets right message for activity
   * @param {models.Activity} activity Activity.
   */
  ActivityController.prototype.activityText = function(activity) {
    var type = ActivityParser.getType(activity);
    var message;
    var userName = '<strong>' + utils.userFirstName(this.user) + '</strong>';
    var artistLink;

    var itemLink = '';
    if (activity.item) {
      itemLink = utils.createLinkHelper(activity.item.uri, activity.item.name);
    }

    var contextLink = '';
    if (activity.context && activity.context.name) {
      contextLink = utils.createLinkHelper(activity.context.uri, activity.context.name);
    }

    switch (type) {
      case 'PLAYLIST_PUBLISHED':
        message = _('publishedThePlaylist', userName);
        break;
      case 'PLAYLIST_SUBSCRIBED':
        message = _('nowFollowsThePlaylist', userName);
        break;
      case 'MY_PLAYLIST_SUBSCRIBED':
        message = _('nowFollowsYourPlaylist', userName);
        break;
      case 'PLAYLIST_TRACK_STARRED':
        artistLink = utils.createLinkHelper(activity.context.artists[0].uri, activity.context.artists[0].name);
        message = _('starredATrackBy', userName, contextLink, artistLink);
        break;
      case 'PLAYLIST_TRACK_ADDED':
        message = _('addedTrackToPlaylist', userName, contextLink, itemLink);
        break;
      case 'APP_ADDED':
        message = _('addedTheApp', userName, + itemLink);
        break;
      case 'TRACK_SHARED':
        message = _('sharedATrackBy', userName);
        break;
      case 'PLAYLIST_SHARED':
        message = _('sharedAPlaylist', userName);
        break;
      case 'ALBUM_SHARED':
        message = _('sharedAnAlbumBy', userName);
        break;
      case 'ARTIST_SHARED':
        message = _('sharedAnArtist', userName);
        break;
      case 'ARTIST_FOLLOWED':
        message = _('follows', userName, itemLink);
        break;
      case 'TRACK_STARTED_PLAYING':
      case 'UNKNOWN':
        break;
      default:
        message = type;
        break;
    }
    return message;
  };

  ActivityController.prototype.renderExtendedInfo = function(activity, activityNode) {
    var type = ActivityParser.getType(activity);
    var image, name, artist, message;
    var container = document.createElement('div');
    css.addClass(container, 'additional-info');

    var imgSettings = {
      animate: true,
      height: 100,
      link: activity.item.uri,
      player: true,
      width: 100
    };

    switch (type) {
      case 'PLAYLIST_PUBLISHED':
      case 'PLAYLIST_SUBSCRIBED':
      case 'MY_PLAYLIST_SUBSCRIBED':
      case 'PLAYLIST_SHARED':
        name = activity.item.name;
        if (utils.linkTypeHelper.isStarredPlaylist(activity.item.uri)) {
          name = _p('starredTracks');
        }
        if (utils.linkTypeHelper.isToplist(activity.item.uri)) {
          name = _p('topTracks');
        }

        message = utils.createLinkHelper(activity.item.uri, name);
        container.innerHTML = message;

        image = Image.forPlaylist(activity.item, imgSettings);
        container.appendChild(image.node);
        activityNode.appendChild(container);
        break;

      case 'TRACK_SHARED':
        name = utils.createLinkHelper(activity.item.uri, activity.item.name);
        artist = utils.createLinkHelper(activity.item.artists[0].uri, activity.item.artists[0].name);
        message = _('by', name, artist);

        container.innerHTML = message;

        image = Image.forTrack(activity.item, imgSettings);
        container.appendChild(image.node);
        activityNode.appendChild(container);
        break;

      case 'ALBUM_SHARED':
        name = utils.createLinkHelper(activity.item.uri, activity.item.name);
        artist = utils.createLinkHelper(activity.item.artists[0].uri, activity.item.artists[0].name);
        message = _('by', name, artist);

        container.innerHTML = message;

        image = Image.forAlbum(activity.item, imgSettings);
        container.appendChild(image.node);
        activityNode.appendChild(container);
        break;

      case 'ARTIST_SHARED':
        name = utils.createLinkHelper(activity.item.uri, activity.item.name);
        container.innerHTML = name;

        image = Image.forArtist(activity.item, imgSettings);
        container.appendChild(image.node);
        activityNode.appendChild(container);
        break;

      default:
        break;
    }
  };

  /**
   * Activity parser which returns type of the activity according to its
   * activityType and data it contains
   */
  var ActivityParser = function() {
    return {
      getType: function(activity) {
        switch (activity.activityType) {
          case 'playlist-published':
            var owner = decodeURIComponent(activity.item.uri.split(':')[2]);
            if (_user && _user.username === owner) {
              return 'PLAYLIST_PUBLISHED';
            } else if (_currentUser && _currentUser.username === owner) {
              return 'MY_PLAYLIST_SUBSCRIBED';
            }
            return 'PLAYLIST_SUBSCRIBED';
          case 'playlist-track-added':
            if (utils.linkTypeHelper.isStarredPlaylist(activity.item.uri)) {
              return 'PLAYLIST_TRACK_STARRED';
            }
            return 'PLAYLIST_TRACK_ADDED';
          case 'track-finished-playing':
            var RADIO = ':app:radio';
            var APP = 'spotify:app';

            var referrerUri = activity.referrer && activity.referrer.uri || '';
            if (referrerUri && referrerUri.indexOf(RADIO, referrerUri.length - RADIO.length) !== -1) {
              return 'RADIO_TRACK_FINISHED_PLAYING';
            } else if (referrerUri && referrerUri.indexOf(APP, activity.referrer.length - APP.length) !== -1) {
              return 'APP_TRACK_FINISHED_PLAYING';
            }
            // TODO: referrer.name and referrer.image may be set in the future
            return 'TRACK_FINISHED_PLAYING';
          case 'app-added':
            return 'APP_ADDED';
          case 'track-started-playing':
            // we don't want to display that
            return 'UNKNOWN';
          case 'uri-shared':
            if (utils.linkTypeHelper.isTrack(activity.item.uri)) {
              return 'TRACK_SHARED';
            } else if (utils.linkTypeHelper.isPlaylist(activity.item.uri)) {
              return 'PLAYLIST_SHARED';
            } else if (utils.linkTypeHelper.isAlbum(activity.item.uri)) {
              return 'ALBUM_SHARED';
            } else if (utils.linkTypeHelper.isArtist(activity.item.uri)) {
              return 'ARTIST_SHARED';
            }
            return 'UNKNOWN';
          case 'artist-followed':
            return 'ARTIST_FOLLOWED';
          default:
            return 'UNKNOWN';
        }
      }
    };
  }();

  exports.Activity = ActivityController;
});
