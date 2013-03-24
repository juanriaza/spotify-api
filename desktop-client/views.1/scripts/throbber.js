require(["$views/utils/css","$views/utils/dom","$api/models"],function(d,i,h){function a(a,e){this.contentElement=a;this.delay=e;this.position={x:0,y:0};this.isActive=!0;this._createNode();this.hideContent();if("number"===typeof e){var b=this;setTimeout(function(){b.isActive&&(b._addNode(),b.setPosition("center","center"))},e)}else this._addNode(),this.setPosition("center","center")}SP.inherit(a,h.Observable);a.forElement=function(f,e){return new a(f,e)};a.prototype.setPosition=function(a,e){if(this.node.parentNode){var b=
void 0===a?this.position.x:a,c=void 0===e?this.position.y:e;this.position.x=b;this.position.y=c;var d=this.node.getBoundingClientRect(),g=this.contentElement.getBoundingClientRect();"string"===typeof b?("left"===b&&(b=0),"right"===b&&(b=g.width-d.width+"px"),"center"===b&&(b=(g.width-d.width)/2+"px")):"number"===typeof b&&(b+="px");"string"===typeof c?("top"===c&&(c=0),"bottom"===c&&(c=g.height-d.height+"px"),"center"===c&&(c=(g.height-d.height)/2+"px")):"number"===typeof c&&(c+="px");0>b&&(b=0);
0>c&&(c=0);this.node.style.left=b;this.node.style.top=c}};a._sizes={normal:"",small:"sp-throbber-small"};a.prototype.setSize=function(f){if(this.size!==f){if(!(f in a._sizes))throw Error(f+" is not a valid size");d.removeClass(this.node,a._sizes[this.size]);d.addClass(this.node,a._sizes[f]);this.size=f;this.setPosition()}};a.prototype.hideContent=function(){this.contentElement.style.visibility="hidden";this.contentElement.style.pointerEvents="none";this.contentHidden=!0;this._removeBackground()};
a.prototype.showContent=function(){this.contentElement.style.visibility="visible";this.contentElement.style.pointerEvents="auto";this.contentHidden=!1;this._addBackground()};a.prototype.hide=function(){this.isAddedToDOM&&this._removeNode();this.contentHidden&&this.showContent();this.isActive=!1;this._showTimeout&&(clearTimeout(this._showTimeout),this._showTimeout=null)};a.prototype.show=function(){if(!this.isAddedToDOM)if("number"===typeof this.delay){var a=this;this._showTimeout=setTimeout(function(){a._addNode();
a.hideContent();a.isActive=!0},this.delay)}else this._addNode(),this.hideContent(),this.isActive=!0};a.prototype._createNode=function(){var a=document.createElement("div");a.className="sp-throbber";this.node=a};a.prototype._addNode=function(){this.node.parentNode&&this._removeNode();this.contentElement.appendChild(this.node);this.isAddedToDOM=!0;this.oldContentPosition=d.getStyle(this.contentElement,"position");"static"===this.oldContentPosition&&(this.contentElement.style.position="relative")};a.prototype._removeNode=
function(){this.node.parentNode.removeChild(this.node);this.isAddedToDOM=!1;this.contentElement.style.position=this.oldContentPosition};a.prototype._addBackground=function(){d.addClass(this.node,"sp-throbber-background");this.setSize("small")};a.prototype._removeBackground=function(){d.removeClass(this.node,"sp-throbber-background");this.setSize("normal")};exports.Throbber=a});
