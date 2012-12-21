/**
 * @module Tutorial
 * @author Felix Bruns <felixbruns@spotify.com>
 */

'use strict';

var sp = getSpotifyApi();

// Imports
var $language = sp.require('$util/language');
var $promise = sp.require('$util/promise');
var $request = sp.require('$util/request');
var $logger = sp.require('$util/logger');
var $popups = sp.require('popups-tests');

// Constants
var _ = partial($language.getString, $language.loadCatalog('feed'), 'tutorial');

var sAccTutorialNewUser = 'tutorial_newuser';
var sAccTutorialStarted = 'tutorial_started';
var sAccTutorialComplete = 'tutorial_complete';
var sAccClickSearchField = 'click_search_field';
var sAccPerformSearch = 'perform_search';
var sAccPlayTrackByDoubleClick = 'play_track_by_double_click';
var sAccClickNewPlaylist = 'click_new_playlist';
var sAccCreatePlaylist = 'create_playlist';
var sAccClickShareNowPlayingTrack = 'click_share_now_playing_track';
var sAccShareSomething = 'share_something';
var sAccUseAppFinder = 'use_app_finder';
var sAccAddFavouriteFriend = 'add_favourite_friend';

// Local variables
var translationMap = {};
translationMap[sAccClickSearchField] = {
  title: _('clickSearchFieldTitle'),
  bubbleTitle: _('clickSearchFieldBubbleTitle'),
  bubbleSubtitle: _('clickSearchFieldBubbleSubtitle')
};
translationMap[sAccPlayTrackByDoubleClick] = {
  title: _('playTrackByDoubleClickTitle'),
  bubbleTitle: _('playTrackByDoubleClickBubbleTitle'),
  bubbleSubtitle: ''
};
translationMap[sAccClickShareNowPlayingTrack] = {
  title: _('clickShareNowPlayingTrackTitle'),
  bubbleTitle: _('clickShareNowPlayingTrackBubbleTitle'),
  bubbleSubtitle: _('clickShareNowPlayingTrackBubbleSubtitle')
};
translationMap[sAccClickNewPlaylist] = {
  title: _('clickNewPlaylistTitle'),
  bubbleTitle: _('clickNewPlaylistBubbleTitle'),
  bubbleSubtitle: ''
};

// Exports
exports.Tutorial = Tutorial;

var _loadFacebookArtistLikes = function(callback) {
  var numArtists = 2; // Number of artists to return in the end
  var numMatch = 5; // Maximum number of "match" requests to send (using suggest search)
  var token = sp.social.facebookToken;
  // Note: It's possible to use 'me' here, since the access token is bound to the user.
  //       There was a bug that sp.core.user.facebookUid was null. Using 'me' instead solves it.
  var url = 'https://graph.facebook.com/me/likes?access_token=' + token;

  var _onLikesLoaded = function(data) {
    var likes = JSON.parse(data.responseText);
    var fallback = ['Jay-Z', 'Thriller'];

    if (!likes || !likes.hasOwnProperty('data')) {
      callback(fallback);
      return;
    }

    var promises = [];
    var artists = map(
        function(artist) {
          return artist.name;
        }, filter(function(like) {
          return like.category.indexOf('Musician/') != -1;
        }, likes.data).slice(0, numMatch)
        );

    if (artists.length === 0) {
      callback(fallback);
      return;
    }

    artists.forEach(function(artist) {
      var p = new $promise.Promise();

      promises.push(p);

      sp.core.suggestSearch(artist, {
        onSuccess: function(data) {
          p.resolve(data);
        }
      });
    });

    var p = $promise.join.apply($promise, promises);

    p.always(function() {
      var suggestions = Array.prototype.slice.call(arguments, 0, arguments.length);
      var result = [];

      for (var i = 0; i < artists.length; i++) {
        if (suggestions[i].artists.length > 0) {
          result.push(artists[i]);
        }
      }

      while (result.length < numArtists) {
        result.push(fallback.pop());
      }

      callback(result);
    });
  };

  var p = $request.request(url, null, 'GET');
  p.always(_onLikesLoaded);
};

function ProgressBar() {
  var self = this;
  var node = document.createElement('div');
  var outer = document.createElement('div');
  var inner = document.createElement('div');
  var text = document.createElement('div');

  node.setAttribute('id', 'progress');
  outer.setAttribute('id', 'progress-outer');
  inner.setAttribute('id', 'progress-inner');
  text.setAttribute('id', 'progress-text');

  outer.appendChild(inner);
  node.appendChild(outer);
  node.appendChild(text);

  node.addEventListener('webkitAnimationEnd', function onAnimationEnd() {
    node.style.display = 'none';
    node.removeEventListener('webkitAnimationEnd', onAnimationEnd);
  });

  self.node = node;
  self.update = function(complete, total) {
    var percent = parseInt(complete / total * 100, 10);

    inner.style.width = percent + '%';
    text.textContent = percent + '%';
  };
}

