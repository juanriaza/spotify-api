/**
 * @fileoverview The main UI logic for the Share popup.
 */

'use strict';

exports.main = main;

var sp = getSpotifyApi();

var lang = sp.require('$util/language');
var logger = sp.require('$util/logger');
var models = sp.require('$api/models');
var share = sp.require('assets/scripts/share');
var social = sp.require('$unstable/social');
var ui = sp.require('$unstable/ui');
var view = sp.require('assets/scripts/view');

var catalog = lang.loadCatalog('assets/share'),
    _ = partial(lang.getString, catalog, 'Share widget');

/**
 * Log a Share popup event.
 * @param {string} event The event to log.
 * @param {Object} data A JavaScript object containing the data to log.
 */
function log(event, data) {
  logger.logClientEvent('SharePopup', event, '2', '', data);
}

/*
 * The link to the Spotify resource that is being shared.
 * @type {module:api/models~Link}
 */
var link;

// Link types to model classes map.
var lookups = {
  '1': models.Artist,
  '2': models.Album,
  '4': models.Track,
  '5': models.Playlist,
  '11': {fromURI: starredPlaylist}
};

// Load preferred networks from local storage.
// Set default to all networks. The ones that aren't connected get deselected later.
var preferredNetworks = ['facebook', 'twitter', 'tumblr'];

// Run this after a share is terminated by clicking a button.
function clearState() {
  delete localStorage.message;
  delete localStorage.resource;
  delete localStorage.view;
}

// Entry point for the Share popup code.
var urlTitle = '';
var args = sp.core.getArguments();
function main() {
  log('Open', {uris: args});

  // Load localization.
  var translate = document.querySelectorAll('[data-string]');
  Array.prototype.forEach.call(translate, function(element) {
    var attr = element.dataset.attribute;
    var string = _(element.dataset.string).decodeForText();

    if (attr) {
      element.setAttribute(attr, string);
    } else {
      element.textContent = string;
    }
  });

  // Close the share popup when hitting Escape.
  document.addEventListener('keypress', function(evt) {
    if (evt.keyCode == 27) {
      sp.social.hideSharePopup();
    }
  });

  // Handle tab clicks.
  var tabs = document.getElementById('tabs');
  tabs.addEventListener('click', function(evt) {
    var container = evt.target.dataset.container;
    if (!container) return;
    view.show(container);
  });

  // Close the popup if the user hits "Cancel".
  var buttons = document.querySelectorAll('.cancel');
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', function() {
      clearState();
      sp.social.hideSharePopup();
    });
  }

  // Get the resource that is being shared.
  // TODO(blixt): Support multiple resources (in case of multi-select.)
  try {
    link = new models.Link(unescape(args[0]));
  } catch (e) {
    sp.social.hideSharePopup();
    return;
  }

  // Support recovery of the message if the share dialog was open with the same resource last time, but closed without
  // actually posting.
  var message = '', defaultView = 'share';
  if (link.toString() == localStorage.resource) {
    // Recover the message.
    message = localStorage.message || '';
    // Set the view.
    if (localStorage.view) {
      defaultView = localStorage.view;
    }
  } else {
    clearState();

    // Store the resource that is being shared.
    localStorage.resource = link.toString();
  }

  // Set up message fields to use the recovery above.
  Array.prototype.forEach.call(document.querySelectorAll('.message'), function(field) {
    field.value = message;
    // Further updates of the fields will change the message stored.
    field.addEventListener('keyup', function() {
      localStorage.message = this.value;
    });
  });

  // Metadata elements.
  var cover = document.getElementById('cover');
  var title = document.getElementById('title');
  var extra = document.getElementById('extra');
  var extraPrefix = document.getElementById('extra-prefix');

  // Look up the resource.
  var resourceClass = lookups[link.type];
  if (!resourceClass) {
    var key;
    if (link.type == 9) {
      key = 'errorLocalFile';
    } else {
      key = 'errorUnsupportedType';
    }
    //errorView.show(_(key).decodeForText());
    // TODO(blixt): Once translated, use line above.
    // Also change "Close" button in HTML!
    errorView.show('Sorry, local files cannot be shared.');
    return;
  }

  resourceClass.fromURI(link.uri, function(resource) {
    // Create an image element (default to quavers if no image is available.)
    var img = new ui.SPImage(resource.image || 'sp://resources/img/missing-artwork-142.png');
    cover.appendChild(img.node);

    urlTitle = title.textContent = resource.name.decodeForText();

    // Figure out a good reference resource to show below the title of the resource.
    var ref, subTitle;
    if (resource.artists) {
      ref = resource.artists[0];
      subTitle = resource.artists.map(function(artist) { return artist.name; }).join(', ');
    } else if (resource.artist) {
      ref = resource.artist;
      subTitle = ref.name;
    } else if (resource.owner) {
      extraPrefix.textContent = _('playlistByPrefix').decodeForText() + ' ';
      ref = resource.owner;
      subTitle = ref.displayName;
    } else {
      // ... or fail trying.
      return;
    }
    extra.href = ref.uri;
    extra.textContent = subTitle.decodeForText();
  });

  // Show the default view (which is usually "Share", but can be "Send" depending on stored state).
  try {
    view.show(defaultView);
  } catch (e) {
    console.warn('Tried opening a view that does not exist: ' + defaultView);
    view.show('share');
  }
}

