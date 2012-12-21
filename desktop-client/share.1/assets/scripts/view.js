/**
 * @fileoverview Simple helper module for setting up views that can be switched between.
 * @module view
 */

'use strict';

exports.show = show;
exports.View = View;

var sp = getSpotifyApi();

var currentView = null, views = {};

function propagate() {
  for (var id in views) {
    var view = views[id];
    if (view.node) continue;

    view.node = document.getElementById(view.id);
    if (!view.node) {
      throw new Error('View not found: ' + view.node);
    }
  }
}

function show(id, args) {
  var view = views[id];
  if (!view) throw new Error('View does not exist: ' + id);

  if (currentView) {
    views[currentView].onhide();
  }
  currentView = id;

  if (!view._prepared) {
    view.prepare(view.node);
    view._prepared = true;
  }

  view.onshow.apply(view, args);
  document.body.className = id;
  view.resize();
}

function View(id, functions) {
  this.id = id;
  views[id] = this;

  this.node = document.getElementById(id);
  this._prepared = false;

  this.calculateSize = functions.calculateSize || function() { return [300, 300]; };
  this.onhide = functions.onhide || function() {};
  this.onshow = functions.onshow || function() {};
  this.prepare = functions.prepare || function(node) {};
}

View.prototype.resize = function() {
  var size = this.calculateSize();
  // Take away 10 pixels vertically because that's used by the rounded corners of the popup. This
  // reduction is made so that the height in JavaScript matches the height in manifest.json and C++.
  sp.core._set_body_size(size[0], size[1] - 10, true);
};

View.prototype.show = function() {
  show(this.id, arguments);
};

addEventListener('DOMContentLoaded', propagate);
