require([
  'scripts/config'.toPath()
], function(config) {

  var utils = exports;

  /**
   * Helper methods for Array.
   */
  Array.prototype.max = function() {
    return Math.max.apply(null, this);
  };

  Array.prototype.min = function() {
    return Math.min.apply(null, this);
  };

  Array.prototype.sum = function() {
    var result = 0, l = this.length;
    if (l) {
      while (l--) {
        result += this[l];
      }
    }
    return result;
  };

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

  /**
   * Helper method to validate arguments.
   */
  utils.areArgumentsOK = function(args) {
    var maxChars = 300;
    var length = args.length;
    if (length === 0) {
      return false;
    } else {
      for (var i = 0; i < length; i += 1) {
        if (typeof args[i] === 'undefined' || (args[i] && args[i].length > maxChars)) {
          return false;
        }
      }
      return true;
    }
  };

  /**
   * Helper method to validate category.
   */
  utils.isCategoryProper = function(category) {
    return typeof category !== 'undefined' && config.CATEGORIES.indexOf(category) !== -1;
  };

  /**
   * This will pick out the structure of the search header.
   * TODO: algorithmitize this?
   * This is only supported for 2 rows and 4 categories at the moment.
   * If we add more categories it will go to 1 row.
   */
  /* warning, here be dragons */
  utils.getStructure = function(cols, data) {
    var keys = Object.keys(data);
    if (cols < 1 || Object.keys(data).length === 0) {
      return [];
    } else if (keys.length === 4) {
      if (data[keys[0]] + data[keys[1]] >= cols &&
          data[keys[2]] + data[keys[3]] >= cols) {
        return [[1, 1], [1, 1]];
      } else if (data[keys[0]] +
                 data[keys[1]] +
                 data[keys[2]] >= cols &&
                 data[keys[3]] >= cols) {
        return [[1, 1, 1], [1]];
      } else {
        return [[1, 1, 1, 1]];
      }
    } else if (keys.length === 3) {
      if (data[keys[0]] + data[keys[1]] >= cols &&
          data[keys[2]] >= cols) {
        return [[1, 1], [1]];
      } else {
        return [[1, 1, 1]];
      }
    } else if (keys.length === 2) {
      return [[1, 1]];
    } else if (keys.length === 1) {
      return [[1]];
    } else {
      var arr = [];
      var inArr = new Array(keys.length);
      for (var i = 0, l = keys.length; i < l; i += 1) {
        inArr[i] = 1;
      }
      arr[0] = inArr;
      return arr;
    }
  };

  /**
   * Helper method to trim data to fit with the structure
   * of the search header. If the data-parameter is left out
   * it will return the maximum amount of items per category.
   * with data-parameter (2 rows):
   * [{ 'artists': [<Artist>], 'albums': [<Albums>]}, { 'playlists': [<Playlist>]}]
   * without data-parameter: (10 cols), maxLengths: [20,20,20] <- 2 rows
   * [{ 'artists': 5, 'albums': 5}, { 'playlists': 10}]
   * without data-parameter: (10 cols), maxLengths: [1,1,1] <- 1 row
   * [{ 'artists': 3, 'albums': 3, 'playlists': 4}]
   */
  utils.trimData = function(cols, maxLengths, data) {
    // quick-trim it
    var mL = Object.clone(maxLengths);
    for (var key in mL) {
      if (mL[key] > cols) {
        mL[key] = cols;
      }
    }

    var structure = utils.getStructure(cols, mL);
    var categories = Object.keys(mL);

    var d = data ? data : mL;

    var returnData = [], rowLength = 0, subset, itemsPerRow;
    for (var r = 0, rL = structure.length; r < rL; r += 1) { // each row (max 2)
      // subset for each row
      subset = Object.subset(d, categories.slice(0).splice(rowLength, structure[r].length));
      rowLength = structure[r].length;

      itemsPerRow = utils.trimOrFill(cols, subset);

      var i = 0;
      for (var k in subset) {
        subset[k] = data ? subset[k].splice(0, itemsPerRow[i++]) : itemsPerRow[i++];
      }
      returnData[r] = subset;
    }

    return returnData;
  };

  /**
   * Trim or fill an object with categories.
   */
  utils.trimOrFill = function(cols, subset) {
    var l = 0, len = 0, arr = [];
    for (var key in subset) {
      len = subset[key].length ? subset[key].length : subset[key];
      arr.push(len);
      l += len;
    }
    if (l > cols) {
      return utils.trim(cols, arr);
    } else if (l < cols) {
      return utils.fill(cols, arr);
    } else {
      return arr;
    }
  };

  /**
   * Trim an array.
   */
  utils.trim = function(cols, arr) {
    var max = arr.max();
    while (arr.sum() > cols) {
      arr[arr.lastIndexOf(max)] -= 1;
      max = arr.max();
    }
    return arr;
  };

  /**
   * Fill an array.
   */
  utils.fill = function(cols, arr) {
    var min = arr.min();
    while (arr.sum() < cols) {
      arr[arr.lastIndexOf(min)] += 1;
      min = arr.min();
    }
    return arr;
  };

  /**
   * Helper method to get the amount of rows.
   */
  utils.getRows = function(cols, availableCategories) {
    return utils.getStructure(cols, availableCategories).length;
  };

  /**
   * Helper method to get document width.
   */
  utils.getWidth = function() {
    // TODO: do not hardcode.
    return window.innerWidth - 40;
  };

  /**
   * Helper method to get possible columns we can fit.
   */
  utils.getCols = function(size, m) {
    var margin = m || config.MINIMAL_MARGIN;
    return Math.floor((this.getWidth() + margin) / (size + margin));
  };

  /**
   * Helper method to get margin used between each cover.
   */
  utils.getMargin = function(size) {
    var cols = this.getCols(size);
    return Math.floor((this.getWidth() - (cols * size)) / (cols - 1));
  };

  /**
   * Helper method to extract URIs from elements.
   */
  utils.getURIs = function(elements) {
    var arr = [];
    for (var i = 0, l = elements.length; i < l; i += 1) {
      arr.push(elements[i].get('data-uri'));
    }
    return arr;
  };

  /**
   * Remove already displayed elements from data.
   */
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