// Check the connected state of social networks. Takes a callback that will return a map of network id to user's
// name (or false if not connected.)
var updateNetworks = (function() {
  var networks;
  share.addEventListener('networkschange', function(evt) {
    networks = evt.info;
  });
  share.getInfo();

  return function(cb) {
    // Simulate the networkschange event if it has already occurred.
    if (networks) {
      cb({type: 'networkschange', info: networks});
    }

    // Also keep track of future network changes.
    share.addEventListener('networkschange', cb);
  };
})();

// Define the "Share" view.
var shareView = new view.View('share', {
  // Propagate message contents to the "Send to a friend" view when this view is hiding.
  onhide: function() {
    document.querySelector('#send .message').value = this.node.querySelector('.message').value;
  },

  onshow: function() {
    localStorage.view = 'share';
    this.refreshShareTo();
  },

  prepare: function(node) {
    var message = node.querySelector('.message');
    var shareButton = node.querySelector('.share');

    var networks = document.getElementById('networks');
    var networkItems = networks.querySelectorAll('[data-network]');
    var enabledNetworks = {};

    function refreshShareTo() {
      for (var network in enabledNetworks) {
        if (enabledNetworks[network] === false) {
          networks.querySelector('[data-network=' + network + ']').classList.remove('selected');
        }
      }
      shareButton.disabled = !getSelectedNetworks().length;
    }
    this.refreshShareTo = refreshShareTo;

    // Unselect networks that have not been connected.
    updateNetworks(function(evt) {
      enabledNetworks = evt.info;
      refreshShareTo();
      // Once all networks update, we should log state of all networks
      var allNetworksUpdated = true;
      var connectedAs = [];
      for (var network in enabledNetworks) {
        if (enabledNetworks[network] === undefined) {
          // undefined state is indicative of network not having updated yet
          allNetworksUpdated = false;
          break;
        } else if (enabledNetworks[network] !== false) {
          // false state is indicative of network not having connected/authenticated yet
          // So, if it's not undefined state or false state, the user is connected to network
          connectedAs.push(network + ':' + enabledNetworks[network]);
        }
      }
      if (allNetworksUpdated) {
        log('Connected', {networks: connectedAs});
      }
    });

    // Fetch networks that have been selected.
    function getSelectedNetworks() {
      var networks = [];
      Array.prototype.forEach.call(networkItems, function(item) {
        if (item.classList.contains('selected')) {
          networks.push(item.dataset.network);
        }
      });
      return networks;
    }

    // Pre-set the states of networks based on the user's preference.
    Array.prototype.forEach.call(networkItems, function(item) {
      if (preferredNetworks.indexOf(item.dataset.network) >= 0) {
        item.classList.add('selected');
      }
    });

    // Toggle networks when they are clicked.
    networks.addEventListener('click', function(evt) {
      var item = evt.target;
      while (!item.dataset || !item.dataset.network) {
        item = item.parentNode;
        if (!item || item == networks) { return; }
      }

      if (!item.classList.contains('selected') && !enabledNetworks[item.dataset.network]) {
        // This network requires the user to connect.
        view.show('options');
        return;
      }

      item.classList.toggle('selected');

      // Make the "Share" button disabled if no networks are selected.
      shareButton.disabled = !getSelectedNetworks().length;
    });

    // Handle clicks on the options button.
    node.querySelector('#share-options').addEventListener('click', function() {
      view.show('options');
    });

    // Handle clicks on the "Share" button.
    shareButton.addEventListener('click', function() {
      document.body.classList.add('sending');

      // Disable the button.
      this.disabled = true;

      // Post the message.
      var networks = getSelectedNetworks();
      share.post(message.value, urlTitle, link.toURL(), networks);

      // Remember preferences.
      localStorage.networks = networks.join(',');

      // Log the share.
      log('Share', {uris: args, networks: networks, message: message.value});

      // Forget stored message, etc.
      clearState();

      // Close popup after a slight delay.
      setTimeout(function() {
        sp.social.hideSharePopup();
      }, 240);
    });
  }
});

