"use strict";

var sp = getSpotifyApi(1);

var util = sp.require("sp://import/scripts/util");
var promise = sp.require("sp://import/scripts/promise");

var DEFAULTS = {
	delay: 0,
	duration: 400
}

var STATES = {
	STOPPED: 0,
	RUNNING: 1
}

var VENDOR_PREFIX = "-webkit-";

/**
 * Perform a CSS animation on an element
 * @param {Element} el Element on which to perform animation
 * @param {Object=} props CSS properties to animation
 * @param {Object=} options Animation options
 * @constructor
 */
var Animation = function(el, props, options) {
    if (!this instanceof Animation) {
		return new Animation(el, props, options);
	}

	var self = this,
		state = STATES.STOPPED,
		queue = [];

	self._el = el;

	self.play = function() {
		if (STATES.STOPPED === state && 0 < queue.length) {
			state = STATES.RUNNING;
			queue.shift()();
		}
		return self;
	}

	self.animate = function(props, options) {
		var prom = new promise.Promise();
		options = util.merge({}, DEFAULTS, options || {});
		var trans = function() {
			el.style[VENDOR_PREFIX + "transition-delay"] = options.delay + "ms";
			el.style[VENDOR_PREFIX + "transition-duration"] = options.duration + "ms";
			// Avoid getting "redundant" style changes optimized away
			var unused = el.ownerDocument.documentElement.offsetWidth; // :(
			util.merge(el.style, props);
			/* Use another setTimeout, because the webkitTransitionEnd
			 * event fires once per property, and has some other quirks
			 */
			setTimeout(function() {
				state = STATES.STOPPED;
				prom.resolve(this);
				self.play();
			}, options.delay + options.duration);
		}
		queue.push(trans);
		self.play();
		return prom;
	}

	// Add initial transition, if any
	if (props || options) {
		self.animate(props, options);
	}
}

Animation.prototype.scale = function(x, y) {
	var properties = {};
	properties[VENDOR_PREFIX + "transform"] = "scale(" + x + (y ? ", " + y : "") + ")";
	return this.animate(properties);
};

Animation.prototype.rotateX = function(x) {
	var properties = {};
	properties[VENDOR_PREFIX + "transform"] = "rotateX(" + x + "deg)";
	return this.animate(properties);
}

Animation.prototype.rotateY = function(y) {
	var properties = {};
	properties[VENDOR_PREFIX + "transform"] = "rotateY(" + y + "deg)";
	return this.animate(properties);
}

exports.Animation = Animation;
exports.animate = function(el, props, options) {
	return new Animation(el).animate(props, options);
}