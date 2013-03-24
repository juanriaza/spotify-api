'use strict';

sp = getSpotifyApi(1);

exports.init = init;

// Import files from JS API
var storage = sp.require('$util/storage'),
    schema = sp.require('$unstable/hermes/discovery'),
    util = sp.require('$util/util'),
    dom = sp.require('$util/dom'),
    array = sp.require('$util/array'),
    fx = sp.require('$util/fx'),
    fs = sp.require('$util/fs'),
    ui = sp.require('$unstable/ui'),
    cf = sp.require('$unstable/coverflow'),
    lang = sp.require('$util/language'),
    p = sp.require('$unstable/pager'),
    r = sp.require('$util/react'),
    m = sp.require('$api/models'),
    v = sp.require('$api/views'),
    logger = sp.require('$util/logger'),
    staticdata = sp.require('$unstable/staticdata');

// Translations
var catalog = lang.loadCatalog('assets/main'),
    _ = partial(lang.getString, catalog, 'main'),
    _a = partial(lang.getString, catalog, 'spotify-apps'),
    _s = partial(lang.getString, catalog, 'survey');

// Imports What's New objects
var wnData = sp.require('assets/js/data');
var newAlbums = sp.require('assets/js/newalbums');
var friendsPlaylists = sp.require('assets/js/friendsplaylists');
var friendsTracks = sp.require('assets/js/friendstracks');
var newFriends = sp.require('assets/js/newfriends');
var newReleases = sp.require('assets/js/newreleases');
var regionPlaylists = sp.require('assets/js/regionplaylists');
var regionTracks = sp.require('assets/js/regiontracks');
var countryPlaylists = sp.require('assets/js/countryplaylists');
var countryTracks = sp.require('assets/js/countrytracks');
var ads = sp.require('assets/js/ads');
var abTest = sp.require('assets/js/abtest');
var survey = sp.require('assets/js/survey');

var headings = {
  FriendsPlaylists: _('sFriendsPlaylistsA') + ' <span>' +
      _('sFriendsPlaylistsB') + '</span>',
  RegionPlaylists: _('sRegionPlaylistsA') + ' <span>' +
      _('sRegionPlaylistsB') + '</span>',
  FriendsTracks: _('sFriendsTracksA') + ' <span>' +
                 _('sFriendsTracksB') + '</span>',
  RegionTracks: _('sRegionTracksA') + ' <span>' +
      _('sRegionTracksB') + '</span>',
  NewFriends: _('sNewFriendsA') + ' <span>' +
      _('sNewFriendsB') + '</span>',
  NewReleases: _('sNewReleases'),
  CountryTracks: _('sCountryTracks'),
  CountryPlaylists: _('sCountryPlaylists')
};

var appsHeadings = {
  BrowseNewMusic: _a('sBrowseNewMusic'),
  ExploreMoreApps: _a('sExploreMoreApps'),
  ListenAndSingAlong: _a('sListenAndSingAlong'),
  PopularApps: _a('sPopularApps'),
  View: _a('sView'),
  FeaturedSpotifyApps: _a('sFeaturedSpotifyApps')
};

var surveyTranslations = {
  title: _s('sTitle'),
  q1: {
    question: _s('sQ1Question'),
    negative: _s('sQ1Negative'),
    positive: _s('sQ1Positive')
  },
  q2: {
    question: _s('sQ2Question')
  },
  q3: {
    question: _s('sQ3Question'),
    negative: _s('sQ3Negative'),
    positive: _s('sQ3Positive')
  },
  submit: _s('sSubmit'),
  thanks: _s('sThanks'),
  team: _s('sTeam')
};

var loadingEl = null, hiddenSections = {}, currentStep = -2, currentLayout = 0,
    playlistToplists, trackToplists, playlistWrappers, trackWrappers,
    failures = [];

var carouselSpeed = 5000; //ms
var loggingVersion = '3';

var FAILURE_TIMEOUT = 5000; //ms

var testGroup = sp.core.getAbTestGroup();
var testVersion = 'base';
if (testGroup <= 50) testVersion = 'a';

var influencersTestGroup = sp.core.getAbTestGroup();
var influencersTestVersion;
if (influencersTestGroup <= 100) influencersTestVersion = 'ia';