// Define the "Share to a friend" view.
var sendView = new view.View('send', {
  calculateSize: function() {
    return [300, 275 + document.getElementById('user-list').offsetHeight];
  },

  // Propagate message contents to the "Share" view when this view is hiding.
  onhide: function() {
    document.querySelector('#share .message').value = this.node.querySelector('.message').value;
  },

  onshow: function() {
    localStorage.view = 'send';
  },

  prepare: function(node) {
    var AUTOCOMPLETE_RESULTS = 4;

    var userIndex = sp.social.relations.all();
    var userData = [];

    var sendButton = node.querySelector('.send');
    var userList = document.getElementById('user-list');
    var input = userList.querySelector('input');
    var resultsList = document.getElementById('user-results');
    var resultsItems;

    // Start decorating the index.
    var concurrent = 0;
    function decorate(i) {
      var uri = userIndex[i];

      models.User.fromURI(uri, function(user) {
        var username = (user.canonicalName || '').decodeForText(),
            name = (user.displayName || '').decodeForText(),
            uid = user.data.facebookUid || '';

        userData[i] = [i, username, uid, name || username, user.data.icon];
        userIndex[i] = (username + ' ' + name).toLowerCase();
      });
    }

    for (var i = 0; i < userIndex.length; i++) {
      // Call decorate with the current value of i scoped.
      setTimeout(function(i) { decorate(i); }(i), i);
    }

    // Adds a user to the recipient list.
    function addUser(data) {
      var node = document.createElement('span');
      node.className = 'user';
      node.textContent = data[3];
      node.dataset.user = data[0];

      var deleteNode = document.createElement('span');
      deleteNode.className = 'delete';
      deleteNode.innerHTML = '&times;';
      node.appendChild(deleteNode);

      userList.insertBefore(node, input);

      input.placeholder = '';
      sendButton.disabled = false;

      sendView.resize();
    }

    function updateInput() {
      if (!userList.querySelectorAll('.user').length) {
        input.placeholder = _(input.dataset.string).decodeForText();
        input.size = 50;
        sendButton.disabled = true;
      }
    }

    function removeUser(node) {
      if (!node || !node.dataset.user) return;
      if (!userList.removeChild(node)) return;
      updateInput();

      sendView.resize();
    }

    function resetInput() {
      input.value = '';
      results = null;
      resultsList.style.display = '';
      updateInput();
    }

    userList.addEventListener('click', function(evt) {
      var target = evt.target;

      // Focus the small input field when the user list container is clicked.
      if (target == this) {
        input.focus();
      }

      // Handle user removal using the X in the user list.
      if (target.classList.contains('delete')) {
        removeUser(target.parentNode);
      }
    });

    // Handle changes in the input field.
    input.addEventListener('keypress', keyHandler);
    input.addEventListener('keyup', keyHandler);

    var results, searchValue;
    function keyHandler(evt) {
      if (input.value != searchValue) {
        searchValue = input.value;
        input.size = 1 + Math.round(searchValue.length * 1.3);
      } else {
        return;
      }

      sendView.resize();

      if (!searchValue) {
        resetInput();
        return;
      }

      // Split each word in the search query up into a seperate query.
      var queries = searchValue.toLowerCase().split(' '), ql = queries.length;
      // Use the first word as the main query.
      var query = queries[0];
      var a = 0, b = 0;

      // Start scanning the user index.
      results = [];
      for (var i = 0; i < userIndex.length; i++) {
        var value = userIndex[i];
        var idx = value.indexOf(query);

        // Skip all entries that don't match the query at all.
        if (idx == -1) continue;

        // Check the remaining queries.
        // TODO(blixt): This should be doing some weighting to float better matches to the top.
        var c = false;
        for (var j = 1; j < ql; j++) {
          if (value.indexOf(queries[j]) == -1) {
            c = true;
            break;
          }
        }
        // Skip if the queries didn't match, or if there is no data available for this user.
        if (c || !userData[i]) continue;

        // Also skip this user if they've already been added to the user list.
        if (userList.querySelector('span[data-user="' + i + '"]')) continue;

        if (idx == 0 || value[idx - 1] == ' ') {
          // Value was found in the beginning of the name (A-grade result).
          results.splice(a++, 0, userData[i]);
          // Stop looking for matches once enough good matches have been found.
          if (a == AUTOCOMPLETE_RESULTS) break;
        } else if (a + b++ < AUTOCOMPLETE_RESULTS) {
          // B-grade result, filler material. Don't fill if we already have enough entries.
          // Continue searching for more A-grade results, though.
          results.push(userData[i]);
        }
      }

      // Clear results list.
      resultsList.innerHTML = '';
      resultIndex = 0;

      // Show the topmost results in the results list.
      results.slice(0, AUTOCOMPLETE_RESULTS).forEach(function(result, idx) {
        // Show the username if it matched the search query.
        var showUsername = false;
        for (var i = 0; i < ql; i++) {
          // Check if the full name contains the query word.
          if (result[3].toLowerCase().indexOf(queries[i]) == -1) {
            // If it doesn't, show the username to make it obvious it was part of the match.
            showUsername = true;
            break;
          }
        }

        // Create a result element.
        var node = document.createElement('li');
        if (idx == 0) node.className = 'selected';
        node.dataset.user = result[0];

        // Add the profile image.
        node.innerHTML = '<div class="image" style="background-image: url(' + result[4] + ');"></div>';

        // Add the name.
        var nameNode = document.createElement('span');
        nameNode.className = 'name';
        nameNode.textContent = result[3];
        node.appendChild(nameNode);

        // Add a username element if username should be shown.
        if (showUsername) {
          var usernameNode = document.createElement('span');
          usernameNode.textContent = result[1];
          usernameNode.className = 'username';
          node.appendChild(usernameNode);
        }
        // Add the result element to the list.
        resultsList.appendChild(node);
      });
      resultsItems = resultsList.querySelectorAll('li');

      // Or if the list was empty, just add one item telling the user there were no results.
      if (!results.length) {
        var node = document.createElement('li');
        node.className = 'no-results';
        // TODO(blixt): Translate this. (See accompanying TODO in CSS.)
        node.textContent = 'No user could be found.';
        resultsList.appendChild(node);
      }

      resultsList.style.display = 'block';
    }

    // Clear the field if it loses focus.
    input.addEventListener('blur', resetInput);

    // Handle hovering of results items.
    resultsList.addEventListener('mouseover', function(evt) {
      var item = evt.target;
      if (!item.dataset.user) return;

      resultsItems[resultIndex].classList.remove('selected');
      item.classList.add('selected');
      resultIndex = Array.prototype.indexOf.call(resultsItems, item);
    });

    // Handle clicking of elements.
    resultsList.addEventListener('mousedown', function(evt) {
      var item = evt.target;
      console.log(item);
      while (!item.dataset.user) {
        item = item.parentNode;
        if (!item || item == this) return;
      }

      addUser(userData[item.dataset.user]);
      setTimeout(function() { input.focus(); }, 100);
    });

    // Handle special key presses.
    var resultIndex = 0;
    input.addEventListener('keydown', function(evt) {
      if (results && results.length) {
        var oldIndex = resultIndex;
        switch (evt.keyCode) {
          case 9: // Tab
          case 13: // Return
          case 188: // Comma
            // Add the currently selected user to the list.
            var userIndex = resultsItems[resultIndex].dataset.user;
            addUser(userData[userIndex]);
            resetInput();
            break;
          case 38: // Up
            resultIndex--;
            if (resultIndex < 0) resultIndex = results.length - 1;
            break;
          case 40: // Down
            resultIndex++;
            if (resultIndex >= results.length) resultIndex = 0;
            break;
          default:
            return;
        }

        // Change the selected list item.
        if (oldIndex != resultIndex) {
          resultsItems[oldIndex].classList.remove('selected');
          resultsItems[resultIndex].classList.add('selected');
        }
      } else if (!input.value) {
        switch (evt.keyCode) {
          case 8: // Backspace
            var lastUser = userList.querySelector('.user:last-of-type');
            removeUser(lastUser);
            break;
          default:
            return;
        }
      } else {
        return;
      }

      evt.preventDefault();
    });

    // Handle clicks on the "Send" button.
    sendButton.addEventListener('click', function() {
      document.body.classList.add('sending');

      // Disable the button.
      this.disabled = true;

      // Post the message.
      var uids = [], spotifyUsers = [];
      var message = node.querySelector('.message').value;
      var uri = link.toString();
      Array.prototype.forEach.call(userList.querySelectorAll('.user'), function(user) {
        var data = userData[user.dataset.user];
        if (data[1]) {
          spotifyUsers.push(data[1]);
          sp.social.sendToInbox(data[1], message, uri, {
            onSuccess: function() {}
          });
        }
        if (data[2]) uids.push(data[2]);
      });

      if (uids.length) {
        social.sendFacebookMessage(uids, message, link.toURL());
      }

      // Log the send.
      log('Send', {uris: args, fb_uids: uids, spotify_users: spotifyUsers, message: message});

      // Forget stored message, etc.
      clearState();

      // Close popup after a slight delay.
      setTimeout(function() {
        sp.social.hideSharePopup();
      }, 240);
    });
  }
});

