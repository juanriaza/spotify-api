"use strict";

var sp     = sp || getSpotifyApi();
var social = sp.require('$unstable/social');

function PeopleFilter(callback, userBase) {
    // private vars
    var self = this,
        users = [],
        matches = [];

    // private methods
    var filterItems = function filterItems() {
        var str = sp.core.getFilter().toLowerCase();

        if (String.prototype.trim.call(str) === '') {
            matches = users;
            callback();
            return;
        }

        matches = filter(function(user) {
            return user.name.toLowerCase().indexOf(str) !== -1;
        }, users);

        callback();
    };

    var setupCache = function setupCache(userBase) {
        if (userBase === 'spotify') {
            users = filter(function(user) {
                return user.canonicalUsername.length > 0;
            }, social.getAllUsers());
        } else {
            users = social.getAllUsers();
        }
        matches = users;
    };

    // public
    self.matchCount = function() {
        return matches.length;
    };

    self.getUser = function(index) {
        return matches[index];
    };

    self.reCache = function(userBase) {
        setupCache(userBase);
        filterItems();
    };

    setupCache(userBase);
    sp.core.addEventListener('filterChanged', filterItems);
    social.addEventListener(social.RELATIONS_CHANGED_EVENT, self.reCache);
}

exports.PeopleFilter = PeopleFilter;
