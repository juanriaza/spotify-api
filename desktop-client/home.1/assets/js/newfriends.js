'use strict';

var dom = sp.require('$util/dom'),
    array = sp.require('$util/array'),
    p = sp.require('$unstable/pager'),
    wnData = sp.require('assets/js/data'),
    logger = sp.require('$util/logger'),
    promise = sp.require('$util/promise'),
    models = sp.require('$api/models'),
    staticdata = sp.require('$unstable/staticdata');

var loadingEl = dom.queryOne('.loading');

var loggingVersion;
var testVersion;

var NewFriends = {
  _key: 'NewFriends',
  _loaded: false,
  _loadEvent: null,
  influencersTestVersion: null,
  currentLayout: null,
  headings: null,
  stepCallback: function() {},

  /**
   * @constructor
   * @this NewFriends
   * @param {object} data the data to be used in the object.
   */
  init: function(data) {
    this._loadEvent = new dom.Event(this._key + '.load', true);

    loggingVersion = this.loggingVersion;
    testVersion = this.testVersion;

    if (!data || !data.friends) {
      if (!data) {
        data = {};
      }
      data.friends = [];
    }

    this.extend(data.friends);
  },

  setInfluencersTestVersion: function(influencersTestVersion) {
    this.influencersTestVersion = influencersTestVersion;
  },

  setCurrentLayout: function(currentLayout) {
    this.currentLayout = currentLayout;
  },

  setHeadings: function(headings) {
    this.headings = headings;
  },

  setStepCallback: function(fn) {
    this.stepCallback = fn;
  },

  /**
   * Extend data received from discovery
   * @this NewFriends
   * @param {object} the data to be extended.
   */
  extend: function(data) {
    var existingUserNames = [];
    var filteredData = [];

    data.forEach(function(username, index) {
      var userExists = false;
      for (var i = 0, l = existingUserNames.length; i < l; i++) {
        if (existingUserNames[i] == username) {
          userExists = true;
        }
      }
      if (!userExists) {
        existingUserNames.push(username);
        filteredData.push(username);
      }
    });

    this._data = filteredData;
    array.shuffle(filteredData);
    wnData.Data.set(this._key, filteredData);
    this._loaded = true;
    this._loadEvent.dispatch(window);
  },

  /**
   * @this NewFriends
   * Calls the build method if it's loaded, otherwise create an
   * event listener for it
   */
  next: function() {
    if (this._loaded) {
      this.build();
    } else {
      dom.listen(window, this._key + '.load', this.build.bind(this));
    }
  },

  /**
   * @this NewFriends
   * Builds the UI and calls the stepper function if it was successful
   */
  build: function() {
    // var self = NewFriends;
    if (loadingEl) {
      dom.destroy(loadingEl);
    }

    var self = this;

    var wrapper = dom.id(this._key),
        allFriends = wnData.Data.get(this._key),
        data = [],
        friendsAvailable = allFriends.length,
        friendsLoaded = 0;

    if (!wrapper || !allFriends) {
      return;
    }

    var _friendsLoadEvent = new dom.Event('newfriendsdata.load', true);

    //When all friends are loaded, build:
    dom.listen(window, 'newfriendsdata.load', function(evt) {
      var perPage = 4;

      // Pad with interesting people. Will cause this._data to always
      // contain data.
      if ('ia' === self.influencersTestVersion) {
        var interestingPeople = staticdata.getInterestingPeople();

        array.shuffle(interestingPeople);
        data = data.concat(interestingPeople);
      }

      if (data.length > 12) {
        data = data.slice(0, 12);
      }

      if (!data || data.length < 1) {
        self.stepCallback(false);
        return;
      }

      array.shuffle(data);

      switch (self.currentLayout) {
        case 1: perPage = 4; break;
        case 2: perPage = 3; break;
        case 3: perPage = 2; break;
      }

      var newFriendsDS = new NewFriendsDataSource(data);

      var pager = new p.Pager(newFriendsDS, {
        perPage: perPage,
        hidePartials: false,
        orientation: 'horizontal',
        pagingLocation: 'top',
        bullets: false,
        context: 'newFriends'
      });
      if (loadingEl) {
        dom.destroy(loadingEl);
      }
      pager.h2.innerHTML = self.headings[self._key];
      dom.adopt(wrapper, pager.node);

      self.stepCallback(true);

      dom.listen(window, 'layout.switch', function() {
        var perPage = null;
        switch (self.currentLayout) {
          case 1: perPage = 4; break;
          case 2: perPage = 3; break;
          case 3: perPage = 2; break;
        }
        if (perPage) {
          pager.setOptions({perPage: perPage});
          pager.reflow();
        }
      });
    });

    //Loop through allFriends and only get those with a facebook UID
    if (allFriends.length > 0) {
      var userPromises = [];
      allFriends.forEach(function(friend, index) {
        var pr = new promise.Promise();

        userPromises.push(pr);
        var user = new models.User.fromURI('spotify:user:' + friend);
        pr.resolve(user);
      });

      var pr = promise.join.apply(promise, userPromises);

      pr.always(function() {
        var users = Array.prototype.slice.call(arguments, 0, arguments.length);

        for (var i = 0, l = users.length; i < l; i += 1) {
          var user = users[i];

          if (user.loaded && user.data.facebookUid) {
            friendsLoaded++;
            data.push(user.data);
          }
          else {
            friendsAvailable--;
          }
          if (friendsAvailable === friendsLoaded) {
            _friendsLoadEvent.dispatch(window);
          }
        }
      });
    }
    else {
      //Go straight to padding
      _friendsLoadEvent.dispatch(window);
    }
  }
};

function NewFriendsDataSource(data) {
  data = data;

  this.count = function() {
    return data.length;
  };

  this.makeNode = function(index) {
    var d = data[index], li = new dom.Element('li');

    var picture = 'defaultimage.jpg';
    if (d.facebookUid !== undefined) {
      picture = 'https://graph.facebook.com/' + d.facebookUid + '/picture';
    }
    else if (d.picture !== undefined) {
      picture = d.picture;
    }

    var userURI = 'spotify:user:' + d.canonicalUsername;
    li.innerHTML = '<a href="' + userURI + '" class="image" ' +
        'style="background-image: url(' + picture + ')"></a>' +
        '<span class="text"><a href="spotify:user:' +
        d.canonicalUsername + '" class="user">' + d.name + '</a>' +
        '<span class="presence"></span></span>';

    logger.logClick(dom.queryOne('a.image', li), 'newFriends picture', loggingVersion, testVersion, {'uri': userURI});
    logger.logClick(dom.queryOne('a.user', li), 'newFriends link', loggingVersion, testVersion, {'uri': userURI});

    return li;
  };
}

exports.NewFriends = NewFriends;
