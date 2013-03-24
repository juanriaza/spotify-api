require([
  '$api/models',
  '$views/list#List',
  '$views/buttons#Button',
  '$views/image#Image',
  '$api/toplists#Toplist',
  '/scripts/env#Environment',
  '/scripts/artificial_context#ArtificialContext',
  '/scripts/utils',
  '/scripts/onemoretime'
], function(models, List, Button, Image, ToplistApi, Environment, ArtificialContext, Utils, omt) {

  /** Shorthand */
  var create = SP.bind(models.Playlist.createTemporary, models.Playlist);
  var key = function(artistId, index) {
    return 'artist-app-' + artistId + 'top10-' + index;
  };

  var Toplist = function() {
    this.view = new ToplistView();
  }

  Toplist.prototype = new models.Observable;

  Toplist.prototype.init = function(artist, artistId, contextManager) {
    this.artist = artist;
    this.artistId = artistId;
    this.promise = new models.Promise(this);
    this.renderPromise = new models.Promise();
    this.context = contextManager;
    return this.promise;
  }

  Toplist.prototype.destroy = function() {
    this.view.destroy();
    delete this.promise;
    delete this.artist;
    delete this.artistId;
  }

  Toplist.prototype.render = function() {
    this.view.init();
    ToplistApi.forArtist(this.artist).load('tracks')
      .done(this, this.onToplistLoaded)
      .fail(this.promise, this.promise.setFail);
    return this.renderPromise;
  };

  Toplist.prototype.onToplistLoaded = function(tl) {
    tl.tracks.snapshot(0, 10).done(this, function(snap) {
      this.view.empty();
      this.continueLoading();
      this.setTrackCount(snap.length);
      if (snap.length === 0) {
        // No results means that we can discard this and keep going
        this.onSnapshotLoaded(snap);
      } else {
        this.createToplistList(tl, snap);
      }
    }).done(this, function(snap) {
      this.onSnapshotLoaded(snap);
    });
  };

  Toplist.prototype.createToplistList = function(tl, snap) {
    var listLength = Math.min(snap.length, 10);
    listLength = listLength == 9 ? 8 : listLength == 7 ? 6 : listLength;
    if (Environment.desktop) {
      var f = ['ordinal', 'star', 'image', 'track'];
    } else {
      var f = ['ordinal', 'image', 'track'];
    }

    // Create list
    var opts = {
      type: 'tracks',
      layout: 'toplist',
      fields: f,
      header: 'no',
      scrollToFetch: false,
      style: 'rounded'
    };
    if (Environment.web) {
      opts.context = tl;
    }
    var list = new List(tl, opts);
    $$('#top-tracks .content2').grab(list.node);

    list.addEventListener('item-load', this.view.onItemLoaded.bind(this.view));
    list.init();
    this.view.setLength(list, listLength);
    this.context.place(0, list);

    if (Environment.desktop) {
      ArtificialContext.append(tl.uri.replace(':top:tracks', ''), listLength);
    }
  };

  Toplist.prototype.setTrackCount = function(count) {
    this.view.numTracks = count;
  };

  Toplist.prototype.continueLoading = function(e) {
    this.renderPromise.setDone();
    // Can fail if the app has already been destroyed
    if (this.promise) {
      this.promise.setDone();
    }
  };

  Toplist.prototype.onSnapshotLoaded = function(snapshot) {
    SP.defer(this, function() {
      if (snapshot.length === 0) {
        this.view.showNoTracks();
      } else {
        this.view.showHasTracks();
      }
    });
  };

  /**
   * The ToplistView does all the view logic for the toplist,
   * eg creating the list that draws items, etc.
   */
  var ToplistView = function() {

  }

  ToplistView.prototype.setLength = function(list, length) {
    if (length > 5) {
      list.node.addClass('multicolumn');
      list.node.addClass('sp-list-with-' + length + '-items');
    }
  }

  ToplistView.prototype.init = function() {
    $('top-tracks-content').innerHTML = '<div class="l"></div><div class="r"></div>';
    $('top-tracks').className = 'fluid';
    this.numTracks = 0;
    this.loadedTracks = 0;
  }

  ToplistView.prototype.destroy = function() {
    this.empty();
  }

  ToplistView.prototype.empty = function() {
    $('top-tracks-content').innerHTML = '<div class="l"></div><div class="r"></div>';
  };

  ToplistView.prototype.onItemLoaded = function() {
    this.loadedTracks += 1;
    if (this.loadedTracks === this.numTracks) {
      this.showList();
    }
  }

  ToplistView.prototype.unhide = function() {
    $('top-tracks-inner-wrapper').setStyle('visibility', 'visible');
  }

  ToplistView.prototype.showList = function() {
    $$('#top-tracks-content .sp-list').setStyle('visibility', 'visible');
  }

  ToplistView.prototype.injectList = function(list, side) {
    $$('#top-tracks .content2 .' + side).grab(list.node);
  }

  ToplistView.prototype.showHasTracks = function() {
    $('no-top-tracks').setStyle('display', 'none');
    $$('#top-tracks-inner-wrapper .heading').setStyle('display', 'block');
    $$('#top-tracks-inner-wrapper .content2').setStyle('display', 'block');
  }

  ToplistView.prototype.showNoTracks = function() {
    $$('#top-tracks-inner-wrapper .heading').setStyle('display', 'none');
    $$('#top-tracks-inner-wrapper .content2').setStyle('display', 'none');
    $('no-top-tracks').setStyle('display', 'block');
  }

  exports.Toplist = Toplist;
});
