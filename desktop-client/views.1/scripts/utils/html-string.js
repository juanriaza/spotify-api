function HTMLString(a){this.tagName=a;this.classes=[];this.attributes={};this.children=[];this.style={}}
HTMLString.prototype.toString=function(){var a=["<",this.tagName];this.classes.length&&this.setAttribute("class",this.classes.join(" "));this.className&&this.setAttribute("class",this.className);var b=[],c;for(c in this.style)b.push(c,":",this.style[c],";");b.length&&this.setAttribute("style",b.join(""));for(var d in this.attributes)a.push(" ",d,'="',this.attributes[d],'"');this.children.length?a.push(">",this.children.join(""),"</",this.tagName,">"):a.push("></",this.tagName,">");return a.join("")};
HTMLString.prototype.appendChild=function(a){var b=this.children.indexOf(a);-1!==b&&this.children.splice(b,1);this.children.push(a);"string"!==typeof a&&(a.parentNode=this);return a};HTMLString.prototype.removeChild=function(a){var b=this.children.indexOf(a);if(-1!==b)return"string"!==typeof a&&delete a.parentNode,this.children.splice(b,1),a};
HTMLString.prototype.insertBefore=function(a,b){var c=this.children.indexOf(b);-1!==c?this.children.splice(c,0,a):this.children.push(a);"string"!==typeof a&&(a.parentNode=this);return a};HTMLString.prototype.setAttribute=function(a,b){this.attributes[a]=b;return this};HTMLString.prototype.getAttribute=function(a){return this.attributes[a]};HTMLString.prototype.addClass=function(a){-1===this.classes.indexOf(a)&&this.classes.push(a);return this};
HTMLString.prototype.removeClass=function(a){a=this.classes.indexOf(a);-1!==a&&this.classes.splice(a,1);return this};HTMLString.prototype.hasClass=function(a){return-1!==this.classes.indexOf(a)};exports.createElement=function(a){return new HTMLString(a)};
