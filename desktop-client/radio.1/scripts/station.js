var util=sp.require("sp://radio/scripts/util"),Station=function(){this.id=null;this.imageUri=this.subtitleUri=this.subtitle=this.titleUri=this.title="";this.lastListen=null;this.seeds=[];this.thumbsDown=this.thumbsUp=0;this._updateMutex=new util.Mutex};Station.createNew=function(b,a,c,d,f,g){var e=new Station;e.title=b;e.titleUri=a;e.subtitle=c;e.subtitleUri=d;e.imageUri=f;e.seeds=g;return e};Station.htmldecode=function(b){if(!b||""===b)return b;var a=document.createElement("div");a.innerHTML=b;return a.firstChild.nodeValue};
Station._createFromHermesStation=function(b){var a=new Station;a.id=b.id;a.title=Station.htmldecode(b.title);a.titleUri=b.titleUri;a.subtitle=Station.htmldecode(b.subtitle);a.subtitleUri=b.subtitleUri;a.imageUri=b.imageUri;a.lastListen=b.lastListen;a.seeds=b.seeds;a.thumbsUp=b.thumbsUp;a.thumbsDown=b.thumbsDown;return a};
Station.prototype.get=function(b,a){this.id?sp.core.getHermes("GET","hm://radio/stations/"+this.id,[],{onSuccess:function(a){console.log("success");a=sp.core.parseHermesReply("StationResponse",a);console.log(a);b&&b(a)},onFailure:a}):console.log("[STATION] Error: station does not have id")};
Station.prototype._add=function(b,a){var c=this;sp.core.getHermes("POST","hm://radio/stations/",[["Station",{title:this.title,titleUri:this.titleUri,subtitle:this.subtitle,subtitleUri:this.subtitleUri,imageUri:this.imageUri,seeds:this.seeds}]],{onSuccess:function(a){a=sp.core.parseHermesReply("Station",a);c.id=a.id;"function"===typeof b&&b()},onFailure:function(b){console.log("error adding recent station",b);"function"===typeof a&&a()}})};
Station.prototype._touch=function(b,a){this.id?sp.core.getHermes("TOUCH","hm://radio/stations/"+this.id,[],{onSuccess:function(){console.log("touch success");b()},onFailure:function(){console.log("touch failure");a()}}):console.log("[STATION] Error: station does not have id")};
Station.prototype.update=function(b,a){var c=this;c._updateMutex.acquire(function(){var d=function(){c._updateMutex.release();"function"===typeof b&&b()},f=function(){c._updateMutex.release();"function"===typeof a&&a()};null!==c.id?c._touch(d,f):c._add(d,f)})};
Station.prototype.addFeedback=function(b,a){var c=this,d=function(){sp.core.getHermes("POST","hm://radio/stations/"+c.id+"/feedback",[["Feedback",{uri:b,type:a?"up":"down"}]],{onSuccess:function(){console.log("success adding feedback")},onFailure:function(a){console.log("error adding feedback",a)}})};c.id?d():c.update(d)};
Station.getList=function(b,a){"function"!==typeof b&&(b=function(){});"function"!==typeof a&&(a=function(){});console.log("[STATION] Getting station list");sp.core.getHermes("GET","hm://radio/stations/",[["StationListRequest",{canReadNewStations:!0}]],{onSuccess:function(c){console.log("[STATION] Success getting station list");try{var d=sp.core.parseHermesReply("StationList",c)}catch(f){console.log("[STATION] error parsing station list",f),a()}console.log("[STATION] Station list: ",d);if(d.stations){for(var c=
[],g=0;g<d.stations.length;g++)c.push(Station._createFromHermesStation(d.stations[g]));b(c)}else b([])},onFailure:function(){console.log("[STATION] Failure getting station list",arguments);a()}})};exports.Station=Station;