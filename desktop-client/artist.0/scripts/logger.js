require(["$api/models","/scripts/env#Environment"],function(c,d){function a(){this.context="artist";this.testGroup=!1;this.eventVersion=1;this.testVersion="base"}a.prototype.setTestGroup=function(a){this.testGroup=a};a.prototype.setTestVersion=function(a){this.testVersion=a};a.prototype.getTestVersion=function(){return this.testVersion};a.prototype.isBaseVersion=function(){return"base"===this.getTestVersion()};a.prototype.clientEvent=function(a,b){"undefined"===typeof b&&(b={});b.environment=d.desktop?
"desktop":"web";c.application.clientEvent(this.context,a,this.eventVersion,this.testVersion,b)};exports.Logger=a});