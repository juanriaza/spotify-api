'use strict';

/* Initiate API */
var sp = getSpotifyApi(1);

var dom = sp.require('$util/dom');
var fs = sp.require('$util/fs');
var language = sp.require('$util/language');
var models = sp.require('$api/models');
var views = sp.require('$api/views');
var popover = sp.require('$unstable/popover');
var staticdata = sp.require('$unstable/staticdata');
var events = sp.require('$util/events');
var react = sp.require('$util/react');

var catalog = language.loadCatalog('assets/playlist');
var _ = partial(language.getString, catalog, 'header');

var currentUser = models.session.user;
var currentUserFriends = sp.social.relations.all();


react.fromDOMEvent(sp.core, 'argumentsChanged').subscribe(function() {
  new PlaylistHeader();
});

var PlaylistHeader = function() {
  this.uri = null;
  this.playlist = null;
  this.owner = null;
  this.followers = null;
  this.facepile = null;
  this.userProduct = sp.core.product;
  this.userCountry = sp.core.country;
  this.html = fs.readFile('assets/templates/header-node.html');
  this.mainContainer = dom.queryOne('#wrapper');
  this.mainContainer.innerHTML = '';

  var uri = sp.core.getArguments().join(':');

  this.init(uri);
};

PlaylistHeader.prototype = {

  init: function(uri) {
    this.uri = uri;
    if (uri === '') {
      return;
    }

    this.facepile = [];
    this.buildThrobber();
    this.loadData();
    var t = this;
  },

  loadData: function() {
    var self = this;

    new models.Playlist.fromURI(this.uri, function(playlist) {
      self.playlist = playlist;
      self.loadOwnerData(playlist);
      self.populate();
    });
  },

  loadPlaylistArtwork: function() {
    var image = new views.Image(this.playlist.data.cover);

    return image.node;
  },

  loadOwnerData: function(playlist) {
    var self = this;

    var getDataForOwner = function(owner) {
      var data = owner.data;
      var finalData = {};

      if (data) {
        var staticData = staticdata.getInterestingPeople(data.canonicalUsername);
        if (staticData) {
          for (var dataAttr in data) {
            finalData[dataAttr] = data[dataAttr];
          }
          for (var staticAttr in staticData) {
            finalData[staticAttr] = staticData[staticAttr];
          }
          finalData.hideSendTracks = true;
        } else {
          finalData = data;
        }
      }

      self.owner = finalData;
      var ownerNode = dom.queryOne('#meta-owner', self.mainContainer);
      if (ownerNode) {
        self.populateOwner(ownerNode);

        // Followe button
        var followButton = dom.queryOne('#button-subscribe');
        self.buildFollowButton(followButton);
      }
    };

    // using playlist.data.owner.uri doesn't work for users with special characters in their username
    var owner = models.User.fromURI('spotify:user:' + playlist.data.owner.canonicalUsername, getDataForOwner);

    if (!owner.loaded) {
      getDataForOwner(owner);
    }
  },

  loadPlaylistFollowers: function() {
    var start = Date.now();
    var title = dom.queryOne('#more-title', this.followersContainer), i = 0, l;
    this.emptyFollowersContainer();
    var subscriberCount = this.playlist.data.subscriberCount;

    if (typeof subscriberCount === 'undefined') {
      return;
    }

    title.innerHTML = '<strong>' + subscriberCount.prettyNumber() + '</strong> ' +
        (subscriberCount === 1 ? _('sSubscriber') : _('sSubscribers'));

    this.followers = this.playlist.data.getSubscribers();
    this.putCurrentUserFriendsAtBeginning();

    for (l = this.followers.length; i < 8 && i < l; i++) {
      this.loadFollower(this.followers[i]);
    }
  },

  appendFollowerAvatar: function(user) {
    if (!user.data.name) {
      return;
    }

    var avatarContainer = dom.queryOne('#more-users', this.followersContainer),
        avatar = new AvatarImage(user.data);

    this.facepile.push(avatar);
    dom.adopt(avatarContainer, avatar.getNode());
    avatar.attachTooltip();
  },

  emptyFollowersContainer: function() {
    var i = 0, l;
    if (this.facepile && this.facepile.length > 0) {
      for (l = this.facepile.length; i < l; i++) {
        this.facepile[i].destroy();
      }
      this.facepile = [];
    }
  },

  loadFollower: function(followerName) {
    models.User.fromURI('spotify:user:' + decodeURIComponent(followerName), this.appendFollowerAvatar.bind(this));
  },

  putCurrentUserFriendsAtBeginning: function() {
    var friends = [];
    for (var i = this.followers.length - 1; i >= 0; i--) {
      // Skip and removes from followers if the user is current user
      if (this.followers[i] === currentUser.data.canonicalUsername) {
        this.followers.splice(i, 1);
        continue;
      }

      // Skip users that are not a friend of the current user.
      if (currentUserFriends.indexOf('spotify:user:' + this.followers[i]) === -1) continue;

      // The current user is a friend; remove and store the user.
      friends.push(this.followers.splice(i, 1)[0]);
    }
    // Add friends back to the start of the follower list.
    Array.prototype.unshift.apply(this.followers, friends);

    if (this.playlist.data.subscribed && this.playlist.data.owner.canonicalUsername !== currentUser.data.canonicalUsername) {
      Array.prototype.unshift.apply(this.followers, [currentUser.data.canonicalUsername]);
    }
  },

  loadDurationAndNumberOfTracks: function(node) {
    var additionalInfo = dom.queryOne('.more-additional', node);

    var duration = this.playlist.data.getDuration();

    additionalInfo.innerHTML = this.playlist.data.length.prettyNumber() + ' ' +
        (this.playlist.data.length === 1 ? _('sTrack') : _('sTracks'));

    if (duration) {
      additionalInfo.innerHTML += ', ' + secondsToHms(duration);
    }
  },

  buildFollowButton: function(followbutton) {
    var self = this;

    if (self.owner.canonicalUsername === currentUser.data.canonicalUsername) {
      dom.destroy(followbutton);
      return;
    }

    if (self.playlist.followed) {
      followbutton.innerHTML = '<span class="sp-minus"></span>' + _('sUnsubscribe');
    } else {
      followbutton.innerHTML = '<span class="sp-plus"></span>' + _('sSubscribe');
    }

    followbutton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      self.toggleFollowPlaylist(e.currentTarget);
    });
  },

  addAvailableOffline: function(node) {
    var self = this;
    var offlineButton = new dom.Element('button', {
      className: 'offline-button',
      innerHTML: _('sAvailableOffline')
    });

    if (this.playlist.data.availableOffline) {
      offlineButton.classList.add('turn-on');
    }

    offlineButton.addEventListener('click', function() {
      self.toggleOfflineButton(offlineButton);
    });

    dom.adopt(node, offlineButton);
  },

  addGetPlaylistButton: function(node) {
    var self = this;
    var getPlaylistButton = new dom.Element('button', {
      className: 'get-playlist-button',
      innerHTML: _('sGetPlaylist')
    });

    dom.adopt(node, getPlaylistButton);
  },

  getDescription: function() {
    if (this.playlist.data.description.decodeForText() !== '') {
      return this.playlist.data.description.decodeForText();
    } else {
      var artists = [];
      var usedArtistURIs = [];
      var description = '';
      var playlistLength = this.playlist.data.length;
      var track, artist, randomIndex, sortedArtists;

      var trackNumbers = [];
      for (var i = 0; i < playlistLength; i++) {
        trackNumbers.push(i);
      }
      shuffleArray(trackNumbers);

      while (artists.length < 8 && typeof (randomIndex = trackNumbers.shift()) !== 'undefined') {
        track = this.playlist.data.getTrack(randomIndex);
        artist = track && track.artists && track.artists[0];
        if (artist && artist.uri && artist.name && usedArtistURIs.indexOf(artist.uri) === -1) {
          usedArtistURIs.push(artist.uri);
          artists.push(artist);
        }
      }

      if (artists.length > 1) {
        sortedArtists = artists.map(function(artist) {
          return [artist.name, artist];
        }).sort().map(function(arr) {
          return arr[1];
        });
        description = _('sIncludingArtists') + ': ' + sortedArtists.map(function(artist) {
          return '<a href="' + artist.uri + '">' + artist.name + '</a>';
        }).join(', ') + '.';
      }

      return description;
    }
  },

  populate: function() {
    var self = this;

    var playlistNameLink = new dom.Element('a', {
      innerHTML: this.playlist.data.name,
      href: this.playlist.data.uri
    });

    var description = this.getDescription();

    var contentNode = language.format(
        this.html,
        _('sShare'),
        _('sSubscribe'),
        description,
        _('sPlaylistRadio')
        );

    var el = new dom.Element('div', {
      innerHTML: contentNode
    });

    // Playlist info
    var titleNode = dom.queryOne('#meta-title', el);
    dom.adopt(titleNode, playlistNameLink);

    var artworkNode = this.loadPlaylistArtwork();
    dom.adopt(dom.queryOne('#cover', el), artworkNode);

    // Owner info
    if (this.owner && this.owner.populated !== true) {
      var ownerNode = dom.queryOne('#meta-owner', el);
      this.populateOwner(ownerNode);

      // Follower button
      var followButton = dom.queryOne('#button-subscribe', el);
      this.buildFollowButton(followButton);
    }

    var shareButton = dom.queryOne('#button-share', el);
    shareButton.addEventListener('click', function(e) {
      popover.shareSocialPopup(e, self.playlist.data.uri);
    });

    var radioButton = dom.queryOne('#button-radio', el);
    radioButton.addEventListener('click', function() {
      self.playRadio(self.uri);
    });

    // Followers section
    this.followersContainer = dom.queryOne('#more', el);
    this.loadPlaylistFollowers();

    // Duration and number of tracks
    this.loadDurationAndNumberOfTracks(dom.queryOne('#more', el));

    // Available offline section or Get playlist button
    if (this.playlist.followed === true) {
      var additionalBtnNode = dom.queryOne('#additional-button', el);
      if (this.userProduct === 'Spotify Premium') {
        this.addAvailableOffline(additionalBtnNode);
      } else if (this.userCountry !== 'US' && (this.userProduct === 'Spotify Unlimited' || this.userProduct === 'Spotify')) {
        // Not exposed to JS API yet - out of scope
        // this.addGetPlaylistButton(additionalBtnNode);
      }
    }

    dom.empty(this.mainContainer);
    dom.adopt(this.mainContainer, el);
  },

  populateOwner: function(ownerNode) {
    dom.empty(ownerNode);
    var name = _('sBy') + ' ' + (this.owner.name !== undefined ? this.owner.name : this.owner.canonicalUsername);

    if (this.owner.canonicalUsername === currentUser.data.canonicalUsername) name = _('sByYou');

    var playlistOwnerLink = new dom.Element('a', {
      innerHTML: name,
      href: this.owner.uri
    });

    var ownerPicture = this.owner.picture !== undefined ? this.owner.picture : '/import/img/placeholders/128-user.png';
    var ownerImg = new views.Image(ownerPicture, this.owner.uri);
    dom.prepend(ownerNode, ownerImg.node);
    dom.adopt(ownerNode, playlistOwnerLink);

    this.owner.populated = true;
  },

  buildThrobber: function() {
    var throbber = new dom.Element('div');
    var innerThrobber = new dom.Element('div');

    throbber.classList.add('throbber');
    dom.adopt(throbber, innerThrobber);
    dom.adopt(this.mainContainer, throbber);
  },

  toggleFollowPlaylist: function(btn) {
    var additionalBtnNode = dom.queryOne('#additional-button');
    if (this.playlist.followed === true) {
      this.playlist.followed = false;
      btn.innerHTML = '<span class="sp-plus"></span>' + _('sSubscribe');

      dom.empty(additionalBtnNode);

    } else {
      this.playlist.followed = true;
      btn.innerHTML = '<span class="sp-minus"></span>' + _('sUnsubscribe');

      if (this.userProduct === 'Spotify Premium') {
        this.addAvailableOffline(additionalBtnNode);
      } else if (this.userCountry !== 'US' && (this.userProduct === 'Spotify Unlimited' || this.userProduct === 'Spotify')) {
        // Not exposed to JS API yet - out of scope
        // this.addGetPlaylistButton(additionalBtnNode);
      }
    }
    //empty and reload followers
    this.loadPlaylistFollowers();
  },

  toggleOfflineButton: function(btn) {
    var playlist = this.playlist;

    if (this.playlist.data.availableOffline) {
      this.playlist.data.availableOffline = false;
      btn.classList.remove('turn-on');
    } else {
      this.playlist.data.availableOffline = true;
      btn.classList.add('turn-on');
    }
  },

  playRadio: function(uri) {
    var radioUri = uri.replace(/^spotify/, 'spotify:radio');
    window.location.href = radioUri;
  }
};