/* Survey testgroup setup */
var surveyTest = {
  group: sp.core.getAbTestGroupForTest('NPS-Survey-1'),
  today: new Date(),
  getFirst: function() {
    return new Date(2012, 0, 1); //Survey was launched March 2012, so 'Jan 01, 2012' acts as our epoch.
  },
  getDaysSinceFirst: function() {
    return Math.round(((this.today - this.getFirst()) / 1000 / 60 / 60 / 24));
  },
  display: false,
  version: '1'
};
surveyTest.daysSinceFirst = surveyTest.getDaysSinceFirst();
surveyTest.saltedGroup = sp.core.getAbTestGroupForTest('NPS-Survey-2');

// Show the survey module for a period of 7 days to a random testgroup of users,
// but no more than 30% of all users.
if (surveyTest.saltedGroup <= 300) {
  for (var i = 0; i < 7; i++) {
    if (surveyTest.group === (surveyTest.daysSinceFirst - i) % 1000) {
      surveyTest.display = true;
      dom.queryOne('body').classList.add('survey-body');
      break;
    }
  }
}

/*
 * Enable testers to override A/B assignments
 *
 * We have to detect the format of the args, due to client differences:
 * Older: ['key1', 'val1', 'key2', 'val2']
 * Newer: [{'key1': 'val1'},{'key2': 'val2'}]
 */
var appArgs = (sp.core.getArguments());
if (appArgs.length === 2 && (appArgs[0] == 'testVersion' ||
    appArgs[0] == 'influencersTestVersion')) {
  // console.log('You are now viewing testVersion ' + appArgs[1]);
  testVersion = appArgs[1];
  if (/^i/.test(appArgs[1]))
    influencersTestVersion = appArgs[1];
} else if (appArgs.length === 1 && (typeof appArgs[0] === 'object') &&
    appArgs[0]['testVersion']) {
  // console.log('You are now viewing testVersion ' + appArgs[0]);
  testVersion = appArgs[0]['testVersion'];
  if ('ia' === appArgs[0]['testVersion'])
    influencersTestVersion = appArgs[0]['testVersion'];
} else if (appArgs.length === 2 && (appArgs[0] == 'surveyTest')) {
  surveyTest.display = appArgs[1];
  storage.set('survey.closed', null);
  // console.log('Survey module display set to true');
  // console.log('survey.closed: ' + storage.getWithDefault('survey.closed', {}));
} else if (appArgs.length === 1 && (typeof appArgs[0] === 'object') &&
    appArgs[0]['surveyTest']) {
  surveyTest.display = appArgs[0]['surveyTest'];
  storage.set('survey.closed', null);
  // console.log('Survey module display set to true');
  // console.log('survey.closed: ' + storage.getWithDefault('survey.closed', {}));
}

var numberOfUserImpressions = storage.getWithDefault('user.impressions', 0);

function logStepTime(stepName, opt_timestamp) {
  var timestamp = (opt_timestamp || new Date()) - performance.timing.navigationStart;
  logger.logClientEvent('TimingStep', stepName, '', testVersion, {
    // Stringify the timestamp since the client seem to drop numbers on the floor
    sinceAppStart: timestamp.toString()
  });
}

/**
 * Initiate the page
 */
