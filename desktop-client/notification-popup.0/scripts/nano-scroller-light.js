/*
- Initially written by James Florentino (http://jamesflorentino.com) in CoffeeScript (http://coffeescript.org)
- Released under [MIT License](http://www.opensource.org/licenses/mit-license.php)
- Adapted by Quenton Cook, for Spotify
*/

/*
 * Usage:
 *
 * To make a DIV with Lion/iOS style scroll bars follow these three steps.
 *
 * 1) Make sure html has a structure like this (esp. class names).
 *    -> Scrolling content should go inside div.content.
 *
 *  <div class="nano">
 *    <div class="content"></div>
 *  </div>
 *
 * 2) Import into your code, for example:
 *
 *  nano = sp.require('scripts/nano-scroller-light');
 *
 * 3) Scroller-ize a node:
 *
 *  nano.scroller(domNode, [nearBottomCallback]);
 *
 */


/**
 * The external constructor for a new scroller.
 */
exports.scroller = nanoScroller;

var DOMSCROLL, DOWN, DRAG, MOUSEDOWN, MOUSEMOVE, MOUSEUP, MOUSEWHEEL, NanoScroll, PANEDOWN, RESIZE, SCROLL, SCROLLBAR, UP, WHEEL, getScrollbarWidth;
SCROLLBAR = 'scrollbar';
SCROLL = 'scroll';
MOUSEDOWN = 'mousedown';
MOUSEMOVE = 'mousemove';
MOUSEWHEEL = 'mousewheel';
MOUSEUP = 'mouseup';
RESIZE = 'resize';
DRAG = 'drag';
UP = 'up';
PANEDOWN = 'panedown';
DOMSCROLL = 'DOMMouseScroll';
DOWN = 'down';
WHEEL = 'wheel';
getScrollbarWidth = function() {
  var noscrollWidth, outer, yesscrollWidth;
  outer = document.createElement('div');
  outer.style.position = 'absolute';
  outer.style.width = '100px';
  outer.style.height = '100px';
  outer.style.overflow = 'scroll';
  document.body.appendChild(outer);
  noscrollWidth = outer.offsetWidth;
  yesscrollWidth = outer.scrollWidth;
  document.body.removeChild(outer);
  return noscrollWidth - yesscrollWidth;
};

