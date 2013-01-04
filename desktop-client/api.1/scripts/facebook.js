require(["$api/models"],function(a){function c(){a.BridgeLoadable.call(this);this.resolve("user",a.session.user);this.resolve("friends",new a.BridgeCollection(b,null,"facebook_friends",this.user.uri))}function b(d){a.BridgeLoadable.call(this);this.resolve("id",d)}SP.inherit(c,a.BridgeLoadable);a.Loadable.define(c,["user","friends"]);a.Loadable.define(c,["facebookUser"],"_query");c.prototype._query=function(d){SP.request("facebook_session_query",[],this,function(a){this.resolveMany(d,a)},function(a){this.resolveFail(d,
a)})};c.prototype._make_facebookUser=function(a){return a?b.fromId(a):null};c.prototype.post=function(d,b){return a.promisedRequest(this,"facebook_post",[d,b.uri])};c.prototype.message=function(d,b,c){d=d.map(function(a){return a.id});return a.promisedRequest(this,"facebook_message",[d,b,c.uri])};c.prototype.showConnectUI=function(){return a.promisedRequest(this,"facebook_show_connect_ui",[])};SP.inherit(b,a.BridgeLoadable);a.Loadable.define(b,["id"]);a.Loadable.define(b,["user","image","name"],"_metadata");
b.prototype._metadata=function(a){SP.request("facebook_user_metadata",[this.id],this,function(b){this.resolveMany(a,b)},function(b){this.resolveFail(a,b)})};b.prototype._make_user=function(b){return b?a.User.fromURI(b):null};b.fromId=a.Cache.lookup;b._cache=new a.Cache(b);exports.session=new c;exports.FacebookSession=c;exports.FacebookUser=b});