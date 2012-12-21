'use strict';

exports.inherit = inherit;

/**
 * Inherit the prototype methods from one constructor into another.
 *
 * Usage:
 * <pre>
 * function ParentClass(a, b) { }
 * ParentClass.prototype.foo = function(a) { }
 *
 * function ChildClass(a, b, c) {
 *   ParentClass.call(this, a, b);
 * }
 * inherit(ChildClass, ParentClass);
 *
 * var child = new ChildClass('a', 'b', 'see');
 * child.foo(); // works
 * </pre>
 *
 * In addition, a superclass' implementation of a method can be invoked
 * as follows:
 *
 * <pre>
 * ChildClass.prototype.foo = function(a) {
 *   ChildClass._superClass.foo.call(this, a);
 *   // other code
 * };
 * </pre>
 *
 * @param {Function} childConstructor Child class.
 * @param {Function} parentConstructor Parent class.
 */
function inherit(childConstructor, parentConstructor) {
  /** @constructor */
  function TempConstructor() {

  }

  TempConstructor.prototype = parentConstructor.prototype;
  childConstructor._superClass = parentConstructor.prototype;
  childConstructor.prototype = new TempConstructor();
  childConstructor.prototype.constructor = childConstructor;
}