// Define the "Sharing options" view.
var optionsView = new view.View('options', {
  calculateSize: function() {
    var node = document.getElementById('options');

    var totalHeight = 0;
    for (var i = 0; i < node.childNodes.length; i++) {
      var height = node.childNodes[i].offsetHeight;
      if (!height) continue;
      totalHeight += height;
    }

    return [300, Math.max(100 + totalHeight, 300)];
  },

  onshow: function() {
    // Reset state texts.
    this.updateStates();

    // Empty all fields.
    Array.prototype.forEach.call(this.node.querySelectorAll('input'), function(input) {
      input.value = '';
    });
  },

  prepare: function(node) {
    // Update the state texts (connected/not connected) for the social networks.
    var enabled = null;
    this.updateStates = function() {
      if (!enabled) return;
      for (var network in enabled) {
        var networkNode = node.querySelector('[data-network=' + network + ']');
        var stateNode = networkNode.querySelector('.state');
        networkNode.classList.remove('error');

        if (enabled[network]) {
          networkNode.classList.add('connected');
          networkNode.classList.remove('unknown');

          var format;
          if (network == 'tumblr') {
            format = _('optionsStateTumblrPostingTo');
          } else {
            format = _('optionsStateConnectedAs');
          }
          stateNode.textContent = lang.format(format.decodeForText(), enabled[network]);
        } else {
          networkNode.classList.remove('connected');
          if (enabled[network] === false) {
            networkNode.classList.remove('unknown');
            stateNode.textContent = _('optionsStateNotConnected').decodeForText();
          } else {
            networkNode.classList.add('unknown');
            stateNode.textContent = _('optionsStateUnknown').decodeForText();
          }
        }
      }

      optionsView.resize();
    };

    updateNetworks(function(evt) {
      enabled = evt.info;
      optionsView.updateStates();
    });

    // Set elements up to connect to a network on password field unfocus.
    var ongoingConnects = 0, error = false;
    function fieldConnect(network) {
      var networkNode = node.querySelector('[data-network=' + network + ']');
      var stateNode = networkNode.querySelector('.state');
      var username = networkNode.querySelector('input[name=username]');
      var password = networkNode.querySelector('input[name=password]');

      function connectHandler() {
        // Don't try to connect if credentials are missing.
        if (!(username.value && password.value)) return;

        ongoingConnects++;
        share.connect(network, username.value, password.value,
            function() {
              password.value = '';
              username.disabled = false;
              password.disabled = false;
              networkNode.classList.remove('connecting');

              optionsView.resize();

              ongoingConnects--;

              // Check any network that the user successfully connects to.
              document.getElementById('networks').querySelector('[data-network=' + network + ']').classList.add('selected');

              log('Connect', {network: network});
            },
            function(code) {
              password.value = '';
              username.disabled = false;
              password.disabled = false;
              networkNode.classList.add('error');
              networkNode.classList.remove('connecting');
              stateNode.textContent = _(code == 5501 ? 'optionsConnectFailed' : 'optionsConnectError').decodeForText();

              optionsView.resize();

              error = true;
              ongoingConnects--;

              log('ConnectFail', {network: network, errorCode: code});
            });

        networkNode.classList.add('connecting');
        networkNode.classList.remove('error');
        username.disabled = true;
        password.disabled = true;
      }

      username.addEventListener('blur', connectHandler);
      username.addEventListener('keydown', function(evt) {
        if (evt.keyCode == 13) connectHandler();
      });
      password.addEventListener('blur', connectHandler);
      password.addEventListener('keydown', function(evt) {
        if (evt.keyCode == 13) connectHandler();
      });
    }

    fieldConnect('twitter');
    fieldConnect('tumblr');

    // Facebook's flow is handled outside the share popup.
    node.querySelector('[data-network=facebook] .connect').addEventListener('click', function() {
      sp.social.connectToFacebook();
    });

    // Set up disconnect buttons.
    Array.prototype.forEach.call(node.querySelectorAll('[data-network]'), function(networkNode) {
      var button = networkNode.querySelector('.disconnect button');
      if (!button) return;

      var network = networkNode.dataset.network;
      button.addEventListener('click', function() {
        button.disabled = true;
        share.disconnect(network,
            function() {
              log('Disconnect', {network: network});
              button.disabled = false;
            },
            function() {
              button.disabled = false;
            });
      });
    });

    // Make the "Back to sharing" button go to the "Share" view.
    node.querySelector('.back').addEventListener('click', function() {
      if (ongoingConnects) {
        // If currently connecting to a service, wait for the connect to finish before going back to the "Share" view.
        var button = this;
        button.disabled = true;

        error = false;
        var interval = setInterval(function() {
          if (!ongoingConnects) {
            button.disabled = false;
            clearInterval(interval);
            if (!error) view.show('share');
          }
        }, 200);

        return;
      }
      view.show('share');
    });
  }
});

