/*global require:false, describe:false, it:false, mocha:false */

require([
  '$search/scripts/utils',
  '$test-utils/assert'
], function(utils, assert) {

  mocha.setup('bdd');

  describe('utils.areArgumentsOK(args)', function() {

    it('Returns true if query and category is OK', function() {
      var args = ['elvis', 'artists'];
      assert.strictEqual(utils.areArgumentsOK(args), true);
    });

    it('Returns false if query is 301 characters', function() {
      var args = ['pitukQDgh56HsY3CSakFYOXr1AjbBe5g58DsS6WnlnjQhjSbfBMT7CPFGn8dB3SGPuN1peHIVOAkw3tGsRiNll33LvJeJcntM4xW1iH9sIJX64jn0aIAlXT1B5ksr6OcPutf9tGlhCTcU6qi9szb14PotfG7UnmNfUDFHuUHz6TdCPhfdra5ueFuVM2hhCrhU6tPoBvAZpa56WGr6xBtAHTeiH7YGYToXlnyjU5Vnrp5meuQ3vFck9jy0peuMTW3f7LGVUCXxlb4agr8AnmIGvTgzGE5JD3RMumCuBLSqBjOZ', 'albums'];
      assert.strictEqual(utils.areArgumentsOK(args), false);
    });

    it('Returns false if category is 301 characters', function() {
      var args = ['elvis', 'pitukQDgh56HsY3CSakFYOXr1AjbBe5g58DsS6WnlnjQhjSbfBMT7CPFGn8dB3SGPuN1peHIVOAkw3tGsRiNll33LvJeJcntM4xW1iH9sIJX64jn0aIAlXT1B5ksr6OcPutf9tGlhCTcU6qi9szb14PotfG7UnmNfUDFHuUHz6TdCPhfdra5ueFuVM2hhCrhU6tPoBvAZpa56WGr6xBtAHTeiH7YGYToXlnyjU5Vnrp5meuQ3vFck9jy0peuMTW3f7LGVUCXxlb4agr8AnmIGvTgzGE5JD3RMumCuBLSqBjOZ'];
      assert.strictEqual(utils.areArgumentsOK(args), false);
    });

    it('Returns false if both are 301 characters', function() {
      var args = ['pitukQDgh56HsY3CSakFYOXr1AjbBe5g58DsS6WnlnjQhjSbfBMT7CPFGn8dB3SGPuN1peHIVOAkw3tGsRiNll33LvJeJcntM4xW1iH9sIJX64jn0aIAlXT1B5ksr6OcPutf9tGlhCTcU6qi9szb14PotfG7UnmNfUDFHuUHz6TdCPhfdra5ueFuVM2hhCrhU6tPoBvAZpa56WGr6xBtAHTeiH7YGYToXlnyjU5Vnrp5meuQ3vFck9jy0peuMTW3f7LGVUCXxlb4agr8AnmIGvTgzGE5JD3RMumCuBLSqBjOZ', 'pitukQDgh56HsY3CSakFYOXr1AjbBe5g58DsS6WnlnjQhjSbfBMT7CPFGn8dB3SGPuN1peHIVOAkw3tGsRiNll33LvJeJcntM4xW1iH9sIJX64jn0aIAlXT1B5ksr6OcPutf9tGlhCTcU6qi9szb14PotfG7UnmNfUDFHuUHz6TdCPhfdra5ueFuVM2hhCrhU6tPoBvAZpa56WGr6xBtAHTeiH7YGYToXlnyjU5Vnrp5meuQ3vFck9jy0peuMTW3f7LGVUCXxlb4agr8AnmIGvTgzGE5JD3RMumCuBLSqBjOZ'];
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
  /*
  describe('utils.trimData(cols, data, maxLengths)', function() {

    it ('1', function() {
      var cols = 4;
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
      console.log(utils.getFitted(cols, data, maxLengths));
    });

    it('2', function() {
      var cols = 5;
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
      console.log(utils.trimData(cols, maxLengths, data));
    });
  });
  */

  describe('utils.getRows(cols, availableCategories)', function() {

    it('Return 0 if cols 0 and categories = [10,10,10]', function() {
      var cols = 0;
      var availableCategories = { 'artists': 10, 'albums': 10, 'playlists': 10 };
      assert.strictEqual(utils.getRows(cols, availableCategories), 0);
    });

    it('Return 0 if cols 10 and categories = []', function() {
      var cols = 10;
      var availableCategories = {};
      assert.strictEqual(utils.getRows(cols, availableCategories), 0);
    });

    it('Return 1 if cols 10 and categories = [4,5,9]', function() {
      var cols = 10;
      var availableCategories = { 'artists': 4, 'albums': 5, 'playlists': 9 };
      assert.strictEqual(utils.getRows(cols, availableCategories), 1);
    });

    it('Return 1 if cols 10 and categories = [5,5,9]', function() {
      var cols = 10;
      var availableCategories = { 'artists': 5, 'albums': 5, 'playlists': 9 };
      assert.strictEqual(utils.getRows(cols, availableCategories), 1);
    });

    it('Return 1 if cols 10 and categories = [0,20,20]', function() {
      var cols = 10;
      var availableCategories = { 'albums': 20, 'playlists': 20 };
      assert.strictEqual(utils.getRows(cols, availableCategories), 1);
    });

    it('Return 1 if cols 10 and categories = [5,5,5,4]', function() {
      var cols = 10;
      var availableCategories = { 'artists': 5, 'albums': 5, 'playlists': 5, 'people': 4 };
      assert.strictEqual(utils.getRows(cols, availableCategories), 1);
    });

    it('Return 1 if cols 10 and categories = [1,1,1,1]', function() {
      var cols = 10;
      var availableCategories = { 'artists': 1, 'albums': 1, 'playlists': 1, 'people': 1 };
      assert.strictEqual(utils.getRows(cols, availableCategories), 1);
    });

    it('Return 1 if cols 10 and categories = [10, 10, 10, 10, 10, 10]', function() {
      var cols = 10;
      var availableCategories = { 'artists': 10, 'albums': 10, 'playlists': 10, 'people': 10, 'foo': 10, 'bar': 10 };
      assert.strictEqual(utils.getRows(cols, availableCategories), 1);
    });

    it('Return 2 if cols 10 and categories = [2,8,10]', function() {
      var cols = 10;
      var availableCategories = { 'artists': 2, 'albums': 8, 'playlists': 10 };
      assert.strictEqual(utils.getRows(cols, availableCategories), 2);
    });

    it('Return 2 if cols 10 and categories = [2,8,10,10]', function() {
      var cols = 10;
      var availableCategories = { 'artists': 2, 'albums': 8, 'playlists': 10, 'people': 10 };
      assert.strictEqual(utils.getRows(cols, availableCategories), 2);
    });

    it('Return 2 if cols 10 and categories = [2,8,5,5]', function() {
      var cols = 10;
      var availableCategories = { 'artists': 2, 'albums': 8, 'playlists': 5, 'people': 5 };
      assert.strictEqual(utils.getRows(cols, availableCategories), 2);
    });


  });

});
