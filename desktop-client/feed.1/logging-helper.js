/**
 * Logging wrapper to handle logging for different AB test
 */
'use strict';

var sp = getSpotifyApi(1);

var $logger = sp.require('$util/logger');

var loggingHelper = function() {
  /**
   * Private properties and methods
   */
  var loggingVersion;
  var testGroup;

  /**
   * Sets logging for feed
   *
   * @param {string} version Name of the logging version.
   * @private
   */
  var _setLoggingVersion = function(version) {
    loggingVersion = version;
  };

  return {
    /**
     * Public interface
     */

    /**
     * Initializes logging for feed
     *
     * @param {string} version Name of the logging version.
     */
    init: function(version) {
      _setLoggingVersion(version);
    },

    /**
     * Sets test group for user
     *
     * @param {string} testGroupName Name of the test group.
     */
    setTestGroup: function(testGroupName) {
      testGroup = testGroupName;
    },

    /**
     * Gets test group for user
     *
     * @return {string} testGroup Name of the test group.
     */
    getTestGroup: function() {
      if (testGroup === undefined) testGroup = 'base_group';
      return testGroup;
    },

    /**
     * Sends data to logger
     * takes care of appropriate logging version and test group
     *
     * @param {string} context Context for logging.
     * @param {string} event Type of the event for logging.
     * @param {object} data Object with additional data.
     */
    logClientEvent: function(context, event, data) {
      $logger.logClientEvent(context, event, loggingVersion, testGroup, data);
    }
  };
};

// Exports
exports.loggingHelper = loggingHelper;
