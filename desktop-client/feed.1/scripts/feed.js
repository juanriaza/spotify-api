var sp=getSpotifyApi(),$language=sp.require("$util/language"),$dom=sp.require("$util/dom"),$models=sp.require("$api/models"),$popover=sp.require("$unstable/popover"),$presence=sp.require("$unstable/presence"),$react=sp.require("$util/react"),$staticdata=sp.require("$unstable/staticdata"),$views=sp.require("$api/views"),$i18n=sp.require("scripts/i18n"),$presenceFormatter=sp.require("/scripts/presence-formatter"),$miniPlayer=sp.require("/scripts/mini-player"),CATALOG=$language.loadCatalog("feed",""),
_=partial($language.getString,CATALOG,"presence"),_f=partial($language.getString,CATALOG,"feed"),$loggingHelper,CLEAN_INTERVAL=1E4,UPDATE_AFTER_ADD_TIMEOUT=100,MAX_ITEMS=30,SHARABLE_LINK_TYPES={1:1,2:1,4:1,5:1};exports.Feed=Feed;
function Feed(){var d=this,a,j,g,f,h,i,k,p,q,r,s,m,t,u,v,l,n=0;a=new $presenceFormatter.PresenceFormatter(function(b,c,e,a){j(b,c,e,a)});a.stringFromArtistsArray=function(b){return'<span class="artist">'+map(function(b){return a.createLink(b.name.decodeForHTML(),b.uri)},b).join(", ")+"</span>"};a.createLink=function(b,c,e,a){void 0===e&&(e="");void 0===a&&(a="");return'<a href="'+c+'" class="'+e+'" data-uri="'+a+'">'+b+"</a>"};a.createTrackInAlbumLink=function(b,c){return"spotify:app:album:"+c.split(":")[2]+
":"+b.split(":")[2]};a.createDurationNode=function(b){return'<span class="duration">'+stringFromDuration(b)+"</span>"};a.formatPlaylistPublished=function(b,c,e){return $language.format(_("playlistPublished"),a.createLink(e.name.decodeForHTML(),e.uri,"strong"),$language.format('<div class="info"><div>{0}</div></div>',a.createLink(c.name.decodeForHTML(),c.uri,"h6")))};a.formatPlaylistSubscribed=function(b,c,e,d){return $language.format(_("playlistSubscribed"),a.createLink(e.name.decodeForHTML(),e.uri,
"strong"),$language.format('<div class="info"><div>'+_("itemByArtists")+"</div></div>",a.createLink(c.name.decodeForHTML(),c.uri,"h6"),a.createLink(d.name.decodeForHTML(),d.uri)))};a.formatMyPlaylistSubscribed=function(b,c,e){return $language.format(_("myPlaylistSubscribed"),a.createLink(e.name.decodeForHTML(),e.uri,"strong"),$language.format('<div class="info"><div>{0}</div></div>',a.createLink(c.name.decodeForHTML(),c.uri,"h6")))};a.formatPlaylistTrackAdded=function(b,c,e){b=c[0];c=c[1];return $language.format(_("playlistTrackAdded"),
a.createLink(e.name.decodeForHTML(),e.uri,"strong"),c?a.createLink(c.data.name.decodeForHTML(),c.data.uri,"strong"):_("aPlaylist"),$language.format('<div class="info"><div>{0} {1} {2}</div></div>',a.createLink(b.name.decodeForHTML(),b.uri,"h6",a.createTrackInAlbumLink(b.uri,b.album.uri)),a.stringFromArtistsArray(b.artists),a.createDurationNode(b.duration)))};a.formatTrackStarred=function(b,c,e){return $language.format(_("playlistTrackStarred"),a.createLink(e.name.decodeForHTML(),e.uri,"strong"),$language.format('<div class="info"><div>{0} {1}</div></div>',
a.createLink(c.name.decodeForHTML(),c.uri,"h6",a.createTrackInAlbumLink(c.uri,c.album.uri)),a.stringFromArtistsArray(c.artists)))};a.formatTrackFinishedPlaying=function(b,c,e){var d=null,d="#";b.type==$presence.PresenceState.TYPE.APP_TRACK_FINISHED_PLAYING&&b.appInfo&&""!==b.appInfo.name?(d="spotify:app:"+b.appInfo.application,d=$language.format('{0}<a class="app-link" href="'+d+'">{1}</a>',$language.format(_("trackFinishedPlaying"),a.createLink(e.name.decodeForHTML(),e.uri,"strong"),$language.format('<div class="info"><div>{0} {1}</div></div>',
a.createLink(c.name.decodeForHTML(),c.uri,"h6",a.createTrackInAlbumLink(c.uri,c.album.uri)),a.stringFromArtistsArray(c.artists))),$language.format('<span class="app-icon" style="{1}"></span><span class=" app-info">{0}</span>',$language.format(_("usingApp"),b.appInfo.name),"background-image:url("+b.appInfo.icon_small+")"))):b.type==$presence.PresenceState.TYPE.RADIO_TRACK_FINISHED_PLAYING?(d=b.referrerUri,d=$language.format('{0}<a class="app-link" href="'+d+'">{1}</a>',$language.format(_("trackFinishedPlaying"),
a.createLink(e.name.decodeForHTML(),e.uri,"strong"),$language.format('<div class="info"><div>{0} {1}</div></div>',a.createLink(c.name.decodeForHTML(),c.uri,"h6",a.createTrackInAlbumLink(c.uri,c.album.uri)),a.stringFromArtistsArray(c.artists))),$language.format('<span class="app-icon radio" style="{1}"></span><span class=" app-info radio">{0}</span>',$language.format(_("usingApp"),"Spotify radio"),"background-image:url(sp://resources/img/buddylist-radio-icon.png)"))):d=$language.format(_("trackFinishedPlaying"),
a.createLink(e.name.decodeForHTML(),e.uri,"strong"),$language.format('<div class="info"><div>{0} {1}</div></div>',a.createLink(c.name.decodeForHTML(),c.uri,"h6",a.createTrackInAlbumLink(c.uri,c.album.uri)),a.stringFromArtistsArray(c.artists)));return d};a.formatTrackShared=function(b,c,e){b=b.message?"<em>"+b.message.decodeForHTML()+"</em>":"";return $language.format(_("userSharedTrack"),a.createLink(e.name.decodeForHTML(),e.uri,"strong"),$language.format('<div class="bubble">{0} {1}</div>',b,$language.format('<div class="info"><div>{0} {1} {2}</div></div>',
a.createLink(c.name.decodeForHTML(),c.uri,"h6",a.createTrackInAlbumLink(c.uri,c.album.uri)),a.stringFromArtistsArray(c.artists),a.createDurationNode(c.duration))))};a.formatPlaylistShared=function(b,c,e){b=b.message?"<em>"+b.message.decodeForHTML()+"</em>":"";return $language.format(_("userSharedPlaylist"),a.createLink(e.name.decodeForHTML(),e.uri,"strong"),$language.format('<div class="bubble">{0}{1}</div>',b,$language.format('<div class="info"><div>{0}</div></div>',a.createLink(c.name.decodeForHTML(),
c.uri,"h6"))))};a.formatAlbumShared=function(b,c,e){b=b.message?"<em>"+b.message.decodeForHTML()+"</em>":"";return $language.format(_("userSharedAlbum"),a.createLink(e.name.decodeForHTML(),e.uri,"strong"),$language.format('<div class="bubble">{0}{1}</div>',b,$language.format('<div class="info"><div>'+_("itemByArtists")+"</div></div>",a.createLink(c.name.decodeForHTML(),c.uri,"h6"),a.stringFromArtistsArray([c.artist]))))};a.formatArtistShared=function(b,c,e){b=b.message?"<em>"+b.message.decodeForHTML()+
"</em>":"";return $language.format(_("userSharedArtist"),a.createLink(e.name.decodeForHTML(),e.uri,"strong"),$language.format('<div class="bubble">{0}{1}</div>',b,$language.format('<div class="info"><div>{0}</div></div>',a.createLink(c.name.decodeForHTML(),c.uri,"h6"))))};a.formatFavouriteAppAdded=function(b,c){var e=null;return e=$language.format('<span class="info">{0}</span><a class="app-link" href="spotify:app:'+b.appInfo.application+'">{1}</a>',$language.format(_("userAddedApp"),$language.format("<strong>{0}</strong>",
c.name.decodeForHTML()),b.appInfo.name),$language.format('<span class="app-icon-big" style="{1}"></span><span class=" app-info">{0}</span>',b.appInfo.name,"background-image:url('"+b.appInfo.icon_medium+"')"))};r=function(b){if(!b.loadedArtwork){b.loadedArtwork=!0;var c=b.state,e=null,a;if(c.type===$presence.PresenceState.TYPE.TRACK_FINISHED_PLAYING||c.type===$presence.PresenceState.TYPE.APP_TRACK_FINISHED_PLAYING||c.type===$presence.PresenceState.TYPE.RADIO_TRACK_FINISHED_PLAYING||c.type===$presence.PresenceState.TYPE.PLAYLIST_TRACK_ADDED||
c.type===$presence.PresenceState.TYPE.PLAYLIST_TRACK_STARRED||c.type===$presence.PresenceState.TYPE.TRACK_SHARED)a=$dom.queryOne(".info",b.node),s(c,a);else if(c.type===$presence.PresenceState.TYPE.ALBUM_SHARED)$models.Album.fromURI(c.albumUri,function(a){if(a.data){var d=$dom.queryOne(".info",b.node);e=new $views.Image(a.data.cover,c.albumUri,$language.format(_("itemByArtists"),a.data.name.decodeForHTML(),a.data.artist.name.decodeForHTML()));e.node.classList.add("cover");d.appendChild(e.node)}});
else if(c.type===$presence.PresenceState.TYPE.ARTIST_SHARED)a=$dom.queryOne(".info",b.node),e=document.createElement("a"),e.href=c.artistUri,e.className="sp-image artist",a.appendChild(e);else if(c.type===$presence.PresenceState.TYPE.PLAYLIST_PUBLISHED||c.type===$presence.PresenceState.TYPE.PLAYLIST_SUBSCRIBED||c.type===$presence.PresenceState.TYPE.MY_PLAYLIST_SUBSCRIBED||c.type===$presence.PresenceState.TYPE.PLAYLIST_SHARED){-1<c.playlistUri.indexOf(":publishedstarred")&&(c.playlistUri=c.playlistUri.replace("publishedstarred",
"starred"));var d=sp.core.getPlaylist(c.playlistUri,!1),h=!1,f=function(){if(0<d.cover.length||!e){0<d.cover.length&&d.removeEventListener("change",f);e&&(e.node&&e.node.parentNode&&e.node.parentNode.removeChild(e.node),e=null);e=new $views.Image(d.cover,c.playlistUri);var a=$dom.queryOne(".info",b.node),x=$dom.queryOne(".info > div",b.node);if(!h){if(0<d.subscriberCount){var g=d.subscriberCount,i=$i18n.plural(g,_("follower"),_("manyFollowers"),_("fewFollowers")),g=new $dom.Element("span",{innerHTML:$i18n.number(g)+
" "+i});x.appendChild(g)}h=!0}e.node.classList.add("playlist");a.appendChild(e.node)}};d.loaded?f():d.addEventListener("change",f)}}};s=function(b,c){var e=function(){var a=new $miniPlayer.MiniPlayer;a.setAdditionalData({username:b.username});a.loadURI(b.trackUri);c.appendChild(a.node);this.removeEventListener("mouseover",e)};if(b.type===$presence.PresenceState.TYPE.TRACK_FINISHED_PLAYING||b.type===$presence.PresenceState.TYPE.APP_TRACK_FINISHED_PLAYING||b.type===$presence.PresenceState.TYPE.RADIO_TRACK_FINISHED_PLAYING||
b.type===$presence.PresenceState.TYPE.PLAYLIST_TRACK_ADDED||b.type===$presence.PresenceState.TYPE.TRACK_SHARED)$models.Track.fromURI(b.trackUri,function(b){function a(b){b=new $views.Image(b);b.node.addEventListener("mouseover",e);b.node.classList.add("track");c.appendChild(b.node)}!b||!b.data||!b.data.album?a(""):b.data.album.cover?a(b.data.album.cover):b.data.album.uri&&$models.Album.fromURI(b.data.album.uri,function(b){a(b.data.cover)})});else if(b.type===$presence.PresenceState.TYPE.PLAYLIST_TRACK_STARRED){var a=
new $dom.Element("div",{className:"placeholder"});a.classList.add("starred");a.addEventListener("mouseover",e);c.appendChild(a)}};m=function(b){var c=a.stickyFactor(b.type);return b.timestamp+20*c};l=function(){for(var b=0,c=d.node.childNodes,a=0,h=c.length;a<h;a++)b+=c[a].offsetHeight;d.node.style.height=b+"px"};v=function(b,c){var a=c.node,d=a.offsetHeight;(c.state.type===$presence.PresenceState.TYPE.PLAYLIST_TRACK_ADDED||c.state.type===$presence.PresenceState.TYPE.PLAYLIST_PUBLISHED||c.state.type===
$presence.PresenceState.TYPE.PLAYLIST_SUBSCRIBED||c.state.type===$presence.PresenceState.TYPE.MY_PLAYLIST_SUBSCRIBED||c.state.type===$presence.PresenceState.TYPE.TRACK_SHARED||c.state.type===$presence.PresenceState.TYPE.PLAYLIST_SHARED||c.state.type===$presence.PresenceState.TYPE.ALBUM_SHARED)&&a.classList.add("big-image");b?(a.addEventListener("webkitAnimationEnd",function y(){l();a.removeEventListener("webkitAnimationEnd",y)}),a.style.marginTop=-d+"px",a.classList.add("show"),a.style.marginTop=
"0"):l()};t=function(b,c){d.items.splice(c,0,b);d.node.insertBefore(b.node,d.node.childNodes[c]);return b};k=function(b,c){return b.username===c.username&&b.timestamp===c.timestamp};f=function(b){for(var c=!1,a=0,h=d.items.length;a<h;++a)if(k(b,d.items[a].state)){c=!0;break}return c};g=function(b,c){return compare(m(b.state),m(c.state))};p=function(b){if(b.state.atFront)return 0;for(var c=d.items,a=0,h=c.length;a<h&&1!==g(b,c[a]);++a);return a};q=function(b){return f(b.state)?b:t(b,p(b))};j=function(b,
c,a,d){var g=!1;if(!$popover.popover||!$popover.popover.visible)d||(g=!0),v(g,q(new FeedItem(b,c,a))),n&&clearTimeout(n),n=setTimeout(h,UPDATE_AFTER_ADD_TIMEOUT)};u=function(b){b=d.items.splice(b,1)[0];d.node.removeChild(b.node)};h=function(){i();for(var b=d.node.parentNode,c=b.scrollTop,b=c+b.offsetHeight,a=0,h=0,g=d.items.length;h<g;h++){var f=d.items[h],k=h+1<g?d.items[h+1].node.offsetHeight:0,a=a+f.node.offsetHeight;a>=c&&a<=b+k&&r(f)}};i=function(){for(var b=0,c=n=0,a=d.items.length;c<a;c++)b+=
d.items[c].node.offsetHeight;for(;d.items.length>MAX_ITEMS&&b>d.node.parentNode.offsetHeight;)b-=d.items[d.items.length-1].node.offsetHeight,u(d.items.length-1);l()};d.node=document.createElement("div");d.node.className="feed";d.items=[];d.addItemForState=a.formatState;d.addItemsForStates=a.formatStates;d.getStickyness=m;d.setLoggingHelper=function(b){$loggingHelper=b;$loggingHelper.getTestGroup();$miniPlayer.setLoggingHelper(b)};d.showLoader=function(){if(!document.querySelector("#feed .loader")){var b=
document.createElement("div");b.innerHTML=_f("updating");b.className="loader";d.node.parentNode.insertBefore(b,d.node);l()}};d.hideLoader=function(){var b=document.querySelector("#feed .loader");b&&b.parentNode.removeChild(b);l()};d.noFeedItemsMessage=function(){if(!document.querySelector(".no-items")){var b=document.createElement("div");b.className="no-items";var a="<h1>"+_f("introductionTitle")+"</h1>",a=a+'<a class="button peopleButton" href="spotify:app:people">'+_f("showPeople"),a=a+"</a>";b.innerHTML=
a;$dom.adopt(d.node,b)}};d.hideNoFeedItemsMessage=function(){var b=document.querySelector(".no-items");b&&b.parentNode.removeChild(b)};d.isEmpty=function(){return 0===$dom.query(".item",d.node).length?!0:!1};setInterval(i,CLEAN_INTERVAL);var w=new $react.EventStream,z=$react.throttle(w,500);d.node.addEventListener("DOMNodeInsertedIntoDocument",function c(){d.node.removeEventListener("DOMNodeInsertedIntoDocument",c);d.node.parentNode.addEventListener("scroll",function(){$react.publish(w,null)})});
z.subscribe(h);return d}
function FeedItem(d,a,j){var g=this;g.state=d;g.node=document.createElement("div");g.loadedArtwork=!1;var f=g.node;f.appendChild(j);f.className="item type-"+d.type;f.title=a.name.decodeForText();$react.fromDOMEvent(f,"dragover").subscribe(function(a){var d=sp.core.getLinkType(a.dataTransfer.getData("text"));SHARABLE_LINK_TYPES[d]&&a.preventDefault()});$react.fromDOMEvent(f,"dragenter").subscribe(function(a){var d=sp.core.getLinkType(a.dataTransfer.getData("text"));SHARABLE_LINK_TYPES[d]?a.target.classList.add("drag-over"):
a.dataTransfer.dropEffect="none"});$react.merge($react.fromDOMEvent(f,"drop"),$react.fromDOMEvent(f,"dragleave")).subscribe(function(a){a.target.classList.remove("drag-over")});$react.fromDOMEvent(f,"drop").subscribe(function(d){d.preventDefault();d.stopPropagation();var i=d.dataTransfer.getData("text"),k=sp.core.getLinkType(i);SHARABLE_LINK_TYPES[k]?($popover.popover&&$popover.popover.targetNode===d.target&&$popover.popover.hide(!0),$popover.sharePopup(a,i,f,{relativeNode:g.node.parentNode.parentNode})):
sp.core.showClientMessage(0,$language.format($language.getString(CATALOG,"feed","unsupportedDropType"),sp.core.user.name.decodeForText()))});$react.fromDOMEvent(g.node,"click").subscribe(function(a){if("A"===a.target.tagName){var d="link";a.target.className.match(/play/)&&(d="player");a.target.className.match(/sp-image/)&&(d="image");var f=extractStateForLogging(g.state);f.uri=a.target.href;f.type=g.state.type;$loggingHelper.logClientEvent("feed link clicked",d,f);4===sp.core.getLinkType(a.target.href)&&
(a.preventDefault(),a.stopPropagation(),window.open(a.target.getAttribute("data-uri")))}});return g}function extractStateForLogging(d){for(var a="albumUri artistUri playlistUri trackUri appUri contextUri referrerUri".split(" "),j={},g=0;g<a.length;g++){var f=a[g];d.hasOwnProperty(f)&&null!==d[f]&&(j[f]=d[f])}return j}function stringFromDuration(d){var a=~~(d/1E3+0.5),d=~~(a/60),a=a-60*d;return d+":"+(9<a?a:"0"+a)};