// Define the "Error" view.
var errorView = new view.View('error', {
  calculateSize: function() {
    return [300, 50];
  },

  onshow: function(error) {
    this.node.querySelector('p').textContent = error;
  }
});

// Function for wrapping starred playlists since they're not currently supported by the API...
function starredPlaylist(uri, opt_callback) {
  var data;

  if (uri.toString() == sp.core.user.uri + ':starred') {
    // For the current user we can get all data for the starred playlist.
    data = {};

    // Copy the starred playlist into a pure JS object that can be manipulated.
    var starred = sp.core.getStarredPlaylist();
    for (var key in starred) {
      data[key] = starred[key];
    }

    // Add the URI property, which is currently hidden by the JS bridge.
    data.uri = uri;
  } else {
    // For other users we just have to mock most of the data.
    var loadHandlers = [];
    data = {
      add: function() {},
      addEventListener: function(type, handler) {
        if (type != models.EVENT.LOAD || loadHandlers.indexOf(handler) >= 0) return;
        loadHandlers.push(handler);
      },
      all: function() { return []; },
      collaborative: false,
      cover: '',
      description: '',
      get: function() { throw new Error('index is out of range'); },
      getDescription: function() { return ''; },
      getSubscribers: function() { return []; },
      getTrack: function() { throw new Error('index is out of range'); },
      length: 0,
      loaded: false,
      move: function() {},
      name: _('starredPlaylist'),
      owner: null,
      remove: function() { throw new Error('index is out of range'); },
      removeEventListener: function(type, handler) {
        if (type != models.EVENT.LOAD) return;
        if (handler) {
          var idx = loadHandlers.indexOf(handler);
          if (idx >= 0) loadHandlers.splice(idx, 1);
        } else {
          loadHandlers.length = 0;
        }
      },
      rename: function() {},
      subscriberCount: 0,
      type: 'playlist',
      uri: uri.toString()
    };

    sp.social.getUserByUsername(uri.split(':')[2], {
      onSuccess: function(user) {
        data.loaded = true;
        data.owner = user;
        loadHandlers.forEach(function(handler) { handler(); });
      }
    });
  }

  // Create a playlist object from the data and set up callbacks.
  var playlist = new models.Playlist(data);
  if (opt_callback) {
    if (playlist.loaded) {
      opt_callback(playlist);
    } else {
      playlist.observe(EVENT.LOAD, function observer() {
        opt_callback(playlist);
        playlist.ignore(EVENT.LOAD, observer);
      });
    }
  }

  return playlist;
}
