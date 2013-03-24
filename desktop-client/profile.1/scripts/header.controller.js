require([
  'scripts/profile-utils',
  'scripts/relations-helper#RelationsHelper',
  'scripts/relations-helper#RelationCollection',
  'scripts/relations-helper#RelationEvent',
  'scripts/controller#Controller',
  'scripts/logger#Logger',
  '$api/hermes',
  '$api/i18n',
  '$api/models',
  '$api/toplists#Toplist',
  '$views/image#Image',
  '$views/buttons',
  '$views/popup#Popup',
  '$views/utils/dom',
  '$views/utils/css',
  'strings/main.lang'
], function(utils, RelationsHelper, RelationCollection, RelationEvent, Controller, Logger, hermes, i18n, modelsApi, Toplist,
        Image, buttonsView, Popup, dom, css, mainStrings) {

  'use strict';

  /**
   * Class names for elements used by this controller
   * @type {Object}
   * @private
   */
  var _elems = {
    container: '.app-header',
    imageContainer: '.header-image-container',
    mainContent: '.header-content',
    buttonsContainer: '.buttons-container',
    relationsInfoContainer: '.relations-info',
    listeningToContent: '.listening-to-content',
    relationsPopover: '#relations-popover',
    avatarContainer: '#following-avatars',
    followersAmountContainer: '#followers-amount',
    followingAmountContainer: '#following-amount'
  };

  var OFFSET_TOP_ARTISTS = 6;

  // Set up a shorthand for getting a translated string.
  var _ = SP.bind(mainStrings.get, mainStrings);

  /**
   * Constructor for the controller
   * @constructor
   */
  var HeaderController = function() {
    this.init();
  };

  /**
   * Inherit the Controller interface
   */
  SP.inherit(HeaderController, Controller);

  /**
   * Initialises the controller
   * @param {models.User} user A Spotify user object.
   * @param {Object} templates A Slab template object.
   */
  HeaderController.prototype.initialize = function(isSelf, user, templates, buttonHandlers, context) {
    this.setName('Header');

    this.setTemplates(templates);
    this.container = document.querySelector(_elems.container);

    if (user) {
      this.isSelf = isSelf;
      this.user = user;
      this.toplists = Toplist.forUser(this.user);

      this.context = context;
      this.buttonHandlers = buttonHandlers || {};

      this.render();
    } else {
      this.renderUnknownUser();
    }
  };

  /**
   * Renders the view for this controller
   */
  HeaderController.prototype.render = function() {
    var headerContainer = document.querySelector(_elems.container);

    headerContainer.innerHTML = this.templates.header({
      profile: {
        classname: this.user.artist ? 'verified-badge' : '',
        name: decodeURIComponent(this.user.name),
        uri: this.user.uri
      }
    });

    this.renderImage();
    this.getTopArtists();
    this.renderButtons();
    if (this.user.artist) {
      this.renderArtistInfo();
    } else {
      this.renderRelationType();
    }
    this.requestRelationsData();
  };

  /**
   * Renders the view for this controller for Unknown user
   */
  HeaderController.prototype.renderUnknownUser = function() {
    var headerContainer = document.querySelector(_elems.container);

    headerContainer.innerHTML = this.templates.header({
      profile: {
        classname: '',
        name: _('unknownUser'),
        uri: ''
      }
    });

    this.renderImage();
  };

  /**
   * Setter for the template property
   * @param {Object} templates A Slab template object.
   */
  HeaderController.prototype.setTemplates = function(templates) {
    this.templates = templates;
  };

  /**
   * Gets relation type for the user
   */
  HeaderController.prototype.renderRelationType = function() {
    if (!this.isSelf) {
      var infoNode = this.container.querySelector('.info');
      var schema = hermes.Schema.fromURL('proto/socialgraph.proto');
      var req = hermes.Hermes.get(
          'hm://socialgraph/subscribers/exists',
          [schema.type('StringListReply')], [schema.type('StringListRequest')]);

      req.send({args: [this.user.username]}).
          done(function(data) {
            if (data[0].reply[0] === 'True') {
              infoNode.innerHTML = _('followsYou');
            }
          }).
          fail(function(data) {
            console.error('(HeaderController.renderRelationType) relation lookup fail', data);
          });
    }
  };

  /**
   * Renders the merged artist discography link.
   */
  HeaderController.prototype.renderArtistInfo = function() {
    var infoNode = this.container.querySelector('.info');
    var uri = this.user.artist.uri;
    var viewButton = buttonsView.CustomButton.withClass('view-link', _('viewDiscography'));

    this.events.listen(viewButton, 'click', function() {
      modelsApi.application.openURI(uri);
    });

    infoNode.appendChild(viewButton.node);
  };

  /**
   * Gets top artists for user
   */
  HeaderController.prototype.getTopArtists = function() {
    this.toplists.load('artists').done(this.loadArtistsSnapshot.bind(this));
  };

  /**
   * Loads a snapshot to find the top artists for this user.
   */
  HeaderController.prototype.loadArtistsSnapshot = function() {
    this.toplists.artists.snapshot(0, OFFSET_TOP_ARTISTS).done(this.resolveArtistSnapshot.bind(this));
  };

  /**
   * Loads artists into an array that can be passed to the function to render text
   * @param {models.Snapshot} snapshot A snapshot of artists.
   */
  HeaderController.prototype.resolveArtistSnapshot = function(snapshot) {
    if (snapshot.range.length) {
      var promises = [];

      for (var i = 0; i < snapshot.range.length; i++) {
        promises.push(snapshot.get(i).load('name'));
      }

      modelsApi.Promise.join(promises).always(this.renderTopArtistsText);
    }
  };

  /**
   * Renders the user's avatar
   */
  HeaderController.prototype.renderImage = function() {
    var imageContainer = document.querySelector(_elems.imageContainer);

    var imageSetting = {
      animate: true,
      height: 128,
      placeholder: 'user',
      width: 128
    };
    var image = Image.forUser(this.user ? this.user : '', imageSetting);
    imageContainer.appendChild(image.node);
  };

  /**
   * Renders top artists in the header
   * @param {Array} artists Array of top artists for user.
   */
  HeaderController.prototype.renderTopArtistsText = function(artists) {
    var container = document.querySelector(_elems.listeningToContent);
    var text = _('listeningTo') + ' ';

    for (var i = 0; i < artists.length; i++) {
      if (artists[i].name === undefined) {
        continue;
      }

      var artistLink = utils.createLinkHelper(artists[i].uri, artists[i].name);

      if (i === artists.length - 1) {
        text += artistLink + '.';
      } else {
        text += artistLink + ', ';
      }
    }

    container.innerHTML = text;
  };

  /**
   * Renders the header buttons
   */
  HeaderController.prototype.renderButtons = function() {
    if (!this.isSelf) {
      var buttonsContainer = document.querySelector(_elems.buttonsContainer);

      var buttonFollow = buttonsView.SubscribeButton.forUser(this.user),
          buttonSendMusic = buttonsView.Button.withLabel(_('sendMusic'));

      buttonsContainer.appendChild(buttonFollow.node);
      buttonsContainer.appendChild(buttonSendMusic.node);

      this.events.
          listen(buttonFollow, 'subscribe', this.logSubscriptions.bind(this, 'subscribeTo')).
          listen(buttonFollow, 'unsubscribe', this.logSubscriptions.bind(this, 'unsubscribeFrom'));

      if (typeof this.buttonHandlers.share === 'function') {
        this.events.listen(buttonSendMusic, 'click', this.buttonHandlers.share.bind(this.context, buttonSendMusic));
      }
    }
  };

  /**
   * Handles mouseover on the facepile images.
   * @param {Event} e A mouseover event.
   */
  HeaderController.prototype.avatarOverHandler = function(e) {
    var userName = e.target.parentNode.getAttribute('data-tooltip');

    if (!this.popup) {
      this.popup = Popup.withText(userName);
    } else {
      this.popup.setText(userName);
    }

    this.popup.showFor(e.target);
  };

  /**
   * Handles mouseout on the facepile images.
   * @param {Event} e A mouseout event.
   */
  HeaderController.prototype.avatarOutHandler = function(e) {
    this.popup.hide();
  };

  /**
   * Send a request to the RelationsHelper to fetch subscription/subscribers data.
   */
  HeaderController.prototype.requestRelationsData = function() {
    this.log('requesting relations data');
    RelationsHelper.initialize(this.user, this.isSelf);
    this.events.listen(RelationsHelper, RelationEvent.ALL_LOADED,
        this.relationsLoadComplete);
    this.events.listen(RelationsHelper, RelationEvent.FOLLOWING_LIMITED_LOADED,
        this.facepileDataLoaded);
    RelationsHelper.requestRelations();
  };

  /**
   * Function that runs when the RelationsHelper has fully populated collections
   *    of subscribers and subscriptions.
   * @param {Event} e An event from the RelationsHelper containing data.
   */
  HeaderController.prototype.relationsLoadComplete = function(e) {
    this.log('relations has loaded', e, this.isSelf);
    this.events.unlisten(RelationsHelper, RelationEvent.ALL_LOADED,
        this.relationsLoadComplete);

    var followingInfo = document.querySelector(_elems.relationsInfoContainer),
        encodedUsername = encodeURIComponent(this.user.username).replace(/\!/g, '%21');

    followingInfo.innerHTML = this.templates.relationsInfo({
      followersHeading: _('followers'),
      followersAmount: i18n.number(e.data.numFollowers),
      followersAmountUnformatted: e.data.numFollowers,
      followingHeading: _('following'),
      followingAmount: i18n.number(e.data.numFollowing),
      followingAmountUnformatted: e.data.numFollowing,
      userUriFollowers: ('spotify:user:' + encodedUsername + ':followers').toSpotifyLink(),
      userUriFollowing: ('spotify:user:' + encodedUsername + ':following').toSpotifyLink()
    });

    if (this.isSelf) {
      this.events.
          listen(RelationsHelper, RelationEvent.FOLLOWERS_ADD,
              // event not implemented
              function(e) {
                this.updateNumber(1, 'followers');
              }).
          listen(RelationsHelper, RelationEvent.FOLLOWERS_REMOVE,
              // event not implemented
              function(e) {
                this.updateNumber(-1, 'followers');
              }).
          listen(RelationsHelper, RelationEvent.FOLLOWING_ADD,
              function(e) {
                this.updateNumber(1, 'following');
                this.renderFacepile();
              }).
          listen(RelationsHelper, RelationEvent.FOLLOWING_REMOVE,
              function(e) {
                this.updateNumber(-1, 'following');
                this.renderFacepile();
              });
    } else {
      this.events.listen(RelationsHelper, RelationEvent.FOLLOWERS_CHANGE,
          function(e) {
            var val = e.data.oldValue ? -1 : 1;
            this.updateNumber(val, 'followers');
          });
    }

    this.facepileData = {};
    this.renderFacepile();
  };

  /**
   * Generates the facepile images for the top 3 users returned in the subscriptions
   *    collection.
   */
  HeaderController.prototype.renderFacepile = function() {
    RelationsHelper.requestLimitedFollowing(3);
  };

  /**
   * Takes the loaded relations data and builds a new facepile.
   * @param {Event} evt An event from the Relation Helper containing loaded following data.
   */
  HeaderController.prototype.facepileDataLoaded = function(evt) {
    this.log('loaded facepile data', evt, this.facepileData);
    var i = 0, l = evt.data.loaded.length, item, image, imgSettings, oldUri,
        followingAvatars = document.querySelector(_elems.avatarContainer),
        subscriptions = evt.data.loaded,
        previousFacepileData = this.facepileData;
    this.facepileData = {};

    for (; i < l; i++) {
      item = subscriptions[i];

      if (!(item.uri in previousFacepileData)) {
        imgSettings = {
          animate: true,
          height: 36,
          width: 36,
          link: item.uri
        };

        image = Image.forProfile(item, imgSettings);

        this.facepileData[item.uri] = {item: item, image: image};
        this.events.
            listen(image.node, 'mouseover', this.avatarOverHandler).
            listen(image.node, 'mouseout', this.avatarOutHandler);

        followingAvatars.appendChild(image.node);
      } else {
        // Re-use old image, don't touch DOM
        this.facepileData[item.uri] = previousFacepileData[item.uri];
        delete previousFacepileData[item.uri];
      }
    }
    for (oldUri in previousFacepileData) {
      var node = previousFacepileData[oldUri].image.node;
      followingAvatars.removeChild(node);
      this.events.unlisten(node, 'mouseover');
      this.events.unlisten(node, 'mouseout');
    }
  };

  /**
   * Updates the number of followers/followings in the header.
   * @param {number} amt Number to increment by.
   * @param {string} type Whether it's followers or followings that are being affected.
   */
  HeaderController.prototype.updateNumber = function(amt, type) {
    this.log('updating number', amt, type);
    var container = document.querySelector(_elems[type + 'AmountContainer']);
    if (container) {
      var val = parseInt(container.getAttribute('data-' + type + '-amount'));
      var newVal = Math.max(0, val + amt);
      container.innerHTML = i18n.number(newVal);
      container.setAttribute('data-' + type + '-amount', newVal);
    }
  };

  /*
   * Logs changes to subscriptions
   * @param {string} type Type of change.
   */
  HeaderController.prototype.logSubscriptions = function(type) {
    var message = type;
    message += this.user.artist ? 'MergedProfile' : 'User';
    message += 'FromHeader';

    Logger.log({ type: message, uri: this.user.uri });
  };

  exports.Header = HeaderController;
});
