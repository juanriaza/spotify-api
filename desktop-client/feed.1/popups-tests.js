'use strict';

var storage = sp.require('$util/storage');
var abTests = sp.require('ab-tests-utils');
var logger = sp.require('$util/logger');

/**
 * Test cases configuration.
 *
 * @property {String} name Label for the test. Used to get AB group threshold from backend.
 * @property {Function} onSuccess Function to be executed if AB group was loaded succesfully.
 * @property {Function} onFailure Function to be executed if AB group couldn't be loaded.
 */
var tests = {
  WEEKLY_PLAYLISTS: {
    name: 'desktop_lightbox-weekly_playlists',
    onSuccess: subscribePopupsTest,
    onFailure: onGroupLoadFailure
  },

  OG_POPUP: {
    name: 'desktop_lightbox-toggle_og',
    onSuccess: ogPopupTest,
    onFailure: onGroupLoadFailure
  }
};

/**
 * Loads AB group for given test case.
 * Wrapper for general loadGroup method.
 *
 * @param {tests} test Object containing test configuration.
 */
function loadTest(test) {
  abTests.loadGroup(test.name, test.onSuccess.bind(test), test.onFailure.bind(test));
}

/**
 * Wrapper method for logging purposes
 *
 * @param {String} context The context for the logger.
 * @param {String} message Mesaage to log.
 */
function logClientEvent(context, message) {
  logger.logClientEvent(context, message, '2', '1', {});
}

/**
 * Subscribe popup test case
 *
 * @param {Object} response Response object
 *  param {Number} response.status HTTP status code.
 *  param {Object} response.data Response data.
 */
function subscribePopupsTest(response) {

  var showPopupThreshold = response.data[this.name];
  var userGroup = sp.core.getAbTestGroupForTest('loops-og-popup-1');
  var logContext = 'playlist subscribe button';

  var popupFlagValidity = 7 * 24 * 60 * 60 * 1000;
  var popupShownFlag = getPopupFlag();
  var popupFlagVoid = !popupShownFlag || Date.now() - popupShownFlag > popupFlagValidity;

  var shouldSeePopup = userGroup < showPopupThreshold && sp.core.language === 'en' && popupFlagVoid;

  if (shouldSeePopup) {
    sp.core.showAppViewDialog('spotify:app:subscribe-popup:1', { onSuccess: onSuccess, onFailure: onFailure });
    setPopupFlag();
  }

  function onSuccess() {
    //console.log('closed with success');
    logClientEvent(logContext, 'popup closed - success');
  }

  function onFailure() {
    //console.log('closed with failure');
    logClientEvent(logContext, 'popup closed - failure');
  }
}

/**
 * OG popup test case
 *
 * @param {Object} response Response object
 *  param {Number} response.status HTTP status code.
 *  param {Object} response.data Response data.
 */
function ogPopupTest(response) {

  var showPopupThreshold = response.data[this.name];
  var userGroup = sp.core.getAbTestGroupForTest('loops-og-popup-1');
  var logContext = 'open graph popup';

  var popupShownFlag = getPopupFlag();
  //console.log(popupShownFlag, userGroup, showPopupThreshold);
  var shouldSeePopup = !popupShownFlag && userGroup < showPopupThreshold && sp.core.language === 'en';

  if (shouldSeePopup) {
    sp.core.showAppViewDialog('spotify:app:og-popup', { onSuccess: onSuccess, onFailure: onFailure });
    setPopupFlag();
  }

  function onSuccess() {
    //console.log('closed with success');
    logClientEvent(logContext, 'popup closed - success');
  }

  function onFailure() {
    //console.log('closed with failure');
    logClientEvent(logContext, 'popup closed - failure');
  }

}

/**
 * Shows tutorial completed popup
 *
 */
function tutorialCompletedPopup() {

  var popupLanguages = ['en', 'de'];

  if (popupLanguages.indexOf(sp.core.language) > -1) {
    if (typeof sp.core.showAppViewDialog === 'function') {
      sp.core.showAppViewDialog('spotify:app:subscribe-popup:1', { onSuccess: onSuccess, onFailure: onFailure });
      setPopupFlag();
    }
  }

  function onSuccess() {
    //console.log('closed with success');
    logClientEvent('playlist subscribe button', 'popup closed - success');
  }

  function onFailure() {
    //console.log('closed with failure');
    logClientEvent('playlist subscribe button', 'popup closed - failure');
  }
}

/**
 * Loading test group failed
 *
 * @param {Object} response Response object
 *  param {Number} response.status HTTP status code.
 *  param {Object} response.error Description of the error.
 */
function onGroupLoadFailure(response) {
  logger.logClientEvent('playlist subscribe button', 'error - AB group not loaded', '2', '1', { error: response.error });
  //console.error('Group not loaded: ' + response.error);
}

/**
 * Load og/subscribe popups test
 * Determines to which group user belongs
 * i.e. should he see og-popup or subscribe-popup
 * and loads the necessary logic
 * @public
 */
function loadPopupsTest() {
  var shouldSeeOgPopup = typeof sp.social.togglePostToOG === 'function' && sp.social.openGraphAvailable && !sp.social.openGraphEnabled;
  var popupShownFlag = getPopupFlag();

  if (!popupShownFlag && shouldSeeOgPopup) {
    loadTest(tests.OG_POPUP);
  } else {
    loadTest(tests.WEEKLY_PLAYLISTS);
  }
}

/**
 * Gets the flag when user saw the popups for the last time
 * @return {Number} when user saw the popup in miliseconds.
 */
function getPopupFlag() {
  var storageFlag = storage.get('ogPopupShown');
  return storageFlag && parseInt(storageFlag, 10);
}

/**
 * Sets the flag when user saw the popups for the last time
 * flag is current timestamp (in miliseconds)
 */
function setPopupFlag() {
  storage.set('ogPopupShown', Date.now());
}

exports.loadPopupsTest = loadPopupsTest;
exports.loadTutorialCompletePopup = tutorialCompletedPopup;
