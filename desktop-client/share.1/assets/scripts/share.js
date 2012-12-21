/**
 * @fileoverview Module for handling connecting and posting to social networks.
 * @module share
 */

'use strict';

exports.addEventListener = addEventListener;
exports.connect = connect;
exports.disconnect = disconnect;
exports.getInfo = getInfo;
exports.post = post;
exports.removeEventListener = removeEventListener;

var sp = getSpotifyApi();

// Register the Hermes schemas.
sp.core.registerSchema([
  {
    name: 'TumblrAuthToken',
    fields: [
      {id: 1, type: 'string', name: 'token'},
      {id: 2, type: 'string', name: 'secret'}
    ]
  },
  {
    name: 'TumblrCredentials',
    fields: [
      {id: 1, type: 'string', name: 'email'},
      {id: 2, type: 'string', name: 'password'}
    ]
  },
  {
    name: 'TumblrPost',
    fields: [
      {id: 1, type: 'string', name: 'message'},
      {id: 2, type: 'string', name: 'spotifyLink'},
      {id: 3, type: 'TumblrAuthToken', name: 'authToken'},
      {id: 4, type: 'string', name: 'blogName'},
      {id: 5, type: 'string', name: 'linkTitle'}
    ]
  },
  {
    name: 'TumblrUserInfo',
    fields: [
      {id: 1, type: 'TumblrAuthToken', name: 'authToken'},
      {id: 2, type: 'string', name: 'blogName'}
    ]
  },
  {
    name: 'TwitterAuthToken',
    fields: [
      {id: 1, type: 'string', name: 'token'},
      {id: 2, type: 'string', name: 'secret'}
    ]
  },
  {
    name: 'TwitterCredentials',
    fields: [
      {id: 1, type: 'string', name: 'username'},
      {id: 2, type: 'string', name: 'password'}
    ]
  },
  {
    name: 'TwitterPost',
    fields: [
      {id: 1, type: 'string', name: 'message'},
      {id: 2, type: 'string', name: 'spotifyLink'},
      {id: 3, type: 'TwitterAuthToken', name: 'authToken'},
      {id: 4, type: 'string', name: 'linkTitle'}
    ]
  },
  {
    name: 'TwitterUserInfo',
    fields: [
      {id: 1, type: 'TwitterAuthToken', name: 'authToken'},
      {id: 2, type: 'string', name: 'screenName'},
      {id: 3, type: 'string', name: 'userId'}
    ]
  }
]);

/**
 * Stored credentials.
 */
var credentials = {};

/**
 * Event listeners.
 * @type {Object.<string, Array.<Function>>}
 */
var listeners = {};

/**
 * A map of social networks.
 * @type {Object}
 */
var networks = {
  facebook: {
    connect: function() {
      sp.social.connectToFacebook();
    },
    disconnect: function() {
      throw new Error('Cannot disconnect from Facebook using this module');
    },
    getName: function(credentials) {
      return credentials && sp.core.user.name.decodeForText();
    },
    getState: function(onsuccess, onerror) {
      var states = sp.social.serviceStates;
      for (var i = 0; i < states.length; i++) {
        if (states[i].servicename == 'facebook') {
          if (onsuccess) onsuccess(states[i].enabled);
          return;
        }
      }
      if (onerror) onerror();
    },
    post: function(message, urlTitle, url, credentials, onsuccess, onerror) {
      sp.social.postToFacebook(message, url, {
        onSuccess: function() {
          if (onsuccess) onsuccess();
        },
        onFailure: function() {
          if (onerror) onerror();
        }
      });
    }
  },
  tumblr: {
    connect: function(email, password, onsuccess, onerror) {
      var data = {email: email, password: password};
      hermes('POST', 'tumblr', 'enable', [['TumblrCredentials', data]], 'TumblrUserInfo', onsuccess, onerror);
    },
    disconnect: function(onsuccess, onerror) {
      hermes('POST', 'tumblr', 'disable', null, null, onsuccess, onerror);
    },
    getName: function(credentials) {
      if (credentials.blogName) {
        return credentials.blogName + '.tumblr.com';
      } else {
        return false;
      }
    },
    getState: function(onsuccess, onerror) {
      hermes('GET', 'tumblr', 'userinfo', [], 'TumblrUserInfo', onsuccess, onerror);
    },
    post: function(message, urlTitle, url, credentials, onsuccess, onerror) {
      var data = {
        message: message,
        spotifyLink: url,
        authToken: credentials.authToken,
        blogName: credentials.blogName,
        linkTitle: urlTitle
      };
      hermes('POST', 'tumblr', 'post', [['TumblrPost', data]], null, onsuccess, onerror);
    }
  },
  twitter: {
    connect: function(username, password, onsuccess, onerror) {
      var data = {username: username, password: password};
      hermes('POST', 'twitter', 'enable', [['TwitterCredentials', data]], 'TwitterUserInfo', onsuccess, onerror);
    },
    disconnect: function(onsuccess, onerror) {
      hermes('POST', 'twitter', 'disable', null, null, onsuccess, onerror);
    },
    getName: function(credentials) {
      if (credentials.screenName) {
        return '@' + credentials.screenName;
      } else {
        return false;
      }
    },
    getState: function(onsuccess, onerror) {
      hermes('GET', 'twitter', 'userinfo', [], 'TwitterUserInfo', onsuccess, onerror);
    },
    post: function(message, urlTitle, url, credentials, onsuccess, onerror) {
      var data = {
        message: message,
        spotifyLink: url,
        authToken: credentials.authToken,
        linkTitle: urlTitle
      };
      hermes('POST', 'twitter', 'post', [['TwitterPost', data]], null, onsuccess, onerror);
    }
  }
};

