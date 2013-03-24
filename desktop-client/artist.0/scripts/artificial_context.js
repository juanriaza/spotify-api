require([
  '$api/models'
], function(models) {

  /**
   * An Artifical Context is a group of contexts generated by
   * the artist page to support jumping across a set of real contexts,
   * such as albums, top tracks, playlists. It simply keeps a list of
   * lists of contexts.
   */
  function ArtificialContext() {}

  ArtificialContext.prototype.append = function(uri, length) {
    AC.append(uri, length);
  };

  var AC = ArtificialContext;

  /**
   * Sets up the artificial context, with listeners to change events
   * Should only be run ONCE per app instance.
   */
  ArtificialContext.init = function() {
    ArtificialContext.contexts = [];
    ArtificialContext.index = {};
    ArtificialContext.isShuffle = null;
    ArtificialContext.isRepeat = null;
    ArtificialContext.playingContext = null;
    ArtificialContext._ref = 0;
    ArtificialContext.isActive = true;
    models.player.load('repeat', 'shuffle').done(AC.propertiesLoaded);
    models.player.addEventListener('change', AC.playerChange);
    models.application.addEventListener('activate', AC.onActivationStateChanged);
    models.application.addEventListener('deactivate', AC.onActivationStateChanged);
  };

  ArtificialContext.onActivationStateChanged = function(event) {
    AC.isActive = event.data.active;
  };

  /**
   * Creates a new group of contexts, which is useful when we open a new page
   * of an artist tab.
   */
  ArtificialContext.pushContextGroup = function() {
    var context = [];
    AC.contexts.push(context);
    AC.currentGroupIndex = AC.contexts.length - 1;
    AC.currentContextGroup = context;
  };

  /**
   * Adds a new context to the current context group
   */
  ArtificialContext.append = function(uri, length) {
    var ref = AC._ref;
    AC._ref++;
    AC.currentContextGroup.push({ uri: uri, length: length, songsLeft: length, _ref: ref });
    var index = AC.currentContextGroup.length - 1;
    AC.index[uri] = { group: AC.currentGroupIndex, index: index, _ref: ref };
  };

  /**
   * Runs the first track on the next context from the current artifical context
   * if another context exists.
   */
  ArtificialContext.runNext = function() {
    var context = AC.index[AC.playingContext];
    if (context !== undefined) {
      var group = AC.contexts[context.group];
      var nextIndex = context.index + 1;
      if (nextIndex < group.length) {
        var nextContext = group[nextIndex];
        var contextObject = AC.contextFromURI(nextContext.uri);
        if (contextObject !== null) {
          models.player.playContext(contextObject);
        }
      }
    }
  };

  /**
   * Runs a garbage collection cycle over all contexts, if necessary.
   *
   * We need this in the following scenario:
   *  - User plays from artist A
   *  - User navigates via artists B, C and D to artist E
   *  - User starts playing on E
   * Now the contexts A, B, C and D are useless, mostly occupying memory.
   * So we need to free them.
   */
  ArtificialContext.collectContexts = function() {
    var context = AC.index[AC.playingContext];
    if (context === undefined) {
      return;
    }
    if (context.group === AC.contexts.length - 1 && context.group > 0) {
      var decrement = context.group;
      var newContexts = AC.contexts.slice(decrement);
      var newIndex = {};
      for (var obj in AC.index) {
        if (AC.index.hasOwnProperty(obj)) {
          AC.index[obj].group -= decrement;
          if (AC.index[obj].group >= 0) {
            newIndex[obj] = AC.index[obj];
          }
        }
      }
      delete AC.index;
      delete AC.contexts;
      AC.index = newIndex;
      AC.contexts = newContexts;
    }
  };

  /**
   * For debug information, this prints the entire index and follows references.
   */
  ArtificialContext.printGroups = function(context) {
    for (var obj in AC.index) {
      if (AC.index.hasOwnProperty(obj)) {
        console.log('key:', AC.index[obj], 'ref:', AC.index[obj].ref, 'group:', AC.index[obj].group, 'idx:', AC.index[obj].index);
        console.log('resolves to: ', AC.contexts[AC.index[obj].group][AC.index[obj].index].uri);
      }
    }
  };

  /**
   * Transforms a URI to a context.
   */
  ArtificialContext.contextFromURI = function(uri) {
    if (uri.indexOf('spotify:album:') == 0) {
      return models.Album.fromURI(uri);
    } else if (uri.indexOf('spotify:playlist:') == 0 || uri.indexOf('spotify:internal:temp_playlist:') == 0) {
      return models.Playlist.fromURI(uri);
    } else {
      return null;
    }
  };

  /**
   * We keep track of shuffle and repeat
   */
  ArtificialContext.propertiesLoaded = function(player) {
    ArtificialContext.isShuffle = player.shuffle;
    ArtificialContext.isRepeat = player.repeat;
  };

  /**
   * Callback that is run every time the play state is changing,
   * including (but not limited to) track changes, volume change,
   * shuffle and repeat.
   */
  ArtificialContext.playerChange = function(player) {
    AC.isShuffle = player.data.shuffle;
    AC.isRepeat = player.data.repeat;
    if (player.data.context === undefined && player.data.track === undefined) {
      AC.runNext();
    } else if (player.data.context !== undefined) {
      AC.playingContext = player.data.context.uri;
    }
    window.setTimeout(AC.collectContexts, 0);
  };

  exports.ArtificialContext = ArtificialContext;

});
