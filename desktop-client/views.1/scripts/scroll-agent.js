require(["$views/scroll-agent/scroll-agent-fixed-height#ScrollAgent","$views/scroll-agent/scroll-agent-endless#ScrollAgent"],function(b,c){exports.ScrollAgent=function(d,a){a||(a={});return new (a.prefill?b:c)(d,a)}});
