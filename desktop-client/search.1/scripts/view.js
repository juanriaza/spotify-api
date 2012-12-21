/**
 * Copyright (c) 2012 Spotify Ltd
 * @author Martin Jönsson <mart@spotify.com>
 */

require([
  '$api/models',
  '$views/image#Image',
  '$shared/events#EventHandler',
  'scripts/utils',
  'scripts/env#Environment',
  'scripts/config',
  'strings/main.lang'
], function(models, Image, EventHandler, utils, Environment, config, mainStrings) {

  function View(logger) {
    this._logger = logger;
    this._elements = {};

    this.margin = 10;
    this.size = 0;
    this._events = new EventHandler(this);
    this.database = [];
  }

  View.prototype.dispose = function() {
    this._events.removeAll();
    if (this._elements.page) {
      this._elements.page.dispose();
      this._elements = {};
    }
  };


  View.prototype.setSmallSize = function() {
    this.size = 128;
    this.margin = utils.getMargin(this.size);
  };

  View.prototype.setBigSize = function() {
    this.size = 230;
    this.setMargin(0);
  };

  View.prototype.setMargin = function(margin) {
    this.margin = margin;
  };

  View.prototype.setQueryAndCategory = function(query, category) {
    var queryElement = new Element('strong', {
      'text': query
    });
    var searchParagraph = 'search-paragraph-';
    searchParagraph += (category === null) ? 'results' : category;
    this._elements.searchParagraph.set('html', mainStrings.get(searchParagraph, queryElement.outerHTML));
    this._elements.searchQuery.removeClass('hidden');
  };

  View.prototype.setFuzzyMatch = function(fuzzy) {
    if (fuzzy) {
      this._elements.fuzzyMatchAnchor.set('href', 'spotify:search:' + fuzzy);
      this._elements.fuzzyMatchAnchor.set('text', fuzzy);
      this._elements.fuzzyMatch.removeClass('hidden');
    }
  };

  View.prototype.init = function() {
    var elements = this._elements;

    elements.page = new Element('div', {
      'class': 'page'
    });

    //this._throbber = throbber.forElement(elements.page);

    elements.searchQuery = new Element('div', {
      'class': 'search-query hidden',
      events: {
        click: function(e) {
          e.preventDefault();

          if (e.target.href) {
            models.application.openURI(e.target.href);
          }
        }
      }
    });

    elements.searchParagraph = new Element('p', {
      'class': 'search-paragraph',
      'html': '<p>' + mainStrings.get('search-paragraph-results', '&ldquo;<strong></strong>&rdquo;') + '</p>'
    });

    elements.fuzzyMatch = new Element('p', {
      'class': 'fuzzy-match hidden',
      'html': mainStrings.get('did-you-mean', '&ldquo;<a></a>&rdquo;')
    });
    elements.fuzzyMatchAnchor = $$(elements.fuzzyMatch.getElement('a'));

    elements.emptySearchResult = new Element('div', {
      'class': 'empty-search-result',
      'html': '<div><p>' + mainStrings.get('empty-search-result', '&ldquo;<strong></strong>&rdquo;') + '</p></div>'
    });
    elements.emptySearchResultText = $$(elements.emptySearchResult.getElement('strong'));

    elements.searchResult = new Element('div', {
      'class': 'search-result'
    });

    document.body.adopt(
        elements.page.adopt(
        elements.searchQuery.adopt(elements.searchParagraph, elements.fuzzyMatch),
        elements.searchResult,
        elements.emptySearchResult
        )
    );
  };

  View.prototype._onClick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    var xInElement = e.offsetX;
    var yInElement = e.offsetY;
    var xInDocument = e.target.getPosition().x;
    var yInDocument = e.target.getPosition().y;
    var obj = {
      'type': e.target.getParent('.ui').get('data-uri'),
      'x-mouse-pos': xInElement,
      'y-mouse-pos': yInElement,
      'x-target-pos': xInDocument,
      'y-target-pos': yInDocument
    };
    this._logger.clientEvent('click-on-ui-element-in-search', obj);
  };

  View.prototype.getListItem = function(obj) {
    var li = new Element('li', {
      'class': 'ui',
      'data-uri': obj.uri
    });

    var imageOptions = {
      'width': this.size,
      'height': this.size,
      'link': obj.uri,
      'player': true,
      'overlay': [obj.name]
    };

    var img = null;
    console.log('trying to create image for ', obj.uri);
    if (obj.uri.indexOf('spotify:artist:') === 0) {
      li.addClass('artist-ui');
      img = Image.forArtist(obj, imageOptions);
    } else if (obj.uri.indexOf('spotify:album:') === 0) {
      li.addClass('album-ui');
      var name = obj.artists[0].name;
      var href = (name.toLowerCase() !== 'various artists') ? obj.artists[0].uri.toSpotifyURL() : '';
      var artistLink = new Element('a', {
        'html': name,
        'href': href
      });

      imageOptions.overlay.push(artistLink.outerHTML);
      img = Image.forAlbum(obj, imageOptions);

      if (href !== '') {
        img.node.getElement('.sp-image-overlay a').addEvent('click', function(e) {
          var uri = e.target.get('href').toSpotifyURI();
          models.application.openURI(uri);
          return false;
        });
      }
    } else if (obj.uri.indexOf('spotify:user:') === 0) { // playlist
      li.addClass('playlist-ui');
      img = Image.fromSource(obj, imageOptions);
    }
    console.log('created image for ', obj.uri);

    this._events.listen(img.node, 'click', this._onClick);

    li.adopt(img.node);
    this.database.push(li);
    return li;
  };


  View.prototype.paintLoner = function(data, category) {
    var self = this;
    this._elements.page.addClass('loner');

    var node = new Element('section', {
      'class': 'pod ' + category
    });

    node.addClass('loner');

    var hgroup = new Element('hgroup', {
      'class': 'hgroup'
    });

    var h2 = new Element('h2', {
      'text': category
    });

    node.adopt(hgroup.adopt(h2));

    var ul = new Element('ul', {
      'class': 'grid'
    });

    var categoryData = data[0][category];
    var li;

    for (var j = 0, jL = categoryData.length; j < jL; j += 1) {
      li = this.getListItem(categoryData[j]);
      li.set('data-index', j);
      ul.adopt(li);
    }

    node.adopt(ul);

    this._elements.searchResult.adopt(node);
  };

  View.prototype.repaintHeader = function(maxLengths) {
    this.setSmallSize();
    var cols = utils.getCols(this.size, this.margin);
    var amountOfVisible = utils.getFittedArray(this.size, cols, maxLengths);
    var invisible = utils.fillOutWithFakes(amountOfVisible, this.size, cols);
    var left, key, visibleLength, invisibleLength, section, ul, li, width;
    var containerPadding = document.getElement('.search-result').getStyle('padding-left').toInt();
    for (var r = 0, l = amountOfVisible.length; r < l; r += 1) {
      left = containerPadding;
      for (var i = 0, iL = amountOfVisible[r].length; i < iL; i += 1) {
        key = Object.keys(amountOfVisible[r][i])[0];
        visibleLength = amountOfVisible[r][i][key];
        invisibleLength = invisible[key];
        if (visibleLength <= 0) {
          continue;
        }
        section = document.getElement('.' + key);
        ul = section.getElement('ul');

        var button = section.getElement('button');
        var h2 = section.getElement('h2');

        h2.addClass('no-link');
        button.addClass('hidden');
        if (maxLengths[key] > visibleLength) {
          h2.removeClass('no-link');
          button.removeClass('hidden');
        }
        button.setStyle('right', this.margin - 2);

        for (var j = 0, jL = ul.childNodes.length; j < jL; j += 1) {
          li = ul.childNodes[j];
          li.removeClass('hidden');

          if (j === 0) {
            li.setStyle('margin-left', 0);
          } else {
            li.setStyle('margin-left', this.margin);
          }

          if (j >= visibleLength) {
            li.addClass('hidden');
          }
        }

        width = (this.size + this.margin) * invisibleLength;
        section.setStyles({
          'width': width,
          'top': 0,
          'left': left
        });

        if (r > 0) {
          section.setStyle('top', config.POD_HEIGHT);
        }

        left += width;
      }
    }
    this.setRows(maxLengths);
    if (Environment.desktop) {
      this.setHeaderSize(this.size, maxLengths);
    }
  };

  View.prototype.setHeaderSize = function(size, maxLengths) {
    var rows = utils.getRows(size, maxLengths);
    if (rows === 2) {
      _getSpotifyModule('core')._set_body_size(10, 414, true);
    } else if (rows === 1) {
      _getSpotifyModule('core')._set_body_size(10, 237, true);
    } else {
      _getSpotifyModule('core')._set_body_size(10, 40, true);
    }
  };

  View.prototype.createHeader = function(headerData, maxLengths, query) {
    var docFrag = document.createDocumentFragment();

    this.setSmallSize();
    var cols = utils.getCols(this.size, this.margin);
    var amountOfVisible = utils.getFittedArray(this.size, cols, maxLengths);
    console.log('amountOfVisible', amountOfVisible);
    var invisible = utils.fillOutWithFakes(amountOfVisible, this.size, cols);
    console.log('invisible', invisible);
    var containerPadding = document.getElement('.search-result').getStyle('padding-left').toInt();
    var left, key, visibleLength, invisibleLength, data, section, hgroup, h2, button, ul, li, width;
    for (var r = 0, l = amountOfVisible.length; r < l; r += 1) {
      left = containerPadding;
      for (var i = 0, iL = amountOfVisible[r].length; i < iL; i += 1) {
        key = Object.keys(amountOfVisible[r][i])[0];
        visibleLength = amountOfVisible[r][i][key];
        invisibleLength = invisible[key];
        console.log('key', key);
        console.log('visibleLength', visibleLength);
        console.log('invisibleLength', invisibleLength);
        if (visibleLength <= 0) {
          continue;
        }

        data = headerData[key];

        section = new Element('section', {
          'class': 'pod ' + key,
          'data-category': key
        });

        hgroup = new Element('hgroup', {
          'class': 'hgroup'
        });

        h2 = new Element('h2', {
          'text': key.charAt(0).toUpperCase() + key.slice(1),
          'class': 'title no-link'
        });

        button = new Element('button', {
          'class': 'see-all hidden',
          'text': 'See all',
          'styles': {
            'right': this.margin - 2
          }
        });

        if (maxLengths[key] > visibleLength) {
          h2.removeClass('no-link');
          button.removeClass('hidden');
        }

        ul = new Element('ul', {
          'class': 'grid'
        });

        for (var j = 0, jL = visibleLength; j < jL; j += 1) {
          if (data[j]) {
            li = this.getListItem(data[j]);
            var margin = (j === 0) ? 0 : this.margin;
            li.setStyle('margin-left', margin);
            li.set('data-index', j);
            ul.adopt(li);
          }
        }

        width = (this.size + this.margin) * invisibleLength;
        section.setStyles({
          'width': width,
          'top': 0,
          'left': left
        });

        if (r > 0) {
          section.setStyle('top', config.POD_HEIGHT);
        }

        left += width;

        docFrag.appendChild(section.adopt(hgroup.adopt(h2), button, ul));
      }
    }

    this.setRows(maxLengths);
    this._elements.searchResult.appendChild(docFrag);
    if (Environment.desktop) {
      this.setHeaderSize(this.size, maxLengths);
    }
  };

  View.prototype.setRows = function(maxLengths) {
    this._elements.page
        .removeClass('rows-1')
        .removeClass('rows-2')
        .addClass('rows-' + utils.getRows(this.size, maxLengths));
  };

  View.prototype.addMoreData = function(data, show) {
    var docFrag, ul, li, dataIndex;
    for (var key in data) {
      docFrag = document.createDocumentFragment();
      ul = document.getElement('.' + key).getElement('ul');
      dataIndex = ul.getElement('li:last-child').get('data-index').toInt();
      for (var i = 0, l = data[key].length; i < l; i += 1) {
        li = this.getListItem(data[key][i]);
        dataIndex += 1;
        li.set('data-index', dataIndex);
        if (!show) {
          li.addClass('hidden');
        }
        docFrag.appendChild(li);
      }
      ul.appendChild(docFrag);
    }
  };

  View.prototype._onFail = function() {
    this._elements.page.addClass('empty-search');
    this._elements.emptySearchResult.set('html', '<div><p>' + mainStrings.get('no-tracks') + '</p></div>');
  };

  View.prototype.paintList = function(list) {
    var self = this;
    list.addEventListener('empty', function() {
      self._onFail();
    });
    var section = new Element('section', {
      'class': 'tracks',
      'data-category': 'tracks'
    });
    this._elements.searchResult.adopt(section.adopt(list.node));
    list.init();
  };

  exports.View = View;

});
