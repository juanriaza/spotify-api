require([
  'scripts/profile-utils',
  '$views/utils/css',
  '$shared/events#EventHandler'
], function(utils, css, EventHandler) {

  'use strict';

  /**
   * Constructor for the Controller interface. This should not be instantiated directly
   * but rather inherited by other controlers that extend this class.
   * @constructor
   */
  var Controller = function() {
    this.init();
  };

  /**
   * the scrollpos of the controllers view.
   */
  Controller.prototype.lastScrollY = 0;

  /**
   * Initiates controller functionality. If inherited, the inheriting class must
   * call this
   */
  Controller.prototype.init = function() {
    this.debug = false;
    this.internalTimer = new Date().getTime();
    this.internalName = '';
    this.events = new EventHandler(this);
    this.load();
  };

  /**
   * Placeholder
   */
  Controller.prototype.load = function() {
    this.log('loaded', this);
  };

  /**
   * Disposes all events on this controller
   */
  Controller.prototype.dispose = function() {
    this.events.removeAll();
  };

  /**
   * Destroys the DOM created by this controller, provided a container element is
   * provided
   */
  Controller.prototype.destroy = function() {
    if (this.container && typeof this.container === 'object') {
      utils.empty(this.container);
    }
    this.dispose();
  };

  /**
   * Toggles the visibility of the controllers containing element
   */
  Controller.prototype.show = function() {
    // console.log('(Controller.hide) showing', this);
    if (!this.container || typeof this.container !== 'object') {
      return;
    }
    css.removeClass(this.container, 'hidden');
    css.removeClass(this.container, 'invisible');
  };

  /**
   * Hides the controllers containing element from view via display: none
   */
  Controller.prototype.hide = function() {
    if (!this.container || typeof this.container !== 'object') {
      return;
    }
    css.addClass(this.container, 'hidden');
  };

  /**
   * Hides the controllers containing element from view via visibility: hidden,
   * useful for widgets that must be present in the DOM before initialization.
   */
  Controller.prototype.conceal = function() {
    if (!this.container || typeof this.container !== 'object') {
      return;
    }
    css.addClass(this.container, 'invisible');
  };

  /**
   * Returns a valid scrollpos of the controllers view.
   */
  Controller.prototype.getScrollPos = function() {
    return Math.max(this.lastScrollY, 168);
  };

  /**
   * Log a message or a set of variables to the console
   */
  Controller.prototype.log = function() {
    if (this.debug) {
      if (window.console && window.console.log && window.console.log.apply) {
        window.console.log.apply(console, ['   [' + this.internalName + ']', arguments]);
      }
    }
  };

  /**
   * Sets the internalName property for use with the logging
   * @param {string} name The name of the class.
   */
  Controller.prototype.setName = function(name) {
    this.internalName = name;
  };

  /**
   * Call from within subcontroller. Uses internal logging to print logging time
   * to the console. Debug must be true.
   */
  Controller.prototype.markLoaded = function() {
    if (this.debug) {
      this.log('loaded in ' + (new Date().getTime() - this.internalTimer) + ' ms');
    }
  };


  exports.Controller = Controller;
});