NanoScroll = (function() {
  function NanoScroll(el, nearBottomCallback) {
    this.nearBottomCallback = nearBottomCallback;
    this.el = el;
    this.content = el.getElementsByClassName('content')[0];
    this.slider = el.getElementsByClassName('slider')[0];
    this.pane = el.getElementsByClassName('pane')[0];
    this.scrollW = getScrollbarWidth();
    this.createEvents();
    this.addEvents();
    this.reset();
    var _this = this;
    this.clearScrollTimer = window.setInterval(function() {_this.hideScroller();}, 1000);
  }

  NanoScroll.prototype.createEvents = function() {
    var _this = this;
    this.events = {
      down: function(e) {
        _this.isDrag = true;
        _this.offsetY = e.clientY - _this.slider.offsetTop;
        _this.pane.classList.add('active');
        window.addEventListener(MOUSEMOVE, _this.events[DRAG], false);
        window.addEventListener(MOUSEUP, _this.events[UP], false);
        return false;
      },
      drag: function(e) {
        _this.sliderY = e.clientY - (_this.el.offsetTop - 40) - _this.offsetY;
        _this.scroll();
        return false;
      },
      up: function(e) {
        _this.isDrag = false;
        _this.pane.classList.remove('active');
        window.removeEventListener(MOUSEMOVE, _this.events[DRAG], false);
        window.removeEventListener(MOUSEUP, _this.events[UP], false);
        return false;
      },
      resize: function(e) {
        _this.reset();
      },
      panedown: function(e) {
        if (!_this.isDrag) {
          _this.sliderY = e.offsetY - _this.sliderH * 0.5;
          _this.scroll();
        }
      },
      scroll: function(e) {
        var content, top;
        if (_this.isDrag === true) return;
        content = _this.content;
        top = content.scrollTop / (content.scrollHeight - content.clientHeight) * (_this.paneH - _this.sliderH);
        _this.slider.style.top = top + 'px';
        _this.showScroller();
        _this.testScroll();
      },
      wheel: function(e) {
        var content;
        content = _this.content;
        _this.sliderY += -e.wheelDeltaY || -e.delta;
        _this.scroll();
        return false;
      }
    };
  };

  var lastShowEventTime;

  NanoScroll.prototype.showScroller = function() {
    var _this = this;
    lastShowEventTime = new Date();
    window.setTimeout(function() {_this.hideScroller();}, 800);
    this.pane.classList.add('show');
  };

  NanoScroll.prototype.hideScroller = function() {
    var currentTime = new Date();
    if (lastShowEventTime && lastShowEventTime.getTime() + 800 < currentTime.getTime()) {
      this.pane.classList.remove('show');
    }
  };

  NanoScroll.prototype.addEvents = function() {
    window.addEventListener(RESIZE, this.events[RESIZE], false);
    this.slider.addEventListener(MOUSEDOWN, this.events[DOWN], false);
    this.pane.addEventListener(MOUSEUP, this.events[PANEDOWN], false);
    this.content.addEventListener(SCROLL, this.events[SCROLL], false);
  };

  NanoScroll.prototype.removeEvents = function() {
    window.removeEventListener(RESIZE, this.events[RESIZE], false);
    this.slider.removeEventListener(MOUSEDOWN, this.events[DOWN], false);
    this.pane.removeEventListener(MOUSEUP, this.events[PANEDOWN], false);
    this.content.removeEventListener(SCROLL, this.events[SCROLL], false);
  };

  NanoScroll.prototype.reset = function() {
    var content;
    if (this.isDead === true) {
      this.isDead = false;
      this.pane.show();
      this.addEvents();
    }
    content = this.content;
    this.contentH = content.scrollHeight + this.scrollW;
    this.paneH = content.clientHeight - 4;
    this.sliderH = this.paneH / this.contentH * this.paneH;
    this.sliderH = Math.round(this.sliderH);
    this.scrollH = this.paneH - this.sliderH;
    this.slider.style.height = this.sliderH + 'px';
    this.diffH = content.scrollHeight - content.clientHeight;
    if (this.paneH >= this.content.scrollHeight - 4) {this.pane.style.display = 'none';}
    else {this.pane.style.display = 'block';}
  };

  NanoScroll.prototype.scroll = function() {
    var scrollValue;
    this.sliderY = Math.max(0, this.sliderY);
    this.sliderY = Math.min(this.scrollH, this.sliderY);
    scrollValue = this.paneH - this.contentH + this.scrollW;
    scrollValue = scrollValue * this.sliderY / this.scrollH;
    this.content.scrollTop = -scrollValue;
    this.testScroll();
    return this.slider.style.top = this.sliderY + 'px';
  };

  NanoScroll.prototype.scrollBottom = function(offsetY) {
    var diffH, scrollTop;
    diffH = this.diffH;
    scrollTop = this.content[0].scrollTop;
    this.reset();
    if (scrollTop < diffH && scrollTop !== 0) return;
    this.content.scrollTop = this.contentH - this.content.height() - offsetY;
    this.testScroll();
  };

  NanoScroll.prototype.scrollTop = function(offsetY) {
    this.reset();
    this.content.scrollTop = offsetY + 0;
  };

  NanoScroll.prototype.stop = function() {
    this.isDead = true;
    this.removeEvents();
    this.pane.hide();
  };

  NanoScroll.prototype.testScroll = function() {
    if (this.nearBottomCallback && this.content.scrollTop + this.content.clientHeight > this.content.scrollHeight - 10) {
      this.nearBottomCallback();
    }
  };

  return NanoScroll;

})();

var scrollbar;

function nanoScroller(element, nearBottomCallback) {

  var me, scrollbar, pane;

  pane = document.createElement('div');
  pane.classList.add('pane');
  pane.innerHTML = '<div class="slider"></div>';
  element.appendChild(pane);

  me = element;

  if (scrollbar === void 0) {
    scrollbar = new NanoScroll(element, nearBottomCallback);
  }
  return scrollbar;
}
