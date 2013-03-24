require([
  '$api/models',
  '$views/image#Image',
  '$views/throbber#Throbber',
  '/scripts/logger#Logger',
  '/scripts/utils',
  '/scripts/onemoretime'
], function(models, Image, Throbber, Logger, utils, omt) {

  var logger = new Logger();

  /**
   * RelatedArtists deals with the logic for pulling down related
   * artists for either the pane or the view on the front page.
   *
   */
  var RelatedArtists = function() {
    this.view = new RelatedArtistsPanelView();
    this.count = -1;
    this.loaded = false;
  };

  RelatedArtists.createStartPanel = function() {
    var rl = new RelatedArtists();
    rl.count = 6;
    return rl;
  };

  RelatedArtists.createRelatedPage = function(count) {
    var rl = new RelatedArtists();
    rl.view = new RelatedArtistsPageView();
    return rl;
  };

  RelatedArtists.prototype.init = function(artist) {
    this.artist = artist;
    this.view.setArtist(artist);
    this.promise = new models.Promise({'uri': artist.uri});
    return this.promise;
  };

  RelatedArtists.prototype.destroy = function() {
    this.view.destroy();
    this.loaded = false;
    delete this.artist;
  };

  RelatedArtists.prototype.render = function() {
    if (this.artist === undefined) return;
    this.loaded = true;
    this.view.init();
    var retryableRelated = omt.snapshotWithRetry(this.artist.related);
    var snapshotPromise = this.count > 0 ?
            retryableRelated.snapshot(0, this.count) :
            retryableRelated.snapshot();
    snapshotPromise.done(this, this.onSnapshotLoaded);
  };

  RelatedArtists.prototype.onSnapshotLoaded = function(snap) {
    this.view.prepareSnapshotLoaded(snap.range.length);
    var props = ['image', 'name'];
    var promises = [];
    var count = snap.range.length;
    for (var i = 0; i < snap.range.length; i++) {
      this.prepareArtist(i, snap.get(i).uri, this.artist);
      promises.push(snap.get(i).load(props));
    }
    models.Promise.join(promises).always(this, function(artists) {
      for (var i = 0, j = artists.length; i < j; i++) {
        if (!artists[i].name.match(/^various/i)) {
          this.appendArtist(artists[i]);
        } else {
          this.view.removeArtist(artists[i]);
        }
      }
      this.view.stopWaiting();
    });
    this.promise.object.results = snap.length;
    this.promise.setDone();
  };

  RelatedArtists.prototype.prepareArtist = function(idx, uri, artist) {
    var id = uri.split(':')[2];
    this.view.prepareArtist(id, artist, artist.name, artist.uri, idx);
  };

  RelatedArtists.prototype.appendArtist = function(artist) {
    var id = artist.uri.split(':')[2];
    return this.view.appendArtist(id, artist, artist.name, artist.uri, artist.uri.toSpotifyURL());
  };

  RelatedArtists.prototype.setResults = function(results) {
    this.view.setResults(results);
  };

  /**
   *
   */
  var AbstractRelatedArtistsView = function() {};

  AbstractRelatedArtistsView.prototype._createImage = function(width, height, artist, name, spUri, options) {
    var params = {
      title: name,
      height: height,
      width: width,
      player: false,
      animate: false,
      link: spUri
    };
    if (options && options.overlay) {
      params.overlay = options.overlay;
    }
    return new Image.forArtist(artist, params);
  };

  AbstractRelatedArtistsView.prototype.waitBetween = function(from, to) {};
  AbstractRelatedArtistsView.prototype.stopWaiting = function() {};

  AbstractRelatedArtistsView.prototype.setArtist = function(artist) {
    this.artist = artist;
    this.artistId = artist.uri.split(':')[2];
  };

  AbstractRelatedArtistsView.prototype.logClick = function(e) {
    var target = e.target;
    while (target.nodeName.toUpperCase() !== 'A') {
      target = target.parentNode;
    }

    var liNode = target.parentNode;
    if (this instanceof RelatedArtistsPageView) {
      liNode = liNode.parentNode;
    }
    var pos = Array.prototype.indexOf.call(liNode.parentNode.childNodes, liNode) + 1;
    var type = target.getAttribute('data-related-type');
    var data = {
      artist: this.artistId,
      target: target.getAttribute('data-uri').split(':')[2],
      position: pos
    };
    if (type) {
      data.type = type;
    }
    logger.clientEvent('click-related-artist', data);
  };

  /**
   *
   */
  var RelatedArtistsPanelView = function() {

  }

  RelatedArtistsPanelView.prototype = new AbstractRelatedArtistsView;

  RelatedArtistsPanelView.prototype.init = function() {
    this.relatedList = $('related-artists-list');
    this.relatedList.innerHTML = '';
    this.throbber = undefined;
    this.throbberTimer = undefined;
    this.clickHandler = this.logClick.bind(this);
  };

  RelatedArtistsPanelView.prototype.destroy = function() {
    this.stopWaiting();
    if (this.relatedList) {
      this.relatedList.empty();
    }
    if (this.image) {
      this.image.node.removeEventListener('click', this.clickHandler, true);
    }
    if (this.nameNode) {
      this.nameNode.removeEventListener('click', this.clickHandler, true);
    }
  };

  RelatedArtistsPanelView.prototype.unhide = function() {
    $('related-artists-wrapper').setStyle('visibility', 'visible');
  };

  RelatedArtistsPanelView.prototype.prepareSnapshotLoaded = function(resultSize) {
    $('related-artists').set('class', 'fluid');
    $('related-artists-wrapper').setStyle('display', (resultSize > 0 ? 'block' : 'none'));
  };

  RelatedArtistsPanelView.prototype.waitBetween = function(from, to) {
    this.throbberTimer = setTimeout(this.startWaiting, from);
    setTimeout(this.stopWaiting, to);
  };

  RelatedArtistsPanelView.prototype.prepareArtist = function(id, artist, name, spUri, idx) {
    var node = document.createElement('li');
    node.className = 'item cf';
    node.id = 'related-' + id;
    node.className = node.className + ' related-' + idx;
    this.relatedList.appendChild(node);
  }

  RelatedArtistsPanelView.prototype.appendArtist = function(id, artist, name, spUri, spUrl) {
    var promise = new models.Promise();
    this.image = this._createImage(30, 30, artist, name, spUri);
    this.image.node.setAttribute('data-related-type', 'panel_image');
    this.image.addEventListener('done', function() {
      promise.setDone();
    });

    this.image.node.addEventListener('click', this.clickHandler, true);
    this.nameNode = document.createElement('a');
    this.nameNode.className = 'name';
    this.nameNode.href = spUrl;
    this.nameNode.title = name;
    this.nameNode.setAttribute('data-uri', artist.uri);
    this.nameNode.setAttribute('data-related-type', 'panel_name');
    this.nameNode.innerHTML = name;
    this.nameNode.addEventListener('click', this.clickHandler, true);

    $$('#related-' + id + ' a').destroy();
    $$('#related-' + id).grab(this.image.node);
    $$('#related-' + id).grab(this.nameNode);
    return promise;
  };

  RelatedArtistsPanelView.prototype.removeArtist = function(artist) {
    var id = artist.uri.split(':')[2];
    $$('#related-' + id).dispose();
  };

  RelatedArtistsPanelView.prototype.setResults = function(results) {

  };

  /**
   * RelatedArtistsPageView is the page that renders the related artists
   */
  var RelatedArtistsPageView = function() {
    this.liNode = document.createElement('li');
    this.liNode.className = 'item cf';
    this.liNode.innerHTML = '<div class="portrait"></div>';
    this.HEIGHT_PER_ROW = 200;
    this.IMAGES_PER_ROW = 4;
  }

  RelatedArtistsPageView.prototype = new AbstractRelatedArtistsView;

  RelatedArtistsPageView.prototype.init = function() {
    this.relatedWrapper = $('related-tab-list');
    this.relatedWrapper.innerHTML = '';
    this.throbberPositionY = 135;
    this.throbber = undefined;
    this.throbberTimer = undefined;
    this.startWaiting();
    this.clickHandler = this.logClick.bind(this);
    setTimeout(this.stopWaiting, utils.THROBBER_MAX_APPEAR_TIME);
  };

  RelatedArtistsPageView.prototype.destroy = function() {
    $('related-tab-list').empty();
    if (this.image) {
      this.image.node.removeEventListener('click', this.clickHandler, true);
    }
  };

  RelatedArtistsPageView.prototype.prepareSnapshotLoaded = function(resultSize) {
    $$('li.related').setStyle('display', resultSize === 0 ? 'none' : '');
  };

  RelatedArtistsPageView.prototype.startWaiting = function() {
    this.throbber = new Throbber.forElement(document.getElementById('related-tab-list'), 300);
    this.throbber.setPosition('center', this.throbberPositionY);
  };

  RelatedArtistsPageView.prototype.stopWaiting = function() {
    clearTimeout(this.throbberTimer);
    if (this.throbber !== undefined) {
      this.throbber.showContent();
      this.throbber.hide();
    }
  };

  RelatedArtistsPageView.prototype.prepareArtist = function(id, artist, name, spUri, idx) {
    var node = this._getListItem(id);
    this.relatedWrapper.appendChild(node);
  };

  RelatedArtistsPageView.prototype.appendArtist = function(id, artist, name, spUri, spUrl) {
    var artistNode = this._findListItem(spUri);
    if (artistNode) {
      this.image = this._createImage(150, 150, artist, name, spUri,
          {overlay: [artist.name]});
      this.image.node.setAttribute('data-related-type', 'page_image');
      this.image.node.addEventListener('click', this.clickHandler, true);
      artistNode.grab(this.image.node);
    }
  };

  RelatedArtistsPageView.prototype.removeArtist = function(artist) {
    var id = artist.uri.split(':')[2];
    $$('#related-tab-li-' + id).dispose();
  };

  RelatedArtistsPageView.prototype._getListItem = function(id) {
    var node = this.liNode.clone(true);
    node.id = 'related-tab-li-' + id;
    return node;
  };

  RelatedArtistsPageView.prototype._findListItem = function(artistUrl) {
    var uri = artistUrl.split(':')[2];
    return $$('#related-tab-li-' + uri + ' .portrait');
  };

  RelatedArtistsPageView.prototype.setResults = function(results) {
    // extremely basic calculation to set min-height based on number of results used for 'non-jumpy' tab switching
    var rows = Math.ceil(results / this.IMAGES_PER_ROW);
    $('related').setStyle('min-height', rows * this.HEIGHT_PER_ROW + 'px');
    if (results === 0) {
      $$('li.related').setStyle('display', results === 0 ? 'none' : '');
    }
  };

  exports.RelatedArtists = RelatedArtists;

});
