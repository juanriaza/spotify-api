require("scripts/profile-utils scripts/header.controller#Header scripts/playlist.controller#Playlists scripts/toplists.controller#Toplists scripts/activity.controller#Activity scripts/relations.controller#Relations scripts/share.controller#Share $api/models $views/image#Image $views/utils/css $shared/events#EventHandler $social-artist-shared/navigation#NavigationBar $social-artist-shared/navigation#NavigationTab strings/main.lang scripts/relations-helper#RelationTypes".split(" "),function(b,h,m,n,
p,i,q,j,u,r,s,t,d,k,l){var e=SP.bind(k.get,k),g={OVERVIEW:0,FOLLOWERS:1,FOLLOWING:2},b=function(){this.events=new s(this)};b.prototype.load=function(a,b,f,d,e){var c=this;SP.analyticsContext("LOAD: Profile",function(){c.st=0;c.username=a;c.currentUser=b;c.initView=f;c.templates=d;c.session=e;c.currentUser.username===c.username?c.maybeLoadArtist(b):c.loadUserByUsername()})};b.prototype.currentView=null;b.prototype.loadUserByUsername=function(){var a=j.User.fromUsername(this.username),b=this;SP.analyticsContext("MAIN: loading the user",
function(){a.load("name","username","uri","image").done(b,b.maybeLoadArtist).fail(b,b.handleError)})};b.prototype.maybeLoadArtist=function(a){var b=this;SP.analyticsContext("MAIN: loading artist property on user",function(){a.load("artist").done(b,b.initPage).fail(function(){b.initPage(a)})})};b.prototype.initPage=function(a){this.user=a;this.isSelf=this.user.currentUser;this.user.artist?this.getArtistData():this.initTemplates()};b.prototype.getArtistData=function(){var a=this;SP.analyticsContext("MAIN: loading properties on artist",
function(){a.user.artist.load("name","image").done(a,a.artistDataLoaded).fail(a,a.initTemplates)})};b.prototype.artistDataLoaded=function(a){this.user.name=a.name;this.initTemplates()};b.prototype.initTemplates=function(){this.initNavigation();this.initHeader();this.switchView(this.initView);this.events.listen(window,"scroll",this.scrollHandler);this.events.listen(j.application,"activate",this.activateListener)};b.prototype.activateListener=function(){this.activity&&this.activity.loadActivities();
if(this.playlists){var a=this.currentView===this.playlists;this.isSelf&&(this.playlists.destroy(),this.playlists.conceal(),this.playlists.initialize(this.isSelf,this.user,this.templates,a?this.playlists.show:null,this))}};b.prototype.initNavigation=function(){var a,b,f;this.navigation=new t;this.navigation.initialize(this.user,this);a=encodeURIComponent(this.username).replace(/\!/g,"%21");b=new d("nav-overview",e("overview"),"spotify:user:"+a);f=new d("nav-followers",e("followers"),"spotify:user:"+
a+":followers");a=new d("nav-following",e("following"),"spotify:user:"+a+":following");this.navigation.renderNavigationItems([b,f,a])};b.prototype.initHeader=function(){var a={share:this.shareButtonClicked},b=this;SP.analyticsContext("INIT: Header",function(){b.header=new h;b.header.initialize(b.isSelf,b.user,b.templates,a,b)})};b.prototype.initToplists=function(){var a=this;SP.analyticsContext("INIT: Toplists",function(){if(!a.toplists){var b=a.playlists?a.playlists.getPlaylists():0;a.toplists=new n;
a.toplists.initialize(a.isSelf,a.user,a.templates,b)}(a.currentView===a.playlists||void 0===a.currentView)&&a.toplists.show()})};b.prototype.initActivity=function(){var a=this;SP.analyticsContext("INIT: Activity",function(){a.activity?a.activity.loadActivities():(a.activity=new p,a.activity.initialize(a.isSelf,a.user,a.templates,a.currentUser));a.activity.show()})};b.prototype.initFollowers=function(){var a=this;SP.analyticsContext("INIT: Followers",function(){a.followers||(a.followers=new i,a.followers.initialize(a.user,
a.isSelf,a.templates,l.FOLLOWERS));a.followers.show()})};b.prototype.initFollowing=function(){var a=this;SP.analyticsContext("INIT: Followings",function(){a.following||(a.following=new i,a.following.initialize(a.user,a.isSelf,a.templates,l.FOLLOWING));a.following.show()})};b.prototype.initPlaylists=function(){var a=this;SP.analyticsContext("INIT: Playlists",function(){a.playlists||(a.playlists=new m,a.playlists.initialize(a.isSelf,a.user,a.templates,a.initToplists,a));a.playlists.show()})};b.prototype.initShare=
function(){this.share=new q;this.share.initialize(this.isSelf,this.user,this.templates)};b.prototype.hideSection=function(a){this[a]&&this[a].hide();(a=document.querySelector(".app-"+a))&&r.addClass(a,"hidden")};b.prototype.destroyController=function(a){this[a]&&this[a].destroy()};b.prototype.handleError=function(a,b){if(b&&("unknown"===b.error||"invalid-uri"===b.error))this.header=new h,this.header.initialize(!1,null,this.templates,null,this)};b.prototype.dispose=function(){this.destroyController("playlists");
this.destroyController("navigation");this.destroyController("header");this.destroyController("activity");this.destroyController("toplists");this.destroyController("following");this.destroyController("followers");this.destroyController("share");this.events.removeAll()};b.prototype.switchView=function(a){switch(a){case g.FOLLOWERS:this.showFollowers();break;case g.FOLLOWING:this.showFollowing();break;default:this.showOverview()}};b.prototype.showOverview=function(){this.hideSection("following");this.hideSection("followers");
this.initPlaylists();this.toplists&&this.toplists.show();this.initActivity();this.currentView=this.playlists;this.setScrollPos();this.navigation.setActive("overview")};b.prototype.showFollowers=function(){this.hideSection("playlists");this.hideSection("activity");this.hideSection("toplists");this.hideSection("following");this.initFollowers();this.currentView=this.followers;this.setScrollPos();this.navigation.setActive("followers")};b.prototype.showFollowing=function(){this.hideSection("playlists");
this.hideSection("activity");this.hideSection("toplists");this.hideSection("followers");this.initFollowing();this.currentView=this.following;this.setScrollPos();this.navigation.setActive("following")};b.prototype.setScrollPos=function(){var a=this.st;168<=a&&(a=this.currentView.getScrollPos());window.scrollTo(0,a)};b.prototype.shareButtonClicked=function(a){this.share||this.initShare();this.share.show(a.node,{x:37,y:35})};b.prototype.scrollHandler=function(){this.st=window.scrollY;this.navigation.scrollHandler(this.st);
this.currentView.scrollHandler(this.st)};exports.Profile=b;exports.Views=g});
