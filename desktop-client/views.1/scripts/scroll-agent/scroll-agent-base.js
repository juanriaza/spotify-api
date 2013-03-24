require(["$views/utils/frame#throttle","$api/models#Observable"],function(f,g){function c(a,b){g.call(this);if(a===window||a===document||a===document.body)a=document.documentElement;this.view=a;this.options=this._setOptions(b||{},{id:(h++).toString(36),container:a,hotZone:0,deadZone:0,debug:!1,removeInvisibles:!1,length:null,tagName:"div",height:0,limitDelta:0});this.container=this.options.container;this.length=this.options.length;this.height=this.options.height;var d=this.options.hotZone;this._hotZone=
"function"===typeof d?d:function(){return d};var e=this.options.deadZone;this._deadZone="function"===typeof e?e:function(){return e};this.update_=f(this.update,this);this.scroll_=f(this._scroll,this);this._scrollBy=a===document.documentElement?function(a){window.scrollBy(0,a)}:function(b){a.scrollTop+=b};this._lastScrollTop=this.container.getBoundingClientRect().top;this.id=this.options.id}var h=0;SP.inherit(c,g);c.prototype._limitDelta=function(a){var b=this.options.limitDelta;b&&(a>b?a=b:a<-b&&
(a=-b));return a};c.prototype._setOptions=function(a,b){var d={},e;for(e in b){var c=a[e];d[e]=null!=c?c:b[e]}return d};c.prototype.attach=function(){if(this.attached)return this;this.attached=!0;var a=this.view===document.documentElement?window:this.view;a.addEventListener("scroll",this.update_,!1);var b=this,d=this._overlay=document.createElement("div");d.style.height="50px";d.style.width="50px";d.style.position="absolute";a!==window?window.addEventListener("mousewheel",function(a){b._scroll(a)},
!1):this.options.limitDelta&&a.addEventListener("mousewheel",function(a){var d=-a.wheelDelta,c=b._limitDelta(d);c!==d&&(a.preventDefault(),b._scrollBy(c))});a.addEventListener("resize",this.update_,!1);this.update_();return this};c.prototype._scroll=function(a){var b=this._overlay,d=this;this._scrollTarget?(clearTimeout(this._scrollTimeout),this._scrollTimeout=setTimeout(function(){delete d._scrollTarget;delete d._scrollTimeout;document.body.removeChild(d._overlay)},200),b.style.top=a.pageY-25+"px",
b.style.left=a.pageX-25+"px",this._scrollBy(this._limitDelta(-(a.wheelDelta/10)))):this.view.contains(a.target)&&(this._scrollTarget=!0,document.body.appendChild(b),this._scroll(a))};c.prototype.detach=function(){if(!this.attached)return this;delete this.attached;var a=this.view===document.documentElement?window:this.view;a.removeEventListener("scroll",this.update_);a.removeEventListener("resize",this.update_);return this};c.prototype._getBounds=function(){var a=this.view===document.documentElement?
0:this.view.getBoundingClientRect().top,b=this.view.clientHeight,d=this.container.getBoundingClientRect().top,c=this.container.clientHeight;return{view:{top:a,height:b,bottom:a+b},container:{top:d,height:c,bottom:d+c}}};c.prototype.destroy=function(){this.detach();this._destroyed=!0};c.prototype._checkBounds=function(a){if(this._destroyed)return!1;var b=this.bounds=this._getBounds();this.hotZone=this._hotZone();if(a&&"scroll"===a.type&&(a=this._deadZone(),!(Math.abs(b.container.top-this._lastScrollTop)>
a)))return!1;this._lastScrollTop=b.container.top;return!0};c.prototype.log=function(){var a=Array.prototype.slice.call(arguments);a.unshift(this.id);this.options.debug&&console.log.apply(console,a)};exports.ScrollAgent=c});
