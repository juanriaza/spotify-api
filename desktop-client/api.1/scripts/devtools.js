require(["$api/models"],function(b){function a(c){this.resolve("app",c)}function e(c,a){this.resolve("name",c);this.resolve("succeeded",a.succeeded);this.resolve("failed",a.failed);this.resolve("aborted",a.aborted);this.resolve("total",this.succeeded+this.failed+this.aborted);this.resolveDone()}function f(c){b.BridgeLoadable.call(this);this._callback=c;this.bridgeListen("devtools_profiling_event_wait",[])}SP.inherit(a,b.Loadable);b.Loadable.define(a,["app","usage"],"_metadata");a.forApp=function(c){return new a(c)};
a.forAllApps=function(){return new a};a.prototype._loadDone=function(c){var a=[],b;for(b in c)a.push(new e(b,c[b]));this.resolve("usage",a);this.resolveDone()};a.prototype._metadata=function(a){SP.request("devtools_api_usage",[this.app],this,this._loadDone,function(b){this.resolveFail(a,b)})};SP.inherit(e,b.Loadable);b.Loadable.define(e,["name","total","succeeded","failed","aborted"]);SP.inherit(f,b.BridgeLoadable);f.prototype.eventDone=function(a){this._callback(a)};var d;exports.Stats=a;exports.enableProfiling=
function(a){SP.request("devtools_enable_profiling",[]);void 0===d&&(d=new f(a))};exports.disableProfiling=function(){SP.request("devtools_disable_profiling",[]);void 0!==d&&(d=void 0)}});
