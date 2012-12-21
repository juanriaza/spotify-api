var dom=sp.require("$util/dom"),lang=sp.require("$util/language"),r=sp.require("$util/react"),catalog=lang.loadCatalog("$resources/cef_views"),_=partial(lang.getString,catalog,"Radio"),tokenInput=new TokenInput("uris"),lastSearch,allowedLinkTypes=[1,2,4,5,15],keyDowns=r.fromDOMEvent(window,"keydown"),escapes=r.filter(function(a){return 27===a.keyCode},keyDowns),enters=r.filter(function(a){return 13===a.keyCode},keyDowns),arrowDowns=r.filter(function(a){return 40===a.keyCode},keyDowns),arrowUps=r.filter(function(a){return 38===
a.keyCode},keyDowns);function Token(a,c,b){this.value=a;this.node=document.createElement("div");this.contentNode=this.node.cloneNode();this.removeNode=this.node.cloneNode();this.node.className="token";this.removeNode.className="remove";this.node.appendChild(this.contentNode);this.node.appendChild(this.removeNode);this.setText(c);r.fromDOMEvent(this.removeNode,"click").subscribe(function(){b.removeToken()})}Token.prototype.remove=function(){this.node.parentNode.removeChild(this.node)};
Token.prototype.setText=function(a){this.contentNode.textContent=a};
function TokenInput(){var a=this;a.tokens=[];a.input=document.createElement("input");a.node=document.createElement("div");a.node.className="input token-input";a.node.appendChild(a.input);a.result_={playlists:[]};var c=r.fromDOMEvent(a.input,"input"),c=r.filter(function(){a.tokenize()},c),b=r.filter(function(a){return 8===a.keyCode},r.fromDOMEvent(a.input,"keydown")),b=r.filter(function(a){return 0===a.currentTarget.selectionStart&&0===a.currentTarget.selectionEnd},b);c.subscribe(function(){a.tokenize()});
r.fromDOMEvent(a.input,"focus").subscribe(function(){a.node.classList.add("focus")});r.fromDOMEvent(a.input,"blur").subscribe(function(){a.node.classList.remove("focus")});b.subscribe(function(){a.removeToken()})}TokenInput.prototype.tokenize=function(){-1!==allowedLinkTypes.indexOf(sp.core.getLinkType(this.input.value))&&0===this.tokens.length&&(console.log("calling back"),this.callback(),this.clear());return this};
TokenInput.prototype.addToken=function(){var a=this.input.value,c=new Token(a,a,this);this.tokens.push(c);this.node.insertBefore(c.node,this.input);this.input.value="";sp.core.getMetadata(a,{onSuccess:function(a){c.setText(a.name)},onFailure:function(){console.log("getMetadata fail.")}})};TokenInput.prototype.removeToken=function(){0<this.tokens.length&&this.tokens.pop().remove();0===this.tokens.length&&(this.enable(),this.input.select())};
TokenInput.prototype.clear=function(){for(;this.tokens.length;)this.removeToken();this.input.value="";return this};TokenInput.prototype.disable=function(){this.input.disabled=!0;return this};TokenInput.prototype.enable=function(){this.input.disabled=!1;return this};
function setupAutoComplete(a,c){var b=a.input;a.callback=c;var d=document.createElement("div");d.tabIndex=1;d.classList.add("auto-complete");r.fromDOMEvent(d,"click").subscribe(function(b){b.preventDefault();b.currentTarget.classList.remove("show");for(var c=b.target;c;){if("A"===c.tagName){a.input.value=c.href;a.tokenize();break}c=c.parentNode;if(c===b.currentTarget)break}});r["switch"](r.fromDOMEvent(b,"focus"),function(){return r.takeUntil(r.fromDOMEvent(b,"blur"),escapes)}).subscribe(function(){d.classList.remove("show")});
var e=r.fromDOMEvent(b,"focusin"),f=r.fromDOMEvent(a.node,"focusout");r["switch"](e,function(){return r.takeUntil(f,escapes)}).subscribe(function(){setTimeout(function(){d.classList.remove("show")},100)});r["switch"](e,function(){return r.takeUntil(f,r.merge(arrowUps,arrowDowns))}).subscribe(function(a){var b=dom.query("a",d),c=dom.queryOne("a.selected",d),a=40===a.keyCode?1:-1,b=c?b[b.indexOf(c)+a]:dom.query("a",d).slice(1===a?0:a)[0];c&&b&&c.classList.remove("selected");b&&b.classList.add("selected")});
r["switch"](e,function(){return r.takeUntil(f,enters)}).subscribe(function(b){function c(b){a.input.value=b;a.tokenize();d.classList.remove("show");dom.empty(d)}b.preventDefault();var e=dom.queryOne("a.selected",d);if(e)c(e);else if(b.target===a.input)for(var b=dom.query("a",d),f=0;f<b.length;f++){var e=b[f],g=e.childNodes,g=g[g.length-1],g=3===g.nodeType?g.nodeValue:g.childNodes[0].nodeValue,g=g.toLowerCase().replace(/^\s*/,"").replace(/\s*$/,""),l=a.input.value.toLowerCase().replace(/^\s*/,"").replace(/\s*$/,
"");if(g==l){c(e);break}}});dom.adopt(a.node,d);return d}function autoComplete(a,c,b){var d=b.target.value;lastSearch=d;d.trim()?(sp.core.suggestSearch(d,{onSuccess:function(b){lastSearch===d?a(limitResults(b),!0):console.log("NO U",lastSearch,d)}}),sp.core.search(d+"*",{onSuccess:function(b){lastSearch===d?a(limitResults(b),!1):console.log("NO U",lastSearch,d)}})):(c=c(),c=limitResults(c),a(c,!0))}
function limit(a,c){var b=0,d={tracks:[],artists:[],albums:[],playlists:[]},e,f,h,i;h=Math.min(c.albums.length,Math.ceil(a/2));i=Math.min(c.playlists.length,Math.ceil(a/2));b=a/2;c.tracks.length>=b?c.artists.length>=b?(e=Math.ceil(b),f=a-e):(f=c.artists.length,e=Math.min(a-f,c.tracks.length)):(e=c.tracks.length,f=c.artists.length>=b?Math.min(a-e,c.artists.length):c.artists.length);for(b=0;b<e;b++)d.tracks.push(c.tracks[b]);for(b=0;b<f;b++)d.artists.push(c.artists[b]);for(b=0;b<h;b++)d.albums.push(c.albums[b]);
for(b=0;b<i;b++)d.playlists.push(c.playlists[b]);return d}var limitResults=partial(limit,6);function searchResultHandler(a,c,b,d){if(d||!(0==b.artists.length&&0==b.tracks.length&&0==b.albums.length))null===b||0===b.tracks.length&&0===b.artists.length&&0===b.albums.length&&0===b.playlists.length?c.classList.remove("show"):(d?a.result_.playlists=b.playlists:0<a.result_.playlists.length&&(b.playlists=a.result_.playlists),c.classList.add("show"),c.innerHTML=resultToHtml(b))}
function resultToHtml(a){var c="",b="",d="",e="",f=function(a){return-1===a.uri.search("spotify:local")},h=function(a){return lang.format('<a href="{0}">{1}{2}</a>',a.uri,a.album.cover?lang.format('<img src="{0}">',a.album.cover):"","<strong>"+a.name+"</strong> "+a.artists[0].name)},i=function(a){return lang.format('<a href="{0}">{1}{2}</a>',a.uri,a.portrait?lang.format('<img src="{0}">',a.portrait):"","<strong>"+a.name+"</strong>")},j=function(a){return lang.format('<a href="{0}">{1}{2}</a>',a.uri,
a.cover?lang.format('<img src="{0}">',a.cover):"","<strong>"+a.name+"</strong> "+a.artist.name)},k=function(a){var b=a.cover?a.cover.replace(/spotify:mosaic:([^;]{40}?).*/,"spotify:image:$1"):"sp://import/img/placeholders/20-playlist.png";return lang.format('<a href="{0}">{1}{2}</a>',a.uri,lang.format('<img src="{0}">',b),"<strong>"+a.name+"</strong>")};a.tracks.length&&(c=map(h,filter(f,a.tracks)).join(""),c=lang.format('<div class="tracks"><span>{0}</span>{1}</div>',_("Tracks"),c));a.artists.length&&
(b=map(i,a.artists).join(""),b=lang.format('<div class="artists"><span>{0}</span>{1}</div>',_("Artists"),b));a.albums.length&&(d=map(j,a.albums).join(""),d=lang.format('<div class="albums"><span>{0}</span>{1}</div>',_("Albums"),d));a.playlists.length&&(a=map(k,a.playlists).join(""),e=lang.format('<div class="playlists"><span>{0}</span>{1}</div>',_("Playlists"),a));return lang.format("{0}{1}{2}{3}",b,c,e,d)}
function throttle(a,c){var b=null,d=null;return function(){var e=arguments,f=Date.now(),h=f-(d||0);b&&(clearTimeout(b),b=null);h>=c?(d=f,a.apply(a,e)):b=setTimeout(function(){d=f;a.apply(a,e)},c-h)}}exports.autoComplete=autoComplete;exports.setupAutoComplete=setupAutoComplete;exports.tokenInput=tokenInput;exports.searchResultHandler=searchResultHandler;exports.throttle=throttle;
