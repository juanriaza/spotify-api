var utils = exports;

require([
  'scripts/config'
], function(config) {


  /**
   * Helper method to get scrolled pixels from top.
   */
  utils.getScrollTop = function() {
    if ('undefined' !== typeof window.pageYOffset) {
      return window.pageYOffset;
    } else {
      var _b = document.body; // IE 'quirks'
      var _d = document.documentElement; // IE with doctype
      _d = (_d.clientHeight) ? _d : _b;
      return _d.scrollTop;
    }
  };

  utils.isQueryAndCategoryOK = function(query, category) {
    var maxChars = 300;
    if (typeof query !== 'undefined' && query.length < maxChars) {
      if (category !== null && category.length > maxChars) {
        return false;
      } else {
        return true;
      }
    } else {
      return false;
    }
  };

  utils.isCategoryProper = function(category) {
    return typeof category !== 'undefined' && config.CATEGORIES.indexOf(category) !== -1;
  };

  utils.getRows = function(size, availableCategories) {
    var cols = this.getCols(size);
    if (Object.getLength(availableCategories) > 2 && // three categories
        availableCategories.playlists >= cols && // playlists have enough
        availableCategories.artists + availableCategories.albums >= cols) {
      return 2;
    } else if (availableCategories.artists +
               availableCategories.albums +
               availableCategories.playlists === 0) {
      return 0;
    } else {
      return 1;
    }
  };

  utils.getWidth = function() {
    // TODO: do not hardcode.
    return document.body.getSize().x - 40;
  };

  utils.getCols = function(size, m) {
    var margin = m || 10;
    return Math.floor((this.getWidth() + margin) / (size + margin));
  };

  utils.getMargin = function(size) {
    var cols = this.getCols(size);
    return Math.floor((this.getWidth() - (cols * size)) / (cols - 1));
  };

  /**
   * Helper method to get the total number of a dictionary.
   */
  utils.getTotal = function(dict) {
    var p = 0;
    for (var key in dict) {
      if (dict.hasOwnProperty(key)) {
        p += parseInt(dict[key], 10);
      }
    }
    return p;
  };

  /**
   * Helper method to trim down the dictionary to fit within columns
   */
  utils.trim = function(dict, cols) {
    var key = Object.keys(dict)[0];
    var max = dict[key];
    while (this.getTotal(dict) > cols) {
      for (var loopkey in dict) {
        if (max < dict[loopkey]) {
          key = loopkey;
          break;
        }
      }
      dict[key] -= 1;
      max = dict[key];
    }
    return dict;
  };

  utils.getFittedArray = function(size, cols, data) {
    var rows = utils.getRows(size, data);
    var categories = Object.keys(data);
    var arr = [], row = [];
    var firstRow, key, obj;
    if (rows === 2) {
      firstRow = Object.subset(data, categories.slice(0).splice(0, 2));
      firstRow = this.trim(firstRow, cols);
      var secondRow = Object.subset(data, categories.slice(0).splice(2, categories.length - 2));
      secondRow = this.trim(secondRow, cols);
      var _rows = [firstRow, secondRow];

      for (var i = 0; i < 2; i += 1) {
        for (key in _rows[i]) {
          if (_rows[i].hasOwnProperty(key)) {
            obj = {};
            obj[key] = _rows[i][key];
            row.push(obj);
          }
        }
        arr[i] = row;
        row = [];
      }
    } else {
      firstRow = Object.clone(data);
      firstRow = this.trim(firstRow, cols);
      for (key in firstRow) {
        if (firstRow.hasOwnProperty(key)) {
          obj = {};
          obj[key] = firstRow[key];
          row.push(obj);
        }
        arr[0] = row;
      }
    }
    return arr;
  };

  utils.getURIs = function(elements) {
    var arr = [];
    for (var i = 0, l = elements.length; i < l; i += 1) {
      arr.push(elements[i].get('data-uri'));
    }
    return arr;
  };

  utils.getVisibleTotal = function(arr) {
    var counter = 0;
    for (var i = 0, l = arr.length; i < l; i += 1) {
      for (var j = 0, jL = arr[i].length; j < jL; j += 1) {
        var _key = Object.keys(arr[i][j])[0];
        counter += parseInt(arr[i][j][_key], 10);
      }
    }
    return counter;
  };

  utils.fillOutWithFakes = function(arr, size, cols) {
    var row = arr.length;
    var loopKey;
    var pos = 0;
    var key = Object.keys(arr[0][0])[0];
    var min = arr[0][0][key];
    var flag = true;
    var breakCheck;
    var counter = 0;
    var loopCounter = 0;
    var returnObj = {};
    for (var ik = 0; ik < row; ik += 1) {
      for (var jk = 0, jLk = arr[ik].length; jk < jLk; jk += 1) {
        loopKey = Object.keys(arr[ik][jk])[0];
        returnObj[loopKey] = arr[ik][jk][loopKey];
      }
    }

    while (utils.getTotal(returnObj) < cols) {
      breakCheck = false;
      for (var i = 0; i < row; i += 1) {
        for (var j = 0, jL = arr[i].length; j < jL; j += 1) {
          loopCounter = j;
          loopKey = Object.keys(arr[i][j])[0];

          if (returnObj[loopKey] < min) {
            key = loopKey;
            pos = j;
            flag = false;
            breakCheck = true;
            break;
          }
          if (returnObj[loopKey] !== min) {
            flag = false;
          }
        }
        if (breakCheck) {
          break;
        }
      }
      if (flag) {
        key = loopKey;
        pos = loopCounter;
      }
      returnObj[key] += 1;
      min = returnObj[key];
      flag = true;
      counter += 1;
    }
    return returnObj;
  };

  utils.removeAlreadyDisplayedData = function(data) {
    var keys = Object.keys(data);
    var children, uris, l;
    for (var key in data) {
      if (data.hasOwnProperty(key)) {
        children = document.getElement('.' + key).getElement('ul').getChildren();
        uris = utils.getURIs(children);
        l = data[key].length;
        while (l--) {
          if (uris.indexOf(data[key][l].uri) !== -1) {
            data[key].splice(l, 1);
          }
        }
      }
    }
  };

});
