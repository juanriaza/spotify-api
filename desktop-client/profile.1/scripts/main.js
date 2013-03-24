require([
  '$api/models',
  'scripts/profile',
  'scripts/template.slab#templates',
  '$views/utils/css',
  'strings/main.lang'
], function(modelsApi, profile, templates, css, mainStrings) {
  'use strict';

  var _profile = null;
  var _currentUser = null;
  var _session = null;
  var _templates = templates;
  var body = document.querySelector('body');

  /**
   * Initiates the app and sets up argument listeners
   * @private
   */
  var _init = function() {
    // Load the session
    css.removeClass(body, 'offline');

    _loadSession();
  };

  /**
   * Initiates loading session and sets templates
   */
  var _loadSession = function() {
    modelsApi.session.load('user', 'device', 'online').done(_sessionLoaded);
    // TODO: handle fail on this
  };

  var _sessionLoaded = function(session) {
    _session = session;
    if (_session.online === false) {
      css.addClass(body, 'offline');

      var offlineContainer = document.querySelector('.offline-message');
      offlineContainer.innerHTML = _templates.offline({
        offlineMessage: mainStrings.get('offlineMessage')
      });

      _session.addEventListener('change:online', _init);
    } else {
      _session.user.load('name', 'username', 'uri').done(_initiateArguments);
    }
    // TODO: handle fail on this too
  };

  var _initiateArguments = function(user) {
    _currentUser = user;
    modelsApi.application.addEventListener('arguments', _loadUserFromArgs);
    modelsApi.application.load('arguments').done(_loadUserFromArgs);
  };

  /**
   * Function that fires when the app gets new arguments
   * @private
   */
  var _loadUserFromArgs = function() {
    // The first argument is 'user'
    // The third argument is the optional tab name ('followers' or 'following').
    var username = _getNamedArgument('user');
    var view = _checkForTabArgument();

    // console.log('(Profile.Main) loading user from arguments', username);
    // TODO(djlee): this check for a leading space is a partial workaround for SOC-918.
    // Get rid of this once the underlying bug is fixed.
    if (username && username.charAt(0) !== ' ') {
      if (_profile && _profile.user && _profile.user.username === username) {
        _profile.switchView(view);
      } else {
        _loadProfile(username, view);
      }
    } else {
      _loadProfile('', view);
    }
  };

  /**
   * Retrieves the value of a given argument from the application arguments
   * @param {string} name Argument name.
   * @return {?string} Value of the second app argument if the first argument is the
   *     same as name.
   */
  var _getNamedArgument = function(name) {
    var argument;
    var args = modelsApi.application.arguments;

    if (_session.device === 'desktop') {
      if (args.length < 2) return null;
      if (args[0] !== name) return null;
      argument = args[1].decodeForText();
    } else if (_session.device === 'web') {
      if (args[0]) {
        argument = args[0].decodeForText();
      } else {
        modelsApi.application.openURI('spotify:user:' + _currentUser.username);
        return;
      }
    }

    return argument;
  };

  /**
   * Checks to see if we want to load something other than the default view
   * @return {number} Identifier of the view to render.
   * @private
   */
  var _checkForTabArgument = function() {
    var args = modelsApi.application.arguments;
    var view;

    if (_session.device === 'web' && args.length < 2 ||
        _session.device === 'desktop' && args.length < 3) {
      return profile.Views.OVERVIEW;
    }

    if (_session.device === 'web') {
      view = args[1];
    } else if (_session.device === 'desktop') {
      view = args[2];
    }

    switch (view.decodeForText()) {
      case 'followers':
        return profile.Views.FOLLOWERS;
      case 'following':
        return profile.Views.FOLLOWING;
      default:
        return profile.Views.OVERVIEW;
    }
  };

  /**
   * Load a particular user's profile.
   * @param {?string} username Username to load, or null to load your own profile.
   * @param {number} view Tab to load, if any.
   * @private
   */
  var _loadProfile = function(username, view) {
    if (_profile) {
      _profile.dispose();
    } else {
      _profile = new profile.Profile();
    }
    _profile.load(username, _currentUser, view, _templates, _session);
  };

  _init();
});
