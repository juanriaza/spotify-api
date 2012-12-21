"use strict";

exports.get = partial(flip(getWithDefault), null);
exports.getWithDefault = getWithDefault;
exports.set = set;

function _ignoreCefKeys(key, value)
{
	return (key.indexOf("Cef::") === 0? undefined: value);
}

/**
 * @param {string} key
 * @param {*} value
 * @return {string}
 */
function set(key, value) {
	var serializedValue = JSON.stringify(value, _ignoreCefKeys);
	if (undefined === serializedValue) {
		throw new Error("Cannot JSON-encode value: " + serializedValue);
	}
	localStorage.setItem(key, serializedValue);
	return serializedValue;
}

/**
 * @param {string} key
 * @param {*} defaultValue
 * @return {*}
 */
function getWithDefault(key, defaultValue) {
	var existingValue = localStorage.getItem(key);
	return (null === existingValue? defaultValue: JSON.parse(existingValue));
}