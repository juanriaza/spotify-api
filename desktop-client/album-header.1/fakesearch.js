/**
 * Fake app content search
 * @author Per-Olov Jernberg <po@spotify.com>
 */

'use strict';

var sp = getSpotifyApi();
var m = sp.require('$api/models');
var request = sp.require('$util/request');
var storage = sp.require('$util/storage');
var searchjson = 'http://d1hza3lyffsoht.cloudfront.net/search/fakesearch.json';
//var searchjson = "http://download.spotify.s3.amazonaws.com/search/fakesearch.json";
var cacheTimeout = 60 * 60 * 1000; // 1 hour


function FakeSearch() {
  var _fakedata = false;

  // try to open local file first...
  try {
    var local = sp.core.readFile('fakesearch.local.json');
    if (local) {
      local = local.trim();
      if (local.length > 5) {
        _fakedata = JSON.parse(local).data;
      }
    }
  } catch (e) {
  }

  if (!_fakedata) {
    if (storage.get('fakedata') && ((storage.get('timestamp') + cacheTimeout) > new Date().getTime())) {
      _fakedata = storage.get('fakedata');
    }
  }

  var _match = function(hit, query) {
    var k,
        l = hit.keywords.length;

    for (k = 0; k < l; k++) {
      var kwd = new RegExp(hit.keywords[k], 'ig');
      if (kwd.test(query)) {
        return true;
      }
    }
    return false;
  }

  this.query = function(q, callback) {
    if (!_fakedata) {
      request.request(searchjson, 'null', 'GET').then(function(result) {
        _fakedata = JSON.parse(result.response).data;
        storage.set('fakedata', _fakedata);
        storage.set('timestamp', new Date().getTime());
        _query(q, callback);
      });
    } else {
      _query(q, callback);
    }
  }

  var _query = function(q, callback) {
    q = q.trim();
    var self = this;
    setTimeout(function() {
      var r = [],
          k,
          l = _fakedata.length;

      for (k = 0; k < l; k++) {
        var hit = _fakedata[k];
        if (_match(hit, q)) {
          r.push(hit);
        }
      }
      callback(r);
    },1);
  }

  this.startEventListener = function() {
    document.addEventListener('click', function(event) {
      if (event.srcElement && event.srcElement.tagName == 'A') {
        var playarg = event.srcElement.getAttribute('data-play');
        if (playarg) {
          m.player.play(playarg);
        }
      }
    }, true);
  }
}

/**
*  Exports
*/
exports.FakeSearch = FakeSearch;

