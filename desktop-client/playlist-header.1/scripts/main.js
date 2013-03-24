'use strict';

require([
  '$api/models',
  '$api/models#Promise',
  '$views/image#Image',
  '$views/buttons',
  '$api/hermes',
  '$api/relations#Relations',
  '$api/library#Library',
  'scripts/utils#$',
  '$views/throbber#Throbber',
  '$api/i18n',
  'strings/header.lang',
  '$api/offline#Offline',
  'scripts/sanitize-description#sanitizeDescription'
], function(models, Promise, Image, buttons, hermes, Relations, Library, $, Throbber, i18n, headerStrings, Offline, sanitizeDescription) {

  var L = headerStrings.get.bind(headerStrings);

  var activePlaylist;
  var coverImageEl;
  var buttonsWrapperEl;
  var loading;

  var els;
  var image;
  var throbberHidden;

  var meFollowerEl = new Follower(models.session.user, L('You'));
  var numberOfFollowers = 0;

  var offline;

  var init = function() {
    offline = Offline.forCurrentUser();
    initElements();
    initImages();
    initEvents();
    checkArguments();
  };

  var initElements = function() {
    els = {
      content: $('#content'),
      throbber: $('#main-throbber'),
      cover: $('#cover'),
      metaMoreWrapper: $('#meta-more-wrapper'),
      titleOwnerWrapper: $('#title-owner-wrapper'),
      title: $('#title a'),
      owner: $('#owner a'),
      ownerName: $('#owner-name a'),
      desc: $('#desc'),
      more: $('#more'),
      buttons: $('#buttons'),
      followersNumber: $('#followers-number'),
      followersImages: $('#followers-images'),
      followersLabel: $('#followers-number-label'),
      numberOfTracks: $('#number-of-tracks')
    };
  };

  var drawerComponents;

  var initImages = function() {
    image = new Image('', {
      animate: false,
      height: 148,
      width: 148,
      style: 'embossed',
      placeholder: 'playlist'
    });
    els.cover.appendChild(image.node);
  }

  var initEvents = function() {
    models.application.addEventListener('arguments', onArgumentsLoad);
  };

  var addPlaylistEventListeners = function(playlist) {
    playlist.addEventListener('change:name', ifStillActive(onChangeName));
    playlist.addEventListener('change:subscribed', ifStillActive(onChangeSubscribed));
  };

  var removePlaylistEventListeners = function(playlist) {
    playlist.removeEventListener('change:name', ifStillActive(onChangeName));
    playlist.removeEventListener('change:subscribed', ifStillActive(onChangeSubscribed));
  };

  var onChangeName = function(e) {
    updateName(activePlaylist);
  };

  var checkArguments = function() {
    models.application.load('arguments').done(onArgumentsLoad).fail(onArgumentsLoadFail);
  };


  var onArgumentsLoad = function() {
    var playlistURI = models.application.arguments.join(':');

    if (activePlaylist) {
      removePlaylistEventListeners(activePlaylist);
    }

    activePlaylist = models.Playlist.fromURI(playlistURI);
    reset();

    loadPlaylist(activePlaylist);
    addPlaylistEventListeners(activePlaylist);
  };

  var onArgumentsLoadFail = function() {
    console.error('fail');
  };

  var reset = function() {
    image._resetImage();

    els.title.textContent = '';
    els.title.removeAttribute('href');
    els.desc.textContent = '';

    els.followersImages.innerHTML = '';

    els.ownerName.textContent = '';
    els.ownerName.removeAttribute('href');

    setNumberOfFollowers(0);
    els.numberOfTracks.textContent = '';

    for (var componentName in drawerComponents) {
      var component = drawerComponents[componentName];
      var node = component.node || component;

      node.style.display = 'none';
    }

  };

  function createUserImage(user) {
    return new Image(user, {
      animate: true,
      width: 42,
      height: 42,
      style: 'embossed',
      link: user && user.uri || 'spotify:',
      placeholder: 'user'
    });
  };

  function Follower(user, overrideName) {

    var image = createUserImage(user);

    var popover = document.createElement('div');
    popover.className = 'name-popover';
    popover.textContent = overrideName || user.name || '';
    image.node.appendChild(popover);

    return image.node;

  }

  var updateButtons = function(playlist) {


    playlist.load('owner').done(ifStillActive(function() {
      var currentuserPromise = playlist.owner.load('currentUser');
      currentuserPromise.done(ifStillActive(function(owner) {
        if (owner.currentUser !== true) {
          drawerComponents.subscribeButton.setItem(playlist);
          drawerComponents.subscribeButton.node.style.display = '';
        }
        recalculateMinWidth();
      }));
    }));

    drawerComponents.startRadioButton.item = playlist;
    drawerComponents.startRadioButton.node.style.display = '';

    drawerComponents.shareButton.item = playlist;
    drawerComponents.shareButton.node.style.display = '';

    checkPlaylistOfflineCapability(playlist).done(ifStillActive(function(offlineCapable) {
      if (offlineCapable) {
        offline.getSyncState(playlist).done(function(syncState) {
          toggleOfflineButton(syncState.enabled);

          drawerComponents.offlineButton.style.display = '';
          recalculateMinWidth();
        });
      } else {
        drawerComponents.offlineButton.style.display = 'none';
        recalculateMinWidth();
      }
    }));

    recalculateMinWidth();
  };

  var checkPlaylistOfflineCapability = function(playlist) {
    var promise = new models.Promise();
    var sessionCapabilitiesPromise = models.session.load('capabilities');
    var playlistAllowsPromise = playlist.load('allows', 'subscribed');

    models.Promise.join([
      sessionCapabilitiesPromise,
      playlistAllowsPromise
    ]).done(ifStillActive(function(promises) {
      // We shouldn't have to check playlist.subscribed here, but as there's a bug in
      // playlist.allows.offlineSync on the native side, we'll have to resort to this
      // quick fix until a fixed client can be pushed.
      var canOffline = playlist.subscribed && models.session.capabilities.offlineSync && playlist.allows.offlineSync;
      promise.object = canOffline;
      promise.setDone();
    })).fail(function(res, err) {
      promise.setFail(err);
    });

    return promise;
  };

  var updateIncludedArtists = function(playlist) {
    getIncludedArtists(playlist).done(ifStillActive(function(artists) {
      var artistLinks = artists.map(function(artist) {
        return '<a href="' + artist.uri + '">' + artist.name.decodeForHtml() + '</a>';
      });

      els.desc.innerHTML = [
        '<div class="including-artists">',
        L('IncludingArtists'),
        ': ',
        artistLinks.join(', '),
        '</div>'
      ].join('');

    })).fail(function(res, err) {
      console.error(err && err.message, err);
    });
  };

  var getIncludedArtists = function(playlist) {
    var promise = new models.Promise();
    var onFail = function(res, message) {
      promise.setFail(message || res);
    };

    playlist.load('tracks').done(ifStillActive(function() {
      var tracksSnapshotPromise = playlist.tracks.snapshot(0, 24);
      tracksSnapshotPromise.done(ifStillActive(function(snapshot) {
        if (snapshot.length) {
          snapshot.loadAll('artists').done(ifStillActive(function(arr) {
            var artistPromises = arr.map(function(track) {
              return track.artists[0].load('name', 'uri');
            });

            var artistsPromise = models.Promise.join(artistPromises);
            artistsPromise.done(ifStillActive(function(artists) {
              var filteredArtists = [];
              var usedArtistURIs = [];
              artists.forEach(function(artist) {
                var hasUriAndName = artist.uri && artist.name;
                var isUsed = ~usedArtistURIs.indexOf(artist && artist.uri);
                if (hasUriAndName && !isUsed) {
                  usedArtistURIs.push(artist.uri);
                  filteredArtists.push(artist);
                }
              });

              var slicedArtists = filteredArtists.slice(0, 8);
              promise.object = slicedArtists;
              promise.setDone();
            })).fail(onFail);
          })).fail(onFail);
        } else {
          onFail('No tracks available');
        }
      })).fail(onFail);
    })).fail(onFail);

    return promise;
  };

  var updateImage = function(playlist) {
    playlist.load('image').done(ifStillActive(setImage));
  };

  var setImage = function(playlist) {
    if (playlist.image) {
      image.setImage(playlist.image);
    } else {
      image._resetImage();
    }
  }

  var updateFollowers = function(playlist) {
    playlist.load('subscribers', 'owner').done(ifStillActive(onSubscribersLoad));
  };

  var onSubscribersLoad = function(playlist) {
    playlist.subscribers.snapshot(0, 0).done(ifStillActive(function(snapshot) {
      setNumberOfFollowers(snapshot.length);
    }));

    var MAX_SUBSCRIBERS = 100;
    var relations = Relations.forCurrentUser();

    models.Promise.join([
      playlist.subscribers.snapshot(0, MAX_SUBSCRIBERS),
      relations.subscribers.snapshot(0, MAX_SUBSCRIBERS),
      relations.subscriptions.snapshot(0, MAX_SUBSCRIBERS),
      models.session.user.load('username', 'uri'),
      playlist.load('subscribed'),
      playlist.owner.load('currentUser')
    ]).done(ifStillActive(onFollowersData));
  }

  var setNumberOfFollowers = function(n) {
    numberOfFollowers = n;
    els.followersLabel.textContent = n === 1 ? L('Follower') : L('Followers');
    els.followersNumber.textContent = i18n.number(n);
  };

  var onFollowersData = function(res) {

    var playlistSubscribersSnapshot = res[0];
    var relationsSubscribersSnapshot = res[1];
    var relationsSubscriptionsSnapshot = res[2];
    var sessionUser = res[3];
    var playlist = res[4];
    var owner = res[5];

    var playlistSubscribers = playlistSubscribersSnapshot.toURIs();
    var relationSubscribers = relationsSubscribersSnapshot.toURIs();
    var relationSubscriptions = relationsSubscriptionsSnapshot.toURIs();

    var me;
    if (owner.currentUser === false) {
      var meURI = 'spotify:user:' + (sessionUser && sessionUser.username || '');
      var meIndex = playlistSubscribers.indexOf(meURI);
      if (meIndex !== -1) {
        me = playlistSubscribers.splice(meIndex, 1)[0];
      } else if (playlist.subscribed) {
        me = sessionUser.uri;
      }
    }


    var scoredSubscribers = playlistSubscribers.reverse().map(function(URI) {
      var relationSubscriberScore = relationSubscribers.indexOf(URI) === -1 ? 0 : 1;
      var relationSubscriptionScore = relationSubscriptions.indexOf(URI) === -1 ? 0 : 2;
      return [relationSubscriberScore + relationSubscriptionScore, URI];
    });

    var sortedSubscribers = scoredSubscribers.sort().map(function(arr) {
      return arr[1];
    });

    if (me) {
      sortedSubscribers.unshift(me);
    }

    var limitedSubscribers = sortedSubscribers.slice(0, 30);

    var hasImages = 0;
    var loaded = 0;

    var onSubscriberLoad = ifStillActive(function(user) {
      loaded++;
      if (checkImage(user.image) && hasImages < 3) {
        hasImages++;
        var overrideName;
        var userEl;
        if (user.uri === me) {
          userEl = meFollowerEl;
          els.followersImages.appendChild(userEl);
        } else {
          userEl = new Follower(user, overrideName);
          els.followersImages.insertBefore(userEl, els.followersImages.firstChild);
        }
      }
    });

    limitedSubscribers.forEach(function(subscriberURI) {
      var user = models.User.fromURI(subscriberURI);
      var userPromise = user.load('name', 'image', 'username', 'uri');
      userPromise.done(onSubscriberLoad);
    });
  };


  var checkImage = function(image) {
    return image && !(/.*fbcdn.*\.gif$/.test(image));
  };

  var updateName = function(playlist) {
    playlist.load('name').done(ifStillActive(setName));
  };

  var setName = function(playlist) {
    var name = '';
    if (playlist.name) {
      name = playlist.name;
    } else if (/:starred$/.test(playlist.uri)) {
      name = L('Starred');
    } else if (/:toplist$/.test(playlist.uri)) {
      name = L('TopTracks');
    }

    els.title.setAttribute('href', playlist.uri);
    els.title.textContent = name;
  };

  var updateDescription = function(playlist) {
    playlist.load('description').done(ifStillActive(setDescription));
  };

  var setDescription = function(playlist) {
    els.desc.innerHTML = sanitizeDescription(playlist.description);
  };

  var updateNumberOfTracks = function(playlist) {
    playlist.load('tracks').done(ifStillActive(onTracksLoad));
  };

  var onTracksLoad = function(playlist) {
    playlist.tracks.snapshot(0, 0).done(ifStillActive(onTracksSnapshot));
  }

  var onTracksSnapshot = function(snapshot) {
    var numberOfTracksFormatted = i18n.number(snapshot.length);
    var trackStr = snapshot.length === 1 ? L('Track') : L('Tracks');
    els.numberOfTracks.textContent = numberOfTracksFormatted + ' ' + trackStr;
    recalculateMinWidth();
  };

  var updateOwner = function(playlist) {
    playlist.load('owner').done(ifStillActive(onOwnerLoad));
  };

  var onOwnerLoad = function(playlist) {
    playlist.owner.load('name', 'currentUser', 'image').done(ifStillActive(setOwner));
  };

  var setOwner = function(user) {
    var byText = '';
    var name;
    if (user.currentUser) {
      byText = L('ByYou');
    } else if ((name = user.name || user.username)) {
      byText = L('By') + ' ' + name;
    }
    els.ownerName.textContent = byText;
    els.ownerName.href = user.uri;
  };

  var hideThrobber = function() {
    if (!throbberHidden) {
      els.throbber.style.display = 'none';
      throbberHidden = true;
    }
  };

  var recalculateMinWidth = function() {
    var before = els.buttons.style.right || 0;
    els.buttons.style.right = 'auto';
    var buttonDrawerWidth = els.buttons.offsetWidth;
    els.buttons.style.right = before;
    els.content.style.minWidth = buttonDrawerWidth + 'px';
  };

  var updateDescriptionOrIncludedArtists = function(playlist) {
    playlist.load('description').done(ifStillActive(function() {
      if (playlist.description) {
        updateDescription(playlist);
      } else {
        updateIncludedArtists(playlist);
      }
    })).fail(function() {
      updateIncludedArtists(playlist);
    });
  }

  var loadPlaylist = function(playlist) {

    if (!drawerComponents) {
      drawerComponents = initDrawerComponents(playlist);
    }

    updateImage(playlist);
    updateName(playlist);
    updateDescriptionOrIncludedArtists(playlist);

    updateButtons(playlist);
    updateNumberOfTracks(playlist);
    updateOwner(playlist);


    setTimeout(ifStillActive(updateFollowers), 0, playlist);

    hideThrobber();

  };

  var initDrawerComponents = function(playlist) {
    var offlineButton = document.createElement('button');
    offlineButton.className = 'offline-button';
    offlineButton.textContent = L('AvailableOffline');
    offlineButton.addEventListener('click', onOfflineButtonClick, false);

    var components = {
      subscribeButton: buttons.SubscribeButton.forPlaylist(playlist),
      startRadioButton: buttons.StartRadioButton.forPlaylist(playlist),
      shareButton: buttons.ShareButton.forPlaylist(playlist),
      offlineButton: offlineButton
    };

    for (var componentName in components) {
      var component = components[componentName];
      var node = component.node || component;

      node.style.display = 'none';
      els.buttons.appendChild(node);
    }

    els.buttons.insertBefore(els.numberOfTracks, components.offlineButton);
    return components;
  };

  var onOfflineButtonClick = function() {
    offline.getSyncState(activePlaylist).done(ifStillActive(function(syncState) {
      var believedSyncStateEnabled = drawerComponents.offlineButton.classList.contains('turn-on');

      // If the state of the button doens't reflect the real state, update the
      // button without doing anything.
      if (believedSyncStateEnabled !== syncState.enabled) {
        toggleOfflineButton(syncState.enabled);
        return;
      }

      var newSyncStateEnabled = !syncState.enabled;

      if (newSyncStateEnabled) {
        toggleOfflineButton(true);
        offline.enableSync(activePlaylist).fail(function() {
          toggleOfflineButton(false);
        });
      } else {
        toggleOfflineButton(false);
        offline.disableSync(activePlaylist).fail(function() {
          toggleOfflineButton(true);
        });
      }

      drawerComponents.offlineButton.style.display = '';
    })).fail(function(res, err) {
      console.error('failed to get sync state for: ', activePlaylist);
    });
  };

  var toggleOfflineButton = function(shouldBeOn) {
    if (shouldBeOn) {
      drawerComponents.offlineButton.classList.add('turn-on');
    } else {
      drawerComponents.offlineButton.classList.remove('turn-on');
    }
  };

  var isPlaylistActive = function(candidatePlaylist) {
    return candidatePlaylist.uri === activePlaylist.uri;
  };

  /**
   * Wrap a function in a checking function to see whether the same playlist is
   * still active when the check runs as when the original function was passed,
   * and only run the original function if true.
   *
   * @param  {Function} fn The function to run if same playlist still active.
   * @return {Function}    The check function which will only run the original
   *                       function if the same playlist is still active.
   */
  var ifStillActive = function(fn) {
    var candidatePlaylist = activePlaylist;
    return function() {
      if (isPlaylistActive(candidatePlaylist)) {
        fn.apply(this, arguments);
      }
    };
  };

  var onChangeSubscribed = function(e) {
    if (e.target.subscribed) {
      if (els.followersImages.childNodes.length >= 3) {
        // Note that followersImages are now floated right so they're inversed.
        els.followersImages.removeChild(els.followersImages.firstChild);
      }
      els.followersImages.appendChild(meFollowerEl);
      setNumberOfFollowers(numberOfFollowers + 1);

      // This is a quick fix for showing the "Available Offline" button when
      // the user subscribes to a playlist. This will be handled through
      // playlist.allows.offlineSync events when these are available in an
      // upcoming client.
      updateButtons(activePlaylist);
    } else {
      els.followersImages.removeChild(meFollowerEl);
      setNumberOfFollowers(Math.max(0, numberOfFollowers - 1));

      // This is a quick fix for hiding the "Available Offline" button when
      // the user unsubscribes from a playlist. This will be handled through
      // playlist.allows.offlineSync events when these are available in an
      // upcoming client.
      updateButtons(activePlaylist);
    }
  };

  init();

});
