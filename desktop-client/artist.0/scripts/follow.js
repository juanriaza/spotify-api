require("$api/models $api/private/relationsartist $api/relations#Relations $api/i18n $views/buttons $views/image#Image /scripts/env#Environment /strings/main.lang /scripts/config#Config /scripts/logger#Logger".split(" "),function(e,f,g,h,i,c,j,d,k,l){var m=d.get.bind(d),n=new l,b=function(){if(this.enabled=j.desktop||k.get("release").has("domino"))this.view=new b.view};b.prototype.init=function(a){if(this.enabled){this.view.init();this.artist=a;this.artist.load("user").done(this,function(){a.user instanceof
e.User?g.forUser(a.user).load("subscribers").done(this,function(a){a.subscribers.snapshot(0,0).done(this,function(a){this.setFollowerCount(a.length)})}):f.subscriberCount(a.uri).done(this,this.setFollowerCount)});this.button=i.SubscribeButton.forArtist(a);var b=this.changeFollowerCount.bind(this),c=this.logSubscribe.bind(this);this.button.addEventListener("subscribe",b);this.button.addEventListener("unsubscribe",b);this.button.addEventListener("subscribe",c);this.button.addEventListener("unsubscribe",
c)}};b.prototype.changeFollowerCount=function(a){this.setFollowerCount(this.count+("unsubscribe"===a.type?-1:1))};b.prototype.logSubscribe=function(a){n.clientEvent("subscribe"===a.type?"subscribe-artist":"unsubscribe-artist",{artist:this.artist.uri})};b.prototype.setFollowerCount=function(a){this.count=a;this.view.clearFollowerCount();0!==a&&this.view.renderFollowerCount(a)};b.prototype.destroy=function(){};b.prototype.render=function(){this.enabled&&this.view.render(this.button)};c=function(){};
c.prototype.init=function(){var a=$$("#artist-buttons .sp-button-subscribe")[0];a&&a.dispose()};c.prototype.render=function(a){document.getElementById("artist-buttons-follow").appendChild(a.node)};c.prototype.destroy=function(){};c.prototype.clearFollowerCount=function(){$("artist-followers").innerHTML=""};c.prototype.renderFollowerCount=function(a){$("artist-followers").innerHTML='<p id="artist-follower-headline">'+m("followers")+"</p><h2>"+h.number(a)+"</h2>"};b.view=c;exports.FollowHandler=b});
