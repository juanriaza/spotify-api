require([
  '$api/models',
  '/scripts/logger',
  '/scripts/env#Environment',
  '/scripts/utils'
], function(Model, Logger, Environment, utils) {

  /**
   * Toolbar implements a floating toolbar with tabs.
   *
   * paneSelector: The selector for the toolbar
   * tabsSelector: The tab container selector
   * foldSelector: A selector for anything "above the fold" or above the menu
   *               that should be used to calculate the point at where the toolbar
   *               starts scrolling.
   *
   */
  var createToolbar = function(paneSelector,
      tabsSelector,
      foldSelector)
      {

    var isToolbarSticky = false,
        logger = new Logger.Logger(),
        overviewTabPosition = 0,
        callbacks = {};

    var showTab = function(id) {
      if (isActiveTab('overview')) {
        overviewTabPosition = utils.scrollPosition().y;
      }
      if (isActiveTab(id)) {
        var tabPos = $$(foldSelector).getHeight()[0];
        if (utils.scrollPosition().y > tabPos) {
          window.scrollTo(0, tabPos);
        }
        return;
      }
      $$(paneSelector + ' > div').setStyle('display', 'none');
      $(id).setStyle('display', 'block');
      $$(tabsSelector + ' li').removeClass('active');
      deactivateTabs();
      activateTab(id);

      var headerHeight = $$(foldSelector).getHeight()[0];
      if (utils.scrollPosition().y >= headerHeight) {
        if (isActiveTab('overview')) {
          if (overviewTabPosition > headerHeight) {
            window.scrollTo(0, overviewTabPosition);
          }
        } else {
          window.scrollTo(0, headerHeight);
        }
      }
    }

    var isActiveTab = function(id) {
      return $$(tabsSelector + ' a[rel="' + id + '"]').getParent('li').hasClass('active')[0];
    }

    var deactivateTab = function(id) {
      $$(tabsSelector + ' a[rel="' + id + '"]').getParent('li').removeClass('active');
    }

    var deactivateTabs = function() {
      $$(tabsSelector + ' li').removeClass('active');
    }

    var activateTab = function(id) {
      $$(tabsSelector + ' a[rel="' + id + '"]').getParent('li').addClass('active');
    }

    var clickTab = function(e) {
      if ('A' == e.target.nodeName.toUpperCase()) {
        var page = $(e.target).getProperty('rel');
        e.preventDefault();
        e.stopPropagation();

        if (callbacks[page] && !isActiveTab(page)) {
          callbacks[page]();
        }
        e.preventDefault();
        showTab(page);
        logger.clientEvent('click-tab', {'id': page});
      }
      return false;
    };

    var makeToolbarSticky = function(foldSelector) {
      var headerHeight = 0;

      var stickies = [tabsSelector];

      var $stickySelector = $$(stickies.join(', '));

      return function() {
        if (0 === headerHeight) {
          headerHeight = $$(foldSelector).getHeight();
        }

        var MAX_OPACITY_AT = 200.0;

        var scrollY = utils.scrollPosition().y;
        if (scrollY > headerHeight && !isToolbarSticky) {
          isToolbarSticky = true;
          $stickySelector.addClass('sticky');
        } else if (scrollY <= headerHeight && isToolbarSticky) {
          $stickySelector.removeClass('sticky');
          isToolbarSticky = false;
        }
      }
    };

    var addPageCallback = function(page, callback) {
      callbacks[page] = callback;
    };

    return {
      init: function() {
        var stickyListener = makeToolbarSticky(foldSelector);
        $$(tabsSelector + ' > ul').addEvent('click', clickTab.bind(this));
        $(window).addEventListener('scroll', stickyListener);
      },
      show: function(tabname) {
        showTab(tabname);
      },
      isActiveTab: function(tabname) {
        return isActiveTab(tabname);
      },
      heightOnPage: function() {
        return isToolbarSticky ? 0 : utils.elementPosition($$(tabsSelector)[0]).height;
      },
      resetOverviewPosition: function() {
        overviewTabPosition = 0;
      },
      addPageCallback: addPageCallback
    };

  }

  exports.createToolbar = createToolbar;

});