function init() {
  logStepTime('before require', _beforeRequireTimestamp);
  logStepTime('main.init');

  numberOfUserImpressions = storage.set('user.impressions', numberOfUserImpressions + 1);

  loadingEl = dom.queryOne('.loading');
  dom.id('wrapper').classList.add('test-' + testVersion);

  if (sp.core.getLoginMode() !== 1) {
    goOffline();
    return;
  }

  playlistToplists = [friendsPlaylists.FriendsPlaylists, regionPlaylists.RegionPlaylists, countryPlaylists.CountryPlaylists];
  trackToplists = [friendsTracks.FriendsTracks, regionTracks.RegionTracks, countryTracks.CountryTracks];
  playlistWrappers = [
    dom.queryOne('#topToplists .playlists'),
    dom.queryOne('#bottomToplists .playlists')
  ];
  trackWrappers = [
    dom.queryOne('#topToplists .tracks'),
    dom.queryOne('#bottomToplists .tracks')
  ];

  setLayoutType();

  dom.listen(window, 'resize', function() {
    setLayoutType();
  });

  wnData.Data.init();
  Discovery.init();

  newReleases.NewReleases.triggerFailure = triggerFailure;
  newReleases.NewReleases.setTriggerTimeout(FAILURE_TIMEOUT);
  newReleases.NewReleases.setHeadings(headings);
  newReleases.NewReleases.setStepCallback(step);
  newReleases.NewReleases.testVersion = testVersion;
  newReleases.NewReleases.loggingVersion = loggingVersion;
  newReleases.NewReleases.init();

  countryTracks.CountryTracks.triggerFailure = triggerFailure;
  countryTracks.CountryTracks.setTriggerTimeout(FAILURE_TIMEOUT);
  countryTracks.CountryTracks.setTrackWrappers(trackWrappers);
  countryTracks.CountryTracks.setStepCallback(step);
  countryTracks.CountryTracks.setTableCallback(buildTracksTable);
  countryTracks.CountryTracks.init();

  countryPlaylists.CountryPlaylists.setStepCallback(step);
  countryPlaylists.CountryPlaylists.setPlaylistWrappers(playlistWrappers);
  countryPlaylists.CountryPlaylists.init();

  ads.Ads.setTrackWrappers(trackWrappers);
  ads.Ads.init();

  // Run the A/B test
  abTest.ABTest.Ads = ads.Ads;
  abTest.ABTest.headingsLoc = appsHeadings;
  abTest.ABTest.testVersion = testVersion;
  abTest.ABTest.loggingVersion = loggingVersion;
  abTest.ABTest.carouselSpeed = carouselSpeed;
  abTest.ABTest.init();

  //Setup and init survey
  survey.Survey.setSurveyTest(surveyTest);
  survey.Survey.setLoggingVersion(loggingVersion);
  survey.Survey.setStepCallback(step);
  survey.Survey.setTranslations(surveyTranslations);
  survey.Survey.init();
}

/**
 *
 */
function goOffline() {
  // If we go online again, reboot the page
  var t = Date.now();
  dom.listen(sp.core, 'loginModeChanged', function(e) {
    logger.logClientEvent('WhatsNew', 'back online', '1', testVersion, {
      'msUntilOnline' : Date.now() - t
    });
    window.location.reload();
  });

  dom.destroy(loadingEl);
  dom.id('wrapper').style.display = 'none';

  var offlineEl = new dom.Element('p', {
    id: 'offline',
    text: _('sUnavailableOffline').decodeForText()
  });
  dom.inject(offlineEl, document.body);
  logger.logClientEvent('WhatsNew', 'offline', '1', testVersion, {});
}

/**
 * @param {string} key - key for failure that was triggered.
 */
function triggerFailure(key) {
  if (failures.indexOf(key) === -1) {
    logger.logClientEvent('WhatsNew', 'failure', '1', testVersion, {
      'failureKey': key
    });
    failures.push(key);
  }

  if (failures.length === 3) {
    goOffline();
  }
}
/**
 * @return {boolean} True if the window needs a scrollbar, false if otherwise.
 */
function hasVScroll() {
  if (window.scrollY > 0) {
    return true;
  }
  return window.innerHeight < document.height;
}

/**
 *
 */
function setLayoutType() {
  var scrollWidth = hasVScroll() ? 14 : 0,
      w = window.innerWidth - scrollWidth, newLayout = currentLayout;
  if (w > 800) {
    newLayout = 1;
  } else if (w > 650 && w <= 800) {
    newLayout = 2;
  } else if (w <= 650) {
    newLayout = 3;
  }

  if (currentLayout !== newLayout) {
    currentLayout = newLayout;
    new dom.Event('layout.switch', true).dispatch(window);
  }
}

/**
 * @param {function} cb callback function.
 */
function checkMPU(cb) {
  if (ads.Ads.isLoaded()) {
    cb.call(null, ads.Ads.hasMPU());
  } else {
    dom.listen(window, 'ads.load', function() {
      cb.call(null, ads.Ads.hasMPU());
    });
  }
}

/**
 * @param {bool} sectionLoaded whether the section was loaded.
 */