Number.prototype.prettyNumber = function() {
  var numberToString = this + '';

  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(numberToString)) {
    numberToString = numberToString.replace(rgx, '$1' + ' ' + '$2');
  }

  return numberToString;
};

/**
 * Creates an avatar image with a corresponding popover
 * @param {models.User} user A user object.
 * @constructor
 */
var AvatarImage = function(user) {
  if (!user) {
    return;
  }

  this.events = null;
  this.tooltip = null;
  this.user = null;
  this.image = null;
  this.tooltip = null;

  this.init(user);
};
/**
 * "Private" init function
 * @param {models.User} user A user object.
 */
AvatarImage.prototype.init = function(user) {
  var a = dom.Element('a'),
      picture = '';

  if (user.facebookId) {
    picture = 'url(https://graph.facebook.com/' + user.facebookId + '/picture)';
  } else if (user.picture && user.picture !== 'undefined') {
    picture = 'url(' + user.picture + ')';
  }
  a.classList.add('subscriber-image');
  a.classList.add('sp-image');
  a.style.backgroundImage = picture;
  a.title = user.name;
  a.href = 'spotify:user:' + encodeURIComponent(user.username);

  this.events = new events.EventHandler();
  this.user = user;
  this.image = a;
};
/**
 * Creates a tooltip-style hover message
 */
