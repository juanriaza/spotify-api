'use strict';

var fs = sp.require('$util/fs'),
    lang = sp.require('$util/language'),
    logger = sp.require('$util/logger'),
    v = sp.require('$api/views'),
    m = sp.require('$api/models'),
    CATALOG = JSON.parse(fs.readFile('finder.splang')),
    _ = partial(lang.getString, CATALOG, 'Finder'),
    storage = sp.require('$util/storage'),
    request = require('$util/request');

var language = sp.core.language,
    market = sp.core.country,
    offers = [];

var storeCom = sp.require('/assets/js/appstore-hermes');

/**
 * Setting variables
 */
var showCategories = true,
    cdnHost = 'http://d1hza3lyffsoht.cloudfront.net',
    bannerconf;

/**
 * Class for a array of top-banners
 *
 * @param {String} testVersion Which test group the user is in.
 */
var AnimatedBanner = {
  init: function(testVersion) {
    var self = AnimatedBanner;
    var banners = [];
    storeCom.getBannerConfig(function(bc) {
      bannerconf = bc;
      self.pickBanners();
    });
  },

  /**
   * Picks the banners to be used
   * 1) Loads all offers.
   * 2) Picks random offer.
   * 3) Uses weighting value & random number to determine if if displays or not.
   * Probability depends on both weighting AND the number-to-pick/total-available ratio.
   * EG: 10 total banners, we pick 5. Probability of something with 20% weighting being picked first time is 10%
   * (50% of being picked at random, then 20%. 50% * 20% = 10%).
   * Note: if item is NOT picked by weighing, it is still in the pool, so in theory could be repicked & so has >10% chance.
   * However, relative chance based on weighting is preserved.
   */
  pickBanners: function() {
    var bannerCount = bannerconf.setup.bannerCount;
    var self = AnimatedBanner;
    storeCom.getAppList(function(appList) {
      var allbanners = bannerconf.banners['default'],
          banner;
      if (bannerconf.banners[market]) {
        for (banner in bannerconf.banners[market]) {
          allbanners[banner] = bannerconf.banners[market][banner];
        }
      }
      var bannerKeys = [],
          bannersPicked = {};
      for (banner in allbanners) {
        if (allbanners[banner].exceptions) {
          if ((allbanners[banner].exceptions.indexOf('premium') > -1 && sp.core.product === 'Spotify Premium') ||
              (allbanners[banner].exceptions.indexOf('unlimited') > -1 && sp.core.product === 'Spotify Unlimited') ||
              (allbanners[banner].exceptions.indexOf('open') > -1 && sp.core.product === 'Spotify Open') ||
              (allbanners[banner].exceptions.indexOf('free') > -1 && sp.core.product === 'Spotify')) {
            delete allbanners[banner];
            continue;
          }
        }
        if ((allbanners[banner].weight === 100) && (appList.indexOf(banner) > -1)) {
          bannersPicked[banner] = {};
        } else if (allbanners[banner].weight === 0) {
          delete allbanners[banner];
        } else if ((appList.indexOf(banner) > -1) && (0 !== allbanners[banner].weight)) {
          bannerKeys.push(banner);
        }
      }
      while (Object.keys(bannersPicked).length < bannerCount && bannerKeys.length) {
        var randomNumber = Math.floor(Math.random() * 101),
            randomIndex = Math.floor(Math.random() * bannerKeys.length),
            bannerChance = allbanners[bannerKeys[randomIndex]].weight;
        if (appList.indexOf(bannerKeys[randomIndex]) < 0) {
          bannerKeys.splice(randomIndex, 1);
        } else if (bannerChance > randomNumber) {
          bannersPicked[bannerKeys[randomIndex]] = {};
          bannerKeys.splice(randomIndex, 1);
        }
      }
      self.decorateBanners(bannersPicked);
    });
  },

  /*
   * Decorates the banners with data from the bannerconf.json file
   * @param {array} Array of banners to be decorated.
   */
  decorateBanners: function(banners) {
    var self = AnimatedBanner;
    var prop, banner;
    for (banner in banners) {
      // Set up defaults extra data
      if (bannerconf.bannerdata[banner] && bannerconf.bannerdata[banner]['default']) {
        for (prop in bannerconf.bannerdata[banner]['default']) {
          banners[banner][prop] = bannerconf.bannerdata[banner]['default'][prop];
        }
      }
      // Overwrite defaults with market-specific data
      if (bannerconf.bannerdata[banner] && bannerconf.bannerdata[banner][market]) {
        for (prop in bannerconf.bannerdata[banner][market]) {
          banners[banner][prop] = bannerconf.bannerdata[banner][market][prop];
        }
      }
    }
    self.getBannerData(banners, '');
  },

  /*
   * Gets the banner data from the appstore
   * @param {Array} banners Array of banner objects to be used.
   * @param {String} testVersion The test version in play.
   */
  getBannerData: function(banners, testVersion) {
    var self = AnimatedBanner;
    var identifierList = [],
        banner;
    for (banner in banners) {
      identifierList.push(banner);
    }
    storeCom.getAppData(identifierList, function(appData, isCached) {
      for (var i in appData.items) {
        var bannerObj = appData.items[i];
        var manifest = (JSON.parse(appData.items[i].manifest.decodeForText()));
        bannerObj.SupportedLanguages = manifest.SupportedLanguages;
        for (var prop in banners[appData.items[i].app_name]) {
          bannerObj[prop] = banners[appData.items[i].app_name][prop];
        }
        bannerObj.manifest_new = manifest;
        offers.push(bannerObj);
      }
      self.preloadImages(testVersion);
    });
  },

  /*
   * Preloads the banner images from the CDN
   * @param {String} testVersion The test version in play.
   */
  preloadImages: function(testVersion) {
    var self = AnimatedBanner,
        images = [],
        loadedImages = 0;

    function countImage() {
      loadedImages++;
      if (loadedImages === offers.length) {
        self.setUpBanners(testVersion);
      }
    }

    for (var i = offers.length - 1; i >= 0; i--) {
      if (!offers[i].image) {
        offers[i].image = cdnHost + '/banners/' + offers[i].app_name + '.jpg';
      }
      images[i] = new Image();
      images[i].src = offers[i].image;
      images[i].addEventListener('load', countImage);
      images[i].addEventListener('error', countImage);
    }
  },

  /*
   * Sets up the banner area
   * @param {String} testVersion The test version in play.
   */
  setUpBanners: function(testVersion) {
    var self = AnimatedBanner;
    var carouselSpeed = bannerconf.setup.carouselSpeed;
    var currentOfferId = Math.floor((Math.random() * offers.length));
    var currentOffer = offers[currentOfferId];
    var numberOfOffers = Object.keys(offers).length;
    var header = document.querySelector('header');

    self.loadBanner(header, currentOffer);

    var bannerActive = false;
    header.onmouseover = function() { bannerActive = true;};
    header.onmouseout = function() { bannerActive = false;};
    var bannerInterval = window.setInterval(function() {
      if (bannerActive === false) {
        currentOfferId = self.loadNextBanner(header, currentOfferId, numberOfOffers);
      }
    }, carouselSpeed);

    header.addEventListener('click', function(e) {
      var target = e.target;

      if (target.id === 'nextimage') {
        logger.logClientEvent('FeatureBannerNext', 'click', '1', testVersion, {});
        currentOfferId = self.loadNextBanner(header, currentOfferId, numberOfOffers);
        return;
      } else if (target.id === 'previousimage') {
        logger.logClientEvent('FeatureBannerPrev', 'click', '1', testVersion, {});
        currentOfferId = self.loadPrevBanner(header, currentOfferId, numberOfOffers);
        return;
      }

      // allow clicks from any sub element, regardless of template
      while (!target.dataset.appid) {
        target = target.parentNode;
      }

      if (target.dataset.appid === 'spotify') {
        return;
      } else {
        logger.logClientEvent('FeatureBanner', 'click', '1', testVersion, {
          'app': target.dataset.appid,
          'clickpoint': e.target.id ? e.target.id : e.target.className
        });

        if (target.dataset.banneraction) {
          if (target.dataset.banneraction.substr(0, 13).toLowerCase() === 'spotify:track') {
            var player = new v.Player();
            var track = m.Track.fromURI(target.dataset.banneraction);
            player.play(track);
          }
        }
        window.location = 'spotify:app:' + target.dataset.appid;
      }
    });
  },

  /**
   * Loads and displays an individual banner
   * @param {Item} header The header element.
   * @param {Object} offer The offer to display.
   */
  loadBanner: function(header, offer) {
    var newBanner = document.createElement('div');
    newBanner.className = 'banner-images';
    if (offer.hasOwnProperty('additionalClassName')) {
      newBanner.classList.add(offer.additionalClassName);
    }
    newBanner.dataset.appid = offer.app_name;

    var appLanguage = language.toLowerCase();
    var manifest = offer.manifest_new;

    var hasLanguageSupport = offer.SupportedLanguages.some(function(langSupport) {
      return (langSupport == language.toLowerCase());
    });

    var buttonText;
    if (offer.buttonText) {
      buttonText = hasLanguageSupport && offer.buttonText[appLanguage] ? offer.buttonText[appLanguage] : offer.buttonText.en;
    }
    var name = hasLanguageSupport && manifest.AppName[appLanguage] ? manifest.AppName[appLanguage] : manifest.AppName.en;

    var AppDescription = offer.AppDescription ? offer.AppDescription : manifest.AppDescription;
    var description = hasLanguageSupport && AppDescription[appLanguage] ? AppDescription[appLanguage] : AppDescription.en;

    var category = offer.categories ? '(' + offer.categories.identifiers[0] + ')' : false;

    var bannerFeatureTemplate = (showCategories && category) ?
        fs.readFile('assets/templates/node-feature.html') : fs.readFile('assets/templates/node-feature-nocategory.html');

    // Fallback if they do not have English or current language
    name = name ? name : manifest.AppName[offer.SupportedLanguages[0]];
    description = description ? description : AppDescription[offer.SupportedLanguages[0]];

    var icon = 'assets/img/logos/' + offer.name + '-64x64.png';
    if (!offer.name) {
      icon = offer.medium_icon_uri;
    }
    if (language != 'de') {
      // Overrides
      if (offer.buttonText) {
        buttonText = hasLanguageSupport && offer.buttonText[appLanguage] ? offer.buttonText[appLanguage] : offer.buttonText.en;
      }
      if (offer.bannerText) {
        description = hasLanguageSupport && offer.bannerText[appLanguage] ? offer.bannerText[appLanguage] : offer.bannerText.en;
      }
      if (offer.bannerAction) {
        newBanner.dataset.banneraction = hasLanguageSupport && offer.bannerAction[appLanguage] ?
            offer.bannerAction[appLanguage] : offer.bannerAction.en;
      }
    }

    newBanner.style.backgroundImage = 'url(' + offer.image + ')';

    var appInfo = [
      icon,
      name,
      (buttonText ? buttonText : _('sView')),
      description,
      category
    ];

    newBanner.innerHTML += lang.format(bannerFeatureTemplate, appInfo);
    header.appendChild(newBanner);

    if (1 < document.querySelectorAll('.banner-images').length) {
      // Removing all previous banners if there are more than previous and current
      // that might happen when quickly clicking next/previous arrow
      while (2 < header.querySelectorAll('.banner-images').length) {
        header.removeChild(header.querySelectorAll('.banner-images')[0]);
      }

      var currentBanner = document.querySelectorAll('.banner-images')[0];

      // Javascript animation hack instead of using cpu intensive css animations
      (function() {
        var t = 0.0;
        var duration = 0.30;
        var fps = 30.0;
        function tick() {
          var opa = 1.0 - t / duration;
          currentBanner.style.zIndex = 25;
          currentBanner.style.opacity = opa;
          t += 1.0 / fps;
          if (t < duration)
            setTimeout(tick, 1000.0 / fps);
          else
            header.removeChild(currentBanner);
        }
        tick();
      })();

      //Fading only when there was some previous element
      newBanner.classList.add('focus');
    }
  },

  /**
   * [TODO: missing description]
   * @param {Item} header The header element.
   * @param {integer} currentOfferId The ID of the offer to display.
   * @param {integer} numberOfOffers The total number of offers.
   * @return {integer} The new offer ID.
   */
  loadNextBanner: function(header, currentOfferId, numberOfOffers) {
    var self = AnimatedBanner;
    if (numberOfOffers - 1 == currentOfferId) {
      currentOfferId = 0;
    } else {
      currentOfferId += 1;
    }
    self.loadBanner(header, offers[currentOfferId]);

    return currentOfferId;
  },

  /**
   * [TODO: missing description]
   * @param {Item} header The header element.
   * @param {integer} currentOfferId The ID of the current offer to display.
   * @param {integer} numberOfOffers The total number of offers.
   * @return {integer} The new offer ID.
   */
  loadPrevBanner: function(header, currentOfferId, numberOfOffers) {
    var self = AnimatedBanner;
    if (0 === currentOfferId) {
      currentOfferId = numberOfOffers - 1;
    } else {
      currentOfferId -= 1;
    }
    self.loadBanner(header, offers[currentOfferId]);

    return currentOfferId;
  }
};

/**
 * Exports
 */
exports.AnimatedBanner = AnimatedBanner;
