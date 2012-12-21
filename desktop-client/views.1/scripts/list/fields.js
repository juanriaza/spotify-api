'use strict';

require(['$views/image#Image'], function(Image) {

  /**
   * Predefined fields for the list.
   * The property names can be used in the fields property in the options for the list.
   * Fields with property names that start with track-/artist-/album- can be used without
   * that prefix, eg. 'image' would render the field 'track-image' for a track list.
   *
   * @type {Object}
   */
  exports.LIST_FIELDS = {

    /**
     * Displays the track name.
     * Flexible width.
     *
     * @type {Object}
     */
    track: {
      title: 'Track',
      className: 'sp-list-cell-track',
      widthWeight: 7,
      neededProperties: { track: ['name', 'explicit'] },
      get: function(data) {
        var name = data.track.name.decodeForHtml();

        // For web, output a context button next to the track name
        if (data.list.model.userDevice === 'web') {
          var button = '<button type="button" class="sp-list-contextbutton">...</button>';
          var nameHTML = '<span class="sp-list-cell-track-name">' + name + '</span>';
          return button + nameHTML;
        }

        // For other devices, just return the track name
        return name;
      }
    },

    /**
     * Displays the track name with an image in front.
     * Flexible width.
     *
     * @type {Object}
     */
    'image:track': {
      title: 'Track',
      className: 'sp-list-cell-track',
      widthWeight: 7,
      neededProperties: { track: ['name', 'image'], album: ['image'] },
      get: function(data) {
        var image = data.track.image || data.album.image || '';
        return '<div class="sp-list-artwork"><img src="' + image + '" alt=""></div>' + data.track.name.decodeForHtml();
      }
    },

    /**
     * Displays the artist name as a link.
     * Flexible width.
     *
     * @type {Object}
     */
    artist: {
      title: 'Artist',
      className: 'sp-list-cell-artist',
      widthWeight: 3, // Will be 5 when 'trackartist' is used to get the field
      neededProperties: { artist: ['uri', 'name'], track: ['explicit'] },
      get: function(data) {
        var output = '';
        var artist;
        for (var i = 0, l = data.artists.length; i < l; i++) {
          artist = data.artists[i];
          if (artist.name) {
            var name = artist.name.decodeForHtml();

            // Current implementation of the API only gives one way to test for a local artist.
            // The artist uri is then set to the string below.
            // A local artist doesn't exist in Spotify, so don't link it.
            if (artist.uri !== 'spotify:artist:0000000000000000000000') {
              output += '<a href="' + artist.uri.toSpotifyLink() + '" data-uri="' + artist.uri + '">';
              output += name;
              output += '</a>';
            } else {
              output += name;
            }

            // Add comma between artists
            output += (i < l - 1 ? ', ' : '');
          }
        }
        return output;
      }
    },

    /**
     * Displays the album name as a link.
     * Flexible width.
     *
     * @type {Object}
     */
    album: {
      title: 'Album',
      className: 'sp-list-cell-album',
      widthWeight: 4,
      neededProperties: { album: ['uri', 'name'] },
      get: function(data) {
        var output = '';
        var album = data.album;
        if (album.name) {
          var name = album.name.decodeForHtml();

          // Current implementation of the API only gives one way to test for a local album.
          // The album uri is then set to the string below.
          // A local album doesn't exist in Spotify, so don't link it.
          if (album.uri !== 'spotify:album:0000000000000000000000') {
            output += '<a href="' + album.uri.toSpotifyLink() + '" data-uri="' + album.uri + '">';
            output += name;
            output += '</a>';
          } else {
            output += name;
          }
        }
        return output;
      }
    },

    /**
     * Displays the track duration in the format m:ss.
     * Fixed width.
     *
     * @type {Object}
     */
    time: {
      title: 'Time',
      className: 'sp-list-cell-time',
      fixedWidth: 58,
      neededProperties: { track: ['duration'] },
      get: function(data) {
        var duration = Math.round((data.track.duration || 0) / 1000);
        var minutes = Math.floor(duration / 60);
        var seconds = Math.round(duration % 60);
        seconds = seconds < 10 ? '0' + seconds : seconds;
        return minutes + ':' + seconds;
      }
    },

    /**
     * Displays the popularity of the track.
     * Fixed width.
     *
     * @type {Object}
     */
    'track-popularity': {
      title: 'Popularity',
      className: 'sp-list-cell-popularity',
      fixedWidth: 75,
      fixedWidthNoHeader: 51,
      neededProperties: { track: ['popularity'] },
      get: function(data) {
        var popularity = parsePopularity(data.track.popularity);
        return '<span class="sp-popularity-indicator"><span class="sp-popularity-indicator-value" style="width: ' + popularity + '%"></span></span>';
      }
    },

    /**
     * Displays the popularity of the track.
     * Fixed width.
     *
     * @type {Object}
     */
    'artist-popularity': {
      title: 'Popularity',
      className: 'sp-list-cell-popularity',
      fixedWidth: 75,
      fixedWidthNoHeader: 51,
      neededProperties: { artist: ['popularity'] },
      get: function(data) {
        var popularity = parsePopularity(data.artists[0].popularity);
        return '<span class="sp-popularity-indicator"><span class="sp-popularity-indicator-value" style="width: ' + popularity + '%"></span></span>';
      }
    },

    /**
     * Displays the popularity of the track.
     * Fixed width.
     *
     * @type {Object}
     */
    'album-popularity': {
      title: 'Popularity',
      className: 'sp-list-cell-popularity',
      fixedWidth: 75,
      fixedWidthNoHeader: 51,
      neededProperties: { album: ['popularity'] },
      get: function(data) {
        var popularity = parsePopularity((data.album && data.album.popularity) || 0);
        return '<span class="sp-popularity-indicator"><span class="sp-popularity-indicator-value" style="width: ' + popularity + '%"></span></span>';
      }
    },

    /**
     * Displays the now playing icon when the track is playing. Empty otherwise.
     * Fixed width.
     *
     * @type {Object}
     */
    nowplaying: {
      title: '',
      className: 'sp-list-cell-nowplaying',
      fixedWidth: 30,
      neededProperties: {},
      get: function(data) {
        return '<span class="sp-icon-nowplaying"></span>';
      }
    },

    /**
     * Displays the star for the track, to enable starring.
     * When used on the web, it will be replaced by 'nowplaying'.
     * Fixed width.
     *
     * @type {Object}
     */
    star: {
      title: '',
      className: 'sp-list-cell-star',
      fixedWidth: 30,
      neededProperties: { track: ['starred'] },
      get: function(data) {
        var starHitareaStart = '<span class="sp-icon-star-hitarea">';
        var starIcon = '<span class="sp-icon-star' + (data.track.starred ? ' sp-icon-starred' : '') + '"></span>';
        var starHitareaEnd = '</span>';
        var nowplaying = '<span class="sp-icon-nowplaying"></span>';
        return starHitareaStart + starIcon + starHitareaEnd + nowplaying;
      }
    },

    /**
     * Displays the track artwork.
     * Fixed width.
     *
     * @type {Object}
     */
    'track-image': {
      title: '',
      className: 'sp-list-cell-image',
      fixedWidth: 33,
      neededProperties: { track: ['image'], album: ['image'] },
      get: function(data) {
        var options = data.imageOptions || {
          placeholder: 'track',
          width: data.list.layout === 'toplist' ? 30 : 21,
          style: 'inset'
        };
        var image = data.track.image ? Image.forTrack(data.track, options) : Image.forAlbum(data.album, options);
        return image.node;
      }
    },

    /**
     * Displays the artist image.
     * Fixed width.
     *
     * @type {Object}
     */
    'artist-image': {
      title: '',
      className: 'sp-list-cell-image',
      fixedWidth: 33,
      neededProperties: { artist: ['image'] },
      get: function(data) {
        var options = data.imageOptions || {
          placeholder: 'artist',
          width: data.list.layout === 'toplist' ? 30 : 21,
          style: 'inset'
        };
        return Image.forArtist(data.artists[0], options).node;
      }
    },

    /**
     * Displays the album artwork.
     * Fixed width.
     *
     * @type {Object}
     */
    'album-image': {
      title: '',
      className: 'sp-list-cell-image',
      fixedWidth: 33,
      neededProperties: { album: ['image'] },
      get: function(data) {
        var options = data.imageOptions || {
          placeholder: 'album',
          width: data.list.layout === 'toplist' ? 30 : 21,
          style: 'inset'
        };
        return Image.forAlbum(data.album, options).node;
      }
    },

    /**
     * Displays the track number within a disc.
     * Fixed width.
     *
     * @type {Object}
     */
    number: {
      title: '',
      className: 'sp-list-cell-listnumber',
      fixedWidth: 32,
      neededProperties: { track: ['number'] },
      get: function(data) {
        var listNumber = data.track.number || (data.index + 1);
        var hasStarField = data.list.model.hasStarField;
        var digits = '<span class="sp-list-listnumber' + (hasStarField ? '' : ' sp-list-listnumber-nowplaying') + '">' + listNumber + '</span>';
        var nowplaying = hasStarField ? '' : '<span class="sp-icon-nowplaying"></span>';
        return digits + nowplaying;
      }
    },

    /**
     * Displays the item number within the list, with a leading zero for top tracks.
     * Fixed width.
     *
     * @type {Object}
     */
    ordinal: {
      title: '',
      className: 'sp-list-cell-listnumber',
      fixedWidth: 33,
      neededProperties: {},
      get: function(data) {
        var listNumber = data.index + 1;
        if (data.list.layout === 'toplist') {
          listNumber = (listNumber + data.list.options.visualOffset);
          listNumber = listNumber < 10 ? '0' + listNumber : listNumber;
        }
        var hasStarField = data.list.model.hasStarField;
        var digits = '<span class="sp-list-listnumber' + (hasStarField ? '' : ' sp-list-listnumber-nowplaying') + '">' + listNumber + '</span>';
        var nowplaying = hasStarField ? '' : '<span class="sp-icon-nowplaying"></span>';
        return digits + nowplaying;
      },
      update: function(data, cell) {
        var listNumber = data.index + 1;
        if (data.list.layout === 'toplist') {
          listNumber = (listNumber + data.list.options.visualOffset);
          listNumber = listNumber < 10 ? '0' + listNumber : listNumber;
        }
        cell.querySelector('.sp-list-listnumber').innerHTML = listNumber;
      }
    },

    /**
     * Displays the share button.
     * Fixed width.
     *
     * @type {Object}
     */
    share: {
      title: '',
      className: 'sp-list-cell-share',
      fixedWidth: 32,
      neededProperties: {},
      get: function(data) {
        var shareHitareaStart = '<span class="sp-list-share-hitarea" data-button="share">';
        var shareButton = '<button type="button" class="sp-list-sharebutton" data-button="share">Share</button>';
        var shareHitareaEnd = '</span>';
        return shareHitareaStart + shareButton + shareHitareaEnd;
      }
    }

  };

  /**
   * Default fields for different list types.
   *
   * @type {Object}
   */
  exports.DEFAULT_FIELDS = {
    'default': {
      // 'star' will be replaced by 'nowplaying' on the web
      tracks: ['star', 'track', 'artist', 'time', 'album'],
      artists: ['artist'],
      albums: ['album']
    },
    'toplist': {
      tracks: ['ordinal', 'image', 'track'],
      artists: ['ordinal', 'image', 'artist'],
      albums: ['ordinal', 'image', 'album']
    }
  };

  /**
   * Helper function to parse the popularity percentage to percentage for whole bars.
   *
   * @ignore
   *
   * @param {number} popularity Percentage value, between 0 and 100.
   *
   * @return {number} Popularity percentage, between 0 and 100.
   */
  function parsePopularity(popularity) {
    popularity = popularity / 100;
    var width = Math.round(popularity * 35);
    var diff = width % 3;
    width = diff > 1.5 ? width + (3 - diff) : width - diff;
    popularity = width / 35 * 100;

    return popularity;
  }

});
