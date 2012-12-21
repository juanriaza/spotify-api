"use strict";

sp = getSpotifyApi();

/*
 * Imports
 */
var dnd = sp.require('$util/dnd');
var favs = sp.require('$unstable/favorites');
var g = sp.require('$unstable/grid');
var hermes = sp.require('$unstable/hermes');
var lang = sp.require('$util/language');
var pf = sp.require('peopleFilter');
var social = sp.require("$unstable/social");
var staticdata = sp.require("$unstable/staticdata");
var ui = sp.require('$unstable/ui');


/*
 * Constants
 */
var CATALOG = lang.loadCatalog('$resources/cef_views');
var _ = partial(lang.getString, CATALOG, 'People');


/*
 * Exports
 */
exports.init = init;


/*
 * Private variables
 */
var done = false;
var grid;
var facebookEnabled = false;
var peopleFilter;


/**
 * [PeopleDataSource description].
 * @constructor
 */
function PeopleDataSource() {
    this.size = function() {
        return [170, 200];
    };
    this.padding = function() {
        return [0, 0, 10, 0];
    };
    this.count = function() {
        return peopleFilter.matchCount();
    };
    this.makeNode = function(index) {
        return makeUserNode(peopleFilter.getUser(index));
    };
    this.dropNode = function(node){};
}

/*
 * Methods
 */

/**
 * [rebuildGrid description]
 */
function rebuildGrid() {
    grid.rebuild();
}

/**
 * [showLoadingThrobber description]
 */
function showLoadingThrobber() {
    setTimeout(function() {
        if (!done) {
            var loading = document.createElement('div');
            loading.id = 'loading';
            loading.classList.add('throbber');
            loading.classList.add('visible');
            loading.appendChild(document.createElement('div'));
            document.body.appendChild(loading);
        }
    }, 500);
}

/**
 * [hideLoadingThrobber description]
 */
function hideLoadingThrobber() {
    var loading = document.getElementById('loading');
    if (loading) {
        loading.classList.remove('visible');
        setTimeout(function() {
            loading.parentNode.removeChild(loading);
        }, 500);
    }
    done = true;
}

function updateFavoriteButton(button) {
    var user = button.user;
    button.innerHTML = favs.isFavoriteUser(user.uri)?
      _("sPeopleRemoveFromFavourites"):
      _("sPeopleAddToFavourites");
}

/**
 * [makeUserNode description]
 * @param  {[type]} user [description].
 * @return {HTMLNode}    Markup for the user.
 */
function makeUserNode(user) {
    var node = document.createElement("div");
    node.classList.add("user");
    if (user.canonicalUsername !== "")
        node.id = user.canonicalUsername;

    var staticUser = staticdata.getInterestingPeople(user.canonicalUsername);
    var vanityName = user.name.decodeForText();
    if (staticUser)
        vanityName = staticUser.name.decodeForText();

    var link = document.createElement("a");
    link.title = vanityName;
    link.classList.add("userlink");
    link.setAttribute("href", user.uri);

    var picture = user.picture;
    if (staticUser)
        picture = staticUser.picture;

    var profilePic = new ui.SPImage(picture);
    link.appendChild(profilePic.node);

    var favoriteButton = document.createElement("button");
    favoriteButton.classList.add("button");
    favoriteButton.classList.add("favorite-button");
    favoriteButton.user = user;
    updateFavoriteButton(favoriteButton);

    favoriteButton.addEventListener('click', function(e) {
        e.preventDefault();
        favs.toggleFavoriteUser(user.uri);
    });

    profilePic.node.appendChild(favoriteButton);
    node.appendChild(link);

    var labelLink = document.createElement("a");
    labelLink.classList.add("userlink");
    labelLink.setAttribute("href", user.uri);
    labelLink.textContent = vanityName;

    var label = document.createElement("span");
    label.classList.add("username");
    label.appendChild(labelLink);
    node.appendChild(label);

    return node;
}