function TutorialStep(index, bubbleAccomplishment, completeAccomplishments) {
  completeAccomplishments = completeAccomplishments || [];
  completeAccomplishments.push(bubbleAccomplishment);

  var self = this;
  var node = document.createElement('div');

  node.setAttribute('style', 'z-index: ' + index + ';');
  node.classList.add('step');
  var tmp = '<div class="step-content">';
  tmp += '<div class="step-number"><span>' + index + '</span></div>';
  tmp += '<h4>' + translationMap[bubbleAccomplishment]['title'] + '</h4>';
  tmp += '</div>';
  node.innerHTML = tmp;

  self.index = index;
  self.node = node;
  self.bubbleAccomplishment = bubbleAccomplishment;
  self.bubbleTitle = translationMap[bubbleAccomplishment]['bubbleTitle'];
  self.bubbleSubtitle = translationMap[bubbleAccomplishment]['bubbleSubtitle'];

  self.doShowBubble = function() {
    return bubbleAccomplishment !== null &&
        !sp.tutorial.hasAccomplishment(bubbleAccomplishment);
  };

  self.isComplete = function() {
    for (var i = 0; i < completeAccomplishments.length; i++) {
      if (completeAccomplishments[i] !== null &&
          !sp.tutorial.hasAccomplishment(completeAccomplishments[i])) {
        return false;
      }
    }
    return true;
  };
}

function TutorialGoal(str, url, onClick) {
  var self = this;
  var node = document.createElement('div');

  node.classList.add('step');
  node.classList.add('step-goal');
  node.classList.add('locked');
  var tmp = '<div class="step-content">';
  tmp += '<div class="step-number">&nbsp;</div>';
  tmp += '<h4>' + str + '</h4>';
  tmp += '</div>';
  node.innerHTML = tmp;

  self.node = node;
  self.unlock = function() {
    node.classList.remove('locked');
    node.classList.add('unlocked');
    node.addEventListener('click', function(e) {
      onClick();
      window.open(url);
    });
  };
}

var _isFreeUser = function() {
  var product = sp.core.product.toLowerCase();
  return product.indexOf('premium') < 0 && product.indexOf('unlimited') < 0;
};

function Tutorial(onClose) {
  var self = this;
  var progressBar = new ProgressBar();
  var node = document.createDocumentFragment();
  var stepsNode = document.createElement('div');
  var steps = [];
  var goal = new TutorialGoal('Spotify Mobile',
      'http://www.spotify.com/freetrial/tutorial/', function() {
        self.doComplete(false);
      });

  var headerTxt = document.createTextNode(_('tutorialHeader'));
  document.getElementById('header').appendChild(headerTxt);
  document.getElementById('close').addEventListener('click', function(e) {
    self.doComplete(true);
  });

  var i = 1;
  steps.push(new TutorialStep(i++,
      sAccClickSearchField,
      [sAccPerformSearch]));

  steps.push(new TutorialStep(i++,
      sAccPlayTrackByDoubleClick));

  steps.push(new TutorialStep(i++,
      sAccClickNewPlaylist,
      [sAccCreatePlaylist]));


  node.appendChild(progressBar.node);

  for (var s in steps) {
    stepsNode.appendChild(steps[s].node);
  }

  if (_isFreeUser()) {
    stepsNode.appendChild(goal.node);
  }
  else {
    document.getElementById('close').style.display = 'inline';
  }

  stepsNode.setAttribute('id', 'steps');
  node.appendChild(stepsNode);

  var _update = function() {
    if (sp.core.getLoginMode() != 1) {
      return;
    }

    var current = null;
    var completeSteps = 0;
    var bubblesDone = true;

    for (var i = 0; i < steps.length; i++) {
      var step = steps[i];

      step.node.classList.remove('step-complete');
      step.node.classList.remove('step-current');

      if (step.isComplete()) {
        completeSteps++;
        step.node.classList.add('step-complete');
      }
      else if (current === null) {
        current = step;
        step.node.classList.add('step-current');
      }

      if (!sp.tutorial.hasAccomplishment(step.bubbleAccomplishment)) {
        bubblesDone = false;
      }
    }

    if (bubblesDone) {
      document.getElementById('close').style.display = 'inline';
    }

    if (current && current.doShowBubble()) {
      var acc = current.bubbleAccomplishment;

      if (acc === sAccClickSearchField) {
        _loadFacebookArtistLikes(function(artists) {
          sp.tutorial.showBubble(acc,
              current.bubbleTitle,
              $language.format(current.bubbleSubtitle, artists));
        });
      }
      else {
        sp.tutorial.showBubble(acc,
            current.bubbleTitle,
            current.bubbleSubtitle);
      }
    }

    progressBar.update(completeSteps, steps.length);

    if (!self.isComplete && completeSteps == steps.length) {

      $popups.loadTutorialCompletePopup();

      if (_isFreeUser()) {
        goal.unlock();
        self.doComplete(false);
      }
      else {
        self.doComplete(true);
      }
    }
  };

  self.node = node;
  self.isComplete = sp.tutorial.hasAccomplishment(sAccTutorialComplete);
  self.onClose = onClose;
  self.doComplete = function(close) {
    sp.tutorial.setAccomplishment(sAccTutorialComplete);
    self.isComplete = true;
    if (close && self.onClose) {
      self.onClose();
    }
  };

  if (!self.isComplete) {
    sp.tutorial.addEventListener('change', _update);
    sp.core.addEventListener('loginModeChanged', _update);
    sp.tutorial.setAccomplishment(sAccTutorialStarted);

    if (sp.social.relations.loaded) {
      _update();
    }
    else {
      sp.social.relations.addEventListener('change', function onSocialLoaded() {
        sp.social.relations.removeEventListener('change', onSocialLoaded);
        _update();
      });
    }
  } else {
    self.isComplete = true;
  }
}
