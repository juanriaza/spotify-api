require([
  '$search/search',
  '$test-utils/assert'
], function(Target, assert) {

  mocha.setup('bdd');

  describe('The Search algoritm for readjusting the amount of covers', function() {

    var search;
    beforeEach(function() {
      search = new Target.Search();
    });

    it('should return 1 row and 7 items (10,10,10)->(2,3,2)', function() {
      var obj = { 'artists': 10, 'albums': 10, 'playlists': 10 };
      var rowsMax = 1;
      var colsMax = 7;
      var mockAns = [[{ 'artists': 2 }, { 'albums': 3 }, { 'playlists': 2 }]];

      var ans = search._readjustAmount(rowsMax, colsMax, obj);
      assert.deepEqual(ans, mockAns);
    });

    it('should return 2 rows and 14 items (10,10,10)->(3,4 | 7)', function() {
      var obj = { 'artists': 10, 'albums': 10, 'playlists': 10 };
      var rowsMax = 2;
      var colsMax = 7;
      var mockAns = [[{ 'artists': 3 }, { 'albums': 4 }], [{ 'playlists': 7 }]];

      var ans = search._readjustAmount(rowsMax, colsMax, obj);
      assert.deepEqual(ans, mockAns);
    });

    it('should return 2 rows and 14 items (10,10,7)->(3,4 | 7)', function() {
      var obj = { 'artists': 10, 'albums': 10, 'playlists': 7 };
      var rowsMax = 2;
      var colsMax = 7;
      var mockAns = [[{ 'artists': 3 }, { 'albums': 4 }], [{ 'playlists': 7 }]];

      var ans = search._readjustAmount(rowsMax, colsMax, obj);
      assert.deepEqual(ans, mockAns);
    });

    it('should return 1 row and 7 items (1,20,2)->(1,4,2)', function() {
      var obj = { 'artists': 1, 'albums': 20, 'playlists': 2 };
      var rowsMax = 1;
      var colsMax = 7;
      var mockAns = [[{ 'artists': 1 }, { 'albums': 4 }, { 'playlists': 2 }]];

      var ans = search._readjustAmount(rowsMax, colsMax, obj);
      assert.deepEqual(ans, mockAns);
    });

    it('should return 2 rows and 20 items (10,10,10)->(5,5,10)', function() {
      var obj = { 'artists': 10, 'albums': 10, 'playlists': 10 };
      var rowsMax = 2;
      var colsMax = 10;
      var mockAns = [[{ 'artists': 5 }, { 'albums': 5 }], [{ 'playlists': 10 }]];

      var ans = search._readjustAmount(rowsMax, colsMax, obj);
      assert.deepEqual(ans, mockAns);
    });

    it('should return 1 row and 20 items (20,20,19)->(7,6,7)', function() {
      var obj = { 'artists': 20, 'albums': 20, 'playlists': 19 };
      var rowsMax = 1;
      var colsMax = 20;
      var mockAns = [[{ 'artists': 7 }, { 'albums': 6 },{ 'playlists': 7 }]];

      var ans = search._readjustAmount(rowsMax, colsMax, obj);
      assert.deepEqual(ans, mockAns);
    });

    it('should return 2 rows and 12 items (20,20,2)->(3,2 | 2)', function() {
      var obj = { 'artists': 20, 'albums': 20, 'playlists': 2 };
      var rowsMax = 2;
      var colsMax = 5;
      var mockAns = [[{ 'artists': 3 }, { 'albums': 2 }], [{ 'playlists': 2 }]];

      var ans = search._readjustAmount(rowsMax, colsMax, obj);
      assert.deepEqual(ans, mockAns);
    });

    it('should return 1 rows and 1 items (1,0,0)->(1,0,0)', function() {
      var obj = { 'artists': 1, 'albums': 0, 'playlists': 0 };
      var rowsMax = 1;
      var colsMax = 5;
      var mockAns = [[{ 'artists': 1 }, { 'albums': 0 }, { 'playlists': 0 }]];

      var ans = search._readjustAmount(rowsMax, colsMax, obj);
      assert.deepEqual(ans, mockAns);
    });

    it('should return 1 rows and 2 items (1,1,1)->(1,1,1)', function() {
      var obj = { 'artists': 1, 'albums': 1, 'playlists': 1 };
      var rowsMax = 1;
      var colsMax = 2;
      var mockAns = [[{ 'artists': 0 }, { 'albums': 1 }, { 'playlists': 1 }]];

      var ans = search._readjustAmount(rowsMax, colsMax, obj);
      assert.deepEqual(ans, mockAns);
    });

    it('should return 2 rows and 50 items (50,1,50)->(24,1,25)', function() {
      var obj = { 'artists': 50, 'albums': 1, 'playlists': 50 };
      var rowsMax = 2;
      var colsMax = 25;
      var mockAns = [[{ 'artists': 24 }, { 'albums': 1 }], [{ 'playlists': 25 }]];

      var ans = search._readjustAmount(rowsMax, colsMax, obj);
      assert.deepEqual(ans, mockAns);
    });
  });
});
