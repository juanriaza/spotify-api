require(['$artist/../tests/mockery', '$artist/biography', '$test-utils/assert', '$artist/../tests/nitpicker'],
    function(Mockery, Target, assert, Nitpicker) {

      var HotChip = {
        biography: 'Hailing from London. ' +
            'Hot Chip entered the picture with the release of their 2000 debut, Mexico.\r\n' +
            "The EP was issued by Victory Garden Records , a label owned and operated by members of London's resident\r\n" +
            'lo-fi psychedelic rock institution Southall Riot. The Mexico EP was a hypnotic wash of subtle -- nearly\r\n' +
            ' -- pulse-like techno beats, acoustic guitars, and plinky pianos, but the vocals were the true star of the\r\n' +
            'show (no small feat in a musical climate overrun with disaffected.'
      };

      mocha.setup('bdd');

      describe('The biography page', function() {

        Nitpicker.pick(Target);

        var target, view;

        before(function() {
          Target.Biography.view = Mockery.mock(Target.Biography.view);
        });

        beforeEach(function() {
          target = new Target.Biography();
          view = target.view;
        });

        it('Hides the view when the artist bio is empty', function(done) {
          view.hide = done;
          target.init({biography: ''});
          target.render();
        });

        it('Does not choke on an undefined biography', function(done) {
          view.hide = done;
          target.init({});
          target.render();
        });

        it('Highlights the first line on render', function(done) {
          view.makeIntro = function(s) {
            assert.equal('Hailing from London. ', s);
            done();
            return s;
          };
          target.init(HotChip);
          target.render();
        });

        it('Adds five paragraphs for the hot chip bio', function() {
          var count = 0;
          view.addParagraph = function() { count++ };
          target.init(HotChip);
          target.render();
          assert.equal(5, count);
        });

      });

    });
