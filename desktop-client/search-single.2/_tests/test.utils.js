/*global require:false, describe:false, it:false, mocha:false, beforeEach:false */

require([
  '$search/scripts/utils',
  '$search/scripts/view#View',
  '$test-utils/assert'
], function(utils, View, assert) {

  mocha.setup('bdd');

  describe('Array helper methods', function() {

    it('Returns minimum value in array', function() {
      var arr = [34, 56, 3, 42, 6, 7, 877, 4, 2, 5, 6, 1, 9];
      var min = arr.min();
      assert.strictEqual(min, 1);
    });

    it('Returns maximum value in array', function() {
      var arr = [34, 56, 3, 42, 6, 7, 877, 4, 2, 5, 6, 1, 9];
      var max = arr.max();
      assert.strictEqual(max, 877);
    });

    it('Returns the sum of the array', function() {
      var arr = [34, 56, 3, 42, 6, 7, 877, 4, 2, 5, 6, 1, 9];
      var sum = arr.sum();
      assert.strictEqual(sum, 1052);
    });

    it('Returns the clone of the array', function() {
      var arr = [34, 56, 3, 42, 6, 7, 877, 4, 2, 5, 6, 1, 9];
      var sum = arr.clone();
      assert.deepEqual(sum, arr);
    });

    it('Returns the deep clone of the array', function() {
      var arr = [[1, 2, 3], [4, 5, 6], [8, 9, 10]];
      var sum = arr.clone();
      assert.deepEqual(sum, arr);
    });

  });

  describe('utils.areArgumentsOK(args)', function() {

    it('Returns true if query and category is OK', function() {
      var args = ['elvis', 'artists'];
      assert.strictEqual(utils.areArgumentsOK(args), true);
    });

    it('Returns false if query is 301 characters', function() {
      var args = ['pitukQDgh56HsY3CSakFYOXr1AjbBe5g58DsS6WnlnjQhjSbfBMT7CPFGn8dB3SGPuN1peHIVOAkw3' +
                  'tGsRiNll33LvJeJcntM4xW1iH9sIJX64jn0aIAlXT1B5ksr6OcPutf9tGlhCTcU6qi9szb14PotfG7' +
                  'UnmNfUDFHuUHz6TdCPhfdra5ueFuVM2hhCrhU6tPoBvAZpa56WGr6xBtAHTeiH7YGYToXlnyjU5Vnr' +
                  'p5meuQ3vFck9jy0peuMTW3f7LGVUCXxlb4agr8AnmIGvTgzGE5JD3RMumCuBLSqBjOZ',
                  'albums'];
      assert.strictEqual(utils.areArgumentsOK(args), false);
    });

    it('Returns false if category is 301 characters', function() {
      var args = ['elvis',
                  'pitukQDgh56HsY3CSakFYOXr1AjbBe5g58DsS6WnlnjQhjSbfBMT7CPFGn8dB3SGPuN1pe' +
                  'HIVOAkw3tGsRiNll33LvJeJcntM4xW1iH9sIJX64jn0aIAlXT1B5ksr6OcPutf9tGlhCTc' +
                  'U6qi9szb14PotfG7UnmNfUDFHuUHz6TdCPhfdra5ueFuVM2hhCrhU6tPoBvAZpa56WGr6x' +
                  'BtAHTeiH7YGYToXlnyjU5Vnrp5meuQ3vFck9jy0peuMTW3f7LGVUCXxlb4agr8AnmIGvTg' +
                  'zGE5JD3RMumCuBLSqBjOZ'];
      assert.strictEqual(utils.areArgumentsOK(args), false);
    });

    it('Returns false if both are 301 characters', function() {
      var args = ['pitukQDgh56HsY3CSakFYOXr1AjbBe5g58DsS6WnlnjQhjSbfBMT7CPFGn8dB3SGPuN1peHIVOAkw3' +
                  'tGsRiNll33LvJeJcntM4xW1iH9sIJX64jn0aIAlXT1B5ksr6OcPutf9tGlhCTcU6qi9szb14PotfG7' +
                  'UnmNfUDFHuUHz6TdCPhfdra5ueFuVM2hhCrhU6tPoBvAZpa56WGr6xBtAHTeiH7YGYToXlnyjU5Vnr' +
                  'p5meuQ3vFck9jy0peuMTW3f7LGVUCXxlb4agr8AnmIGvTgzGE5JD3RMumCuBLSqBjOZ',
                  'pitukQDgh56HsY3CSakFYOXr1AjbBe5g58DsS6WnlnjQhjSbfBMT7CPFGn8dB3SGPuN1peHIVOAkw3' +
                  'tGsRiNll33LvJeJcntM4xW1iH9sIJX64jn0aIAlXT1B5ksr6OcPutf9tGlhCTcU6qi9szb14PotfG7' +
                  'UnmNfUDFHuUHz6TdCPhfdra5ueFuVM2hhCrhU6tPoBvAZpa56WGr6xBtAHTeiH7YGYToXlnyjU5Vnr' +
                  'p5meuQ3vFck9jy0peuMTW3f7LGVUCXxlb4agr8AnmIGvTgzGE5JD3RMumCuBLSqBjOZ'];
      assert.strictEqual(utils.areArgumentsOK(args), false);
    });

    it('Returns false if query and category is undefined', function() {
      var args = [undefined, undefined];
      assert.strictEqual(utils.areArgumentsOK(args), false);
    });

    it('Returns true if category is null', function() {
      var args = ['elvis', null];
      assert.strictEqual(utils.areArgumentsOK(args), true);
    });

    it('Returns false if query is undefined but category is valid', function() {
      var args = [undefined, 'artists'];
      assert.strictEqual(utils.areArgumentsOK(args), false);
    });

  });

  describe('utils.isCategoryProper(category)', function() {

    it('Return true if category is artists', function() {
      assert.strictEqual(utils.isCategoryProper('artists'), true);
    });

    it('Return true if category is albums', function() {
      assert.strictEqual(utils.isCategoryProper('albums'), true);
    });

    it('Return true if category is playlists', function() {
      assert.strictEqual(utils.isCategoryProper('playlists'), true);
    });

    it('Return false if category is elvis', function() {
      assert.strictEqual(utils.isCategoryProper('elvis'), false);
    });

  });

  describe('utils.getStructure(cols, availableCategories)', function() {

    it('Return [[]] if cols 0 and categories = [10,10,10]', function() {
      var cols = 0;
      var availableCategories = { 'artists': 10, 'albums': 10, 'playlists': 10 };
      var arr = utils.getStructure(cols, availableCategories);
      assert.strictEqual(arr.length, 0);
    });

    it('Return [[1]] if cols 10 and categories = [10]', function() {
      var cols = 10;
      var availableCategories = { 'artists': 10 };
      var arr = utils.getStructure(cols, availableCategories);
      assert.strictEqual(arr.length, 1);
      assert.strictEqual(arr[0].length, 1);
    });

    it('Return [[1, 1]] if cols 10 and categories = [10, 10]', function() {
      var cols = 10;
      var availableCategories = { 'artists': 10, 'albums': 10 };
      var arr = utils.getStructure(cols, availableCategories);
      assert.strictEqual(arr.length, 1);
      assert.strictEqual(arr[0].length, 2);
    });

    it('Return [[1, 1, 1]] if cols 10 and categories = [10, 10, 9]', function() {
      var cols = 10;
      var availableCategories = { 'artists': 10, 'albums': 10, 'playlists': 9 };
      var arr = utils.getStructure(cols, availableCategories);
      assert.strictEqual(arr.length, 1);
      assert.strictEqual(arr[0].length, 3);
    });

    it('Return [[1, 1],[1]] if cols 10 and categories = [10, 10, 10]', function() {
      var cols = 10;
      var availableCategories = { 'artists': 10, 'albums': 10, 'playlists': 10 };
      var arr = utils.getStructure(cols, availableCategories);
      assert.strictEqual(arr.length, 2);
      assert.strictEqual(arr[0].length, 2);
      assert.strictEqual(arr[1].length, 1);
    });

    it('Return [[1, 1],[1, 1]] if cols 10 and categories = [5, 5, 5, 5]', function() {
      var cols = 10;
      var availableCategories = { 'artists': 5, 'albums': 5, 'playlists': 5, 'people': 5 };
      var arr = utils.getStructure(cols, availableCategories);
      assert.strictEqual(arr.length, 2);
      assert.strictEqual(arr[0].length, 2);
      assert.strictEqual(arr[1].length, 2);
    });

    it('Return [[1, 1],[1, 1]] if cols 10 and categories = [10, 10, 10, 10]', function() {
      var cols = 10;
      var availableCategories = { 'artists': 10, 'albums': 10, 'playlists': 10, 'people': 10 };
      var arr = utils.getStructure(cols, availableCategories);
      assert.strictEqual(arr.length, 2);
      assert.strictEqual(arr[0].length, 2);
      assert.strictEqual(arr[1].length, 2);
    });

    it('Return [[1, 1, 1], [1]] if cols 10 and categories = [5, 4, 1, 10]', function() {
      var cols = 10;
      var availableCategories = { 'artists': 5, 'albums': 4, 'playlists': 1, 'people': 10 };
      var arr = utils.getStructure(cols, availableCategories);
      assert.strictEqual(arr.length, 2);
      assert.strictEqual(arr[0].length, 3);
      assert.strictEqual(arr[1].length, 1);
    });

    it('Return [[1, 1, 1, 1]] if cols 10 and categories = [3, 4, 1, 10]', function() {
      var cols = 10;
      var availableCategories = { 'artists': 3, 'albums': 4, 'playlists': 1, 'people': 10 };
      var arr = utils.getStructure(cols, availableCategories);
      assert.strictEqual(arr.length, 1);
      assert.strictEqual(arr[0].length, 4);
    });

    it('Return [[1, 1, 1, 1, 1, 1]] if cols 10 and categories = [3, 4, 1, 10, 10, 10]', function() {
      var cols = 10;
      var availableCategories = { 'artists': 3, 'albums': 4, 'playlists': 1, 'people': 10, 'foo': 10, 'bar': 10 };
      var arr = utils.getStructure(cols, availableCategories);
      assert.strictEqual(arr.length, 1);
      assert.strictEqual(arr[0].length, 6);
    });

  });

  describe('utils.trimData(cols, maxLengths, data)', function() {

    it('Returns correct when cols are 11, data is big and maxLength is big', function() {
      var data = {
        'artists': ['artist', 'artist', 'artist', 'artist', 'artist', 'artist', 'artist', 'artist'],
        'albums': ['album', 'album', 'album', 'album', 'album', 'album', 'album', 'album', 'album'],
        'playlists': ['pl', 'pl', 'pl', 'pl', 'pl', 'pl', 'pl', 'pl', 'pl', 'pl', 'pl', 'pl', 'pl']
      };

      var maxLengths = {
        'artists': 50,
        'albums': 50,
        'playlists': 50
      };

      var trimmedData = utils.trimData(11, maxLengths, data);
      assert.strictEqual(trimmedData[0].artists.length, 6);
      assert.strictEqual(trimmedData[0].albums.length, 5);
      assert.strictEqual(trimmedData[1].playlists.length, 11);
    });

    it('Returns correct when cols are 11, data is small and maxLength is small', function() {
      var data = {
        'artists': ['artist', 'artist'],
        'albums': ['album', 'album', 'album'],
        'playlists': ['pl', 'pl', 'pl', 'pl']
      };

      var maxLengths = {
        'artists': 2,
        'albums': 3,
        'playlists': 4
      };

      var trimmedData = utils.trimData(11, maxLengths, data);
      assert.strictEqual(trimmedData[0].artists.length, 2);
      assert.strictEqual(trimmedData[0].albums.length, 3);
      assert.strictEqual(trimmedData[0].playlists.length, 4);
    });

    it('Returns correct when cols are 11, data is small and maxLength is big', function() {
      var data = {
        'artists': ['artist', 'artist'],
        'albums': ['album', 'album', 'album'],
        'playlists': ['pl', 'pl', 'pl', 'pl']
      };

      var maxLengths = {
        'artists': 20,
        'albums': 30,
        'playlists': 40
      };

      var trimmedData = utils.trimData(11, maxLengths, data);
      assert.strictEqual(trimmedData[0].artists.length, 2);
      assert.strictEqual(trimmedData[0].albums.length, 3);
      assert.strictEqual(trimmedData[0].playlists.length, 4);
    });

    it('Returns correct when cols are 11, no data and maxLength is small', function() {
      var maxLengths = {
        'artists': 2,
        'albums': 3,
        'playlists': 4
      };

      var trimmedData = utils.trimData(11, maxLengths);
      assert.strictEqual(trimmedData[0].artists, 3);
      assert.strictEqual(trimmedData[0].albums, 4);
      assert.strictEqual(trimmedData[0].playlists, 4);
    });

  });

  describe('utils.trim(cols, arr)', function() {

    it('Return [4,4,3] if cols 11 and arr = [10,10,10]', function() {
      var cols = 11;
      var arr = [10, 10, 10];
      var trim = utils.trim(cols, arr);
      assert.strictEqual(trim.length, 3);
      assert.strictEqual(trim[0], 4);
      assert.strictEqual(trim[1], 4);
      assert.strictEqual(trim[2], 3);
    });

    it('Return [1,8,1] if cols 10 and arr = [1,10,1]', function() {
      var cols = 10;
      var arr = [1, 10, 1];
      var trim = utils.trim(cols, arr);
      assert.strictEqual(trim.length, 3);
      assert.strictEqual(trim[0], 1);
      assert.strictEqual(trim[1], 8);
      assert.strictEqual(trim[2], 1);
    });

  });

  describe('utils.fill(cols, arr)', function() {

    it('Return [3,3,4] if cols 10 and arr = [1,1,1]', function() {
      var cols = 10;
      var arr = [1, 1, 1];
      var fill = utils.fill(cols, arr);
      assert.strictEqual(fill.length, 3);
      assert.strictEqual(fill[0], 3);
      assert.strictEqual(fill[1], 3);
      assert.strictEqual(fill[2], 4);
    });

    it('Return [4,5] if cols 9 and arr = [4,1]', function() {
      var cols = 9;
      var arr = [4, 1];
      var fill = utils.fill(cols, arr);
      assert.strictEqual(fill.length, 2);
      assert.strictEqual(fill[0], 4);
      assert.strictEqual(fill[1], 5);
    });

  });

  describe('view.getRows(cols, availableCategories)', function() {
    var view = new View();

    it('Return 0 if cols 0 and categories = [10,10,10]', function() {
      view.cols = 0;
      var availableCategories = { 'artists': 10, 'albums': 10, 'playlists': 10 };
      assert.strictEqual(view.getRows(availableCategories), 0);
    });

    it('Return 0 if cols 10 and categories = []', function() {
      view.cols = 10;
      var availableCategories = {};
      assert.strictEqual(view.getRows(availableCategories), 0);
    });

    it('Return 1 if cols 10 and categories = [4,5,9]', function() {
      view.cols = 10;
      var availableCategories = { 'artists': 4, 'albums': 5, 'playlists': 9 };
      assert.strictEqual(view.getRows(availableCategories), 1);
    });

    it('Return 1 if cols 10 and categories = [5,5,9]', function() {
      view.cols = 10;
      var availableCategories = { 'artists': 5, 'albums': 5, 'playlists': 9 };
      assert.strictEqual(view.getRows(availableCategories), 1);
    });

    it('Return 1 if cols 10 and categories = [0,20,20]', function() {
      view.cols = 10;
      var availableCategories = { 'albums': 20, 'playlists': 20 };
      assert.strictEqual(view.getRows(availableCategories), 1);
    });

    it('Return 1 if cols 10 and categories = [5,5,5,4]', function() {
      view.cols = 10;
      var availableCategories = { 'artists': 5, 'albums': 5, 'playlists': 5, 'people': 4 };
      assert.strictEqual(view.getRows(availableCategories), 1);
    });

    it('Return 1 if cols 10 and categories = [1,1,1,1]', function() {
      view.cols = 10;
      var availableCategories = { 'artists': 1, 'albums': 1, 'playlists': 1, 'people': 1 };
      assert.strictEqual(view.getRows(availableCategories), 1);
    });

    it('Return 1 if cols 10 and categories = [10, 10, 10, 10, 10, 10]', function() {
      view.cols = 10;
      var availableCategories = { 'artists': 10, 'albums': 10, 'playlists': 10, 'people': 10, 'foo': 10, 'bar': 10 };
      assert.strictEqual(view.getRows(availableCategories), 1);
    });

    it('Return 2 if cols 10 and categories = [2,8,10]', function() {
      view.cols = 10;
      var availableCategories = { 'artists': 2, 'albums': 8, 'playlists': 10 };
      assert.strictEqual(view.getRows(availableCategories), 2);
    });

    it('Return 2 if cols 10 and categories = [2,8,10,10]', function() {
      view.cols = 10;
      var availableCategories = { 'artists': 2, 'albums': 8, 'playlists': 10, 'people': 10 };
      assert.strictEqual(view.getRows(availableCategories), 2);
    });

    it('Return 2 if cols 10 and categories = [2,8,5,5]', function() {
      view.cols = 10;
      var availableCategories = { 'artists': 2, 'albums': 8, 'playlists': 5, 'people': 5 };
      assert.strictEqual(view.getRows(availableCategories), 2);
    });
  });

  describe('utils.isSimpleEqual(obj, obj2)', function() {
    it('Returns true when objects are identical', function() {
      var obj = { 'width': '200px', 'left': '100px', 'top': '300px' };
      assert.strictEqual(utils.isSimpleEqual(obj, obj), true);
    });

    it('Returns false when objects are not identical', function() {
      var obj = { 'width': '200px', 'left': '100px', 'top': '300px' };
      var obj2 = { 'width': '2px', 'left': '100px', 'top': '300px' };
      assert.strictEqual(utils.isSimpleEqual(obj, obj2), false);
    });

    it('Returns false when objects are not identical', function() {
      var obj = { 'width': '200px', 'left': '100px', 'top': '300px' };
      var obj2 = { 'width': '2px', 'top': '300px' };
      assert.strictEqual(utils.isSimpleEqual(obj, obj2), false);
    });
  });

  // Examples from https://wiki.spotify.net/wiki/URI#Syntax
  describe('utils.getHref(input) (desktop)', function() {
    var href = 'spotify:search:';
    var ans, query;

    it('Returns love -> spotify:search:love', function() {
      query = 'love';
      ans = href + 'love';
      assert.strictEqual(ans, utils.getHref(query));
    });

    it('Returns genre:rock genre:pop love -> spotify:search:genre:rock+genre:pop+love', function() {
      query = 'genre:rock genre:pop love';
      ans = href + 'genre:rock+genre:pop+love';
      assert.strictEqual(ans, utils.getHref(query));
    });

    it('Returns genre:rock OR genre:pop love -> spotify:search:genre:rock+OR+genre:pop+love', function() {
      query = 'genre:rock OR genre:pop love';
      ans = href + 'genre:rock+OR+genre:pop+love';
      assert.strictEqual(ans, utils.getHref(query));
    });

    it('Returns artist:"the prodigy" -> spotify:search:artist:%22the+prodigy%22', function() {
      query = 'artist:"the prodigy"';
      ans = href + 'artist:%22the+prodigy%22';
      assert.strictEqual(ans, utils.getHref(query));
    });
  });
});
