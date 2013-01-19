var DEBUG = !1,
    basehref = location.origin;
DEBUG && console.log("basehref", basehref);
window.dependencies = {};
window.dependencies["static"] = basehref;

function SpotifyApi() {
    this._modules = {};
    this._requested = {};
    this._module_queue = [];
    this._delayed_fns = [];
    this._parallel_reqs = 4;
    this._context_stack = [];
    this._deferred_flush = !1;
    this._patch_request_send()
}
SpotifyApi.AnalyticsContext = function (a) {
    this.name = a;
    this.id = SpotifyApi.AnalyticsContext._nextId++;
    this.references = 0;
    this._begin()
};
SpotifyApi.AnalyticsContext._nextId = 1;
SpotifyApi.AnalyticsContext.prototype.addReference = function () {
    this.references++
};
SpotifyApi.AnalyticsContext.prototype.removeReference = function () {
    this.references--;
    0 === this.references && this._end()
};
SpotifyApi.AnalyticsContext.prototype._begin = function () {
    SpotifyApi.api.request("core_context_begin", [this.id, this.name], this)
};
SpotifyApi.AnalyticsContext.prototype._end = function () {
    SpotifyApi.api.request("core_context_end", [this.id], this)
};
SpotifyApi.prototype.analyticsContext = function (a, b) {
    var c = new SpotifyApi.AnalyticsContext(a);
    c.addReference();
    this._context_stack.push(c);
    try {
        b()
    } finally {
        this._context_stack.pop(), c.removeReference()
    }
};
SpotifyApi.Callback = function (a, b) {
    b = b || SpotifyApi.api._context_stack;
    this._func = a;
    this._setContextStack(b)
};
SpotifyApi.Callback.prototype.apply = function (a, b) {
    try {
        var c = SpotifyApi.api._context_stack;
        SpotifyApi.api._context_stack = this._contextStack;
        this._func.apply(a, b)
    } catch (d) {
        setTimeout(function () {
            throw d;
        }, 0)
    } finally {
        SpotifyApi.api._context_stack = c, this.clear()
    }
};
SpotifyApi.Callback.prototype.call = function (a) {
    this.apply(a, Array.prototype.slice.call(arguments, 1))
};
SpotifyApi.Callback.prototype.copy = function () {
    return new this.constructor(this._func, this._contextStack)
};
SpotifyApi.Callback.prototype.clear = function () {
    this._releaseContextStack();
    delete this._func;
    delete this._contextStack
};
SpotifyApi.Callback.prototype._setContextStack = function (a) {
    for (var b = 0, c = a.length; b < c; ++b) a[b].addReference();
    this._contextStack = a.slice(0)
};
SpotifyApi.Callback.prototype._releaseContextStack = function () {
    for (var a = this._contextStack, b = 0, c = a.length; b < c; ++b) a[c - b - 1].removeReference()
};
SpotifyApi.prototype.callback = function (a) {
    return new SpotifyApi.Callback(a)
};
SpotifyApi.prototype._getContextIdForRequest = function () {
    var a = this._context_stack;
    return a.length ? a[a.length - 1].id : 0
};
window.addEventListener("message", function (a) {
    if (a.source == window && "api-delay" == a.data && (a.stopPropagation(), SpotifyApi.api._delayed_fns)) {
        a = SpotifyApi.api._delayed_fns.splice(0);
        for (var b = 0, c = a.length; b < c; b++) a[b].call()
    }
});
SpotifyApi.prototype._prepareFlush = function () {
    this._deferred_flush || (this._deferred_flush = !0, this.defer(this, this._flushRequests))
};
SpotifyApi.prototype._flushRequests = function () {
    this.request("core_flush", []);
    this._deferred_flush = !1
};
SpotifyApi.prototype.defer = function (a, b) {
    1 == this._delayed_fns.push(this.bind(this.callback(b), a)) && window.postMessage("api-delay", "*")
};
SpotifyApi.prototype._evalModule = function (a, b, c, d) {
    return !/\.lang$/.test(c) ? this._evalJSModule(a, b, c, d) : this._evalLangModule(c, d)
};
SpotifyApi.prototype._evalJSModule = function (a, b, c, d) {
    var e = this,
        f = {
            __name: c
        }, h = function (d, g) {
            f.__waiting = !0;
            var h = function () {
                f.__waiting = !1;
                return g.apply(this, arguments)
            };
            h.__native = !0;
            return e._require(c, a, b, d, h)
        };
    try {
        return d = "'use strict';" + d + "\n//@ sourceURL=" + c, DEBUG && console.log("before eval"), (new Function("require", "exports", "SP", "_code", "eval(_code)")).call({}, h, f, this, d), DEBUG && console.log("exports after eval", c, f), f
    } catch (g) {
        throw g.message += " in " + c, g;
    }
};
SpotifyApi.LangModule = function (a, b) {
    this.__name = a;
    this.strings = b
};
SpotifyApi.LangModule.prototype.get = function (a, b) {
    for (var c = this.strings.hasOwnProperty(a) ? this.strings[a] : a, d = "", e = 0, f, h; - 1 < (f = c.indexOf("{", e));) {
        h = c.indexOf("}", f + 1);
        if (-1 == h) break;
        var g = arguments[parseInt(c.substring(f + 1, h)) + 1],
            d = void 0 !== g ? d + (c.substring(e, f) + g) : d + c.substring(e, h + 1),
            e = h + 1
    }
    return e ? d + c.substring(e) : c
};
SpotifyApi.prototype._evalLangModule = function (a, b) {
    try {
        return new SpotifyApi.LangModule(a, JSON.parse(b))
    } catch (c) {
        throw Error('Cannot import language file "' + a + '": ' + c.message);
    }
};
SpotifyApi.prototype._fireCallbacks = function (a) {
    for (; a;) {
        a.waiting--;
        if (a.waiting) break;
        a.unpacked.forEach(function (b) {
            var c = b.position,
                d = a.args[c];
            b = b.property;
            b in d && (a.args[c] = d[b])
        });
        a.callback.apply({}, a.args);
        a.waiting = 1 / 0;
        a = a.parent
    }
};
SpotifyApi.prototype._createRequest = function (a, b) {
    var c = new XMLHttpRequest;
    c.open("GET", a, !0);
    c.onreadystatechange = function () {
        if (4 == c.readyState) {
            if (200 != c.status && 0 != c.status) throw Error('Could not load module "' + a + '"; Not found.');
            b(c.responseText)
        }
    };
    c.send(null)
};
SpotifyApi.prototype._loadModule = function (a, b, c, d, e) {
    var f = this;
    f.recursivefix = (f.recursivefix || 0) + 1;
    if (1E3 < f.recursivefix) this._fireCallbacks(a);
    else {
        DEBUG && console.log("_loadModule", a, b, c, d, e);
        var h = this._modules[c];
        h && !h.__waiting ? (a.args[d] = this._modules[c], e && a.unpacked.push({
            property: e,
            position: d
        }), this._fireCallbacks(a)) : this._requested[c] || !this._parallel_reqs ? this.defer(this, function () {
            this._loadModule(a, b, c, d, e)
        }) : (this._requested[c] = !0, this._parallel_reqs--, this._createRequest(c, function (g) {
            f._parallel_reqs++;
            g = f._modules[c] = f._evalModule(a, b, c, g);
            a.args[d] = g;
            e && a.unpacked.push({
                property: e,
                position: d
            });
            f._fireCallbacks(a)
        }))
    }
};
SpotifyApi.prototype._resolveModule = function (a) {
    if (!/\.lang$/.test(a)) {
        var b = a.match(/^(\$(?:[^\/]+)\/)(?!scripts)(.*)/);
        b && (a = b[1] + "scripts/" + b[2]);
        a += ".js"
    }
    return a
};
SpotifyApi.prototype._require = function (a, b, c, d, e) {
    "string" == typeof d && (d = [d]);
    if (!d || !d.length) throw Error("Missing modules argument to require().");
    if (!e || "function" != typeof e) throw Error("Missing callback function argument to require().");
    var f = d.length;
    if (!e.__native && f != e.length) throw Error("Module-parameter mismatch! Imported " + f + " but only declared " + e.length + " in callback.");
    a = {
        name: a,
        parent: b,
        waiting: f,
        callback: e,
        args: Array(f),
        unpacked: []
    };
    b.waiting++;
    for (b = 0; b < f; b++) {
        e = d[b];
        if (!e) throw Error("Empty module name in require.");
        var h = e.split("#");
        e = this._resolveModule(h[0]);
        var h = h[1],
            g = c.slice(0),
            m = c.indexOf(e);
        g.push(e);
        if (-1 != m) throw g = g.slice(m).join(" -> "), Error('Circular Dependency on Module "' + e + '": ' + g);
        this._loadModule(a, g, e, b, h)
    }
};
SpotifyApi.prototype.varargs = function (a, b, c) {
    b || (b = 0);
    if (a[b] instanceof Array) {
        if (a.length > b + 1) throw Error("Ambiguous use of varargs");
        return c ? Array.prototype.slice.call(a[b]) : a[b]
    }
    return b ? Array.prototype.slice.call(a, b) : c ? Array.prototype.slice.call(a) : a
};
SpotifyApi.prototype.uris = function (a, b) {
    for (var c = this.varargs(a, b), d = [], e = 0, f = c.length; e < f; e++) d.push(c[e].uri);
    return d
};
SpotifyApi.prototype.bind = function (a, b, c) {
    if (2 < arguments.length) {
        var d = Array.prototype.slice,
            e = Function.prototype.bind;
        if (e && a.bind === e) return e.apply(a, d.call(arguments, 1));
        var f = d.call(arguments, 2);
        return function () {
            return a.apply(b, arguments.length ? f.concat(d.call(arguments)) : f)
        }
    }
    return function () {
        return a.apply(b, arguments)
    }
};
SpotifyApi.prototype.inherit = function (a, b) {
    var c = function () {};
    c.prototype = a._superClass = b.prototype;
    a.prototype = new c;
    return a.prototype.constructor = a
};
SpotifyApi.prototype._patch_request_send = function () {
    var a = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function () {
        return a.apply(this, arguments)
    }
};

