require([
  '/scripts/env#Environment',
  '/strings/main.lang'
], function(Environment, localeStrings) {

  var _ = localeStrings.get.bind(localeStrings);

  function Biography() {
    this.view = new Biography.view;
    this.loaded = false;
    this.imagesLoaded = false;
    this.noBio = false;
    this.specialCases = {
      'spotify:artist:0du5cEVh5yTK9QJze8zA0C': 200
    };
  }

  Biography.view = BiographyView;

  /**
  * Initialises biography
  * @param  {Object} artist The artist object.
  * @return {Bool}        Returns true if a biography texts is available, otherwise false.
  */
  Biography.prototype.init = function(artist) {
    this.artist = artist;
    this.view.init();
    var bio = this.artist ? this.artist.biography : '';
    this.noBio = bio === undefined || bio.length === 0;
    if (this.noBio) {
      this.view.hide();
      return false;
    }
    return true;
  };

  Biography.prototype.destroy = function() {
    this.loaded = false;
    this.imagesLoaded = false;
    this.noBio = false;
    this.view.destroy();
  };

  Biography.prototype.render = function() {
    this.loaded = true;
    if (this.noBio) return;
    var bio = this.artist.biography;

    this.view.show();
    var sentences,
        firstSentence;
    if (this.specialCases[this.artist.uri]) {
      firstSentence = bio.substring(0, this.specialCases[this.artist.uri]);
    } else {
      var nameTest = this.artist.name.split('.'),
          pattern;
      if (nameTest.length === 1) {
        sentences = bio.match(/((?:.*?)\.\s[A-Z])/);
        firstSentence = (sentences) ? sentences[0] : bio;
      } else {
        var nameIgnore = nameTest.slice(1, nameTest.length).join('.');
        nameIgnore = nameIgnore.replace('.', '\\.');
        nameIgnore = nameIgnore.replace(' ', '\\s');
        var re = new RegExp('((?:.*?)(?:' + nameIgnore + ')(?:.*?)\\.\\s[A-Z])');
        sentences = bio.match(re);
        firstSentence = (sentences) ? sentences[0] : bio;
      }
      if (sentences) {
        firstSentence = firstSentence.substr(0, firstSentence.length - 2);
      }
    }
    bio = bio.replace(firstSentence, this.view.makeIntro(firstSentence));
    var paragraphs = bio.split('\n').forEach(this.view.addParagraph.bind(this.view));
    this.view.renderText(this.artist);
  };

  Biography.prototype.renderImages = function() {
    this.imagesLoaded = true;
    this.view.renderImages(this.artist);
  };

  function BiographyView() {}

  BiographyView.IMAGE_HEIGHT = 138;
  BiographyView.IMAGE_PADDING = 22; // This isn't the same as CSS padding, it's the full extra spacing.
  BiographyView.PAGE_WIDTH = 600;
  BiographyView.CONTENT_CONTAINER = $('biography-text');
  BiographyView.GALLERY_CONTAINER = $('biography-gallery');

  BiographyView.prototype.init = function() { this._bio = ''; this._imagesInjected = false; };
  BiographyView.prototype.destroy = function() {
    this._bio = '';
    $('biography-gallery').empty();
    $('biography-text').empty();
    this._imagesInjected = false;
  };
  BiographyView.prototype.show = function() { $$('li.biography').setStyle('display', 'inline-block'); };
  BiographyView.prototype.hide = function() { $$('li.biography').setStyle('display', 'none'); };
  BiographyView.prototype.makeIntro = function(sentence) { return '<p class="intro">' + sentence + '</p>'; };
  BiographyView.prototype.addParagraph = function(paragraph) { this._bio += ('<p>' + paragraph + '</p>'); };

  BiographyView.prototype.renderText = function(artist) {
    BiographyView.CONTENT_CONTAINER.innerHTML = this._bio;
    this._highlightLinks();
  };

  BiographyView.prototype.renderImages = function(artist) {
    // first image is the portrait
    if (artist.portraits.length > 1) {
      var listNode = new Element('ul', {id: 'biography-images', 'class': 'cf'}),
          liNode = new Element('li'),
          img = new Element('img', {'class': 'biography-image'});

      var currentWidth = 0,
          loadedImages = 0,
          self = this;
      var updateWidth = function() {
        loadedImages += 1;

        var imageWidth = Math.floor((BiographyView.IMAGE_HEIGHT / this.height) * this.width);
        currentWidth += (imageWidth + BiographyView.IMAGE_PADDING);

        // The -1 on the length is due to the skipping of the first image (that's the main portrait)
        if (self._imagesInjected === false && (currentWidth > BiographyView.PAGE_WIDTH || loadedImages === artist.portraits.length - 1)) {
          self._imagesInjected = true;
          self.injectImages(BiographyView.GALLERY_CONTAINER, listNode, currentWidth);
        }
      };

      for (var i = 1, j = artist.portraits.length; i < j; i++) {
        var image = img.clone(),
            li = liNode.clone(),
            imageSource = artist.portraits[i];

        if (Environment.web) {
          imageSource = imageSource.replace('300', 'artist_image');
        }
        image.setProperty('src', imageSource);
        image.inject(li);
        li.inject(listNode);

        image.addEvent('load', updateWidth);
      }
    }
  };

  BiographyView.prototype.injectImages = function(biographyNode, listNode, currentWidth) {
    listNode.inject(biographyNode, 'top');

    if (currentWidth > BiographyView.PAGE_WIDTH) {
      var toggleNode = new Element('p', {id: 'biography-toggle', html: _('see-more')});
      toggleNode.addEvent('click', function() {
        listNode.removeClass('closed');
        listNode.addClass('open');
        listNode.addClass('animation');
        this.dispose();
      });
      listNode.addClass('closed');
      toggleNode.inject(listNode, 'after');
    }
  };

  BiographyView.prototype._highlightLinks = function() {
    BiographyView.CONTENT_CONTAINER.getElements('a').forEach(function(element) {
      if (element.href.match(/spotify:/)) {
        element.href = element.href.toSpotifyURL();
      }
    });
  };

  exports.Biography = Biography;
});
