/**
 * Copyright (c) 2012 Spotify Ltd
 * @author Martin Jönsson <mart@spotify.com>
 */

require([
  '$api/models',
  '$views/utils/css',
  '$views/image#Image'
], function(models, css, Image) {

  /**
   * The UI class that will create the correct node for each category
   * @constructor
   * @param {String} type What kind of UI will it display (artist/albums/playlist).
   * @param {Logger} logger Logger.
   * @param {Array.<number>} size The desired size. Default: 122x152.
   */
  function UI(type, logger, size) {
    /**
     * The amount of items to display
     * @type {object}
     * @private
     */
    this._type = type;

    /**
     * The size of the UI cover node.
     * @type {Array.<number>}
     * @private
     */
    this._size = size || [122, 122];

    /**
     * The logger.
     * @type {Logger}
     * @private
     */
    this._logger = logger;

    /**
     * The properties for this UI.
     * @type {Logger}
     * @private
     */
    this.properties = UI.PROPERTIES[this._type];
  }

  /**
   * The properties for each UI type.
   * @type {Object}
   * @const
   */
  UI.PROPERTIES = {
    'artists': ['image', 'name', 'uri'],
    'albums': ['image', 'name', 'uri', 'artists'],
    'playlists': ['image', 'name', 'uri']
  };


  UI.prototype._onClick = function(e) {
    var x = e.page.x - e.target.getPosition().x;
    var y = e.page.y - e.target.getPosition().y;
    this._logger.clientEvent('click-on-ui-element-in-search', {
      'type': this._type,
      'x-mouse-pos': x,
      'y-mouse-pos': y
    });
  };

  /**
   * Will create the correct node depending on type
   * @param {Artist|Album|Playlist} obj The object.
   * @return {Element} The generated element.
   */
  UI.prototype.makeNode = function(obj) {
    var li = new Element('li', {
      'class': 'ui ' + this._type.toLowerCase() + '-ui'
    });

    var imageOptions = {
      'width': this._size[0],
      'height': this._size[1],
      'link': obj.uri,
      'player': true,
      'overlay': [obj.name]
    };

    var img = null;
    if (this._type === 'artists') {
      img = Image.forArtist(obj, imageOptions);
    } else if (this._type === 'albums') {
      var artistLink = new Element('a', {
        'html': obj.artists[0].name,
        'href': obj.artists[0].uri.toSpotifyURL()
      });
      imageOptions.overlay.push(artistLink.outerHTML);
      img = Image.forAlbum(obj, imageOptions);
      img.node.getElement('.sp-image-overlay a').addEvent('click', function(e) {
        var uri = e.target.get('href').toSpotifyURI();
        models.application.openURI(uri);
        return false;
      });
    } else if (this._type === 'playlists') {
      img = Image.forPlaylist(obj, imageOptions);
    }

    var self = this;
    img.node.addEvent('click', function(event) {
      self._onClick(event);
    });

    return li.adopt(img.node);
  };

  /**
   * A bigger version of {@link UI} (230x230). This is used in loner version.
   * @constructor
   * @extends {UI}
   */
  function BigUI(type, logger) {
    UI.call(this, type, logger, [230, 230]);
  }
  SP.inherit(BigUI, UI);

  /**
   * @class PlaylistUI
   * @constructor
   * @classdesc A class that will create playlist UI.
   * @extends {UI}
   *
   * @param {Logger} logger Loggerizzle.
   * @param {Array} size The desired size. Default: 124x154.
   *
   * @this {PlaylistUI}
   *
   */
  function PlaylistUI(logger, size) {
    UI.call(this, logger, size);
    this.properties = ['uri', 'name', 'image'];
    this.type = 'playlist';
  }
  SP.inherit(PlaylistUI, UI);

  exports.UI = UI;
  exports.BigUI = BigUI;

});
