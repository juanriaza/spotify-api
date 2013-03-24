'use strict';
var refCount = 0;
require([
  '$api/models',
  '$views/list#List',
  '$views/buttons#Button',
  '$views/image#Image',
  '$views/throbber#Throbber',
  '$api/toplists#Toplist',
  '/scripts/toolbar',
  '/scripts/header',
  '/scripts/toplist',
  '/scripts/relatedartists',
  '/scripts/albums',
  '/scripts/biography',
  '/scripts/utils',
  '/scripts/onemoretime',
  '/scripts/benchmark#Benchmark',
  '/scripts/logger#Logger',
  '/scripts/promises',
  '/scripts/config#Config',
  '/scripts/config_settings#ConfigSettings',
  '/strings/main.lang',
  '/scripts/env#Environment',
  '/scripts/context_manager#ContextManager',
  '/scripts/artificial_context#ArtificialContext'
], function(Models, List, Button, Image, Throbber,
            Toplist, Toolbar, Header, ToplistView, RelatedArtists,
            Albums2, Biography, Utils, omt, Benchmark, Logger, promises, Config,
            ConfigSettings, localeStrings, Environment, ContextManager,
            ArtificialContext) {

  var ArtistPage = (function() {

    var artistId;

    var renderArtistTimer,
        renderRelatedTabTimer,
        renderAlbumsTimer,
        contentLoadingTimer;

    var header,
        toolbar,
        toplist,
        biography,
        relatedArtists,
        relatedArtistsPage,
        lists,
        offline,
        benchmark = new Benchmark(),
        logger = new Logger(),
        testGroup,
        throbber,
        throbberNode,
        fetchTimer,
        contextManager,
        foldThrobber,
        albumsManager,
        contentManager,
        _ = localeStrings.get.bind(localeStrings),
        listenersInitialized = false;

    /*
     * This runs through all HTML elements to be localized and then inserts appropriate
     * translation directly into the targeted element with innerHTML.
     */
    $$('.localize').each(function(element) {
      element.innerHTML = _(element.get('data-string'));
    });

    /*
     * This runs through all HTML elements to be localized and then inserts appropriate
     * translation directly into the targeted element's attribute tag specified by data-attribute.
     */
    $$('.localize-attribute').each(function(element) {
      element.setAttribute(element.get('data-attribute'), _(element.get('data-string')));
    });

    /**
     * This is run once per application instance
     */
    var init = function() {
      benchmark.start(Benchmark.APP_INIT);
      Config.init(ConfigSettings);
      if (Environment.desktop) {
        $('the-body').addClass('desktop');
        ArtificialContext.init();
      }
      Models.session.load('online', 'testGroup').done(function() {
        logger.setTestGroup(Models.session.testGroup);
        logger.clientEvent('application-init');
        if (Models.session.online) {
          if ($('offline-notice')) {
            $('offline-notice').dispose();
          }
          offline = false;
          toolbar = Toolbar.createToolbar('.tab-containers', '.tabs', '#header');
          header = new Header.Header(toolbar);
          toplist = new ToplistView.Toplist();
          relatedArtists = RelatedArtists.RelatedArtists.createStartPanel();
          relatedArtistsPage = RelatedArtists.RelatedArtists.createRelatedPage();
          //lists = new Albums.ArtistPageList();
          biography = new Biography.Biography();
          contextManager = new ContextManager();
          contentManager = new Albums2.ContentManager();
          throbberNode = document.getElementById('page-throbber');
          toolbar.init();
          toolbar.resetOverviewPosition();
          Models.application.load('arguments').done(loadFromURI);
        } else {
          setOffline();
        }
        if (!listenersInitialized) {
          setupDOMListeners();
          setupURIListeners();
          listenersInitialized = true;
        }
      });
    };

    var setOffline = function() {
      offline = true;
      clearDOM();
      showPage();
      $('artist-page').style.display = 'none';
      var p = document.createElement('p');
      p.id = 'offline-notice';
      p.innerHTML = 'Artist pages are not available offline.';
      $$('body')[0].appendChild(p);
      if (header) {
        header.destroy();
      }
      if (relatedArtists) {
        relatedArtists.destroy();
      }
      if (toplist) {
        toplist.destroy();
      }
    };

    var setConnectionState = function() {
      if (Models.session.online) {
        init();
      } else {
        setOffline();
      }
    };

    var setupURIListeners = function() {
      Models.session.addEventListener('change:online', setConnectionState);
      Models.application.addEventListener('arguments', loadFromURI);
    };

    var loadFromURI = function() {
      if (offline) {
        return;
      }
      benchmark.start(Benchmark.LOAD_FROM_URI);

      clearDOM();

      toolbar.show('overview');

      if (Models.application.arguments[0]) {
        SpotifyApi.api.analyticsContext('Application Load', function() {
          artistId = Models.application.arguments[0];
          var artist = Models.Artist.fromURI('spotify:artist:' + artistId);
          logger.clientEvent('load-artist', {'artist': artistId});
          var artistLoadable = omt.loadableWithRetry(artist);
          artistLoadable.load('name', 'image')
            .done(onArtistLoaded)
            .fail(onArtistFailed);
        });
      } else {
        Models.application.openApp('home');
        return false;
      }
    };

    var onArtistFailed = function() {
      $$('body > .throbber').setStyle('display', 'none');
      $$('body > .error').setStyle('display', 'block');
      $('artist-page').setStyle('display', 'none');
    };

    var renderAboveTheFold = function(artist) {
      benchmark.start(Benchmark.RENDER_ABOVE_THE_FOLD);
      $('content-loading').setStyle('display', 'none');
      var _done = new promises.TimedPromise({}, 5000);
      showPage();

      relatedArtists.init(artist).done(function(response) {
        relatedArtistsPage.init(artist);
        relatedArtistsPage.setResults(response.results);
        if (response.results === 0) {
          if (toolbar.isActiveTab('related')) {
            toolbar.show('overview');
          }
        }
      });

      var bioExists = biography.init(artist);
      if (!bioExists) {
        if (toolbar.isActiveTab('biography')) {
          toolbar.show('overview');
        }
      } else {
        // check if biography is in the arguments, if so activate the tab
        if (typeof(Models.application.arguments[1]) !== 'undefined' && Models.application.arguments[1] == 'biography') {
          toolbar.show('biography');
        }
      }

      toplist.init(artist, artistId, contextManager);
      contentManager.init(artist, contextManager);
      relatedArtists.render();
      // Not until we've rendered the toplist do we load the albums etc.
      toplist.render().done(function() {
        foldThrobber.hide();
        contentManager.startLoading();
        // As soon as the first album has been loaded we are done with above the fold.
        contentManager.addEventListener('readyToShow', function() {
          _done.setDone();
        });
      });
      return _done;
    }

    var onArtistLoaded = function(artist) {
      benchmark.measure('artist-load', 'Artist loaded', Benchmark.LOAD_FROM_URI);

      if (Environment.desktop) {
        ArtificialContext.pushContextGroup(contextManager);
      }

      header.init(artist);
      header.render();

      var artistLoadable = omt.loadableWithRetry(artist);
      artistLoadable.load('albums', 'singles', 'portraits', 'popularity', 'related', 'biography').done(function artistData() {
        SpotifyApi.api.analyticsContext('renderAboveTheFold()', function() {
          renderAboveTheFold(artist).done(function() {
            $('content-loading').setStyle('display', 'block');
            setTimeout(function delayedRender() {
              toplist.view.unhide();
              relatedArtists.view.unhide();
            }, 100);
            biography.render();
            benchmark.measure('atf-internal', 'Above the fold execution time', Benchmark.RENDER_ABOVE_THE_FOLD);
            benchmark.measure('atf-inclusive', 'Above the fold done', Benchmark.LOAD_FROM_URI);
            benchmark.send();
          });
        });
      });
    }

    var renderRelatedArtists = function() { relatedArtists.render(); };
    var renderRelatedTab = function() { relatedArtistsPage.render(); };

    var seeAllRelated = function(e) {
      preloadTab(e);
      toolbar.show('related');
      e.preventDefault();
    };

    var showBiography = function(e) {
      toolbar.show('biography');
      e.preventDefault();
    };

    var setupDOMListeners = function() {
      $('related-see-all').addEvent('click', seeAllRelated);
      $$('.tabs > ul').addEvent('click', preloadTab);
    };

    var preloadTab = function(event) {
      if (event.target.nodeName === 'A') {
        switch (event.target.getAttribute('rel')) {
          case 'related':
            if (!relatedArtistsPage.loaded) relatedArtistsPage.render();
            break;
          case 'biography':
            if (!biography.imagesLoaded) biography.renderImages();
        }
      }
    }

    var clearDOM = function() {
      if (!offline) {
        contentManager.dispose();
        header.destroy();
        toplist.destroy();
        relatedArtists.destroy();
        relatedArtistsPage.destroy();
        biography.destroy();
      }

      if (fetchTimer) {
        clearInterval(fetchTimer);
      }

      if (foldThrobber !== undefined) {
        $$('#overview .sp-throbber').dispose();
      }
      foldThrobber = new Throbber.forElement(document.getElementById('overview'), 500);

      $('related-tab-list').empty();
      $$('.tabs li').setStyle('display', '');
      $('related-artists-wrapper').setStyle('display', 'block');

      $('top-tracks-inner-wrapper').setStyle('visibility', 'hidden');
      $('top-tracks').setStyle('visibility', 'inherit');
      $('related-artists-wrapper').setStyle('visibility', 'hidden');
      $('related-artists').setStyle('visibility', 'inherit');
    };

    var showPage = function() {
      $('artist-page').setStyle('display', 'block');
      $$('body > .error').setStyle('display', 'none');
    };

    return {
      init: init
    };
  })();

  ArtistPage.init();
});