/**
 * [tabUpdate description]
 * @param  {[type]} po [description]
 */
function tabUpdate(po) {
    peopleFilter.reCache(sp.core.getArguments()[0]);
    rebuildGrid();
}

/**
 * [userHasNoFriends description]
 */
function userHasNoFriends() {
    var frag = document.createDocumentFragment();
    var article = document.createElement("article");
    var placeholder = document.createElement("image");
    var h1 = document.createElement("h1");
    var h2 = document.createElement("h2");

    placeholder.src = "sp://resources/img/people-light.png";
    h1.textContent = _("sPeopleSpotifyIsMoreFun");
    h2.textContent = _("sPeopleShareMusic");

    article.id = "nofriends";
    article.appendChild(placeholder);
    article.appendChild(h1);
    article.appendChild(h2);

    if (facebookEnabled) {
        var anchor = document.createElement("a");
        anchor.classList.add('new-button');
        anchor.textContent = _("sPeopleFindFriends");
        anchor.href = "http://www.facebook.com";
        article.appendChild(anchor);
    } else {
        var button = document.createElement("button");
        button.classList.add('new-button');
        button.textContent = _("sPeopleGetStarted");
        article.appendChild(button);
        button.addEventListener('click', function() {
            sp.social.connectToFacebook();
        });
    }

    frag.appendChild(article);
    document.body.appendChild(frag);
}

/**
 * [onResizeReady description].
 */
function onResizeReady() {
    grid.resize();
}

/**
 * [onLoginReady description].
 */
function onLoginReady() {
    rebuildGrid();
}

/**
 * [onFavoritesChanged description].
 * @param  {Event} e [description].
 */
function onFavoritesChanged(e) {
    var buttons = document.querySelectorAll(".favorite-button");
    for (var i = 0, l = buttons.length; i < l; i++) {
        updateFavoriteButton(buttons[i]);
    }
}

/**
 * [userHasFriends description].
 */
function userHasFriends() {
    document.body.innerHTML = "";
    grid = new g.Grid('people', new PeopleDataSource(), document.body);
    grid.node.classList.add('fill');
    rebuildGrid();

    // Add window resize event listener.
    window.addEventListener('resize', onResizeReady);
    // Add login event listener.
    sp.core.addEventListener('login', onLoginReady);
    // Add favorites changed event listener.
    favs.addEventListener(favs.FAVORITES_CHANGED_EVENT, onFavoritesChanged);
}

/**
 * [isFacebookEnabled description]
 * @return {Boolean}
 */
function isFacebookEnabled() {
    var socialServiceStates = sp.social.serviceStates;
    for (var i = 0; i < socialServiceStates.length; i++) {
        if ("facebook" === socialServiceStates[i].servicename) {
            return socialServiceStates[i].enabled;
        }
    }
}

/**
 * [onRelationsReady description].
 * @param  {Event} e [description].
 */
function onRelationsReady(e) {
    var usernames = social.getUsernames();
    if (!usernames.length) {
        userHasNoFriends();
    } else {
        peopleFilter = new pf.PeopleFilter(rebuildGrid,
            sp.core.getArguments()[0]);
        userHasFriends();
    }
    hideLoadingThrobber();
}

/**
 * [relationsChanged description].
 * @param  {Event} e [description].
 */
function onRelationsChanged(e) {
    facebookEnabled = isFacebookEnabled();
    rebuildGrid();
}

/**
 * [init description].
 */
function init() {
    showLoadingThrobber();
    sp.core.addEventListener("argumentsChanged", tabUpdate);

    // Add social relations changed event listener.
    social.addEventListener(social.RELATIONS_CHANGED_EVENT, onRelationsChanged);

    if (!social.loaded) {
        // Add social relations loaded event listener.
        social.addEventListener(social.RELATIONS_LOADED_EVENT,
            onRelationsReady);
    } else {
        onRelationsReady();
    }
}
