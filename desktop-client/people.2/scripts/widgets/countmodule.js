require("$api/i18n $api/models $shared/events#EventHandler $views/image#Image $views/popup#Popup $views/utils/css".split(" "),function(i,f,j,k,l,h){function e(a,d){f.Observable.call(this);this.sectionId=a;this.title=d;this._eventHandler=new j(this)}var g=l.withText("");SP.inherit(e,f.Observable);e.prototype.add=function(a,d){a.load("name").done(this,function(){var b=this.getNode(),c=new k(a,{link:"auto",width:28,height:28,animate:!1});this._eventHandler.listen(c.node,"click",function(){var d=[].indexOf.call(b.querySelectorAll(".sp-image"),
c.node);this.dispatchEvent({type:"navigate",href:a.uri,index:d})}).listen(c.node,"mouseover",function(){g.setText(a.name);g.showFor(c.node)}).listen(c.node,"mouseout",function(){g.hide(100)});d||h.addClass(c.node,"new");b.insertBefore(c.node,b.childNodes[1]);10<b.childNodes.length&&b.removeChild(b.childNodes[10])})};e.prototype.changeCount=function(a){a&&"number"==typeof this._countNumber&&this.setCount(this._countNumber+a)};e.prototype.dispose=function(){this._node&&(this._eventHandler.removeAll(),
this._node.parentNode&&this._node.parentNode.removeChild(this._node),delete this._link,delete this._eventHandler,delete this._node)};e.prototype.getNode=function(){if(this._node)return this._node;var a=document.createElement("section");a.className="loading count";a.id=this.sectionId+"-count";var d=document.createElement("a");d.className="title";d.href=f.session.user.uri+":"+this.sectionId;d.textContent=this.title;a.appendChild(d);this._eventHandler.listen(d,"click",function(a){this.dispatchEvent({type:"navigate",
href:a.target.href,index:-1})});this._link=d;return this._node=a};e.prototype.load=function(a){a.snapshot(0,10).done(this,function(a){for(var b=a.toArray(),c=0,e=b.length;c<e;c++)this.add(b[c],!0);this.setCount(10>b.length?b.length:a.length)}).fail(this,function(){this.setCount(null)});this._eventHandler.listen(a,"add",function(a){var b=this;this.changeCount(a.uris.length);setTimeout(function(){for(var c=0,e=a.uris.length;c<e;c++)b.add(f.Profile.fromURI(a.uris[c]))},300)}).listen(a,"remove",function(a){this.changeCount(-a.uris.length);
for(var b=0,c=a.uris.length;b<c;b++)this.remove(f.Profile.fromURI(a.uris[b]))})};e.prototype.remove=function(a){var d=this.getNode();if(a=d.querySelector('a[data-uri="'+a.uri+'"]'))this._eventHandler.unlisten(a,"click"),this._eventHandler.unlisten(a,"mouseover"),this._eventHandler.unlisten(a,"mouseout"),d.removeChild(a)};e.prototype.setCount=function(a){h.removeClass(this.getNode(),"loading");0>a&&(a=0);this._countNumber=a;this._link.textContent=this.title+" "+("number"==typeof a?i.number(a):"\u2013")};
exports.CountModule=e});
