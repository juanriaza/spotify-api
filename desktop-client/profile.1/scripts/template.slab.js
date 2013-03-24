var templates = {
  offline: function(_data_) {
    var _buffer_ = '', _strs = {}, _strtmp;
    _buffer_ += '\n  ';
    _buffer_ += _data_.offlineMessage;
    _buffer_ += '\n';
    return _buffer_;
    // @sourceURL=templates
  },
  selected_artist: function(_data_) {
    var _buffer_ = '', _strs = {}, _strtmp;
    _buffer_ += '\n  <span class=\"artist\">';
    _buffer_ += _data_.artist;
    _buffer_ += '</span>\n';
    return _buffer_;
    // @sourceURL=templates
  },
  selected_album: function(_data_) {
    var _buffer_ = '', _strs = {}, _strtmp;
    _buffer_ += '\n  <span class=\"album\">';
    _buffer_ += _data_.album;
    _buffer_ += '</span> ';
    _buffer_ += _data_.by;
    _buffer_ += ' <span class=\"artist\">';
    _buffer_ += _data_.artist;
    _buffer_ += '</span>\n';
    return _buffer_;
    // @sourceURL=templates
  },
  selected_track: function(_data_) {
    var _buffer_ = '', _strs = {}, _strtmp;
    _buffer_ += '\n  <span class=\"song\">';
    _buffer_ += _data_.song;
    _buffer_ += '</span> - <span class=\"album\">';
    _buffer_ += _data_.album;
    _buffer_ += '</span> ';
    _buffer_ += _data_.by;
    _buffer_ += ' <span class=\"artist\">';
    _buffer_ += _data_.artist;
    _buffer_ += '</span>\n';
    return _buffer_;
    // @sourceURL=templates
  },
  send_done: function(_data_) {
    var _buffer_ = '', _strs = {}, _strtmp;
    _buffer_ += '\n  <div class=\"item sent-message\">';
    _buffer_ += _data_.sentMessage;
    _buffer_ += '</div>\n';
    return _buffer_;
    // @sourceURL=templates
  },
  send_form: function(_data_) {
    var _buffer_ = '', _strs = {}, _strtmp;
    _buffer_ += '\n  <div class=\"form-section item\">\n    <input placeholder=\"';
    _buffer_ += _data_.inputPlaceholder;
    _buffer_ += '\" class=\"music-input\" type=\"text\" name=\"music\"></input>\n    <div class=\"selected-search truncate-text\"></div>\n    <button class=\"search-close\"></button>\n    <div class=\"music-search\"></div>\n    <textarea placeholder=\"(';
    _buffer_ += _data_.textareaPlaceholder;
    _buffer_ += ')\" class=\"message-input\"></textarea>\n  </div>\n  <div class=\"button-section item\"></div>\n';
    return _buffer_;
    // @sourceURL=templates
  },
  send_popup: function(_data_) {
    var _buffer_ = '', _strs = {}, _strtmp;
    _buffer_ += '\n  <div class=\"share-anchor\">\n    <div class=\"share-content\">\n      ';
    _buffer_ += _data_.content;
    _buffer_ += '\n      <div class=\"throbber\"></div>\n    </div>\n  </div>\n';
    return _buffer_;
    // @sourceURL=templates
  },
  empty_message: function(_data_) {
    var _buffer_ = '', _strs = {}, _strtmp;
    _buffer_ += '\n<p class=\"empty-message\">\n  ';
    _buffer_ += _data_.message;
    _buffer_ += '\n</p>\n';
    return _buffer_;
    // @sourceURL=templates
  },
  activity_item: function(_data_) {
    var _buffer_ = '', _strs = {}, _strtmp;
    _buffer_ += '\n  <div class=\"item-image\">\n  </div>\n  <p class=\"activity\">';
    _buffer_ += _data_.activity.text;
    _buffer_ += '</p>\n  <time>';
    _buffer_ += _data_.activity.duration;
    _buffer_ += '</time>\n  <p class=\"message\">';
    _buffer_ += _data_.activity.message;
    _buffer_ += '</p>\n';
    return _buffer_;
    // @sourceURL=templates
  },
  activity: function(_data_) {
    var _buffer_ = '', _strs = {}, _strtmp;
    _buffer_ += '\n  <header class=\"section-header\">\n    <h1 class=\"apply-width\">';
    _buffer_ += _data_.activity.heading;
    _buffer_ += '</h1>\n  </header>\n  <div class=\"section-content apply-width\">\n    <div class=\"recent-activity\">\n\n    </div>\n  </div>\n';
    return _buffer_;
    // @sourceURL=templates
  },
  toplistplaylist: function(_data_) {
    var _buffer_ = '', _strs = {}, _strtmp;
    _buffer_ += '\n  <div class=\"playlist-image\">\n\n  </div>\n  <a href=\"';
    _buffer_ += _data_.playlist.uri;
    _buffer_ += '\" class=\"playlist-name\">';
    _buffer_ += _data_.playlist.name;
    _buffer_ += '</a>\n  <p class=\"playlist-followers\">';
    _buffer_ += _data_.playlist.followers;
    _buffer_ += '</p>\n';
    return _buffer_;
    // @sourceURL=templates
  },
  toplists: function(_data_) {
    var _buffer_ = '', _strs = {}, _strtmp;
    _buffer_ += '\n  <header class=\"section-header\">\n    <h1 class=\"apply-width\">';
    _buffer_ += _data_.toplists.heading;
    _buffer_ += '</h1>\n  </header>\n  <div class=\"section-content\">\n    <div class=\"top-playlists apply-width\">\n\n    </div>\n  </div>\n';
    return _buffer_;
    // @sourceURL=templates
  },
  subscribee: function(_data_) {
    var _buffer_ = '', _strs = {}, _strtmp;
    _buffer_ += '\n  <div class=\"follower-container\">\n    <div class=\"image-container\"></div>\n    <div class=\"follower-info\">\n      <span class=\"friend-info\"></span>\n      <p class=\"friend-num\"></p>\n      <p class=\"playlist-num\"></p>\n    </div>\n    <div class=\"follow-button-container\"></div>\n  </div>\n';
    return _buffer_;
    // @sourceURL=templates
  },
  following: function(_data_) {
    var _buffer_ = '', _strs = {}, _strtmp;
    _buffer_ += '\n<div id=\"following-container\" class=\"section-content\">\n  </div>\n';
    return _buffer_;
    // @sourceURL=templates
  },
  followers: function(_data_) {
    var _buffer_ = '', _strs = {}, _strtmp;
    _buffer_ += '\n<div id=\"followers-container\" class=\"section-content\">\n  </div>\n';
    return _buffer_;
    // @sourceURL=templates
  },
  playlistfollowers: function(_data_) {
    var _buffer_ = '', _strs = {}, _strtmp;
    _buffer_ += '\n  <small>';
    _buffer_ += _data_.playlist.followersText;
    _buffer_ += '</small>\n  <p class=\"popcount-value\">';
    _buffer_ += _data_.playlist.popcount;
    _buffer_ += '</p>\n';
    return _buffer_;
    // @sourceURL=templates
  },
  playlist: function(_data_) {
    var _buffer_ = '', _strs = {}, _strtmp;
    _buffer_ += '\n  <div class=\"playlist-image\"></div>\n  <div class=\"playlist-content\">\n    <div class=\"flex-box\">\n      <header class=\"playlist-header\">\n        <h2><span class=\"playlist-icon\"></span>';
    _buffer_ += _data_.playlist.title;
    _buffer_ += '</h2>\n        <div class=\"playlist-buttonview flex-box\"></div>\n      </header>\n      <div class=\"playlist-followers\">\n\n      </div>\n    </div>\n    <div class=\"playlist-listview\"></div>\n  </div>\n';
    return _buffer_;
    // @sourceURL=templates
  },
  playlists: function(_data_) {
    var _buffer_ = '', _strs = {}, _strtmp;
    _buffer_ += '\n  <header class=\"section-header\">\n    <h1 class=\"apply-width\">';
    _buffer_ += _data_.playlists.heading;
    _buffer_ += '</h1>\n  </header>\n  <div class=\"section-content\">\n    <div class=\"playlists\">\n\n    </div>\n  </div>\n';
    return _buffer_;
    // @sourceURL=templates
  },
  relationsInfo: function(_data_) {
    var _buffer_ = '', _strs = {}, _strtmp;
    _buffer_ += '\n  <a href=\"';
    _buffer_ += _data_.userUriFollowers;
    _buffer_ += '\" class=\"relations-link\">\n    <h2 id=\"followers-heading\">';
    _buffer_ += _data_.followersHeading;
    _buffer_ += '</h2>\n    <p id=\"followers-amount\" class=\"relations-counter\" data-followers-amount="' + _data_.followersAmountUnformatted + '">';
    _buffer_ += _data_.followersAmount;
    _buffer_ += '</p>\n  </a>\n  <hr />\n  <a href=\"';
    _buffer_ += _data_.userUriFollowing;
    _buffer_ += '\" class=\"relations-link\">\n    <h2 id=\"following-heading\">';
    _buffer_ += _data_.followingHeading;
    _buffer_ += '</h2>\n    <p id=\"following-amount\" class=\"relations-counter\" data-following-amount="' + _data_.followingAmountUnformatted + '">';
    _buffer_ += _data_.followingAmount;
    _buffer_ += '</p>\n  </a>\n  <ul id=\"following-avatars\"></ul>\n  <div id=\"relations-popover\" class=\"item closed\"></div>\n';
    return _buffer_;
    // @sourceURL=templates
  },
  header: function(_data_) {
    var _buffer_ = '', _strs = {}, _strtmp;
    _buffer_ += '\n  <div class=\"header apply-width\">\n    <div class=\"header-image-container\"></div>\n    <div class=\"header-content\">\n      <a href=\"';
    _buffer_ += _data_.profile.uri;
    _buffer_ += '\" class=\"h1 truncate-text ';
    _buffer_ += _data_.profile.classname;
    _buffer_ += '\">';
    _buffer_ += _data_.profile.name;
    _buffer_ += '</a>\n      <span class=\"info\"></span>\n\n      <p class=\"listening-to-content\">\n      </p>\n\n      <div class=\"buttons-container\">\n      </div>\n    </div>\n    <div class=\"relations-info\">\n    </div>\n  </div>\n';
    return _buffer_;
    // @sourceURL=templates
  }
};

exports.templates = templates;
