require(["$api/models"],function(){function b(){this.previousContext=null;this.contextIndex=0;this.contexts=[];this.contextMapping={};this.index=0;window.contexts=this.contexts;window.contextMapping=this.contextMapping}b.prototype.place=function(a,b){this.allocate(a);this.evaluate(a,b)};b.prototype.allocate=function(a,b){this.contexts[this.index]=b;this.contextMapping[a]=this.index;this.index++};b.prototype.isThunk=function(a){return"function"===typeof a};b.prototype.evaluateNext=function(a){(a=this.contexts[this.contextMapping[a]+
1])&&this.isThunk(a)&&a.call(this)};b.prototype.evaluate=function(a,b){var d=this.contextMapping[a];if(d&&0<d){var c=this.contexts[d-1];this.contexts[d]={group:b,index:-1};c&&!this.isThunk(c)&&(c.group.connect(b),-1!==c.index&&(this.contexts[d].index=c.index+1));if((c=this.contexts[d+1])&&!this.isThunk(c)&&-1!==c.index)this.contexts[d].index=c.index-1}else this.contexts[0]={group:b,index:0}};b.prototype.contextAt=function(a){return(a=this.contexts[this.contextMapping[a]])&&!this.isThunk(a)&&-1!==
a.index&&a.list?a:null};exports.ContextManager=b});