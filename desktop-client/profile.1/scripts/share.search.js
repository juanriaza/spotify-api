require([
  '$api/search#Search',
  '$api/models',
  '$views/image#Image',
  '$views/utils/dom',
  '$views/utils/css'
], function(Search, models, Image, dom, css) {

  'use strict';

  var MAX_ITEMS = 3;

  var ARTIST_PROPERTIES = ['name', 'image', 'popularity'];
  var ALBUM_PROPERTIES = ['name', 'image', 'popularity', 'artists'];
  var TRACK_PROPERTIES = ['name', 'image', 'popularity', 'artists'];

  var NODE_UL = document.createElement('ul');
  var NODE_LI = document.createElement('li');
  var NODE_SPAN = document.createElement('span');
  var NODE_DIV = document.createElement('div');

  function ShareSearch(element, templates, sendButton) {
    this.results = [];
    this.selected = null;
    this.hasSelected = false;
    this.prev = null;
    this.templates = templates;
    this.resetSearchButton = element.querySelector('.search-close');

    this.setEscapeClose = this.setEscapeClose.bind(this);
    this.selectUp = this.selectUp.bind(this);
    this.selectDown = this.selectDown.bind(this);
    this.deselect = this.deselect.bind(this);

    this.inputField = element.querySelector('.music-input');
    this.messageContainer = element.querySelector('.message-input');
    this.resultContainer = element.querySelector('.music-search');
    this.selectedDisplay = element.querySelector('.selected-search');
    this.sendButton = sendButton;

    dom.addEventListener(this.inputField, 'keyup', this.sendQuery.bind(this));

    dom.addEventListener(this.resetSearchButton, 'click',
        this.resetSearch.bind(this));
  }

  ShareSearch.prototype.sendQuery = function(evt, val) {
    var el = evt.target || val;
    var value = el.value;
    switch (evt.keyCode) {
      case 13:
        this.select();
        evt.stopImmediatePropagation();
        evt.preventDefault();
        break;
      case 27:
        this.escapeClose();
        break;
      case 38:
        this.selectUp();
        evt.stopImmediatePropagation();
        evt.preventDefault();
        break;
      case 40:
        this.selectDown();
        evt.stopImmediatePropagation();
        evt.preventDefault();
        break;
      default:
        if (value.length > 0) {
          this.search(value);
          css.addClass(this.resetSearchButton, 'show');
        } else {
          this.hideSearchResults();
          css.removeClass(this.resetSearchButton, 'show');
        }
        break;
    }
  };

  ShareSearch.prototype.selectUp = function() {
    if (this.selected === null || this.selected <= 0) {
      this.selected = this.results.length - 1;
    } else {
      this.selected -= 1;
    }
    this.setSelected(this.results[this.selected]);
  };

  ShareSearch.prototype.selectDown = function() {
    if (this.selected === null || this.selected === this.results.length - 1) {
      this.selected = 0;
    } else {
      this.selected += 1;
    }
    this.setSelected(this.results[this.selected]);
  };

  ShareSearch.prototype.setSelected = function(curr) {
    if (curr === undefined) {
      return;
    }
    if (this.prev) {
      css.removeClass(this.prev, 'selected');
    }
    css.addClass(curr, 'selected');
    this.prev = curr;
  };

  ShareSearch.prototype.select = function(uri) {
    var curr = this.results[this.selected];

    var contentLoaded = function() {
      this.hasSelected = true;
      this.selectedDisplay.innerHTML = template(content);
      css.addClass(this.selectedDisplay, 'show');
      css.addClass(this.inputField, 'hide');
      this.hideSearchResults();
      this.selected = -1;
      this.messageContainer.focus();
      dom.addEventListener(this.inputField, 'focus', this.deselect);
      this.sendButton.setDisabled(false);

      // TODO show search-results again on click and revert input field to last query.
    }.bind(this);

    if (curr !== null || uri) {
      var data = curr ? this.dataObjects[curr.getAttribute('data-uri')] : this.dataObjects[uri],
          type = data ? data.uri.split(':')[1] : uri,
          template,
          content;
      switch (type) {
        case 'track':
          this.selectedItem = models.Track.fromURI(data.uri);
          template = this.templates.selected_track;
          data.album.load('name')
            .done(this, function(a) {
                content = {
                  song: data.name,
                  album: a.name,
                  by: 'by',
                  artist: data.artists[0].name
                };
                contentLoaded();
              });
          break;
        case 'album':
          this.selectedItem = models.Album.fromURI(data.uri);
          template = this.templates.selected_album;
          content = {
            album: data.name,
            by: 'by',
            artist: data.artists[0].name
          };
          contentLoaded();
          break;
        case 'artist':
          this.selectedItem = models.Artist.fromURI(data.uri);
          template = this.templates.selected_artist;
          content = {
            artist: data.name
          };
          contentLoaded();
          break;
        default:
          break;
      }

    }
  };

  ShareSearch.prototype.deselect = function() {
    this.hasSelected = false;
    dom.removeEventListener(this.inputField, 'focus', this.deselect);
    this.inputField.value = '';
    this.selectedDisplay.innerHTML = '';
    css.removeClass(this.selectedDisplay, 'show');
    css.removeClass(this.inputField, 'hide');
    this.sendButton.setDisabled(true);
  };

  ShareSearch.prototype.search = function(query) {
    var search = Search.suggest(query);
    var doSuggest = models.Promise.join(
        search.artists.snapshot(0, MAX_ITEMS),
        search.albums.snapshot(0, MAX_ITEMS),
        search.tracks.snapshot(0, MAX_ITEMS))
    .done(this.onSnapshotDone.bind(this))
    .fail(this.onSuggestError);
  };

  ShareSearch.prototype.onSnapshotDone = function(snapshots) {
    models.Promise.join(
        this.loadItems(snapshots[0].toArray(), ARTIST_PROPERTIES),
        this.loadItems(snapshots[1].toArray(), ALBUM_PROPERTIES),
        this.loadItems(snapshots[2].toArray(), TRACK_PROPERTIES))
    .done(this.onSearchMore.bind(this))
    .fail(this.onSuggestError.bind(this));
  };

  ShareSearch.prototype.loadItems = function(items, properties) {
    var promises = [];

    for (var i = 0, len = items.length; i < len; i += 1) {
      promises.push(items[i].load(properties));
    }

    return models.Promise.join(promises);
  };

  ShareSearch.prototype.onSearchMore = function(data) {
    var _artists = data[0] || [];
    var _albums = data[1] || [];
    var _tracks = data[2] || [];
    var savedData = this.dataObjects || {};

    this.dataObjects = {};
    var newResults = false;
    data.forEach(function(d) {
      if (d instanceof Object === false) return;
      Object.keys(d).forEach(function(k) {
        this.dataObjects[d[k].uri] = d[k];
        if (d.hasOwnProperty(k)) {
          newResults = true;
        }
      }.bind(this));
    }.bind(this));

    if (newResults === false) {
      this.dataObjects = savedData;
    }

    this.onMetadataDone(data);
  };

  ShareSearch.prototype.onMetadataDone = function(data) {
    var fragment = document.createDocumentFragment();
    var fragments = [];

    var _artists = data[0] || [];
    var _albums = data[1] || [];
    var _tracks = data[2] || [];

    if (typeof this.onSearchResult === 'function') {
      this.onSearchResult(data);
    }
  };

  ShareSearch.prototype.onSuggestError = function() {
    console.error('error', arguments);
  };

  /** VIEW STUFF **/
  ShareSearch.prototype.onSearchResult = function(result) {
    var resultNode = NODE_DIV.cloneNode(false);
    var results = [];
    this.results = [];

    var appendResultNodes = function(ul) {
      for (var i = 0; i < ul.childNodes.length; i++) {
        this.results.push(ul.childNodes[i]);
      }
    }.bind(this);

    // I know this is _FAR_ from optimal, it's due to the fact that the gui
    // logic was implemented before the backend logic.
    // TODO tidy this up when finesse is priorotized higher than feature
    //      complete :D
    if (result[0] !== undefined) {
      results.push(this.buildSection('artists', result[0]));
    }
    if (result[1] !== undefined) {
      results.push(this.buildSection('albums', result[1]));
    }
    if (result[2] !== undefined) {
      results.push(this.buildSection('tracks', result[2]));
    }

    if (result[2] !== undefined) {
      appendResultNodes(results[2]);
    }
    if (result[1] !== undefined) {
      appendResultNodes(results[1]);
    }
    if (result[0] !== undefined) {
      appendResultNodes(results[0]);
    }

    var i = results.length;
    while (i) {
      if (results[i - 1] && result[i - 1].length !== 0) {
        resultNode.appendChild(results[i - 1]);
      }
      i--;
    }

    this.resultContainer.innerHTML = '';
    this.resultContainer.appendChild(resultNode);
  };

  ShareSearch.prototype.hideSearchResults = function() {
    this.resultContainer.innerHTML = '';
  };

  ShareSearch.prototype.buildSection = function(type, sectionData) {
    if (!sectionData) {
      return '';
    }

    var section = NODE_UL.cloneNode(false);
    var item;

    css.addClass(section, 'search-section');
    css.addClass(section, type);

    for (var i = 0, l = sectionData.length; i < l; i++) {
      item = this.buildItem(sectionData[i]);

      if (item) {
        section.appendChild(item);
      }
    }
    return section;
  };

  ShareSearch.prototype.buildItem = function(itemData) {
    var image = new Image(itemData, {
      width: 25,
      style: 'plain'
    });

    var li = NODE_LI.cloneNode(false);
    css.addClass(li, 'search-item');
    li.setAttribute('data-uri', itemData.uri);

    var name = NODE_SPAN.cloneNode(false);
    css.addClass(name, 'item-name');
    name.innerHTML = itemData.name.decodeForText();

    li.appendChild(image.node);
    li.appendChild(name);

    if (itemData.artists && itemData.artists.length > 0) {
      var artist = NODE_SPAN.cloneNode(false);
      css.addClass(artist, 'artist-name');
      // FIXME(fxb): This should use artist.oad('name')!!!
      artist.appendChild(document.createTextNode(' by ' + itemData.artists[0].name.decodeForText()));
      li.appendChild(artist);
    }

    dom.addEventListener(li, 'click', function(e) {
      this.select(e.target.getAttribute('data-uri'));
      e.preventDefault();
      e.stopImmediatePropagation();
    }.bind(this));
    return li;
  };

  ShareSearch.prototype.resetSearch = function(e) {
    if (this.hasSelected === true) {
      this.deselect();
      this.inputField.focus();
    } else {
      this.inputField.value = '';
      this.hideSearchResults();
      css.removeClass(this.resetSearchButton, 'show');
    }
  };

  ShareSearch.prototype.reset = function() {
    this.results = [];
    this.selected = null;
    this.hasSelected = false;
    this.prev = null;
    this.selectedItem = null;
    this.selectedDisplay.innerHTML = '';
    css.removeClass(this.selectedDisplay, 'show');
    this.inputField.value = '';
    this.messageContainer.value = '';
    this.hideSearchResults();
    css.removeClass(this.resetSearchButton, 'show');
  };

  ShareSearch.prototype.setEscapeClose = function(cb) {
    this.escapeClose = cb;
  };

  ShareSearch.prototype.getMessage = function() {
    return this.messageContainer.value;
  };

  ShareSearch.prototype.getSelection = function() {
    return this.selectedItem;
  };

  exports.Search = ShareSearch;
});
