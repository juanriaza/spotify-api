require([
  '$api/models',
  '$views/buttons#StartRadioButton',
  '$views/buttons#ShareButton',
  '$views/buttons#CustomButton',
  '$views/image#Image',
  '/scripts/utils',
  '/scripts/follow#FollowHandler',
  '/scripts/logger',
  '/scripts/env#Environment',
  '/scripts/config#Config',
  '/strings/main.lang'
], function(models, StartRadioButton, ShareButton, CustomButton, Image,
            Utils, FollowHandler, Logger, Environment, Config, localeStrings) {

  /**
   * The header includes all the elements above the navigation, including
   * artist title, portrait and the radio click button.
   *
   */

  var logger = new Logger.Logger(),
      _ = localeStrings.get.bind(localeStrings);

  var Header = function(toolbar) {
    this.artist = undefined;
    this.toolbar = toolbar;
    this.view = new HeaderView(toolbar);
    this.follow = new FollowHandler;
  };

  Header.prototype.init = function(artist) {
    this.artist = artist;
    this.follow.init(this.artist);
    this.followEnabled = new models.Promise;
    models.client.load('features').done(this, function(client) {
      if (client.features.follow || Environment.desktop || Config.get('release').has('domino')) {
        this.followEnabled.setDone();
      } else {
        this.followEnabled.setFail();
      }
    });
    this.clear();
  };

  Header.prototype.destroy = function() {
    this.view.destroy();
    if (this.follow.view) {
      this.follow.view.clearFollowerCount();
    }
    delete this.artist;
  };

  Header.prototype.clear = function() {
    this.view.clear();
  };

  Header.prototype.render = function() {
    var loaded = new models.Promise();
    loaded.done(this, this.renderButtons);

    this.view.setArtistName(this.artist.name, this.artist.uri.toSpotifyURL());
    this.view.createPortrait();

    var profile = models.Profile.fromURI(this.artist.uri);
    profile.load('image', 'name').done(this, function(profile) {
      this.view.setArtistPortrait(profile);
    });
    this.followEnabled.done(this, function() {
      this.artist.load('user').done(this, function() {
        loaded.setDone();
        if (this.artist.user && this.artist.user.uri) {
          this.view.setMergedState();
          this.view.renderMergedBadge();
          this.view.renderMergedProfileLink(this.artist);
        }
      });
    }).fail(this, function() {
      loaded.setDone();
      $('artist-buttons-follow').dispose();
    });
  };

  Header.prototype.renderButtons = function() {
    this.clear();
    this.view.createShareButton(this.artist);
    this.follow.render();
    this.view.createArtistRadio(this.artist);
  };

  /**
   * The view is where the heavy lifting goes on
   */
  var HeaderView = function(toolbar) {
    this.toolbar = toolbar;
    this.portrait = null;
  };

  HeaderView.prototype.clear = function() {
    var buttonsNode = $('artist-buttons');
    buttonsNode.innerHTML = '<span id="artist-buttons-follow"></span>';
  };

  HeaderView.prototype.setMergedState = function() {
    $('artist-page').addClass('verified');
  };

  HeaderView.prototype.renderMergedBadge = function() {
    var nameNode = $('artist-name');
    var badgeNode = document.createElement('span');
    badgeNode.className = 'artist-badge';
    badgeNode.title = _('verified-artist'); // requires translation
    nameNode.grab(badgeNode);
  };

  HeaderView.prototype.renderMergedProfileLink = function(artist) {
    var linkWrapper = $('view-profile-wrapper');
    var profileButton = CustomButton.withClass('view-profile-link', _('view-spotify-profile'));

    profileButton.addEventListener('click', function(e) {
      logger.clientEvent('view-profile');
      models.application.openURI(artist.user.uri.toSpotifyLink());
    });

    linkWrapper.appendChild(profileButton.node);
  };

  HeaderView.prototype.setArtistName = function(name, href) {
    var self = this;
    var nameNode = $('artist-name');
    var nameLink = document.createElement('a');
    nameNode.innerHTML = '';
    nameLink.href = href;
    nameLink.innerHTML = name.decodeForHtml();
    nameLink.addEventListener('click', function(e) {
      self.toolbar.show('overview');
      e.preventDefault();
    });
    nameNode.grab(nameLink, 'top');
  };

  HeaderView.prototype.createPortrait = function() {
    var self = this;
    var imageNode = $('artist-image');
    this.portrait = Image.fromSource('',
        {
          height: 128,
          width: 128,
          animate: false,
          placeholder: 'artist',
          style: 'none'
        });
    imageNode.innerHTML = '';
    imageNode.appendChild(this.portrait.node);

    $$('#artist-image .sp-image')[0].removeClass('sp-image-hidden');
    $$('#artist-image .sp-image-placeholder')[0].removeClass('sp-image-placeholder-hidden');
    this.portrait.node.addEventListener('click', this.clickPortrait.bind(this));
  };

  HeaderView.prototype.clickPortrait = function() {
    this.toolbar.show('overview');
  };

  HeaderView.prototype.setArtistPortrait = function(artist) {
    this.portrait.setImage(artist);
  };

  HeaderView.prototype.createArtistRadio = function(artist) {
    var buttonsNode = $('artist-buttons');
    var buttonRadio = StartRadioButton.forArtist(artist);
    buttonRadio.node.addEventListener('click', function() {
      logger.clientEvent('start-radio');
    });
    buttonsNode.appendChild(buttonRadio.node);
  };

  HeaderView.prototype.createShareButton = function(artist) {
    if (Environment.desktop) {
      var buttonsNode = $('artist-buttons');
      var buttonShare = ShareButton.forArtist(artist);
      buttonShare.node.addEventListener('click', function() {
        logger.clientEvent('share-artist');
      });
      buttonsNode.appendChild(buttonShare.node);
    }
  };

  HeaderView.prototype.destroy = function() {
    if (this.portrait) {
      this.portrait.node.removeEventListener('click', this.clickPortrait);
    }
    $('artist-image').empty();
    $('artist-name').empty();
    $('artist-buttons').empty();
    $('artist-page').removeClass('verified');
    if ($('artist-badge')) {
      $('artist-badge').dispose();
    }
    $('view-profile-wrapper').empty();
  };

  exports.Header = Header;

});
