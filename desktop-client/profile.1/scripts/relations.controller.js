require([
  'scripts/profile-utils',
  'scripts/controller#Controller',
  'scripts/logger#Logger',
  '$api/i18n',
  '$api/models',
  '$api/relations#Relations',
  '$api/library#Library',
  '$views/image#Image',
  '$views/buttons#SubscribeButton',
  '$views/utils/css',
  '$views/throbber#Throbber',
  '$social-artist-shared/artist.relations#ArtistGraph',
  'scripts/relations-helper#RelationsHelper',
  'scripts/relations-helper#RelationEvent',
  'scripts/relations-helper#RelationCollection',
  'strings/relations.lang'
], function(utils, Controller, Logger, i18n, models, Relations, Library, Image, SubscribeButton, css,
            Throbber, ArtistGraph, RelationsHelper, RelationEvent, RelationCollection, relationsStrings) {

  'use strict';

  var BATCH_SIZE = 5;
  var RETRY_ATTEMPT_LIMIT = 3;

  // height(in px) of relation item
  var RELATION_ITEM_HEIGHT = 70;
  var INIT_RELATION_ITEM_COUNT = 20;

  // Set up a shorthand for getting a translated string.
  var _ = SP.bind(relationsStrings.get, relationsStrings);

  /**
   * Class names for elements used by this controller.
   * @type {Object}
   * @private
   */
  var _elems = {
    followersContainer: '.app-followers',
    followingContainer: '.app-following',
    avatar: '.image-container',
    followers: '#followers-container',
    following: '#following-container',
    followButton: '.follow-button-container'
  };

  /**
   * Constructor for the controller
   * @constructor
   * @extends {Controller}
   */
  var RelationsController = function() {
    this.scrollHandler = this.scrollHandler.bind(this);
    this.init();
  };

  SP.inherit(RelationsController, Controller);

  /**
   * Initializes the controller
   * @param {models.User} user A Spotify user object.
   * @param {boolean} isSelf Whether this is the current users profile.
   * @param {Object} templates A Slab template object.
   * @param {RelationCollection} collection A type of collection from the Relations Helper.
   */
  RelationsController.prototype.initialize = function(user, isSelf, templates,
      collection) {
    if (collection !== RelationCollection.FOLLOWERS && collection !== RelationCollection.FOLLOWING) {
      return;
    }
    /**
     * @type {Array.<models.Profile>|Array.<models.User>}
     * List of relations. If this is the Following list, it will be all
     * Profile objects, else if the Follower list, it will be all User
     * objects.
     */
    this.relations = [];
    this.collection = collection;
    this.renderedRelations = [];
    this.retries = {};
    this.collectionEvents = {};
    this.user = user;
    this.isSelf = isSelf;
    this.templates = templates;
    this.allUsersLoaded = false;
    this.initFlag = true;
    this.refreshFlag = false;
    this.throbber = null;
    this.throbberDiv = null;
    this.batchIndex = 0;
    if (!RelationsHelper.initialized) {
      RelationsHelper.initialize(this.user, this.isSelf);
    }
    this.setControllerIdentity(collection);
  };

  /**
   * Sets the events to listen to from the RelationsHelper.
   * @param {RelationCollection} collection A type of collection from the Relations Helper.
   */
  RelationsController.prototype.setControllerIdentity = function(collection) {
    if (collection === RelationCollection.FOLLOWERS) {
      this.type = 'followers';
      this.collectionEvents = {
        loaded: RelationEvent.FOLLOWERS_LOADED,
        add: RelationEvent.FOLLOWERS_ADD,
        remove: RelationEvent.FOLLOWERS_REMOVE
      };
    } else if (collection === RelationCollection.FOLLOWING) {
      this.type = 'following';
      this.collectionEvents = {
        loaded: RelationEvent.FOLLOWING_LOADED,
        add: RelationEvent.FOLLOWING_ADD,
        remove: RelationEvent.FOLLOWING_REMOVE
      };
    }
    this.container = document.querySelector(_elems[this.type + 'Container']);
    this.setName(this.type);
  };

  /**
   * @override
   * @see Controller#show
   */
  RelationsController.prototype.show = function() {
    var _this = this;

    this.log('refreshing... init|refresh', this.initFlag, this.refreshFlag);
    if (this.initFlag || this.refreshFlag) {
      this.allUsersLoaded = false;
      this.batchIndex = 0;
      this.renderedRelations = [];
      this.relations = [];
      this.retries = {};
      this.throbber = null;
      this.throbberDiv = null;
      this.removeNoRelationsMessage();
      this.destroy();
      this.render();

      if (this.initFlag) {
        // rangeEnd which decides how many relation items
        // should be loaded in the first page load.
        // The formula is to guess how many items can be
        // fit into current window.
        //
        // Once relation items are loaded which extends over
        // bottom of window. Therefore, scroll bar is visible
        // and more items can be loaded via scrollHandler.
        //
        // Also, in some cases height of window is empty,
        // so INIT_RELATION_ITEM_COUNT comes to make sure
        // scroll bar is always visible so scrollHandler
        // can be triggered to load more relation items.
        //
        // TODO(huge): remove magic numbers and deps
        this.rangeEnd = parseInt(window.innerHeight / RELATION_ITEM_HEIGHT, 10) + INIT_RELATION_ITEM_COUNT;
        this.initFlag = false;
      }

      this.events.
          listen(RelationsHelper, this.collectionEvents.loaded, this.relationsLoadComplete).
          listen(RelationsHelper, this.collectionEvents.add, this.relationAdded).
          listen(RelationsHelper, this.collectionEvents.remove, this.relationRemoved);
      if (!this.isSelf && this.collection === RelationCollection.FOLLOWERS) {
        this.events.listen(RelationsHelper, RelationEvent.FOLLOWERS_CHANGE,
            this.subscriberChanged);
      }

      this.relationContainer = document.querySelector(_elems[this.type]);

      SP.analyticsContext('RELATIONS: load ' + this.type, function() {
        if (_this.collection === RelationCollection.FOLLOWERS) {
          RelationsHelper.requestRelevantFollowers();
        } else if (_this.collection === RelationCollection.FOLLOWING) {
          RelationsHelper.requestRelevantFollowing();
        }
      });

      this.refreshFlag = false;
    }

    RelationsController._superClass.show.call(this);
  };

  /**
   * Renders the view for this controller
   */
  RelationsController.prototype.render = function() {
    this.log('render: call to render ' + this.type, this.templates);
    this.container.innerHTML = this.templates[this.type].call(this);
    this.showLoader();
  };

  /**
   * Indicates that the requested collection of relations has loaded.
   * @param {Event} e Event from the RelationsHelper containing data.
   */
  RelationsController.prototype.relationsLoadComplete = function(e) {
    this.log('finished loading ' + this.type, e, this.relations);
    this.relations = e.data.loaded;
    if (this.relations.length === 0) {
      this.renderNoRelationsMessage();
      this.hideLoader();
    } else {
      this.createRelations(this.rangeEnd);
    }
  };

  /**
   * Loads a specified number of additional relations.
   * @param {number} batch How many additional relations to load from the relations
   *    collection.
   */
  RelationsController.prototype.createRelations = function(batch) {
    var i = this.batchIndex,
        l = this.relations.length,
        b = batch || BATCH_SIZE,
        max = Math.min(i + b, l);

    this.log('rendering from ' + i + ' to ' + (i + b), l);
    for (; i < max; i++) {
      this.renderRelation(models.Profile.fromURI(this.relations[i].uri));
    }
    this.batchIndex = max;
  };

  /**
   * Handler for when a relation is removed from the collection. Sets a flag that
   *    tells the view to reload upon revisiting.
   * @param {Event} e Event from the RelationsHelper that holds information about
   *    what was changed.
   */
  RelationsController.prototype.relationRemoved = function(e) {
    this.log('collection remove ' + this.type, e);
    this.refreshFlag = true;
  };

  /**
   * Handler for when a relation is added to the collection. Sets a flag that
   *    tells the view to reload upon revisiting.
   * @param {Event} e Event from the RelationsHelper that holds information about
   *    what was changed.
   */
  RelationsController.prototype.relationAdded = function(e) {
    this.log('collection add ' + this.type, e);
    this.refreshFlag = true;
    if (e.data && e.data.uri) {
      this.appendRelation(e.data.uri);
    }
  };

  /**
   * This is a corner case where you are on someone else's profile and you
   * follow/unfollow them
   * @param {Event} e A change event.
   */
  RelationsController.prototype.subscriberChanged = function(e) {
    var self = models.session.user.username || null;
    if (self) {
      if (e.data && e.data.oldValue) {
        this.removeRelation('spotify:user:' + self);
      } else if (e.data && !e.data.oldValue) {
        this.appendRelation('spotify:user:' + self);
      }
    }
  };

  /**
   * Removes the specified relation from the view.
   * @param {string} uri A Spotify uri.
   */
  RelationsController.prototype.removeRelation = function(uri) {
    var element = this.container.querySelector('[data-' + this.type +
        '-uri="' + uri + '"]');
    if (uri && element) {
      var index = this.renderedRelations.indexOf(uri);
      this.renderedRelations.splice(index, 1);
      this.refreshFlag = true;
      this.relationContainer.removeChild(element);

      if (this.renderedRelations.length === 0) {
        this.renderNoRelationsMessage();
      }
    }
  };

  /**
   * Adds the specified relation from the view.
   * @param {string} uri A Spotify uri.
   */
  RelationsController.prototype.appendRelation = function(uri) {
    var element = this.container.querySelector('[data-' + this.type +
        '-uri="' + uri + '"]');
    if (uri && !element && utils.linkTypeHelper.isUser(uri)) {
      this.refreshFlag = true;
      var usr = models.User.fromURI(uri);
      this.relations.push(usr);
      this.renderRelation(models.Profile.fromURI(uri));

      this.removeNoRelationsMessage();
    }
  };
  /**
   * Hides loader bar on bottom of page.
   */
  RelationsController.prototype.hideLoader = function() {
    if (this.throbber && this.throbber.isActive) {
      this.throbber.hide();
    }
  };

  /**
   * Shows loader bar on bottom of page.
   */
  RelationsController.prototype.showLoader = function() {
    if (!this.throbber) {
      this.throbberDiv = document.createElement('div');
      this.container.appendChild(this.throbberDiv);
      this.throbber = Throbber.forElement(this.throbberDiv);
      this.throbber.setPosition(0, 0);
    } else if (this.throbber && !this.throbber.isActive) {
      this.throbber.show();
    }
  };

  /**
   * Display no relation message when there is no following
   */
  RelationsController.prototype.renderNoRelationsMessage = function() {
    if (this.container.querySelectorAll('.empty-message').length > 0) {
      return;
    }

    var message;
    if (this.isSelf) {
      if (this.collection === RelationCollection.FOLLOWING) {
        message = _('currentUsernoFollowingMessage');
      } else if (this.collection === RelationCollection.FOLLOWERS) {
        message = _('currentUsernoFollowersMessage');
      }
    } else {
      var userName = utils.userFirstName(this.user);
      if (this.collection === RelationCollection.FOLLOWING) {
        message = _('noFollowingMessage', userName);
      } else if (this.collection === RelationCollection.FOLLOWERS) {
        message = _('noFollowersMessage', userName);
      }
    }

    var content = document.createElement('div');
    css.addClass(content, 'apply-width');
    content.innerHTML = this.templates.empty_message({
      message: message
    });
    document.querySelector(_elems[this.type]).
        appendChild(content);
  };

  /**
   * Removes no relations message
   */
  RelationsController.prototype.removeNoRelationsMessage = function() {
    var msg = this.container.querySelector('.empty-message');
    if (msg) {
      msg.parentNode.removeChild(msg);
      this.hideLoader();
    }
  };

  /**
   * Scroll handler.
   */
  RelationsController.prototype.scrollHandler = function(st) {
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
    }
    if (st >= this.lastScrollY && this.allUsersLoaded === false) {
      this.scrollTimer = setTimeout(this.createRelations.bind(this), 50);
    }
    this.lastScrollY = st;
  };

  /**
   * Generic method for binding a click event to an element and have that element
   *    open a URI.
   * @param {Element} elem This should be a HTML A element.
   * @param {string} uri A Spotify uri.
   */
  RelationsController.prototype.makeLink = function(elem, uri) {
    elem.href = uri;

    this.events.listen(elem, 'click', function(e) {
      models.application.openURI(uri);
      e.preventDefault();
      e.stopPropagation();
    });
  };

  /**
   * Starts the rendering of a relation to the view.
   * @param {models.Profile} relation A Spotify Profile object.
   */
  RelationsController.prototype.renderRelation = function(relation) {
    relation.load('user', 'artist', 'name', 'image').
        done(this, this.addRelation).
        fail(this, this.relationLoadFail);
  };

  /**
   * Adds the relation to the DOM.
   * @param {models.Profile} relation A Spotify Profile object.
   */
  RelationsController.prototype.addRelation = function(relation) {
    // Check if this user has been rendered
    if (this.renderedRelations.indexOf(relation.uri) > -1) {
      this.log('relation already rendered', relation);
      return;
    }

    var userDiv = document.createElement('div');
    css.addClass(userDiv, 'relation-wrapper');
    userDiv.setAttribute('data-' + this.type + '-uri', relation.uri);
    userDiv.innerHTML = this.templates.subscribee();

    /**
     * Heading
     */
    var heading = document.createElement('a');
    css.addClass(heading, 'friend-name');
    heading.innerText = relation.name;
    this.makeLink(heading, relation.uri);
    userDiv.querySelector('.friend-info').appendChild(heading);

    /**
     * Image
     */
    var settings = {
      animate: false,
      height: 50,
      style: 'inset',
      width: 50,
      link: relation.uri
    };
    var image = Image.forProfile(relation, settings);

    userDiv.querySelector(_elems.avatar).appendChild(image.node);
    this.relationContainer.appendChild(userDiv);

    /**
     * Follow button
     */
    var buttonFollow;

    var user = relation.user;

    if (user) {
      user.load('currentUser').done(this, function() {
        this._renderFollowButtonIfNecessary(userDiv, relation);
      });
    } else {
      this._renderFollowButtonIfNecessary(userDiv, relation);
    }

    if (relation.artist) {
      var badge = document.createElement('span');
      css.addClass(badge, 'follower-badge');
      if (relation.user) {
        css.addClass(badge, 'verified-artist');
      }
      badge.innerText = _('artist').toUpperCase();
      userDiv.querySelector('.friend-info').appendChild(badge);
      this.loadArtistFollowers(relation.artist);
    } else {
      this.loadUserFollowers(relation);
      this.loadRelationPlaylist(user);
    }

    this.renderedRelations.push(relation.uri);
    if (this.renderedRelations.length === this.relations.length) {
      this.log('addUser: wont load more relations',
          this.renderedRelations.length);
      this.allUsersLoaded = true;
      this.hideLoader();
    }
  };

  /**
   * @param {Element} parentNode Parent element to render the follow button into.
   * @param {models.Profile} relation A Spotify Profile object.
   */
  RelationsController.prototype._renderFollowButtonIfNecessary = function(parentNode, relation) {
    // Render the follow button if it's anybody (artist or user) except the logged-in user.
    if (!(relation.user && relation.user.currentUser)) {
      var buttonFollow = SubscribeButton.forProfile(relation.user || relation.artist);
      this.events.listen(buttonFollow, 'subscribe', function() {
        this.logSubscriptions('subscribeTo', relation);
        this.updateFollowerCount(true, relation.uri);
        this.log('subscribing', RelationsHelper);
      });
      this.events.listen(buttonFollow, 'unsubscribe', function() {
        this.logSubscriptions('unsubscribeFrom', relation);
        this.updateFollowerCount(false, relation.uri);
        this.log('unsubscribing', RelationsHelper);
      });
      parentNode.querySelector(_elems.followButton).appendChild(buttonFollow.node);
    }
  };

  /**
   * Loads the followers of a certain user.
   * @param {models.Profile} profile A Spotify profile object, which should
   *     have a user.
   */
  RelationsController.prototype.loadUserFollowers = function(profile) {
    Relations.forUser(profile.user).load('subscribers').
        done(this, function(relations) {
          this.resolveRelationFollowers(profile, relations);
        }).
        fail(this, function(s, error) {
          this.relationFollowersFailed(profile, error);
        });
  };

  /**
   * Loads a users number of followers.
   * @param {models.Profile} profile A Spotify profile object, which should
   *     have a user.
   * @param {models.Relations} relations A relations collection.
   */
  RelationsController.prototype.resolveRelationFollowers = function(profile, relations) {
    relations.subscribers.snapshot(0, 0).
        done(this, function(s) {
          this.appendRelationFollowers(profile, s.length);
        }).
        fail(this, function(s, error) {
          this.relationFollowersFailed(profile, error);
        });
  };

  /**
   * Updates a relations following number on user action.
   * @param {models.Profile} profile A Spotify Profile object.
   * @param {number} count The number to increase the count by.
   */
  RelationsController.prototype.appendRelationFollowers = function(profile, count) {
    var uri = profile.user ? profile.user.uri : profile.artist.uri,
        userDiv = document.querySelector('[data-' + this.type + '-uri="' + uri + '"]'),
        sublink = document.createElement('a');

    userDiv.setAttribute('data-' + this.type + '-count', count);
    sublink.innerText = count === 1 ? _('followerCountSingle', count) :
        _('followerCountPlural', i18n.number(count));
    if (profile.user) {
      // Only users have a following subpage right now.
      this.makeLink(sublink, uri + ':followers');
    }
    userDiv.querySelector('.friend-num').appendChild(sublink);
  };

  /**
   * Loads the followers of a certain artist.
   * @param {models.Artist} artist A Spotify artist object.
   */
  RelationsController.prototype.loadArtistFollowers = function(artist) {
    ArtistGraph.forArtist(artist.uri).load('subscriber_count').
        done(this, this.graphLoaded.bind(this, artist)).
        fail(this, this.graphLoadFail);
  };

  /**
   * Processes the social data for an artist
   * @param {models.Artist} artist A Spotify Artist object.
   * @param {ArtistGraph} graph Social data for an artist.
   * @private
   */
  RelationsController.prototype.graphLoaded = function(artist, graph) {
    models.Profile.fromURI(artist.uri).load('user').done(
        this, function(profile) {
          this.appendRelationFollowers(profile, graph.subscriber_count);
        });
  };

  /**
   * @type {Function}
   * @param {Error} er The caught error.
   */
  RelationsController.prototype.graphLoadFail = function(er) {
    console.error('(RelationsController) graphLoadFail:', er);
  };

  /**
   * Loads the playlists for the user.
   * @param {models.User} user A Spotify user object.
   */
  RelationsController.prototype.loadRelationPlaylist = function(user) {
    Library.forUser(user).published.snapshot(0, 0).
        done(this, function(s) {
          this.appendRelationPlaylists(user, s.length);
        }).
        fail(this, function(s, error) {
          this.relationPlaylistsFailed(user, error);
        });
  };

  /**
   * Adds the number of playlists the user has.
   * @param {models.User} user A Spotify user object.
   * @param {number} count The number of playlists or the user.
   */
  RelationsController.prototype.appendRelationPlaylists = function(user, count) {
    var userDiv = document.querySelector('[data-' + this.type + '-uri="' +
        user.uri + '"]'), plistlink = document.createElement('a');

    plistlink.innerText = count === 1 ? _('playlistCountSingle', count) :
        _('playlistCountPlural', i18n.number(count));
    this.makeLink(plistlink, user.uri);
    userDiv.querySelector('.playlist-num').appendChild(plistlink);
  };

  /**
   * Handler for when a load fails. Retries RETRY_ATTEMPT_LIMIT times before logging
   *    the error to console.
   * @param {models.Profile} relation A Spotify Profile object.
   * @param {Error} error An error object.
   */
  RelationsController.prototype.relationLoadFail = function(relation, error) {
    this.log('failed to load', relation, error);
    var retryCount = this.retries['relationLoadFail'];

    if (!retryCount || retryCount < RETRY_ATTEMPT_LIMIT) {
      this.retries['relationLoadFail'] = !retryCount ? 1 : retryCount + 1;
      this.renderRelation(relation);
    } else {
      console.log('(RelationsController) relationLoadFail failed', relation, error);
      var index = this.relations.indexOf(relation);
      this.relations.splice(index, 1);
    }
  };

  /**
   * Handler for when a users followers fail to load. Retries RETRY_ATTEMPT_LIMIT
   *    times before logging the error to console.
   * @param {models.Profile} profile A Spotify profile object, which should
   *     have a user.
   * @param {Error} error An error object.
   */
  RelationsController.prototype.relationFollowersFailed = function(profile, error) {
    this.log('relation followers failed to load', profile, error);
    var retryCount = this.retries['relationFollowersFailed'];

    if (!retryCount || retryCount < RETRY_ATTEMPT_LIMIT) {
      this.retries['relationFollowersFailed'] = !retryCount ? 1 : retryCount + 1;
      this.loadUserFollowers(profile);
    } else {
      console.log('(RelationsController) relationFollowersFailed failed', error);
    }
  };

  /**
   * Handler for when a users playlist fail to load. Retries RETRY_ATTEMPT_LIMIT
   *    times before logging the error to console.
   * @param {models.User} user A Spotify user object.
   * @param {Error} error An error object.
   */
  RelationsController.prototype.relationPlaylistsFailed = function(user, error) {
    this.log('playlists failed to load', user, error);
    var retryCount = this.retries['relationPlaylistsFailed'];

    if (!retryCount || retryCount < RETRY_ATTEMPT_LIMIT) {
      this.retries['relationPlaylistsFailed'] = !retryCount ? 1 : retryCount + 1;
      this.loadRelationPlaylist(user);
    } else {
      console.log('(RelationsController) relationPlaylistsFailed failed', error);
    }
  };

  /**
   * Increments or decreases the following count of a user
   * @param {boolean} add If this is true we add value or 1, otherwise decrease by 1.
   * @param {string} uri The user uri.
   * @param {?Number} value How much to add/subtract from the follower count.
   */
  RelationsController.prototype.updateFollowerCount = function(add, uri, value) {
    this.log('updateFollowingCount', add, uri, value);

    var amt = value ? value : 1;
    var element = this.container.querySelector('[data-' + this.type +
        '-uri="' + uri + '"]');
    if (element) {
      var current = parseInt(element.getAttribute('data-' + this.type + '-count'), 10);

      if (add) {
        current += amt;
      } else {
        current -= amt;
        current = current < 0 ? 0 : current;
      }

      element.setAttribute('data-' + this.type + '-count', current);
      element.querySelector('.friend-num').innerText = current !== 1 ? _('followerCountPlural',
          i18n.number(current)) : _('followerCountSingle', current);
    }
  };

  /*
   * Logs changes to subscriptions
   * @param {string} type Type of change.
   * @param {models.Profile} relation A Spotify Profile object.
   */
  RelationsController.prototype.logSubscriptions = function(type, relation) {
    var message = type;

    if (relation.user && relation.artist) {
      message += 'MergedProfile';
    } else if (relation.user) {
      message += 'User';
    } else if (relation.artist) {
      message += 'Artist';
    }

    if (this.collection === RelationCollection.FOLLOWERS) {
      message += 'FromFollowers';
    } else if (this.collection === RelationCollection.FOLLOWING) {
      message += 'FromFollowing';
    }

    Logger.log({ type: message, uri: relation.uri });
  };

  exports.Relations = RelationsController;
});
