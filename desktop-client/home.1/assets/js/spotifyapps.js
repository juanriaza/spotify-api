'use strict';

var dom = sp.require('$util/dom'),
    fs = sp.require('$util/fs'),
    lang = sp.require('$util/language'),
    logger = sp.require('$util/logger');

var loadingEl = dom.queryOne('.loading');

var loggingVersion,
    testVersion,
    market = sp.core.country,
    language = sp.core.language;

var SpotifyApps = {
  wrapper: null,
  headingsLoc: null,
  loggingVersion: null,
  testVersion: null,
  /**
   * @constructor
   * @this SpotifyApps
   * @param {string} version version number.
   */
  init: function(version) {
    var self = SpotifyApps;

    loggingVersion = this.loggingVersion;
    testVersion = this.testVersion;

    self.wrapper = dom.queryOne('#SpotifyApps');
    self.loadApps(version);
  },

  /**
   * @this SpotifyApps
   */
  loadApps: function() {
    var self = SpotifyApps;
    var appNodeTemplate = fs.readFile('/assets/templates/node-app.html');

    var parsedJSON;
    try {
      parsedJSON = JSON.parse(fs.readFile('/assets/' + market.toUpperCase() + '.market/feature-apps.json'));
    } catch (err) {
      parsedJSON = JSON.parse(fs.readFile('/assets/feature-apps.json'));
    }

    var featuredApps = parsedJSON['apps'];

    var h2 = new dom.Element('h2');

    h2.innerHTML = self.headingsLoc.PopularApps;

    dom.adopt(self.wrapper, h2);

    var appsList = new dom.Element('ul', {
      className: 'apps version-b'
    });

    var addEventTracking = function(e) {
      // ABCD test event tracking
      var tag = e.target;

      if (tag.tagName === 'IMG') {
        logger.logClientEvent('SpotifyApps',
            'click',
            loggingVersion,
            testVersion, {
              'clickpoint': 'image clicked',
              'app': this.id
            }
        );
      }
      if (tag.tagName === 'A') {
        if (tag.className.match(/\bsmall-button\b/)) {
          logger.logClientEvent('SpotifyApps',
              'click',
              loggingVersion,
              testVersion, {
                'clickpoint': 'button clicked',
                'app': this.id
              }
          );
        }
        if (tag.className.match(/\bapp-link\b/)) {
          logger.logClientEvent('SpotifyApps',
              'click',
              loggingVersion,
              testVersion, {
                'clickpoint': 'link clicked',
                'app': this.id
              }
          );
        }
      }
    };

    for (var i = 0, l = featuredApps.length; i < l; i++) {
      var app = featuredApps[i];

      var appDescription;
      if (typeof app.description === 'string') {
        appDescription = app.description;
      } else {
        appDescription = app.description[language] ? app.description[language] : app.description.en;
      }

      var appInfo = [
        app.name,
        appDescription,
        'spotify:app:' + app.url,
        self.headingsLoc.View
      ];

      var appNode = new dom.Element('li', {
        id: app.name,
        innerHTML: lang.format(appNodeTemplate, appInfo)
      });

      appNode.querySelector('.app-img a').innerHTML = '<img alt="' + app.name + '" src="assets/img/icon-overlay.png"/>';
      appNode.querySelector('img').style.backgroundImage = 'url(' + app.imgL + ')';

      dom.adopt(appsList, appNode);

      appNode.addEventListener('click', addEventTracking);
    }

    dom.adopt(self.wrapper, appsList);
  }
};

exports.SpotifyApps = SpotifyApps;
