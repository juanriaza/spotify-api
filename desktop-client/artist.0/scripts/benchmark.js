require(["/scripts/logger#Logger","/scripts/utils"],function(e,d){function a(){this.logger=new e;this.events={};this.measurements={}}a.APP_INIT=1;a.LOAD_FROM_URI=2;a.RENDER_ABOVE_THE_FOLD=3;a.prototype.start=function(a){this.events[a]=d.performanceNow()};a.prototype.measure=function(a,c,b){b="undefined"!==typeof b?b:a;if(!this.events[b]||this.measurements[a])return!1;c={time:(d.performanceNow()-this.events[b]).toFixed(2),id:a,msg:c};this.measurements[a]=c;return!0};a.prototype.send=function(){this.logger.clientEvent("time-measurement",
this.measurements);this.measurements={}};exports.Benchmark=a});
