'use strict';

/**
 * List updater for filter changes.
 *
 * @module filter
 */
var filter = {

  /**
   * Update the DOM list content based on the current filter keywords.
   */
  update: function () {
    var lists, i, l, list, tempList;

    lists = [this.app.runningList, this.app.appsList, this.app.frameworksList];
    for (i = 0, l = lists.length; i < l; i++) {
      list = lists[i];
      tempList = this.getMatchingBundles(this.application.filter, list);
      tempList.toggler = list.toggler;
      tempList.type = list.type;
      this.app.updateDOM.call(this.app, tempList, 'list');
    }
  },

  /**
   * Get all matching bundles in the list for the keywords.
   *
   * @param {string}     keywords Keyword string to test with.
   * @param {BundleList} list     List of bundles to filter.
   *
   * @return {BundleList} A temporary bundle list with the matching bundles.
   */
  getMatchingBundles: function (keywords, list) {
    var tempList, i, l, bundle, regexp;

    // Fix keywords string
    keywords = keywords.decodeForText().trim();

    // Create a temporary bundle list to store matches in
    tempList = new this.BundleList();

    // Go through the original list and match bundles inside
    for (i = 0, l = list.length; i < l; i++) {
      bundle = list.get(i);
      regexp = new RegExp(keywords, "i");
      if (regexp.test(bundle.name.decodeForText()) || regexp.test(bundle.id.decodeForText())) {
        tempList.add(bundle);
      }
    }

    return tempList;
  }

};

/**
 * Set up data that the module needs.
 *
 * @param {Object} app Main app object.
 */
exports.setup = function (app) {
  filter.app = app;
  filter.application = app.api.models.application;
  filter.BundleList = app.api.BundleList;
};

exports.update = filter.update.bind(filter);