function step(sectionLoaded) {
  switch (currentStep) {
    case -2:
      logStepTime('hermes');

      currentStep++;
      survey.Survey.build();
      break;
    case -1:
      currentStep++;
      newAlbums.NewAlbums.next();
      break;
    case 0: // NewAlbums
      logStepTime('albums');

      if (!sectionLoaded) {
        dom.destroy(dom.id('NewAlbums'));
      }
      currentStep++;
      playlistToplists.shift().next();
      break;
    case 1: // Top toplists, left
      logStepTime('playlists');

      if (!sectionLoaded && !playlistToplists.length) {
        dom.destroy(playlistWrappers.shift());
      }
      if (!sectionLoaded && playlistToplists.length) {
        playlistToplists.shift().next();
      } else {
        checkMPU(function(hasMPU) {
          currentStep++;
          if (!hasMPU) {
            trackToplists.shift().next();
          } else {
            dom.listen(window, 'ads.build', function() {
              step(true);
            });
          }
          ads.Ads.next();
        });
      }
      break;
    case 2: // Top toplists, right
      logStepTime('ads/tracks');

      if (!sectionLoaded && !trackToplists.length) {
        dom.destroy(trackWrappers.shift());
      }
      if (!sectionLoaded && trackToplists.length) {
        trackToplists.shift().next();
      } else {
        currentStep++;
        newFriends.NewFriends.next();
      }
      break;
    case 3: // New friends
      if (!sectionLoaded) {
        dom.destroy(dom.id('NewFriends'));
      }
      currentStep++;
      newReleases.NewReleases.next();
      break;
    case 4: // New releases
      if (!sectionLoaded) {
        dom.destroy(dom.id('NewReleases'));
      }
      if (playlistToplists.length) {
        currentStep++;
        playlistToplists.shift().next();
      } else {
        currentStep++;
      }
      break;
    case 5: // Apps sections
      if (testVersion === 'base' && numberOfUserImpressions > 5) {
        dom.id('appsBanner').classList.remove('hidden');
      }
      currentStep++;
      step(false);
      break;
    case 6: // Bottom toplists, left
      if (!sectionLoaded && !playlistToplists.length) {
        dom.destroy(playlistWrappers.shift());
      }
      if (!sectionLoaded && playlistToplists.length) {
        playlistToplists.shift().next();
      } else {
        if (trackToplists.length) {
          currentStep++;
          // console.log(trackToplists);
          trackToplists.shift().next();
        } else {
          currentStep++;
          step(false);
        }
      }
      break;
    case 7: // Bottom toplists, right
      if (!sectionLoaded && !trackToplists.length) {
        dom.destroy(trackWrappers.shift());
      }
      if (!sectionLoaded && trackToplists.length) {
        trackToplists.shift().next();
      } else {
        logStepTime('finished');
      }
      break;
  }
}

/**
 *
 */
