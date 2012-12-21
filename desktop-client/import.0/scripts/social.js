"use strict";

var sp = getSpotifyApi(1);

/*
 * Imports
 */
var dom = sp.require("sp://import/scripts/dom");
var react = sp.require("sp://import/scripts/react");
var storage = sp.require("sp://import/scripts/storage");
var util = sp.require("sp://import/scripts/util");


/*
 * Constants
 */
var RELATIONS_LOADED_EVENT = "relationsLoaded"; /* Sent when the list of relations is loaded */
var RELATIONS_CHANGED_EVENT = "relationsChanged"; /* Sent when the list of relations is changed */
var RELATION_UPDATED_EVENT = "relationUpdated";   /* Sent when a single relation is updated */
var RELATIONS_CACHE_KEY = "socialRelationsCache";


/*
 * Exports
 */
exports.addEventListener = addEventListener;
exports.getAllUsers = getAllUsers;
exports.getAllFacebookUsers = getAllFacebookUsers;
exports.getUserBy = getUserBy;
exports.getUserByFacebookUid = getUserByFacebookUid;
exports.getUserByUri = getUserByUri;
exports.getUserByUsername = getUserByUsername;
exports.getUsernames = getUsernames;
exports.RELATIONS_LOADED_EVENT = RELATIONS_LOADED_EVENT;
exports.RELATIONS_CHANGED_EVENT = RELATIONS_CHANGED_EVENT;
exports.RELATION_UPDATED_EVENT = RELATION_UPDATED_EVENT;
Object.defineProperty(exports, "loaded", {
    get: function() {
        return relations.loaded;
    }
});


/*
 * Private variables
 */
var relations = sp.social.relations;
var loadEvent = react.fromDOMEvent(relations, "load");
var reloadEvent = react.fromDOMEvent(relations, "reload");
var changeEvent = react.fromDOMEvent(relations, "change");
var relationsCache = storage.getWithDefault(RELATIONS_CACHE_KEY, getUserMap());


/*
 * Initialization
 */
loadEvent.subscribe(function(e) {
    //console.log("Relations loaded", e);
    updateCache();
    new dom.Event(RELATIONS_LOADED_EVENT, true).dispatch(window);
});
reloadEvent.subscribe(function(e) {
    //console.log("Relations reloaded");
    if (updateCache()) {
        new dom.Event(RELATIONS_CHANGED_EVENT, true).dispatch(window);
    } else {
        //console.log("Relations event received but cache didn't change");
    }
});
changeEvent.subscribe(function(e) {
    //console.log("Updated: ", e.data);
    //console.log("Cache size: ", Object.keys(relationsCache).length);
    var updatedUsers = [];
    e.data.forEach(function(user){
        if (user.canonicalUsername === sp.core.user.canonicalUsername)
            return;
        if (updateCachedUser(user))
            updatedUsers.push(user);
    });
    // Only save cache and send event if something was updated
    if (updatedUsers.length > 0) {
        saveCache();
        var event = document.createEvent("CustomEvent");
        event.initCustomEvent(RELATION_UPDATED_EVENT, true, false, e.data);
        window.dispatchEvent(event);
    }
});
window.addEventListener("beforeunload", function() {
    storage.set(RELATIONS_CACHE_KEY, relationsCache);
});


/**
 * Conform to the same interface as native modules: compatible with react.
 */
function addEventListener(type, listener, useCapture) {
    if (type !== RELATIONS_LOADED_EVENT &&
        type !== RELATIONS_CHANGED_EVENT &&
        type !== RELATION_UPDATED_EVENT) {
        throw "Invalid event type: " + type;
    }
    window.addEventListener(type, listener, useCapture);
}

/**
 * Update the relations cache.
 * Returns a boolean to indicate if the contents changed.
 */
function updateCache(cache) {
    var oldCache = relationsCache;
    relationsCache = getUserMap();
    saveCache();
    return !compareCaches(oldCache, relationsCache);
}

function saveCache() {
    storage.set(RELATIONS_CACHE_KEY, relationsCache);
}

/**
 * Build and return the user map for caching and lookup.
 */
function getUserMap() {
    var userMap = {};
    for (var i = 0, l = relations.length; i < l; ++i) {
        var user = relations.getUserInfo(i);
        userMap[user.uri] = user;
    }
    return userMap;
}

/**
 * Returns an array containing all related user details.
 */
function getAllUsers() {
    var getUser = partial(getValue, relationsCache);
    return map(getUser, Object.keys(relationsCache));
}

/**
 * Returns the list of all facebook users.
 */
function getAllFacebookUsers() {
    return map(getUserByFacebookUid, relations.allFacebookUsers());
}

/**
 * Get user by predicate function
 * @param {function(Object):boolean} p
 * @return {Object|null}
 */
function getUserBy(p) {
    var users = filter(p, getAllUsers());
    return 0 === users.length ? null : users[0];
}

function getUserByUsername(cun) {
    var getCanonicalUsername = partial(getKey, "canonicalUsername");
    return getUserBy(partial(comparing, getCanonicalUsername, cun));
}

function getUserByFacebookUid(uid) {
    var getFacebookUid = partial(getKey, "facebookUid");
    return getUserBy(partial(comparing, getFacebookUid, uid));
}

function getUserByUri(uri) {
    var getUri = partial(getKey, "uri");
    return getUserBy(partial(comparing, getUri, uri));
}

function getUsernames() {
    var userNames = [];
    var name;
    for (var i in relationsCache) {
        name = relationsCache[i].canonicalUsername;
        if (name.length && 0 !== name.indexOf("spotify:user:facebook:"))
            userNames.push(name);
    }
    return userNames;
}

/**
 * Update the user cache with new user data.
 * Returns a boolean to indicate if the data was new or not
 *
 * Note: the cache is not saved here, call saveCache if this returns true.
 */
function updateCachedUser(user) {
    var cachedUser = relationsCache[user.uri];
    //console.log("Comparing ", user, cachedUser);
    if (cachedUser && user.relationType === 'none')
        delete relationsCache[user.uri];
    if (!cachedUser || !compareUsers(user, cachedUser)) {
        //console.log("New or changed user", user, cachedUser);
        relationsCache[user.uri] = user;
        return true;
    }
    return false;
}

/**
 * Determine user equality: compare all properties for now.
 */
function compareUsers(first, second) {
    for (var property in first) {
        if (getValue(first, property) !== getValue(second, property)) {
            return false;
        }
    }
    return true;
}

/**
 * Determines if two caches contain the same users.
 */
function compareCaches(first, second) {
    if (Object.keys(first).length !== Object.keys(second).length) {
        return false;
    }
    for (var key in first) {
        if (!second[key])
            return false;
        //if (!compareUsers(first[key], second[key]))
        //  return false;
    }
    return true;
}

function comparing(f, x, userData) { return eq(x, f(userData)); }
function getKey(key, obj) { return obj[key]; }
function getValue(obj, key) { return obj[key]; }
