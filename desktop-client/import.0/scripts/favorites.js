"use strict";

var sp = getSpotifyApi(1);

/*
 * Imports
 */
var react   = sp.require("sp://import/scripts/react");
var social = sp.require("sp://import/scripts/social");


/*
 * Constants
 */
var FAVORITES_LOADED_EVENT  = "favoritesLoadedEvent";
var FAVORITES_CHANGED_EVENT = "favoritesChangedEvent";


/*
 * Exports
 */
exports.addEventListener = addEventListener;
exports.addFavoriteUser = addFavoriteUser;
exports.getFavoriteUsers = getFavoriteUsers;
exports.isFavoriteUser = isFavoriteUser;
exports.removeFavoriteUser = removeFavoriteUser;
exports.toggleFavoriteUser = toggleFavoriteUser;
exports.FAVORITES_LOADED_EVENT = FAVORITES_LOADED_EVENT;
exports.FAVORITES_CHANGED_EVENT = FAVORITES_CHANGED_EVENT;
Object.defineProperty(exports, "loaded", {
    get: isLoaded
});


/*
 * Private variables
 */
var favorites  = sp.social.getFavorites();
var favoritesChangedEvent = react.fromDOMEvent(favorites, "change");
var relationsLoadedEvent = react.fromDOMEvent(social,
  social.RELATIONS_LOADED_EVENT);
var relationsChangedEvent = react.fromDOMEvent(social,
  social.RELATIONS_CHANGED_EVENT);
var loaded = isLoaded();


/*
 * Initialization
 */
react.merge(favoritesChangedEvent, relationsLoadedEvent, relationsChangedEvent)
    .subscribe(function(e) {
    //console.log("Relations or favorites changed: ", social.relations.length);
    notifyListeners();
});


/**
 * Conform to the same interface as native modules: compatible with react.
 */
function addEventListener(type, listener, useCapture) {
    if (type !== FAVORITES_CHANGED_EVENT && type !== FAVORITES_LOADED_EVENT) {
        throw "Invalid event type: " + type;
    }
    window.addEventListener(type, listener, useCapture);
}

function notifyListeners() {
    var type = FAVORITES_CHANGED_EVENT;
    if (!loaded) {
        if (!isLoaded())
            return;
        loaded = true;
        type = FAVORITES_LOADED_EVENT;
    }
    var event = document.createEvent("CustomEvent");
    event.initCustomEvent(type, true, false, getFavoriteUsers());
    window.dispatchEvent(event);
}

function isLoaded() {
    return social.loaded && favorites.loaded;
}

function getFavoriteUsers() {
    var resolvedUsers = map(social.getUserByUri, favorites.all());
    return filter(function(user) { return user !== null; }, resolvedUsers);
}

function addFavoriteUser(uri) {
    if (!isFavoriteUser(uri)) {
        favorites.add(uri);
        return true;
    }
    return false;
}

// @return {boolean} true if relation changed, false otherwise
function removeFavoriteUser(uri) {
    if (isFavoriteUser(uri)) {
        favorites.remove(uri);
        return true;
    }
    return false;
}

// @return {boolean} true if user is now a favorite, false otherwise
function toggleFavoriteUser(uri) {
    var isFav = isFavoriteUser(uri);
    if (isFav) {
        removeFavoriteUser(uri);
    } else {
        addFavoriteUser(uri);
    }
    return !isFav;
}

/**
 * @param {Object} userData
 * @return {boolean}
 */
function isFavoriteUser(uri) {
    return -1 !== favorites.all().indexOf(uri);
}
