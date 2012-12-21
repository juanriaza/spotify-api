'use strict';

var sp = getSpotifyApi(1);
var schema = sp.require('$unstable/hermes/discovery');
var models = sp.require('$api/models');

exports.discoveryPlaylists = discoveryPlaylists;
exports.customPlaylists = customPlaylists;

var topLists = [
  'http://open.spotify.com/user/rsedit/playlist/1jiWNIRgT9whCQZMGDzsZU',
  'http://open.spotify.com/user/billboard.com/playlist/6UeSakyzhiEt4NB3UAd6NQ',
  'http://open.spotify.com/user/rsedit/playlist/1jiWNIRgT9whCQZMGDzsZU',
  'http://open.spotify.com/user/125214440/playlist/6sjcAKwplYdvNVmXuVWqYK',
  'http://open.spotify.com/user/jhsizemore/playlist/4u4WSPyfvZ4RrpWWnmjIYY',
  'http://open.spotify.com/user/napstersean/playlist/3vxotOnOGDlZXyzJPLFnm2',
  'http://open.spotify.com/user/hoxsd/playlist/6zdHq5YuwdwMAr79cqEUJo',
  'http://open.spotify.com/user/hoxsd/playlist/0Z7jXtAId643ujM1UPshct',
  'http://open.spotify.com/user/hoxsd/playlist/04rioxDX1833OxhrWlUh3f',
  'http://open.spotify.com/user/hoxsd/playlist/3vgOXr17cntbz84tRfsrOQ',
  'http://open.spotify.com/user/ulyssestone/playlist/4KQDdglJ7HGcqNozbJTlM3',
  'http://open.spotify.com/user/efeghali/playlist/6bUIofrj5PWNIeb67DbUqf'
];

var countryLists = [
  'http://open.spotify.com/user/spotify/playlist/4hOKQuZbraPDIfaGbM3lKI',
  'http://open.spotify.com/user/spotify/playlist/0Ks7MCeAZeYlBOmSLHmZ2o',
  'http://open.spotify.com/user/spotify/playlist/2nQqWLiGEXLybDLu15ZmVx',
  'http://open.spotify.com/user/spotify/playlist/4z0aU3aX74LH6uWHTygTfV',
  'http://open.spotify.com/user/spotify/playlist/6FZEbmeeb9aGiqSLAmLFJW',
  'http://open.spotify.com/user/spotify/playlist/6FNC5Kuzhyt35pXtyqF6xq',
  'http://open.spotify.com/user/spotify/playlist/7Jus9jsdpexXTXh2RVv8bZ',
  'http://open.spotify.com/user/spotify/playlist/1BnqqOPMu8w08F1XpOzlwR',
  'http://open.spotify.com/user/spotify/playlist/7s8NU4MWP9GOSEXVwjcum4',
  'http://open.spotify.com/user/spotify/playlist/5nPXGgfCxfRpJHGRY4sovK',
  'http://open.spotify.com/user/spotify/playlist/13eazhZmMdf628WMqru34A',
  'http://open.spotify.com/user/spotify/playlist/1pDTi8rVKDQKGMb2NlJmDl',
  'http://open.spotify.com/user/spotify/playlist/1f9qd5qJzIpYWoQm7Ue2uV',
  'http://open.spotify.com/user/spotify/playlist/4XEnSf75NmJPBX1lTmMiv0',
  'http://open.spotify.com/user/spotify/playlist/3Yrvm5lBgnhzTYTXx2l55x',
  'http://open.spotify.com/user/spotify/playlist/6AsMD3eFVTZB94bE1ZcWM6',
  'http://open.spotify.com/user/spotify/playlist/5JOn3LSfpbCrOQ7azB4S6C',
  'http://open.spotify.com/user/spotifyusa/playlist/3dEjWfgB5jC6zn6tLoy9yy',
  'http://open.spotify.com/user/nme.com/playlist/4yuDi9FA9ApDkIILZYkPYL'
];

function discoveryPlaylists(onSuccess, onFailure) {
  var hermesSuccess = function(message) {
    var data = sp.core.parseHermesReply('WhatsNewReply', message);
    var friendsLists = (data.friends_playlists && data.friends_playlists.playlists) ? data.friends_playlists.playlists : [];
    var regionLists = (data.region_playlists && data.region_playlists.playlists) ? data.region_playlists.playlists : [];
    onSuccess.call(this, friendsLists, regionLists);
  };
  fetchData.call(this, hermesSuccess, onFailure);
}

function customPlaylists(onSuccess, onFailure) {
  var hermesSuccess = function(message) {
    var data = sp.core.parseHermesReply('WhatsNewReply', message);
    var friendsLists = (data.friends_playlists && data.friends_playlists.playlists) ? data.friends_playlists.playlists : [];
    var customLists = [];
    var link;
    for (var i = 0, l = topLists.length; i < l; i++) {
      link = new models.Link(topLists[i]);
      if (link.type === 5) {
        customLists.push({
          uri: link.uri
        });
      }
    }
    onSuccess.call(this, friendsLists, customLists);
  };
  fetchData.call(this, hermesSuccess, onFailure);
}

function fetchData(onSuccess, onFailure) {
  var postObj = {
    'user_info': {
      'country': sp.core.country
    }
  };
  sp.core.getHermes('GET', 'hm://discovery/get-whats-new-data/',
      [
       ['WhatsNewRequest', postObj]
      ],
      {
        onSuccess: onSuccess,
        onFailure: onFailure
      });
}
