(function(){var n=0,i={};SpotifyApi.prototype._throwError=!0;var e=window.dependencies,h=e["static"],j=h.replace(/\/([^\/]*)$/,""),k=j+"/",p=SpotifyApi.prototype._resolveModule;SpotifyApi.prototype._resolveModule=function(b){var b=p(b),c=b.match(/^\$([a-z\-\_]+)(\/.*)/),a=!1,d,f=!1;c?(a=c[1],d=c[2]):/^\//.exec(b)&&(f=!0);c=!1;/\.lang$/.exec(b)&&(c="en.loc",b=a?"$"+a+"/"+(d="/"+c+d):(f?"/"+c:c+"/")+b);a&&e[a]?b=e[a]+d:(a?b="/"+a+d:f||(b="/"+b),b=(a?j:h)+b);return b};var l=window.MutationObserver||
window.WebKitMutationObserver;l?(new l(function(b){for(var c=0,a=b.length;c<a;c++){var d=b[c].addedNodes;if(!d.length)return this;for(var f=h+"/$",g=0,q=d.length;g<q;g++){var e=d[g];"link"==e.tagName.toLowerCase()&&/^\$/.test(e.getAttribute("href"))&&(e.href=e.href.replace(f,k))}}})).observe(document.head,{childList:!0}):document.head.addEventListener("DOMSubtreeModified",function(b){if(b.target===document.head)for(var b=document.head.querySelectorAll('link[href^="$"]'),c=h+"/$",a=0,d=b.length;a<
d;a++){var f=b[a];/^\$/.test(f.getAttribute("href"))&&(f.href=f.href.replace(c,k))}});if("XDomainRequest"in window){var r=SpotifyApi.prototype._createRequest;SpotifyApi.prototype._createRequest=function(b,c){if(!/^http/.test(b))return r(b,c);var a=new XDomainRequest;a.onprogress=function(){};a.onerror=function(){throw Error('Could not load module "'+b+'"; Not found.');};a.onload=function(){c(a.responseText)};a.open("GET",b);a.send(null)}}var s={hermes_register_schema:1};SpotifyApi.prototype.request=
function(b,c,a,d,f){var g=window.top;if(g===window)return this;c={type:"bridge_request",id:n++,name:b,args:c};s[b]&&(c.deps=e);g.postMessage(JSON.stringify(c),"*");if(!d)return this;i[c.id]={success:d,failed:f,caller:a};this._prepareFlush()};SpotifyApi.prototype._requestReply=function(b){b=b.data;if("string"==typeof b)try{b=JSON.parse(b)}catch(c){return this}var a=i[b.id];if(!a)return this;b.success&&a.success?a.success.call(a.caller,b.payload):!b.success&&a.failed&&a.failed.call(a.caller,b.payload)};
SpotifyApi.api=new SpotifyApi;window.addEventListener("message",SpotifyApi.api._requestReply,!1);SpotifyApi.Bases.url="https://play.spotify.com";SpotifyApi.Exps.http=/^https?:\/\/(play|open)\.spotify\.com\/(.+)$/;String.prototype.toSpotifyLink=function(){return this.toSpotifyURL()};document.documentElement.addEventListener("click",function(b){var c=b.target;if("a"===c.tagName.toLowerCase()){var c=c.href,a=null;SpotifyApi.Exps.http.test(c)?a=c.toSpotifyURI():SpotifyApi.Exps.spotify.test(c)&&(a=c);
a&&(b.preventDefault(),SpotifyApi.api.request("application_open_uri",[a,null]))}});var m=Array.prototype.slice;Array.prototype.indexOf||(Array.prototype.indexOf=function(b,c){for(var a=this.length>>>0,d=0>c?Math.max(0,a+c):c||0;d<a;d++)if(this[d]===b)return d;return-1});String.prototype.trim||(String.prototype.trim=function(){return String(this).replace(/^\s+|\s+$/g,"")});Function.prototype.bind||(Function.prototype.bind=function(b){var c=this,a=1<arguments.length?m.call(arguments,1):null,d=function(){},
f=function(){var g=b,e=arguments.length;this instanceof f&&(d.prototype=c.prototype,g=new d);e=!a&&!e?c.call(g):c.apply(g,a&&e?a.concat(m.call(arguments)):a||arguments);return g==b?e:g};return f});({_modifiers:{},_keymap:{},_ignore:{},_bindings:{},_empty:function(){},init:function(){SpotifyApi.api.request("keyboard_get_bindings",[],this,function(b){for(var c in b)b.hasOwnProperty(c)&&(this[c]=b[c])}.bind(this),this._empty);window.addEventListener("keydown",this.handleOwn.bind(this,!1));window.addEventListener("keyup",
this.handleOwn.bind(this,!0))},handleOwn:function(b,c){if(this._ignore[c.target.tagName.toLowerCase()])return this;var a=this._keymap[c.which||c.keyCode];if(!a)return this;var d=this._modifiers;c.altKey&&(a|=d.alt);c.metaKey&&(a|=d.meta);c.ctrlKey&&(a|=d.ctrl);a=this._bindings[a];if(!a)return this;c.preventDefault();c.stopPropagation();b&&SpotifyApi.api.request("keyboard_trigger_binding",[a],this,this._empty,this._empty)}}).init()})();
