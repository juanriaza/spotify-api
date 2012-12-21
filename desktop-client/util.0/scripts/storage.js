'use strict';

exports.get = partial(flip(getWithDefault), null);
exports.getWithDefault = getWithDefault;
exports.set = set;

function _ignoreCefKeys(key, value) {
  return (key.indexOf('Cef::') === 0 ? undefined : value);
}

/**
 * @param {string} key [description].
 * @param {*} value [description].
 * @return {string} [description].
 */
function set(key, value) {
  var serializedValue = JSON.stringify(value, _ignoreCefKeys);
  if (undefined === serializedValue) {
    throw new Error('Cannot JSON-encode value: ' + serializedValue);
  }
  localStorage.setItem(key, serializedValue);
  return serializedValue;
}

/**
 * @param {string} key [description].
 * @param {*} defaultValue [description].
 * @return {*} [description].
 */
function getWithDefault(key, defaultValue) {
  var existingValue = localStorage.getItem(key);
  return (null === existingValue ? defaultValue : JSON.parse(existingValue));
}
