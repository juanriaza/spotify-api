require([
  'scripts/profile-utils',
  '$views/popup#Popup',
  '$views/utils/css',
  '$shared/events#EventHandler'
], function(utils, Popup, css, EventHandler) {

  'use strict';
  /**
   * Object to represent an option in the dropdown list of the context menu
   * @param {Object} options Options for this item.
   * @constructor
   */
  var ContextMenuItem = function(options) {
    if (!options) {
      return;
    }
    this.init(options);
  };
  /**
   * A settings object for the item
   * @type {*}
   */
  ContextMenuItem.prototype.settings = null;
  /**
   * The element to generate the menu relative to
   * @type {*}
   */
  ContextMenuItem.prototype.element = null;
  /**
   * Initiate the option item
   * @param {Object} options A settings object.
   */
  ContextMenuItem.prototype.init = function(options) {
    this.events = new EventHandler(this);
    this.settings = options;
  };
  /**
   * Render the object as html
   */
  ContextMenuItem.prototype.render = function() {
    var link = document.createElement('a');

    css.addClass(link, 'context-menu-item');
    if (this.settings.hasOwnProperty('cssClass')) {
      css.addClass(link, this.settings.cssClass);
    }
    if (this.settings.hasOwnProperty('active') && this.settings.active === true) {
      css.addClass(link, 'active');
    }
    link.innerHTML = this.settings.text;
    this.element = link;
    this.setEvents();
  };
  /**
   * Setup the events on the object
   */
  ContextMenuItem.prototype.setEvents = function() {
    if (this.settings.hasOwnProperty('handler')) {
      this.events.listen(this.element, 'click', this.runHandler);
    }
  };
  /**
   * Runs the handler and common effects
   */
  ContextMenuItem.prototype.runHandler = function() {
    var _this = this;
    css.addClass(this.element, 'success');

    var to = setTimeout(function() {
      css.removeClass(_this.element, 'success');
      _this.settings.handler.call(_this);
      clearTimeout(to);
    }, 200);
  };
  /**
   * Return the html node
   * @return {*} A html node element.
   */
  ContextMenuItem.prototype.getNode = function() {
    this.render();
    return this.element;
  };
  /**
   * Remove all elements from an object
   */
  ContextMenuItem.prototype.dispose = function() {
    this.events.removeAll();
  };

  /**
   * Represents a context menu that can be spawned on a button or similar element.
   * @type {ContextMenu}
   */
  var ContextMenu = function(eventhandler) {
    /**
     * The event handler for the menu
     * @type {EventHandler} An event handler.
     */
    this.events = eventhandler || new EventHandler(this);
    /**
     * Object to collect all html elements the menu deals with
     * @type {Object} A set of html elements.
     */
    this.elems = {
      relative: null,
      menu: null
    };
    /**
     * The internal list of objects that represents choices in the menu
     * @type {Array} A list of ContextMenuOptions.
     */
    this.options = [];
    /**
     * Whether the menu is currently visible or not
     * @type {boolean} Off or on.
     */
    this.visible = false;
  };

  /**
   * Sets current playlist for current menu
   */
  ContextMenu.prototype.setPlaylist = function(playlist) {
    this.playlist = playlist;
  };

  /**
   * Sets elements
   */
  ContextMenu.prototype.setElements = function(rel) {
    if (!rel) {
      return;
    }

    this.elems.relative = rel;
  };

  /**
   * Sets current user for current menu
   */
  ContextMenu.prototype.setUser = function(user) {
    this.user = user;
  };

  /**
   * Shows the menu and sets focus
   */
  ContextMenu.prototype.showMenu = function() {
    this.popup.showFor(this.elems.relative);
    this.visible = true;
    this.setFocus();
  };

  /**
   * Generates the menu html including all it's option items
   */
  ContextMenu.prototype.buildMenu = function() {
    var i = 0, l = this.options.length;

    this.elems.menu = document.createElement('div');
    this.elems.menu.setAttribute('tabindex', 0);

    for (; i < l; i++) {
      this.elems.menu.appendChild(this.options[i].getNode());
    }

    this.popup = Popup.withContent(this.elems.menu, 125, 50, 'context-menu');
    this.showMenu();
  };

  /**
   * Clears the active option
   */
  ContextMenu.prototype.clearActive = function() {
    css.removeClass(this.popup.content.querySelector('.active'), 'active');
  };

  /**
   * Hides the menu
   */
  ContextMenu.prototype.hideMenu = function() {
    this.visible = false;
    this.popup.hide();
  };

  /**
   * Sets the focus on the menu and an event for closing it on blur
   */
  ContextMenu.prototype.setFocus = function() {
    this.popup.content.focus();
    this.events.listen(this.popup.content, 'blur', this.close);
  };

  /**
   * Hides the menu
   */
  ContextMenu.prototype.close = function() {
    var _this = this;
    _this.hideMenu();
    _this.events.unlisten(_this.popup.content, 'blur', _this.close);
  };

  /**
   * Renders options in the menu
   */
  ContextMenu.prototype.renderOptions = function() {
    this.buildMenu();
  };

  /**
   * Registers options for the menu
   */
  ContextMenu.prototype.setOptions = function(options) {
    this.options = options;
  };

  /**
   * Shows menu
   * @param {Element} rel A html element.
   */
  ContextMenu.prototype.show = function() {
    if (!this.popup || !this.elems.relative) {
      this.renderOptions();
    } else {
      this.showMenu();
    }
  };

  /**
   * Toggles menu visibility
   * @param {Element} rel A html element.
   */
  ContextMenu.prototype.toggle = function() {
    if (this.visible) {
      this.hideMenu();
    } else {
      this.show();
    }
  };

  /**
   * Exports
   */
  exports.ContextMenu = ContextMenu;
  exports.ContextMenuItem = ContextMenuItem;
});