//var Discovery = sp.require('assets/js/discovery');
var Discovery = {
  _loaded: false,
  _loadEvent: null,

  /**
   * @constructor
   * @this Discovery
   */
  init: function() {
    this._loadEvent = new dom.Event('discovery.load', true);

    this.failureTimeout = FAILURE_TIMEOUT || 5000;

    var useCache = setTimeout(function() {
      triggerFailure('Discovery');
    }, this.failureTimeout);

    var self = this;
    var postObj = {
      'user_info': {
        'country': sp.core.country
      }
    };

    var hermesReply = null;
    sp.core.getHermes('GET', 'hm://discovery/get-whats-new-data/',
        [
         ['WhatsNewRequest', postObj]
        ],
        {
          onSuccess: function(message) {
            hermesReply = message;
          },
          onFailure: function(errorCode) {
            triggerFailure('Discovery');
          },
          onComplete: function() {
            clearTimeout(useCache);

            var data = {
              new_albums: null,
              friends_playlists: null,
              friends_tracks: null,
              region_playlists: null,
              region_tracks: null,
              new_friends: null
            };

            if (hermesReply)
              data = sp.core.parseHermesReply('WhatsNewReply', hermesReply);

            var labels = {
              sRecommended: _('sRecommended'),
              sTopList: _('sTopList')
            };

            newAlbums.NewAlbums.setHeading(_('sRecommended Albums'));
            newAlbums.NewAlbums.setStepCallback(step);
            newAlbums.NewAlbums.labels = labels;
            newAlbums.NewAlbums.testVersion = testVersion;
            newAlbums.NewAlbums.loggingVersion = loggingVersion;
            newAlbums.NewAlbums.init(data.new_albums);

            friendsPlaylists.FriendsPlaylists.setPlaylistWrappers(playlistWrappers);
            friendsPlaylists.FriendsPlaylists.setStepCallback(step);
            friendsPlaylists.FriendsPlaylists.setPagerCallback(buildPlaylistPager);
            friendsPlaylists.FriendsPlaylists.init(data.friends_playlists);

            friendsTracks.FriendsTracks.setTrackWrappers(trackWrappers);
            friendsTracks.FriendsTracks.setStepCallback(step);
            friendsTracks.FriendsTracks.setTableCallback(buildTracksTable);
            friendsTracks.FriendsTracks.init(data.friends_tracks);

            regionPlaylists.RegionPlaylists.setPlaylistWrappers(playlistWrappers);
            regionPlaylists.RegionPlaylists.setStepCallback(step);
            regionPlaylists.RegionPlaylists.setPagerCallback(buildPlaylistPager);
            regionPlaylists.RegionPlaylists.init(data.region_playlists);

            regionTracks.RegionTracks.setTrackWrappers(trackWrappers);
            regionTracks.RegionTracks.setStepCallback(step);
            regionTracks.RegionTracks.setTableCallback(buildTracksTable);
            regionTracks.RegionTracks.init(data.region_tracks);

            newFriends.NewFriends.setHeadings(headings);
            newFriends.NewFriends.setCurrentLayout(currentLayout);
            newFriends.NewFriends.setStepCallback(step);
            newFriends.NewFriends.setInfluencersTestVersion(influencersTestVersion);
            newFriends.NewFriends.testVersion = testVersion;
            newFriends.NewFriends.loggingVersion = loggingVersion;
            newFriends.NewFriends.init(data.new_friends);

            self._loaded = true;
            self._loadEvent.dispatch(window);
            step(true);
          }
        }
    );
  },

  /**
   * @this Discovery
   * @return {bool} Wheter Discovery was loaded.
   */
  isLoaded: function() {
    return this._loaded;
  }
};

function NewToplistPlaylistsDataSource(data, showFriends, context, preCacheSize) {
  showFriends = showFriends || false;
  context = context || '';

  this.preCache = function() {
    var usernameSet = {};
    for (var i = 0, l = Math.min(data.length, preCacheSize); i < l; i++) {
      var d = data[i];
      var creator = d.uri.split(':')[2];
      creator = d.creator ? d.creator : decodeURIComponent(creator);
      usernameSet[creator] = true;
      if (showFriends && d.friends && d.friends.length) {
        for (var j = 0; j < d.friends.length; j++) {
          usernameSet[d.friends[j]] = true;
        }
      }
    }
    sp.social.getUsersBatch(Object.keys(usernameSet), {
      onSuccess: function() {
        console.log('precached users');
      },
      onFailure: function() {
        console.log('failed to precache users');
      }
    });
  };
  this.preCache();

  this.count = function() {
    return data.length;
  };

  this.makeNode = function(index) {
    var d = data[index], li = new dom.Element('li');

    var uri = d.uri;
    var name = d.name;
    var creator = d.uri.split(':')[2];
    creator = d.creator ? d.creator : decodeURIComponent(creator);
    var creatorUri = 'spotify:user:' + d.uri.split(':')[2];

    var nameColumn = new dom.Element('div', {
      className: 'nameColumn',
      html: '<a href="' + uri + '" class="name">' + name + '</a> '
    });

    dom.listen(dom.queryOne('.name', nameColumn), 'click', function(e) {
      logger.logClientEvent(context,
          'browsed to playlist',
          loggingVersion,
          testVersion,
          {'uri': uri}
      );
    });

    sp.social.getUsersBatch([creator], {
      onSuccess: function(users) {
        nameColumn.innerHTML += _('sBy') +
            ' <a href="' + creatorUri + '" class="creator">' + (users[0].name || creator) + '</a>';
      },
      onFailure: function() {
        nameColumn.innerHTML += _('sBy') +
            ' <a href="' + creatorUri + '" class="creator">' + creator + '</a>';
      },
      onComplete: function() {
        dom.listen(dom.queryOne('.creator', nameColumn), 'click', function(e) {
          logger.logClientEvent(context,
              'browsed to playlist creator',
              loggingVersion,
              testVersion,
              {'uri': creatorUri}
          );
        });
      }
    });

    dom.adopt(li, nameColumn);
    if (showFriends) {
      var friendsColumn = new dom.Element('div', {className: 'friendsColumn'});

      if (d.friends && d.friends.length > 0) {
        sp.social.getUsersBatch(d.friends, {
          onSuccess: function(users) {
            for (var i = 0; i < users.length; i++) {
              var user = users[i];
              if (user.picture) {
                var friendImage = new ui.SPImage(user.picture,
                    'spotify:user:' + user.canonicalUsername, user.name);
                dom.adopt(friendsColumn, friendImage.node);
                dom.listen(friendImage.node, 'click', function(e) {
                  logger.logClientEvent(context,
                      'browsed to friend picture',
                      loggingVersion,
                      testVersion,
                      {'uri': creatorUri}
                  );
                });
              }
            }
          }
        });
      }
      dom.adopt(li, friendsColumn);
    }
    return li;
  };
}