function addEventListener(type, handler) {
  if (listeners[type]) {
    if (listeners[type].indexOf(handler) >= 0) return;
    listeners[type].push(handler);
  } else {
    listeners[type] = [handler];
  }
}

function buildInfo() {
  var results = {};
  for (var network in networks) {
    if (network in credentials) {
      results[network] = networks[network].getName(credentials[network]);
    } else {
      results[network] = undefined;
    }
  }
  return results;
}

function connect(network, username, password, onsuccess, onerror) {
  networks[network].connect(username, password,
      function(reply) {
        credentials[network] = reply;
        if (onsuccess) onsuccess();
        dispatchEvent({type: 'networkschange', info: buildInfo()});
      },
      onerror);
}

function disconnect(network, onsuccess, onerror) {
  networks[network].disconnect(
      function() {
        credentials[network] = {};
        if (onsuccess) onsuccess();
        dispatchEvent({type: 'networkschange', info: buildInfo()});
      },
      onerror);
}

function dispatchEvent(evt) {
  var l = listeners[evt.type];
  if (!l) return;

  l.forEach(function(h) { h(evt); });
}

function getInfo(ondone) {
  var count = 0;

  function dec() {
    if (!--count) ondone(buildInfo());
  }

  Object.keys(networks).forEach(function(network) {
    count++;
    networks[network].getState(
        function(reply) {
          credentials[network] = reply;
          dispatchEvent({type: 'networkschange', info: buildInfo()});
          if (ondone) setTimeout(dec, 0);
        },
        function() {
          delete credentials[network];
          dispatchEvent({type: 'networkschange', info: buildInfo()});
          if (ondone) setTimeout(dec, 0);
        });
  });
}

function hermes(method, service, path, data, replyType, onsuccess, onerror) {
  if (!data) data = [];

  var uri = 'hm://' + service + '/' + path;
  console.log(method, uri);
  sp.core.getHermes(method, uri, data, {
    onSuccess: function(reply) {
      if (reply && replyType) {
        reply = sp.core.parseHermesReply(replyType, reply);
      } else {
        reply = undefined;
      }
      console.log('<', 200, method, uri);
      if (onsuccess) onsuccess(reply);
    },
    onFailure: function(code) {
      console.warn('<', code, method, uri);
      if (onerror) onerror(code);
    }
  });
}

/**
 * Posts a message to one or more social networks.
 * @param {string} message The message to send.
 * @param {string} urlTitle A title to show for the URL (for networks that need one).
 * @param {string} url The URL (Spotify resource) to attach to the message.
 * @param {Array.<string>} postTo A list of networks to post to.
 * @param {function(Object.<string, boolean>)} ondone A handler which will be called once all
 *     networks have been handled. It will be given an argument which is a map of the networks
 *     provided and a boolean indicating success.
 */
function post(message, urlTitle, url, postTo, ondone) {
  var results = {}, count = postTo.length;

  if (!count) {
    throw new Error('At least one social network must be selected.');
  }

  // An onsuccess/onerror handler generator.
  function handler(network, result) {
    return function() {
      if (network in results) {
        console.warn('Network registered twice in post');
      }
      results[network] = result;
      // Call the ondone handler once all results from sub-requests have been aggregated.
      if (!--count && ondone) ondone(results);
    };
  }

  for (var i = 0; i < postTo.length; i++) {
    var network = postTo[i];

    var fail = handler(network, false);
    if (!networks[network] || !credentials[network]) {
      // Fail early if network does not have a handler or credentials.
      fail();
      continue;
    }

    networks[network].post(
        message,
        urlTitle,
        url,
        credentials[network],
        handler(network, true),
        fail);
  }
}

function removeEventListener(type, handler) {
  var l = listeners[type];
  if (!l) return;

  if (handler) {
    var idx = l.indexOf(handler);
    if (idx >= 0) l.splice(idx, 1);
  } else {
    delete listeners[type];
  }
}
