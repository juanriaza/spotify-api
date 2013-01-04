'use strict';

var dom = sp.require('$util/dom'),
    storage = sp.require('$util/storage'),
    react = sp.require('$util/react'),
    lang = sp.require('$util/language'),
    logger = sp.require('$util/logger'),
    catalog = lang.loadCatalog('assets/main'),
    _ = partial(lang.getString, catalog, 'main');

var ADSTATE = {
  SHOWING_ADS: 0,
  NOT_SHOWING_ADS: 1
};

var Ads = {
  _loaded: false,
  _loadEvent: null,
  _activatedEvent: null,
  storageKey: null,
  ad: null,
  partner: null,
  trackWrappers: null,
  supportsHideHpto: false,
  /**
   * @this Ads
   * @constructor
   */

  fetchAd: function(obj) {
    sp.whatsnew.fetchAd({
      onSuccess: function(ad) {
        if (obj.userImpressions > 5) {
          obj.ad = ad;
        }
      },
      onFailure: function(errorCode) {
        logger.logClientEvent('WhatsNew', 'sp.whatsnew.fetchAd failed', '1', 'base', {
          'errCode': errorCode
        });
      },
      onComplete: function() {
        obj._loaded = true;
        obj._loadEvent.dispatch(window);
      }
    });
  },

  init: function() {
    var self = this;
    self._loadEvent = new dom.Event('ads.load', true);

    var partner = sp.whatsnew.getPartner();
    if (partner && partner === 'telia') {
      this.partner = partner;
    }

    self.supportsHideHpto = sp.whatsnew.hasOwnProperty('getHideHpto');

    // Number of home app impressions.
    self.userImpressions = storage.getWithDefault('user.impressions', 0);

    self.ad = undefined;
    self.fetchAd(self);
  },

  setTrackWrappers: function(trackWrappers) {
    this.trackWrappers = trackWrappers;
  },

  /**
   * @this Ads
   * @return {bool} Whether ads are loaded or not.
   */
  isLoaded: function() {
    return this._loaded;
  },

  /**
   * @this Ads
   * @return {bool} Whether a MPU ad exists, or if partner is set.
   */
  hasMPU: function() {
    if (this.ad) {
      if (!this.ad.bg) {
        return true;
      }
      return false;
    }

    if (this.partner) {
      return true;
    }
  },

  /**
   * @this Ads
   * Calls the build function if it's loaded, otherwise create an
   * event listener for it
   */
  next: function() {
    if (this._loaded) {
      this.build();
    } else {
      dom.listen(window, 'ads.load', this.build.bind(this));
    }
  },

  /**
   * @this Ads
   * Evaluates whether the user has chosen to hide ads
   */
  isHidden: function() {
    var remainHidden = false;

    this.bindOnActivateEvent();

    if ((this.supportsHideHpto && sp.whatsnew.getHideHpto()) && !this.shouldSeeAds()) {
      remainHidden = true;
    }
    // store current state
    storage.set(this.storageKey, (remainHidden ? ADSTATE.NOT_SHOWING_ADS : ADSTATE.SHOWING_ADS));
    return remainHidden;
  },

  /**
   * @this Ads
   * Register an event that fires if the app is loaded into view again
   */
  bindOnActivateEvent: function() {
    var self = this;

    sp.core.addEventListener('activate', function() {
      var storedFlag = storage.get(self.storageKey);

      if (storedFlag !== null && this.supportsHideHpto) {
        storedFlag = parseInt(storedFlag, 10) === ADSTATE.NOT_SHOWING_ADS ? true : false;
        if (storedFlag != sp.whatsnew.getHideHpto()) {
          // user modified their settings in preferences, reload this page
          window.location.reload();
        }
      }
    });
  },

  /**
   * @this Ads
   * Checks to see if a user normally sees ads or not
   */
  shouldSeeAds: function() {
    return sp.core.ads === 'undefined' ? false : sp.core.ads;
  },

  /**
   * @this Ads
   * Hides ads for a user
   */
  hideAd: function() {
    if (this.supportsHideHpto) {
      sp.whatsnew.setHideHpto(true);
    }
  },

  getHTPOAdContent: function() {
    var adWrapper = document.getElementsByClassName('adWrapper')[0];
    return adWrapper.innerHTML;
  },

  setHTPOAdContent: function(adContent) {
    var adWrapper = document.getElementsByClassName('adWrapper')[0];
    adWrapper.innerHTML = adContent;
  },

  /**
   * @this Ads
   * @param {string} id
   * Sets the name to be used as the storage key.
   */
  setAdIdentity: function(id) {
    var userId = sp.core.user.uri.split(':');

    this.storageKey = id + '_' + userId[2];
  },

  /**
   * @this Ads
   * Builds the UI
   */
  build: function() {
    var hasAd = false;
    var bg;
    var mpuWrapper;
    var imgHolder;

    // Ad
    if (this.ad) {

      // Set the identity key value of this ad
      this.setAdIdentity('hpto_ad_state');

      // A background at least means it's shown at the top
      if (this.ad.bg && !this.isHidden()) {

        /**
         * Swap the order so that the albums are at the top
         * inside the advert area.
         * Must only trigger if they are not already there
         */
        var CustomBannersNode = document.getElementById('CustomBanner');
        var NewAlbumsNode = document.getElementById('NewAlbums');
        var appsBannerNode = document.getElementById('appsBanner');
        var parentNode = NewAlbumsNode.parentNode;
        if ('NewAlbums' !== parentNode.querySelector('SECTION').id) {
          var surveyNode = document.getElementById('Survey');
          if (null !== surveyNode) {
            parentNode.insertBefore(NewAlbumsNode, surveyNode);
            parentNode.insertBefore(CustomBannersNode, surveyNode);
          } else {
            parentNode.insertBefore(NewAlbumsNode, appsBannerNode);
            parentNode.insertBefore(CustomBannersNode, appsBannerNode);
          }
        }

        hasAd = true;

        if (this.ad.bg.target && this.ad.bg.target !== '') {
          bg = new dom.Element('a', {
            href: this.ad.bg.target.decodeForLink()
          });
          var bgtarget = this.ad.bg.target.decodeForText();
          dom.listen(bg, 'click', function(evt) {
            evt.preventDefault();
            sp.whatsnew.reportAdClicked();
            window.open(bgtarget);
          });
        } else {
          bg = new dom.Element('div');
        }

        bg.style.backgroundImage = 'url(' + this.ad.bg.image_uri + ')';
        bg.style.backgroundColor = this.ad.bg.bgcolor;
        bg.className = 'ad-bg';
        dom.adopt(document.body, bg);
        document.body.classList.add('has-ad-bg');

        if (!this.shouldSeeAds() && this.supportsHideHpto) {
          this.hideButton.build();
        }
      }

      if (this.ad.mpu && (this.ad.mpu.html || this.ad.mpu.image)) {
        var frameWrapper = new dom.Element('div', {
          className: 'adWrapper'
        });
        mpuWrapper = new dom.Element('div');

        hasAd = true;

        if (this.ad.mpu.html) {
          var frame = new dom.Element('iframe');
          frame.src = 'http://ad-data.spotify.com/' +
                      btoa(this.ad.mpu.html.decodeForText());
          frame.scrolling = 'no';
          dom.inject(frame, frameWrapper);

        } else if (this.ad.mpu.image) {

          if (this.ad.mpu.image.target && this.ad.mpu.image.target !== '') {
            var target = this.ad.mpu.image.target.decodeForText();
            imgHolder = new dom.Element('a', {
              href: this.ad.mpu.image.target.decodeForLink()
            });

            dom.listen(imgHolder, 'click', function(evt) {
              evt.preventDefault();
              sp.whatsnew.reportAdClicked();
              window.open(target);
            });

          } else {
            imgHolder = new dom.Element('div');
          }

          var img = new Image();
          frameWrapper = new dom.Element('div', {
            className: 'adWrapper'
          });

          img.src = this.ad.mpu.image.image_uri;
          dom.inject(img, imgHolder);
          dom.inject(imgHolder, frameWrapper);
        }

        dom.inject(frameWrapper, mpuWrapper);

        if (bg) {
          mpuWrapper.className = 'topWrapper';
          dom.inject(mpuWrapper, dom.id('wrapper'), 'top');
          document.body.classList.add('has-ad-top');
        } else {
          mpuWrapper.className = 'mpuWrapper';
          dom.inject(mpuWrapper, this.trackWrappers.shift());
          document.body.classList.add('has-ad-mpu');
        }
      }

      if (hasAd) {
        sp.whatsnew.reportAdStarted();

        sp.core.addEventListener('activate', function() {
          sp.whatsnew.reportAdStarted();
          if (Ads.unloadedAdContent !== undefined) {
            Ads.setHTPOAdContent(Ads.unloadedAdContent);
            delete(Ads.unloadedAdContent);
          }
        });

        sp.core.addEventListener('deactivate', function() {
          sp.whatsnew.reportAdStopped();

          if (Ads.unloadedAdContent === undefined) {
            Ads.unloadedAdContent = Ads.getHTPOAdContent();
            Ads.setHTPOAdContent('');
          }
        });
      }

    } else if (this.partner) { // Partner

      var partnerLink = new dom.Element('a', {
        href: 'http://www.telia.se/spotify'
      });
      var partnerImage = new Image();
      mpuWrapper = new dom.Element('div', {
        className: 'mpuWrapper'
      });
      imgHolder = new dom.Element('div');

      hasAd = true;

      partnerImage.src = '/assets/img/telia.png';
      dom.inject(partnerImage, partnerLink);
      dom.inject(partnerLink, imgHolder);
      dom.inject(imgHolder, mpuWrapper);
      dom.inject(mpuWrapper, this.trackWrappers.shift());
    }

    if (hasAd) {
      new dom.Event('ads.build', true).dispatch(window);
    }
  },

  /**
   * @this Ads
   */
  hideButton: {
    /**
     * @this hideButton
     */
    build: function() {
      var btn = new dom.Element('button', {
        className: 'ad-btn-close'
      });
      var bdy = dom.queryOne('body');

      btn.innerHTML = _('sAdHideButton');
      dom.listen(btn, 'click', this.click);
      new Tooltip(btn, _('sAdBubbleText'));
      dom.adopt(bdy, btn);
    },
    /**
     * @this hideButton
     */
    click: function(e) {
      e.preventDefault();
      sp.whatsnew.reportAdStopped();
      Ads.refresh();
    }
  },
  /**
   * @this Ads
   * Reloads the app
   */
  refresh: function() {
    this.hideAd();
    window.location.reload();
  }
};
/**
 * Creates a tooltip-style hover message
 * Used on the button that hides ads
 * @param {elem} elem The element being hovered.
 * @param {html} html HTML to be displayed within the tooltip.
 */
function Tooltip(elem, html) {
  var _elem = elem;
  var _node = document.createElement('span');

  var _show = function(e) {
    //var x = _elem.offsetLeft + _elem.offsetWidth / 2 - _node.offsetWidth / 2;
    var x = 20;
    var y = _elem.offsetTop + _elem.offsetHeight + 5;

    _node.style.right = x + 'px';
    _node.style.top = y + 'px';
    _node.classList.add('sp-tooltip-show');
  };

  var _hide = function(e) {
    _node.style.top = '-1000px';
    _node.classList.remove('sp-tooltip-show');
  };

  _elem.addEventListener('mouseover', _show);
  _elem.addEventListener('mouseout', _hide);

  _node.innerHTML = html;
  _node.classList.add('sp-tooltip');
  document.body.appendChild(_node);

  this.show = _show;
  this.hide = _hide;
}

exports.Ads = Ads;