AvatarImage.prototype.attachTooltip = function() {
  var _node = document.createElement('span'), _this = this;

  var _show = function(e) {
    var x = _this.image.offsetLeft + _this.image.offsetWidth - _node.offsetWidth;
    var y = _this.image.offsetHeight + 65;

    _node.style.left = x + 'px';
    _node.style.top = y + 'px';
    _node.classList.add('sp-tooltip-show');
  };

  var _hide = function(e) {
    _node.classList.remove('sp-tooltip-show');
  };

  this.events.listen(this.image, 'mouseover', _show);
  this.events.listen(this.image, 'mouseout', _hide);

  _node.innerHTML = this.user.name;
  _node.classList.add('sp-tooltip');

  if (this.image.parentNode) {
    this.image.parentNode.appendChild(_node);
  }
  this.tooltip = _node;
};
/**
 * Returns the HTML object
 * @return {*} [desc].
 */
AvatarImage.prototype.getNode = function() {
  return this.image || null;
};
/**
 * Destroys the AvatarImage by removing all it's events and deleting both the
 * image and it's tooltop from the DOM
 */
AvatarImage.prototype.destroy = function() {
  this.events.removeAll();
  dom.destroy(this.tooltip);
  dom.destroy(this.image);
};

function secondsToHms(d) {
  d = Number(d);
  var a = Math.floor(d / 3600 / 24);
  var h = Math.floor(d / 3600);
  var m = Math.floor(d % 3600 / 60);
  var s = Math.floor(d % 3600 % 60);

  if (a > 0) {
    return a + ' ' + (a === 1 ? _('sDay') : _('sDays'));
  }else if (h > 0) {
    return h + ' ' + (h === 1 ? _('sHour') : _('sHours'));
  } else if (m > 0) {
    return m + ' ' + (m === 1 ? _('sMinute') : _('sMinutes'));
  } else if (s > 0) {
    return s + ' ' + (s === 1 ? _('sSecond') : _('sSeconds'));
  }
}

function shuffleArray(arr) {
  var i = arr.length, j, tempi, tempj;
  if (i == 0) return false;
  while (--i) {
    j = Math.floor(Math.random() * (i + 1));
    tempi = arr[i];
    tempj = arr[j];
    arr[i] = tempj;
    arr[j] = tempi;
  }
  return arr;
}

exports.PlaylistHeader = PlaylistHeader;
