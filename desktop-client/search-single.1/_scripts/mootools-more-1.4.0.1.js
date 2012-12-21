// MooTools: the javascript framework.
// Load this file's selection again by visiting: http://mootools.net/more/5b1c44827d51d07013279a5d40a5c2dc
// Or build this file again with packager using: packager build More/More More/Fx.Elements
/*
---

script: More.js

name: More

description: MooTools More

license: MIT-style license

authors:
  - Guillermo Rauch
  - Thomas Aylott
  - Scott Kyle
  - Arian Stolwijk
  - Tim Wienk
  - Christoph Pojer
  - Aaron Newton
  - Jacob Thornton

requires:
  - Core/MooTools

provides: [MooTools.More]

...
*/

MooTools.More = {
  'version': '1.4.0.1',
  'build': 'a4244edf2aa97ac8a196fc96082dd35af1abab87'
};


/*
---

script: Fx.Elements.js

name: Fx.Elements

description: Effect to change any number of CSS properties of any number of Elements.

license: MIT-style license

authors:
  - Valerio Proietti

requires:
  - Core/Fx.CSS
  - /MooTools.More

provides: [Fx.Elements]

...
*/

Fx.Elements = new Class({

  Extends: Fx.CSS,

  initialize: function(elements, options) {
    this.elements = this.subject = $$(elements);
    this.parent(options);
  },

  compute: function(from, to, delta) {
    var now = {};

    for (var i in from) {
      var iFrom = from[i], iTo = to[i], iNow = now[i] = {};
      for (var p in iFrom) iNow[p] = this.parent(iFrom[p], iTo[p], delta);
    }

    return now;
  },

  set: function(now) {
    for (var i in now) {
      if (!this.elements[i]) continue;

      var iNow = now[i];
      for (var p in iNow) this.render(this.elements[i], p, iNow[p], this.options.unit);
    }

    return this;
  },

  start: function(obj) {
    if (!this.check(obj)) return this;
    var from = {}, to = {};

    for (var i in obj) {
      if (!this.elements[i]) continue;

      var iProps = obj[i], iFrom = from[i] = {}, iTo = to[i] = {};

      for (var p in iProps) {
        var parsed = this.prepare(this.elements[i], p, iProps[p]);
        iFrom[p] = parsed.from;
        iTo[p] = parsed.to;
      }
    }

    return this.parent(from, to);
  }

});

