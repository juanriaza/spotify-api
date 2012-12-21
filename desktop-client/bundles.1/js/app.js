'use strict';

/**
 * API includes
 */
var sp = getSpotifyApi();
var models = sp.require('$api/models');
//sp.require('js/mock/bridge');
var bundleManagement = sp.require('js/api/bundlemanagement');
var BundleList = bundleManagement.BundleList;
bundleManagement = bundleManagement.bundleManagement;


/**
 * App includes
 */
var slab = sp.require('js/external/slab').slab;
var toggler = sp.require('js/modules/toggler');
var listFiller = sp.require('js/modules/listfiller');
var sorter = sp.require('js/modules/sorter');
var filter = sp.require('js/modules/filter');
var countdown = sp.require('js/modules/countdown');

/**
 * App base definition
 */
window.app = {

  // API access
  api: {
    models: models,
    bundles: bundleManagement,
    BundleList: BundleList
  },

  // Module access
  listFiller: listFiller,
  sorter: sorter,
  filter: filter,
  countdown: countdown,

  // Element access
  wrapperElem: document.getElementById('bundlelist'),
  runningElem: document.getElementById('running'),
  appsElem: document.getElementById('apps'),
  frameworksElem: document.getElementById('frameworks'),
  listsElem: document.getElementById('lists'),
  bundlesFillerElem: document.getElementById('bundles-filler'),
  footerElem: document.getElementById('footer'),
  updateAllElem: document.getElementById('update-all'),
  summary: document.querySelector('#footer .summary'),

  // Flag to know if the app is in the foreground or not
  isActive: true,
  activeTab: 'running',

  // Initialize the whole app
  init: function () {

    // Compile the bundle template code
    this.tmpl = slab.compile(document.getElementById('tmpl-bundle').innerHTML);

    // Get the toggler objects
    this.runningToggler = toggler.create({
      wrapper: '#running',
      allButton: '.running .toggle-all',
      itemSelector: '.bundle',
      toggleClass: 'bundle-toggle',
      closedHeight: 40
    });
    this.appsToggler = toggler.create({
      wrapper: '#apps',
      allButton: '.apps .toggle-all',
      itemSelector: '.bundle',
      toggleClass: 'bundle-toggle',
      closedHeight: 40
    });
    this.frameworksToggler = toggler.create({
      wrapper: '#frameworks',
      allButton: '.frameworks .toggle-all',
      itemSelector: '.bundle',
      toggleClass: 'bundle-toggle',
      closedHeight: 40
    });
    this.manifestToggler = toggler.create({
      wrapper: '#bundlelist',
      toggleClass: 'manifest-toggle',
      closedHeight: 0,
      animate: false,
      onToggle: function (elem) {
        var parent = elem.parentNode;
        while (parent && !parent.classList.contains('bundle') && parent !== document) {
          parent = parent.parentNode;
        }
        var itemToggler = app.api.models.application.arguments[0] === 'frameworks' ? app.frameworksToggler : app.appsToggler;
        if (parent.classList.contains('bundle')) {
          itemToggler.openItem(parent, true);
        }
      }
    });

    // Set up the listfiller that will later fill up the viewport with empty rows
    listFiller.setup(this);

    // Set up the filtering in the tab bar
    this.filter.setup(this);

    // Initialize the app logic
    if (typeof this.initMain === 'function') {
      this.initMain();
    }
  }
};

/**
 * App logic
 */
sp.require('js/main');

/**
 * Initialize the app
 */
app.init();