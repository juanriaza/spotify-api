function Range(a,b){this.update(a,b)}Range.prototype.update=function(a,b){null!=a&&(this.start=a);null!=b&&(this.end=b);this.length=this.end-this.start;return this};Range.prototype.intersects=function(a){return!a?!1:!(a.start>=this.end||a.end<=this.start)};Range.prototype.contained=function(a){return!a?!1:a.start<=this.start&&a.end>=this.end};Range.prototype.contains=function(a){return!a?!1:this.start<=a.start&&this.end>=a.end};
Range.prototype.fits=function(a,b){return!a&&!b?!0:!a?this.end<=b.start:!b?this.start>=a.end:this.start>=a.end&&this.end<=b.start};Range.prototype.between=function(a,b){return!a&&!b?this.copy():!a?this.start>=b.start?null:new Range(this.start,Math.min(this.end,b.start)):!b?this.end<=a.end?null:new Range(Math.max(a.end,this.start),this.end):this.end>a.end&&this.start<b.start?new Range(Math.max(a.end,this.start),Math.min(b.start,this.end)):null};
Range.prototype.copy=function(){return new Range(this.start,this.end)};Range.prototype.subtract=function(a){if(!this.intersects(a))return null;var b=[];a.start>this.start&&b.push(new Range(this.start,a.start));a.end<this.end&&b.push(new Range(a.end,this.end));return b};Range.prototype.squeeze=function(a){for(var b=[],c=-1;c<a.length;c++){var d=this.between(a[c],a[c+1]);d&&b.push(d)}return b};
Range.prototype.split=function(a){for(var b=a.length;b--;){var c=a[b].subtract(this);c&&[].splice.apply(a,[b,1].concat(c))}return a};Range.prototype.absorb=function(a){for(var b=-1,c=-1;c<a.length;c++){var d=a[c],e=a[c+1];if(this.fits(d,e)){var f;d&&d.end===this.start&&(f=d.update(null,this.end),b=c);e&&e.start===this.end&&(f?(f.update(null,e.end),a.splice(c+1,1)):(f=e.update(this.start),b=c+1));f||a.splice(b=c+1,0,this.copy());break}}return b};
Range.prototype.insert=function(a,b){for(var c=-1,d=-1;d<a.length;d++)if(this.fits(a[d],a[d+1])){c=d+1;b||a.splice(c,0,this);break}return c};Range.prototype.toIndices=function(){for(var a=[],b=this.start;b<this.end;b++)a.push(b);return a};Range.fromIndices=function(a){a.sort(function(a,b){return a>b?1:-1});for(var b=[],c,d,e=0;e<a.length;e++){for(d=c=a[e];1==a[e+1]-a[e];)d=a[e+1],e++;b.push(new Range(c,d+1))}return b};exports.Range=Range;