function require(a, b) {
    return SpotifyApi.api._require("__main__", {
        callback: function () {},
        waiting: 1 / 0
    }, [], a, b)
}
String.prototype.decodeForText = function () {
    return this.toString()
};
String.prototype.decodeForHtml = function () {
    var a = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;"
    }, b = function (b) {
        return a[b]
    };
    return function () {
        return this.replace(/[&<>]/g, b)
    }
}();
String.prototype.decodeForLink = function () {
    return encodeURI(this)
};
SpotifyApi.Bases = {
    uri: "spotify",
    url: "http://open.spotify.com"
};
SpotifyApi.Exps = {
    spotify: /^spotify:(.+)$/,
    http: /^https?:\/\/open\.spotify\.com\/(.+)$/
};
String.prototype.toSpotifyURL = function () {
    var a = this.match(SpotifyApi.Exps.spotify);
    if (!a) return this;
    var a = a.pop().replace(/:$/, "").split(/:/),
        b = a.shift();
    "search" == b && (a = [a.join(":")]);
    a.unshift(SpotifyApi.Bases.url, b);
    return a.join("/")
};
String.prototype.toSpotifyURI = function () {
    var a = this.match(SpotifyApi.Exps.http);
    if (!a) return this;
    a = a.pop().replace(/\/$/, "").split(/\//);
    a.unshift(SpotifyApi.Bases.uri);
    return a.join(":")
};
String.prototype.toSpotifyLink = function () {
    return this.toSpotifyURI()
};
(function (a) {
    var b = 0,
        c = {};
    SpotifyApi.prototype._throwError = !0;
    var d = a.dependencies || [],
        e = d["static"] || "",
        f = e.replace(/\/([^\/]*)$/, ""),
        h = f + "/",
        g = SpotifyApi.prototype._resolveModule;
    SpotifyApi.prototype._resolveModule = function (b) {
        b = g(b);
        var c = b.match(/^\$([a-z\-\_]+)(\/.*)/),
            l = !1,
            j, q = !1;
        c ? (l = c[1], j = c[2]) : /^\//.exec(b) && (q = !0);
        c = !1;
        /\.lang$/.exec(b) && (c = "en.loc", b = l ? "$" + l + "/" + (j = "/" + c + j) : (q ? "/" + c : c + "/") + b);
        l && a.dependencies[l] ? b = a.dependencies[l] + j : (l ? b = "/" + l + j : q || (b = "/" + b), b = (l ? f : e) + b);
        return b
    };
    var m = a.MutationObserver || a.WebKitMutationObserver;
    m ? (new m(function (a) {
        for (var b = 0, c = a.length; b < c; b++) {
            var j = a[b].addedNodes;
            if (!j.length) return this;
            for (var q = e + "/$", d = 0, t = j.length; d < t; d++) {
                var g = j[d];
                "link" == g.tagName.toLowerCase() && /^\$/.test(g.getAttribute("href")) && (g.href = g.href.replace(q, h))
            }
        }
    })).observe(document.head, {
        childList: !0
    }) : document.head.addEventListener("DOMSubtreeModified", function (a) {
        if (a.target === document.head) {
            a = document.head.querySelectorAll('link[href^="$"]');
            for (var b = e + "/$", c = 0, j = a.length; c < j; c++) {
                var d = a[c];
                /^\$/.test(d.getAttribute("href")) && (d.href = d.href.replace(b, h))
            }
        }
    });
    if ("XDomainRequest" in a) {
        var r = SpotifyApi.prototype._createRequest;
        SpotifyApi.prototype._createRequest = function (a, b) {
            if (!/^http/.test(a)) return r(a, b);
            var c = new XDomainRequest;
            c.onprogress = function () {};
            c.onerror = function () {
                throw Error('Could not load module "' + a + '"; Not found.');
            };
            c.onload = function () {
                b(c.responseText)
            };
            c.open("GET", a);
            c.send(null)
        }
    }
    var p = {
        hermes_register_schema: 1
    };
    SpotifyApi.prototype.request = function (e, g, l, j, q) {
        g = {
            id: b++,
            name: e,
            args: g
        };
        p[e] && (g.deps = d);
        a.top.postMessage(JSON.stringify(g), "*");
        if (!j) return this;
        c[g.id] = {
            success: j,
            failed: q,
            caller: l
        };
        this._prepareFlush()
    };
    SpotifyApi.prototype._requestReply = function (a) {
        a = a.data;
        if ("string" == typeof a) try {
            a = JSON.parse(a)
        } catch (b) {
            return this
        }
        var d = c[a.id];
        if (!d) return this;
        a.success && d.success ? d.success.call(d.caller, a.payload) : !a.success && d.failed && d.failed.call(d.caller, a.payload)
    };
    SpotifyApi.api = new SpotifyApi;
    a.addEventListener("message",
    SpotifyApi.api._requestReply, !1);
    SpotifyApi.Bases.url = "https://play.spotify.com";
    SpotifyApi.Exps.http = /^https?:\/\/(play|open)\.spotify\.com\/(.+)$/;
    String.prototype.toSpotifyLink = function () {
        return this.toSpotifyURL()
    };
    document.documentElement.addEventListener("click", function (a) {
        var b = a.target;
        if ("a" === b.tagName.toLowerCase()) {
            var b = b.href,
                c = null;
            SpotifyApi.Exps.http.test(b) ? c = b.toSpotifyURI() : SpotifyApi.Exps.spotify.test(b) && (c = b);
            c && (a.preventDefault(), SpotifyApi.api.request("application_open_uri", [c, null]))
        }
    });
    var k = Array.prototype.slice;
    Array.prototype.indexOf || (Array.prototype.indexOf = function (a, b) {
        for (var c = this.length >>> 0, j = 0 > b ? Math.max(0, c + b) : b || 0; j < c; j++) if (this[j] === a) return j;
        return -1
    });
    String.prototype.trim || (String.prototype.trim = function () {
        return String(this).replace(/^\s+|\s+$/g, "")
    });
    Function.prototype.bind || (Function.prototype.bind = function (a) {
        var b = this,
            c = 1 < arguments.length ? k.call(arguments, 1) : null,
            j = function () {}, d = function () {
                var e = a,
                    g = arguments.length;
                this instanceof d && (j.prototype = b.prototype, e = new j);
                g = !c && !g ? b.call(e) : b.apply(e, c && g ? c.concat(k.call(arguments)) : c || arguments);
                return e == a ? g : e
            };
        return d
    });
    ({
        _modifiers: null,
        _keymap: null,
        _ignore: null,
        _bindings: null,
        _empty: function () {},
        init: function () {
            SpotifyApi.api.request("keyboard_get_bindings", [], this, function (a) {
                for (var b in a) a.hasOwnProperty(b) && (this[b] = a[b])
            }.bind(this), this._empty);
            a.addEventListener("keydown", this.handleOwn.bind(this, !1));
            a.addEventListener("keyup", this.handleOwn.bind(this, !0))
        },
        handleOwn: function (a,
        b) {
            if (this._ignore[b.target.tagName.toLowerCase()]) return this;
            var c = this._keymap[b.which || b.keyCode];
            if (!c) return this;
            var j = this._modifiers;
            b.altKey && (c |= j.alt);
            b.metaKey && (c |= j.meta);
            b.ctrlKey && (c |= j.ctrl);
            c = this._bindings[c];
            if (!c) return this;
            b.preventDefault();
            b.stopPropagation();
            a && SpotifyApi.api.request("keyboard_trigger_binding", [c], this, this._empty, this._empty)
        }
    }).init()
})(window);
(function (a, b, c) {
    function d(a) {
        if (a = h[a]) for (var b = a.slice(0), c = 0, f = b.length; c < f; c++) {
            var k = b[c];
            k && (0 < k.waiting && k.waiting--, k.waiting || (a[c] = null, e(k.name, k.callback), d(k.name)))
        }
    }
    function e(a, b) {
        var d = c[a] = {};
        DEBUG && console.log("unrequire::runModule called", a, d, b);
        b(d)
    }
    function f(a, b, f) {
        for (var p = {
            name: a,
            waiting: 0,
            callback: f
        }, k = b.length; k--;) {
            var n = b[k];
            n in c || (p.waiting++, (h[n] || (h[n] = [])).push(p))
        }
        p.waiting || (e(a, f), d(a))
    }
    var h = {};
    f.getState = function () {
        return JSON.parse(JSON.stringify(h))
    };
    a._unrequire = f
})(window, SpotifyApi.api, SpotifyApi.api._modules);
(function () {
    function a(a, b) {
        for (var c = [], d = 0; d < a.length; d++) {
            var e = b(a[d]);
            null != e && c.push(e)
        }
        return c
    }
    function b(a, b, c) {
        DEBUG && console.log("loading script", a);
        "undefined" !== typeof a && mini.ajax.get(a, function (d) {
            DEBUG && console.log("loaded script", a);
            var e = document.createElement("script");
            e.setAttribute("type", "text/javascript");
            try {
                e.innerHTML = d, (c || document.head).appendChild(e)
            } catch (f) {
                console.error("Exception in script loading", f)
            }
            b && setTimeout(b, 1)
        })
    }
    function c(a, b) {
        DEBUG && console.log("resolving resource",
        a);
        if ("undefined" !== typeof a && null !== a && "$" == a[0]) {
            var c = a.indexOf("/"),
                c = a.substring(c),
                d = /\$([a-z0-9]+)/.exec(a)[1],
                e = "";
            s[d] && (e = "/" + s[d]);
            var f = "http://app.spotilocal.com:7768/_sdk/" + d + e + c;
            DEBUG && console.log("resolved new url:", f);
            setTimeout(function () {
                b(f)
            }, 1)
        }
    }
    function d(a, e) {
        for (var f = 0; f < a.childNodes.length; f++)(function (a) {
            if ("LINK" == a.tagName) {
                var j = a.getAttribute("rel"),
                    f = a.getAttribute("data-href"),
                    g = a.getAttribute("href") || f;
                "stylesheet" == j && c(g, function (b) {
                    DEBUG && console.log("replaced css href",
                    g, "with", b);
                    b && a.setAttribute("href", b)
                })
            } else if ("SCRIPT" == a.tagName) {
                var j = a.getAttribute("type"),
                    f = a.getAttribute("data-src"),
                    h = a.getAttribute("src") || f;
                if (h && (/\.js/.test(h) || "text/javascript" == j)) - 1 != h.indexOf("$") ? c(h, function (a) {
                    DEBUG && console.log("replaced js src", h, "with", a);
                    a && b(a)
                }) : f && k.push(f)
            }
            a.childNodes && 0 < a.childNodes.length && d(a, e + 1)
        })(a.childNodes[f])
    }
    function e(a, c) {
        var d = [],
            e;
        for (e in a) {
            var f = a[e];
            "string" == typeof f && d.push(f)
        }
        var g = function () {
            if (0 < d.length) {
                var a = d[0];
                d.splice(0,
                1);
                b(a, g)
            } else c()
        };
        g()
    }
    function f() {
        DEBUG && console.log("run real includes...");
        setTimeout(function () {
            for (var a = m.length, b = 0; b < a; b++) require(m[b].dependencies, m[b].callback);
            DEBUG && console.log("all initial requires called.")
        }, 1)
    }
    function h() {
        DEBUG && console.log("inject dependencies?", window.dependencies);
        if (0 == window.dependencies.length) DEBUG && console.log("not ready yet.");
        else if (l) DEBUG && console.log("already injected.");
        else {
            l = !0;
            var a = [],
                b;
            for (b in window.dependencies) "static" != b && a.push(window.dependencies[b] +
                "/scripts/main.js");
            DEBUG && console.log("final dependency load queue", a);
            e(a, function () {
                if ("undefined" !== typeof DebuggerJS) DebuggerJS.on();
                require == r && (DEBUG && console.log("replacing require function..."), window.require = p);
                DEBUG && console.log("dependencies load. continue init.");
                DEBUG && console.log("fixing includes...");
                d(document.head);
                d(document.body);
                DEBUG && console.log("inject delayed scripts...");
                DEBUG && console.log(k);
                setTimeout(function () {
                    e(k, f)
                }, 350)
            })
        }
    }
    console.log("\n                 .,:ldxOOOOxol:'.                 \n             ,oONMMMMMMMMMMMMMMMMNOl'             \n          ;kWMMMMMMMMMMMMMMMMMMMMMMMMNx,          \n        lXMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMX:        \n      :XMMMMMMMMNXKKKKKKKNWMMMMMMMMMMMMMMM0;      \n    .OMMWkl:,..             ..,cdkKWMMMMMMMMk     \n   .KMMMo       ...''''...          .:d0WMMMM0    \n   OMMMMWxoxkKNWMMMMMMMMMMMWX0ko:'       ;0MMMO   \n  oMMMMMMMMMMMMNXKOOOOOO0KXWMMMMMMMXx:'   'MMMMo  \n .WMMMMMMMOc,.              ..,cx0WMMMMNOOWMMMMW. \n :MMMMMMMM,   .';cloooooc:;..      .ckNMMMMMMMMM, \n lMMMMMMMMMNNMMMMMMMMMMMMMMMMWKkc'     xMMMMMMMM, \n ;MMMMMMMMMMMMWX0kxdoooxxO0XMMMMMMW0o;:KMMMMMMMM. \n  NMMMMMMMMWl.               .:dKMMMMMMMMMMMMMMN  \n  cMMMMMMMMWo;cok0KXNNNK0Oxl;.   .:OMMMMMMMMMMMc  \n   kMMMMMMMMMMMMMMMWNNWMMMMMMMNkc. .NMMMMMMMMMl   \n    kMMMMMMMMKdc,..     ..;lxXMMMMMMMMMMMMMMMl    \n     dMMMWx;.                 .c0MMMMMMMMMMK;     \n      .l:                        .kMMMMMMWc       \n                                   'KMMXd.        \n                .lk0XNX0d:.          '.           \n                :NMMMMMMMMMx                      \n                 .,;:cccc:,                       \n\nSpotify Web Player SDK Prerelease");
    window.mini || (mini = {});
    mini.form || (mini.form = {});
    mini.ajax || (mini.ajax = {});
    window.$ || ($ = function (a) {
        "string" == typeof a && (a = document.getElementById(a));
        return a
    });
    mini.ajax.bustcache = "nocache";
    mini.form.serialize = function (b) {
        var c = function (a) {
            if (a.name) return encodeURIComponent(a.name) + "=" + encodeURIComponent(a.value)
        }, d = a(b.getElementsByTagName("input"), function (a) {
            if ("radio" != a.type && "checkbox" != a.type || a.checked) return c(a)
        }),
            e = a(b.getElementsByTagName("select"), c);
        b = a(b.getElementsByTagName("textarea"),
        c);
        return d.concat(e).concat(b).join("&")
    };
    mini.ajax.x = function () {
        try {
            return new ActiveXObject("Msxml2.XMLHTTP")
        } catch (a) {
            try {
                return new ActiveXObject("Microsoft.XMLHTTP")
            } catch (b) {
                return new XMLHttpRequest
            }
        }
    };
    mini.ajax.send = function (a, b, c, d) {
        var e = mini.ajax.x();
        if (mini.ajax.bustcache) {
            var f = mini.ajax.bustcache + "=" + (new Date).getTime();
            "GET" == c ? a += -1 == a.indexOf("?") ? "?" : "&" + f : d = d && "" != d ? d + ("&" + f) : f
        }
        e.open(c, a, !0);
        e.onreadystatechange = function () {
            4 == e.readyState && b(e.responseText)
        };
        "POST" == c && e.setRequestHeader("Content-type",
            "application/x-www-form-urlencoded");
        e.send(d)
    };
    mini.ajax.get = function (a, b) {
        mini.ajax.send(a, b, "GET")
    };
    window.dependencies = {};
    var g = {}, m = [],
        r = function (a, b) {
            m.push({
                dependencies: a,
                callback: b
            })
        }, p = function (a, b) {
            return SpotifyApi.api._require("__main__", {
                callback: function () {},
                waiting: 1 / 0
            }, [], a, b)
        }, k = [];
    window.require = r;
    var n = document.createElement("base");
    n.setAttribute("href", basehref);
    document.head.appendChild(n);
    n = document.createElement("script");
    n.setAttribute("type", "text/javascript");
    n.innerText =
        "window.addEventListener('blur', function() { window.parent.postMessage(JSON.stringify({type: 'WINDOW_BLUR'}), '*'); }, false);\nwindow.addEventListener('message', function(event) { try { var message = JSON.parse(event.data); if (message && message.type === 'WINDOW_FOCUS') { window.focus(); } } catch(e) {} } );";
    document.head.appendChild(n);
    var s = {
        about: "1480ce5",
        album: "e2f758e",
        api: "b7b2d4c",
        artist: "aa97f3c",
        "context-actions": "2082eca",
        home: "defd37a",
        player: "8e61b0b",
        playlist: "80421ad",
        radio: "dec8365",
        "recommendations-shared": "e94ed68",
        search: "fd9fa67",
        suggest: "ea37305",
        share: "b0a0242",
        shared: "a1f45b7",
        "test-runner": null,
        "test-utils": null,
        user: null,
        welcome: "244e3af",
        views: "5f61d5b",
        "now-playing-recs": "3b0f6d0"
    }, l = !1;
    window.addEventListener("load", function () {
        DEBUG && console.log("window onload triggered.");
        h()
    });
    DEBUG && console.log("Load manifest...");
    mini.ajax.get("manifest.json", function (a) {
        g = JSON.parse(a);
        DEBUG && console.log("Got manifest", g);
        DEBUG && console.log("Dependencies in manifest", g.Dependencies);
        a = function () {
            DEBUG && console.log("dependency", b);
            hash = s[b];
            DEBUG && console.log("version", g.Dependencies[b]);
            DEBUG && console.log("hash", hash);
            window.dependencies[b] = "http://app.spotilocal.com:7768/_sdk/" + b + "/" + hash
        };
        window.dependencies["static"] = basehref;
        for (var b in g.Dependencies) a(b);
        a("shared");
        DEBUG && console.log("final dependencies", window.dependencies);
        h()
    })
})(window);
