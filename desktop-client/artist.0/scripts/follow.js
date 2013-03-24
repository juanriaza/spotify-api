'use strict';

require([
  '$api/models',
  '$api/private/relationsartist',
  '$api/relations#Relations',
  '$api/i18n',
  '$views/buttons',
  '$views/image#Image',
  '/scripts/env#Environment',
  '/strings/main.lang',
  '/scripts/config#Config',
  '/scripts/logger#Logger'
], function(models, ra, relations, i18n, buttons, Image, Environment, localeStrings, Config, Logger) {

  var _ = localeStrings.get.bind(localeStrings),
      logger = new Logger();

  /**
   * The FollowHandler just manages the delegation between the hermes request model
   * and the stitch view
   */
  var FollowHandler = function() {
    this.enabled = new models.Promise;
    models.client.load('features').done(this,function(client) {
      if (client.features.follow || Environment.desktop || Config.get('release').has('domino')) {
        this.view = new FollowHandler.view;
        this.enabled.setDone();
      } else {
        this.enabled.setFail();
      }
    });
  };

  FollowHandler.prototype.init = function(artist) {
    this.enabled.done(this, function() {
      this.view.init();
      this.artist = artist;
      this.artist.load('user').done(this, function() {
        if (artist.user instanceof models.User) {
          relations.forUser(artist.user).load('subscribers').done(this, function(userRelation) {
            userRelation.subscribers.snapshot(0, 0).done(this, function(s) {
              this.setFollowerCount(s.length);
            });
          });
        } else {
          ra.subscriberCount(artist.uri).done(this, this.setFollowerCount);
        }
      });

      this.button = buttons.SubscribeButton.forArtist(artist);
      var change = this.changeFollowerCount.bind(this),
          logSubscribe = this.logSubscribe.bind(this);
      this.button.addEventListener('subscribe', change);
      this.button.addEventListener('unsubscribe', change);
      this.button.addEventListener('subscribe', logSubscribe);
      this.button.addEventListener('unsubscribe', logSubscribe);
    });
  };

  FollowHandler.prototype.changeFollowerCount = function(e) {
    this.setFollowerCount(this.count + ((e.type === 'unsubscribe') ? -1 : 1));
  };

  FollowHandler.prototype.logSubscribe = function(e) {
    var type = e.type === 'subscribe' ? 'subscribe-artist' : 'unsubscribe-artist';
    logger.clientEvent(type, {'artist': this.artist.uri });
  };

  FollowHandler.prototype.setFollowerCount = function(count) {
    this.count = count;
    this.view.clearFollowerCount();
    if (count !== 0) {
      this.view.renderFollowerCount(count);
    }
  };

  FollowHandler.prototype.destroy = function() {};

  FollowHandler.prototype.render = function() {
    this.enabled.done(this, function() {
      this.view.render(this.button);
    });
  };

  /**
   * The FollowView manages all DOM related junk
   */
  var FollowView = function() {};

  FollowView.prototype.init = function() {
    var followButton = $$('#artist-buttons .sp-button-subscribe')[0];
    if (followButton) {
      followButton.dispose();
    }
  };

  FollowView.prototype.render = function(button) {
    document.getElementById('artist-buttons-follow').appendChild(button.node);
  };

  FollowView.prototype.destroy = function() {};

  FollowView.prototype.clearFollowerCount = function() {
    $('artist-followers').innerHTML = '';
  };

  FollowView.prototype.renderFollowerCount = function(number) {
    $('artist-followers').innerHTML = '<p id="artist-follower-headline">' + _('followers') + '</p><h2>' + i18n.number(number) + '</h2>';
  };

  FollowHandler.view = FollowView;
  exports.FollowHandler = FollowHandler;

});
