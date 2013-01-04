/**
 * The Nitpicker
 * The nitpicker performs a series of basic validations of a module so that it and all
 * its associated objects conform to basic protocols of objects in largers Stitch apps.
 *
 * It is entirely voluntary to use the Nitpicker, but it can be good to test a few basic
 * things so you know you have the fundamentals up and running.
 */
'use strict';

require(['$artist/../tests/mockery', '$test-utils/assert'], function(Mockery, assert) {

  mocha.setup('bdd');

  exports.pick = function(module) {
    describe('Nitpicker: ' + module.__name + ' has a sane interface', function() {
      for (var key in module) {
        if (module.hasOwnProperty(key) && key !== '__name') {
          describe(key + ' complies to basic properties', function() {
            var object = module[key];

            it('is not a view', function() {
              assert.ok(key.indexOf('View') != (key.length - 'View'.length), 'abc');
            });

            it('has a static reference to its view prototype', function() {
              assert.ok(typeof(object['view']) === 'function');
            });

            it('doesn\'t call the view in the constructor', function(done) {
              var mockedView = makeInvalidMock(object.view, done);
              var oldView = object.view;
              object.view = mockedView;
              var target = new object;
              object.view = oldView;
              done();
            });

            it('has methods for initialization and destruction', function() {
              assert.ok(typeof(object.prototype['init']) == 'function');
              assert.ok(typeof(object.prototype['destroy']) == 'function');
            });

            it('initializes the view in the object init', function(done) {
              withMockedView(object, { init: done }, function(target) {
                target.init();
              });
            });

            it('destroys the view in the object destroy', function(done) {
              withMockedView(object, { destroy: done }, function(target) {
                target.init();
                target.destroy();
              });
            });
          });
        }
      }
    });
  }

  function makeInvalidMock(view, done) {
    var err = function(name) { return function() { done(name + 'was called') }; };
    var mockedView = Mockery.mock(view);
    for (var key in mockedView.prototype) {
      mockedView.prototype[key] = err(key);
    }
    return mockedView;
  }

  function withMockedView(object, props, closure) {
    var view = Mockery.mock(object.view), ov = object.view;
    object.view = view;
    for (var prop in props) {
      if (props.hasOwnProperty(prop)) {
        object.view.prototype[prop] = props[prop];
      }
    }
    closure.call(this, new object);
    object.view = ov;
  }

});