/**
 * @param {string} key Pager key.
 * @param {object} data Data object.
 * @param {element} wrapper Wrapper element.
 * @param {function} callback Callback function.
 * @return {element} pager element.
 */
function buildPlaylistPager(key, data, wrapper, callback) {
  callback = callback || function() {};

  if (!data || !wrapper) { return; }

  var showFriends = data[0].friends ? true : false;

  var perPage = 5;
  var ds = new NewToplistPlaylistsDataSource(data, showFriends, key, perPage);
  var pager = new p.Pager(ds, {
    perPage: perPage,
    hidePartials: true,
    orientation: 'vertical',
    pagingLocation: 'top',
    bullets: false,
    listType: 'list',
    context: key
  });


  pager.h2.innerHTML = headings[key];
  var border = new dom.Element('div', {className: 'border'});
  dom.adopt(pager.node, border);
  dom.adopt(wrapper, pager.node);

  callback.call();

  return pager;
}

/**
 * @param {string} key Table key.
 * @param {object} data Data object.
 * @param {element} wrapper Wrapper element.
 * @param {function} callback Callback function.
 */
function buildTracksTable(key, data, wrapper, callback) {
  callback = callback || function() {};

  if (!data || !wrapper) { return; }

  data = data.slice(0, 8);

  var tempPlaylist = new m.Playlist();
  data.forEach(function(d) {
    var t = new m.Track(d);
    tempPlaylist.add(t);
  });
  var tracksList = new v.List(tempPlaylist, function(track) {
    return new v.Track(track,
        v.Track.FIELD.STAR | v.Track.FIELD.NAME | v.Track.FIELD.ARTIST);
  });
  tracksList._itemHeight = 25;
  tracksList.node.classList.add('sp-light');

  var h2 = new dom.Element('h2', {html: headings[key]});
  var tableHeading = new dom.Element('div', {
    className: 'window',
    html: '<table><tr class="heading"><th class="headingStarred">' +
        '</th><th class="headingTitle">' + _('sTitle') + '</th>' +
        '<th class="headingArtist">' + _('sArtist') + '</th></tr></table>'});

  dom.listen(tracksList.node, 'click', function(evt) {
    evt.preventDefault();
    if (evt.target.tagName === 'A' && evt.target.parentNode
    .classList.contains('sp-track-field-artist')) {
      logger.logClientEvent(key + ' track artist',
          'click',
          loggingVersion,
          testVersion,
          {'uri': evt.target.href}
      );
      window.location = evt.target.href;
    }
    else if (evt.target.tagName === 'SPAN' && evt.target
    .classList.contains('sp-icon-star')) {
      logger.logClientEvent(key + ' star',
          'click',
          loggingVersion,
          testVersion,
          {'uri': evt.target.parentNode.parentNode.href}
      );
    }
  });

  dom.listen(tracksList.node, 'dblclick', function(evt) {
    if (evt.target.tagName === 'SPAN' && evt.target
    .classList.contains('sp-track-field-name')) {
      logger.logClientEvent(key + ' track',
          'doubleclick',
          loggingVersion,
          testVersion,
          {'uri': evt.target.parentNode.href}
      );
    }
  });

  dom.adopt(tableHeading, tracksList.node);
  dom.adopt(wrapper, h2, tableHeading);
  wrapper.classList.add(key);
  callback.call();
}
