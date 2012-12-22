/*

 History.getInternetExplorerMajorVersion()
 Get's the major version of Internet Explorer
 @return {integer}
 @license Public Domain
 @author Benjamin Arthur Lupton <contact@balupton.com>
 @author James Padolsey <https://gist.github.com/527683>

 History.isInternetExplorer()
 Are we using Internet Explorer?
 @return {boolean}
 @license Public Domain
 @author Benjamin Arthur Lupton <contact@balupton.com>

 History.js Core
 @author Benjamin Arthur Lupton <contact@balupton.com>
 @copyright 2010-2011 Benjamin Arthur Lupton <contact@balupton.com>
 @license New BSD License <http://creativecommons.org/licenses/BSD/>

 History.js HTML4 Support
 Depends on the HTML5 Support
 @author Benjamin Arthur Lupton <contact@balupton.com>
 @copyright 2010-2011 Benjamin Arthur Lupton <contact@balupton.com>
 @license New BSD License <http://creativecommons.org/licenses/BSD/>

 SWFObject v2.2 <http://code.google.com/p/swfobject/> is released under the MIT License <http://www.opensource.org/licenses/mit-license.php>.

 History.js Native Adapter
 @author Benjamin Arthur Lupton <contact@balupton.com>
 @copyright 2010-2011 Benjamin Arthur Lupton <contact@balupton.com>
 @license New BSD License <http://creativecommons.org/licenses/BSD/>

 parseUri 1.2.2.
 @author Steven Levithan <stevenlevithan.com>
 @license MIT License.
*/
(function (g, f) {
    var d = g.History = g.History || {};
    if (typeof d.Adapter !== "undefined") throw Error("History.js Adapter has already been loaded...");
    d.Adapter = {
        handlers: {},
        _uid: 1,
        uid: function (b) {
            return b._uid || (b._uid = d.Adapter._uid++)
        },
        bind: function (b, c, a) {
            var h = d.Adapter.uid(b);
            d.Adapter.handlers[h] = d.Adapter.handlers[h] || {};
            d.Adapter.handlers[h][c] = d.Adapter.handlers[h][c] || [];
            d.Adapter.handlers[h][c].push(a);
            b["on" + c] = function (a, b) {
                return function (c) {
                    d.Adapter.trigger(a, b, c)
                }
            }(b, c)
        },
        trigger: function (b,
        c, a) {
            var a = a || {}, b = d.Adapter.uid(b),
                h, i;
            d.Adapter.handlers[b] = d.Adapter.handlers[b] || {};
            d.Adapter.handlers[b][c] = d.Adapter.handlers[b][c] || [];
            for (h = 0, i = d.Adapter.handlers[b][c].length; h < i; ++h) d.Adapter.handlers[b][c][h].apply(this, [a])
        },
        extractEventData: function (b, c) {
            return c && c[b] || f
        },
        onDomLoad: function (b) {
            var c = g.setTimeout(function () {
                b()
            }, 2E3);
            g.onload = function () {
                clearTimeout(c);
                b()
            }
        }
    };
    typeof d.init !== "undefined" && d.init()
})(window);
(function (g, f) {
    var d = g.console || f,
        b = g.document,
        c = g.navigator,
        a = g.sessionStorage || !1,
        h = g.setTimeout,
        i = g.clearTimeout,
        l = g.setInterval,
        m = g.clearInterval,
        n = g.JSON,
        o = g.alert,
        k = g.History = g.History || {}, p = g.history;
    n.stringify = n.stringify || n.encode;
    n.parse = n.parse || n.decode;
    if (typeof k.init !== "undefined") throw Error("History.js Core has already been loaded...");
    k.init = function () {
        if (typeof k.Adapter === "undefined") return !1;
        typeof k.initCore !== "undefined" && k.initCore();
        typeof k.initHtml4 !== "undefined" && k.initHtml4();
        return !0
    };
    k.initCore = function () {
        if (typeof k.initCore.initialized !== "undefined") return !1;
        else k.initCore.initialized = !0;
        k.options = k.options || {};
        k.options.hashChangeInterval = k.options.hashChangeInterval || 100;
        k.options.safariPollInterval = k.options.safariPollInterval || 500;
        k.options.doubleCheckInterval = k.options.doubleCheckInterval || 500;
        k.options.storeInterval = k.options.storeInterval || 1E3;
        k.options.busyDelay = k.options.busyDelay || 250;
        k.options.debug = k.options.debug || !1;
        k.options.initialTitle = k.options.initialTitle || b.title;
        k.intervalList = [];
        k.clearAllIntervals = function () {
            var a, b = k.intervalList;
            if (typeof b !== "undefined" && b !== null) {
                for (a = 0; a < b.length; a++) m(b[a]);
                k.intervalList = null
            }
        };
        k.debug = function () {
            k.options.debug && k.log.apply(k, arguments)
        };
        k.log = function () {
            var a = !(typeof d === "undefined" || typeof d.log === "undefined" || typeof d.log.apply === "undefined"),
                c = b.getElementById("log"),
                h, i, l, f;
            a ? (i = Array.prototype.slice.call(arguments), h = i.shift(), typeof d.debug !== "undefined" ? d.debug.apply(d, [h, i]) : d.log.apply(d, [h,
            i])) : h = "\n" + arguments[0] + "\n";
            for (i = 1, l = arguments.length; i < l; ++i) {
                f = arguments[i];
                if (typeof f === "object" && typeof n !== "undefined") try {
                    f = n.stringify(f)
                } catch (m) {}
                h += "\n" + f + "\n"
            }
            c ? (c.value += h + "\n-----\n", c.scrollTop = c.scrollHeight - c.clientHeight) : a || o(h);
            return !0
        };
        k.getInternetExplorerMajorVersion = function () {
            return k.getInternetExplorerMajorVersion.cached = typeof k.getInternetExplorerMajorVersion.cached !== "undefined" ? k.getInternetExplorerMajorVersion.cached : function () {
                for (var a = 3, c = b.createElement("div"),
                h = c.getElementsByTagName("i");
                (c.innerHTML = "<\!--[if gt IE " + ++a + "]><i></i><![endif]--\>") && h[0];);
                return a > 4 ? a : !1
            }()
        };
        k.isInternetExplorer = function () {
            return k.isInternetExplorer.cached = typeof k.isInternetExplorer.cached !== "undefined" ? k.isInternetExplorer.cached : Boolean(k.getInternetExplorerMajorVersion())
        };
        k.emulated = {
            pushState: !Boolean(g.history && g.history.pushState && g.history.replaceState && !(/ Mobile\/([1-7][a-z]|(8([abcde]|f(1[0-8]))))/i.test(c.userAgent) || /AppleWebKit\/5([0-2]|3[0-2])/i.test(c.userAgent))),
            hashChange: Boolean(!("onhashchange" in g || "onhashchange" in b) || k.isInternetExplorer() && k.getInternetExplorerMajorVersion() < 8)
        };
        k.enabled = !k.emulated.pushState;
        k.bugs = {
            setHash: Boolean(!k.emulated.pushState && c.vendor === "Apple Computer, Inc." && /AppleWebKit\/5([0-2]|3[0-3])/.test(c.userAgent)),
            safariPoll: Boolean(!k.emulated.pushState && c.vendor === "Apple Computer, Inc." && /AppleWebKit\/5([0-2]|3[0-3])/.test(c.userAgent)),
            ieDoubleCheck: Boolean(k.isInternetExplorer() && k.getInternetExplorerMajorVersion() < 8),
            hashEscape: Boolean(k.isInternetExplorer() && k.getInternetExplorerMajorVersion() < 7)
        };
        k.isEmptyObject = function (a) {
            for (var b in a) return !1;
            return !0
        };
        k.cloneObject = function (a) {
            a ? (a = n.stringify(a), a = n.parse(a)) : a = {};
            return a
        };
        k.getRootUrl = function () {
            var a = b.location.protocol + "//" + (b.location.hostname || b.location.host);
            b.location.port && (a += ":" + b.location.port);
            a += "/";
            return a
        };
        k.getBaseHref = function () {
            var a = b.getElementsByTagName("base"),
                c = null,
                c = "";
            a.length === 1 && (c = a[0], c = c.href.replace(/[^\/]+$/, ""));
            (c = c.replace(/\/+$/, "")) && (c += "/");
            return c
        };
        k.getBaseUrl = function () {
            return k.getBaseHref() || k.getBasePageUrl() || k.getRootUrl()
        };
        k.getPageUrl = function () {
            return ((k.getState(!1, !1) || {}).url || b.location.href).replace(/\/+$/, "").replace(/[^\/]+$/, function (a) {
                return /\./.test(a) ? a : a + "/"
            })
        };
        k.getBasePageUrl = function () {
            return b.location.href.replace(/[#\?].*/, "").replace(/[^\/]+$/, function (a) {
                return /[^\/]$/.test(a) ? "" : a
            }).replace(/\/+$/, "") + "/"
        };
        k.getFullUrl = function (a, b) {
            var c = a,
                h = a.substring(0, 1),
                b = typeof b ===
                    "undefined" ? !0 : b;
            /[a-z]+\:\/\//.test(a) || (c = h === "/" ? k.getRootUrl() + a.replace(/^\/+/, "") : h === "#" ? k.getPageUrl().replace(/#.*/, "") + a : h === "?" ? k.getPageUrl().replace(/[\?#].*/, "") + a : b ? k.getBaseUrl() + a.replace(/^(\.\/)+/, "") : k.getBasePageUrl() + a.replace(/^(\.\/)+/, ""));
            return c.replace(/\#$/, "")
        };
        k.getShortUrl = function (a) {
            var b = k.getBaseUrl(),
                c = k.getRootUrl();
            k.emulated.pushState && (a = a.replace(b, ""));
            a = a.replace(c, "/");
            k.isTraditionalAnchor(a) && (a = "./" + a);
            return a = a.replace(/^(\.\/)+/g, "./").replace(/\#$/,
                "")
        };
        k.getLocationHref = function (a) {
            a = a || b;
            return a.URL === a.location.href ? a.location.href : a.location.href === decodeURIComponent(a.URL) ? a.URL : a.location.hash && decodeURIComponent(a.location.href.replace(/^[^#]+/, "")) === a.location.hash ? a.location.href : a.URL.indexOf("#") == -1 && a.location.href.indexOf("#") != -1 ? a.location.href : a.URL || a.location.href
        };
        k.store = {};
        k.idToState = k.idToState || {};
        k.stateToId = k.stateToId || {};
        k.urlToId = k.urlToId || {};
        k.storedStates = k.storedStates || [];
        k.savedStates = k.savedStates || [];
        k.normalizeStore = function () {
            k.store.idToState = k.store.idToState || {};
            k.store.urlToId = k.store.urlToId || {};
            k.store.stateToId = k.store.stateToId || {}
        };
        k.getState = function (a, b) {
            typeof a === "undefined" && (a = !0);
            typeof b === "undefined" && (b = !0);
            var c = k.getLastSavedState();
            !c && b && (c = k.createStateObject());
            if (a) c = k.cloneObject(c), c.url = c.cleanUrl || c.url;
            return c
        };
        k.getIdByState = function (a) {
            var b = k.extractId(a.url),
                c;
            if (!b) if (c = k.getStateString(a), typeof k.stateToId[c] !== "undefined") b = k.stateToId[c];
            else if (typeof k.store.stateToId[c] !==
                "undefined") b = k.store.stateToId[c];
            else {
                for (;;) if (b = (new Date).getTime() + String(Math.random()).replace(/\D/g, ""), typeof k.idToState[b] === "undefined" && typeof k.store.idToState[b] === "undefined") break;
                k.stateToId[c] = b;
                k.idToState[b] = a
            }
            return b
        };
        k.normalizeState = function (a) {
            var b;
            if (!a || typeof a !== "object") a = {};
            if (typeof a.normalized !== "undefined") return a;
            if (!a.data || typeof a.data !== "object") a.data = {};
            b = {
                normalized: !0
            };
            b.title = a.title || "";
            b.url = k.getFullUrl(a.url || k.getLocationHref());
            b.hash = k.getShortUrl(b.url);
            b.data = k.cloneObject(a.data);
            b.id = k.getIdByState(b);
            b.cleanUrl = b.url.replace(/\??\&_suid.*/, "");
            b.url = b.cleanUrl;
            a = !k.isEmptyObject(b.data);
            if (b.title || a) b.hash = k.getShortUrl(b.url).replace(/\??\&_suid.*/, ""), /\?/.test(b.hash) || (b.hash += "?"), b.hash += "&_suid=" + b.id;
            b.hashedUrl = k.getFullUrl(b.hash);
            if ((k.emulated.pushState || k.bugs.safariPoll) && k.hasUrlDuplicate(b)) b.url = b.hashedUrl;
            return b
        };
        k.createStateObject = function (a, b, c) {
            a = {
                data: a,
                title: b,
                url: c
            };
            return a = k.normalizeState(a)
        };
        k.getStateById = function (a) {
            a = String(a);
            return k.idToState[a] || k.store.idToState[a] || f
        };
        k.getStateString = function (a) {
            a = {
                data: k.normalizeState(a).data,
                title: a.title,
                url: a.url
            };
            return n.stringify(a)
        };
        k.getStateId = function (a) {
            return k.normalizeState(a).id
        };
        k.getHashByState = function (a) {
            return k.normalizeState(a).hash
        };
        k.extractId = function (a) {
            return ((a = /(.*)\&_suid=([0-9]+)$/.exec(a)) ? String(a[2] || "") : "") || !1
        };
        k.isTraditionalAnchor = function (a) {
            return !/[\/\?\.]/.test(a)
        };
        k.extractState = function (a, b) {
            var c = null,
                h, i, b = b || !1;
            (h = k.extractId(a)) && (c = k.getStateById(h));
            c || (i = k.getFullUrl(a), (h = k.getIdByUrl(i) || !1) && (c = k.getStateById(h)), !c && b && !k.isTraditionalAnchor(a) && (c = k.createStateObject(null, null, i)));
            return c
        };
        k.getIdByUrl = function (a) {
            return k.urlToId[a] || k.store.urlToId[a] || f
        };
        k.getLastSavedState = function () {
            return k.savedStates[k.savedStates.length - 1] || f
        };
        k.getLastStoredState = function () {
            return k.storedStates[k.storedStates.length - 1] || f
        };
        k.hasUrlDuplicate = function (a) {
            var b = !1;
            return b = (b = k.extractState(a.url)) && b.id !== a.id
        };
        k.storeState = function (a) {
            k.urlToId[a.url] = a.id;
            k.storedStates.push(k.cloneObject(a));
            return a
        };
        k.isLastSavedState = function (a) {
            var b = !1;
            if (k.savedStates.length) a = a.id, b = k.getLastSavedState(), b = b.id, b = a === b;
            return b
        };
        k.saveState = function (a) {
            if (k.isLastSavedState(a)) return !1;
            k.savedStates.push(k.cloneObject(a));
            return !0
        };
        k.getStateByIndex = function (a) {
            var b = null;
            return b = typeof a === "undefined" ? k.savedStates[k.savedStates.length - 1] : a < 0 ? k.savedStates[k.savedStates.length + a] : k.savedStates[a]
        };
        k.getHash = function () {
            return k.unescapeHash(b.location.hash)
        };
        k.unescapeString = function (a) {
            return a
        };
        k.unescapeHash = function (a) {
            a = k.normalizeHash(a);
            return a = decodeURI(a)
        };
        k.normalizeHash = function (a) {
            return a.replace(/[^#]*#/, "").replace(/#.*/, "")
        };
        k.setHash = function (a, c) {
            var h, i;
            if (c !== !1 && k.busy()) return k.pushQueue({
                scope: k,
                callback: k.setHash,
                args: arguments,
                queue: c
            }), !1;
            h = k.escapeHash(a);
            k.busy(!0);
            if ((i = k.extractState(a, !0)) && !k.emulated.pushState) k.pushState(i.data, i.title, i.url, !1);
            else if (b.location.hash !== h) k.bugs.setHash ? (i = k.getPageUrl(), k.pushState(null,
            null, i + "#" + h, !1)) : b.location.hash = h;
            return k
        };
        k.escapeHash = function (a) {
            a = k.normalizeHash(a);
            a = g.encodeURI(a);
            k.bugs.hashEscape || (a = a.replace(/\%21/g, "!").replace(/\%26/g, "&").replace(/\%3D/g, "=").replace(/\%3F/g, "?"));
            return a
        };
        k.getHashByUrl = function (a) {
            a = String(a).replace(/([^#]*)#?([^#]*)#?(.*)/, "$2");
            return a = k.unescapeHash(a)
        };
        k.setTitle = function (a) {
            var c = a.title,
                h;
            c || (h = k.getStateByIndex(0)) && h.url === a.url && (c = h.title || k.options.initialTitle);
            try {
                b.getElementsByTagName("title")[0].innerHTML = c.replace("<", "&lt;").replace(">", "&gt;").replace(" & ", " &amp; ")
            } catch (i) {}
            b.title = c;
            return k
        };
        k.queues = [];
        k.busy = function (a) {
            if (typeof a !== "undefined") k.busy.flag = a;
            else if (typeof k.busy.flag === "undefined") k.busy.flag = !1;
            if (!k.busy.flag) {
                i(k.busy.timeout);
                var b = function () {
                    var a, c;
                    if (!k.busy.flag) for (a = k.queues.length - 1; a >= 0; --a) if (c = k.queues[a], c.length !== 0) c = c.shift(), k.fireQueueItem(c), k.busy.timeout = h(b, k.options.busyDelay)
                };
                k.busy.timeout = h(b, k.options.busyDelay)
            }
            return k.busy.flag
        };
        k.busy.flag = !1;
        k.fireQueueItem = function (a) {
            return a.callback.apply(a.scope || k, a.args || [])
        };
        k.pushQueue = function (a) {
            k.queues[a.queue || 0] = k.queues[a.queue || 0] || [];
            k.queues[a.queue || 0].push(a);
            return k
        };
        k.queue = function (a, b) {
            typeof a === "function" && (a = {
                callback: a
            });
            if (typeof b !== "undefined") a.queue = b;
            k.busy() ? k.pushQueue(a) : k.fireQueueItem(a);
            return k
        };
        k.clearQueue = function () {
            k.busy.flag = !1;
            k.queues = [];
            return k
        };
        k.stateChanged = !1;
        k.doubleChecker = !1;
        k.doubleCheckComplete = function () {
            k.stateChanged = !0;
            k.doubleCheckClear();
            return k
        };
        k.doubleCheckClear = function () {
            if (k.doubleChecker) i(k.doubleChecker), k.doubleChecker = !1;
            return k
        };
        k.doubleCheck = function (a) {
            k.stateChanged = !1;
            k.doubleCheckClear();
            if (k.bugs.ieDoubleCheck) k.doubleChecker = h(function () {
                k.doubleCheckClear();
                k.stateChanged || a();
                return !0
            }, k.options.doubleCheckInterval);
            return k
        };
        k.safariStatePoll = function () {
            var a = k.extractState(b.location.href);
            if (!k.isLastSavedState(a)) return a || k.createStateObject(), k.Adapter.trigger(g, "popstate"), k
        };
        k.back = function (a) {
            if (a !== !1 && k.busy()) return k.pushQueue({
                scope: k,
                callback: k.back,
                args: arguments,
                queue: a
            }), !1;
            k.busy(!0);
            k.doubleCheck(function () {
                k.back(!1)
            });
            p.go(-1);
            return !0
        };
        k.forward = function (a) {
            if (a !== !1 && k.busy()) return k.pushQueue({
                scope: k,
                callback: k.forward,
                args: arguments,
                queue: a
            }), !1;
            k.busy(!0);
            k.doubleCheck(function () {
                k.forward(!1)
            });
            p.go(1);
            return !0
        };
        k.go = function (a, b) {
            var c;
            if (a > 0) for (c = 1; c <= a; ++c) k.forward(b);
            else if (a < 0) for (c = -1; c >= a; --c) k.back(b);
            else throw Error("History.go: History.go requires a positive or negative integer passed.");
            return k
        };
        if (k.emulated.pushState) {
            var q = function () {};
            k.pushState = k.pushState || q;
            k.replaceState = k.replaceState || q
        } else k.onPopState = function (a, c) {
            var h = !1,
                h = !1;
            k.doubleCheckComplete();
            if (h = k.getHash()) return (h = k.extractState(h || b.location.href, !0)) ? k.replaceState(h.data, h.title, h.url, !1) : (k.Adapter.trigger(g, "anchorchange"), k.busy(!1)), k.expectedStateId = !1;
            (h = (h = k.Adapter.extractEventData("state", a, c) || !1) ? k.getStateById(h) : k.expectedStateId ? k.getStateById(k.expectedStateId) : k.extractState(b.location.href)) || (h = k.createStateObject(null, null, b.location.href));
            k.expectedStateId = !1;
            if (k.isLastSavedState(h)) return k.busy(!1), !1;
            k.storeState(h);
            k.saveState(h);
            k.setTitle(h);
            k.Adapter.trigger(g, "statechange");
            k.busy(!1);
            return !0
        }, k.Adapter.bind(g, "popstate", k.onPopState), k.pushState = function (a, b, c, h) {
            if (k.getHashByUrl(c) && k.emulated.pushState) throw Error("History.js does not support states with fragement-identifiers (hashes/anchors).");
            if (h !== !1 && k.busy()) return k.pushQueue({
                scope: k,
                callback: k.pushState,
                args: arguments,
                queue: h
            }), !1;
            k.busy(!0);
            var i = k.createStateObject(a, b, c);
            k.isLastSavedState(i) ? k.busy(!1) : (k.storeState(i), k.expectedStateId = i.id, p.pushState(i.id, i.title, i.url), k.Adapter.trigger(g, "popstate"));
            return !0
        }, k.replaceState = function (a, b, c, h) {
            if (k.getHashByUrl(c) && k.emulated.pushState) throw Error("History.js does not support states with fragement-identifiers (hashes/anchors).");
            if (h !== !1 && k.busy()) return k.pushQueue({
                scope: k,
                callback: k.replaceState,
                args: arguments,
                queue: h
            }), !1;
            k.busy(!0);
            var i = k.createStateObject(a,
            b, c);
            k.isLastSavedState(i) ? k.busy(!1) : (k.storeState(i), k.expectedStateId = i.id, p.replaceState(i.id, i.title, i.url), k.Adapter.trigger(g, "popstate"));
            return !0
        };
        if (a) try {
            k.store = n.parse(a.getItem("History.store")) || {}
        } catch (s) {
            k.store = {}
        } else k.store = {};
        k.normalizeStore();
        k.Adapter.bind(g, "beforeunload", k.clearAllIntervals);
        k.Adapter.bind(g, "unload", k.clearAllIntervals);
        k.saveState(k.storeState(k.extractState(b.location.href, !0)));
        if (a) k.onUnload = function () {
            var b, c;
            try {
                b = n.parse(a.getItem("History.store")) || {}
            } catch (h) {
                b = {}
            }
            b.idToState = b.idToState || {};
            b.urlToId = b.urlToId || {};
            b.stateToId = b.stateToId || {};
            for (c in k.idToState) k.idToState.hasOwnProperty(c) && (b.idToState[c] = k.idToState[c]);
            for (c in k.urlToId) k.urlToId.hasOwnProperty(c) && (b.urlToId[c] = k.urlToId[c]);
            for (c in k.stateToId) k.stateToId.hasOwnProperty(c) && (b.stateToId[c] = k.stateToId[c]);
            k.store = b;
            k.normalizeStore();
            a.setItem("History.store", n.stringify(b))
        }, k.intervalList.push(l(k.onUnload, k.options.storeInterval)), k.Adapter.bind(g, "beforeunload",
        k.onUnload), k.Adapter.bind(g, "unload", k.onUnload);
        if (!k.emulated.pushState && (k.bugs.safariPoll && k.intervalList.push(l(k.safariStatePoll, k.options.safariPollInterval)), c.vendor === "Apple Computer, Inc." || (c.appCodeName || "") === "Mozilla")) if (k.Adapter.bind(g, "hashchange", function () {
            k.Adapter.trigger(g, "popstate")
        }), k.getHash()) k.Adapter.onDomLoad(function () {
            k.Adapter.trigger(g, "hashchange")
        })
    };
    k.init()
})(window);
(function (g) {
    var f = g.document,
        d = g.setInterval || d,
        b = g.History = g.History || {};
    if (typeof b.initHtml4 !== "undefined") throw Error("History.js HTML4 Support has already been loaded...");
    b.initHtml4 = function () {
        if (typeof b.initHtml4.initialized !== "undefined") return !1;
        else b.initHtml4.initialized = !0;
        b.enabled = !0;
        b.savedHashes = [];
        b.isLastHash = function (c) {
            var a = b.getHashByIndex();
            return c === a
        };
        b.saveHash = function (c) {
            if (b.isLastHash(c)) return !1;
            b.savedHashes.push(c);
            return !0
        };
        b.getHashByIndex = function (c) {
            var a = null;
            return a = typeof c === "undefined" ? b.savedHashes[b.savedHashes.length - 1] : c < 0 ? b.savedHashes[b.savedHashes.length + c] : b.savedHashes[c]
        };
        b.discardedHashes = {};
        b.discardedStates = {};
        b.discardState = function (c, a, h) {
            var i = b.getHashByState(c);
            b.discardedStates[i] = {
                discardedState: c,
                backState: h,
                forwardState: a
            };
            return !0
        };
        b.discardHash = function (c, a, h) {
            b.discardedHashes[c] = {
                discardedHash: c,
                backState: h,
                forwardState: a
            };
            return !0
        };
        b.discardedState = function (c) {
            c = b.getHashByState(c);
            return b.discardedStates[c] || !1
        };
        b.discardedHash = function (c) {
            return b.discardedHashes[c] || !1
        };
        b.recycleState = function (c) {
            var a = b.getHashByState(c);
            b.discardedState(c) && delete b.discardedStates[a];
            return !0
        };
        if (b.emulated.hashChange) b.hashChangeInit = function () {
            b.checkerFunction = null;
            var c = "",
                a, h, i;
            b.isInternetExplorer() ? (a = f.createElement("iframe"), a.setAttribute("id", "historyjs-iframe"), a.style.display = "none", f.body.appendChild(a), a.contentWindow.document.open(), a.contentWindow.document.close(), h = "", i = !1, b.checkerFunction = function () {
                if (i) return !1;
                i = !0;
                var l = b.getHash() || "",
                    d = b.unescapeHash(a.contentWindow.document.location.hash) || "";
                if (l !== c) {
                    c = l;
                    if (d !== l) h = l, a.contentWindow.document.open(), a.contentWindow.document.close(), a.contentWindow.document.location.hash = b.escapeHash(l);
                    b.Adapter.trigger(g, "hashchange")
                } else d !== h && (h = d, b.setHash(d, !1));
                i = !1;
                return !0
            }) : b.checkerFunction = function () {
                var a = b.getHash();
                a !== c && (c = a, b.Adapter.trigger(g, "hashchange"));
                return !0
            };
            b.intervalList.push(d(b.checkerFunction, b.options.hashChangeInterval));
            return !0
        },
        b.Adapter.onDomLoad(b.hashChangeInit);
        if (b.emulated.pushState) b.onHashChange = function (c) {
            var a = b.getHashByUrl(c && c.newURL || f.location.href),
                c = null;
            if (b.isLastHash(a)) return b.busy(!1), !1;
            b.doubleCheckComplete();
            b.saveHash(a);
            if (a && b.isTraditionalAnchor(a)) return b.Adapter.trigger(g, "anchorchange"), b.busy(!1), !1;
            c = b.extractState(b.getFullUrl(a || f.location.href, !1), !0);
            if (b.isLastSavedState(c)) return b.busy(!1), !1;
            b.getHashByState(c);
            if (a = b.discardedState(c)) return b.getHashByIndex(-2) === b.getHashByState(a.forwardState) ? b.back(!1) : b.forward(!1), !1;
            b.pushState(c.data, c.title, c.url, !1);
            return !0
        }, b.Adapter.bind(g, "hashchange", b.onHashChange), b.pushState = function (c, a, h, i) {
            if (b.getHashByUrl(h)) throw Error("History.js does not support states with fragement-identifiers (hashes/anchors).");
            if (i !== !1 && b.busy()) return b.pushQueue({
                scope: b,
                callback: b.pushState,
                args: arguments,
                queue: i
            }), !1;
            b.busy(!0);
            var l = b.createStateObject(c, a, h),
                d = b.getHashByState(l),
                n = b.getState(!1),
                n = b.getHashByState(n),
                o = b.getHash();
            b.storeState(l);
            b.expectedStateId = l.id;
            b.recycleState(l);
            b.setTitle(l);
            if (d === n) return b.busy(!1), !1;
            if (d !== o && d !== b.getShortUrl(f.location.href)) return b.setHash(d, !1), !1;
            b.saveState(l);
            b.Adapter.trigger(g, "statechange");
            b.busy(!1);
            return !0
        }, b.replaceState = function (c, a, h, i) {
            if (b.getHashByUrl(h)) throw Error("History.js does not support states with fragement-identifiers (hashes/anchors).");
            if (i !== !1 && b.busy()) return b.pushQueue({
                scope: b,
                callback: b.replaceState,
                args: arguments,
                queue: i
            }), !1;
            b.busy(!0);
            var l = b.createStateObject(c, a, h),
                d = b.getState(!1),
                f = b.getStateByIndex(-2);
            b.discardState(d, l, f);
            b.pushState(l.data, l.title, l.url, !1);
            return !0
        };
        if (b.emulated.pushState && b.getHash() && !b.emulated.hashChange) b.Adapter.onDomLoad(function () {
            b.Adapter.trigger(g, "hashchange")
        })
    };
    typeof b.init !== "undefined" && b.init()
})(window);
var swfobject = function () {
    function g() {
        if (!I) {
            try {
                var a = u.getElementsByTagName("body")[0].appendChild(u.createElement("span"));
                a.parentNode.removeChild(a)
            } catch (b) {
                return
            }
            I = !0;
            for (var a = G.length, c = 0; c < a; c++) G[c]()
        }
    }
    function f(a) {
        I ? a() : G[G.length] = a
    }
    function d(a) {
        if (typeof A.addEventListener != w) A.addEventListener("load", a, !1);
        else if (typeof u.addEventListener != w) u.addEventListener("load", a, !1);
        else if (typeof A.attachEvent != w) p(A, "onload", a);
        else if (typeof A.onload == "function") {
            var b = A.onload;
            A.onload = function () {
                b();
                a()
            }
        } else A.onload = a
    }
    function b() {
        var a = u.getElementsByTagName("body")[0],
            b = u.createElement(v);
        b.setAttribute("type", x);
        var h = a.appendChild(b);
        if (h) {
            var i = 0;
            (function () {
                if (typeof h.GetVariable != w) {
                    var l = h.GetVariable("$version");
                    if (l) l = l.split(" ")[1].split(","), B.pv = [parseInt(l[0], 10), parseInt(l[1], 10), parseInt(l[2], 10)]
                } else if (i < 10) {
                    i++;
                    setTimeout(arguments.callee, 10);
                    return
                }
                a.removeChild(b);
                h = null;
                c()
            })()
        } else c()
    }
    function c() {
        var b = F.length;
        if (b > 0) for (var c = 0; c < b; c++) {
            var d = F[c].id,
                f = F[c].callbackFn,
                m = {
                    success: !1,
                    id: d
                };
            if (B.pv[0] > 0) {
                var g = k(d);
                if (g) if (q(F[c].swfVersion) && !(B.wk && B.wk < 312)) {
                    if (t(d, !0), f) m.success = !0, m.ref = a(d), f(m)
                } else if (F[c].expressInstall && h()) {
                    m = {};
                    m.data = F[c].expressInstall;
                    m.width = g.getAttribute("width") || "0";
                    m.height = g.getAttribute("height") || "0";
                    if (g.getAttribute("class")) m.styleclass = g.getAttribute("class");
                    if (g.getAttribute("align")) m.align = g.getAttribute("align");
                    for (var n = {}, g = g.getElementsByTagName("param"), o = g.length, p = 0; p < o; p++) g[p].getAttribute("name").toLowerCase() !=
                        "movie" && (n[g[p].getAttribute("name")] = g[p].getAttribute("value"));
                    i(m, n, d, f)
                } else l(g), f && f(m)
            } else if (t(d, !0), f) {
                if ((d = a(d)) && typeof d.SetVariable != w) m.success = !0, m.ref = d;
                f(m)
            }
        }
    }
    function a(a) {
        var b = null;
        if ((a = k(a)) && a.nodeName == "OBJECT") typeof a.SetVariable != w ? b = a : (a = a.getElementsByTagName(v)[0]) && (b = a);
        return b
    }
    function h() {
        return !K && q("6.0.65") && (B.win || B.mac) && !(B.wk && B.wk < 312)
    }
    function i(a, b, c, h) {
        K = !0;
        z = h || null;
        O = {
            success: !1,
            id: c
        };
        var i = k(c);
        if (i) {
            i.nodeName == "OBJECT" ? (M = m(i), N = null) : (M = i, N = c);
            a.id = D;
            if (typeof a.width == w || !/%$/.test(a.width) && parseInt(a.width, 10) < 310) a.width = "310";
            if (typeof a.height == w || !/%$/.test(a.height) && parseInt(a.height, 10) < 137) a.height = "137";
            u.title = u.title.slice(0, 47) + " - Flash Player Installation";
            h = B.ie && B.win ? "ActiveX" : "PlugIn";
            h = "MMredirectURL=" + A.location.toString().replace(/&/g, "%26") + "&MMplayerType=" + h + "&MMdoctitle=" + u.title;
            typeof b.flashvars != w ? b.flashvars += "&" + h : b.flashvars = h;
            if (B.ie && B.win && i.readyState != 4) h = u.createElement("div"), c += "SWFObjectNew",
            h.setAttribute("id", c), i.parentNode.insertBefore(h, i), i.style.display = "none",
            function () {
                i.readyState == 4 ? i.parentNode.removeChild(i) : setTimeout(arguments.callee, 10)
            }();
            n(a, b, c)
        }
    }
    function l(a) {
        if (B.ie && B.win && a.readyState != 4) {
            var b = u.createElement("div");
            a.parentNode.insertBefore(b, a);
            b.parentNode.replaceChild(m(a), b);
            a.style.display = "none";
            (function () {
                a.readyState == 4 ? a.parentNode.removeChild(a) : setTimeout(arguments.callee, 10)
            })()
        } else a.parentNode.replaceChild(m(a), a)
    }
    function m(a) {
        var b = u.createElement("div");
        if (B.win && B.ie) b.innerHTML = a.innerHTML;
        else if (a = a.getElementsByTagName(v)[0]) if (a = a.childNodes) for (var c = a.length, h = 0; h < c; h++)!(a[h].nodeType == 1 && a[h].nodeName == "PARAM") && a[h].nodeType != 8 && b.appendChild(a[h].cloneNode(!0));
        return b
    }
    function n(a, b, c) {
        var h, i = k(c);
        if (B.wk && B.wk < 312) return h;
        if (i) {
            if (typeof a.id == w) a.id = c;
            if (B.ie && B.win) {
                var l = "",
                    d;
                for (d in a) if (a[d] != Object.prototype[d]) d.toLowerCase() == "data" ? b.movie = a[d] : d.toLowerCase() == "styleclass" ? l += ' class="' + a[d] + '"' : d.toLowerCase() != "classid" && (l += " " + d + '="' + a[d] + '"');
                d = "";
                for (var f in b) b[f] != Object.prototype[f] && (d += '<param name="' + f + '" value="' + b[f] + '" />');
                i.outerHTML = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"' + l + ">" + d + "</object>";
                H[H.length] = a.id;
                h = k(a.id)
            } else {
                f = u.createElement(v);
                f.setAttribute("type", x);
                for (var m in a) a[m] != Object.prototype[m] && (m.toLowerCase() == "styleclass" ? f.setAttribute("class", a[m]) : m.toLowerCase() != "classid" && f.setAttribute(m, a[m]));
                for (l in b) b[l] != Object.prototype[l] && l.toLowerCase() !=
                    "movie" && (a = f, d = l, m = b[l], c = u.createElement("param"), c.setAttribute("name", d), c.setAttribute("value", m), a.appendChild(c));
                i.parentNode.replaceChild(f, i);
                h = f
            }
        }
        return h
    }
    function o(a) {
        var b = k(a);
        if (b && b.nodeName == "OBJECT") B.ie && B.win ? (b.style.display = "none", function () {
            if (b.readyState == 4) {
                var c = k(a);
                if (c) {
                    for (var h in c) typeof c[h] == "function" && (c[h] = null);
                    c.parentNode.removeChild(c)
                }
            } else setTimeout(arguments.callee, 10)
        }()) : b.parentNode.removeChild(b)
    }
    function k(a) {
        var b = null;
        try {
            b = u.getElementById(a)
        } catch (c) {}
        return b
    }

    function p(a, b, c) {
        a.attachEvent(b, c);
        E[E.length] = [a, b, c]
    }
    function q(a) {
        var b = B.pv,
            a = a.split(".");
        a[0] = parseInt(a[0], 10);
        a[1] = parseInt(a[1], 10) || 0;
        a[2] = parseInt(a[2], 10) || 0;
        return b[0] > a[0] || b[0] == a[0] && b[1] > a[1] || b[0] == a[0] && b[1] == a[1] && b[2] >= a[2] ? !0 : !1
    }
    function s(a, b, c, h) {
        if (!B.ie || !B.mac) {
            var i = u.getElementsByTagName("head")[0];
            if (i) {
                c = c && typeof c == "string" ? c : "screen";
                h && (P = L = null);
                if (!L || P != c) h = u.createElement("style"), h.setAttribute("type", "text/css"), h.setAttribute("media", c), L = i.appendChild(h),
                B.ie && B.win && typeof u.styleSheets != w && u.styleSheets.length > 0 && (L = u.styleSheets[u.styleSheets.length - 1]), P = c;
                B.ie && B.win ? L && typeof L.addRule == v && L.addRule(a, b) : L && typeof u.createTextNode != w && L.appendChild(u.createTextNode(a + " {" + b + "}"))
            }
        }
    }
    function t(a, b) {
        if (Q) {
            var c = b ? "visible" : "hidden";
            I && k(a) ? k(a).style.visibility = c : s("#" + a, "visibility:" + c)
        }
    }
    function y(a) {
        return /[\\\"<>\.;]/.exec(a) != null && typeof encodeURIComponent != w ? encodeURIComponent(a) : a
    }
    var w = "undefined",
        v = "object",
        x = "application/x-shockwave-flash",
        D = "SWFObjectExprInst",
        A = window,
        u = document,
        C = navigator,
        J = !1,
        G = [function () {
            J ? b() : c()
        }],
        F = [],
        H = [],
        E = [],
        M, N, z, O, I = !1,
        K = !1,
        L, P, Q = !0,
        B = function () {
            var a = typeof u.getElementById != w && typeof u.getElementsByTagName != w && typeof u.createElement != w,
                b = C.userAgent.toLowerCase(),
                c = C.platform.toLowerCase(),
                h = c ? /win/.test(c) : /win/.test(b),
                c = c ? /mac/.test(c) : /mac/.test(b),
                b = /webkit/.test(b) ? parseFloat(b.replace(/^.*webkit\/(\d+(\.\d+)?).*$/, "$1")) : !1,
                i = !+"\u000b1",
                l = [0, 0, 0],
                d = null;
            if (typeof C.plugins != w && typeof C.plugins["Shockwave Flash"] == v) {
                if ((d = C.plugins["Shockwave Flash"].description) && !(typeof C.mimeTypes != w && C.mimeTypes[x] && !C.mimeTypes[x].enabledPlugin)) J = !0, i = !1, d = d.replace(/^.*\s+(\S+\s+\S+$)/, "$1"), l[0] = parseInt(d.replace(/^(.*)\..*$/, "$1"), 10), l[1] = parseInt(d.replace(/^.*\.(.*)\s.*$/, "$1"), 10), l[2] = /[a-zA-Z]/.test(d) ? parseInt(d.replace(/^.*[a-zA-Z]+(.*)$/, "$1"), 10) : 0
            } else if (typeof A.ActiveXObject != w) try {
                var f = new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
                if (f && (d = f.GetVariable("$version"))) i = !0, d = d.split(" ")[1].split(","),
                l = [parseInt(d[0], 10), parseInt(d[1], 10), parseInt(d[2], 10)]
            } catch (m) {}
            return {
                w3: a,
                pv: l,
                wk: b,
                ie: i,
                win: h,
                mac: c
            }
        }();
    (function () {
        B.w3 && ((typeof u.readyState != w && u.readyState == "complete" || typeof u.readyState == w && (u.getElementsByTagName("body")[0] || u.body)) && g(), I || (typeof u.addEventListener != w && u.addEventListener("DOMContentLoaded", g, !1), B.ie && B.win && (u.attachEvent("onreadystatechange", function () {
            u.readyState == "complete" && (u.detachEvent("onreadystatechange", arguments.callee), g())
        }), A == top && function () {
            if (!I) {
                try {
                    u.documentElement.doScroll("left")
                } catch (a) {
                    setTimeout(arguments.callee,
                    0);
                    return
                }
                g()
            }
        }()), B.wk && function () {
            I || (/loaded|complete/.test(u.readyState) ? g() : setTimeout(arguments.callee, 0))
        }(), d(g)))
    })();
    (function () {
        B.ie && B.win && window.attachEvent("onunload", function () {
            for (var a = E.length, b = 0; b < a; b++) E[b][0].detachEvent(E[b][1], E[b][2]);
            a = H.length;
            for (b = 0; b < a; b++) o(H[b]);
            for (var c in B) B[c] = null;
            B = null;
            for (var h in swfobject) swfobject[h] = null;
            swfobject = null
        })
    })();
    return {
        registerObject: function (a, b, c, h) {
            if (B.w3 && a && b) {
                var i = {};
                i.id = a;
                i.swfVersion = b;
                i.expressInstall = c;
                i.callbackFn = h;
                F[F.length] = i;
                t(a, !1)
            } else h && h({
                success: !1,
                id: a
            })
        },
        getObjectById: function (b) {
            if (B.w3) return a(b)
        },
        embedSWF: function (a, b, c, l, d, m, g, k, o, p) {
            var s = {
                success: !1,
                id: b
            };
            B.w3 && !(B.wk && B.wk < 312) && a && b && c && l && d ? (t(b, !1), f(function () {
                c += "";
                l += "";
                var f = {};
                if (o && typeof o === v) for (var y in o) f[y] = o[y];
                f.data = a;
                f.width = c;
                f.height = l;
                y = {};
                if (k && typeof k === v) for (var u in k) y[u] = k[u];
                if (g && typeof g === v) for (var x in g) typeof y.flashvars != w ? y.flashvars += "&" + x + "=" + g[x] : y.flashvars = x + "=" + g[x];
                if (q(d)) u = n(f, y, b), f.id == b && t(b, !0), s.success = !0, s.ref = u;
                else if (m && h()) {
                    f.data = m;
                    i(f, y, b, p);
                    return
                } else t(b, !0);
                p && p(s)
            })) : p && p(s)
        },
        switchOffAutoHideShow: function () {
            Q = !1
        },
        ua: B,
        getFlashPlayerVersion: function () {
            return {
                major: B.pv[0],
                minor: B.pv[1],
                release: B.pv[2]
            }
        },
        hasFlashPlayerVersion: q,
        createSWF: function (a, b, c) {
            if (B.w3) return n(a, b, c)
        },
        showExpressInstall: function (a, b, c, l) {
            B.w3 && h() && i(a, b, c, l)
        },
        removeSWF: function (a) {
            B.w3 && o(a)
        },
        createCSS: function (a, b, c, h) {
            B.w3 && s(a, b, c, h)
        },
        addDomLoadEvent: f,
        addLoadEvent: d,
        getQueryParamValue: function (a) {
            var b = u.location.search || u.location.hash;
            if (b) {
                /\?/.test(b) && (b = b.split("?")[1]);
                if (a == null) return y(b);
                for (var b = b.split("&"), c = 0; c < b.length; c++) if (b[c].substring(0, b[c].indexOf("=")) == a) return y(b[c].substring(b[c].indexOf("=") + 1))
            }
            return ""
        },
        expressInstallCallback: function () {
            if (K) {
                var a = k(D);
                if (a && M) {
                    a.parentNode.replaceChild(M, a);
                    if (N && (t(N, !0), B.ie && B.win)) M.style.display = "block";
                    z && z(O)
                }
                K = !1
            }
        }
    }
}(),
    Spotify = Spotify || {};
Spotify.Cache = Spotify.Cache || {};
Spotify.Logging = Spotify.Logging || {};
Spotify.App = Spotify.App || {};
Spotify.Utils = Spotify.Utils || {};
Spotify.Flash = Spotify.Flash || {};
Spotify.Services = Spotify.Services || {};
Spotify.WebSockets = Spotify.WebSockets || {};
Spotify.Protobuf = Spotify.Protobuf || {};
Spotify.Hermes = Spotify.Hermes || {};
Spotify.Parsers = Spotify.Parsers || {};
Spotify.Models = Spotify.Models || {};
Spotify.HTML5 = Spotify.HTML5 || {};
Spotify.Audio = Spotify.Audio || {};
Spotify.Proto = Spotify.Proto || {};
Spotify.Errors = Spotify.Errors || {};
Spotify.Errors.Domains = Spotify.Errors.Domains || {};
Spotify.Errors.Codes = Spotify.Errors.Codes || {};
DebuggerJS = Spotify.DebuggerJS = new function () {
    this.Parsers = {};
    this.Loggers = {};
    this.Parsers = {};
    this.Utils = {
        isArray: Array.isArray || function (d) {
            return Object.prototype.toString.call(d) == "[object Array]"
        }
    };
    var g = {}, f = {};
    this.register = function (d, b, c) {
        if (typeof d !== "string" || typeof b === "undefined" || b === null) throw Error("Not valid arguments");
        g[d] || (g[d] = b);
        f[d] || (f[d] = c || new DebuggerJS.Parsers.Console);
        return !0
    };
    this.log = function () {};
    this.warn = function () {};
    this.error = function () {};
    this.on = function (d, b) {
        if (typeof d !==
            "undefined" && !DebuggerJS.Utils.isArray(d) && d !== null) throw Error("The modules argument should be an array");
        if (typeof b !== "undefined" && !DebuggerJS.Utils.isArray(b) && b !== null) throw Error("The tags argument should be an array");
    };
    this.off = function () {}
};
DebuggerJS.Parsers.Default = function () {
    this.parse = function (g, f, d) {
        g += " |";
        return [g].concat(f).concat("| Tag: " + d)
    }
};
DebuggerJS.Loggers.Console = function () {
    this.log = function () {
        console.log.apply(console, arguments);
        return !0
    };
    this.error = function () {
        console.error.apply(console, arguments);
        return !0
    };
    this.warn = function () {
        console.warn.apply(console, arguments);
        return !0
    }
};
DebuggerJS.Loggers.Memory = function () {
    this.log = function () {
        return !0
    };
    this.error = function () {
        return !0
    };
    this.warn = function () {
        return !0
    }
};
Spotify.Errors.Domains.HERMES_ERROR = 13;
Spotify.Errors.Domains.HERMES_SERVICE_ERROR = 14;
Spotify.Errors.Codes.HM_TOO_MANY_REQUESTS = 429;
Spotify.Errors.Codes.HM_TIMEOUT = 408;
Spotify.Errors.Codes.HM_FAILED_TO_SEND_TO_BACKEND = 1;
Spotify.Errors.Domains.TRACK_ERROR = 12;
Spotify.Errors.Codes.TRACK_REQUEST_RATE_LIMITED = 8;
Spotify.Errors.Error = function (g) {
    g = g || [];
    this.domain = g[0] || 0;
    this.code = g[1] || 0;
    this.description = g[2] || "";
    this.data = g[3] || null
};
Spotify.RateLimiter = function (g, f) {
    Spotify.EventTarget.call(this);
    var d = this,
        b = !1,
        c = [],
        a = new Spotify.Events,
        h = 0;
    this.totalPendingRequests = function () {
        return c.length
    };
    this.getItemAtIndex = function (a) {
        return c[a]
    };
    this.addToBucket = function (a, b) {
        typeof b === "undefined" && (b = !0);
        typeof a !== "undefined" && (b ? c.push(a) : c[0] = a)
    };
    this.start = function () {
        b || (b = !0, clearInterval(h), h = setInterval(i, g))
    };
    var i = function () {
        var i = 0,
            m, g = f;
        if (f > c.length) g = c.length;
        for (; i < g; i++) m = c.shift(), d.trigger(a.RATE_LIMIT_CALL, m);
        c.length === 0 && (b = !1, clearInterval(h), d.trigger(a.RATE_LIMIT_DISABLED))
    }
};
Spotify.CallsManager = function () {
    var g = 0,
        f = {}, d = [0];
    this.addCall = function (b, c, a, h, i, l, d, n) {
        var o = (new Date).getTime();
        g++;
        f[g] = {
            method: b,
            params: c,
            callback: a,
            errback: h,
            context: i,
            persistent: l,
            retries: typeof d === "undefined" ? 2 : d,
            timestamp: o,
            callType: n
        };
        return g
    };
    this.getCall = function (b, c) {
        typeof c === "undefined" && (c = !0);
        if (typeof f[b] !== void 0) {
            var a = f[b];
            c && delete f[b];
            return a
        }
    };
    this.getCalls = function () {
        var b, c, a = [];
        for (c in f) b = c, b = this.getCall(b), b.retries > 0 && a.push(b);
        return a
    };
    this.getPersistentCalls = function () {
        for (var b = 0, c = d.length, a, h = []; b < c; b++) d[b] !== null && d[b] !== 0 && (a = d[b], h.push(this.getCall(a)));
        d = [0];
        return h
    };
    this.setPersistent = function (b, c) {
        c === !0 ? d.push(b) : d[0] = b
    }
};
Spotify.ConnectionManager = function () {
    Spotify.EventTarget.call(this);
    var g = this,
        f = 0,
        d, b = new Spotify.Events,
        c, a = function () {
            g.trigger(b.ON_TRY_TO_CONNECT)
        }, h = function () {
            f = 0;
            typeof d !== "undefined" && clearTimeout(d)
        };
    this.reset = function () {
        typeof d !== "undefined" && clearTimeout(d);
        f = 0;
        d = setTimeout(a, 0)
    };
    var i = function () {
        var c = Math.pow(2, f) * 1E3;
        f % 4 === 0 && f !== 0 && g.trigger(b.NOTIFY_OF_DISCONNECT);
        c > 3E4 && (c = 3E4);
        f++;
        d && clearTimeout(d);
        c === 1E3 && (c = 0);
        d = setTimeout(a, c)
    };
    this.initialize = function (a) {
        c = a;
        c.bind(b.CONNECTION_ESTABLISHED,
        h, this);
        c.bind(b.FAILED_CONNECTING, i, this)
    }
};
Spotify.CodeValidator = function () {
    Spotify.EventTarget.call(this);
    var g = this,
        f, d, b = new Spotify.Events,
        c = function (a) {
            eval(a.params)
        }, a = function () {}, h = function () {};
    this.reply = function () {
        var b = Array.prototype.slice.call(arguments);
        f.rpc("work_done", b, h, a, g, !1, 0, "work_done")
    };
    this.initialize = function (a, h) {
        f = a;
        d = h;
        d.bind(b.WORK, c, this)
    }
};
(function () {
    Spotify.LinkedList = function () {
        this.length = 0;
        this.last = this.first = null
    };
    Spotify.LinkedList.prototype.append = function (g) {
        if (g === null) throw Error("Node is null!");
        if (g.list !== null) throw Error("Node already exists in another list!");
        g.list = this;
        this.first === null ? this.first = g : (g.prev = this.last, g.next = null, this.last.next = g);
        this.last = g;
        this.length++
    };
    Spotify.LinkedList.prototype.insertAfter = function (g, f) {
        if (g === null || f === null) throw Error("Node is null!");
        if (f.list !== null) throw Error("Node already exists in another list!");
        f.list = this;
        f.prev = g;
        f.next = g.next;
        g.next.prev = f;
        g.next = f;
        if (f.prev === this.last) this.last = f;
        this.length++
    };
    Spotify.LinkedList.prototype.remove = function (g) {
        if (g === null) throw Error("Node is null!");
        if (this.length == 0 || g.list !== this) return !1;
        else if (this.length > 1) {
            if (g.prev !== null) g.prev.next = g.next;
            if (g.next !== null) g.next.prev = g.prev;
            if (g === this.first) this.first = g.next;
            else if (g === this.last) this.last = g.prev
        } else this.last = this.first = null;
        delete g.list;
        delete g.prev;
        delete g.next;
        g.list = null;
        g.prev = null;
        g.next = null;
        this.length--;
        return !0
    };
    Spotify.LinkedList.Node = function (g) {
        this.next = this.prev = this.list = null;
        this.value = g || null
    }
})();
(function () {
    Spotify.SimpleCache = function (g) {
        this._limit = g || 100;
        this._map = {};
        this._lru = new Spotify.LinkedList;
        this._stats = {
            hits: 0,
            misses: 0
        }
    };
    Spotify.SimpleCache.prototype.get = function (g) {
        if (g = this._map[g]) return this._lru.remove(g), this._lru.append(g), this._stats.hits++, g.value;
        this._stats.misses++;
        return null
    };
    Spotify.SimpleCache.prototype.put = function (g, f) {
        if (typeof g == "undefined" || g == null || g == "") throw Error("Cache key can't be empty!");
        this._lru.length >= this._limit && (delete this._map[this._lru.first.key],
        this._lru.remove(this._lru.first));
        var d = this._map[g];
        d ? (this._lru.remove(d), d.value = f) : (d = new Spotify.LinkedList.Node(f), d.key = g);
        this._lru.append(d);
        this._map[g] = d
    };
    Spotify.SimpleCache.prototype.remove = function (g) {
        var f = this._map[g];
        return f ? (this._lru.remove(f), delete this._map[g], f.value) : null
    };
    Spotify.SimpleCache.prototype.removeAllStartingWith = function (g) {
        var f, d = [],
            b;
        for (b in this._map) if (b.indexOf(g) === 0 && (f = this._map[b])) this._lru.remove(f), delete this._map[b], d.push(b);
        return d
    };
    Spotify.SimpleCache.prototype.size = function () {
        return this._lru.length
    };
    Spotify.SimpleCache.prototype.clear = function () {
        this._lru = new Spotify.LinkedList;
        this._map = {}
    }
})();
Spotify.Cache.PackageStore = function (g) {
    var f = function (a) {
        return a
    }, d = function (a) {
        return a
    }, b = "PackageStore",
        c = function () {
            var a = {};
            window.localStorage.getItem(b) !== null && (a = JSON.parse(d(window.localStorage.getItem(b))));
            return a
        };
    if (typeof g !== "undefined") typeof g.storageKey !== "undefined" && (b = g.storageKey), typeof g.encrypt === "function" && (f = g.encrypt), typeof g.decrypt === "function" && (d = g.decrypt);
    this.setItem = function (a, h) {
        var i = c();
        i[a] = h;
        return window.localStorage.setItem(b, f(JSON.stringify(i)))
    };
    this.getItem = function (a) {
        var b = c();
        return typeof b[a] === "undefined" ? null : b[a]
    };
    this.removeItem = function (a) {
        var h = c();
        delete h[a];
        return window.localStorage.setItem(b, f(JSON.stringify(h)))
    };
    this.clear = function () {
        return window.localStorage.removeItem(b)
    };
    this.length = function () {
        var a = c(),
            b = 0,
            i;
        for (i in a) a.hasOwnProperty(i) && (b += 1);
        return b
    };
    this.key = function (a) {
        var b = c(),
            i = 0,
            l;
        for (l in b) if (b.hasOwnProperty(l)) {
            if (i === a) return l;
            i += 1
        }
        return null
    }
};
Spotify.Cache.Default = function (g, f) {
    this._limit = g || 100;
    this._storage = f || new Spotify.Cache.MemoryStorage;
    this._keyToNode = {};
    this._lru = new Spotify.LinkedList;
    this._stats = {
        hits: 0,
        misses: 0
    };
    this.initialize = function (d, b, c) {
        if (!Spotify.Utils.isFunction(d) || !Spotify.Utils.isFunction(b)) throw new TypeError("Argument is not a function!");
        var a = function (a, b) {
            var c = new Spotify.LinkedList.Node(b);
            c.key = a;
            this._lru.append(c);
            this._keyToNode[a] = c
        }, h = function () {
            d.call(c, this)
        };
        this._storage.initialize(function () {
            this._storage.each(a,
            h, this)
        }, b, this)
    };
    this.get = function (d, b, c) {
        if (!Spotify.Utils.isFunction(b)) throw new TypeError("Argument is not a function!");
        this._storage.get(d, function (a, h) {
            var i = this._keyToNode[a] || null;
            h !== null && i !== null ? (this._lru.remove(i), this._lru.append(i), this._stats.hits++, b.call(c, a, h)) : (this._stats.misses++, b.call(c, a, null))
        }, this)
    };
    this.put = function (d, b, c, a, h, i) {
        if (typeof d == "undefined" || d == null || d == "") throw Error("Cache key can't be empty!");
        var l = function (d, f, g) {
            if (f === null) if (Spotify.Utils.isFunction(h) && h.call(i, g), f = Math.floor(this._lru.length * 0.9), f == 0) a.call(i, d, null);
            else {
                for (; this._lru.length > f;) this._storage.remove(this._lru.first.key), this._lru.remove(this._lru.first);
                this._storage.set(d, b, l, this)
            } else Spotify.Utils.isFunction(c) && c.call(i, d, f)
        };
        this._lru.length >= this._limit && (this._storage.remove(this._lru.first.key), this._lru.remove(this._lru.first));
        this._storage.get(d, function (a, c) {
            var h = this._keyToNode[a] || null;
            c !== null && h !== null ? (this._lru.remove(h), h.value = b) : (h = new Spotify.LinkedList.Node(b),
            h.key = a);
            this._lru.append(h);
            this._keyToNode[a] = h;
            this._storage.set(a, b, l, this)
        }, this)
    };
    this.remove = function (d, b, c) {
        this._storage.get(d, function (a, h) {
            var i = this._keyToNode[a] || null;
            h !== null && i !== null ? (this._lru.remove(i), this._storage.remove(a, b, c)) : Spotify.Utils.isFunction(b) && b.call(c, a)
        }, this)
    };
    this.removeAllStartingWith = function (d, b, c) {
        this._storage.removeAllStartingWith(d, function (a) {
            for (var h = 0; h < a.length; h++) {
                var i = this._keyToNode[a[h]] || null;
                i !== null && this._lru.remove(i)
            }
            Spotify.Utils.isFunction(b) && b.call(c, a)
        }, this)
    };
    this.size = function () {
        return this._lru.length
    };
    this.clear = function (d, b) {
        this._lru = new Spotify.LinkedList;
        this._storage.clear(d, b)
    }
};
Spotify.Cache.DummyStorage = function () {
    this.initialize = function (g, f, d) {
        if (!Spotify.Utils.isFunction(g) || !Spotify.Utils.isFunction(f)) throw new TypeError("Argument is not a function!");
        f.call(d)
    };
    this.isSupported = function () {
        return !0
    }
};
Spotify.Cache.MemoryStorage = function () {
    this._data = {};
    this.get = function (g, f, d) {
        if (!Spotify.Utils.isFunction(f)) throw new TypeError(ERROR_NOT_A_FUNCTION);
        f.call(d, g, this._data[g] || null)
    };
    this.set = function (g, f, d, b) {
        this._data[g] = f;
        Spotify.Utils.isFunction(d) && d.call(b, g, f)
    };
    this.remove = function (g, f, d) {
        delete this._data[g];
        Spotify.Utils.isFunction(f) && f.call(d, g)
    };
    this.removeAllStartingWith = function (g, f, d) {
        var b = [],
            c = this._data,
            a;
        for (a in c) a.indexOf(g) === 0 && (b.push(a), delete this._data[a]);
        Spotify.Utils.isFunction(f) && f.call(d, b)
    };
    this.clear = function (g, f) {
        this._data = {};
        Spotify.Utils.isFunction(g) && g.call(f)
    };
    this.each = function (g, f, d) {
        if (!Spotify.Utils.isFunction(g)) throw new TypeError(ERROR_NOT_A_FUNCTION);
        var b = this._data,
            c;
        for (c in b) g.call(d, c, b[c]);
        Spotify.Utils.isFunction(f) && f.call(d)
    };
    this.initialize = function (g, f, d) {
        if (!Spotify.Utils.isFunction(g) || !Spotify.Utils.isFunction(f)) throw new TypeError(ERROR_NOT_A_FUNCTION);
        g.call(d)
    };
    this.isSupported = function () {
        return !0
    }
};
Spotify.Cache.LocalStorage = function (g) {
    this._prefix = "com.spotify.cache." + (g || "generic") + ".";
    this.get = function (f, d, b) {
        if (!Spotify.Utils.isFunction(d)) throw new TypeError("Argument is not a function!");
        var c = window.localStorage.getItem(this._prefix + f);
        d.call(b, f, c ? JSON.parse(c) : null)
    };
    this.set = function (f, d, b, c) {
        try {
            window.localStorage.setItem(this._prefix + f, JSON.stringify(d)), Spotify.Utils.isFunction(b) && b.call(c, f, d)
        } catch (a) {
            Spotify.Utils.isFunction(b) && b.call(c, f, null, a)
        }
    };
    this.remove = function (f,
    d, b) {
        window.localStorage.removeItem(this._prefix + f);
        Spotify.Utils.isFunction(d) && d.call(b, f)
    };
    this.removeAllStartingWith = function (f, d, b) {
        for (var c = [], a = window.localStorage, f = this._prefix + f, h, i = 0, l = a.length; i < l; i++) h = a.key(i), h.indexOf(f) === 0 && (c.push(h.substring(this._prefix.length)), a.removeItem(h), i--, l--);
        Spotify.Utils.isFunction(d) && d.call(b, c)
    };
    this.clear = function (f, d) {
        for (var b = window.localStorage.length - 1; b >= 0; --b) {
            var c = window.localStorage.key(b);
            c.indexOf(this._prefix) == 0 && window.localStorage.removeItem(c)
        }
        Spotify.Utils.isFunction(f) && f.call(d)
    };
    this.each = function (f, d, b) {
        if (!Spotify.Utils.isFunction(f)) throw new TypeError("Argument is not a function!");
        for (var c = 0, a = window.localStorage.length; c < a; ++c) {
            var h = window.localStorage.key(c);
            if (h.indexOf(this._prefix) == 0) {
                var i = window.localStorage.getItem(h);
                f.call(b, h.slice(this._prefix.length), i ? JSON.parse(i) : null)
            }
        }
        Spotify.Utils.isFunction(d) && d.call(b)
    };
    this.initialize = function (f, d, b) {
        if (!Spotify.Utils.isFunction(f) || !Spotify.Utils.isFunction(d)) throw new TypeError("Argument is not a function!");
        f.call(b)
    };
    this.isSupported = function () {
        return typeof window.localStorage !== "undefined"
    }
};
Spotify.Cache.IndexedDBStorage = function (g) {
    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;
    window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;
    var f = null,
        d = function (b, a, h, i, l) {
            var d = window.indexedDB.open(b, a);
            d.onsuccess = function (d) {
                var f = d.target.result;
                Spotify.Utils.isFunction(f.setVersion) ? (d = parseInt(f.version || "0", 10), d < a ? (d = f.setVersion(a.toString()), d.onsuccess = function () {
                    f.objectStoreNames.contains(b) || f.createObjectStore(b);
                    h.call(l, f)
                }, d.onerror = function () {
                    i.call(l)
                }) : d == a ? h.call(l, f) : i.call(l)) : h.call(l, f)
            };
            d.onerror = function () {
                i.call()
            };
            d.onupgradeneeded = function (a) {
                a = a.target.result;
                a.objectStoreNames.contains(b) || a.createObjectStore(b)
            }
        }, b = function (b, a) {
            return function (h) {
                f = h;
                b.call(a)
            }
        };
    this._open = function (c, a, h) {
        d(g, 1, b(c, h), a)
    };
    this._transaction = function (b) {
        return f.transaction(g, b).objectStore(g)
    };
    this.get = function (b, a, h) {
        if (!Spotify.Utils.isFunction(a)) throw new TypeError(ERROR_NOT_A_FUNCTION);
        var i = this._transaction("readonly").get(b);
        i.onsuccess = function (i) {
            a.call(h, b, i.target.result)
        };
        i.onerror = function (i) {
            a.call(h, b, null, i.target.errorCode)
        }
    };
    this.set = function (b, a, h, i) {
        var l = this._transaction("readwrite").put(a, b);
        if (Spotify.Utils.isFunction(h)) l.onsuccess = function () {
            h.call(i, b, a)
        }, l.onerror = function (a) {
            h.call(i, b, null, a.target.errorCode)
        }
    };
    this.remove = function (b, a, h) {
        var i = this._transaction("readwrite")["delete"](b);
        if (Spotify.Utils.isFunction(a)) i.onsuccess = function () {
            a.call(h, b)
        },
        i.onerror = function () {
            a.call(h, null, e.target.errorCode)
        }
    };
    this.removeAllStartingWith = function (b, a, h) {
        var i = [],
            l = IDBKeyRange.bound(b, b + "\uffff", !1, !1);
        this._transaction(IDBTransaction.READ_WRITE).openCursor(l).onsuccess = function (l) {
            (l = l.target.result) ? (l.key.indexOf(b) === 0 && (i.push(l.key), l["delete"]()), l["continue"]()) : Spotify.Utils.isFunction(a) && a.call(h, i)
        }
    };
    this.clear = function (b, a) {
        var h = this._transaction("readwrite").clear();
        if (Spotify.Utils.isFunction(b)) h.onsuccess = function () {
            b.call(a)
        }, h.onerror = function () {
            b.call(a)
        }
    };
    this.each = function (b, a, h) {
        if (!Spotify.Utils.isFunction(b)) throw new TypeError(ERROR_NOT_A_FUNCTION);
        this._transaction("readonly").openCursor().onsuccess = function (i) {
            (i = i.target.result) ? (b.call(h, i.key, i.value), i["continue"]()) : Spotify.Utils.isFunction(a) && a.call(h)
        }
    };
    this.initialize = function (b, a, h) {
        if (!Spotify.Utils.isFunction(b) || !Spotify.Utils.isFunction(a)) throw new TypeError(ERROR_NOT_A_FUNCTION);
        this._open(b, a, h)
    };
    this.isSupported = function () {
        return typeof window.indexedDB !==
            "undefined" || typeof window.mozIndexedDB !== "undefined" || typeof window.webkitIndexedDB !== "undefined" || typeof window.msIndexedDB !== "undefined"
    }
};
Spotify.Cache.FileSystemStorage = function () {
    throw Error("Not implemented!");
};
Spotify.Cache.Types = {
    PERSISTENT: "persistent",
    TEMPORARY: "temporary"
};
(function () {
    var g;
    Spotify.Events = function () {
        return typeof g !== "undefined" ? g : g = {
            DATA_ERROR: "DATA_ERROR",
            TRACK_PLAY_REQUEST: "TRACK_PLAY_REQUEST",
            WAIT_FOR_COMMERCIAL_TO_FINISH: "WAIT_FOR_COMMERCIAL_TO_FINISH",
            INTERCEPTED: "intercepted",
            USER_INFO_CHANGE: "USER_INFO_CHANGE",
            TRACK_ENDED: "TRACK_ENDED",
            PLAYER_STATE: "PLAYER_STATE",
            BEFORE_END: "BEFORE_END",
            LOAD: "LOAD",
            SONG_LOADED: "SONG_LOADED",
            FIRST_BYTES: "FIRST_BYTES",
            POSITION_CHANGED: "POSITION_CHANGED",
            VOLUME_CHANGED: "VOLUME_CHANGED",
            PLAYING: "PLAYING",
            PAUSED: "PAUSED",
            STOPPED: "STOPPED",
            ACTIVE_PLAYER_CHANGED: "ACTIVE_PLAYER_CHANGED",
            CONNECTION_ESTABLISHED: "CONNECTION_ESTABLISHED",
            CONNECTION_CLOSED: "CONNECTION_CLOSED",
            CONNECTED: "CONNECTED",
            DISCONNECTED: "DISCONNECTED",
            STREAM_INITIALIZED: "STREAM_INITIALIZED",
            PLAYER_LOADED: "PLAYER_LOADED",
            PLAYER_EVENT: "PLAYER_EVENT",
            STREAM_LIMIT_REACHED: "STREAM_LIMIT_REACHED",
            AUTHENTICATED: "AUTHENTICATED",
            ERROR: "ERROR",
            SUCCESS: "SUCCESS",
            FAILED_CONNECTING: "FAILED_CONNECTING",
            INVALID_TRACK_URI: "INVALID_TRACK_URI",
            CANNOT_PLAY_TRACK: "CANNOT_PLAY_TRACK",
            INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
            REGION_BLOCKED: "REGION_BLOCKED",
            ACCOUNT_IN_USE: "ACCOUNT_IN_USE",
            PLAYBACK_FAILED: "PLAYBACK_FAILED",
            SECURITY_ERROR: "SECURITY_ERROR",
            UNKNOWN_ERROR: "UNKNOWN_ERROR",
            RPC_CALLBACK: "RPC_CALLBACK",
            RPC_ERRBACK: "RPC_ERRBACK",
            RPC_LOGGING_LATENCY_CALLBACK: "RPC_LOGGING_LATENCY_CALLBACK",
            RPC_LOGGING_LATENCY_ERRBACK: "RPC_LOGGING_LATENCY_ERRBACK",
            RPC_SUCCESS: "RPC_SUCCESS",
            RPC_ERROR: "RPC_ERROR",
            REAUTHORIZE_SUCCESS: "REAUTHORIZE_SUCCESS",
            REAUTHORIZE_FAILED: "REAUTHORIZE_FAILED",
            FLASH_LOADED: "FLASH_LOADED",
            FLASH_UNAVAILABLE: "FLASH_UNAVAILABLE",
            FLASH_AVAILABLE: "FLASH_AVAILABLE",
            READY: "READY",
            NOT_READY: "NOT_READY",
            TOKEN_ACQUIRED: "TOKEN_ACQUIRED",
            TOKEN_NOT_ACQUIRED: "TOKEN_NOT_ACQUIRED",
            ON_TRY_TO_CONNECT: "ON_TRY_TO_CONNECT",
            NOTIFY_OF_DISCONNECT: "NOTIFY_OF_DISCONNECT",
            FATAL_ERROR: "FATAL_ERROR",
            TOKEN_LOST: "TOKEN_LOST",
            WORK: "WORK",
            LOGIN_COMPLETE: "LOGIN_COMPLETE",
            HERMES_B64_MESSAGE: "HERMES_B64_MESSAGE",
            TIMEOUT: "TIMEOUT",
            NO_SOUND_CAPABILITIES: "NO_SOUND_CAPABILITIES",
            ON_REAUTHENTICATION_SUCCESS: "ON_REAUTHENTICATION_SUCCESS",
            ON_REAUTHENTICATION_FAILED: "ON_REAUTHENTICATION_FAILED",
            STORAGE_FULL: "STORAGE_FULL",
            RATE_LIMIT_CALL: "RATE_LIMIT_CALL",
            RATE_LIMIT_DISABLED: "RATE_LIMIT_DISABLED",
            REMOTE_CONTROL_STARTED: "REMOTE_CONTROL_STARTED",
            REMOTE_CONTROL_STOPPED: "REMOTE_CONTROL_STOPPED",
            DEVICE_DISCOVERED: "DEVICE_DISCOVERED",
            DEVICE_REMOVED: "DEVICE_REMOVED",
            REMOTE_COMMAND: "REMOTE_COMMAND",
            REMOTE_SERVICE_DOWN: "REMOTE_SERVICE_DOWN",
            NOTIFICATION: "NOTIFICATION",
            RELATIONS_SUBSCRIBE: "RELATIONS_SUBSCRIBE",
            RELATIONS_UNSUBSCRIBE: "RELATIONS_UNSUBSCRIBE",
            RECORD_AD_EVENT: "RECORD_AD_EVENT",
            PLAYER_CREATED: "PLAYER_CREATED",
            DURATION: "DURATION"
        }
    }
})();
Spotify.Resolvers = {
    STORAGE_RESOLVER: "STORAGE_RESOLVER",
    AD_RESOLVER: "AD_RESOLVER",
    PREVIEW_RESOLVER: "PREVIEW_RESOLVER"
};
Spotify.Ajax = function (g) {
    var f = Spotify.DebuggerJS,
        g = g || {}, d = {};
    d.method = g.method || "GET";
    d.dataType = g.dataType || "text";
    d.url = g.url || void 0;
    d.data = g.data || "";
    d.async = g.async !== void 0 ? g.async : !0;
    d.success = g.success || void 0;
    d.error = g.error || void 0;
    d.context = g.context || void 0;
    this.POST = "POST";
    this.GET = "GET";
    this.JSON = "json";
    this.XML = "xml";
    this.TEXT = "text";
    this.execute = function () {
        var b, c = d.url,
            a = "",
            h, i = function (a) {
                d.context !== void 0 ? d.error.call(d.context, a) : d.error(a)
            }, l = function () {
                if (typeof d.success !==
                    "undefined") {
                    if (d.dataType === "xml") try {
                        h = b.responseXML || Spotify.Utils.convertStringToXML(b.responseText)
                    } catch (a) {
                        i(a)
                    }
                    if (d.dataType === "json") try {
                        h = JSON.parse(b.responseText)
                    } catch (c) {
                        i(c)
                    }
                    d.dataType === "text" && (h = b.responseText);
                    d.context !== void 0 ? d.success.call(d.context, h, b) : d.success(h, b)
                }
            }, m = function () {
                typeof d.error !== "undefined" && i()
            }, g = function () {
                l()
            }, o = function (a) {
                m(a)
            };
        b = XMLHttpRequest ? new XMLHttpRequest : new ActiveXObject("Microsoft.XMLHTTP");
        d.method === this.POST ? a = d.data : c += d.data !== "" ?
            "?" + d.data : "";
        try {
            try {
                b.open(d.method, c, d.async)
            } catch (k) {
                if (XDomainRequest) f.log("Spotify.Ajax", ["Trying Cors"], "corejs"), b = new XDomainRequest, b.onprogress = function () {}, b.onload = g, b.onerror = o, b.open(d.method, c, d.async);
                else throw Error("CORS not supported");
            }
            b.send(a)
        } catch (p) {
            f.error("Spotify.Ajax", [p], "corejs"), i(p)
        }
        b.onreadystatechange = function () {
            b.readyState === 4 && b.status >= 200 && b.status < 300 ? l() : b.status >= 400 && m()
        };
        return b
    }
};
Spotify.Service = function () {
    Spotify.EventTarget.call(this);
    this.url = "";
    this.method = "GET";
    this.dataType = "text";
    this.data = "";
    this.async = !0;
    this.fetch = function () {
        (new Spotify.Ajax({
            method: this.method,
            dataType: this.dataType,
            url: this.url,
            data: this.data,
            success: g,
            error: f,
            context: this
        })).execute()
    };
    var g = function (d, b) {
        this.trigger("onSuccess", {
            result: d,
            request: b
        })
    }, f = function (d) {
        this.trigger("onError", {
            error: d
        })
    }
};
Spotify.Proto.Data = function (g, f) {
    Spotify.EventTarget.call(this);
    var d = this,
        b, c = {}, a = new Spotify.Events;
    this.initialize = function () {
        var a = new Spotify.Service;
        a.url = g + "data.xml" + f;
        a.async = !1;
        a.dataType = "text";
        a.bind("onSuccess", h, this);
        a.bind("onError", i, this);
        a.fetch()
    };
    this.getDefinition = function (a) {
        if (typeof c[a] !== "undefined") return c[a];
        var h = b.getElementsByTagName(a);
        return typeof h !== "undefined" && h[0] && h[0].firstChild ? (c[a] = h[0].firstChild.data + "\n", c[a]) : ""
    };
    this.getMultipleDefinitions = function (a) {
        var h =
            "",
            i = 0,
            d, f;
        if (!Spotify.Utils.isArray(a)) throw Error("Definition identifiers must be an array with strings");
        for (; i < a.length; i++) {
            f = a[i];
            if (typeof c[f] !== "undefined") {
                h += c[f];
                break
            }
            d = b.getElementsByTagName(f);
            typeof d !== "undefined" && d[0] && d[0].firstChild && (c[f] = d[0].firstChild.data + "\n", h += c[f])
        }
        return h
    };
    var h = function (c) {
        b = Spotify.Utils.convertStringToXML(c.params.result);
        d.trigger(a.SUCCESS)
    }, i = function (b) {
        d.trigger(a.ERROR, b.params)
    }
};
Spotify.Core = function (g, f, d) {
    Spotify.EventTarget.call(this);
    Spotify.DebuggerJS.register("console", new Spotify.DebuggerJS.Loggers.Console, new Spotify.DebuggerJS.Parsers.Default);
    var b = this,
        c = Spotify.DebuggerJS,
        a, h = !1,
        i = {
            playerType: f,
            SWFContainerId: d.SWFContainerId || "",
            SWFPlayerContainerId: d.SWFPlayerContainerId || "",
            SWFPlayerUrl: d.SWFPlayerUrl || "player.swf",
            SWFUrl: d.SWFUrl || "bridge.swf",
            SWFMinVersion: d.SWFMinVersion || "10.2.0",
            connectionUri: d.connectionUri || [],
            logging: d.logging || 0,
            length: d.length || 0,
            valid: d.valid || 0,
            cdn: d.cdn || "",
            authUrl: d.authUrl || "",
            protoSchemasLocation: d.protoSchemasLocation || "proto/",
            protoSchemasLocationRandomizer: d.protoSchemasLocationRandomizer || "",
            rtmpServer: d.rtmpServer || ""
        };
    this.id = "";
    var l = g || Spotify.GatewayTypes.FLASH,
        m = f || Spotify.PlayerTypes.RTMPS,
        n, o = new Spotify.Events,
        k;
    this.storageResolver = this._bridge = this.mergedProfile = this.adChooser = this.presence = this.hermes = this.socialGraph = this.social = this.toplist = this.user = this.search = this.popcount = this.appstore = this.playlist = this.metadata = this.pubsub = this.suggest = this.player = null;
    this.logging = {};
    this.isReady = !1;
    this.onConnect = function () {};
    this.onDisconnect = function () {};
    this.onReady = function () {};
    this.onTokenLost = function () {};
    this.connect = function (a) {
        n.connect(a)
    };
    this.connectWithToken = function (a) {
        n.connect(a)
    };
    this.connectWithCredentials = function (a, b) {
        n.connect("1:" + a + ":" + b)
    };
    this.disconnect = function () {
        n.disconnect()
    };
    this.migrateToIndexedDBStorage = function (a, b, c) {
        Spotify.Hermes.Cache.migrateToIndexedDB(a, b, c)
    };
    this.initialize = function () {
        k = new Spotify.Proto.Data(i.protoSchemasLocation, i.protoSchemasLocationRandomizer);
        k.bind(o.SUCCESS, q);
        k.bind(o.ERROR, y);
        k.initialize()
    };
    this.dispose = function () {
        this.audioManager.dispose();
        n.dispose()
    };
    var p = function (a) {
        var c = b.audioManager.getActivePlayer();
        c && c.pause();
        b.onTokenLost(a)
    }, q = function () {
        Spotify.Instances.add(b);
        n = new Spotify.Gateway(l, m);
        n.bind(o.READY, A, b);
        n.bind(o.ON_TRY_TO_CONNECT, u, b);
        n.bind(o.CONNECTED, x, b);
        n.bind(o.DISCONNECTED, b.onDisconnect, b);
        n.bind(o.TOKEN_LOST,
        p, b);
        n.bind(o.USER_INFO_CHANGE, s, b);
        n.bind(o.FLASH_AVAILABLE, t, b);
        n.bind(o.FLASH_UNAVAILABLE, t, b);
        Spotify.Hermes.Cache.onfull = v;
        (new Spotify.Heartbeat(n)).initialize();
        n.initialize(b.id, i);
        b._bridge = n.bridge
    }, s = function () {
        b.trigger(o.USER_INFO_CHANGE)
    }, t = function (h) {
        h.type === o.UNAVAILABLE ? b.trigger(o.FLASH_UNAVAILABLE) : (a && clearTimeout(a), a = setTimeout(function () {
            b.isReady ? c.log("Spotify.Core", ["Flash is available"], "corejs") : (c.error("Spotify.Core", ["Flash is NOT available"], "corejs"), b.trigger(o.FLASH_UNAVAILABLE))
        },
        5E3))
    }, y = function (a) {
        b.trigger(o.DATA_ERROR, a)
    }, w = function () {
        b.trigger(o.NO_SOUND_CAPABILITIES)
    }, v = function () {
        b.trigger(o.STORAGE_FULL)
    }, x = function (a) {
        if (!h) {
            h = !0;
            b.user = new Spotify.Services.User;
            b.user.init(n);
            b.appstore = new Spotify.Services.AppStore(k.getDefinition("appstore"));
            b.appstore.init(n);
            b.popcount = new Spotify.Services.PopCount(k.getDefinition("popcount"));
            b.popcount.init(n);
            b.metadata = new Spotify.Services.Metadata(k.getMultipleDefinitions(["metadata", "mercury"]));
            b.metadata.init(n, b.user);
            b.search = new Spotify.Services.Search;
            b.search.init(n, b.user);
            b.suggest = new Spotify.Services.Suggest(k.getDefinition("suggest"));
            b.suggest.init(n, b.user);
            b.pubsub = new Spotify.Services.Pubsub(k.getDefinition("pubsub"));
            b.pubsub.init(n);
            b.toplist = new Spotify.Services.Toplist(k.getMultipleDefinitions(["toplist", "socialgraph"]));
            b.toplist.init(n, b.user);
            b.playlist = new Spotify.Services.Playlist(k.getMultipleDefinitions("playlist4changes,playlist4content,playlist4issues,playlist4meta,playlist4ops,playlist4service".split(",")));
            b.playlist.init(n, b.toplist, b.user, b.pubsub);
            b.social = new Spotify.Services.Social(k.getMultipleDefinitions(["social", "mercury"]));
            b.social.init(n);
            b.presence = new Spotify.Services.Presence(k.getDefinition("presence"));
            b.presence.init(n, b.pubsub, b.user);
            b.socialGraph = new Spotify.Services.SocialGraph(k.getMultipleDefinitions(["socialgraph"]));
            b.socialGraph.init(n, b.user);
            b.audioManager = new Spotify.Audio.AudioManager(b.id, i, m);
            b.audioManager.bind(o.FLASH_AVAILABLE, t, b);
            b.audioManager.bind(o.FLASH_UNAVAILABLE,
            t, b);
            b.audioManager.bind(o.NO_SOUND_CAPABILITIES, w);
            var c = new Spotify.Services.SongUriResolver;
            c.init(n);
            b.storageResolver = c;
            var d = new Spotify.Services.AdUriResolver;
            d.init(n);
            var l = new Spotify.Services.PreviewsUriResolver;
            l.init();
            b.audioManager.addFileResolver(Spotify.Resolvers.STORAGE_RESOLVER, c);
            b.audioManager.addFileResolver(Spotify.Resolvers.AD_RESOLVER, d);
            b.audioManager.addFileResolver(Spotify.Resolvers.PREVIEW_RESOLVER, l);
            b.audioManager.initialize(n, b.user, b.metadata);
            b.hermes = new Spotify.Hermes.Handler;
            b.hermes.init(n);
            b.logging.clientEvent = new Spotify.Logging.ClientEvent;
            b.logging.clientEvent.init(n);
            b.logging.logger = new Spotify.Logging.Logger;
            b.logging.logger.init(n);
            b.logging.view = new Spotify.Logging.View;
            b.logging.view.init(n);
            b.adChooser = new Spotify.Services.AdChooser;
            b.adChooser.bind(o.INTERCEPTED, D);
            b.adChooser.init(n, b.audioManager, b.user);
            b.mergedProfile = new Spotify.Services.MergedProfile(k.getDefinition("mergedprofile"));
            b.mergedProfile.init(n)
        }
        b.onConnect(a)
    }, D = function () {
        b.trigger(o.WAIT_FOR_COMMERCIAL_TO_FINISH)
    },
    A = function (a) {
        setTimeout(function () {
            b.isReady = !0;
            b.onReady(a);
            b.trigger(o.ON_TRY_TO_CONNECT)
        }, 1)
    }, u = function () {
        b.trigger(o.ON_TRY_TO_CONNECT)
    }
};
(function () {
    Spotify.Link = function (a, b) {
        this.type = a;
        for (var c in b) this[c] = b[c]
    };
    var g = Spotify.Link;
    g.Type = {
        EMPTY: "empty",
        ALBUM: "album",
        AD: "ad",
        APPLICATION: "application",
        ARTIST: "artist",
        ARTIST_TOPLIST: "artist-toplist",
        CONTEXT_GROUP: "context-group",
        FACEBOOK: "facebook",
        FILE: "file",
        FOLLOWERS: "followers",
        FOLLOWING: "following",
        IMAGE: "image",
        INBOX: "inbox",
        LOCAL: "local",
        LIBRARY: "library",
        MOSAIC: "mosaic",
        PLAYLIST: "playlist",
        PROFILE: "profile",
        PUBLISHED_ROOTLIST: "published-rootlist",
        RADIO: "radio",
        ROOTLIST: "rootlist",
        COLLECTION_TRACK_LIST: "collectiontracklist",
        SEARCH: "search",
        STARRED: "starred",
        TEMP_PLAYLIST: "temp-playlist",
        TOPLIST: "toplist",
        TRACK: "track",
        USER_TOPLIST: "user-toplist",
        USET_TOP_TRACKS: "user-top-tracks"
    };
    var f = function (a, b) {
        var c, d = 1;
        if (a.indexOf("spotify:") == 0) c = a.slice(8).split(":"), d = 0;
        else if (a.indexOf("http://play.spotify.com/") == 0) c = a.slice(24).split("/");
        else if (a.indexOf("https://play.spotify.com/") == 0) c = a.slice(25).split("/");
        else if (a.indexOf("http://open.spotify.com/") == 0) c = a.slice(24).split("/");
        else if (a.indexOf("https://open.spotify.com/") == 0) c = a.slice(25).split("/");
        else throw "Invalid Spotify URI!";
        Array.prototype.push.apply(b, c);
        return d
    }, d = function (a, b) {
        a = encodeURIComponent(a);
        return b == 0 ? a.replace(/%20/g, "+") : a
    }, b = function (a, b) {
        return decodeURIComponent(b == 0 ? a.replace(/\+/g, "%20") : a)
    }, c = function (a, b) {
        var c;
        a.id && (c = Spotify.Utils.Base62.fromHex(a.id, 22));
        switch (a.type) {
            case g.Type.ALBUM:
                return c = ["album", c], a.disc && c.push(a.disc), c;
            case g.Type.AD:
                return ["ad", a.id];
            case g.Type.ARTIST:
                return ["artist",
                c];
            case g.Type.ARTIST_TOPLIST:
                return ["artist", c, "top", a.toplist];
            case g.Type.SEARCH:
                return ["search", d(a.query, b)];
            case g.Type.TRACK:
                return ["track", c];
            case g.Type.FACEBOOK:
                return ["user", "facebook", a.uid];
            case g.Type.FILE:
                return ["file", a.extension, a.id];
            case g.Type.FOLLOWERS:
                return ["user", a.username, "followers"];
            case g.Type.FOLLOWING:
                return ["user", a.username, "following"];
            case g.Type.PLAYLIST:
                return ["user", a.username, "playlist", c];
            case g.Type.STARRED:
                return ["user", a.username, "starred"];
            case g.Type.TEMP_PLAYLIST:
                return ["temp-playlist",
                a.origin, a.data];
            case g.Type.CONTEXT_GROUP:
                return ["context-group", a.origin, a.name];
            case g.Type.USER_TOPLIST:
                return ["user", a.username, "top", a.toplist];
            case g.Type.USET_TOP_TRACKS:
                return ["user", a.username, "toplist"];
            case g.Type.TOPLIST:
                return ["top", a.toplist].concat(a.global ? ["global"] : ["country", a.country]);
            case g.Type.INBOX:
                return ["user", a.username, "inbox"];
            case g.Type.ROOTLIST:
                return ["user", a.username, "rootlist"];
            case g.Type.PUBLISHED_ROOTLIST:
                return ["user", a.username, "publishedrootlist"];
            case g.Type.COLLECTION_TRACK_LIST:
                return ["user",
                a.username, "collectiontracklist", c];
            case g.Type.PROFILE:
                return ["user", a.username];
            case g.Type.LOCAL:
                return ["local", d(a.artist, b), d(a.album, b), d(a.track, b), a.duration];
            case g.Type.LIBRARY:
                return ["user", a.username, "library", a.category];
            case g.Type.IMAGE:
                return ["image", a.id];
            case g.Type.MOSAIC:
                return c = a.ids.slice(0), c.unshift("mosaic"), c;
            case g.Type.RADIO:
                return ["radio", a.args];
            case g.Type.APPLICATION:
                c = ["app", a.id];
                for (var l = a.args || [], f = 0, n = l.length; f < n; ++f) c.push(d(l[f], b));
                return c;
            default:
                throw "Invalid Spotify URI!";
        }
    };
    g.prototype.toURI = function () {
        return "spotify:" + c(this, 0).join(":")
    };
    g.prototype.toAppLink = function () {
        if (this.type == g.Type.APPLICATION) return g.applicationLink(this.id, this.args);
        else {
            var a = c(this, 1),
                h = a.shift();
            a.length && (a = a.map(function (a) {
                return b(a, 1)
            }));
            return g.applicationLink(h, this.type == g.Type.RADIO ? a.shift().split(":") : a)
        }
    };
    g.prototype.toAppURI = function () {
        return this.type == g.Type.APPLICATION ? this.toURI() : "spotify:" + ["app"].concat(c(this, 0)).join(":")
    };
    g.prototype.toURLPath = function () {
        var a = c(this, 1);
        a[0] === "app" && a.shift();
        return a.join("/")
    };
    g.prototype.toURL = function (a) {
        typeof a === "undefined" && (a = !0);
        return a ? "http://play.spotify.com/" + this.toURLPath() : "/" + this.toURLPath()
    };
    g.prototype.toSecureURL = function () {
        return "https://play.spotify.com/" + this.toURLPath()
    };
    g.prototype.toString = function () {
        return this.toURI()
    };
    g.fromString = function (a) {
        var c = [],
            i = f(a, c),
            d = 0,
            m = function () {
                return c[d++]
            }, a = function () {
                var a = m();
                return a.length == 22 ? Spotify.Utils.Base62.toHex(a, 32) : a
            }, n = function () {
                return c.slice(d).join(i == 0 ? ":" : "/")
            }, o = m();
        switch (o) {
            case "album":
                return g.albumLink(a(), parseInt(m(), 10));
            case "ad":
                return g.adLink(a());
            case "artist":
                return a = a(), m() == "top" ? g.artistToplistLink(a, m()) : g.artistLink(a);
            case "file":
                return g.fileLink(m(), m());
            case "temp-playlist":
                return g.temporaryPlaylistLink(m(), n());
            case "search":
                return g.searchLink(b(n(), i));
            case "track":
                return g.trackLink(a());
            case "trackset":
                throw "Not implemented!";
            case "context-group":
                return g.contextGroupLink(m(), m());
            case "top":
                return a = m(), m() == "global" ? g.toplistLink(a, null, !0) : g.toplistLink(a, m(), !1);
            case "user":
                n = m();
                o = m();
                if (n == "facebook" && o != null) return g.facebookLink(parseInt(o, 10));
                else if (o != null) switch (o) {
                    case "playlist":
                        return g.playlistLink(n, a());
                    case "collectiontracklist":
                        return g.collectionTrackList(n, a());
                    case "starred":
                        return g.starredLink(n);
                    case "followers":
                        return g.followersLink(n);
                    case "following":
                        return g.followingLink(n);
                    case "top":
                        return g.userToplistLink(n, m());
                    case "inbox":
                        return g.inboxLink(n);
                    case "rootlist":
                        return g.rootlistLink(n);
                    case "publishedrootlist":
                        return g.publishedRootlistLink(n);
                    case "toplist":
                        return g.userTopTracksLink(n);
                    case "library":
                        return g.libraryLink(n, m())
                }
                return g.profileLink(n);
            case "local":
                return g.localLink(b(m(), i), b(m(), i), b(m(), i), parseInt(m(), 10));
            case "image":
                return g.imageLink(a());
            case "mosaic":
                return g.mosaicLink(c.slice(d));
            case "radio":
                return g.radioLink(n());
            default:
                for (var a = o === "app" ? m() : o, n = c.slice(d), o = 0, k = n.length; o < k; ++o) n[o] = b(n[o], i);
                return g.applicationLink(a, n)
        }
        throw "Invalid Spotify URI!";
    };
    g.emptyLink = function () {
        return new g(g.Type.EMPTY, {})
    };
    g.albumLink = function (a, b) {
        return new g(g.Type.ALBUM, {
            id: a,
            disc: b
        })
    };
    g.adLink = function (a) {
        return new g(g.Type.AD, {
            id: a
        })
    };
    g.artistLink = function (a) {
        return new g(g.Type.ARTIST, {
            id: a
        })
    };
    g.artistToplistLink = function (a, b) {
        return new g(g.Type.ARTIST_TOPLIST, {
            id: a,
            toplist: b
        })
    };
    g.searchLink = function (a) {
        return new g(g.Type.SEARCH, {
            query: a
        })
    };
    g.trackLink = function (a) {
        return new g(g.Type.TRACK, {
            id: a
        })
    };
    g.facebookLink = function (a) {
        return new g(g.Type.FACEBOOK, {
            uid: a
        })
    };
    g.fileLink = function (a, b) {
        return new g(g.Type.FILE, {
            id: b,
            extension: a
        })
    };
    g.followersLink = function (a) {
        return new g(g.Type.FOLLOWERS, {
            username: a
        })
    };
    g.followingLink = function (a) {
        return new g(g.Type.FOLLOWING, {
            username: a
        })
    };
    g.playlistLink = function (a, b) {
        return new g(g.Type.PLAYLIST, {
            username: a,
            id: b
        })
    };
    g.collectionTrackList = function (a, b) {
        return new g(g.Type.COLLECTION_TRACK_LIST, {
            username: a,
            id: b
        })
    };
    g.starredLink = function (a) {
        return new g(g.Type.STARRED, {
            username: a
        })
    };
    g.userToplistLink = function (a,
    b) {
        return new g(g.Type.USER_TOPLIST, {
            username: a,
            toplist: b
        })
    };
    g.userTopTracksLink = function (a) {
        return new g(g.Type.USET_TOP_TRACKS, {
            username: a
        })
    };
    g.toplistLink = function (a, b, c) {
        return new g(g.Type.TOPLIST, {
            toplist: a,
            country: b,
            global: !! c
        })
    };
    g.inboxLink = function (a) {
        return new g(g.Type.INBOX, {
            username: a
        })
    };
    g.rootlistLink = function (a) {
        return new g(g.Type.ROOTLIST, {
            username: a
        })
    };
    g.publishedRootlistLink = function (a) {
        return new g(g.Type.PUBLISHED_ROOTLIST, {
            username: a
        })
    };
    g.localLink = function (a, b, c, d) {
        return new g(g.Type.LOCAL, {
            artist: a,
            album: b,
            track: c,
            duration: d
        })
    };
    g.libraryLink = function (a, b) {
        return new g(g.Type.LIBRARY, {
            username: a,
            category: b
        })
    };
    g.temporaryPlaylistLink = function (a, b) {
        return new g(g.Type.TEMP_PLAYLIST, {
            origin: a,
            data: b
        })
    };
    g.contextGroupLink = function (a, b) {
        return new g(g.Type.CONTEXT_GROUP, {
            origin: a,
            name: b
        })
    };
    g.profileLink = function (a) {
        return new g(g.Type.PROFILE, {
            username: a
        })
    };
    g.imageLink = function (a) {
        return new g(g.Type.IMAGE, {
            id: a
        })
    };
    g.mosaicLink = function (a) {
        return new g(g.Type.MOSAIC, {
            ids: a
        })
    };
    g.radioLink = function (a) {
        a = typeof a === "undefined" ? [] : a;
        return new g(g.Type.RADIO, {
            args: a
        })
    };
    g.applicationLink = function (a, b) {
        b = typeof b === "undefined" ? [] : b;
        return new g(g.Type.APPLICATION, {
            id: a,
            args: b
        })
    }
})();
(function () {
    var g;
    Spotify.Logging.Types = function () {
        return typeof g !== "undefined" ? g : g = {
            TRACK_END: "TRACK_END",
            PREVIEW_END: "PREVIEW_END",
            TRACK_EVENT: "TRACK_EVENT",
            TRACK_PROGRESS: "TRACK_PROGRESS",
            REQUEST_TIME: "REQUEST_TIME",
            AD_END: "EndAd"
        }
    }
})();
Spotify.Logging.TrackEnd = function () {
    Spotify.EventTarget.call(this);
    var g, f = function () {}, d = function () {};
    this.serviceIsReady = !0;
    this.log = function (b) {
        g.rpc("track_end", [b.lid, b.ms_played, b.ms_played_union, b.n_seeks_forward, b.n_seeks_backward, b.ms_seeks_forward, b.ms_seeks_backward, b.ms_latency, b.display_track, b.play_context, b.source_start, b.source_end, b.reason_start, b.reason_end, b.referrer, b.referrer_version, b.referrer_vendor, b.max_continuous], f, d, this, !0, 2, "track_end")
    };
    this.init = function (b) {
        g = b
    }
};
Spotify.Logging.PreviewEnd = function () {
    Spotify.EventTarget.call(this);
    new Spotify.Logging.Logger;
    this.serviceIsReady = !0;
    this.log = function () {};
    this.init = function () {}
};
Spotify.Logging.TrackEvent = function () {
    Spotify.EventTarget.call(this);
    var g, f = function () {}, d = function () {};
    this.serviceIsReady = !0;
    this.log = function (b) {
        g.rpc("track_event", [b.lid, b.event, b.ms_where], f, d, this, !0, 2, "track_event")
    };
    this.init = function (b) {
        g = b
    }
};
Spotify.Logging.TrackProgress = function () {
    Spotify.EventTarget.call(this);
    var g = Spotify.DebuggerJS,
        f, d = function (b) {
            g.log("Spotify.Logging.TrackProgress", ["Track progress success", b], "corejs")
        }, b = function (b) {
            g.error("Spotify.Logging.TrackProgress", ["On track progress error", b], "corejs")
        };
    this.serviceIsReady = !0;
    this.log = function (c) {
        f.rpc("track_progress", [c.lid, c.source_start, c.reason_start, c.ms_played, c.ms_latency, c.play_context, c.display_track, c.referrer, c.referrer_version, c.referrer_vendor], d, b, this, !0, 2, "track_progress")
    };
    this.init = function (b) {
        f = b
    }
};
Spotify.Logging.ClientEvent = function () {
    Spotify.EventTarget.call(this);
    var g, f = function () {}, d = function () {};
    this.serviceIsReady = !0;
    this.log = function (b) {
        if (typeof b.source !== "string") throw Error("Source must be a string");
        if (typeof b.context !== "string") b.context = "";
        if (typeof b.event !== "string") throw Error("Event name must be a string");
        if (typeof b.event_version !== "string") b.event_version = "";
        if (typeof b.test_version !== "string") b.test_version = "";
        if (typeof b.source_version !== "string") throw Error("Source version name must be a string");
        if (typeof b.source_vendor !== "string") throw Error("Source vendor name must be a string");
        if (typeof b.data !== "string") b.data = "";
        g.rpc("log_ce", [b.source, b.context, b.event, b.event_version, b.test_version, b.source_version, b.source_vendor, b.data], f, d, this, !0, 2, "log_ce")
    };
    this.init = function (b) {
        g = b
    }
};
Spotify.Logging.AdEnd = function () {
    Spotify.EventTarget.call(this);
    var g, f = function () {}, d = function () {};
    this.serviceIsReady = !0;
    this.log = function (b) {
        g.rpc("log_ad", [String(b.file_id), String(b.ad_file_id), String(b.lid), String(b.source_start), String(b.reason_start), String(b.source_end), String(b.reason_end), String(b.bytes_played), String(b.content_length), String(b.ms_played), String(b.ms_played_union), String(b.ms_rcv_latency), String(b.n_seeks_backward), String(b.ms_seeks_backward), String(b.n_seeks_forward),
        String(b.ms_seeks_forward), String(b.ms_latency), String(b.num_stutter), String(b.p_lowbuffer), String(b.skipped), String(b.clicked), String(b.token), String(b.last_stream_started_at), String(b["client-ad-count"]), String(b["client-campaign-count"])], f, d, this, !0, 2, "log_ad")
    };
    this.init = function (b) {
        g = b
    }
};
Spotify.Logging.View = function () {
    Spotify.EventTarget.call(this);
    var g, f = function () {}, d = function () {};
    this.serviceIsReady = !0;
    this.log = function (b, c, a, h) {
        if (typeof b !== "string") throw Error("Uri must be a string");
        if (typeof c !== "string") throw Error("View version must be a string");
        if (typeof a !== "string") throw Error("View vendor must be a string");
        if (typeof h !== "number") throw Error("Duration must be a number");
        typeof data !== "string" && (data = "");
        g.rpc("log_view", [b, c, a, h], f, d, this, !0, 2, "log_view")
    };
    this.init = function (b) {
        g = b
    }
};
(function () {
    var g;
    Spotify.Logging.Logger = function () {
        if (typeof g !== "undefined") return g;
        Spotify.EventTarget.call(this);
        g = this;
        var f, d = function () {}, b = function () {};
        this.serviceIsReady = !0;
        this.logJSExceptions = function (c, a, h, i) {
            typeof c === "undefined" || typeof a === "undefined" || typeof h === "undefined" || typeof i === "undefined" || f.rpc("log", [202, 1, c, a, h, i], d, b, this, !0, 2, "js_exceptions")
        };
        this.logRequestTime = function (c, a, h, i, l) {
            typeof c === "undefined" || typeof a === "undefined" || typeof h === "undefined" || typeof i ===
                "undefined" || typeof l === "undefined" || f.rpc("log", [30, 1, c, a, h, i, l], d, b, this, !0, 2, "request_time")
        };
        this.logEndPreview = function (c, a, h, i, l, m, g, o, k) {
            f.rpc("log", [216, 1, c, a, h, i, l, m, g, o, k], d, b, this, !0, 2, "end_preview")
        };
        this.log = function (c, a) {
            var h = Array.prototype.slice.call(arguments);
            typeof c === "undefined" || typeof a === "undefined" || f.rpc("log", h, d, b, this, !0, 2, "log")
        };
        this.init = function (b) {
            f = b
        }
    }
})();
Spotify.PlayerTracker = function (g, f, d) {
    Spotify.EventTarget.call(this);
    this.id = g;
    var b = Spotify.DebuggerJS,
        c, a = new Spotify.Events,
        h = {}, i, l = 0,
        m = 0,
        n = 0,
        o = 0,
        k = [],
        p = 0,
        q = 0,
        s = 0,
        t = 0,
        y = 0,
        w = 0,
        v = "",
        x = "unknown",
        D = "unknown",
        A = "unknown",
        u = "unknown",
        C = "unknown",
        J = "unknown",
        G = "unknown",
        F = "unknown",
        H = "",
        E = new Spotify.Logging.Types,
        M = new Spotify.Cache.Default(100, new Spotify.Cache.LocalStorage("tracker")),
        N = !1,
        z = !1,
        O = !1,
        I = {}, K = 0,
        L = function (d) {
            var g = h[d],
                o = 0,
                z = {};
            if (H !== "" || H === "" && O) {
                n = N ? n : W(k);
                v = v || "";
                x = x || "unknown";
                D = D || "unknown";
                u = u || "unknown";
                J = J || "unknown";
                G = G || "unknown";
                F = F || "unknown";
                if (p === 0 && q === 0 && (d === E.TRACK_END || d === E.AD_END)) l = m = n;
                if (d === E.AD_END) z.ad_file_id = f.ad.file_id, z.lid = f.ad.ad_id, z.file_id = "5", z.bytes_played = 0, z.content_length = 0, z.ms_rcv_latency = 0, z.num_stutter = 0, z.p_lowbuffer = 0, z.skipped = 0, z.last_stream_started_at = (new Date(y)).toISOString(), z.token = f.ad.token, z.clicked = f.ad.has_been_clicked ? 1 : 0, z["client-ad-count"] = f.ad.adPlayCount, z["client-campaign-count"] = f.ad.campaignPlayCount, z.source_start =
                    "pendad", z.source_end = "trackdone", z.reason_end = "albumtrackdone";
                else if (d === E.TRACK_END) z.lid = H, z.source_start = D, z.source_end = A, z.reason_end = C;
                else if (d === E.TRACK_PROGRESS) z.lid = H, z.play_track = i, z.source_start = D, z.bitrate = f.bitrate, z.audiocodec = f.audiocodec;
                else if (d === E.PREVIEW_END) z.bitrate = f.bitrate, z.audiocodec = f.audiocodec, z.reason_end = C;
                z.max_continuous = l;
                z.ms_played = m;
                z.ms_played_union = n;
                z.n_seeks_forward = p;
                z.n_seeks_backward = q;
                z.ms_seeks_forward = s;
                z.ms_seeks_backward = t;
                z.ms_latency = w;
                z.display_track = v;
                z.play_context = x;
                z.reason_start = u;
                z.referrer = J;
                z.referrer_version = G;
                for (z.referrer_vendor = F; o < g.length; o++) g[o].log(z);
                d === E.AD_END && (N || c.trigger(a.RECORD_AD_EVENT, {
                    playerId: f.id,
                    adUri: "spotify:ad:" + f.ad.file_id,
                    type: "impression"
                }), delete f.ad);
                N && (N = !1);
                b.log("Spotify.PlayerTracker", ["Logging song data -> Type:", d, "-> Arguments:", z, " of player", f.id], "corejs")
            }
        }, P = function (a) {
            var b = h[E.TRACK_EVENT],
                c = 0;
            if (H !== "") for (a = {
                lid: H,
                event: a,
                ms_where: f.position()
            }; c < b.length; c++) b[c].log(a)
        }, Q = function (a) {
            m += a.params.interval;
            if ((Math.floor(m * 0.01) * 100 % 15E3 === 0 || m < 1E3) && K < 4 && !z) f.isPreview || L(E.TRACK_PROGRESS), K++
        }, B = function () {
            b.log("Spotify.PlayerTracker", ["Cache is initialized..."], "corejs");
            M.get(Spotify.Utils.Base64.encode(d) + ":stats:" + f.id, U, c)
        }, R = function () {}, S = function (a) {
            b.log("Spotify.PlayerTracker", ["endSongData are now stored", arguments], "corejs")
        }, T = function (a) {
            b.error("Spotify.PlayerTracker", ["endSongData are NOT stored", arguments], "corejs")
        }, U = function (a, b) {
            if (b !== null) {
                M.remove(a, ca, c);
                var h;
                h = JSON.parse(Spotify.Utils.Base64.decode(b));
                if (z = h.isAd) {
                    if (!f.ad) f.ad = {};
                    f.ad.file_id = h.ad_file_id;
                    f.ad.ad_id = h.ad_id;
                    y = h.last_stream_started_at;
                    f.ad.token = h.token;
                    f.ad.has_been_clicked = h.clicked;
                    f.ad.adPlayCount = h["client-ad-count"];
                    f.ad.campaignPlayCount = h["client-campaign-count"]
                }
                H = h.lid;
                O = h.isPreview;
                l = h.max_continuous;
                n = h.ms_played_union;
                m = h.ms_played;
                p = h.n_seeks_forward;
                q = h.n_seeks_backward;
                s = h.ms_seeks_forward;
                t = h.ms_seeks_backward;
                w = h.ms_latency;
                v = h.display_track;
                x = h.play_context;
                D = h.source_start;
                A = h.source_end;
                u = h.reason_start;
                C = h.reason_end;
                J = h.referrer;
                G = h.referrer_version;
                F = h.referrer_vendor;
                N = !0;
                z ? L(E.AD_END) : O ? L(E.PREVIEW_END) : L(E.TRACK_END);
                V()
            }
        }, ca = function () {}, V = function () {
            O = z = !1;
            H = "";
            m = 0;
            i = "";
            n = l = 0;
            k = [];
            w = t = s = q = p = 0;
            v = "";
            F = G = J = C = u = A = D = x = "unknown"
        }, da = function (a, b) {
            return a.time - b.time
        }, W = function (a) {
            for (var b = 0, c = 0, h = 0, i = 0, d = 0, f = 0; d < a.length; d++) d % 2 !== 0 && typeof a[d - 1] !== "undefined" && a[d - 1].type === "START" && (f = a[d].time - a[d - 1].time, l = f > l ? f : l);
            for (a.sort(da); i < a.length; i++) a[i].type ===
                "START" && (c === 0 && (h = i), ++c), a[i].type === "END" && (--c, c === 0 && (b += a[i].time - a[h].time));
            return b
        }, ea = function () {
            var a = {};
            z ? (a.ad_file_id = f.ad.file_id, a.lid = f.ad.ad_id, a.last_stream_started_at = y, a.token = f.ad.token, a.clicked = f.ad.has_been_clicked, a["client-ad-count"] = f.ad.adPlayCount, a["client-campaign-count"] = f.ad.campaignPlayCount, a.source_start = "pendad") : (a.source_start = D || "unknown", a.lid = H);
            a.isAd = z;
            a.isPreview = O;
            a.source_end = a.source_start;
            a.max_continuous = l;
            a.ms_played = m;
            a.ms_played_union = W(k);
            a.n_seeks_forward = p;
            a.n_seeks_backward = q;
            a.ms_seeks_forward = s;
            a.ms_seeks_backward = t;
            a.ms_latency = w;
            a.display_track = v || "";
            a.play_track = a.display_track;
            a.play_context = x || "unknown";
            a.reason_start = u || "unknown";
            a.reason_end = "reload";
            a.referrer = J || "unknown";
            a.referrer_version = G || "unknown";
            a.referrer_vendor = F || "unknown";
            M.put(Spotify.Utils.Base64.encode(d) + ":stats:" + f.id, Spotify.Utils.Base64.encode(JSON.stringify(a)), S, T, null, this)
        }, X = function () {
            var a = f.getPlayerState().position;
            k.push({
                type: "END",
                time: a
            });
            z ? L(E.AD_END) : O ? L(E.PREVIEW_END) : L(E.TRACK_END);
            V()
        }, fa = function () {
            if (H !== "") {
                var a = f.getPlayerState().position;
                k.push({
                    type: "END",
                    time: o
                });
                a >= o ? (p++, s += a - o) : (q++, t += o - a);
                o = a;
                k.push({
                    type: "START",
                    time: o
                });
                b.log("Spotify.PlayerTracker", ["Tracking the position changed event of player", f.id], "corejs")
            }
        };
    this.onConnected = function () {
        b.log("Spotify.PlayerTracker", ["Tracking the on connect event"], "corejs");
        H !== "" && (f.isPlaying ? (b.log("Spotify.PlayerTracker", ["Tracking the reconnect while playing event"], "corejs"), P(1)) : f.isPaused && (b.log("Spotify.PlayerTracker", ["Tracking the reconnect while being paused event"], "corejs"), P(2)))
    };
    var ga = function () {
        K = 0;
        X();
        b.log("Spotify.PlayerTracker", ["Tracking the track end event of player", f.id], "corejs")
    }, Y = function (a) {
        y = a.params.timestamp
    }, Z = function () {}, aa = function () {
        H = f.lid;
        i = f.trackUri;
        z = f.isAd;
        O = f.isPreview;
        w = (new Date).getTime() - y;
        v = I.display_track || "";
        x = I.play_context || "unknown";
        D = I.source_start || "unknown";
        u = I.reason_start || "unknown";
        J = I.referrer || "unknown";
        G = I.referrer_version ||
            "unknown";
        F = I.referrer_vendor || "unknown"
    }, ha = function () {
        var a = f.position();
        k.push({
            type: "START",
            time: a
        });
        P(3);
        b.log("Spotify.PlayerTracker", ["Tracking the on play event of player", f.id], "corejs")
    }, ba = function () {
        P(4);
        b.log("Spotify.PlayerTracker", ["Tracking the on pause event of player", f.id], "corejs")
    }, ia = function () {
        b.log("Spotify.PlayerTracker", ["Tracking the on stopped event of player", f.id], "corejs");
        K = 0;
        X()
    }, ja = function () {
        b.log("Spotify.PlayerTracker", ["Tracking the invalid track uri event of player",
        f.id], "corejs")
    }, ka = function () {
        V();
        b.log("Spotify.PlayerTracker", ["Tracking the playback failed event of player", f.id], "corejs")
    };
    this.setEndSongStartLog = function (a) {
        typeof a !== "undefined" && (I = a)
    };
    this.setEndSongStopLog = function (a) {
        typeof a !== "undefined" && (A = a.source_end || "unknown", C = a.reason_end || "unknown")
    };
    this.dispose = function (a) {
        typeof a !== "undefined" && a || ea()
    };
    this.addLogger = function (a, b) {
        typeof h[a] === "undefined" && (h[a] = []);
        h[a].push(b)
    };
    this.initialize = function () {
        c = this;
        M.initialize(B, R, this);
        f.bind(a.TRACK_ENDED, ga, c);
        f.bind(a.POSITION_CHANGED, fa, c);
        f.bind(a.PLAYING, ha, c);
        f.bind(a.PAUSED, ba, c);
        f.bind(a.STOPPED, ia, c);
        f.bind(a.INVALID_TRACK_URI, ja, c);
        f.bind(a.PLAYBACK_FAILED, ka, c);
        f.bind(a.TRACK_PLAY_REQUEST, Y, c);
        f.bind(a.SONG_LOADED, Z, c);
        f.bind(a.LOAD, aa, c);
        f.bind(a.PLAYER_STATE, Q, c)
    }
};
Spotify.Protobuf.Parser = function () {
    function g() {}
    function f(a) {
        var b = h[a.current.value],
            c = a.next().value,
            d = a.next().value;
        a.expectToken("=");
        var f = ~~a.next().value;
        a.skipUntil(";");
        return {
            name: d,
            number: f,
            label: b,
            type: i[c],
            type_name: i[c] ? void 0 : c,
            default_value: void 0
        }
    }
    function d(a, c) {
        c = {
            name: a.next().value,
            field: [],
            nested_type: [],
            enum_type: []
        };
        for (a.expectToken("{"); a.next().type != "}";) switch (a.current.value) {
            case "optional":
            case "repeated":
            case "required":
                c.field.push(f(a));
                break;
            case "message":
                c.nested_type.push(d(a));
                break;
            case "enum":
                c.enum_type.push(b(a));
                break;
            case "extensions":
                a.skipUntil(";");
                break;
            case ";":
                break;
            default:
                a.fail("Unrecognized message token: " + a.current.value)
        }
        return c
    }
    function b(a) {
        var b = a.next().value;
        a.expectToken("{");
        for (var c = []; a.next().type != "}";) {
            var h = a.current.value;
            a.expectToken("=");
            var i = ~~a.next().value;
            c.push({
                name: h,
                number: i
            });
            a.skipUntil(";")
        }
        return {
            name: b,
            value: c
        }
    }
    var c = {};
    g.Label = {
        LABEL_OPTIONAL: 1,
        LABEL_REQUIRED: 2,
        LABEL_REPEATED: 3
    };
    g.Type = {
        TYPE_DOUBLE: 1,
        TYPE_FLOAT: 2,
        TYPE_INT64: 3,
        TYPE_UINT64: 4,
        TYPE_INT32: 5,
        TYPE_FIXED64: 6,
        TYPE_FIXED32: 7,
        TYPE_BOOL: 8,
        TYPE_STRING: 9,
        TYPE_MESSAGE: 11,
        TYPE_BYTES: 12,
        TYPE_UINT32: 13,
        TYPE_ENUM: 14,
        TYPE_SFIXED32: 15,
        TYPE_SFIXED64: 16,
        TYPE_SINT32: 17,
        TYPE_SINT64: 18
    };
    var a = function (a) {
        this.text = a;
        this.ptr = 0;
        this.current = {
            value: "",
            type: "",
            ptr: 0
        }
    };
    a.prototype = {
        where: function (a) {
            for (var a = a === void 0 ? this.current.ptr : a, b = 0, c = -1; c && c <= a;) c = this.text.indexOf("\n", c) + 1, ++b;
            return "line: " + b
        },
        fail: function (a, b) {
            throw this.where(b) + ": " + a;
        },
        skipWhitespace: function () {
            for (var a = this.text[this.ptr]; a && " \t\r\n".indexOf(a) != -1;) a = this.text[++this.ptr]
        },
        skipLineComment: function () {
            for (var a = this.text[this.ptr]; a && a !== "\r" && a !== "\n";) a = this.text[++this.ptr];
            a === "\r" && (a = this.text[++this.ptr]);
            a === "\n" && ++this.ptr
        },
        skipBlockComment: function () {
            for (var a = this.ptr, b = this.text[this.ptr], c = !1; b && !(c && b === "/");) c = b === "*", b = this.text[++this.ptr];
            b || this.fail("Expected end of block comment", a);
            ++this.ptr
        },
        skipUntil: function (a) {
            for (var b = this.ptr; this.next().type !== a;) this.current.type ===
                "" && this.fail("Expected: " + a + "(Unexpected end of data)", b)
        },
        expectToken: function (a) {
            this.next().type !== a && this.fail("Expected: " + a)
        },
        extractWord: function () {
            for (var a = this.ptr, b = this.text[this.ptr]; b && "{}[]=; \t\r\n/".indexOf(b) === -1;) b = this.text[++this.ptr];
            this.current.type = "word";
            this.current.value = this.text.substring(a, this.ptr)
        },
        extractString: function () {
            var a = this.text.indexOf('"', this.ptr + 1);
            this.current.type = "string";
            this.current.value = this.text.substring(this.ptr + 1, a - 1);
            this.ptr = a + 1
        },
        next: function () {
            this.skipWhitespace();
            for (var a = this.text[this.ptr]; a === "/";) a = this.text[++this.ptr], a === "/" ? (++this.ptr, this.skipLineComment()) : a === "*" ? (++this.ptr, this.skipBlockComment()) : this.fail("Expecting // or /*", this.ptr - 1), this.skipWhitespace(), a = this.text[this.ptr];
            this.current.ptr = this.ptr;
            this.ptr >= this.text.length ? (this.current.value = "", this.current.type = "") : "{}[]=;".indexOf(a) !== -1 ? (this.current.value = this.current.type = a, ++this.ptr) : a === '"' ? this.extractString() : this.extractWord();
            return this.current
        }
    };
    var h = {
        optional: "LABEL_OPTIONAL",
        required: "LABEL_REQUIRED",
        repeated: "LABEL_REPEATED"
    }, i = {
        "double": "TYPE_DOUBLE",
        "float": "TYPE_FLOAT",
        int64: "TYPE_INT64",
        uint64: "TYPE_UINT64",
        int32: "TYPE_INT32",
        fixed64: "TYPE_FIXED64",
        fixed32: "TYPE_FIXED32",
        bool: "TYPE_BOOL",
        string: "TYPE_STRING",
        bytes: "TYPE_BYTES",
        uint32: "TYPE_UINT32",
        sfixed32: "TYPE_SFIXED32",
        sfixed64: "TYPE_SFIXED64",
        sint32: "TYPE_SINT32",
        sint64: "TYPE_SINT64"
    };
    c.parseFileDescriptor = function (c) {
        for (var c = new a(c), h = {
            message_type: [],
            enum_type: []
        }; c.next().type != "";) switch (c.current.value) {
            case "package":
            case "option":
                c.skipUntil(";");
                break;
            case "message":
                h.message_type.push(d(c));
                break;
            case "enum":
                h.enum_type.push(b(c));
                break;
            default:
                c.fail("Unrecognized proto token: " + c.current.value)
        }
        return h
    };
    c.FieldDescriptorProto = g;
    return c
}();
Spotify.Protobuf.Serialization = function () {
    function g() {
        this._data = []
    }
    function f(a, b, c) {
        this._data = a;
        this._ptr = b;
        this._end = this._ptr + c
    }
    function d(a, b, c, h) {
        switch (b.type) {
            case "int32":
                h.writeVarint(b.id << 3 | 0);
                h.writeVarint(c);
                break;
            case "uint32":
                h.writeVarint(b.id << 3 | 0);
                h.writeVarint(~~c);
                break;
            case "sint32":
                h.writeVarint(b.id << 3 | 0);
                h.writeVarint(c << 1 ^ c >> 31);
                break;
            case "int64":
            case "uint64":
                h.writeVarint(b.id << 3 | 0);
                h.writeVarint64(Math.floor(c / 4294967296), ~~c);
                break;
            case "sint64":
                h.writeVarint(b.id << 3 | 0);
                b = Math.abs(c) - (c < 0);
                h.writeVarint64(Math.floor(b / 2147483648), (b << 1) + (c < 0));
                break;
            case "bool":
                h.writeVarint(b.id << 3 | 0);
                h.writeVarint(c ? 1 : 0);
                break;
            case "string":
                h.writeVarint(b.id << 3 | 2);
                b = [];
                for (a = 0; a < c.length; ++a) {
                    var i = c.charCodeAt(a);
                    if (i < 128) b.push(i);
                    else {
                        if ((i & 64512) === 55296) var f = c.charCodeAt(++a),
                            i = ((i & 1023) << 10 | f & 1023) + 65536;
                        i < 2048 ? b.push(192 | i >> 6) : (i < 65536 ? b.push(224 | i >> 12) : (b.push(240 | i >> 18), b.push(128 | i >> 12 & 63)), b.push(128 | i >> 6 & 63));
                        b.push(128 | i & 63)
                    }
                }
                c = b;
                h.writeVarint(c.length);
                h.writeAll(c);
                break;
            case "bytes":
                h.writeVarint(b.id << 3 | 2);
                b = [];
                for (a = 0; a < c.length; ++a) b.push(c.charCodeAt(a));
                c = b;
                h.writeVarint(c.length);
                h.writeAll(c);
                break;
            case "*":
                for (i = 0; i < c.length; ++i) d(a, b.subField, c[i], h);
                break;
            case "#":
                b.enumMap.toNumber.hasOwnProperty(c);
                c = b.enumMap.toNumber[c];
                h.writeVarint(b.id << 3 | 0);
                h.writeVarint(c);
                break;
            default:
                if (a.hasOwnProperty(b.type)) i = new g, a[b.type].serializeToStream(c, i), h.writeVarint(b.id << 3 | 2), h.writeVarint(i._data.length), h.writeAll(i._data);
                else throw "Unsupported type";
        }
    }
    function b(a) {
        for (var b = [], c = 0; c < a.length;) {
            var h = a.charCodeAt(c++);
            if (h < 128) b.push(a[c - 1]);
            else {
                var i;
                h < 224 ? (h &= -225, i = 2) : h < 240 ? (h &= -241, i = 3) : (h &= -249, i = 4);
                for (; --i && c < a.length;) var d = a.charCodeAt(c++),
                    h = h << 6 | d & -193;
                h < 65536 ? b.push(String.fromCharCode(h)) : (h -= 65536, b.push(String.fromCharCode(55296 | h >> 10, 56320 | h & 1023)))
            }
        }
        return b.join("")
    }
    function c(a) {
        return decodeURIComponent(escape(a))
    }
    function a(b, c) {
        var h = c.name;
        switch (c.type) {
            case "int32":
                return function (a, b, c, i) {
                    return a === 0 ? (c[h || i] = ~~b.readVarint(), !0) : !1
                };
            case "uint32":
                return function (a, b, c, i) {
                    return a === 0 ? (c[h || i] = b.readVarint(), !0) : !1
                };
            case "sint32":
                return function (a, b, c, i) {
                    return a === 0 ? (a = h || i, b = b.readVarint(), c[a] = b >>> 1 ^ -(b & 1), !0) : !1
                };
            case "int64":
                return function (a, b, c, i) {
                    return a === 0 ? (a = b.readVarint64(), c[h || i] = a.hi * 4294967296 + ((a.lo >>> 1) * 2 + (a.lo & 1)), !0) : !1
                };
            case "uint64":
                return function (a, b, c, i) {
                    return a === 0 ? (a = b.readVarint64(), c[h || i] = ((a.hi >>> 1) * 2 + (a.hi & 1)) * 4294967296 + ((a.lo >>> 1) * 2 + (a.lo & 1)), !0) : !1
                };
            case "sint64":
                return function (a,
                b, c, i) {
                    return a === 0 ? (a = b.readVarint64(), b = ((a.hi >>> 1) * 2 + (a.hi & 1)) * 2147483648 + (a.lo >>> 1), c[h || i] = a.lo & 1 ? -1 - b : b, !0) : !1
                };
            case "bool":
                return function (a, b, c, i) {
                    return a === 0 ? (c[h || i] = b.readVarint() !== 0, !0) : !1
                };
            case "string":
                return function (a, b, c, i) {
                    return a === 2 ? (a = b.readVarint(), c[h || i] = q(b.bytes(a)), !0) : !1
                };
            case "bytes":
                return function (a, b, c, i) {
                    return a === 2 ? (a = b.readVarint(), c[h || i] = b.bytes(a), !0) : !1
                };
            case "*":
                var i = a(b, c.subField);
                return h ? function (a, b, c) {
                    c = c[h] ? c[h] : c[h] = [];
                    return i(a, b, c, c.length)
                } : function (a, b, c, h) {
                    c = c[h] ? c[h] : c[h] = [];
                    return i(a, b, c, c.length)
                };
            case "#":
                var d = c.enumMap.toName;
                return function (a, b, c, i) {
                    return a === 0 ? (a = b.readVarint(), c[h || i] = d.hasOwnProperty(a) ? d[a] : a, !0) : !1
                }
        }
        return function (a, i, d, f) {
            return a === 2 ? (a = i.readVarint(), i = i.substream(a), b[c.type].parseFromStream(i, d[h || f] = {}), !0) : !1
        }
    }
    function h(b) {
        for (var c = this, h = 0; h < b.length; ++h)(function (b) {
            for (var h = [], i = {}, l = b.fields, m = 0; m < l.length; ++m) {
                var n = l[m];
                if (n.type[0] === "*") var o = {
                    type: n.type.substr(1),
                    id: n.id,
                    enumMap: n.enumMap
                },
                n = {
                    type: "*",
                    id: n.id,
                    name: n.name,
                    subField: o
                };
                h[n.id] = a(c, n);
                i[n.name] = n
            }
            c[b.name] = {
                serializeToStream: function (a, b) {
                    for (var h in a) i.hasOwnProperty(h) && d(c, i[h], a[h], b)
                },
                parseFromStream: function (a, c) {
                    for (; !a.empty();) {
                        var i = a.readVarint(),
                            d = i >>> 3;
                        i &= 7;
                        var f = h[d];
                        try {
                            if (!f || !f(i, a, c)) switch (f = a, i) {
                                case 0:
                                    f.skipVarint();
                                    break;
                                case 1:
                                    f.skip(8);
                                    break;
                                case 2:
                                    var l = f.readVarint();
                                    f.skip(l);
                                    break;
                                case 3:
                                case 4:
                                    throw "Deprecated wire type";
                                case 5:
                                    f.skip(4);
                                    break;
                                default:
                                    throw "Unsupported wire type";
                            }
                        } catch (g) {
                            throw k.error("Spotify.Protobuf.Serialization", ["Error in", b, d, i], "corejs"), g;
                        }
                    }
                },
                serializeToString: function (a, b) {
                    b(serializeToStringSync(a))
                },
                serializeToStringSync: function (a) {
                    var h = new g;
                    c[b.name].serializeToStream(a, h);
                    return h.toString()
                },
                parseFromString: function (a, b) {
                    b(parseFromStringSync(a))
                },
                parseFromStringSync: function (a) {
                    var a = new f(a, 0, a.length),
                        h = {};
                    c[b.name].parseFromStream(a, h);
                    return h
                }
            }
        })(b[h])
    }
    function i(a, b, c, h) {
        var i = null;
        a.type_name ? (i = a.type_name, i = c.hasOwnProperty(h + i) ? c[h + i] : c.hasOwnProperty(i) ? c[i] : null, b = i ? b ? "int32" : "#" : a.type_name) : b = s[a.type];
        return {
            id: a.number,
            type: (a.label === "LABEL_REPEATED" ? "*" : "") + b,
            name: a.name,
            typeName: a.type_name,
            enumMap: i
        }
    }
    function l(a, b, c, h) {
        for (var d = {
            name: a.name,
            fields: []
        }, f = 0; f < a.field.length; ++f) d.fields.push(i(a.field[f], b, c, h + a.name + "."));
        return d
    }
    function m(a, b, c) {
        for (var h = 0; h < a.length; ++h) {
            for (var i = c + a[h].name, d = b, f = i, l = a[h].value, g = {}, m = {}, k = 0; k < l.length; ++k) {
                var n = l[k];
                g[n.number] = n.name;
                m[n.name] = n.number
            }
            d[f] = {
                name: i,
                toName: g,
                toNumber: m
            }
        }
    }
    function n(a, b, c) {
        for (var h = 0; h < a.length; ++h) {
            var i = c + a[h].name + ".";
            n(a[h].nested_type, b, i);
            m(a[h].enum_type, b, i)
        }
    }
    var o = {}, k = Spotify.DebuggerJS;
    g.prototype.write = function (a) {
        this._data.push(a)
    };
    g.prototype.writeAll = function (a) {
        Array.prototype.push.apply(this._data, a)
    };
    g.prototype.writeVarint = function (a) {
        for (; a & -128;) this.write(a & 127 | 128), a >>>= 7;
        this.write(a)
    };
    g.prototype.writeVarint64 = function (a, b) {
        a ? (this.write(b & 127 | 128), this.write(b >>> 7 & 127 | 128), this.write(b >>> 14 & 127 | 128), this.write(b >>> 21 & 127 | 128), a & -8 ? (this.write((a << 4 | b >>> 28) & 127 | 128), this.writeVarint(a >>> 3)) : this.write((a << 4 | b >>> 28) & 127)) : this.writeVarint(b)
    };
    g.prototype.toString = function () {
        var a;
        a = this._data;
        if (a.length < p) a = String.fromCharCode.apply(String, a);
        else {
            var b = 0,
                c = [];
            do c.push(String.fromCharCode.apply(String, a.slice(b, b + p))), b += p;
            while (b < a.length);
            a = c.join("")
        }
        return a
    };
    f.prototype.empty = function () {
        return this._ptr >= this._end
    };
    f.prototype.skipVarint = function () {
        for (; this._data.charCodeAt(this._ptr++) >= 128;);
    };
    f.prototype.readVarint = function () {
        var a = 0,
            b = 1;
        do {
            var c = this._data.charCodeAt(this._ptr++);
            a += (c & 127) * b;
            b *= 128
        } while (c >= 128);
        return a
    };
    f.prototype.readVarint64 = function () {
        var a = 0,
            b = 1 / 4294967296,
            c = 0,
            h = 1;
        do {
            var i = this._data.charCodeAt(this._ptr++);
            a |= (i & 127) * b;
            c |= (i & 127) * h;
            b *= 128;
            h *= 128
        } while (i >= 128);
        return {
            hi: a,
            lo: c
        }
    };
    f.prototype.skip = function (a) {
        this._ptr += a
    };
    f.prototype.substream = function (a) {
        var b = this._ptr;
        this._ptr += a;
        return new f(this._data, b, a)
    };
    f.prototype.bytes = function (a) {
        var b = this._ptr;
        this._ptr += a;
        return this._data.substr(b, a)
    };
    var p = 4096,
        q = decodeURIComponent && escape ? c : b,
        s = {
            TYPE_INT32: "int32",
            TYPE_SINT32: "sint32",
            TYPE_UINT32: "uint32",
            TYPE_STRING: "string",
            TYPE_BYTES: "bytes",
            TYPE_BOOL: "bool",
            TYPE_DOUBLE: "double",
            TYPE_INT64: "int64",
            TYPE_UINT64: "uint64",
            TYPE_SINT64: "sint64"
        };
    o.createFromJson = function (a) {
        return new h(a)
    };
    o.createFromFileDescriptor = function (a, b) {
        var c = b === void 0 ? !1 : b,
            i = [],
            d = {};
        m(a.enum_type, d, "");
        n(a.message_type, d, "");
        for (var f = 0; f < a.message_type.length; ++f) i.push(l(a.message_type[f], c, d, ""));
        return new h(i)
    };
    return o
}();
(function () {
    var g = [].slice;
    if (!("bind" in Function.prototype)) Function.prototype.bind = function (d) {
        var b = this,
            c = null;
        arguments.length > 1 && (c = g.call(arguments, 1));
        return function () {
            var a;
            !arguments.length && !c ? a = b.call(d) : b.apply(d, !c ? arguments : !arguments.length ? c : c.concat(g.call(arguments)));
            return a
        }
    };
    if (!("indexOf" in Array.prototype)) Array.prototype.indexOf = function () {
        for (var d = this.length >>> 0, b = from < 0 ? Math.max(0, d + from) : from || 0; b < d; b++) if (this[b] === item) return b;
        return -1
    };
    var f;
    Spotify.Utils = {
        isArray: Array.isArray || function (d) {
            return Object.prototype.toString.call(d) == "[object Array]"
        },
        isFunction: function (d) {
            return typeof d == "function"
        },
        toFixed: function (d, b) {
            var b = b || 0,
                c = d < 0,
                a = Math.pow(10, b),
                d = Math.round(d * a),
                h = String((c ? Math.ceil : Math.floor)(d / a)),
                c = String((c ? -d : d) % a),
                a = Array(Math.max(b - c.length, 0) + 1).join("0");
            return b ? h + "." + a + c : h
        },
        convertStringToXML: function (d) {
            if (window.DOMParser) return f = new DOMParser, f.parseFromString(d.replace(/\n/g, ""), "text/xml");
            else {
                var b = new ActiveXObject("Microsoft.XMLDOM");
                b.async = !1;
                return b.loadXML(d.replace(/\n/g, ""))
            }
        },
        convertXMLToJSON: function (d) {
            var b = {}, c = d.nodeType == 1 && d.attributes.length > 0,
                a = d.hasChildNodes();
            if (!c && !a) return d.data || "";
            if (c) {
                b["@attributes"] = {};
                for (c = 0; c < d.attributes.length; c++) {
                    var h = d.attributes.item(c);
                    b["@attributes"][h.nodeName] = h.nodeValue
                }
            }
            if (a) {
                if (d.childNodes.length == 1 && d.childNodes[0].nodeName == "#text") return d.childNodes[0].data;
                for (a = 0; a < d.childNodes.length; a++) h = d.childNodes[a], c = h.nodeName, h = this.convertXMLToJSON(h), c != "#text" && (typeof b[c] ===
                    "undefined" ? b[c] = h : (this.isArray(b[c]) || (b[c] = Array(b[c])), b[c].push(h)))
            }
            return b
        },
        hex2str: function (d) {
            for (var b = [], c = 0, a = d.length; c < a - 1; c += 2) b.push(String.fromCharCode(parseInt(d.substr(c, 2), 16)));
            return b.join("")
        },
        str2hex: function (d) {
            for (var b = "", c = 0, a = d.length; c < a; ++c) b += (d.charCodeAt(c) + 256).toString(16).slice(-2);
            return b
        },
        parseURL: function (d) {
            for (var b = "source,protocol,authority,userInfo,user,password,host,port,relative,path,directory,file,query,anchor".split(","), d = RegExp("^(?:(?![^:@]+:[^:@/]*@)([^:/?#.]+):)?(?://)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:/?#]*)(?::(\\d*))?)(((/(?:[^?#](?![^?#/]*\\.[^?#/.]+(?:[?#]|$)))*/?)?([^?#/]*))(?:\\?([^#]*))?(?:#(.*))?)").exec(d),
            c = {}, a = 14; a--;) c[b[a]] = d[a] || "";
            c.queryKey = {};
            c[b[12]].replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function (a, b, d) {
                b && (c.queryKey[b] = d)
            });
            return c
        }
    }
})();
Spotify.Utils.Base62 = function () {
    function g(a, b, c) {
        for (var d = [0], f = [1], g = 0; g < a.length; ++g) {
            for (var k = d, p = f, q = a[g], s = c, t = 0, y = 0; y < p.length; ++y) t = ~~k[y] + p[y] * q + t, k[y] = t % s, t = ~~ (t / s);
            for (; t;) t = ~~k[y] + t, k[y] = t % s, t = ~~ (t / s), ++y;
            k = f;
            p = b;
            q = c;
            for (s = y = 0; s < k.length; ++s) y = k[s] * p + y, k[s] = y % q, y = ~~ (y / q);
            for (; y;) k.push(y % q), y = ~~ (y / q)
        }
        return d
    }
    function f(a, b) {
        for (var c = 0, d = []; c < a.length; ++c) d.push(b[a[c]]);
        return d.reverse()
    }
    function d(a, b) {
        for (; a.length < b;) a.push(0);
        return a
    }
    for (var b = {}, c = {}, a = 0; a < 62; ++a) c["0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ" [a]] = a;
    for (a = 0; a < 16; ++a) b["0123456789abcdef" [a]] = a;
    for (a = 0; a < 16; ++a) b["0123456789ABCDEF" [a]] = a;
    return {
        fromBytes: function (a, b) {
            var c = g(a.slice(0).reverse(), 256, 62);
            return f(d(c, b), "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ").join("")
        },
        toBytes: function (a, b) {
            var l = g(f(a, c), 62, 256);
            return d(l, b).reverse()
        },
        toHex: function (a, b) {
            var l = g(f(a, c), 62, 16);
            return f(d(l, b), "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ").join("")
        },
        fromHex: function (a, c) {
            var l = g(f(a, b), 16, 62);
            return f(d(l,
            c), "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ").join("")
        }
    }
}();
Spotify.Utils.Base64 = function () {
    for (var g = [], f = 0; f < 256; ++f) g[f] = 255;
    for (f = 0; f < 64; ++f) g["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charCodeAt(f)] = f;
    var d = String.fromCharCode.apply(String, g);
    return {
        encode: function (b) {
            var c, a, h, i, d, f;
            h = b.length;
            a = 0;
            for (c = ""; a < h;) {
                i = b.charCodeAt(a++) & 255;
                if (a == h) {
                    c += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(i >> 2);
                    c += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt((i & 3) << 4);
                    c += "==";
                    break
                }
                d = b.charCodeAt(a++);
                if (a == h) {
                    c += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(i >> 2);
                    c += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt((i & 3) << 4 | (d & 240) >> 4);
                    c += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt((d & 15) << 2);
                    c += "=";
                    break
                }
                f = b.charCodeAt(a++);
                c += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(i >> 2);
                c += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt((i & 3) << 4 | (d & 240) >> 4);
                c += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt((d & 15) << 2 | (f & 192) >> 6);
                c += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(f & 63)
            }
            return c
        },
        decode: function (b) {
            for (var c = [], a = b.length, h, i, f = 0;;) {
                do h = d.charCodeAt(b.charCodeAt(f++) & 255);
                while (h === 255 && f < a);
                do i = d.charCodeAt(b.charCodeAt(f++) & 255);
                while (i === 255 && f < a);
                if (i === 255) break;
                c.push((h << 2 | i >> 4) & 255);
                do h = d.charCodeAt(b.charCodeAt(f++) & 255);
                while (h === 255 && f < a);
                if (h === 255) break;
                c.push((i << 4 | h >> 2) & 255);
                do i = d.charCodeAt(b.charCodeAt(f++) & 255);
                while (i === 255 && f < a);
                if (i === 255) break;
                c.push((h << 6 | i) & 255)
            }
            if (c.length < 4096) c = String.fromCharCode.apply(String, c);
            else {
                b = 0;
                a = [];
                do a.push(String.fromCharCode.apply(String, c.slice(b, b + 4096))), b += 4096;
                while (b < c.length);
                c = a.join("")
            }
            return c
        }
    }
}();
Spotify.Heartbeat = function (g) {
    var f = new Spotify.Events,
        d = null,
        b;
    this.initialize = function () {
        b = this;
        g.bind(f.ON_TRY_TO_CONNECT, i, b);
        g.bind(f.DISCONNECTED, i, b);
        g.bind(f.CONNECTED, l, b)
    };
    this.start = function () {
        this.stop();
        d = setInterval(h, 18E4)
    };
    this.stop = function () {
        d !== null && (clearInterval(d), d = null)
    };
    var c = function () {}, a = function () {}, h = function () {
        g.rpc("echo", "h", c, a, b, !1, 0, "heartbeat")
    }, i = function () {
        this.stop()
    }, l = function () {
        this.start()
    }
};
Spotify.Gateway = function (g) {
    Spotify.EventTarget.call(this);
    var f = Spotify.DebuggerJS,
        d = new Spotify.Logging.Logger,
        b = new Spotify.Events,
        c = [],
        a = 0,
        h = this;
    this.bridge = null;
    var i, l, m = !1,
        n, o;
    this.isConnected = !1;
    this.rpc = function (a, c, h, d, g, k, o, p) {
        h = i.addCall(a, c, h, d, g, k, o, p);
        f.log("Spotify.Gateway", ["Call with method", a, "calltype", p, "params", c, "and request id", h, "was executed"], "corejs");
        this.isConnected ? m ? n.addToBucket(h) : this.bridge.rpc(a, c, h) : (k ? i.setPersistent(h, !0) : i.setPersistent(h, !1), l.reset(), this.trigger(b.DISCONNECTED))
    };
    this.disconnect = function () {
        this.bridge.disconnect()
    };
    this.connect = function (a) {
        this.bridge.connect(a, x())
    };
    var k = function () {
        this.isConnected = !0
    }, p = function (a) {
        f.log("Spotify.Gateway", ["onTimeout", a], "corejs")
    }, q = function (a) {
        h.trigger(b.HERMES_B64_MESSAGE, a.params)
    }, s = function () {
        h.trigger(b.USER_INFO_CHANGE)
    }, t = function () {
        this.trigger(b.CONNECTED);
        for (var a = 0, c = i.getPersistentCalls(), d = c.length, f; a < d; a++) f = c[a], h.rpc(f.method, f.params, f.callback, f.errback, f.context, f.persistent);
        a = 0;
        c = i.getCalls();
        for (d = c.length; a < d; a++) f = c[a], f.method !== "work_done" && h.rpc(f.method, f.params, f.callback, f.errback, f.context, f.persistent, f.retries--)
    }, y = function () {
        this.isConnected = !1
    }, w = function () {
        h.trigger(b.ON_TRY_TO_CONNECT)
    }, v = function () {
        h.trigger(b.DISCONNECTED)
    }, x = function () {
        var b = c[a];
        a < c.length - 1 ? a++ : a = 0;
        return b
    }, D = function (a) {
        var b = i.getCall(a.params.requestId),
            c, h = 0;
        try {
            h = JSON.stringify(a.params.response).length
        } catch (l) {}
        typeof b !== "undefined" && (c = (new Date).getTime() - b.timestamp, f.log("Spotify.Gateway", ["Latency of call with request id", a.params.requestId, "is", c, "ms"], "corejs"), b.callback.call(b.context, a.params), b.callType !== "request_time" && b.callType !== "userdata" && b.callType !== "log_view" && b.callType !== "track_end" && b.callType !== "track_progress" && b.callType !== "log_ad" && b.callType !== "log_ce" && d.logRequestTime(b.callType, c, c, h, !1))
    }, A = function (a) {
        var b = [],
            c = !0,
            l = 0;
        try {
            l = JSON.stringify(a.params.response).length
        } catch (g) {}
        f.error("Spotify.Gateway", ["Got an RPC Error", a], "corejs");
        if (typeof a.params.response !==
            "undefined") b = a.params.response;
        if (b.length >= 3 && (b[0] === Spotify.Errors.Domains.HERMES_ERROR || b[0] === Spotify.Errors.Domains.HERMES_SERVICE_ERROR) && (b[1] === Spotify.Errors.Codes.HM_TOO_MANY_REQUESTS || b[1] === Spotify.Errors.Codes.HM_FAILED_TO_SEND_TO_BACKEND)) c = !1;
        var c = i.getCall(a.params.requestId, c),
            k;
        typeof c !== "undefined" && (k = (new Date).getTime() - c.timestamp, f.log("Spotify.Gateway", ["Latency of call with request id", a.params.requestId, "is", k, "ms"], "corejs"), b.length >= 3 ? (b[0] === Spotify.Errors.Domains.HERMES_ERROR || b[0] === Spotify.Errors.Domains.HERMES_SERVICE_ERROR) && b[1] === Spotify.Errors.Codes.HM_TOO_MANY_REQUESTS ? (m = !0, n.start(), n.addToBucket(a.params.requestId)) : (b[0] === Spotify.Errors.Domains.HERMES_ERROR || b[0] === Spotify.Errors.Domains.HERMES_SERVICE_ERROR) && (b[1] === Spotify.Errors.Codes.HM_TIMEOUT || b[1] === Spotify.Errors.Codes.HM_FAILED_TO_SEND_TO_BACKEND) && c.retries > 0 ? h.rpc(c.method, c.params, c.callback, c.errback, c.context, c.persistent, c.retries - 1, c.callType) : (b.push(a.params.method), c.errback.call(c.context,
        new Spotify.Errors.Error(b))) : (f.log("Spotify.Gateway", ["RPC Error callback for method with id:", c.callType, c.params], "corejs"), c.errback.call(c.context, new Spotify.Errors.Error([1, 0, "", a.params]))), c.callType !== "request_time" && c.callType !== "userdata" && c.callType !== "log_view" && c.callType !== "track_end" && c.callType !== "track_progress" && c.callType !== "log_ad" && c.callType !== "log_ce" && d.logRequestTime(c.callType, k, k, l, !0))
    }, u = function () {
        h.trigger(b.READY)
    }, C = function (a) {
        this.trigger(a.type, a.params)
    }, J = function () {
        h.trigger(b.TOKEN_LOST)
    }, G = function (a) {
        var a = a.params,
            b = i.getCall(a, !1);
        f.log("Spotify.Gateway", ["onRateLimitCall Will try run the callback with id", a, b], "corejs");
        b && h.bridge.rpc(b.method, b.params, a)
    }, F = function () {
        m = !1
    };
    this.dispose = function () {};
    this.initialize = function (a, f) {
        d.init(this);
        i = new Spotify.CallsManager;
        c = f.connectionUri.split("|");
        n = new Spotify.RateLimiter(1E3, 90);
        n.bind(b.RATE_LIMIT_CALL, G, this);
        n.bind(b.RATE_LIMIT_DISABLED, F, this);
        if (g === Spotify.GatewayTypes.FLASH) this.bridge = new Spotify.Flash.Bridge(a, f);
        else if (g === Spotify.GatewayTypes.WEBSOCKETS) this.bridge = new Spotify.WebSockets.Bridge(a);
        this.bridge.bind(b.CONNECTION_ESTABLISHED, k, this);
        this.bridge.bind(b.FAILED_CONNECTING, y, this);
        this.bridge.bind(b.RPC_CALLBACK, D, this);
        this.bridge.bind(b.RPC_ERRBACK, A, this);
        this.bridge.bind(b.TOKEN_LOST, J, this);
        this.bridge.bind(b.HERMES_B64_MESSAGE, q, this);
        this.bridge.bind(b.USER_INFO_CHANGE, s, this);
        this.bridge.bind(b.LOGIN_COMPLETE, t, this);
        this.bridge.bind(b.TIMEOUT, p, this);
        this.bridge.bind(b.READY,
        u, this);
        this.bridge.bind(b.FLASH_AVAILABLE, C, h);
        this.bridge.bind(b.FLASH_UNAVAILABLE, C, h);
        l = new Spotify.ConnectionManager;
        l.bind(b.ON_TRY_TO_CONNECT, w, this);
        l.bind(b.NOTIFY_OF_DISCONNECT, v, this);
        l.initialize(this.bridge);
        o = new Spotify.CodeValidator;
        o.initialize(this, this.bridge);
        this.bridge.initialize()
    }
};
Spotify.Audio.AudioStream = function (g, f, d) {
    Spotify.EventTarget.call(this);
    this.id = g;
    this.lid = "";
    this.isReady = !0;
    this.isPreview = this.isAd = !1;
    this.trackUrl = this.trackUri = "";
    this.bitrate = 160;
    this.audiocodec = "mp3";
    this.isPaused = this.isPlaying = !1;
    this.isStopped = !0;
    this.isActive = this.isLoaded = !1;
    this.limit = -1;
    var b = 0,
        c = 0,
        a = -1,
        h, i = {}, l = 1,
        m = this,
        n = Spotify.DebuggerJS;
    new Spotify.Logging.Logger;
    var o = new Spotify.Events,
        k = "",
        p = 0,
        q = !1,
        s = 1,
        t = 0,
        y = 0,
        w = {
            uri: "",
            position: 0,
            autoplay: !1
        }, v = function (a) {
            n.log("Spotify.Audio.AudioStream", ["Player event:", m.id, a], "corejs");
            switch (a.type) {
                case o.READY:
                    m.isReady = !0;
                    if (w.uri !== "") n.log("Spotify.Audio.AudioStream", ["Need to resume playback for player", m.id, w], "corejs"), m.load(w.uri, w.position, w.autoplay), y = w.position, w.uri = "", w.position = 0, w.autoplay = !1;
                    break;
                case o.NOT_READY:
                    m.isReady = !1;
                    u();
                    if (m.isPlaying || m.isPaused) if (w.uri = m.trackUri, w.position = y, w.autoplay = !0, m.isPaused) w.autoplay = !1;
                    break;
                case o.DURATION:
                    t = a.params;
                    n.log("Spotify.Audio.AudioStream", ["Got duration", a.params], "corejs");
                    break;
                case o.LOAD:
                    C();
                    m.isPaused = !0;
                    m.isStopped = !1;
                    m.isPlaying = !1;
                    m.isLoaded = !0;
                    m.onLoad(a);
                    break;
                case o.PLAYING:
                    u();
                    h = setInterval(J, 500);
                    m.isPaused = !1;
                    m.isStopped = !1;
                    m.isPlaying = !0;
                    m.isActive || m.trigger(o.ACTIVE_PLAYER_CHANGED, {
                        id: m.id
                    });
                    m.onPlay(a);
                    break;
                case o.PAUSED:
                    u();
                    m.isPaused = !0;
                    m.isStopped = !1;
                    m.isPlaying = !1;
                    m.onPause(a);
                    break;
                case o.STOPPED:
                    m.isPaused = !1;
                    m.isStopped = !0;
                    m.isPlaying = !1;
                    m.isLoaded = !1;
                    m.onStop(a);
                    C();
                    break;
                case o.POSITION_CHANGED:
                    m.onPositionChanged(a);
                    break;
                case o.TRACK_ENDED:
                    C();
                    m.isPaused = !1;
                    m.isStopped = !0;
                    m.isPlaying = !1;
                    m.onTrackEnded(a);
                    break;
                case o.SONG_LOADED:
                    m.onSongLoaded(a);
                    break;
                case o.CANNOT_PLAY_TRACK:
                    C();
                    m.isLoaded = !1;
                    m.onInvalidTrackUri(a);
                    break;
                case o.PLAYBACK_FAILED:
                    C();
                    m.isStopped = !0;
                    m.isPaused = !1;
                    m.isPlaying = !1;
                    m.isLoaded = !1;
                    m.onPlaybackFailed(a);
                    break;
                case o.INVALID_TRACK_URI:
                    C(), m.onPlaybackFailed(a)
            }
        }, x = function (a) {
            a.extra.id === m.id && m.trigger(a.type, a.params)
        };
    this.load = function (b, c, h, d, l) {
        if (!this.isReady && f === Spotify.PlayerTypes.FLASH_RTMPS) w.uri = b,
        w.position = c, w.autoplay = h;
        else {
            (m.isPaused || m.isPlaying) && m.stop();
            n.log("Spotify.Audio.AudioStream", ["Load track", b], "corejs");
            var g, s = new Spotify.Link.fromString(b);
            this.limit = typeof d !== "undefined" ? d : -1;
            a = typeof l !== "undefined" ? l : -1;
            this.isAd = this.isPreview = !1;
            if (s.type === "file") this.isPreview = !0, this.isAd = !1;
            else if (s.type === "ad") this.isPreview = !1, this.isAd = !0;
            this.trigger(o.TRACK_PLAY_REQUEST, {
                timestamp: (new Date).getTime()
            });
            p = c || 0;
            q = typeof h === "undefined" ? !1 : h;
            k = b;
            g = this.isAd ? i[Spotify.Resolvers.AD_RESOLVER] : this.isPreview ? i[Spotify.Resolvers.PREVIEW_RESOLVER] : i[Spotify.Resolvers.STORAGE_RESOLVER];
            g.onReady(function () {
                try {
                    g.list(b, f === Spotify.PlayerTypes.FLASH_RTMPS ? "rtmp" : "", D, A)
                } catch (a) {
                    n.error("Spotify.Audio.AudioStream", [a.message, a.stack], "corejs")
                }
            }, this)
        }
    };
    var D = function (a) {
        m.lid = a.lid;
        m.trackUrl = a.uri;
        m.trackUri = k;
        n.log("Spotify.Audio.AudioStream", ["Got a result from the resolver", a], "corejs");
        d.load(m.id, m.trackUrl, {
            autoplay: q,
            startFrom: p,
            server: a.server,
            protocol: a.protocol
        });
        q && (f !== Spotify.PlayerTypes.FLASH_RTMPS && m.play(p, m.limit), q = !1, p = 0)
    }, A = function (a) {
        m.lid = "";
        m.trackUrl = "";
        k = m.trackUri = "";
        p = 0;
        m.trigger(o.INVALID_TRACK_URI, a)
    }, u = function () {
        h && (clearInterval(h), h = null);
        c = 0
    }, C = function () {
        u();
        b = 0
    }, J = function () {
        var h = (new Date).getTime(),
            i = h - (c === 0 ? h - 500 : c),
            f = d.getPlayerState(m.id);
        y = f.position;
        t = f.duration;
        f.isPlaying = m.isPlaying;
        f.isStopped = m.isStopped;
        f.isPaused = m.isPaused;
        var l = f.duration;
        c = h;
        m.trigger(o.PLAYER_STATE, {
            state: f,
            interval: i
        });
        n.log("Spotify.Audio.AudioStream", ["Tracking state:", f, i], "corejs");
        if (m.limit !== -1) l = m.limit;
        y >= l - a && a !== -1 && (a = -1, n.log("Spotify.Audio.AudioStream", ["BEFORE_END event", f.position, f.duration], "corejs"), m.trigger(o.BEFORE_END));
        b += i;
        b >= m.limit && m.limit !== -1 && (m.trigger(o.TRACK_ENDED), m.stop())
    };
    this.play = function (a, b) {
        if (typeof b !== "undefined" && b !== -1) this.limit = b;
        m.isReady && d.play(this.id, a)
    };
    this.pause = function () {
        m.isPlaying && d.pause(this.id)
    };
    this.resume = function () {
        !m.isPlaying && m.isPaused && m.isLoaded && d.resume(this.id)
    };
    this.stop = function () {
        if (m.isLoaded) a = this.limit = -1, d.stop(this.id)
    };
    this.playpause = function () {
        m.isPaused ? m.resume() : m.pause()
    };
    this.position = function () {
        return m.isLoaded ? y = d.position(this.id) : 0
    };
    this.getPlayerState = function () {
        var a = {};
        a.volume = s;
        a.position = m.isLoaded ? y : 0;
        a.duration = m.isLoaded ? t : 0;
        a.isPlaying = this.isPlaying;
        a.isStopped = this.isStopped;
        a.isPaused = this.isPaused;
        return a
    };
    this.seek = function (a) {
        return m.isLoaded ? (y = a, d.seek(this.id, a)) : 0
    };
    this.setVolume = function (a) {
        !isNaN(a) && a >= 0 && a <= 1 && (s = a, d.setVolume(this.id, a * l))
    };
    this.setMasterVolume = function (a) {
        !isNaN(a) && a >= 0 && a <= 1 && (l = a, this.setVolume(s))
    };
    this.getVolume = function () {
        return s
    };
    this.getDuration = function () {
        return t
    };
    this.addFileResolver = function (a, b) {
        i[a] = b
    };
    this.initialize = function () {
        f === Spotify.PlayerTypes.HTML5_HTTP && (d.bind(o.TRACK_ENDED, x), d.bind(o.POSITION_CHANGED, x), d.bind(o.PLAYING, x), d.bind(o.PAUSED, x), d.bind(o.STOPPED, x), d.bind(o.LOAD, x));
        this.bind(o.TRACK_ENDED, v, this, 10);
        this.bind(o.POSITION_CHANGED, v, this, 10);
        this.bind(o.PLAYING, v, this, 10);
        this.bind(o.PAUSED, v, this,
        10);
        this.bind(o.STOPPED, v, this, 10);
        this.bind(o.CANNOT_PLAY_TRACK, v, this, 10);
        this.bind(o.PLAYBACK_FAILED, v, this, 10);
        this.bind(o.SONG_LOADED, v, this, 10);
        this.bind(o.INVALID_TRACK_URI, v, this, 10);
        this.bind(o.LOAD, v, this, 10);
        this.bind(o.READY, v, this, 10);
        this.bind(o.NOT_READY, v, this, 10);
        this.bind(o.TRACK_PLAY_REQUEST, v, this, 10);
        this.bind(o.DURATION, v, this, 10);
        d.initializePlayerById(this.id)
    };
    this.dispose = function () {
        f === Spotify.PlayerTypes.HTML5_HTTP && (d.unbind(o.TRACK_ENDED, x), d.unbind(o.POSITION_CHANGED,
        x), d.unbind(o.PLAYING, x), d.unbind(o.PAUSED, x), d.unbind(o.STOPPED, x), d.unbind(o.LOAD, x));
        this.unbind(o.TRACK_ENDED, v, this);
        this.unbind(o.POSITION_CHANGED, v, this);
        this.unbind(o.PLAYING, v, this);
        this.unbind(o.PAUSED, v, this);
        this.unbind(o.STOPPED, v, this);
        this.unbind(o.CANNOT_PLAY_TRACK, v, this);
        this.unbind(o.PLAYBACK_FAILED, v, this);
        this.unbind(o.SONG_LOADED, v, this);
        this.unbind(o.INVALID_TRACK_URI, v, this);
        this.unbind(o.LOAD, v, this);
        this.unbind(o.READY, v, this);
        this.unbind(o.NOT_READY, v, this);
        this.unbind(o.TRACK_PLAY_REQUEST,
        v, this);
        this.unbind(o.DURATION, v, this)
    };
    this.onLoad = function () {};
    this.onPlay = function () {};
    this.onPause = function () {};
    this.onStop = function () {};
    this.onTrackEnded = function () {};
    this.onSongLoaded = function () {};
    this.onPositionChanged = function () {};
    this.onInvalidTrackUri = function () {};
    this.onPlaybackFailed = function () {}
};
Spotify.Audio.AudioManager = function (g, f, d) {
    Spotify.EventTarget.call(this);
    var b = this,
        c = 1,
        a = {}, h, i = new Spotify.Events,
        l = new Spotify.Logging.Types,
        m = !1,
        n, o, k, p = [],
        q = [],
        s = 0,
        t, y, w = "",
        v = function (a) {
            this.trigger(a.type, a.params)
        }, x = function (a) {
            w = a.response.user;
            b.addPlayer("Player0");
            m = !0;
            b.trigger(i.READY)
        }, D = function () {}, A = function () {
            if (this.hasSound()) t.onReady(function () {
                t.getUserInfo(x, D)
            });
            else this.trigger(i.NO_SOUND_CAPABILITIES)
        }, u = function (a) {
            b.trigger(a.type, a.params, a.extra)
        }, C = function (a) {
            for (var b = 0, c = p.length; b < c; b += 1) {
                var h = p[b];
                h.id === a.params.id ? (h.isActive = !0, n = h) : h.isActive = !1
            }
        }, J = function () {}, G = function () {};
    this.onReady = function (a, c) {
        m ? a.call(c) : b.bind(i.READY, a, c)
    };
    var F = function (a) {
        b.trigger(a.type, a.params)
    };
    this.addPlayer = function (c, h) {
        var f, g;
        if (typeof c !== "string") throw Error("The id must be a string");
        typeof h === "undefined" && (h = d);
        f = 0;
        for (g = p.length; f < g; f += 1) if (p[f].id === c) throw Error("There is already a player with this id: " + c);
        k.addPlayer(s, c, h);
        f = p[s] = new Spotify.Audio.AudioStream(c,
        h, k);
        f.addFileResolver(Spotify.Resolvers.STORAGE_RESOLVER, a[Spotify.Resolvers.STORAGE_RESOLVER]);
        f.addFileResolver(Spotify.Resolvers.AD_RESOLVER, a[Spotify.Resolvers.AD_RESOLVER]);
        f.addFileResolver(Spotify.Resolvers.PREVIEW_RESOLVER, a[Spotify.Resolvers.PREVIEW_RESOLVER]);
        f.bind(i.ACTIVE_PLAYER_CHANGED, C);
        f.bind(i.TRACK_ENDED, u, b);
        f.bind(i.POSITION_CHANGED, u, b);
        f.bind(i.PLAYING, u, b);
        f.bind(i.PAUSED, u, b);
        f.bind(i.STOPPED, u, b);
        f.bind(i.INVALID_TRACK_URI, u, b);
        f.bind(i.PLAYBACK_FAILED, u, b);
        f.bind(i.TRACK_PLAY_REQUEST,
        u, b);
        f.bind(i.SONG_LOADED, u, b);
        f.bind(i.LOAD, u, b);
        f.initialize(y);
        var m = new Spotify.Logging.TrackEnd;
        m.init(o);
        var n = new Spotify.Logging.PreviewEnd;
        n.init();
        var t = new Spotify.Logging.TrackProgress;
        t.init(o);
        var v = new Spotify.Logging.TrackEvent;
        v.init(o);
        var x = new Spotify.Logging.AdEnd;
        x.init(o);
        g = q[s] = new Spotify.PlayerTracker(c, f, w);
        g.bind(i.RECORD_AD_EVENT, F, b);
        g.addLogger(l.TRACK_END, m);
        g.addLogger(l.PREVIEW_END, n);
        g.addLogger(l.TRACK_EVENT, v);
        g.addLogger(l.AD_END, x);
        g.addLogger(l.TRACK_PROGRESS,
        t);
        g.initialize();
        s++;
        this.trigger(i.PLAYER_CREATED, {
            id: c
        });
        return f
    };
    this.getPlayers = function () {
        return p
    };
    this.getActivePlayer = function () {
        return n
    };
    this.getPlayerById = function (a) {
        var b;
        if (typeof a === "string") for (var c = 0, h = p.length; c < h; c += 1) if (b = p[c], b.id === a) return b
    };
    this.getTrackerForPlayerWithId = function (a) {
        var b;
        if (typeof a === "string") for (var c = 0, h = q.length; c < h; c += 1) if (b = q[c], b.id === a) return b
    };
    this.getPlayerAtIndex = function (a) {
        if (typeof a === "number" && p[a]) return p[a]
    };
    this.getTrackerForPlayerAtIndex = function (a) {
        if (typeof a === "number" && q[a]) return q[a]
    };
    this.removePlayerById = function (a) {
        var b;
        if (typeof a === "string") {
            if (a === "Player0") return !1;
            for (var c = 0, h = p.length; c < h; c += 1) if (b = p[c], b.id === a && c !== 0) return this.removePlayerAtIndex(c);
            return !1
        }
    };
    this.removePlayerAtIndex = function (a) {
        if (typeof a !== "number") return !1;
        if (a === 0) return !1;
        return p[a] ? (p[a].isActive && (n = p[0]), p[a].dispose(), q[a].dispose(!0), delete p[a], delete q[a], p[a] = null, q[a] = null, k.removePlayerAtIndex(a)) : !1
    };
    this.hasSound = function () {
        return k.hasSound()
    };
    this.setMasterVolume = function (a) {
        c = a < 0 ? 0 : a > 1 ? 1 : a;
        for (var b = 0, h = p.length; b < h; b += 1) a = p[b], a.setMasterVolume(c)
    };
    this.getMasterVolume = function () {
        return c
    };
    this.crossfade = function (a, b, c, i) {
        h || (h = new Spotify.Audio.Crossfader);
        h.crossfade(this.getPlayerById(a), this.getPlayerById(b), c, i)
    };
    this.dispose = function () {
        for (var a, b = 0, c = p.length; b < c; b += 1) a = p[b], a !== null && a !== void 0 && (a.dispose(), a.isActive && q[b].dispose())
    };
    this.addFileResolver = function (b, c) {
        a[b] = c
    };
    this.getInterface = function () {
        return k
    };
    this.initialize = function (a, c, h) {
        y = h;
        t = c;
        o = a;
        o.bind(i.CONNECT, J);
        o.bind(i.DISCONNECT, G);
        d === Spotify.PlayerTypes.FLASH_HTTP || d === Spotify.PlayerTypes.FLASH_RTMPS || d === Spotify.PlayerTypes.FLASH_AAC ? (k = new Spotify.Flash.PlayerInterface(g, f), k.bind(i.FLASH_AVAILABLE, v, b), k.bind(i.FLASH_UNAVAILABLE, v, b)) : d === Spotify.PlayerTypes.HTML5_HTTP && (k = new Spotify.HTML5.PlayerInterface("html5audio"));
        k.bind(i.READY, A, this, 10);
        k.initialize()
    }
};
Spotify.Audio.Crossfader = function () {
    var g = this,
        f = Spotify.DebuggerJS,
        d, b, c = 1,
        a = !1,
        h = 0,
        i = 0,
        l, m;
    this.crossfade = function (n, o, k, p) {
        a ? (this.stop(), d(), d = null, m = l + (1 - (1 - h) + h) * k) : (o.setVolume(0), l = (new Date).getTime(), m = l + k, c = 1, h = 0);
        f.log("Spotify.Audio.Crossfader", ["Target volume", c], "corejs");
        a = !0;
        d = p;
        b = setInterval(function () {
            var b = (new Date).getTime();
            i = (m - b) / k;
            h = Math.floor((1 - i) * 100) / 100;
            var b = 1 - h,
                d = h,
                b = b > 1 ? 1 : b,
                d = d > 1 ? 1 : d,
                b = Math.floor((b < 0 ? 0 : b) * c * 100) / 100,
                d = Math.floor((d < 0 ? 0 : d) * c * 100) / 100;
            n.setVolume(b);
            o.setVolume(d);
            f.log("Spotify.Audio.Crossfader", [n.id, "will have volume", b, o.id, "will have volume", d], "corejs");
            h >= 1 && (a = !1, g.stop(), p())
        }, 100)
    };
    this.stop = function () {
        return b ? (clearInterval(b), b = null, !0) : !1
    }
};
Spotify.Flash.Bridge = function (g, f) {
    Spotify.EventTarget.call(this);
    var d = Spotify.DebuggerJS,
        b = new Spotify.Events;
    this.id = g;
    var c, a = function (a) {
        this.trigger(a.type, a.params)
    };
    this.rpc = function (a, b, f) {
        typeof c !== void 0 ? c.isLoaded ? c.getSWF().sp_rpc.apply(c.getSWF(), [a, f].concat(b)) : d.error("Bridge", ["Core.Bridge:rpc: Bridge is not initialized"], "corejs") : d.error("Bridge", ["Core.Bridge:rpc: Bridge is not initialized"], "corejs")
    };
    this.disconnect = function () {
        typeof c !== void 0 ? c.isLoaded ? c.getSWF().sp_disconnect.apply(c.getSWF()) : d.error("Bridge", ["Core.Bridge:Disconnect: Bridge is not initialized"], "corejs") : d.error("Bridge", ["Core.Bridge:Disconnect: Bridge is not initialized"], "corejs")
    };
    this.connect = function (a, b) {
        a = a || "";
        typeof c !== void 0 && c.isLoaded && c.getSWF().sp_connect.apply(c.getSWF(), [a, b])
    };
    this.initialize = function () {
        c = new Spotify.Flash.SWFObject({
            SWFFlashId: g,
            SWFContainerId: f.SWFContainerId,
            SWFUrl: f.SWFUrl,
            SWFMinVersion: f.SWFMinVersion,
            instanceId: g,
            logging: f.logging,
            length: f.valid,
            valid: 0
        });
        c.bind(b.FLASH_AVAILABLE,
        a, this);
        c.bind(b.FLASH_UNAVAILABLE, a, this);
        c.initialize()
    };
    this.getFlashObject = function () {
        return c
    }
};
Spotify.WebSockets.Bridge = function (g, f) {
    Spotify.EventTarget.call(this);
    var d = Spotify.DebuggerJS;
    this.id = g;
    var f = f || {}, b = this,
        c = new Spotify.Events,
        a = f.connectionParams || "",
        h, i = null,
        l = function () {
            this.activate = function () {};
            this.connect = function () {};
            this.disconnect = function () {};
            this.rpc = function () {};
            this.onConnect = function () {};
            this.onDisconnect = function () {};
            this.onMessage = function () {};
            this.onError = function () {}
        }, m = null,
        n = 0,
        o = function (a) {
            m = k[a];
            m.activate()
        }, k = {};
    k[0] = new function () {
        l.call(this);
        this.activate = function () {
            clearInterval(n)
        };
        this.connect = function () {
            o(1)
        }
    };
    k[1] = new function () {
        l.call(this);
        this.activate = function () {
            clearInterval(n);
            i.connect(h)
        };
        this.onConnect = function () {
            d.log("Spotify.WebSockets.Bridge", ["[State.connecting] Socket connected"], "corejs");
            o(2)
        };
        this.onDisconnect = function () {
            d.log("Spotify.WebSockets.Bridge", ["[State.connecting] Socket disconnected"], "corejs");
            b.trigger(c.FAILED_CONNECTING, {});
            o(0)
        };
        this.disconnect = function () {
            i.disconnect()
        };
        this.onError = function (a) {
            d.error("Spotify.WebSockets.Bridge", ["[State.connecting] Error", a], "corejs");
            b.trigger(c.FAILED_CONNECTING, {});
            o(0)
        }
    };
    k[2] = new function () {
        l.call(this);
        this.activate = function () {
            d.log("Spotify.WebSockets.Bridge", ["[State.authorizing] Sending auth object"], "corejs");
            clearInterval(n);
            var b = a.split(":");
            if (parseInt(b[0], 10) > 200) var c = b.shift(),
                h = b.shift(),
                b = b.join(":"),
                b = [c, h, b];
            i.sendObject({
                name: "connect",
                id: "0",
                args: b
            })
        };
        this.disconnect = function () {
            i.disconnect()
        };
        this.onDisconnect = function () {
            d.log("Spotify.WebSockets.Bridge", ["[State.authorizing] Socket disconnected"],
                "corejs");
            b.trigger(c.FAILED_CONNECTING, {});
            o(0)
        };
        this.onMessage = function (a) {
            d.log("Spotify.WebSockets.Bridge", ["[State.authorizing] Got message", a], "corejs");
            try {
                var h = JSON.parse(a);
                h.result === "ok" ? (b.trigger(c.AUTHENTICATED, {}), b.trigger(c.CONNECTION_ESTABLISHED, {}), o(3)) : h.error && (b.trigger(c.FAILED_CONNECTING, {}), b.disconnect(), o(0))
            } catch (i) {}
        }
    };
    k[3] = new function () {
        l.call(this);
        this.activate = function () {
            clearInterval(n);
            n = setInterval(function () {
                i.isConnected() || (clearInterval(n), i.trigger("ondisconnect"))
            },
            1E3)
        };
        this.onMessage = function (a) {
            d.log("Spotify.WebSockets.Bridge", ["[State.authorized] Got message", a], "corejs");
            try {
                var h = JSON.parse(a),
                    i = h.message ? h.message[0] : null;
                i === "token_lost" ? b.trigger(c.TOKEN_LOST, {}) : i === "do_work" ? b.trigger(c.WORK, h.message[1]) : i === "login_complete" ? b.trigger(c.LOGIN_COMPLETE) : i === "hm_b64" ? b.trigger(c.HERMES_B64_MESSAGE, h.message) : i === "user_info_change" ? b.trigger(c.USER_INFO_CHANGE) : h.id ? h.error ? b.trigger(c.RPC_ERRBACK, {
                    requestId: h.id,
                    response: h.error
                }) : b.trigger(c.RPC_CALLBACK, {
                    requestId: h.id,
                    response: h.result
                }) : b.trigger(c.ERROR, {
                    error: "Response object invalid"
                })
            } catch (f) {
                b.trigger(c.ERROR, {
                    message: "Response not a JSON object"
                })
            }
        };
        this.disconnect = function () {
            i.disconnect()
        };
        this.onDisconnect = function () {
            d.log("Spotify.WebSockets.Bridge", ["[State.authorized] Socket disconnected"], "corejs");
            b.trigger(c.FAILED_CONNECTING, {});
            o(0)
        };
        this.rpc = function (a, b, c) {
            d.log("Spotify.WebSockets.Bridge", ["[State.authorized] Doing an RPC call", a, b], "corejs");
            i.sendObject({
                id: c,
                name: "sp/" + a,
                args: b
            })
        };
        this.onError = function (a) {
            d.error("Spotify.WebSockets.Bridge", ["[State.authorized] onerror", a], "corejs")
        }
    };
    this.rpc = function (a, b, c) {
        m.rpc(a, b, c)
    };
    this.connect = function (b, c) {
        b && (a = b);
        c && (h = c);
        m.connect()
    };
    this.disconnect = function () {
        m.disconnect()
    };
    this.initialize = function () {
        if (h === "") throw Error("Spotify.WebSockets.Bridge connectionUri cannot be empty");
        i = new Spotify.WebSockets.Client;
        i.bind("onconnect", function () {
            m.onConnect()
        });
        i.bind("ondisconnect", function () {
            m.onDisconnect()
        });
        i.bind("onmessage",

        function (a) {
            m.onMessage(a.params.message)
        });
        i.bind("onerror", function (a) {
            m.onError(a.params.message)
        });
        b.trigger(c.READY, {});
        o(0)
    }
};
Spotify.WebSockets.Client = function () {
    Spotify.EventTarget.call(this);
    var g = Spotify.DebuggerJS,
        f = null,
        d = this;
    this.connect = function (b) {
        if (b === "") throw Error("Core.WebSockets.Client connection Uri was not set");
        if (this.isConnected()) return !1;
        if (WebSocket === void 0) throw Error("Core.WebSockets.Client WebSocket interface not supported");
        var c = this.currentConnection = (this.currentConnection || 0) + 1;
        f = new WebSocket(b);
        f.onopen = function () {
            g.log("Spotify.WebSockets.Client", ["onopen", c], "corejs");
            c == d.currentConnection && d.trigger("onconnect", {})
        };
        f.onclose = function () {
            g.log("Spotify.WebSockets.Client", ["onclose", c], "corejs");
            c == d.currentConnection && d.trigger("ondisconnect", {})
        };
        f.onmessage = function (a) {
            g.log("Spotify.WebSockets.Client", ["onmessage", a, c], "corejs");
            c == d.currentConnection && d.trigger("onmessage", {
                message: a.data
            })
        };
        f.onerror = function (a) {
            g.error("Spotify.WebSockets.Client", ["onerror", a, c], "corejs");
            c == d.currentConnection && d.trigger("onerror", {
                message: a
            })
        }
    };
    this.disconnect = function () {
        if (!this.isConnected()) throw Error("Core.WebSocket.Client not connected");
        f.close();
        f = null;
        d.trigger("ondisconnect", {})
    };
    this.isConnected = function () {
        return f && f.readyState === 1
    };
    this.send = function (b) {
        this.isConnected() ? f.send(b) : (d.trigger("ondisconnect", {}), log("Core.WebSocket.Client not connected"))
    };
    this.sendObject = function (b) {
        var c = JSON.stringify(b);
        c.length > 32768 ? d.trigger("onmessage", {
            message: JSON.stringify({
                id: b.id,
                error: [16, 1, "PACKET_SIZE_EXCEEDED"]
            })
        }) : this.send(c)
    }
};
Spotify.EventTarget = function () {
    this._listeners = {};
    this.bind = function (f, d, b, c) {
        typeof c === "undefined" && (c = 0);
        if (typeof d !== "undefined" && d !== null) {
            var c = {
                callback: d,
                context: b,
                priority: c
            }, a = !1,
                h;
            this._listeners[f] === void 0 && (this._listeners[f] = []);
            h = this._listeners[f];
            for (var i = 0; i < h.length; i++) if (h[i].callback === d && h[i].context === b) {
                a = !0;
                break
            }
            a === !1 && (this._listeners[f].push(c), this._listeners[f].sort(g))
        }
    };
    var g = function (f, d) {
        return d.priority - f.priority
    };
    this.trigger = function (f, d, b) {
        var c = this._listeners[f],
            d = d || {};
        if (typeof c !== "undefined") for (var a = 0; a < c.length; a++) {
            var h = c[a];
            setTimeout(h.callback.bind(h.context, {
                type: f,
                params: d,
                extra: b || {}
            }), 5)
        }
    };
    this.unbind = function (f, d, b) {
        var c = -1,
            a = this._listeners[f];
        if (typeof d !== "undefined") {
            if (typeof a !== "undefined") {
                for (var h = 0; h < a.length; h++) if (a[h].callback === d && a[h].context === b) {
                    c = h;
                    break
                }
                c !== -1 && this._listeners[f].splice(c, 1)
            }
        } else this._listeners[f] = []
    }
};
Spotify.Protobuf.Schema = function (g, f, d, b) {
    Spotify.EventTarget.call(this);
    var c, a = 0,
        h = [];
    this.id = "";
    this.PROTO = "proto";
    this.type = this.JSON = "json";
    this.load = function () {
        var b, c;
        if (this.type === this.JSON) c = "json";
        else if (this.type === this.PROTO) c = "text";
        else throw Error("Not a valid descriptor file for the protobuf schema");
        for (b = a = 0; b < g.length; b++) if (typeof g[b] === "string") {
            a++;
            var h = new Spotify.Service;
            h.url = g[b];
            h.dataType = c;
            h.bind("onSuccess", this.done, this);
            h.bind("onError", this.error, this);
            h.fetch()
        }
    };
    this.reset = function () {
        h = null
    };
    this.getSchema = function () {
        return c
    };
    this.msg = function (a) {
        return c[a]
    };
    this.parse = function (a) {
        h = h === null ? a : h.concat(a)
    };
    this.encode = function () {
        var a;
        this.type == this.JSON ? c = Spotify.Protobuf.Serialization.createFromJson(h) : (a = Spotify.Protobuf.Parser.parseFileDescriptor(h), c = Spotify.Protobuf.Serialization.createFromFileDescriptor(a))
    };
    this.done = function (c) {
        this.parse(c.params.result);
        a--;
        a === 0 && (this.encode(), typeof b !== "undefined" ? typeof f !== "undefined" && f.call(b, this.id) : typeof f !== "undefined" && f(this.id))
    };
    this.setData = function (a) {
        h = a
    };
    this.error = function (a) {
        typeof b !== "undefined" ? typeof d !== "undefined" && d.call(b, a) : typeof d !== "undefined" && d(a)
    }
};
(function () {
    var g;
    Spotify.Events = function () {
        return typeof g !== "undefined" ? g : g = {
            DATA_ERROR: "DATA_ERROR",
            TRACK_PLAY_REQUEST: "TRACK_PLAY_REQUEST",
            WAIT_FOR_COMMERCIAL_TO_FINISH: "WAIT_FOR_COMMERCIAL_TO_FINISH",
            INTERCEPTED: "intercepted",
            USER_INFO_CHANGE: "USER_INFO_CHANGE",
            TRACK_ENDED: "TRACK_ENDED",
            PLAYER_STATE: "PLAYER_STATE",
            BEFORE_END: "BEFORE_END",
            LOAD: "LOAD",
            SONG_LOADED: "SONG_LOADED",
            FIRST_BYTES: "FIRST_BYTES",
            POSITION_CHANGED: "POSITION_CHANGED",
            VOLUME_CHANGED: "VOLUME_CHANGED",
            PLAYING: "PLAYING",
            PAUSED: "PAUSED",
            STOPPED: "STOPPED",
            ACTIVE_PLAYER_CHANGED: "ACTIVE_PLAYER_CHANGED",
            CONNECTION_ESTABLISHED: "CONNECTION_ESTABLISHED",
            CONNECTION_CLOSED: "CONNECTION_CLOSED",
            CONNECTED: "CONNECTED",
            DISCONNECTED: "DISCONNECTED",
            STREAM_INITIALIZED: "STREAM_INITIALIZED",
            PLAYER_LOADED: "PLAYER_LOADED",
            PLAYER_EVENT: "PLAYER_EVENT",
            STREAM_LIMIT_REACHED: "STREAM_LIMIT_REACHED",
            AUTHENTICATED: "AUTHENTICATED",
            ERROR: "ERROR",
            SUCCESS: "SUCCESS",
            FAILED_CONNECTING: "FAILED_CONNECTING",
            INVALID_TRACK_URI: "INVALID_TRACK_URI",
            CANNOT_PLAY_TRACK: "CANNOT_PLAY_TRACK",
            INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
            REGION_BLOCKED: "REGION_BLOCKED",
            ACCOUNT_IN_USE: "ACCOUNT_IN_USE",
            PLAYBACK_FAILED: "PLAYBACK_FAILED",
            SECURITY_ERROR: "SECURITY_ERROR",
            UNKNOWN_ERROR: "UNKNOWN_ERROR",
            RPC_CALLBACK: "RPC_CALLBACK",
            RPC_ERRBACK: "RPC_ERRBACK",
            RPC_LOGGING_LATENCY_CALLBACK: "RPC_LOGGING_LATENCY_CALLBACK",
            RPC_LOGGING_LATENCY_ERRBACK: "RPC_LOGGING_LATENCY_ERRBACK",
            RPC_SUCCESS: "RPC_SUCCESS",
            RPC_ERROR: "RPC_ERROR",
            REAUTHORIZE_SUCCESS: "REAUTHORIZE_SUCCESS",
            REAUTHORIZE_FAILED: "REAUTHORIZE_FAILED",
            FLASH_LOADED: "FLASH_LOADED",
            FLASH_UNAVAILABLE: "FLASH_UNAVAILABLE",
            FLASH_AVAILABLE: "FLASH_AVAILABLE",
            READY: "READY",
            NOT_READY: "NOT_READY",
            TOKEN_ACQUIRED: "TOKEN_ACQUIRED",
            TOKEN_NOT_ACQUIRED: "TOKEN_NOT_ACQUIRED",
            ON_TRY_TO_CONNECT: "ON_TRY_TO_CONNECT",
            NOTIFY_OF_DISCONNECT: "NOTIFY_OF_DISCONNECT",
            FATAL_ERROR: "FATAL_ERROR",
            TOKEN_LOST: "TOKEN_LOST",
            WORK: "WORK",
            LOGIN_COMPLETE: "LOGIN_COMPLETE",
            HERMES_B64_MESSAGE: "HERMES_B64_MESSAGE",
            TIMEOUT: "TIMEOUT",
            NO_SOUND_CAPABILITIES: "NO_SOUND_CAPABILITIES",
            ON_REAUTHENTICATION_SUCCESS: "ON_REAUTHENTICATION_SUCCESS",
            ON_REAUTHENTICATION_FAILED: "ON_REAUTHENTICATION_FAILED",
            STORAGE_FULL: "STORAGE_FULL",
            RATE_LIMIT_CALL: "RATE_LIMIT_CALL",
            RATE_LIMIT_DISABLED: "RATE_LIMIT_DISABLED",
            REMOTE_CONTROL_STARTED: "REMOTE_CONTROL_STARTED",
            REMOTE_CONTROL_STOPPED: "REMOTE_CONTROL_STOPPED",
            DEVICE_DISCOVERED: "DEVICE_DISCOVERED",
            DEVICE_REMOVED: "DEVICE_REMOVED",
            REMOTE_COMMAND: "REMOTE_COMMAND",
            REMOTE_SERVICE_DOWN: "REMOTE_SERVICE_DOWN",
            NOTIFICATION: "NOTIFICATION",
            RELATIONS_SUBSCRIBE: "RELATIONS_SUBSCRIBE",
            RELATIONS_UNSUBSCRIBE: "RELATIONS_UNSUBSCRIBE",
            RECORD_AD_EVENT: "RECORD_AD_EVENT",
            PLAYER_CREATED: "PLAYER_CREATED",
            DURATION: "DURATION"
        }
    }
})();
Spotify.Hermes.Cache = new function () {
    var g = Spotify.Cache.Default,
        f = this,
        d = [null, null],
        b = function () {
            return JSON.parse(localStorage.getItem("com.spotify.cache.indexeddb") || !1)
        }, c = function () {
            return d[Spotify.Cache.Types.TEMPORARY] != null && d[Spotify.Cache.Types.PERSISTENT] != null
        }, a = function (a) {
            return function (b) {
                var h = "com.spotify.cache." + (a || "generic") + ".version",
                    i = function () {
                        localStorage.setItem(h, (2).toString());
                        d[a] = b;
                        c() && f.trigger(Spotify.Events.READY)
                    };
                parseInt(localStorage.getItem(h)) != 2 ? b.clear(i) : i()
            }
        }, h = function () {
            throw Error("Failed creating caches!");
        }, i = function (a) {
            return a.indexOf("hm://playlist/") == 0 ? d[Spotify.Cache.Types.PERSISTENT] : d[Spotify.Cache.Types.TEMPORARY]
        }, l = function (a, b, c, h, d, f) {
            var l = i(a);
            l.get(b, function (a, b) {
                b == null ? h.call(f) : b.expires < (new Date).getTime() ? b.etag ? d.call(f, b.frames, b.etag) : (l.remove(a), h.call(f)) : c.call(f, b.frames)
            })
        };
    f.onReady = function (a, b) {
        c() ? a.call(b) : f.bind(Spotify.Events.READY, a, b)
    };
    f.getCacheKey = function (a) {
        for (var b = [a.getURI()], c = 0, h = a.getRequestFrameCount(); c < h; ++c) b.push(a.getRequestFrame(c));
        return b.join("")
    };
    f.getCachedFrames = function (a, b, h, i, d, f) {
        c() ? l(a, b, h, i, d, f) : i.call(f)
    };
    f.setCachedFrames = function (a, b, h, d, l, g) {
        if (c() && d && (h == "CACHE_PRIVATE" || h == "CACHE_PUBLIC")) {
            h = {
                frames: g,
                expires: (new Date).getTime() + d * 1E3
            };
            if (l) h.etag = l;
            i(a).put(b, h, null, null, f.onfull)
        }
    };
    f.removeAllStartingWith = function (a, b) {
        i(a).removeAllStartingWith(a, b)
    };
    f.onfull = function () {};
    f.migrateToIndexedDB = function (a, c, h) {
        if (b()) a.call(h);
        else {
            var i = d[Spotify.Cache.Types.PERSISTENT],
                f = new g(5E3, new Spotify.Cache.IndexedDBStorage("Spotify.Mercury.Cache"));
            delete d[Spotify.Cache.Types.PERSISTENT];
            var l = function (a, b) {
                f.put(a, b)
            }, s = function () {
                d[Spotify.Cache.Types.PERSISTENT] = f;
                i.clear();
                localStorage.setItem("com.spotify.cache.indexeddb", "true");
                a.call(h, this)
            };
            f.initialize(function () {
                i._storage.each(l, s, this)
            }, c, h)
        }
    };
    (function () {
        Spotify.EventTarget.call(f);
        var c = new g(500, new Spotify.Cache.MemoryStorage("Spotify.Mercury.Cache"));
        c.initialize(a(Spotify.Cache.Types.TEMPORARY), h);
        c = b() ? new g(5E3, new Spotify.Cache.IndexedDBStorage("Spotify.Mercury.Cache")) : new g(5E3, new Spotify.Cache.LocalStorage("Spotify.Mercury.Cache"));
        c.initialize(a(Spotify.Cache.Types.PERSISTENT), h)
    })()
};
(function () {
    if (typeof window.btoa !== "function") window.btoa = Spotify.Utils.Base64.encode;
    if (typeof window.atob !== "function") window.atob = Spotify.Utils.Base64.decode;
    var g = Spotify.DebuggerJS,
        f = Spotify.Protobuf.Serialization.createFromJson([{
            name: "Header",
            fields: [{
                id: 1,
                type: "string",
                name: "uri"
            }, {
                id: 2,
                type: "string",
                name: "content_type"
            }, {
                id: 3,
                type: "string",
                name: "method"
            }, {
                id: 4,
                type: "sint32",
                name: "status_code"
            }, {
                id: 5,
                type: "string",
                name: "source"
            }, {
                id: 6,
                type: "*UserField",
                name: "user_fields"
            }]
        }, {
            name: "UserField",
            fields: [{
                id: 1,
                type: "string",
                name: "name"
            }, {
                id: 2,
                type: "bytes",
                name: "value"
            }]
        }]).Header,
        d = Spotify.Hermes.Cache;
    Spotify.Hermes.Header = f;
    Spotify.Hermes.Request = function (b) {
        if (b.uri == void 0) throw Error("URI not specified!");
        this.getURI = function () {
            return b.uri
        };
        this.getRequestFrameCount = function () {
            return 0
        };
        this.getRequestFrameData = function () {
            return null
        };
        this.setRequestFrameData = function () {};
        this.getRequestFrame = function () {
            return null
        };
        this.parseResponseFrame = function (a, b) {
            return b
        };
        var c = function (a) {
            for (var b = [], c = (new Date).getTime(), h = 1, i = a.length; h < i; ++h) b.push(this.parseResponseFrame(h - 1, a[h]));
            g.log("Spotify.Hermes.Request", ["It took", (new Date).getTime() - c, "ms to parse the frames"], "parsing_times");
            return b
        }, a = function (a) {
            for (var b = [], c = 0, h = a.length; c < h; ++c) b.push(window.atob(a[c]));
            return b
        }, h = function (a) {
            var b = {};
            if (a.user_fields) for (var c = 0, h = a.user_fields.length; c < h; ++c) {
                var i = a.user_fields[c];
                switch (i.name) {
                    case "MC-Cache-Policy":
                        if (i.value == "private") b.cache_policy = "CACHE_PRIVATE";
                        else if (i.value ==
                            "public") b.cache_policy = "CACHE_PUBLIC";
                        break;
                    case "MC-TTL":
                        b.ttl = i.value;
                        break;
                    case "MC-ETag":
                        b.etag = i.value
                }
            }
            return b
        }, i = function (a, b, c) {
            a.user_fields = a.user_fields || [];
            a.user_fields.push({
                name: b,
                value: c
            })
        }, l = function (i, l, m, n, o, y, w) {
            n != null && o != null ? b.user_fields = [{
                name: "MC-ETag",
                value: o
            }] : delete b.user_fields;
            var v;
            a: {
                switch (b.method) {
                    case "SUB":
                        v = 1;
                        break a;
                    case "UNSUB":
                        v = 2;
                        break a
                }
                v = 0
            }
            o = (new Date).getTime();
            v = [v, window.btoa(f.serializeToStringSync(b))];
            for (var x = 0, D = this.getRequestFrameCount(); x < D; ++x) v.push(window.btoa(this.getRequestFrame(x)));
            g.log("Spotify.Hermes.Request", ["It took", (new Date).getTime() - o, "ms to serialize the request"], "parsing_times");
            i.rpc("hm_b64", v, function (b) {
                var b = a(b.response),
                    i = f.parseFromStringSync(b[0]),
                    g = i.status_code;
                g >= 200 && g <= 299 ? (i = h(i), d.setCachedFrames(this.getURI(), d.getCacheKey(this), i.cache_policy, i.ttl, i.etag, b), l(c.call(this, b), g)) : g == 304 ? l(c.call(this, n), g) : m(new Spotify.Errors.Error([13, g]))
            }, m, this, y || !1, 2, w)
        }, m = function (a) {
            if (a.length != 2) throw Error("Invalid number of frames!");
            var b = f.parseFromStringSync(a[0]),
                a = {
                    content_type: b.content_type,
                    status_code: b.status_code,
                    body: a[1]
                }, b = h(b),
                c;
            for (c in b) a[c] = b[c];
            return a
        }, n = function (a, b) {
            var c = {
                uri: b,
                content_type: a.content_type,
                status_code: a.status_code
            };
            a.cache_policy == "CACHE_PUBLIC" ? i(c, "MC-Cache-Policy", "public") : a.cache_policy == "CACHE_PRIVATE" && i(c, "MC-Cache-Policy", "private");
            a.ttl !== void 0 && i(c, "MC-TTL", a.ttl);
            a.etag !== void 0 && i(c, "MC-ETag", a.etag);
            return [f.serializeToStringSync(c), a.body]
        }, o = function (c, h, i, l, o, y) {
            o = typeof o !==
                "undefined" ? o : !1;
            if (this.getRequestFrameCount() != 1) throw Error("Invalid number of request frames!");
            var w = this.getRequestFrameData(0).request,
                v = w.length,
                x = [],
                D = [],
                A = Array(v),
                u = function (b) {
                    var c = a(b.response),
                        l = f.parseFromStringSync(c[0]),
                        b = l.status_code;
                    if (Spotify.Hermes.Request.isSuccess(b)) if (l.content_type != "vnd.spotify/mercury-mget-reply") i(new Spotify.Errors.Error([Spotify.Errors.Domains.HERMES_ERROR, 500, "Server didn't send a multi-GET reply!"]));
                    else if (c.length != 2) i(new Spotify.Errors.Error([Spotify.Errors.Domains.HERMES_ERROR,
                    500, "Invalid number of frames in multi-GET reply!"]));
                    else {
                        for (var c = this.parseResponseFrame(0, c[1]).reply, l = (new Date).getTime(), k = 0, o = c.length; k < o; ++k) {
                            var s = x[k],
                                t = c[k],
                                w = D.shift();
                            t.status_code == 304 ? (A[w] = m(s.cachedFrames), A[w].status_code = 200) : Spotify.Hermes.Request.isSuccess(t.status_code) ? (A[w] = t, d.setCachedFrames(s.uri, s.uri + (s.body || ""), t.cache_policy, t.ttl, t.etag, n(t, s.uri))) : delete A[w]
                        }
                        g.log("Spotify.Hermes.Request", ["It took", (new Date).getTime() - l, "ms to parse the frames"], "parsing_times");
                        h([{
                            reply: A
                        }], b)
                    } else i(new Spotify.Errors.Error([Spotify.Errors.Domains.HERMES_ERROR, b]))
                }, C = function () {
                    if (x.length == 0) h([{
                        reply: A
                    }], 200);
                    else {
                        var a = (new Date).getTime(),
                            d = [0, window.btoa(f.serializeToStringSync(b))];
                        this.setRequestFrameData(0, {
                            request: x
                        });
                        d.push(window.btoa(this.getRequestFrame(0)));
                        g.log("Spotify.Hermes.Request", ["It took", (new Date).getTime() - a, "ms to serialize the request"], "parsing_times");
                        c.rpc("hm_b64", d, u, i, this, l || !1, 2, y)
                    }
                }, J = function (a) {
                    return function (b) {
                        A[a] = m(b);
                        --v <= 0 && C.call(this)
                    }
                }, G = function (a) {
                    return function () {
                        x.push(w[a]);
                        D.push(a);
                        --v <= 0 && C.call(this)
                    }
                }, F = function (a) {
                    return function (b, c) {
                        w[a].etag = c;
                        w[a].cachedFrames = b;
                        x.push(w[a]);
                        D.push(a);
                        --v <= 0 && C.call(this)
                    }
                };
            if (o) for (var o = 0, H = w.length; o < H; ++o) G(o).call(this);
            else {
                o = 0;
                for (H = w.length; o < H; ++o) {
                    var E = w[o];
                    d.getCachedFrames(E.uri, E.uri + (E.body || ""), J(o), G(o), F(o), this)
                }
            }
        };
        this.send = function (a, h, i, f, g, m) {
            g = typeof g !== "undefined" ? g : !1;
            if (b.content_type == "vnd.spotify/mercury-mget-request") o.call(this, a,
            h, i, f, g, m);
            else {
                var n = function (a) {
                    h(c.call(this, a), 200)
                }, v = function () {
                    l.call(this, a, h, i, null, null, f, m)
                }, x = function (b, c) {
                    l.call(this, a, h, i, b, c, f, m)
                };
                g ? v.call(this) : d.getCachedFrames(this.getURI(), d.getCacheKey(this), n, v, x, this)
            }
        }
    };
    Spotify.Hermes.Request.isSuccess = function (b) {
        return b >= 200 && b < 300
    };
    Spotify.Hermes.Request.isRedirect = function (b) {
        return b >= 300 && b < 400
    };
    Spotify.Hermes.Request.isClientError = function (b) {
        return b >= 400 && b < 500
    };
    Spotify.Hermes.Request.isServerError = function (b) {
        return b >= 500 && b < 600
    };
    Spotify.Hermes.StringRequest = function (b, c) {
        var a = new Spotify.Hermes.Request(b);
        a.getRequestFrameCount = function () {
            return c.length
        };
        a.getRequestFrameData = function (a) {
            return c[a]
        };
        a.setRequestFrameData = function (a, b) {
            c[a] = b
        };
        a.getRequestFrame = function (a) {
            return c[a]
        };
        a.parseResponseFrame = function (a, b) {
            return b
        };
        return a
    };
    Spotify.Hermes.ProtobufRequest = function (b, c, a, h) {
        b = new Spotify.Hermes.Request(b);
        b.getRequestFrameCount = function () {
            return c.length
        };
        b.getRequestFrameData = function (a) {
            return c[a]
        };
        b.setRequestFrameData = function (a, b) {
            c[a] = b
        };
        b.getRequestFrame = function (b) {
            return a[b] ? a[b].serializeToStringSync(c[b]) : c[b]
        };
        b.parseResponseFrame = function (a, b) {
            return a < h.length ? h[a].parseFromStringSync(b) : b
        };
        return b
    }
})();
Spotify.Hermes.Handler = function () {
    Spotify.EventTarget.call(this);
    var g = {}, f, d = function (b) {
        var c;
        if (typeof b !== void 0 && (c = b.split("#"), Spotify.Utils.isArray(c) && c.length == 2)) return b = c[0], c = c[1], typeof g[b] !== "undefined" ? g[b].msg(c) : null;
        throw Error("Not a valid message!");
    };
    this.send = function (b, c, a, h, i, l, g, n, o) {
        var n = n || !1,
            k = [],
            p = [];
        if (!Spotify.Utils.isArray(a) && !Spotify.Utils.isArray(h)) throw "Hermes:send Wrong arguments";
        for (var q = 0; q < a.length; q++) k.push(d(a[q]));
        for (q = 0; q < h.length; q++) p.push(d(h[q]));
        (new Spotify.Hermes.ProtobufRequest({
            uri: b,
            method: c
        }, i, k, p)).send(f, l, g, n, o, "hermes")
    };
    this.loadSchemas = function (b, c, a, h) {
        var i;
        if (Spotify.Utils.isArray(b)) if (i = Spotify.Utils.Base64.encode(b.join("_")) + "_", typeof g[i] !== "undefined") a(i);
        else try {
            var d = new Spotify.Protobuf.Schema(b, a, h, null);
            g[i] = d;
            if (c !== d.PROTO && c !== d.JSON) c = d.JSON;
            d.id = i;
            d.type = c;
            d.reset();
            d.load()
        } catch (f) {
            throw typeof h !== "undefined" && h(f), f;
        } else h(Error("Schemas is not an array"))
    };
    this.loadSchemaData = function (b, c, a) {
        var h = (new Date).getTime() + Math.floor(Math.random() * 1E3),
            h = Spotify.Utils.Base64.encode(h.toString()) + "_",
            i, d;
        if (Spotify.Utils.isArray(b)) {
            b = b.join("\n");
            for (i in g) a = g[i], a === b[0] && (d = a, h = i);
            if (typeof d === "undefined") d = new Spotify.Protobuf.Schema([], null, null, null), d.id = h, d.type = "proto", d.setData(b), d.encode(), g[h] = d;
            c(h)
        } else a(Error("Schemas is not an array"))
    };
    this.init = function (b) {
        f = b
    }
};
Spotify.GatewayTypes = {
    FLASH: "FLASH",
    WEBSOCKETS: "WEBSOCKETS"
};
Spotify.PlayerTypes = {
    FLASH_RTMPS: "FLASH_RTMPS",
    FLASH_HTTP: "FLASH_HTTP",
    FLASH_AAC: "FLASH_AAC",
    WEBSOCKETS_STREAMING: "WEBSOCKETS_STREAMING",
    HTML5_HTTP: "HTML5_HTTP"
};
Spotify.Protocols = {
    RTMPS: "RTMPS",
    RTMP: "RTMP",
    HTTP: "HTTP",
    HTTPS: "HTTPS"
};
Spotify.Instances = function () {
    var g = {};
    return {
        add: function (f) {
            f.id = "SPFBIn_" + Math.floor(Math.random() * 1E4);
            g[f.id] = f;
            return !0
        },
        get: function (f) {
            if (typeof g[f] !== void 0) return g[f]
        }
    }
}();
Spotify.Flash.SWFObject = function (g) {
    Spotify.EventTarget.call(this);
    var f = Spotify.DebuggerJS,
        d = this;
    this.isLoaded = !1;
    var b = new Spotify.Events;
    this.getSWF = function () {
        if (this.isLoaded) {
            if (window.document[g.SWFFlashId]) return window.document[g.SWFFlashId];
            if (navigator.appName.indexOf("Microsoft Internet") === -1) {
                if (document.embeds && document.embeds[g.SWFFlashId]) return document.embeds[g.SWFFlashId]
            } else return document.getElementById(g.SWFFlashId)
        } else f.error("Spotify.Flash.SWFObject", ["SWF Object is not loaded...."],
            "corejs")
    };
    this.initialize = function () {
        swfobject.hasFlashPlayerVersion("11.0.0") ? swfobject.embedSWF(g.SWFUrl, g.SWFContainerId, "1", "1", "11.0.0", "", {
            playerType: g.playerType || "",
            valid: 0,
            id: g.SWFFlashId || "",
            length: 0,
            instanceId: g.instanceId,
            logging: g.logging,
            authUrl: g.authUrl,
            rtmpServer: g.rtmpServer
        }, {
            quality: "high",
            allowscriptaccess: "always",
            wmode: "window",
            bgcolor: "#2c2c2d"
        }, {
            id: g.SWFFlashId,
            name: g.SWFFlashId,
            align: "middle"
        }, c) : (d.trigger(b.FLASH_UNAVAILABLE), f.error("Spotify.Flash.SWFObject", ["Your Flash is not up to date: 11.0.0"],
            "corejs"))
    };
    var c = function (a) {
        !1 === a.success ? (d.trigger(b.FLASH_UNAVAILABLE), f.error("Spotify.Flash.SWFObject", ["Cannot load SWF object"], "corejs")) : (d.trigger(b.FLASH_AVAILABLE), d.isLoaded = !0)
    }
};
Spotify.Flash.PlayerInterface = function (g, f) {
    Spotify.EventTarget.call(this);
    var d = this,
        b = new Spotify.Events,
        c;
    this.hasSoundCapabilities = !0;
    var a = function (a) {
        this.trigger(a.type, a.params)
    };
    this.playpause = function (a) {
        return typeof c !== "undefined" && c.isLoaded && this.hasSoundCapabilities ? c.getSWF().sp_playpause(a) : !1
    };
    this.position = function (a) {
        try {
            if (typeof c !== "undefined" && c.isLoaded && this.hasSoundCapabilities) return c.getSWF().sp_time(a)
        } catch (b) {
            return 0
        }
    };
    this.getPlayerState = function (a) {
        typeof c !==
            "undefined" && c.isLoaded && this.hasSoundCapabilities && (response = c.getSWF().sp_playerState(a));
        return response
    };
    this.seek = function (a, b) {
        if (typeof c !== "undefined" && c.isLoaded && this.hasSoundCapabilities) return c.getSWF().sp_seek(a, b)
    };
    this.pause = function (a) {
        typeof c !== "undefined" && c.isLoaded && this.hasSoundCapabilities && c.getSWF().sp_pause(a)
    };
    this.resume = function (a) {
        typeof c !== "undefined" && c.isLoaded && this.hasSoundCapabilities && c.getSWF().sp_resume(a)
    };
    this.stop = function (a) {
        typeof c !== "undefined" && c.isLoaded && this.hasSoundCapabilities && c.getSWF().sp_stop(a)
    };
    this.load = function (a, b, f) {
        f = f || {};
        typeof c !== "undefined" && c.isLoaded && d.hasSoundCapabilities && c.getSWF().sp_load(a, b, f)
    };
    this.play = function (a, b) {
        typeof c !== "undefined" && c.isLoaded && d.hasSoundCapabilities && c.getSWF().sp_play(a, b)
    };
    this.setVolume = function (a, b) {
        if (typeof c !== "undefined" && c.isLoaded && this.hasSoundCapabilities) try {
            c.getSWF().sp_setVolume(a, b)
        } catch (d) {}
    };
    this.getVolume = function (a) {
        if (typeof c !== "undefined" && c.isLoaded && this.hasSoundCapabilities) try {
            return c.getSWF().sp_getVolume(a)
        } catch (b) {}
        return 1
    };
    this.getDuration = function (a) {
        if (typeof c !== "undefined" && c.isLoaded && this.hasSoundCapabilities) try {
            return c.getSWF().sp_getDuration(a)
        } catch (b) {}
        return 0
    };
    this.hasSound = function () {
        return typeof c !== "undefined" && c.isLoaded ? this.hasSoundCapabilities = c.getSWF().sp_hasSound() : !1
    };
    this.addPlayer = function (a, b, f) {
        if (typeof c !== "undefined" && c.isLoaded && d.hasSoundCapabilities) return c.getSWF().sp_addPlayer(a, b, f)
    };
    this.removePlayerAtIndex = function (a) {
        return typeof c !== "undefined" && c.isLoaded && d.hasSoundCapabilities ? (c.getSWF().sp_removePlayerAtIndex(a), !0) : !1
    };
    this.initializePlayerById = function (a) {
        typeof c !== "undefined" && c.isLoaded && d.hasSoundCapabilities && c.getSWF().sp_initializePlayerById(a)
    };
    this.initialize = function () {
        c = new Spotify.Flash.SWFObject({
            playerType: f.playerType,
            SWFFlashId: g + "_player",
            SWFContainerId: f.SWFPlayerContainerId,
            SWFUrl: f.SWFPlayerUrl,
            SWFMinVersion: f.SWFMinVersion,
            instanceId: g,
            logging: f.logging,
            length: f.valid,
            valid: 0,
            rtmpServer: f.rtmpServer
        });
        c.bind(b.FLASH_AVAILABLE, a, this);
        c.bind(b.FLASH_UNAVAILABLE,
        a, this);
        c.initialize()
    };
    this.onLoad = function () {};
    this.onPlay = function () {};
    this.onPause = function () {};
    this.onStop = function () {};
    this.onTrackEnded = function () {};
    this.onSongLoaded = function () {};
    this.onPositionChanged = function () {};
    this.onInvalidTrackUri = function () {};
    this.onPlaybackFailed = function () {}
};
Spotify.HTML5.PlayerInterface = function (g) {
    Spotify.EventTarget.call(this);
    var f = document.getElementById(g),
        d = this,
        b = new Spotify.Events,
        c = {};
    this.hasSoundCapabilities = !0;
    var a = function (a) {
        switch (a.type) {
            case "loadeddata":
                d.trigger(b.LOAD, {}, {
                    id: this.id
                });
                break;
            case "ended":
                d.trigger(b.TRACK_ENDED, {}, {
                    id: this.id
                })
        }
    };
    this.playpause = function (a) {
        var b = c[a];
        b.paused ? this.play(a, Math.floor(b.currentTime * 1E3)) : this.pause(a)
    };
    this.position = function (a) {
        return Math.floor(c[a].currentTime * 1E3)
    };
    this.getPlayerState = function (a) {
        var b = c[a];
        return {
            position: this.position(a),
            duration: Math.floor(b.duration * 1E3),
            isPaused: b.paused,
            isPlaying: !b.paused,
            isStopped: b.src === "" ? !0 : !1
        }
    };
    this.seek = function (a, i) {
        c[a].currentTime = Math.floor(i * 0.001);
        this.trigger(b.POSITION_CHANGED, i, {
            id: a
        });
        return i
    };
    this.pause = function (a) {
        var i = c[a];
        i.paused || (i.pause(), this.trigger(b.PAUSED, {}, {
            id: a
        }))
    };
    this.resume = function (a) {
        var i = c[a];
        i.paused && (i.play(), this.trigger(b.PLAYING, {}, {
            id: a
        }))
    };
    this.stop = function (a) {
        var i = c[a];
        i.pause();
        i.currentTime = 0;
        i.src = "";
        this.trigger(b.STOPPED, {}, {
            id: a
        })
    };
    this.load = function (a, b) {
        c[a].src = b
    };
    this.play = function (a, i) {
        typeof i === "undefined" && (i = 0);
        var d = c[a];
        d.currentTime = Math.floor(i * 0.001);
        d.play();
        this.trigger(b.PLAYING, {}, {
            id: a
        });
        this.trigger(b.ACTIVE_PLAYER_CHANGED, {
            id: a
        }, {
            id: a
        })
    };
    this.setVolume = function (a, b) {
        c[a].volume = b
    };
    this.getVolume = function (a) {
        return c[a].volume
    };
    this.getDuration = function (a) {
        return c[a].duration
    };
    this.hasSound = function () {
        return this.hasSoundCapabilities
    };
    this.addPlayer = function (b,
    i) {
        var d = document.createElement("audio");
        d.id = i;
        d.addEventListener("progress", a, !1);
        d.addEventListener("canplaythrough", a, !1);
        d.addEventListener("playing", a, !1);
        d.addEventListener("ended", a, !1);
        d.addEventListener("loadeddata", a, !1);
        f.appendChild(d);
        c[i] = d
    };
    this.removePlayerAtIndex = function (a) {
        a = c[a];
        return typeof a !== "undefined" ? (f.removeChild(a), !0) : !1
    };
    this.initializePlayerById = function () {};
    this.initialize = function () {
        this.trigger(b.READY)
    };
    this.onLoad = function () {};
    this.onPlay = function () {};
    this.onPause = function () {};
    this.onStop = function () {};
    this.onTrackEnded = function () {};
    this.onSongLoaded = function () {};
    this.onPositionChanged = function () {};
    this.onInvalidTrackUri = function () {};
    this.onPlaybackFailed = function () {}
};
Spotify.Parsers.Metadata = function () {
    var g = Spotify.Utils,
        f = function (a, b) {
            return a == "premium" && b.catalogue == "premium" ? !0 : a == "available"
        }, d = function (a, b) {
            for (var c = 0, h = b.length; c < h; c += 2) if (a[0] == b[c] && a[1] == b[c + 1]) return !0;
            return !1
        }, b = function (c, d) {
            if (c.gid != void 0) c.id = g.str2hex(c.gid), delete c.gid;
            if (c.artist != void 0) for (var n = 0, o = c.artist.length; n < o; ++n) c.artist[n] = a(c.artist[n], null);
            if (c.disc != void 0) {
                n = 0;
                for (o = c.disc.length; n < o; ++n) {
                    var k = c.disc,
                        p = n,
                        q = c.disc[n];
                    if (q.track != void 0) for (var s = 0, t = q.track.length; s < t; ++s) q.track[s] = i(q.track[s], null);
                    k[p] = q
                }
            }
            if (d != null) c.availability = h(c.restriction, d), c.playable = f(c.availability, d);
            c.restriction != void 0 && delete c.restriction;
            if (c.related != void 0) {
                n = 0;
                for (o = c.related.length; n < o; ++n) c.related[n] = b(c.related[n], null)
            }
            c.cover != void 0 && delete c.cover;
            return c
        }, c = ["album_group", "single_group", "compilation_group", "appears_on_group"],
        a = function (d, m) {
            if (d.gid != void 0) d.id = g.str2hex(d.gid), delete d.gid;
            if (d.top_track != void 0) {
                for (var n = d.top_track, o = [], k = 0, p = n.length; k < p; ++k) {
                    var q = n[k];
                    if (q.country != void 0 && q.country == m.country) {
                        if (q.track != void 0) o = n[k].track;
                        break
                    }
                }
                k = 0;
                for (p = o.length; k < p; ++k) o[k] = i(o[k], null);
                d.top_track = o
            }
            n = 0;
            for (o = c.length; n < o; ++n) if (k = c[n], d[k] != void 0) {
                for (var p = d[k], q = 0, s = p.length; q < s; ++q) {
                    var t = p,
                        y = q,
                        w = p[q],
                        v = m,
                        x = [];
                    if (w.album != void 0) for (var x = w.album, w = 0, D = x.length; w < D; ++w) x[w] = b(x[w], v);
                    t[y] = x
                }
                d[k] = p
            }
            if (d.biography != void 0) {
                n = 0;
                for (o = d.biography.length; n < o; ++n) k = d.biography, p = n, q = d.biography[n], q.portrait != void 0 && delete q.portrait, k[p] = q
            }
            if (m != null) d.availability = h(d.restriction, m), d.playable = f(d.availability, m);
            d.restriction != void 0 && delete d.restriction;
            if (d.related != void 0) {
                n = 0;
                for (o = d.related.length; n < o; ++n) d.related[n] = a(d.related[n], null)
            }
            d.portrait != void 0 && delete d.portrait;
            return d
        }, h = function (a, b) {
            var c = {}, h = !1;
            if (typeof a === "undefined" || a.length == 0) return "available";
            for (var i = 0, f = a.length; i < f; ++i) {
                var g = a[i],
                    s, t = !0;
                g.countries_allowed != void 0 ? (t = g.countries_allowed.length != 0, s = d(b.country, g.countries_allowed)) : s = g.countries_forbidden !== void 0 ? !d(b.country, g.countries_forbidden) : !1;
                if (s && g.catalogue != void 0) for (s = 0; s < g.catalogue.length; ++s) {
                    var y = g.catalogue[s];
                    if (y.toLowerCase() == "ad" || y.toLowerCase() == "free") c.free = !0;
                    else if (y.toLowerCase() == "subscription" || y.toLowerCase() == "premium") c.premium = !0
                }
                if (g.type == void 0 || g.type.toLowerCase() == "streaming") h |= t
            }
            return h && b.catalogue == "all" ? "available" : c[b.catalogue] ? b.catalogue == "premium" ? "premium" : "available" : c.premium ? "premium" : h ? "regional" : "unavailable"
        },
        i = function (c, d) {
            if (c.gid != void 0) c.id = g.str2hex(c.gid), delete c.gid;
            if (c.album != void 0) c.album = b(c.album, null);
            if (c.artist != void 0) for (var n = 0, o = c.artist.length; n < o; ++n) c.artist[n] = a(c.artist[n], null);
            if (d != null) {
                var n = h(c.restriction, d),
                    o = f(n, d),
                    k;
                if (k = o) {
                    a: {
                        if (c.file != void 0) {
                            k = 0;
                            for (var p = c.file.length; k < p; ++k) if (c.file[k].format == "MP3_160") {
                                k = !0;
                                break a
                            }
                            delete c.file
                        }
                        k = !1
                    }
                    k = !k
                }
                k && (n = "unavailable", o = !1);
                c.availability = n;
                c.playable = o
            }
            c.restriction != void 0 && delete c.restriction;
            if (c.playable) c.playableId = c.id;
            else if (c.alternative != void 0) {
                n = 0;
                for (o = c.alternative.length; n < o; ++n) if (k = i(c.alternative[n], d), k.playable) {
                    c.availability = k.availability;
                    c.playable = k.playable;
                    c.playableId = k.id;
                    break
                }
                delete c.alternative
            }
            return c
        };
    return {
        isPlayable: f,
        parseRestrictions: h,
        parseTrack: i,
        parseAlbum: b,
        parseArtist: a
    }
}();
Spotify.Parsers.Search = function () {
    var g = Spotify.DebuggerJS,
        f = function (a) {
            return a ? Spotify.Utils.isArray(a) ? a : [a] : []
        }, d = function (a, b) {
            if (!a.id) return {};
            if (a["album-type"]) a.type = a["album-type"].toUpperCase();
            if (a["artist-id"] && a["artist-name"]) {
                var d = a.artists = [];
                if (Spotify.Utils.isArray(a["artist-id"]) && Spotify.Utils.isArray(a["artist-name"])) for (var i = Math.min(a["artist-id"].length, a["artist-name"].length), f = 0; f < i; ++f) d.push({
                    id: a["artist-id"][f],
                    name: a["artist-name"][f]
                });
                else d.push({
                    id: a["artist-id"],
                    name: a["artist-name"]
                })
            }
            a.cover = c(a);
            if (a.popularity) a.popularity = Math.round(parseFloat(a.popularity) * 100);
            if (a.restrictions) a.restrictions = h(a.restrictions.restriction);
            a.availability = Spotify.Parsers.Metadata.parseRestrictions(a.restrictions, b);
            a.playable = Spotify.Parsers.Metadata.isPlayable(a.availability, b);
            delete a.restrictions;
            delete a["album-type"];
            delete a["artist-id"];
            delete a["artist-name"];
            delete a["external-ids"];
            delete a["cover-small"];
            delete a["cover-large"];
            return a
        }, b = function (a, b) {
            if (!a.id) return {};
            if (a.portrait) {
                var c = a.portrait,
                    d = [];
                c.id && d.push({
                    size: "DEFAULT",
                    file_id: c.id,
                    width: parseInt(c.width),
                    height: parseInt(c.height)
                });
                c.small && d.push({
                    size: "SMALL",
                    file_id: c.small
                });
                c.large && d.push({
                    size: "LARGE",
                    file_id: c.large
                });
                a.portrait = d
            }
            if (a.popularity) a.popularity = Math.round(parseFloat(a.popularity) * 100);
            if (a.restrictions) a.restrictions = h(a.restrictions.restriction);
            a.availability = Spotify.Parsers.Metadata.parseRestrictions(a.restrictions, b);
            a.playable = Spotify.Parsers.Metadata.isPlayable(a.availability,
            b);
            delete a.restrictions;
            return a
        }, c = function (a) {
            var b = [];
            a.cover && (b.push({
                size: "DEFAULT",
                file_id: a.cover
            }), delete a.cover);
            a["cover-small"] && (b.push({
                size: "SMALL",
                file_id: a["cover-small"]
            }), delete a["cover-small"]);
            a["cover-large"] && (b.push({
                size: "LARGE",
                file_id: a["cover-large"]
            }), delete a["cover-large"]);
            return b
        }, a = function (a) {
            return !a.uri ? {} : a
        }, h = function (a) {
            for (var a = f(a), b = 0, c = a.length; b < c; ++b) {
                var h = a[b]["@attributes"],
                    d = {};
                if (h.allowed !== void 0) d.countries_allowed = h.allowed.replace(/,/g,
                    "");
                if (h.forbidden !== void 0) d.countries_forbidden = h.forbidden.replace(/,/g, "");
                if (h.catalogues !== void 0) d.catalogue = h.catalogues.split(",");
                a[b] = d
            }
            return a
        }, i = function (a, b) {
            if (!a.id) return {};
            if (a.album && a["album-id"]) a.album = {
                name: a.album,
                id: a["album-id"],
                artist: {
                    name: a["album-artist"],
                    id: a["album-artist-id"]
                },
                cover: c(a)
            };
            if (a["album-artist"] && a["album-artist-id"]) {
                a.album = a.album || {};
                var d = a.album.artists = [];
                if (Spotify.Utils.isArray(a["album-artist"]) && Spotify.Utils.isArray(a["album-artist-id"])) for (var g = Math.min(a["album-artist"].length, a["album-artist-id"].length), l = 0; l < g; ++l) d.push({
                    id: a["album-artist-id"][l],
                    name: a["album-artist"][l]
                });
                else d.push({
                    id: a["album-artist-id"],
                    name: a["album-artist"]
                })
            }
            if (a.artist && a["artist-id"]) if (d = a.artists = [], Spotify.Utils.isArray(a.artist) && Spotify.Utils.isArray(a["artist-id"])) {
                g = Math.min(a.artist.length, a["artist-id"].length);
                for (l = 0; l < g; ++l) d.push({
                    id: a["artist-id"][l],
                    name: a.artist[l]
                })
            } else d.push({
                id: a["artist-id"],
                name: a.artist
            });
            if (a.length) a.length = parseInt(a.length);
            if (a.popularity) a.popularity = Math.round(parseFloat(a.popularity) * 100);
            if (a.number) a.number = parseInt(a["track-number"]);
            if (a.year) a.year = parseInt(a.year);
            if (a.title) a.name = a.title;
            if (a.restrictions) a.restrictions = h(a.restrictions.restriction);
            a.availability = Spotify.Parsers.Metadata.parseRestrictions(a.restrictions, b);
            a.playable = Spotify.Parsers.Metadata.isPlayable(a.availability, b);
            if (a.playable) a.playableId = a.id;
            else if (a.alternatives) {
                d = f(a.alternatives.track);
                l = 0;
                for (g = d.length; l < g; ++l) {
                    var q = i(d[l],
                    b);
                    if (q.playable) {
                        a.availability = q.availability;
                        a.playable = q.playable;
                        a.playableId = q.id;
                        break
                    }
                }
            }
            delete a.alternatives;
            delete a.restrictions;
            delete a["album-id"];
            delete a["album-artist"];
            delete a["album-artist-id"];
            delete a.artist;
            delete a.cover;
            delete a["cover-small"];
            delete a["cover-large"];
            delete a["artist-id"];
            delete a["external-ids"];
            delete a.files;
            delete a["track-number"];
            delete a.title;
            return a
        }, l = function (a, b, c) {
            for (var a = f(a), h = 0, d = a.length; h < d; ++h) a[h] = c(a[h], b);
            return a
        };
    return {
        parse: function (c,
        h) {
            var f = (new Date).getTime(),
                k = Spotify.Utils.convertStringToXML(c),
                k = Spotify.Utils.convertXMLToJSON(k.documentElement);
            if (k.albums) k.albums = l(k.albums.album, h, d);
            if (k.artists) k.artists = l(k.artists.artist, h, b);
            if (k.tracks) k.tracks = l(k.tracks.track, h, i);
            if (k.playlists) k.playlists = l(k.playlists.playlist, h, a);
            if (k["did-you-mean"]) k.didYouMean = k["did-you-mean"], delete k["did-you-mean"];
            k.total = {
                albums: parseInt(k["total-albums"]),
                artists: parseInt(k["total-artists"]),
                tracks: parseInt(k["total-tracks"]),
                playlists: parseInt(k["total-playlists"])
            };
            delete k["total-albums"];
            delete k["total-artists"];
            delete k["total-tracks"];
            delete k["total-playlists"];
            delete k.version;
            g.log("Spotify.Parsers.Search", ["It took", (new Date).getTime() - f, "ms to parse the search result"], "parsing_times");
            return k
        }
    }
}();
Spotify.Parsers.Suggest = function () {
    var g = Spotify.Link,
        f = Spotify.Utils,
        d = function (b) {
            for (var c = 0, a = b.length; c < a; ++c) {
                var h = b[c];
                if (h.gid) h.id = f.str2hex(h.gid), delete h.gid;
                if (h.image) h.image = f.str2hex(h.image);
                if (h.image_uri) {
                    var d = g.fromString(h.image_uri);
                    h.image = d.id || d.ids[0];
                    delete h.image_uri
                }
                d = h.artists = [];
                if (Spotify.Utils.isArray(h.artist_gid) && Spotify.Utils.isArray(h.artist_name)) for (var l = Math.min(h.artist_name.length, h.artist_gid.length), m = 0; m < l; ++m) d.push({
                    id: f.str2hex(h.artist_gid[m]),
                    name: h.artist_name[m]
                });
                delete h.artist_gid;
                delete h.artist_name;
                if (h.owner_uri && h.owner_name) h.user = {
                    uri: h.owner_uri,
                    name: h.owner_name
                };
                delete h.owner_name;
                delete h.owner_uri;
                if (h.rank) h.popularity = Math.round(h.rank * 100 / 2147483647), delete h.rank
            }
            return b
        };
    return {
        parse: function (b) {
            return {
                artists: d(b.artist || []),
                albums: d(b.album || []),
                tracks: d(b.track || []),
                playlist: d(b.playlist || [])
            }
        }
    }
}();
Spotify.Parsers.Playlist = function () {
    var g = function (f) {
        var d = [];
        if (typeof f !== "undefined" && typeof f.items !== "undefined") for (var b = 0; b < f.items.length; b++) {
            var c;
            a: {
                var a = f.items[b],
                    h = null;
                if (typeof a !== "undefined" && typeof a.uri !== "undefined") try {
                    h = Spotify.Link.fromString(a.uri);
                    if (h.type === "collectiontracklist") {
                        c = null;
                        break a
                    }
                    if (h.username && encodeURIComponent(encodeURIComponent(h.username)) == h.username) h.username = decodeURIComponent(h.username)
                } catch (i) {
                    h = Spotify.Link.emptyLink()
                }
                c = h || Spotify.Link.emptyLink()
            }
            c !== null && d.push(c)
        }
        return d
    };
    this.parsePlaylist = function (f) {
        if (typeof f.contents !== "undefined") f.contents = g(f.contents);
        if (typeof f.revision !== "undefined") f.revision = Spotify.Utils.str2hex(f.revision);
        return f
    };
    this.parsePublishedPlaylist = function (f) {
        if (typeof f.contents !== "undefined") f.contents = g(f.contents), f.length = f.contents.length;
        if (typeof f.revision !== "undefined") f.revision = Spotify.Utils.str2hex(f.revision);
        return f
    };
    this.parseMetadata = function (f) {
        return f.attributes
    }
};
Spotify.Parsers.AdChooser = {
    parseServerResponse: function (g) {
        g = Spotify.Utils.convertStringToXML(g);
        return Spotify.Utils.convertXMLToJSON(g.documentElement)
    },
    parseAudioAdsVersion1: function (g) {
        var f = {
            "audio-ad-break": {},
            AdQueueEntry: []
        }, d = {};
        try {
            if (typeof g.rules.rule !== "undefined") for (var b = 0, c = g.rules.rule.length; b < c; b += 1) {
                var a = g.rules.rule[b];
                d[a.id] = a
            }
            f["audio-ad-break"] = g["audio-ad-break"];
            if (typeof g.ads["audio-ad"] !== "undefined") {
                var h = [];
                g.ads["audio-ad"].length > 0 ? h = g.ads["audio-ad"] : typeof g.ads["audio-ad"].ad_version !==
                    "undefined" && h.push(g.ads["audio-ad"]);
                b = 0;
                for (c = h.length; b < c; b += 1) {
                    for (var i = h[b], g = [], l = 0, m = i.rules.id.length; l < m; l += 1) a = i.rules.id[l], g.push(d[a]);
                    for (var l = null, n = 0, o = i.files.file.length; n < o; n += 1) {
                        var k = i.files.file[n];
                        if (k["@attributes"].format === "MPEG 1 layer 3,160000,0,1,1") {
                            l = k["@attributes"].id;
                            break
                        }
                    }
                    var p = {
                        has_been_played: !1,
                        has_been_clicked: !1,
                        adPlayCount: 0,
                        campaignPlayCount: 0,
                        ids_valid: !0,
                        non_explicit: i["non-explicit-only"] || 0,
                        is_test_ad: !1,
                        priority: parseFloat(i.priority),
                        duration: parseInt(i.duration,
                        10),
                        min_duration: 0,
                        ad_version: i.ad_version || 1,
                        start_time_earliest: parseInt(i.starttime),
                        start_time_latest: parseInt(i.endtime),
                        campaign_expiry: parseInt(i.expiry),
                        adclass: 0,
                        adchooserkind: null,
                        adkind: "ENC_AD_AUDIO",
                        rules: g,
                        ad_id: i.id,
                        campaign_id: i.campaign,
                        advertiser: i.advertiser,
                        target_url: i.url,
                        token: i.token,
                        tracking_url: typeof i["tracking-url"] === "string" ? i["tracking-url"] : null,
                        files: i.files,
                        image_id: i.image,
                        embed: null,
                        banner_size: null,
                        banner_type: null,
                        html: null,
                        title: i.title,
                        caption: i.caption,
                        file_id: l,
                        large_bgcolor: null,
                        large_image_id: null,
                        fullscreen_delay: null,
                        fullscreen_inactivity_timeout: null,
                        background_target_url: null,
                        message: null,
                        level: null
                    };
                    f.AdQueueEntry.push(p)
                }
            }
        } catch (q) {}
        return f
    }
};
Spotify.Parsers.RTMP = function () {
    return {
        parseURL: function (g) {
            var f = Spotify.Utils.parseURL(g);
            return {
                server: f.protocol + "://" + f.host + "/cfx/st",
                protocol: f.protocol,
                url: g,
                file: "mp3:" + f.relative.replace("/cfx/st/", "")
            }
        }
    }
}();
Spotify.Services.Suggest = function (g) {
    Spotify.EventTarget.call(this);
    var f = this,
        d, b, c = !1,
        a = null,
        h = new Spotify.Events,
        i = function () {
            (c = !0) && a != null && f.trigger(h.READY)
        }, l = function (b) {
            a = b.response;
            c && a != null && f.trigger(h.READY)
        }, m = function () {
            a = null
        };
    this.onReady = function (b, d) {
        c && a != null ? b.call(d) : f.bind(h.READY, b, d)
    };
    this.suggest = function (h, i, f) {
        c && a != null ? (h = encodeURIComponent(h), (new Spotify.Hermes.ProtobufRequest({
            uri: "hm://searchsuggest/suggest/" + h + "?country=" + a.country + "&catalogues=" + a.catalogue,
            method: "GET"
        }, [], [], [b.msg("Suggestions")])).send(d, function (a, b) {
            if (b == 200) {
                var c = Spotify.Parsers.Suggest.parse(a[0]);
                i(c, b)
            } else f(new Spotify.Errors.Error([13, b, ""]))
        }, f, !1, !1, "searchsuggest")) : f(new Spotify.Errors.Error([13, 503, "Suggest service not ready!"]))
    };
    this.init = function (a, c) {
        d = a;
        c.onReady(function () {
            c.getUserInfo(l, m)
        }, this);
        try {
            b = new Spotify.Protobuf.Schema([], null, null, null), b.id = "suggest", b.type = "proto", b.setData(g), b.encode(), i.call(this, i)
        } catch (h) {
            throw h;
        }
    }
};
Spotify.Services.AppStore = function (g) {
    Spotify.EventTarget.call(this);
    var f = new Spotify.Events,
        d, b, c = function () {
            this.serviceIsReady = !0;
            this.trigger(f.READY)
        };
    this.serviceIsReady = !1;
    this.onReady = function (a, b) {
        this.serviceIsReady ? a.call(b) : this.bind(f.READY, a, b)
    };
    this.list = function (a, c, i) {
        if (this.serviceIsReady) {
            var f = [b.msg("RequestHeader")],
                g = [b.msg("AppList")];
            (new Spotify.Hermes.ProtobufRequest({
                uri: "hm://appstore/app/list",
                method: "GET"
            }, a, f, g)).send(d, c, i, !1, !1, "appstore")
        } else i(new Spotify.Errors.Error([13,
        503, "Appstore service not ready!"]))
    };
    this.init = function (a) {
        d = a;
        try {
            b = new Spotify.Protobuf.Schema([], null, null, null), b.id = "appstore", b.type = "proto", b.setData(g), b.encode(), c.call(this, c)
        } catch (h) {
            throw h;
        }
    }
};
Spotify.Services.PopCount = function (g) {
    var f = new Spotify.Events,
        d, b, c = function () {
            this.serviceIsReady = !0;
            this.trigger(f.READY)
        };
    this.serviceIsReady = !1;
    this.onReady = function (a, b) {
        this.serviceIsReady ? a.call(b) : this.bind(f.READY, a, b)
    };
    this.get = function (a, c, i, f, g, n) {
        this.serviceIsReady ? (a = {
            uri: "hm://popcount/" + Spotify.Link.fromString(a).toURLPath() + "?maxUsers=" + (typeof c === "number" ? c : 100) + (typeof i === "boolean" ? "&friendsFirst=" + i : "") + (typeof f === "string" ? "&afterUser=" + f : ""),
            method: "GET"
        }, c = [b.msg("PopcountResult")], (new Spotify.Hermes.ProtobufRequest(a, [], [], c)).send(d, g, n, !1, !1, "PopCount")) : n(new Spotify.Errors.Error([13, 503, "PopCount service not ready!"]))
    };
    this.init = function (a) {
        Spotify.EventTarget.call(this);
        d = a;
        try {
            b = new Spotify.Protobuf.Schema([], null, null, null), b.id = "popcount", b.type = "proto", b.setData(g), b.encode(), c.call(this, c)
        } catch (h) {
            throw h;
        }
    }
};
(function () {
    var g = Spotify.Link,
        f = Spotify.Parsers.Metadata;
    Spotify.Services.Metadata = function (d) {
        var b, c, a = null,
            h = !1,
            i = null,
            l = new Spotify.Events,
            m = function () {
                (h = !0) && i != null && b.trigger(l.READY)
            }, n = function (a) {
                i = a.response;
                h && i != null && b.trigger(l.READY)
            }, o = function () {
                i = null
            }, k = function (a) {
                switch (a.type) {
                    case g.Type.TRACK:
                        return "hm://metadata/track/" + a.id;
                    case g.Type.ALBUM:
                        return "hm://metadata/album/" + a.id;
                    case g.Type.ARTIST:
                        return "hm://metadata/artist/" + a.id;
                    default:
                        throw Error("Unsupported link type!");
                }
            }, p = function (a) {
                switch (a) {
                    case g.Type.TRACK:
                        return "hm://metadata/tracks";
                    case g.Type.ALBUM:
                        return "hm://metadata/albums";
                    case g.Type.ARTIST:
                        return "hm://metadata/artists";
                    default:
                        throw Error("Unsupported link type!");
                }
            }, q = function (b) {
                switch (b) {
                    case g.Type.TRACK:
                        return a.msg("Track");
                    case g.Type.ALBUM:
                        return a.msg("Album");
                    case g.Type.ARTIST:
                        return a.msg("Artist");
                    default:
                        throw Error("Unsupported link type!");
                }
            }, s = function (a, b, h) {
                var d = function (c, d) {
                    if (Spotify.Hermes.Request.isSuccess(d)) {
                        var l = c[0];
                        switch (a.type) {
                            case g.Type.TRACK:
                                l = f.parseTrack(l, i);
                                break;
                            case g.Type.ALBUM:
                                l = f.parseAlbum(l, i);
                                break;
                            case g.Type.ARTIST:
                                l = f.parseArtist(l, i);
                                break;
                            default:
                                throw Error("Unsupported link type!");
                        }
                        b(l, d)
                    } else h(d)
                };
                this.send = function () {
                    (new Spotify.Hermes.ProtobufRequest({
                        uri: k(a),
                        method: "GET"
                    }, [], [], [q(a.type)])).send(c, d, h, !1, !1, "metadata")
                }
            }, t = function (b, h, d) {
                var l = b[0].type,
                    m = function (a, b) {
                        if (Spotify.Hermes.Request.isSuccess(b)) {
                            var c = a[0],
                                m = q(l),
                                k;
                            a: switch (l) {
                                case g.Type.TRACK:
                                    k = f.parseTrack;
                                    break a;
                                case g.Type.ALBUM:
                                    k = f.parseAlbum;
                                    break a;
                                case g.Type.ARTIST:
                                    k = f.parseArtist;
                                    break a;
                                default:
                                    throw Error("Unsupported link type!");
                            }
                            if (c.reply == void 0) d(400);
                            else {
                                for (var c = c.reply, n = 0, o = c.length; n < o; ++n) {
                                    var p = c[n];
                                    p && Spotify.Hermes.Request.isSuccess(p.status_code) ? (p = m.parseFromStringSync(p.body), p = k(p, i)) : p = null;
                                    c[n] = p
                                }
                                h(c, b)
                            }
                        } else d(b)
                    };
                this.send = function () {
                    for (var h = [], i = 0, f = b.length; i < f; ++i) h.push({
                        uri: k(b[i])
                    });
                    (new Spotify.Hermes.ProtobufRequest({
                        uri: p(l),
                        method: "GET",
                        content_type: "vnd.spotify/mercury-mget-request"
                    }, [{
                        request: h
                    }], [a.msg("MercuryMultiGetRequest")], [a.msg("MercuryMultiGetReply")])).send(c, m, d, !1, !1, "metadata")
                }
            }, y = function (a) {
                if (a instanceof Spotify.Link) return a;
                else if (typeof a === "string" || a instanceof String) return g.fromString(a);
                else throw Error("Invalid argument!");
            };
        return {
            onReady: function (a, c) {
                h && i != null ? a.call(c) : b.bind(l.READY, a, c)
            },
            lookup: function (a, b, c) {
                if (h && i != null) if (Spotify.Utils.isArray(a)) if (a.length > 1) {
                    for (var d = Math.ceil(a.length / 100), f = !1, g = [], l = [], m = function (a) {
                        f || (Array.prototype.push.apply(l,
                        a), --d == 0 && b(l, 200))
                    }, k = function (a) {
                        f = !0;
                        c(a)
                    }, n = 0, o = a.length; n < o; ++n) g.push(y(a[n]));
                    do(new t(g.splice(0, 100), m, k)).send();
                    while (g.length > 0)
                } else a.length == 1 ? (new s(y(a[0]), function (a, c) {
                    b([a], c)
                }, c)).send() : c(Error("Array does not contain any items!"));
                else(new s(y(a), b, c)).send();
                else c(Error("Service not ready!"))
            },
            init: function (h, i) {
                Spotify.EventTarget.call(this);
                b = this;
                c = h;
                i.onReady(function () {
                    i.getUserInfo(n, o)
                }, this);
                try {
                    a = new Spotify.Protobuf.Schema([], null, null, null), a.id = "metadata", a.type =
                        "proto", a.setData(d), a.encode(), m.call(this, m)
                } catch (f) {
                    throw f;
                }
            }
        }
    }
})();
Spotify.Services.Search = function () {
    var g, f, d = null,
        b = new Spotify.Events,
        c = function (a) {
            d = a.response;
            d != null && g.trigger(b.READY)
        }, a = function () {
            d = null
        };
    this.DEFAULT_TOTAL_RESULTS = 50;
    this.TRACKS = 1;
    this.ALBUMS = 2;
    this.ARTISTS = 4;
    this.PLAYLISTS = 8;
    this.ALL = this.TRACKS | this.ALBUMS | this.ARTISTS | this.PLAYLISTS;
    this.onReady = function (a, c) {
        d != null ? a.call(c) : g.bind(b.READY, a, c)
    };
    this.search = function (a, b, c, g) {
        if (d != null) if (typeof a === "undefined" || a === "") g(new Spotify.Errors.Error([403, 0, "You haven't provided a valid query"]));
        else {
            b = b || {};
            b.type = b.type || this.ALL;
            b.total = b.total || this.DEFAULT_TOTAL_RESULTS;
            b.offset = b.offset || 0;
            if (b.total > this.DEFAULT_TOTAL_RESULTS) b.total = this.DEFAULT_TOTAL_RESULTS;
            f.rpc("search", [a, b.type, b.total, b.offset], function (a) {
                a = Spotify.Parsers.Search.parse(a.response, d);
                c(a)
            }, g, this, !1, 2, "search")
        } else g(new Spotify.Errors.Error([503, 0, "Search service not ready!"]))
    };
    this.init = function (b, d) {
        Spotify.EventTarget.call(this);
        g = this;
        f = b;
        d.onReady(function () {
            d.getUserInfo(c, a)
        }, this)
    }
};
Spotify.Services.Toplist = function (g) {
    Spotify.EventTarget.call(this);
    var f = this,
        d, b, c = !1,
        a = null,
        h = new Spotify.Cache.Default,
        i = !1,
        l = new Spotify.Events,
        m = !1,
        n = !1,
        o = !1,
        k = function () {
            return c && i && a != null
        }, p = function () {
            m && n && o && f.trigger(l.READY)
        }, q = function () {
            f.lookupForUser(a.user, f.PLAYLIST, function () {
                o = !0;
                p()
            }, function () {
                o = !0;
                p()
            });
            f.lookupForUser(a.user, f.TRACK, function (a) {
                var b = !1;
                Spotify.Utils.isArray(a) ? a.length === 0 && (b = !0) : b = !0;
                b ? s() : (m = !0, p())
            }, function () {
                s()
            });
            f.lookupForUser(a.user, f.ARTIST,

            function (a) {
                var b = !1;
                Spotify.Utils.isArray(a) ? a.length === 0 && (b = !0) : b = !0;
                b ? t() : (n = !0, p())
            }, function () {
                t()
            })
        }, s = function () {
            f.lookupForRegion(f.GLOBAL, f.TRACK, function () {
                m = !0;
                p()
            }, function () {
                m = !0;
                p()
            })
        }, t = function () {
            f.lookupForRegion(f.GLOBAL, f.ARTIST, function () {
                n = !0;
                p()
            }, function () {
                n = !0;
                p()
            })
        }, y = function () {
            c = !0;
            k() && q()
        }, w = function (b) {
            a = b.response;
            k() && q()
        }, v = function () {
            a = null
        }, x = function () {
            i = !0;
            k() && q()
        }, D = function () {
            i = !1
        }, A = {
            track: Spotify.Link.trackLink,
            album: Spotify.Link.albumLink,
            artist: Spotify.Link.artistLink,
            playlist: Spotify.Link.playlistLink
        }, u = function (c, i, f, g, l, m, k) {
            var k = k || a.user,
                n = function (a) {
                    if (a[0].items != void 0) {
                        for (var a = a[0].items, b = 0, d = a.length; b < d; ++b) a[b] = A[f](a[b]);
                        h.put(c, a);
                        g(a, f, 200)
                    } else if (a[0].uris != void 0) {
                        a = a[0].uris;
                        b = 0;
                        for (d = a.length; b < d; ++b) a[b] = Spotify.Link.fromString(a[b]);
                        h.put(c, a);
                        g(a, f, 200)
                    } else h.put(c, []), g([], f, 200)
                }, o = function (a, c) {
                    if (c != null) g(c, f, 200);
                    else {
                        var h = [],
                            m = [],
                            o = [];
                        f === "playlist" ? (h = [b.msg("TopPlaylistsRequest")], m = [b.msg("TopPlaylistsReply")], o.push({
                            username: k
                        })) : m = [b.msg("Toplist")];
                        (new Spotify.Hermes.ProtobufRequest({
                            uri: i,
                            method: "GET"
                        }, o, h, m)).send(d, n, l, !1, !1, "toplist")
                    }
                };
            m ? o(c, null) : h.get(c, o)
        };
    this.TRACK = "track";
    this.ALBUM = "album";
    this.ARTIST = "artist";
    this.PLAYLIST = "playlist";
    this.GLOBAL = "global";
    this.onReady = function (b, h) {
        c && i && a != null && m && n && o ? b.call(h) : f.bind(l.READY, b, h)
    };
    this.lookupForUser = function (b, c, h, d, i) {
        if (k()) {
            var b = b || a.user,
                f = Spotify.Link.userToplistLink(b, c).toURI(),
                g = "hm://toplist/toplist/user/" + b + "?type=" + c;
            c === "playlist" && (g = "hm://socialgraph/suggestions/topplaylists");
            u(f, g, c, h, d, i, b)
        } else d(new Spotify.Errors.Error([13, 503, "Toplist service not ready!"]))
    };
    this.lookupForRegion = function (b, c, h, d, i) {
        if (k) {
            var b = b || a.country,
                f = b == "global",
                g = Spotify.Link.toplistLink(c, f ? null : b, f).toURI();
            u(g, f ? "hm://toplist/toplist/region?type=" + c : "hm://toplist/toplist/region/" + b + "?type=" + c, c, h, d, i)
        } else d(new Spotify.Errors.Error([13, 503, "Toplist service not ready!"]))
    };
    this.init = function (a, c) {
        d = a;
        c.onReady(function () {
            c.getUserInfo(w, v)
        }, this);
        h.initialize(x, D, this);
        try {
            b = new Spotify.Protobuf.Schema([],
            null, null, null), b.id = "toplist", b.type = "proto", b.setData(g), b.encode(), y.call(this, y)
        } catch (i) {
            throw i;
        }
    }
};
Spotify.Services.Playlist = function (g) {
    Spotify.EventTarget.call(this);
    this.DEFAULT_TOTAL_RESULTS = 200;
    var f = Spotify.Utils.isArray,
        d = Spotify.DebuggerJS,
        b = this,
        c, a, h = null,
        i, l = !1,
        m = !1,
        n, o = new Spotify.Events,
        k = new Spotify.Parsers.Playlist,
        p = [],
        q = null,
        s = {}, t = function () {
            m = !0;
            x()
        }, y = function (a) {
            h = a.response;
            x()
        }, w = function () {
            h = null
        }, v = function () {
            return m && h != null && l
        }, x = function () {
            v() && (J(), b.trigger(o.READY))
        }, D = function (a, b) {
            b = typeof b !== "undefined" && b.length ? "?" + b.join("&") : "";
            return "hm://playlist/" + a.split(":").join("/").substr(8) + b
        }, A = function (a) {
            return function () {
                for (var b = 0; b < a.length; b++) typeof a[b] === "function" && a[b].apply(this, arguments)
            }
        }, u = function (a, b, d, i, f, g) {
            var l = [];
            a === "ADD" && l.push("add_first=true");
            a = "APPEND" === a ? "ADD" : a;
            (a === "ADD" || a === "REMOVE" || a === "MODIFY") && l.push("syncpublished=true");
            var m = [],
                m = a === "REMOVE" || a === "ADD" || a === "APPEND" ? [] : [n.msg("OpList")],
                k = [];
            a === "MODIFY" ? k = [n.msg("ModifyReply")] : a === "PUT" && (k = [n.msg("CreateListReply")]);
            d && a === "MODIFY" && (d = M(d.revision), l.push("revision=" + d));
            var o = {
                uri: D(b,
                l),
                method: a
            }, p = 0,
                q = 0,
                t = function () {
                    (new Spotify.Hermes.ProtobufRequest(o, [i], m, k)).send(c, function (c) {
                        var d = c[0].revision || c[0];
                        typeof s[b] === "undefined" && (s[b] = {
                            string: "",
                            blob: ""
                        });
                        s[b].blob = d;
                        var d = [],
                            g = [];
                        typeof i === "string" && (d = i.split(","));
                        for (var l = 0, m = d.length; l < m; l += 1) {
                            var k = Spotify.Link.fromString(d[l]);
                            a === "ADD" && b !== Spotify.Link.publishedRootlistLink(h.user).toURI() && k.type === "playlist" && g.push(k)
                        }
                        g.length > 0 && G(g);
                        typeof f === "function" && (a === "PUT" ? f(c) : f(!0));
                        c = o.method === "PUT" && c[0].uri ? c[0].uri : o.uri.split("?")[0];
                        Spotify.Hermes.Cache.removeAllStartingWith(c)
                    }, w, !0, !1, "playlist")
                }, w = function () {
                    q >= 4 ? typeof g === "function" && g.apply(this, arguments) : (p = Math.floor(2 * q * Math.random()) * 500, q++, setTimeout(t, p))
                };
            return t
        }, C = function (a, b, h, d) {
            a = {
                uri: D(a) + "?revision=" + b,
                method: "DIFF"
            };
            b = [n.msg("SelectedListContent")];
            (new Spotify.Hermes.ProtobufRequest(a, [], [], b)).send(c, h, d, !1, !1, "playlist")
        }, J = function () {
            var a;
            if (!v()) throw "Playlist service not ready!";
            a = Spotify.Link.profileLink(h.user);
            d.log("Spotify.Services.Playlist", ["Will try to subscribe to", void 0, void 0, void 0, a], "corejs");
            G([a]);
            b.rootlist({
                total: -1,
                offset: 0
            }, function (a) {
                for (var b = [], c = 0, i = a.contents.length; c < i; c += 1) {
                    var f = a.contents[c];
                    f.username !== h.user && b.push(f)
                }
                b.length > 0 && (d.log("Spotify.Services.Playlist", ["Will try to subscribe to", b], "corejs"), G(b))
            }, H)
        }, G = function (a) {
            var c = [];
            if (!Spotify.Utils.isArray(a)) throw "Playlists argument must be an array";
            if (a.length !== 0) {
                for (var h = 0, d = a.length; h < d; h += 1) typeof a[h] !==
                    "undefined" && c.push("hm://playlist/" + a[h].toURLPath());
                i.subscribe("hm://playlist/", [{
                    uris: c
                }], [n.msg("SubscribeRequest")], F, H, E, b)
            }
        }, F = function (a) {
            d.log("Spotify.Services.Playlist", ["Subscription was a success", a], "corejs")
        }, H = function (a) {
            d.error("Spotify.Services.Playlist", ["Subscription failed", a], "corejs")
        }, E = function (a) {
            var c;
            a.length > 0 && (c = n.msg("PlaylistModificationInfo").parseFromStringSync(Spotify.Utils.Base64.decode(a[3])), d.log("Spotify.Services.Playlist", ["Got a notification", c], "corejs"),
            typeof c.uri !== "undefined" && (Spotify.Link.fromString(c.uri).type === "collectiontracklist" ? d.log("Spotify.Services.Playlist", ["The notification is about the starred list but by using the legacy object collectiontracklist"], "corejs") : (a = s[c.uri], typeof a !== "undefined" && (a.blob === c.new_revision ? d.log("Spotify.Services.Playlist", ["No need to get diffs for", c.uri], "corejs") : Spotify.Link.fromString(c.uri).type === "starred" ? b.trigger(o.CHANGE, {
                uri: c.uri,
                operations: []
            }) : (d.log("Spotify.Services.Playlist", ["Will try to get diffs for",
            c.uri], "corejs"), C(c.uri, s[c.uri].string, function (a) {
                var h = {};
                h.operations = a[0].diff.ops;
                h.uri = c.uri;
                s[c.uri].blob = a[0].revision;
                b.trigger(o.CHANGE, h);
                d.log("Spotify.Services.Playlist", ["Got diffs for", h.uri, h], "corejs")
            }, function (a) {
                d.log("Spotify.Services.Playlist", ["Couldn't get the diffs", a], "corejs")
            }))))))
        }, M = function (a) {
            var b = parseInt(a.substr(0, 8), 16),
                a = a.substr(8);
            return b + "," + a
        }, N = function () {
            J()
        };
    this.onReady = function (a, b) {
        v() ? a.call(b) : this.bind(o.READY, a, b)
    };
    this.metadata = function (a, b,
    h) {
        if (v()) {
            typeof a == "string" && (a = Spotify.Link.fromString(a));
            if (decodeURIComponent(decodeURIComponent(a.username)) == a.username) a.username = encodeURIComponent(a.username);
            var d = {
                uri: D(a.toURI()),
                method: "HEAD"
            }, i = [n.msg("SelectedListContent")];
            (new Spotify.Hermes.ProtobufRequest(d, [], [], i)).send(c, function (c) {
                var d = a.toURI();
                if (typeof c == "undefined" || typeof c[0] == "undefined") h(new Spotify.Errors.Error([13, 404, "No results"]));
                else {
                    c = k.parseMetadata(c[0]);
                    c.owner = Spotify.Link.fromString(d).username;
                    if (encodeURIComponent(encodeURIComponent(c.owner)) == c.owner) c.owner = decodeURIComponent(c.owner);
                    b(c)
                }
            }, h, !1, !1, "playlist")
        } else h(new Spotify.Errors.Error([13, 503, "Playlist service not ready!"]))
    };
    this.subscribe = function (a, b, c) {
        clearTimeout(q);
        if (v()) {
            if (typeof a.publish === "undefined") a.publish = !0;
            for (var h = f(a.uri) ? a.uri : [a.uri], i = h.length; i--;) {
                var g = Spotify.Link.fromString(h[i]);
                if (decodeURIComponent(decodeURIComponent(g.username)) == g.username) g.username = encodeURIComponent(g.username);
                h[i] = g.toURI()
            }
            if (decodeURIComponent(decodeURIComponent(a.username)) == a.username) a.username = encodeURIComponent(a.username);
            p.push({
                username: a.username,
                uri: h,
                callback: b,
                errback: c
            });
            var l = this,
                m;
            q = setTimeout(function () {
                m = p.slice(0);
                q = null;
                p = [];
                for (var b = {}, c = {}, h = {}, i = {}, f = 0; f < m.length; f++) i = m[f], b[i.username] = b[i.username] || [], c[i.username] = c[i.username] || [], h[i.username] = h[i.username] || [], b[i.username] = b[i.username].concat(i.uri), c[i.username].push(i.callback), h[i.username].push(i.errback);
                for (var g in b) {
                    var k = b[i.username],
                        n = A(c[i.username]),
                        o = A(h[i.username]),
                        s = Spotify.Link.rootlistLink(a.username).toURI();
                    l.list({
                        uri: s,
                        total: -1
                    }, function (a) {
                        for (var b = s, c = n, h = o, d = k.slice(0), i = 0; i < a.contents.length; i++) {
                            var f = a.contents[i];
                            if (f.type != "empty") for (var g = 0; g < d.length; g++) f.toURI() == d[g] && delete d[g]
                        }
                        a = [];
                        for (i = 0; i < d.length; i++) d[i] && a.push(d[i]);
                        a.length > 0 ? u("ADD", b, null, a.join(","), c, h)() : typeof c === "function" && c(!0)
                    }, o);
                    a.publish && setTimeout(function () {
                        l.publishPlaylists(k, function () {
                            d.log("Spotify.Services.Playlist", ["Playlists were published too", k], "corejs")
                        },

                        function () {
                            d.error("Spotify.Services.Playlist", ["Playlists couldn't be published", k], "corejs")
                        })
                    }, 2E3)
                }
            }, 100)
        } else c(new Spotify.Errors.Error([13, 503, "Playlist service not ready!"]))
    };
    this.list = function (a, b, h) {
        if (v()) {
            a.total > this.DEFAULT_TOTAL_RESULTS ? a.total = this.DEFAULT_TOTAL_RESULTS : a.total == -1 && delete a.total;
            if (typeof a.offset === "undefined") a.offset = 0;
            var d = Spotify.Link.fromString(a.uri);
            if (decodeURIComponent(decodeURIComponent(d.username)) == d.username) d.username = encodeURIComponent(d.username);
            var i = {
                uri: D(d.toURI()),
                method: "GET"
            };
            typeof a.offset !== "undefined" && typeof a.total !== "undefined" && (i.uri += "?from=" + a.offset + "&length=" + a.total);
            a = [n.msg("SelectedListContent")];
            (new Spotify.Hermes.ProtobufRequest(i, [], [], a)).send(c, function (a) {
                if (typeof a == "undefined" || typeof a[0] == "undefined") h(new Spotify.Errors.Error([13, 404, "No results"]));
                else {
                    var c;
                    c = d.type === "published-rootlist" ? k.parsePublishedPlaylist(a[0]) : k.parsePlaylist(a[0]);
                    typeof s[d.toURI()] === "undefined" && (s[d.toURI()] = {
                        string: "",
                        blob: ""
                    });
                    s[d.toURI()].string = M(a[0].revision) || "";
                    d.type == "starred" && c.contents.reverse();
                    b(c)
                }
            }, h, !1, !1, "playlist")
        } else h(new Spotify.Errors.Error([13, 503, "Playlist service not ready!"]))
    };
    this.rootlist = function (a, b, c) {
        a.username = h.user;
        a.uri = Spotify.Link.rootlistLink(h.user).toURI();
        this.list(a, b, c)
    };
    this.publishedRootlist = function (c, h, d) {
        c.offset && delete c.offset;
        c.total = -1;
        c.uri = Spotify.Link.publishedRootlistLink(c.username).toURI();
        this.list(c, function (d) {
            var i = !1,
                f = !1,
                g = function () {
                    i && f && h(d)
                };
            b.starredPlaylist({
                username: c.username,
                total: c.total,
                offset: c.offset
            }, function () {
                d.contents.unshift(Spotify.Link.starredLink(c.username));
                d.length += 1;
                i = !0;
                g()
            }, function () {
                i = !0;
                g()
            });
            a.lookupForUser(c.username, a.TRACK, function (a) {
                a.length > 0 && (a = 0, d.contents.length > 0 && (a = d.contents[0].type == Spotify.Link.Type.STARRED ? 1 : 0), d.contents.splice(a, 0, Spotify.Link.userTopTracksLink(c.username)), d.length += 1);
                f = !0;
                g()
            }, function () {
                f = !0;
                g()
            })
        }, d)
    };
    this.starredPlaylist = function (a, b, c) {
        a.uri = Spotify.Link.starredLink(a.username).toURI();
        this.list(a, b, c)
    };
    this.publishPlaylists = function (a, b, c) {
        var d = Spotify.Link.publishedRootlistLink(h.user).toURI();
        u("ADD", d, null, a.join(","), b, c)()
    };
    this.unpublishPlaylists = function (a, c, d) {
        var i = Spotify.Link.publishedRootlistLink(h.user).toURI();
        b.removeFromPlaylistByUri(i, a, c, d)
    };
    this.addToPlaylist = function (a, b, c, h) {
        u("APPEND", a, null, b.join(","), c, h)()
    };
    this.addTracksInPlaylist = function (a, c, h, d) {
        b.addToPlaylist(a, c, h, d)
    };
    this.removeFromPlaylistByUri = function (a, b, c, h) {
        u("REMOVE", a, null, b.join(","),
        c, h)()
    };
    this.removeFromPlaylist = function (a, b, c, h, d) {
        this.list({
            uri: a,
            total: -1
        }, function (i) {
            u("MODIFY", a, i, {
                ops: [{
                    kind: "REM",
                    rem: {
                        fromIndex: b,
                        length: c
                    }
                }]
            }, h, d)()
        }, function (a) {
            d(a)
        })
    };
    this.starTracks = function (a, c, d) {
        var i = Spotify.Link.starredLink(h.user).toURI();
        b.addToPlaylist(i, a, c, d)
    };
    this.unstarTracks = function (a, c, d) {
        var i = Spotify.Link.starredLink(h.user).toURI();
        b.removeFromPlaylistByUri(i, a, c, d)
    };
    this.createPlaylist = function (a, c, d) {
        var i = Spotify.Link.profileLink(h.user).toURI();
        u("PUT", i, null, {
            ops: [{
                kind: "UPDATE_LIST_ATTRIBUTES",
                update_list_attributes: {
                    new_attributes: {
                        values: {
                            name: a
                        }
                    }
                }
            }]
        }, function (a) {
            b.subscribe({
                username: h.user,
                uri: a[0].uri
            }, function () {
                c(a[0].uri)
            }, d)
        }, d)()
    };
    this.renamePlaylist = function (a, b, c, h) {
        u("MODIFY", a, null, {
            ops: [{
                kind: "UPDATE_LIST_ATTRIBUTES",
                update_list_attributes: {
                    new_attributes: {
                        values: {
                            name: b
                        }
                    }
                }
            }]
        }, function () {
            Spotify.Hermes.Cache.removeAllStartingWith(a);
            c(!0)
        }, h)()
    };
    this.synchronize = function (a, b, h, d) {
        var a = {
            uri: D(a),
            method: "CALL"
        }, i = [n.msg("Playlist4ServiceCall")],
            f = [n.msg("Playlist4ServiceReturn")];
        data = [{
            kind: "METHOD_SYNCHRONIZE",
            synchronizeArgs: {
                selection: b
            }
        }];
        (new Spotify.Hermes.ProtobufRequest(a, data, i, f)).send(c, h, d, !1, !1, "playlist")
    };
    this.init = function (b, h, d, f) {
        c = b;
        c.bind(o.CONNECTED, N, this);
        a = h;
        i = f;
        i.onReady(function () {
            l = !0;
            h.onReady(function () {
                d.onReady(function () {
                    d.getUserInfo(y, w)
                }, this)
            }, this)
        }, this);
        try {
            n = new Spotify.Protobuf.Schema([], null, null, null), n.id = "playlist", n.type = "proto", n.setData(g), n.encode(), t.call(this, t)
        } catch (m) {
            throw m;
        }
    }
};
Spotify.Services.User = function () {
    var g = this,
        f, d = new Spotify.Events,
        b = null,
        c = !1,
        a = [],
        h = function () {
            this.getUserInfo(i, l, !0)
        }, i = function () {}, l = function () {};
    this.onReady = function (a, b) {
        a.call(b)
    };
    this.getUserInfo = function (h, i, l) {
        typeof l === "undefined" && (l = !1);
        b !== null && !l ? h(b) : (a.push({
            onSuccess: h,
            onError: i
        }), c || (c = !0, f.rpc("user_info", [], function (h) {
            b = h;
            c = !1;
            for (var i = 0, f = a.length; i < f; i += 1) a[i].onSuccess(h);
            a = [];
            g.trigger(d.USER_INFO_CHANGE)
        }, function (b) {
            c = !1;
            for (var h = 0, d = a.length; h < d; h += 1) a[h].onError(b);
            a = []
        }, this, !1, 2, "userdata")))
    };
    this.setUserAttribute = function (a, b, c, h) {
        f.rpc("set_ua", [a, b], c, h, this, !1, 2, "userdata")
    };
    this.init = function (a) {
        Spotify.EventTarget.call(this);
        f = a;
        f.bind(d.USER_INFO_CHANGE, h, this)
    }
};
Spotify.Services.Social = function (g) {
    Spotify.EventTarget.call(this);
    var f = Spotify.DebuggerJS,
        d = this,
        b, c, a = !1,
        h = new Spotify.Events,
        i = function () {
            a = !0;
            d.trigger(h.READY)
        };
    this.onReady = function (b, c) {
        a ? b.call(c) : d.bind(h.READY, b, c)
    };
    this.getUsers = function (a, h, d, i) {
        var g = 0,
            p = [],
            q = 0,
            s, t;
        typeof h === "undefined" ? h = "fast" : h !== "fast" && h !== "complete" && (h = "fast");
        for (g = a.length; q < g; ++q) p.push({
            uri: "hm://social/decoration/user/" + a[q]
        });
        (new Spotify.Hermes.ProtobufRequest({
            uri: "hm://social/decorations/" + h,
            method: "GET",
            content_type: "vnd.spotify/mercury-mget-request"
        }, [{
            request: p
        }], [c.msg("MercuryMultiGetRequest")], [c.msg("MercuryMultiGetReply")])).send(b, function (a, b) {
            var h;
            t = a[0];
            if (typeof t.reply === "undefined") i(400);
            else {
                t = t.reply;
                s = c.msg("DecorationData");
                h = (new Date).getTime();
                for (var g = 0, l = t.length; g < l; ++g) {
                    var m = t[g],
                        m = m.status_code >= 200 && m.status_code < 300 ? s.parseFromStringSync(m.body) : null;
                    t[g] = m
                }
                f.log("Spotify.Services.Social", ["It took", (new Date).getTime() - h, "ms to parse the frames"], "parsing_times");
                d(t, b)
            }
        }, i, !1, !1, "social")
    };
    this.init = function (a) {
        b = a;
        try {
            c = new Spotify.Protobuf.Schema([], null, null, null), c.id = "social", c.type = "proto", c.setData(g), c.encode(), i.call(this, i)
        } catch (h) {
            throw h;
        }
    }
};
Spotify.Services.SongUriResolver = function () {
    Spotify.EventTarget.call(this);
    var g = Spotify.DebuggerJS,
        f = new Spotify.Events,
        d = this,
        b, c, a = !1;
    this.IN_CDN = 0;
    this.ONLY_ON_STORAGE = 1;
    this.RATE_LIMIT_REACHED = 2;
    this.TRACK_RESTRICTED = 3;
    this.serviceIsReady = !0;
    var h = function (a) {
        var b = a.params.trackUri,
            c = a.params.callback,
            a = a.params.errback;
        g.log("Spotify.Services.SongUriResolver", ["Rate limit is calling again:", b], "corejs");
        d.list(b, c, a)
    }, i = function () {
        g.log("Spotify.Services.SongUriResolver", ["Rate limit is disabled"],
            "corejs");
        a = !1
    };
    this.onReady = function (a, b) {
        a.call(b)
    };
    this.list = function (h, i, f, o) {
        var k = Spotify.Link.fromString(h);
        if (this.serviceIsReady) {
            if (!(k instanceof Spotify.Link)) return g.error("Spotify.Services.SongUriResolver", ["Invalid arguments"], "corejs"), o(Error("Services:SongUriResolver:list Invalid arguments")), !1;
            if (a && c.totalPendingRequests() !== 0) {
                k = c.getItemAtIndex(0);
                if (k !== null && typeof k !== "undefined") {
                    var p = new Spotify.Errors.Error([Spotify.Errors.Domains.TRACK_ERROR, Spotify.Errors.Codes.TRACK_REQUEST_RATE_LIMITED,
                        ""]);
                    k.errback(p)
                }
                c.addToBucket({
                    trackUri: h,
                    callback: f,
                    errback: o
                }, !1)
            } else b.rpc("track_uri", ["mp3160", k.id, i], function (a) {
                var b = a.response.type;
                if (b === d.IN_CDN) {
                    if (i === "rtmp") b = Spotify.Parsers.RTMP.parseURL(a.response.uri), a.response.server = b.server, a.response.protocol = b.protocol, a.response.uri = b.file;
                    f(a.response, 200);
                    g.log("Spotify.Services.SongUriResolver", ["Song can be loaded", a.response], "corejs")
                } else {
                    a = new Spotify.Errors.Error([Spotify.Errors.Domains.TRACK_ERROR, 0, ""]);
                    a.code = b;
                    if (b === d.ONLY_ON_STORAGE) a.description =
                        "Song only on storage";
                    else if (b === d.RATE_LIMIT_REACHED) a.description = "Rate limit reached";
                    else if (b === d.TRACK_RESTRICTED) a.description = "Track restricted";
                    a.data = h;
                    o(a);
                    g.error("Spotify.Services.SongUriResolver", ["I could not load the song", a], "corejs")
                }
            }, function (b) {
                b.data = h;
                b.domain === Spotify.Errors.Domains.TRACK_ERROR && b.code === Spotify.Errors.Codes.TRACK_REQUEST_RATE_LIMITED ? (g.warn("Spotify.Services.SongUriResolver", ["Rate limit is enabled"], "corejs"), a = !0, c.start(), c.addToBucket({
                    trackUri: h,
                    callback: f,
                    errback: o
                }, !1)) : o(b);
                g.error("Spotify.Services.SongUriResolver", ["I could not load the song", b], "corejs")
            }, this, !0, 2, "track_uri")
        } else g.error("Spotify.Services.SongUriResolver", ["Service is not ready"], "corejs"), o(Error("Services.SongUriResolver:list Service is not ready"))
    };
    this.init = function (a) {
        b = a;
        c = new Spotify.RateLimiter(1E4, 1);
        c.bind(f.RATE_LIMIT_CALL, h, this);
        c.bind(f.RATE_LIMIT_DISABLED, i, this)
    }
};
Spotify.Services.AdUriResolver = function () {
    Spotify.EventTarget.call(this);
    var g = Spotify.DebuggerJS;
    this.serviceIsReady = !0;
    this.onReady = function (f, d) {
        f.call(d)
    };
    this.list = function (f, d, b, c) {
        var a = this,
            h = Spotify.Link.fromString(f);
        if (this.serviceIsReady) {
            if (!(h instanceof Spotify.Link)) return c(new Spotify.Errors.Error([15, 400, "Invalid arguments"])), !1;
            (function (h) {
                var l = h.response.type;
                if (l === 0) {
                    l = Spotify.Parsers.RTMP.parseURL(h.response.uri);
                    h.response.server = l.server;
                    h.response.protocol = l.protocol;
                    if (d === "rtmp") h.response.uri = l.file;
                    b(h.response, 200)
                } else {
                    h = {
                        method: "ad_uri",
                        response: h
                    };
                    if (l === a.ONLY_ON_STORAGE) h.response = "Song only on storage";
                    else if (l === a.RATE_LIMIT_REACHED) h.response = "Rate limit reached";
                    else if (l === a.TRACK_RESTRICTED) h.response = "Track restricted";
                    h.adUri = f;
                    g.error("Spotify.Services.AdUriResolver", ["Error with track", h], "corejs");
                    c(h)
                }
            })({
                method: "ad_uri",
                response: {
                    type: 0,
                    uri: d === "rtmp" ? "rtmp://saa23rvd7l5c6.cloudfront.net/cfx/st/mp3-ad/" + h.id : "http://d7zatysqm84hv.cloudfront.net/mp3-ad/" + h.id
                }
            })
        } else c(new Spotify.Errors.Error([15, 503, "AdUriResolver service not ready!"]))
    };
    this.init = function () {}
};
Spotify.Services.PreviewsUriResolver = function () {
    Spotify.EventTarget.call(this);
    new Spotify.Events;
    this.serviceIsReady = !0;
    this.onReady = function (g, f) {
        g.call(f)
    };
    this.list = function (g, f, d) {
        var b = {}, g = Spotify.Link.fromString(g).id,
            f = Spotify.Parsers.RTMP.parseURL(f === "rtmp" ? "rtmp://soamh0g9lumcr.cloudfront.net/cfx/st/mp3-preview/" + g : "http://d318706lgtcm8e.cloudfront.net/mp3-preview/" + g);
        b.server = f.server;
        b.protocol = f.protocol;
        b.lid = "";
        b.type = 0;
        b.uri = f.protocol === "rtmp" ? f.file : "http://d318706lgtcm8e.cloudfront.net/mp3-preview/" + g;
        d(b)
    };
    this.init = function () {}
};
Spotify.Services.AdChooser = function () {
    Spotify.EventTarget.call(this);
    var g = Spotify.DebuggerJS,
        f = this,
        d, b = [],
        c, a = new Spotify.Events,
        h = !1,
        i = null,
        l = null,
        m = 0,
        n = null,
        o = null,
        k = null,
        p = [0, 60],
        q = 35,
        s = 0,
        t = 0,
        y = 600,
        w = 0,
        v = [],
        x = {}, D = [],
        A = null,
        u = null;
    this.serviceIsReady = !1;
    var C = function (a) {
        g.error("Spotify.Services.AdChooser", ["AdChooser Error.. " + ["Domain: " + a.domain, "Code: " + a.code, "Description: " + a.description, "Data: " + a.data].join(",")], "corejs")
    }, J = function (a, b) {
        if (typeof a === "function" && typeof b === "function") {
            var h = D.slice(0);
            h.slice(0, 1021);
            var d = [0, 1, h.length];
            d.push.apply(d, h);
            try {
                c.rpc("ads", d, a, b, this)
            } catch (i) {
                O({
                    serverError: !0
                }), C(new Spotify.Errors.Error([15, 500, "Exception thrown communicating with ad server", {
                    extra: i
                }]))
            }
        } else C(new Spotify.Errors.Error([15, 500, "Invalid callbacks specified for _retrieveAudioAdsFromServer", {
            extra: e
        }]))
    }, G = function (a) {
        var b = null;
        O();
        F(function (a) {
            a = a.response;
            parseInt(a) > 0 ? w = z() - a : C(new Spotify.Errors.Error([15, 500, "Invalid server time specified", {
                extra: e
            }]))
        }, function (a) {
            C(new Spotify.Errors.Error([15,
            500, "Exception thrown retrieving server time", {
                extra: a
            }]))
        });
        b = Spotify.Parsers.AdChooser.parseServerResponse(a.response);
        return H(b)
    }, F = function (a, b) {
        typeof a === "function" && typeof b === "function" ? c.rpc("time", [0], a, b, this) : C(new Spotify.Errors.Error([15, 403, "Invalid callbacks for retrieveAdServerTime"]))
    }, H = function (a) {
        var b = parseInt(a["@attributes"].version, 10) | 0,
            c = null,
            h = null,
            d = c = null,
            i = null;
        if (b === 0) C(new Spotify.Errors.Error([15, 403, "Missing version attribute from audio queue data structure", {
            extra: e
        }]));
        else if (c = Spotify.Parsers.AdChooser["parseAudioAdsVersion" + b], typeof c === "function") {
            c = c(a);
            a = parseInt(c["audio-ad-break"].length);
            try {
                q = a, u.setItem("defaultAdBreakLength", q)
            } catch (f) {
                C(new Spotify.Errors.Error([15, 500, "Unable to set audio ad break length", {
                    extra: f
                }]))
            }
            a = parseInt(c["audio-ad-break"].time_between);
            try {
                y = a, u.setItem("timeBetweenAdBreak", y)
            } catch (g) {
                C(new Spotify.Errors.Error([15, 500, "Unable to set audio ad break time between", {
                    extra: g
                }]))
            }
            if (typeof (c.AdQueueEntry !== "undefined" && c.AdQueueEntry.length > 0)) {
                for (d = 0, i = c.AdQueueEntry.length; d < i; d += 1) h = c.AdQueueEntry[d], v.push(h), typeof x[h.ad_id] === "undefined" && B(h.ad_id);
                E();
                u.setItem("audioQueue", JSON.stringify(v))
            } else O({
                serverError: !0
            }), C(new Spotify.Errors.Error([15, 204, "No ads received from the ad server"]))
        } else C(new Spotify.Errors.Error([15, 500, "No parser exists for audio queue version " + b]))
    }, E = function (a) {
        try {
            typeof a === "undefined" ? v.sort(function (a, b) {
                return b.priority - a.priority
            }) : v.sort(a)
        } catch (b) {
            C(new Spotify.Errors.Error([15, 500,
                "Unable to prioritize ad queue", {
                extra: b
            }]))
        }
    }, M = function (a) {
        try {
            D.indexOf(a) === -1 && (D.push(a), u.setItem("forbiddenAds", JSON.stringify(D)))
        } catch (b) {
            C(new Spotify.Errors.Error([15, 500, "Unable to add forbidden ad", {
                extra: b
            }]))
        }
    }, N = function (a) {
        try {
            s += a, s > q * 2 && (s = q * 2), u.setItem("audioAdBreakAvailableTime", s)
        } catch (b) {
            C(new Spotify.Errors.Error([15, 500, "Unable to set audio ad break available time", {
                extra: b
            }]))
        }
    }, z = function () {
        return Math.round((new Date).getTime() / 1E3)
    }, O = function (a) {
        var b = !1,
            c = z(),
            h = Math.floor(Math.random() * p[1] + p[0]);
        typeof a !== "undefined" && a.serverError === !0 && (b = !0);
        t = b === !1 ? c + 600 + h : c + 3600 + h;
        u.setItem("timeOfNextAdServerRequest", t)
    }, I = function (a) {
        var b = [],
            c = x[a.ad_id],
            h = z() + w,
            d = {
                max_campaign_repeats_within: function (b, c) {
                    var d = h - b,
                        i = [],
                        f = a.campaign_id,
                        g = null;
                    for (g in x) x.hasOwnProperty(g) && x[g].campaign_id === f && i.concat(x[g].event_history.map(function (a) {
                        if (a.event === "impression" && a.timestamp >= d) return a
                    }));
                    return i.length < c
                },
                max_repeats_within: function (a, b) {
                    var d = h - a;
                    return c.event_history.map(function (a) {
                        if (a.event ===
                            "impression" && a.timestamp >= d) return a
                    }).length < b
                },
                max_attempts_within: function (a, b) {
                    var d = h - a;
                    return c.event_history.map(function (a) {
                        if (a.event === "attempt" && a.timestamp >= d) return a
                    }).length < b
                },
                max_clicks_within: function (a, b) {
                    var d = h - a;
                    return c.event_history.map(function (a) {
                        if (a.event === "click" && a.timestamp >= d) return a
                    }).length < b
                }
            };
        if (c.rules.length > 0) for (r in c.rules) if (c.rules.hasOwnProperty(r)) {
            var i = c.rules[r];
            b.push(d[i.type](parseInt(i.interval), parseInt(i.times)))
        }
        return b.indexOf(!1) === -1
    },
    K = function () {
        try {
            var a = [],
                b = null,
                c = null,
                h = null;
            for (c = 0, h = v.length; c < h; c += 1) b = v[c], b.start_time_latest <= z() + w ? (g.log("Spotify.Services.AdChooser", ["Removing expired ad", result], "corejs"), M(b.ad_id)) : I(b) === !1 ? (g.log("Spotify.Services.AdChooser", ["Removing ad with expired rules"], "corejs"), M(b.ad_id)) : a.push(b);
            v = a;
            u.setItem("audioQueue", JSON.stringify(v));
            return v.length - a.length
        } catch (d) {
            C(new Spotify.Errors.Error([15, 500, "Unable to clear invalid ads in audio ad queue", {
                extra: d
            }]))
        }
    }, L = function (a) {
        var b = null,
            c = null,
            h = null;
        for (b = 0, c = v.length; b < c; b += 1) if (h = v[b], h.file_id === a) return h;
        return null
    }, P = function (a) {
        a = a.split("spotify:ad:")[1];
        return L(a)
    }, Q = function (a) {
        return {
            __pid: a.file_id,
            name: a.title,
            disc: 1,
            duration: parseInt(a.duration * 1E3, 10),
            number: 1,
            popularity: a.tracking_url,
            playable: !0,
            explicit: !1,
            advertisement: !0,
            image: a.image_id,
            artist: [{
                uri: a.target_url,
                name: a.advertiser
            }]
        }
    }, B = function (a, b) {
        var c;
        a: {
            var h = c = null,
                d = null;
            for (c = 0, h = v.length; c < h; c += 1) if (d = v[c], d.ad_id === a) {
                c = d;
                break a
            }
            c = null
        }
        c !== null ? (typeof x[a] === "undefined" && (x[a] = {
            campaign_id: c.campaign_id,
            expiry_time: c.campaign_expiry,
            rules: c.rules,
            event_history: []
        }), typeof b !== "undefined" && x[a].event_history.push({
            timestamp: z() + w,
            event: b
        }), u.setItem("adHistory", JSON.stringify(x))) : C(new Spotify.Errors.Error([15, 500, "Unable to locate ad queue entry", {
            extra: b
        }]))
    }, R = function () {
        h === !1 && (i = setInterval(function () {
            h = !0;
            k.isPlaying === !0 && k.isAd === !1 && m++
        }, 1E3), l = setInterval(function () {
            u.setItem("streamTimeSinceLastAdBreak", m);
            g.log("Spotify.Services.AdChooser", ["Stream time: ", m], "corejs")
        }, 1E4))
    }, S = function () {
        clearInterval(i);
        clearInterval(l);
        h = !1
    }, T = function (c) {
        c = d.getPlayerById(c.params.id);
        c.bind(a.PLAYING, R, f);
        c.bind(a.PAUSED, S, f);
        b.push(c)
    }, U = function (a) {
        f.trigger(a.type, a.params)
    };
    this.onReady = function (b, c) {
        this.serviceIsReady ? b.call(c) : this.bind(a.READY, b, c)
    };
    this.recordAdEvent = function (a, b) {
        var c = P(a),
            h = null;
        if (c === null) C(new Spotify.Errors.Error([15, 404, "Unable to locate ad to record ad event", {
            extra: a
        }]));
        else {
            b: {
                var d = h = null,
                    i = null;
                for (h = 0,
                d = v.length; h < d; h += 1) if (i = v[h], i.ad_id === c.ad_id) break b;
                h = null
            }
            h === null && C(new Spotify.Errors.Error([15, 404, "Unable to locate ad queue index", {
                extra: c
            }]));
            switch (b) {
                case "click":
                    v[h].has_been_clicked = !0;
                    B(c.ad_id, "click");
                    break;
                case "attempt":
                    B(c.ad_id, "attempt");
                    break;
                case "impression":
                    v[h].has_been_played = !0;
                    v[h].adPlayCount += 1;
                    v[h].campaignPlayCount += 1;
                    B(c.ad_id, "impression");
                    break;
                default:
                    C(new Spotify.Errors.Error([15, 500, "Invalid ad event", {
                        extra: b
                    }]))
            }
        }
    };
    this.getNextAd = function () {
        var a = null,
            b = null;
        var c = b = a = null,
            h = [];
        try {
            for (a in x) if (x.hasOwnProperty(a)) {
                h = [];
                for (b = 0, c = x[a].event_history.length; b < c; b += 1) x[a].event_history[b].expiry_time > z() + w && h.push(x[a].event_history[b]);
                x[a].event_history = h.slice(0)
            }
            u.setItem("adHistory", JSON.stringify(x))
        } catch (d) {
            C(new Spotify.Errors.Error([15, 500, "Unable to purge expired ad history", {
                extra: d
            }]))
        }
        if (m >= y && k.isAd === !1) {
            g.log("Spotify.Services.AdChooser", ["Injecting ad!"], "corejs");
            N(q);
            var a = [],
                b = !1,
                i = h = c = null;
            K();
            for (E(); s > 0 && b === !1;) for (c = 0, h = v.length, b = !0; c < h; c += 1) i = v[c], i.duration < s && (a.push(i), N(i.duration * -1), b = !1);
            if (a.length > 0) o.setIntercept(A), b = Q(a[0]), A.appendWithMeta("spotify:ad:" + a[0].file_id, b), A.setOwner(b.artist[0].uri), o.intercept(), k.ad = a[0]
        } else g.log("Spotify.Services.AdChooser", [y - m + " seconds left until ad..."], "corejs")
    };
    this.lookup = function (a, b) {
        var c = [],
            h = null,
            d = null,
            i = null;
        if (Spotify.Utils.isArray(a)) {
            for (h = 0, d = a.length; h < d; ++h) i = P(a[h]), c.push(Q(i));
            b(c, 200)
        } else a.length == 1 ? (i = L(a[0].id), c.push(Q(i)), b(c, 200)) : C(new Spotify.Errors.Error([15, 404, "Array does not contain any items!"]))
    };
    this.maybeRetrieveAds = function () {
        t <= z() && (g.log("Spotify.Services.AdChooser", ["Retrieving ads from server."], "corejs"), J(G, function () {
            O({
                serverError: !0
            })
        }))
    };
    this.init = function (b, h, i) {
        c = b;
        d = h;
        d.bind(a.PLAYER_CREATED, T, f);
        d.onReady(function () {
            k = h.getPlayerAtIndex(0);
            i.onReady(function () {
                i.getUserInfo(function (b) {
                    u = new Spotify.Cache.PackageStore({
                        storageKey: Spotify.Utils.Base64.encode(b.response.user + "-" + b.response.catalogue)
                    });
                    u.getItem("timeBetweenAdBreak") !== null && (y = parseInt(u.getItem("timeBetweenAdBreak"), 10));
                    u.getItem("defaultAdBreakLength") !== null && (q = parseInt(u.getItem("defaultAdBreakLength"), 10));
                    u.getItem("timeOfNextAdServerRequest") !== null && (t = parseInt(u.getItem("timeOfNextAdServerRequest"), 10));
                    u.getItem("streamTimeSinceLastAdBreak") !== null && (m = parseInt(u.getItem("streamTimeSinceLastAdBreak"), 0));
                    u.getItem("audioQueue") !== null && (v = JSON.parse(u.getItem("audioQueue")));
                    u.getItem("adHistory") !== null && (x = JSON.parse(u.getItem("adHistory")));
                    u.getItem("forbiddenAds") !== null && (D = JSON.parse(u.getItem("forbiddenAds")));
                    K();
                    f.maybeRetrieveAds();
                    f.serviceIsReady = !0;
                    f.trigger(a.READY)
                }, function (a) {
                    C(new Spotify.Errors.Error([15, 500, "Exception thrown gathering user info", {
                        extra: a
                    }]))
                })
            }, this)
        }, this)
    };
    this.initializeContext = function (b, c) {
        n = b;
        o = c;
        o.addEvent(a.INTERCEPTED, U);
        A = n.create("spotify:ads");
        A.setRule("intercept");
        o.addEvents({
            beforeContextChange: f.getNextAd,
            beforeNext: f.getNextAd,
            beforePrevious: f.getNextAd,
            ended: function () {
                k.trackUri.indexOf("spotify:ad:") > -1 && (m = 0)
            }
        })
    }
};
Spotify.Services.Pubsub = function (g) {
    Spotify.EventTarget.call(this);
    var f = this,
        d, b, c = new Spotify.Events,
        a = {}, h = function (b) {
            var c = Spotify.Hermes.Header.parseFromStringSync(Spotify.Utils.Base64.decode(b.params[2]));
            if (c) {
                var h = a[c.uri],
                    d;
                if (c.status_code === 200) for (var i = 0, f = h.length; i < f; i += 1) d = h[i], d.callback.call(d.context, b.params);
                else {
                    i = 0;
                    for (f = h.length; i < f; i += 1) d = h[i], d.errorCallback.call(d.context, c)
                }
            }
        }, i = function () {
            this.serviceIsReady = !0;
            this.trigger(c.READY)
        };
    this.serviceIsReady = !1;
    this.onReady = function (a, b) {
        this.serviceIsReady ? a.call(b) : f.bind(c.READY, a, b)
    };
    this.subscribe = function (c, h, i, f, g, p, q) {
        function s(a) {
            g.call(q, a)
        }
        typeof c === "undefined" || typeof p === "undefined" || typeof f === "undefined" || typeof g === "undefined" || typeof q === "undefined" ? g.call(q, new Spotify.Errors.Error([0, 16, "Not all argments are provided"])) : (Spotify.Utils.isArray(h) || (h = []), Spotify.Utils.isArray(i) || (i = []), this.serviceIsReady ? (new Spotify.Hermes.ProtobufRequest({
            uri: c,
            method: "SUB"
        }, h, i, [])).send(b, function (b) {
            var c = d.msg("Subscription"),
                h = [];
            if (b) {
                for (var i = !1, g = 0; g < b.length; ++g) {
                    var l = c.parseFromStringSync(b[g]);
                    if (l.status_code === 200) i = l.uri, h.push(i), typeof a[i] === "undefined" && (a[i] = []), a[i].push({
                        callback: p,
                        context: q,
                        uri: i,
                        arguments: []
                    }), i = !0
                }
                if (!i) {
                    s();
                    return
                }
            }
            f.call(q, h)
        }, s, !1, !0, "pubsub") : g.call(q, new Spotify.Errors.Error([13, 503, "Suggest service not ready!"])))
    };
    this.init = function (a) {
        b = a;
        b.bind(c.HERMES_B64_MESSAGE, h, this);
        try {
            d = new Spotify.Protobuf.Schema([], null, null, null), d.id = "pubsub", d.type = "proto",
            d.setData(g), d.encode(), i.call(this, i)
        } catch (f) {
            throw f;
        }
    }
};
Spotify.Services.Presence = function (g) {
    Spotify.EventTarget.call(this);
    var f = this,
        d = new Spotify.Events,
        b, c = !1,
        a = !1,
        h = null,
        i, l, m = function () {
            a = !0;
            k()
        }, n = function (a) {
            h = a.response;
            k()
        }, o = function () {
            h = null
        }, k = function () {
            if (c && a && h !== null) f.serviceIsReady = !0, f.trigger(d.READY)
        }, p = function (a) {
            a.length > 0 && (a = l.msg("State").parseFromStringSync(Spotify.Utils.Base64.decode(a[3])), f.trigger(d.NOTIFICATION, a))
        }, q = function () {}, s = function (a) {
            throw a;
        }, t = function (a, b) {
            (new Spotify.Hermes.ProtobufRequest({
                uri: "hm://presence/user/" + h.user,
                method: "SET"
            }, [a], [l.msg("State")], [])).send(i, b || q, s, !1, !1, "Presence")
        };
    this.serviceIsReady = !1;
    this.onReady = function (a, b) {
        this.serviceIsReady ? a.call(b) : this.bind(d.READY, a, b)
    };
    this.subscribe = function (a, c, h, d) {
        this.serviceIsReady ? typeof a === "undefined" ? h.call(d, new Spotify.Errors.Error([0, 16, "Not all argments are provided"])) : Spotify.Utils.isArray(a) ? b.subscribe("hm://presence/user/", a, [], c, h, p, f) : h.call(d, new Spotify.Errors.Error([0, 16, "Users arguments must be an array"])) : h.call(d, new Spotify.Errors.Error([13,
        503, "Presence service not ready!"]))
    };
    this.broadcastPlaylistPublished = function (a, b) {
        var c = {
            generic: {
                type: 1,
                item_uri: a,
                timestamp: (new Date).getTime()
            }
        };
        t(c, b)
    };
    this.broadcastTrackAdded = function (a, b, c) {
        a = {
            generic: {
                type: 2,
                context_uri: a,
                item_uri: b,
                timestamp: (new Date).getTime()
            }
        };
        t(a, c)
    };
    this.broadcastTrackStartedPlaying = function (a, b, c, h) {
        a = {
            generic: {
                type: 5,
                item_uri: a,
                context_uri: b,
                referrer_uri: c,
                timestamp: (new Date).getTime()
            }
        };
        t(a, h)
    };
    this.broadcastTrackFinishedPlaying = function (a, b, c, h) {
        a = {
            generic: {
                type: 3,
                item_uri: a,
                context_uri: b,
                referrer_uri: c,
                timestamp: (new Date).getTime()
            }
        };
        t(a, h)
    };
    this.broadcastFavoriteAppAdded = function (a, b) {
        var c = {
            generic: {
                type: 4,
                item_uri: a,
                timestamp: (new Date).getTime()
            }
        };
        t(c, b)
    };
    this.broadcastUriShared = function (a, b, c) {
        a = {
            generic: {
                type: 6,
                item_uri: a,
                message: b,
                timestamp: (new Date).getTime()
            }
        };
        t(a, c)
    };
    this.broadcastArtistFollowed = function (a, b, c, h) {
        a = {
            generic: {
                type: 7,
                item_uri: a,
                item_name: b,
                item_image: c,
                timestamp: (new Date).getTime()
            }
        };
        t(a, h)
    };
    this.init = function (a, h, d) {
        i = a;
        b = h;
        b.onReady(function () {
            c = !0;
            d.onReady(function () {
                d.getUserInfo(n, o)
            }, this)
        });
        try {
            l = new Spotify.Protobuf.Schema([], null, null, null), l.id = "presence", l.type = "proto", l.setData(g), l.encode(), m.call(f, m)
        } catch (k) {
            throw k;
        }
    }
};
Spotify.Services.SocialGraph = function (g) {
    var f, d, b = Spotify.DebuggerJS,
        c, a, h, i = !1,
        l = null,
        m = new Spotify.Events,
        n = function () {
            s("subscriptions", l.user, 1E3, 0, function (a) {
                if (a = a[0].users) {
                    f = f.concat(a);
                    for (var b = 0, c = a.length; b < c; b++) d[a[b].username] = b;
                    a.length === 1E3 && n()
                }
            }, function () {
                b.error("Spotify.Services.SocialGraph", ["We failed to cache the user subscirptions", arguments], "corejs")
            })
        }, o = function (a) {
            l = a.response;
            i && l !== null && c.trigger(m.READY)
        }, k = function () {
            l = null
        }, p = {
            subscribers: {},
            subscriptions: {},
            dismissed: {},
            blocked: {}
        };
    d = {};
    f = [];
    var q = function (a, b) {
        var c = p[a],
            h = "";
        if (c[b] && c[b].lastResult) h = c[b].lastResult;
        return h
    }, s = function (b, c, d, i, f, g, m) {
        if (!c) c = l.user;
        var k = "hm://socialgraph/" + b + "/user/" + c;
        m && (k += "/relevant");
        var k = {
            uri: k,
            method: "GET"
        }, n = [],
            o = [h.msg("UserListReply")],
            d = [{
                count: d,
                include_length: !0
            }];
        m ? d = [] : (n = [h.msg("UserListRequest")], d[0].last_result = i === 0 ? "" : q(b, c));
        (new Spotify.Hermes.ProtobufRequest(k, d, n, o)).send(a, function (a, h) {
            var d = a[0].users;
            if (d) {
                var i = c,
                    d = d[d.length - 1].username,
                    g = p[b];
                g[i] = g[i] || {};
                g[i].lastResult = d
            }
            f(a, h)
        }, g, !1, !1, "socialgraph")
    }, t = function (b, d, i, f, g) {
        b = {
            uri: "hm://socialgraph/" + b,
            method: "POST"
        };
        if (d) b.method = "DELETE";
        var l = [h.msg("StringListRequest")],
            k = [h.msg("StringListReply")];
        (new Spotify.Hermes.ProtobufRequest(b, [{
            args: i
        }], l, k)).send(a, function (a, b) {
            f(a, b);
            c.trigger(d ? m.RELATIONS_UNSUBSCRIBE : m.RELATIONS_SUBSCRIBE, {
                users: i
            })
        }, g, !1, !1, "socialgraph")
    }, y = function (b, c, d, i, f) {
        var b = {
            uri: "hm://socialgraph/" + b + "/user/" + c + "/exists",
            method: "GET"
        }, c = [h.msg("StringListRequest")],
            g = [h.msg("StringListReply")];
        (new Spotify.Hermes.ProtobufRequest(b, [{
            args: d
        }], c, g)).send(a, function (a, b) {
            i(a, b)
        }, f, !1, !1, "socialgraph")
    };
    this.onReady = function (a, b) {
        i && l !== null ? a.call(b) : c.bind(m.READY, a, b)
    };
    this.getSubscribers = function (a, b, c, h, d) {
        s("subscribers", a, b, c, h, d)
    };
    this.getRelevantSubscribers = function (a, b, c, h, d) {
        s("subscribers", a, b, c, h, d, !0)
    };
    this.getSubscriptions = function (a, b, c, h, d) {
        s("subscriptions", a, b, c, h, d)
    };
    this.getRelevantSubscriptions = function (a, b, c, h, d) {
        s("subscriptions", a, b, c, h,
        d, !0)
    };
    this.getDismissed = function (a, b, c, h, d) {
        s("dismissed", a, b, c, h, d)
    };
    this.getBlocked = function (a, b, c, h, d) {
        s("blocked", a, b, c, h, d)
    };
    this.subscribeTo = function (a, b, c) {
        t("subscriptions", !1, a, b, c)
    };
    this.unsubscribeFrom = function (a, b, c) {
        t("subscriptions", !0, a, b, c)
    };
    this.dismiss = function (a, b, c) {
        t("dismissed", !1, a, b, c)
    };
    this.undismiss = function (a, b, c) {
        t("dismissed", !0, a, b, c)
    };
    this.block = function (a, b, c) {
        t("blocked", !1, a, b, c)
    };
    this.unblock = function (a, b, c) {
        t("blocked", !0, a, b, c)
    };
    this.isSubscribed = function (a) {
        for (var b = [], c = 0, h = a.length; c < h; c++) b.push(a[c] in d);
        return b
    };
    this.hasSubscribers = function (a, b, c, h) {
        y("subscribers", a, b, c, h)
    };
    this.hasSubscriptions = function (a, b, c, h) {
        y("subscriptions", a, b, c, h)
    };
    this.hasDismissed = function (a, b, c, h) {
        y("dismissed", a, b, c, h)
    };
    this.hasBlocked = function (a, b, c, h) {
        y("blocked", a, b, c, h)
    };
    this.hasHidden = function (a, b, c, h) {
        y("hidden", a, b, c, h)
    };
    this.preloadCurrentUserSubscriptions = n;
    this.init = function (b, d) {
        Spotify.EventTarget.call(this);
        c = this;
        a = b;
        d.onReady(function () {
            d.getUserInfo(o, k)
        },
        this);
        try {
            h = new Spotify.Protobuf.Schema([], null, null, null), h.id = "socialgraph", h.type = "proto", h.setData(g), h.encode(), (i = !0) && l !== null && c.trigger(m.READY)
        } catch (f) {
            throw f;
        }
    }
};
Spotify.Services.MergedProfile = function (g) {
    var f = this,
        d = new Spotify.Events,
        b, c, a = function () {
            this.serviceIsReady = !0;
            this.trigger(d.READY)
        }, h = function (a, h, d, g) {
            f.serviceIsReady ? (a = {
                uri: "hm://mergedprofile/mergedprofile/" + a + "/" + h,
                method: "GET"
            }, h = [c.msg("MergedProfileReply")], (new Spotify.Hermes.ProtobufRequest(a, [], [], h)).send(b, function (a) {
                for (var b, c = 0, h = a.length; c < h; c += 1) b = a[c], b.artist = typeof b.artistid !== "undefined" ? "spotify:artist:" + b.artistid : null, b.user = typeof b.username !== "undefined" ? Spotify.Link.profileLink(b.username).toURI() : null, delete b.artistid, delete b.username;
                d(a, 200)
            }, g, !1, !1, "mergedprofile")) : g(new Spotify.Errors.Error([13, 503, "MergedProfile service not ready!"]))
        };
    this.serviceIsReady = !1;
    this.onReady = function (a, b) {
        this.serviceIsReady ? a.call(b) : this.bind(d.READY, a, b)
    };
    this.forUser = function (a, b, c) {
        h("user", a, b, c)
    };
    this.forArtist = function (a, b, c) {
        h("artist", a, b, c)
    };
    this.init = function (h) {
        Spotify.EventTarget.call(this);
        b = h;
        try {
            c = new Spotify.Protobuf.Schema([], null, null, null), c.id = "mergedprofile", c.type = "proto", c.setData(g),
            c.encode(), a.call(this, a)
        } catch (d) {
            throw d;
        }
    }
};
(function () {
    function g(c) {
        this._storage = d[c] || (d[c] = {});
        this._watchers = b[c] || (b[c] = {})
    }
    var f = !1,
        d = {}, b = {};
    g.prototype.wait = function (b, a) {
        var h = this._watchers[b] || (this._watchers[b] = []);
        h.indexOf(a) == -1 && h.push(a);
        return this
    };
    g.prototype.store = function (b, a) {
        var h = this._storage,
            d = this._watchers[b],
            f = h[b];
        h[b] = a;
        if (d && d.length) for (var h = 0, g = d.length; h < g; h++) d[h](a, f);
        return this
    };
    g.prototype.retrieve = function (b) {
        return this._storage[b] || null
    };
    Spotify.getStorage = function (b) {
        if (f) throw Error("Cannot fetch from locked storage.");
        return new g(b)
    };
    Spotify.lockStorage = function () {
        f = !0;
        return this
    }
})();
(function () {
    function g() {
        this._events = {}
    }
    Spotify.getStorage("app.ns").store("EventEmitter", g);
    g.prototype.addEvent = function (f, d) {
        var b = this._events[f] || (this._events[f] = []);
        if (b.indexOf(d) != -1) return this;
        b.push(d);
        return this
    };
    g.prototype.addEvents = function (f) {
        for (var d in f) f.hasOwnProperty(d) && this.addEvent(d, f[d])
    };
    g.prototype.removeEvent = function (f, d) {
        var b = this._events[f];
        if (!b || !b.length) return this;
        var c = b.indexOf(d);
        if (c == -1) return this;
        b.splice(c, 1);
        return this
    };
    g.prototype.fireEvent = function (f,
    d, b) {
        var c = this,
            f = this._events[f];
        if (!f || !f.length) return this;
        for (var f = f.slice(0), a = f.length; a--;)(function (a) {
            b ? a.apply(c, d) : setTimeout(function () {
                a.apply(c, d)
            }, 15)
        })(f[a]);
        return this
    }
})();
(function () {
    function g(b, a) {
        for (var h in a) a.hasOwnProperty(h) && (b[h] = a[h]);
        return b
    }
    function f(b, a) {
        this.timestamp = (new Date).getTime();
        this._internal = this._hasPartial = !1;
        this._timeout = !0;
        this._sent = !1;
        this._uid = b;
        this._data = {
            id: a,
            success: !0,
            payload: null
        }
    }
    var d = Spotify.getStorage("app.ns"),
        b = {};
    Spotify.getStorage("app.message.ns").store("callbacks", b);
    d.store("Reply", f);
    f.prototype.setLogger = function (b) {
        this._logger = b;
        return this
    };
    f.prototype.internal = function (b, a) {
        this._internal = !0;
        this._data.done = b;
        this._data.error = a;
        return this
    };
    f.prototype.persist = function () {
        this._timeout = !1;
        return this
    };
    f.prototype.addPartial = function (b) {
        if (this._sent || typeof b != "object") return null;
        this._data.payload = g({}, b);
        this._hasPartial = !0;
        return null
    };
    f.prototype.send = function (c) {
        if (this._sent) return null;
        var a = this._data,
            h = this._logger,
            d;
        this._hasPartial && (c = g(a.payload, c));
        if (this._internal)(a.success ? a.done : a.error)(c);
        else {
            d = b[this._uid];
            if (!d) return null;
            delete b[this._uid];
            if (d.source) {
                if (c.type) {
                    if (c.data) c.event = c.type;
                    if (c.receiver) c.target = c.receiver
                }
                a.payload = c;
                d.source.postMessage(JSON.stringify(a), d.origin);
                h && (a.success ? h.succeed(this._uid, "success") : h.fail(this._uid, a.payload ? a.payload.error : "unknown-error"))
            }
        }
        delete this._data;
        this._sent = !0;
        return null
    };
    f.prototype.fail = function (b, a, h) {
        b = typeof b == "string" ? {
            error: b,
            message: a,
            code: h
        } : b;
        if (this._sent) return null;
        this._data.success = !1;
        return this.send(b)
    };
    f.prototype.timeout = function () {
        if (this._sent || !this._timeout) return !1;
        this._data.success = !1;
        return this.send({
            error: "timeout",
            message: "Request timed-out."
        })
    }
})();
(function () {
    function g() {
        this._ids = [];
        this._replies = {}
    }
    Spotify.getStorage("app.ns").store("RequestBuffer", g);
    g.prototype.push = function (f, d) {
        var b = this._ids,
            c = this._replies,
            f = f.toString();
        c[f] || b.push(f);
        (c[f] || (c[f] = [])).push(d);
        return this
    };
    g.prototype.takeIds = function (f) {
        var d = this._ids,
            f = f != void 0 ? f : d.length;
        return d.splice(0, f)
    };
    g.prototype.takeReplies = function (f, d) {
        var b = this._replies[f];
        if (!b) return [];
        var d = d != void 0 ? d : b.length,
            c = b.splice(0, d);
        b.length || (this._replies[f] = null);
        return c
    }
})();
(function () {
    function g() {
        this._requests = {};
        this._hostMap = {}
    }
    function f(d, b, c) {
        this._id = d;
        this._request = b;
        this._params = c || [];
        this._status = "pending";
        this._timestamp = (new Date).getTime();
        this._roundtrip = 0
    }
    Spotify.getStorage("app.ns").store("RequestLogger", g);
    g.prototype.enter = function (d, b, c, a) {
        var h = this._requests,
            h = h[d] || (h[d] = {
                total: 0,
                success: 0,
                failure: 0,
                pending: 0,
                requests: {}
            });
        h.total++;
        h.pending++;
        h.requests[b] = new f(b, c, a);
        this._hostMap[b] = d
    };
    g.prototype.succeed = function (d, b) {
        var c = this._hostMap[d];
        if (!c) return this;
        c = this._requests[c];
        c.success++;
        c.pending--;
        c.requests[d].finish(b);
        return this
    };
    g.prototype.fail = function (d, b) {
        var c = this._hostMap[d];
        if (!c) return this;
        c = this._requests[c];
        c.failure++;
        c.pending--;
        c.requests[d].finish(b);
        return this
    };
    g.prototype.get = function (d) {
        return this._requests[d] || null
    };
    g.prototype.formatted = function (d) {
        var b = this.get(d);
        if (!b) return "No logs for item.";
        var c = [];
        c.push([d, "- total:", b.total, "- success:", b.success, "- failed:", b.failure, "- pending:", b.pending].join(" "));
        var d = b.requests,
            a;
        for (a in d) c.push(d[a].toString());
        return c.join("\n")
    };
    f.prototype.finish = function (d) {
        this._status = d;
        this._roundtrip = (new Date).getTime() - this._timestamp;
        return this
    };
    f.prototype.toString = function () {
        for (var d = this._params.slice(0, 5), b = Math.max(this._params.length - 5, 0), c = d.length; c--;) d[c] = JSON.stringify(d[c]);
        return [" |", [" |- ", this._request, ": ", this._status].join(""), [" |  [", this._status == "pending" ? "P" : this._roundtrip + "ms", "] params: [", d.join(", "), b !== 0 ? ", plus " + b + " more.." :
            "", "]"].join("")].join("\n")
    };
    f.prototype.toJSON = f.prototype.toString
})();
(function () {
    function g(a, b, c) {
        return function () {
            if (!this._ready) return this.queue();
            a[c].fn = b;
            return b.apply(this, arguments)
        }
    }
    function f(a) {
        for (var b in a) if (a.hasOwnProperty(b)) {
            var c = b,
                h = a[b];
            switch (!0) {
                case c == "flushRequests":
                    m.push(h.bind(this));
                    break;
                case !!(matches = c.match(/^@(@)?(.*)$/)):
                    var d = matches[1] ? l : i,
                        c = matches[2];
                    if (c in d) throw Error('Redefinition of message handler "' + c + '".');
                    if (typeof h == "string") {
                        if (h = d[h]) d[c] = h;
                        else throw Error('Aliasing of undefined message handler "' + c + '".');
                        break
                    }
                    d[c] = {
                        fn: g(d, h, c),
                        bound: this,
                        reply: !0
                    };
                    break;
                default:
                    this[c] = h
            }
        }
        this._queue = [];
        this.create && this.create();
        if (this.init) Spotify.App.onReady(this.init.bind(this));
        return this
    }
    var d = Spotify.Utils.isArray,
        b = null,
        c = Spotify.getStorage("app.ns"),
        a = c.retrieve("Reply");
    c.wait("SourceURLs", function (a) {
        b = a
    });
    var h = Spotify.getStorage("app.message.ns"),
        i = {}, l = {}, m = [],
        n = {};
    h.store("handlers", i);
    h.store("privateHandlers", l);
    h.store("batchers", m);
    c.store("Responder", f);
    f.respondsTo = function (a) {
        return a in i
    };
    f.prototype.traceOut = function () {
        return function () {}
    };
    f.prototype.traceError = function () {
        return function () {}
    };
    f.flush = function () {
        for (var a = m.length; a--;) m[a]()
    };
    f.prototype.use = function (a) {
        var b = 0,
            c = [],
            h;
        for (h in a) this[h] = a[h], c.push(a[h]), b++;
        a = function () {
            --b || this.start()
        }.bind(this);
        for (h = b; h--;) c[h].onReady(a, this);
        return this
    };
    f.prototype.queue = function () {
        var a = this.queue.caller;
        this._queue.push({
            fn: a,
            args: a.arguments
        })
    };
    f.prototype.unqueue = function () {
        for (var a = this._queue, b = 0, c = a.length; b < c; b++) {
            var h = a[b];
            h.fn.apply(this, h.args)
        }
        this._queue = [];
        return this
    };
    f.prototype.store = function (a, b, c) {
        (n[b] || (n[b] = new Spotify.SimpleCache(1E3))).put(a, c);
        return this
    };
    f.prototype.retrieve = function (a, b) {
        return n[b] ? n[b].get(a) || null : null
    };
    f.prototype.trigger = function (b, c, h, g) {
        b = i[b] || l[b];
        if (!b) return typeof g !== "undefined" ? g({
            error: "not-implemented"
        }) : null;
        d(c) && (c = {
            args: c
        });
        b.fn.call(b.bound || {}, c, (new a(null, null)).internal(h, g));
        setTimeout(function () {
            f.flush()
        }, 0)
    };
    f.prototype.createImageSizes = function (a,
    c) {
        var h = [
            [60, b.tiny + a],
            [120, b.small + a],
            [300, b.normal + a],
            [640, b.large + a]
        ];
        c && (h.shift(), h.pop());
        return h
    };
    f.prototype.createSnapshot = function (a, b, c, h) {
        var d = a[1] || 0,
            a = a[2] || -1,
            a = a == -1 ? b.length : a;
        return {
            range: {
                offset: d,
                length: a
            },
            length: c || b.length,
            array: b.slice(d, d + a),
            metadata: (h || []).slice(d, d + a)
        }
    };
    f.prototype.createDimensions = function (a, b, c) {
        a = a || 0;
        c = c || 500;
        b = b == -1 ? c : Math.min(b, c);
        return {
            start: a,
            end: a + b - 1,
            length: b
        }
    }
})();
(function () {
    function g() {
        this._keys = [];
        this._values = []
    }
    Spotify.getStorage("app.ns").store("WeakMap", g);
    g.prototype.get = function (f) {
        f = this._keys.indexOf(f);
        return f == -1 ? null : this._values[f]
    };
    g.prototype.set = function (f, d) {
        var b = this._keys,
            c = this._values,
            a = b.indexOf(f);
        if (a != -1) return c[a] = d, this;
        b.push(f);
        c.push(d);
        return this
    };
    g.prototype.remove = function (f) {
        var d = this._keys,
            b = this._values,
            f = d.indexOf(f);
        if (f == -1) return this;
        d.splice(f, 1);
        b.splice(f, 1)
    };
    g.prototype.clear = function () {
        this._keys.splice(0,
        this._keys.length);
        this._values.splice(0, this._values.length);
        return this
    }
})();
(function () {
    function g(b) {
        for (var a = b.length; a;) {
            var h = Math.floor(Math.random() * a--),
                d = b[a];
            b[a] = b[h];
            b[h] = d
        }
        return b
    }
    function f(c, a) {
        this._id = c;
        this._rule = b.defaults;
        this._currentIndex = 0;
        this._shuffled = this._repeated = !1;
        this._shuffledList = null;
        this._metadata = [];
        var h = this._list = this._origin = [];
        if (!a) return this;
        for (var d = 0, f = a.length; d < f; d++) d in a && a[d] && h.push(a[d])
    }
    var d = Spotify.getStorage("app.context.ns");
    d.store("quickShuffle", g);
    var b = {
        defaults: {
            skipCount: -1,
            volume: !0,
            seek: !0,
            indexing: !0,
            previous: !0,
            next: !0,
            shuffle: !0,
            repeat: !0
        },
        intercept: {
            skipcount: -1,
            volume: !1,
            seek: !1,
            indexing: !0,
            previous: !1,
            next: !1,
            shuffle: !1,
            repeat: !1
        },
        radio: {
            skipCount: -1,
            volume: !0,
            seek: !0,
            indexing: !0,
            previous: !1,
            next: !0,
            shuffle: !1,
            repeat: !1
        },
        dmca: {
            skipCount: 6,
            volume: !0,
            seek: !0,
            indexing: !0,
            previous: !1,
            next: !0,
            shuffle: !1,
            repeat: !1
        },
        stream: {
            skipcount: -1,
            volume: !0,
            seek: !1,
            indexing: !0,
            previous: !1,
            next: !1,
            shuffle: !1,
            repeat: !1
        }
    };
    d.store("ContextRules", b);
    d.store("Context", f);
    f.prototype.getId = function () {
        return this._anonymous ? null : this._id
    };
    f.prototype.setAnonymous = function (b) {
        this._anonymous = !! b;
        return this
    };
    f.prototype.setRule = function (c) {
        return (c = b[c]) ? (this._rule = c, !0) : !1
    };
    f.prototype.getRule = function () {
        return this._rule
    };
    f.prototype.setRepeat = function (b) {
        return !this._rule.repeat ? !1 : this._repeated = b
    };
    f.prototype.isRepeated = function () {
        return this._repeated
    };
    f.prototype.setShuffle = function (b) {
        if (!this._rule.shuffle) return !1;
        (this._shuffled = b) ? this._shuffle() : this._unshuffle();
        return b
    };
    f.prototype.isShuffled = function () {
        return this._shuffled
    };
    f.prototype.setExpiry = function (b) {
        if (!b || b < 0) return this;
        this._time = (new Date).getTime();
        this._ttl = b;
        return this
    };
    f.prototype.isExpired = function () {
        var b = this._ttl;
        return !b ? !1 : (new Date).getTime() - this._time >= b
    };
    f.prototype.mapToURI = function (b, a) {
        return a || b
    };
    f.prototype.mapToId = function (b, a) {
        return a || b
    };
    f.prototype._shufflePartial = function (b) {
        var a = this._shuffledList;
        if (!a) return this;
        for (var h = this._origin.length - b, d = Array(h); h--;) d[h] = b + h;
        g(d).unshift(b, 0);
        a.splice.apply(a, d);
        return this
    };
    f.prototype._shuffle = function (b) {
        if (b != void 0) return this._shufflePartial(b);
        for (var a = this._origin.length, b = Array(a); a--;) b[a] = a;
        a = b.splice(this._currentIndex, 1).pop();
        g(b).unshift(a);
        this._list = this._shuffledList = b;
        this._currentIndex = 0;
        return this
    };
    f.prototype._unshuffle = function () {
        if (!this._shuffledList) return this;
        this._list = this._origin;
        this._currentIndex = this._shuffledList[this._currentIndex];
        return this
    };
    f.prototype.get = function (b) {
        var a = this._origin;
        if (b < 0 || b > a.length) return null;
        this._shuffled && (b = this._shuffledList[b]);
        a = a[b];
        b = this._metadata[b];
        return !a || !b ? null : {
            item: a,
            metadata: b
        }
    };
    f.prototype.getList = function () {
        return this._origin
    };
    f.prototype.getLength = function () {
        return this._origin.length
    };
    f.prototype.setFullLength = function (b) {
        if (typeof b != "number" && (b = parseInt(b, 10), isNaN(b))) throw new TypeError("Cannot set possible length to a non-number");
        this._actualLen = b;
        return this
    };
    f.prototype.getFullLength = function () {
        return this._actualLen != void 0 ? Math.max(this._actualLen, this.getLength()) : this.getLength()
    };
    f.prototype.append = function (b) {
        if (!b) return this;
        if (this._resolved) Spotify.App.trigger("track_multi_metadata", [b], function (a) {
            var d = this._origin.push(b) - 1;
            this._metadata.push(a[b]);
            this._shuffled && this._shuffle(d)
        }.bind(this));
        else {
            var a = this._origin.push(b) - 1;
            this._shuffled && this._shuffle(a)
        }
        return this
    };
    f.prototype.appendWithMeta = function (b, a) {
        if (!b || !a) return this;
        var h = this._origin.push(b) - 1;
        this._metadata[h] = a;
        this._shuffled && this._shuffle(h);
        return this
    };
    f.prototype.concat = function (b) {
        if (!b || !b.length) return this;
        if (this._resolved) Spotify.App.trigger("track_multi_metadata", b, function (a) {
            for (var h = 0, d = b.length; h < d; h++) this._origin.push(b[h]), this._metadata.push(a[b[h]]);
            this._shuffled && this._shuffle(this._origin.length - b.length - 1)
        }.bind(this));
        else {
            for (var a = 0, h = b.length; a < h; a++) this._origin.push(b[a]);
            this._shuffled && this._shuffle(this._origin.length - b.length - 1)
        }
        return this
    };
    f.prototype.splice = function (b, a) {
        if (typeof b == "undefined" || !a || !a.length) return this;
        if (this._resolved) Spotify.App.trigger("track_multi_metadata",
        a, function (h) {
            for (var d = [b, a.length], i = [b, a.length], f = 0, g = a.length; f < g; f++) f in a && a[f] && (d.push(a[f]), i.push(h[a[f]]));
            this._origin.splice.apply(this._origin, d);
            this._metadata.splice.apply(this._metadata, i);
            this._shuffled && this._shuffle(b)
        }.bind(this));
        else {
            for (var h = [b, a.length], d = 0, f = a.length; d < f; d++) d in a && a[d] && h.push(a[d]);
            this._origin.splice.apply(this._origin, h);
            this._shuffled && this._shuffle(b)
        }
    };
    f.prototype.trim = function (b, a) {
        var h = this._origin;
        if (h[b] != a) return !1;
        b += 1;
        var d = h.length;
        h.splice(b,
        d);
        this._resolved && this._metadata.splice(b, d);
        this._shuffled && this._shuffle();
        return !0
    };
    f.prototype.insert = function (b, a, h) {
        if (!h) return !1;
        typeof h == "string" && (h = [h]);
        var d = this._origin;
        if (d[b] != a) return !1;
        this._resolved ? Spotify.App.trigger("track_multi_metadata", h, function (f) {
            d.splice.apply(d, [b, 1, a].concat(h));
            for (var g = [], n = 0, o = h.length; n < o; n++) g.push(f[h[n]]);
            this._metadata.splice.apply(this._metadata, [b + 1, 0].concat(g))
        }.bind(this)) : d.splice.apply(d, [b, 1, a].concat(h));
        return !0
    };
    f.prototype.remove = function (b, a) {
        if (!a) return !1;
        var h = this._origin;
        if (h[b] != a) return !1;
        h.splice(b, 1);
        this._resolved && this._metadata.splice(b, 1);
        this._shuffled && this._shuffle();
        return !0
    };
    f.prototype.clear = function () {
        var b = this._origin,
            a = this._metadata;
        b.splice(0, b.length);
        a.splice(0, a.length);
        return this
    };
    f.prototype.hasRange = function (b, a) {
        var h = this._origin;
        if (b < 0) return !1;
        if (a >= h.length) return !1;
        for (var h = h.slice(b, a), d = h.length; d--;) if (!(d in h)) return !1;
        return !0
    };
    f.prototype.slice = function (b, a) {
        return this._origin.slice(b,
        a)
    };
    f.prototype.indexOf = function (b) {
        return this._list.indexOf(b)
    };
    f.prototype.getIndex = function () {
        return this._rule.indexing ? this._currentIndex : 0
    };
    f.prototype.getPlayingIndex = function () {
        return this._shuffled ? this._shuffledList[this._currentIndex] : this._currentIndex
    };
    f.prototype.startFrom = function (b) {
        var a = b.track;
        if (this._shuffled) {
            b = this._shuffledList;
            if (a == -1) {
                do a = Math.floor(Math.random() * b.length);
                while (a >= b.length)
            }
            for (var h = b.length; h--;) if (b[h] === a) {
                a = b[0];
                b[0] = b[h];
                b[h] = a;
                this._currentIndex = 0;
                break
            }
        } else this._currentIndex = a == -1 ? 0 : a;
        return this
    };
    f.prototype.current = function () {
        var b = this._shuffled ? this._list[this._currentIndex] : this._currentIndex;
        return {
            item: this._origin[b],
            metadata: this._metadata[b]
        }
    };
    f.prototype.shift = function () {
        var b = this._shuffled ? this._list[this._currentIndex] : this._currentIndex;
        if (!this._origin[b]) return null;
        var a = {
            item: this._origin[b],
            metadata: this._metadata[b]
        };
        this._origin.splice(b, 1);
        this._metadata.splice(b, 1);
        this._shuffled && this._list.splice(this._currentIndex,
        1);
        return a
    };
    f.prototype.hasNext = function () {
        return this._repeated || this._currentIndex + 1 < this._origin.length
    };
    f.prototype.next = function () {
        if (!this._rule.next) return !1;
        var b = ++this._currentIndex,
            a = this._origin;
        if (this._repeated) {
            if (b >= a.length) b = this._currentIndex = 0;
            this._shuffled && (b = this._shuffledList[b]);
            return {
                item: a[b],
                metadata: this._metadata[b]
            }
        } else if (b < a.length) return this._shuffled && (b = this._shuffledList[b]), {
            item: a[b],
            metadata: this._metadata[b]
        };
        this._currentIndex--;
        return null
    };
    f.prototype.hasPrevious = function () {
        return this._repeated || this._currentIndex - 1 >= 0
    };
    f.prototype.previous = function () {
        if (!this._rule.previous) return !1;
        var b = --this._currentIndex,
            a = this._origin;
        if (this._repeated) {
            if (b < 0) b = this._currentIndex = a.length - 1;
            this._shuffled && (b = this._shuffledList[b]);
            return {
                item: a[b],
                metadata: this._metadata[b]
            }
        } else if (b >= 0) return this._shuffled && (b = this._shuffledList[b]), {
            item: a[b],
            metadata: this._metadata[b]
        };
        this._currentIndex++;
        return null
    };
    f.prototype._loader = null;
    f.prototype.setLoader = function (b) {
        if (typeof b !=
            "function") return this;
        this._loader = b;
        return this
    };
    f.prototype._requestContents = function (b, a) {
        return !this._loader || this._origin.length == this.getFullLength() ? a.call(this) : this._loader.call(this, this, b.track, a.bind(this))
    };
    f.prototype._resolved = !1;
    f.prototype._resolvePartial = function (b, a, h, d, f) {
        for (var g = this._metadata, n = b.length; n--;) g[b[n].idx] = f[b[n]];
        this._resolved = !0;
        if (!a) return this;
        h(this);
        this._requestMeta(a, null, null, d)
    };
    f.prototype._requestMeta = function (b, a, h, d) {
        Spotify.App.trigger("track_multi_metadata",
        b, this._resolvePartial.bind(this, b, a, h, d), d.bind(null))
    };
    f.prototype._resolve = function (b, a, h) {
        a = a || function () {};
        h = h || function () {};
        if (this._resolved) return a(this);
        var b = b == -1 ? 0 : b || 0,
            d = this._origin,
            f = this._shuffledList,
            g = Math.max(b - 7, 0),
            n, o, k, p = [];
        if (this._shuffled) {
            for (n = 0, o = f.length; n < o; n++) k = new String(d[f[n]]), k.idx = f[n], f[n] == b ? (f.unshift(f.splice(n, 1).pop()), p.unshift(k)) : p.push(k);
            g = this._currentIndex = 0
        } else for (n = 0, o = d.length; n < o; n++) k = new String(d[n]), k.idx = n, p.push(k);
        this._requestMeta(p.splice(g,
        15), p, a, h)
    };
    f.prototype.resolve = function (b, a, h) {
        this._requestContents(b, this._resolve.bind(this, b.track, a, h))
    }
})();
(function () {
    function g(b) {
        this._id = b;
        this._rule = a.defaults;
        this._repeated = this._shuffled = !1;
        this._currentContext = 0;
        this._contexts = [];
        this._shuffledContexts = [];
        this._noReset = new f;
        this._ttl = (new Date).getTime()
    }
    var f = Spotify.getStorage("app.ns").retrieve("WeakMap"),
        d = Spotify.getStorage("app.context.ns"),
        b = d.retrieve("quickShuffle"),
        c = d.retrieve("Context"),
        a = d.retrieve("ContextRules");
    d.store("ContextGroup", g);
    g.prototype.mapToId = c.prototype.mapToId;
    g.prototype.mapToURI = c.prototype.mapToURI;
    g.prototype.setExpiry = c.prototype.setExpiry;
    g.prototype.isExpired = c.prototype.isExpired;
    g.prototype.getContext = function (a) {
        a = a != void 0 ? a : this._currentContext;
        return this._shuffled ? this._contexts[this._shuffledContexts[a]] : this._contexts[a]
    };
    g.prototype.getContextIds = function () {
        var a = [],
            b = this._contexts,
            c = b.length;
        if (!c) return a;
        for (; c--;) a[c] = b[c].getId();
        return a
    };
    g.prototype.setRule = function (b) {
        return (b = a[b]) ? (this._rule = b, !0) : !1
    };
    g.prototype.getRule = function () {
        return this.getContext().getRule()
    };
    g.prototype.setShuffle = function (a) {
        if (!this._rule.shuffle) return !1;
        (this._shuffled = a) ? this._shuffle() : this._unshuffle();
        return a
    };
    g.prototype.isShuffled = function () {
        return this._shuffled
    };
    g.prototype.setRepeat = function (a) {
        return !this._rule.repeat ? !1 : this._repeated = a
    };
    g.prototype.isRepeated = function () {
        return this._repeated
    };
    g.prototype.startFrom = function (a) {
        var b = a.context;
        if (this._shuffled) {
            var c = this._shuffledContexts;
            if (b == -1) {
                do b = Math.floor(Math.random() * c.length);
                while (b >= c.length)
            }
            for (var d = c.length; d--;) if (c[d] === b) {
                b = c[0];
                c[0] = c[d];
                c[d] = b;
                this._currentContext = 0;
                break
            }
        } else this._currentContext = b == -1 ? 0 : b;
        (c = this.getContext()) && c.startFrom(a);
        return this
    };
    g.prototype._shufflePartial = function (a) {
        var c = this._shuffledContexts;
        if (!c) return this;
        for (var d = this._contexts, f = d.length - a, g = Array(f); f--;) {
            var o = d[a + f];
            o && o.setShuffle(!0);
            g[f] = a + f
        }
        b(g).unshift(a, 0);
        c.splice.apply(c, g)
    };
    g.prototype._shuffle = function (a) {
        if (a != void 0) return this._shufflePartial(a);
        for (var c = this._contexts.slice(0), a = this._shuffledContexts = [], d = 0, f = c.length; d < f; d++) c[d].setShuffle(!0), a.push(d);
        c = a.splice(this._currentContext, 1).pop();
        b(a).unshift(c);
        this._currentContext = 0;
        this._noReset.clear();
        this._noReset.set(this.getContext(), !0);
        return this
    };
    g.prototype._unshuffle = function () {
        this._currentContext = this._shuffledContexts[this._currentContext];
        for (var a = this._contexts.slice(0), b = 0, c = a.length; b < c; b++) a[b].setShuffle(!1);
        this._noReset.clear();
        return this
    };
    g.prototype.append = function (a) {
        this._contexts.push(a.unwrap());
        this._resolved && a.resolve({
            track: 0,
            context: 0
        });
        this._shuffled && this._shuffle(this.length - 1);
        return this
    };
    g.prototype.concat = function (a) {
        if (!a || !a.length) return this;
        for (var b = 0, c = a.length; b < c; b++) this._contexts.push(a[b].unwrap()), this._resolved && a[b].resolve({
            track: 0,
            context: 0
        });
        this._shuffled && this._shuffle(this._contexts.length - a.length)
    };
    g.prototype.splice = function (a, b) {
        if (typeof a == "undefined" || !b || !b.length) return this;
        for (var c = [a, b.length], d = 0, f = b.length; d < f; d++) d in b && b[d] && (c.push(b[d].unwrap()), this._resolved && b[d].resolve({
            track: 0,
            context: 0
        }));
        this._contexts.splice.apply(this._origin, c);
        this._shuffled && this._shuffle(a)
    };
    g.prototype.insert = function (a, b, c) {
        if (!c) return !1;
        var d = this._contexts,
            b = b.unwrap(),
            c = c.unwrap();
        if (d[a] != b) return !1;
        d.splice(a, 1, b, c);
        this._resolved && c.resolve({
            track: 0,
            context: 0
        });
        return !0
    };
    g.prototype.remove = function (a, b) {
        if (!b) return !1;
        var c = this._contexts,
            b = b.unwrap();
        if (c[a] != b) return !1;
        c.splice(a, 1);
        this._shuffled && this._shuffle();
        return !0
    };
    g.prototype.clear = function () {
        var a = this._contexts;
        a.splice(0, a.length);
        return this
    };
    g.prototype.slice = function (a, b) {
        return this._contexts.slice(a, b)
    };
    g.prototype.get = function (a) {
        for (var b = this._contexts, c = 0, d = b.length; c < d; c++) {
            var f = b[c],
                g = f.getLength();
            if (g < a) a -= g;
            else return f.get(a)
        }
        return null
    };
    g.prototype.current = function () {
        return this.getContext().current()
    };
    g.prototype.getIndex = function (a) {
        var b = this.getContext().getIndex();
        if (!a) return b;
        for (var a = this._currentContext, c = this._contexts, d = 0; d != a; d++) b += c[d]._origin.length;
        return b
    };
    g.prototype.getPlayingIndex = function () {
        return this.getContext().getPlayingIndex()
    };
    g.prototype.getContextIndex = function () {
        return this._shuffled ? this._shuffledContexts[this._currentContext] : this._currentContext
    };
    g.prototype.getLength = function (a) {
        if (!a) return this.getContext().getLength();
        for (var a = 0, b = this._contexts.length; b--;) a += this._contexts[b]._origin.length;
        return a
    };
    g.prototype.getFullLength = function () {
        return this.getContext().getFullLength()
    };
    g.prototype.getContextsLength = function () {
        return this._contexts.length
    };
    g.prototype.previous = function () {
        if (!this._rule.previous) return !1;
        var a = this._contexts,
            b = a.length,
            c = null,
            d;
        if (this._shuffled) for (var f = this._noReset; b--;) {
            d = --this._currentContext;
            if (d < 0) d = this._currentContext = a.length - 1;
            d = a[this._shuffledContexts[d]];
            if (!d) return null;
            if (this._repeated && d._currentIndex == 0) d._currentIndex = d.getLength();
            f.get(d) || (d._currentIndex++, f.set(d, !0));
            if (c = this.getContext().previous()) break
        } else for (; b--;) {
            if (c = this.getContext().previous()) break;
            d = --this._currentContext;
            if (d < 0) {
                if (!this._repeated) {
                    this._currentContext++;
                    break
                }
                d = this._currentContext = a.length - 1
            }
            d = a[d];
            if (!d) return null;
            d._currentIndex = d.getLength()
        }
        return c
    };
    g.prototype.next = function () {
        if (!this._rule.next) return !1;
        var a = this._contexts,
            b = a.length,
            c = null,
            d;
        if (this._shuffled) for (var f = this._noReset; b--;) {
            d = ++this._currentContext;
            if (d >= a.length) d = this._currentContext = 0;
            next = a[this._shuffledContexts[d]];
            if (!next) return null;
            if (this._repeated && next._currentIndex == next.getLength() - 1) next._currentIndex = -1;
            f.get(next) || (next._currentIndex--, f.set(next, !0));
            if (c = this.getContext().next()) break
        } else for (; b--;) {
            if (c = this.getContext().next()) break;
            d = ++this._currentContext;
            if (d >= a.length) {
                if (!this._repeated) {
                    this._currentContext--;
                    break
                }
                d = this._currentContext = 0
            }
            next = a[d];
            if (!next) return null;
            next._currentIndex = -1
        }
        return c
    };
    g.prototype.getId = function () {
        return this.getContext().getId()
    };
    g.prototype.resolve = function (a, b, c) {
        this.startFrom(a);
        var d = this._contexts;
        if (this._resolved) return b();
        this.getContext().resolve(a, function () {
            this._resolved = !0;
            b();
            for (var c = d.length; c--;) d[c].resolve(a)
        }.bind(this), c)
    }
})();
(function () {
    function g(a) {
        this._context = a;
        this._owner = ""
    }
    function f() {
        this.cache = new c(1E3)
    }
    function d(a, b, c) {
        a = new a(b.toString());
        this.cache.put(b, a);
        return (new g(a)).setExpiry(c)
    }
    function b(a, b, c, h) {
        var d = this.cache.get(b.toString());
        if (d) if (d.isExpired()) this.cache.remove(d);
        else return (new g(d)).setExpiry(h);
        return c ? a == i ? this.create(b, h) : this.createGroup(b, h) : null
    }
    var c = Spotify.SimpleCache,
        a = Spotify.getStorage("app.ns"),
        h = Spotify.getStorage("app.context.ns"),
        i = h.retrieve("Context"),
        l = h.retrieve("ContextGroup");
    a.store("ContextManager", f);
    g.prototype.getOwner = function () {
        return this._owner
    };
    g.prototype.unwrap = function () {
        return this._context
    };
    g.prototype.setOwner = function (a) {
        if (a) this._owner = a;
        return this
    };
    g.prototype.isContext = function () {
        return this._context instanceof i
    };
    g.prototype.isContextGroup = function () {
        return this._context instanceof l
    };
    for (var m in i.prototype)(function (a) {
        g.prototype[a] = function () {
            var b = this._context,
                c = b[a];
            if (!c) throw Error('Context object has no method "' + a + '"');
            c = c.apply(b, arguments);
            return c == b ? this : c
        }
    })(m);
    f.prototype.create = function (a, b) {
        return d.call(this, i, a, b)
    };
    f.prototype.createGroup = function (a, b) {
        return d.call(this, l, a, b)
    };
    f.prototype.get = function (a, c, h) {
        return b.call(this, i, a, c, h)
    };
    f.prototype.getGroup = function (a, c, h) {
        return b.call(this, l, a, c, h)
    };
    f.prototype.remove = function (a) {
        return this.cache.remove(a.toString())
    }
})();
(function () {
    function g(a, c, d, f) {
        var h;
        b.call(this);
        this._available = this._uid = 0;
        this._previous = {};
        this._incoming = {};
        h = this.audioManager = a.audioManager, a = h;
        this.player = c;
        this.logging = a.getTrackerForPlayerWithId(c.id);
        this.alternate = d;
        this._fade = !! f;
        this._intercept = !1;
        this._interceptions = this._intercepted = null;
        this._queue = [];
        this._history = [];
        this.setup()
    }
    var f = Spotify.Link,
        d = Spotify.getStorage("app.ns"),
        b = d.retrieve("EventEmitter"),
        c = [].slice;
    g.prototype = new b;
    g.prototype.constructor = g;
    d.store("ContextPlayer",
    g);
    g.prototype.setup = function () {
        var a = this.player;
        a.bind("BEFORE_END", this.onBeforeEnded, this);
        a.onPlay = this.onPlay.bind(this);
        a.onPause = this.onPause.bind(this);
        a.onTrackEnded = this.onEnded.bind(this);
        a.onInvalidTrackUri = a.onPlaybackFailed = this.onInvalid.bind(this)
    };
    g.prototype.onPlay = function () {
        if (!this._hardStopped) {
            this._available++;
            this._keepPlay && this.player.resume();
            delete this._keepPlay;
            this.fireEvent("play");
            var a = this.player.trackUri,
                b = this._incoming[a];
            delete this._incoming[a];
            b && setTimeout(b.bind(this),
            10)
        }
    };
    g.prototype.onPause = function () {
        this.fireEvent("pause")
    };
    g.prototype.onBeforeEnded = function () {
        var a = this;
        if (this._fade && !this._currentContext.hasNext()) a._crossfading = !0, this._fadeback != null && this._fadeback && a.alternate.resume(), this.audioManager.crossfade(this.player.id, this.alternate.id, 800, function () {
            a.player.pause();
            a._fadeback = null;
            a._crossfading = !1
        })
    };
    g.prototype.onEnded = function () {
        delete this._keepPlay;
        this.fireEvent("ended");
        this._playIntercepted() || this.next(!0)
    };
    g.prototype.onInvalid = function (a) {
        delete this._keepPlay;
        var b = a.params.data,
            c = this._incoming[b];
        delete this._incoming[b];
        c && setTimeout(c.bind(this, "unplayable"), 10);
        b = this.next.bind(this, !0, function (a) {
            if (!(a !== "no-context" || a !== "forbidden" || a !== "no-tracks")) a = this._previous, this._currentContext = a.context, this._currentTrack = a.track, this._currentGroup = a.group
        }.bind(this));
        a.params.domain == 12 && a.params.code == 8 || b()
    };
    g.prototype._shuffled = !1;
    g.prototype.setShuffle = function (a) {
        this._shuffled = a = !! a;
        var b = this._currentContext;
        b && b.setShuffle(a);
        return !0
    };
    g.prototype._repeated = !1;
    g.prototype.setRepeat = function (a) {
        this._repeated = a = !! a;
        var b = this._currentContext;
        b && b.setRepeat(a);
        return !0
    };
    g.prototype.setVolume = function (a) {
        if (typeof a != "number") return !1;
        this.audioManager.setMasterVolume(a);
        return !0
    };
    g.prototype.getState = function (a) {
        var b = this.player.getPlayerState(),
            c = this._currentContext,
            b = {
                __uid: this._uid,
                __index: c ? c.getIndex(!0) : null,
                __length: c ? c.getLength(!0) : null,
                __rules: c ? c.getRule() : {},
                __owner: c ? c.getOwner() : null,
                playing: this._keepPlay ? !0 : !b.isPaused && !b.isStopped,
                context: {
                    uri: c ? c.getId() : null
                },
                index: !c ? null : c.getPlayingIndex(),
                track: this._currentTrack || {
                    uri: null
                },
                position: b.position,
                duration: b.duration || 0,
                volume: this.audioManager.getMasterVolume(),
                repeat: c ? c.isRepeated() : this._repeated,
                shuffle: c ? c.isShuffled() : this._shuffled
            };
        if (a && (b.__group = null, c && c.isContextGroup())) a = c._context, b.__group = {
            id: a._id,
            index: a.getContextIndex(),
            array: a.getContextIds()
        };
        return b
    };
    g.prototype._currentGroup = null;
    g.prototype._currentContext = null;
    g.prototype._currentTrack = !1;
    g.prototype.togglePlay = function () {
        this.player.playpause();
        return !0
    };
    g.prototype.resume = function () {
        var a = this.alternate.getPlayerState();
        !a.isPaused && !a.isStopped && (this.alternate.pause(), this.player.setVolume(this.audioManager.getMasterVolume()));
        this.player.resume();
        return !0
    };
    g.prototype.pause = function () {
        this.player.pause();
        return !0
    };
    g.prototype.stop = function () {
        var a = this,
            b = this.player;
        this._hardStopped = !0;
        this._fade && (!b.isStopped && !b.isPaused || this._keepPlay != null) ? (a._crossfading = !0, this._fadeback != null && this._fadeback && a.alternate.resume(), this.audioManager.crossfade(this.player.id, this.alternate.id, 800, function () {
            a.player.pause();
            a.reset();
            a._fadeback = null;
            a._crossfading = !1
        })) : (this._crossfading = !1, this._fadeback = null, this.player.pause(), this.reset())
    };
    g.prototype.seek = function (a) {
        if (typeof a != "number" || !this._currentContext || !this._currentContext.getRule().seek) return !1;
        this.player.seek(a);
        return !0
    };
    g.prototype.queue = function (a) {
        if (!a) return !1;
        head ? this._queue.unshift(queue) : this._queue.push(queue);
        a.resolve({
            track: 0,
            context: 0
        });
        return !0
    };
    g.prototype.intercept = function () {
        this._intercept = !0;
        return this
    };
    g.prototype.setIntercept = function (a) {
        if (!a) return !1;
        this._interceptions = a;
        return !0
    };
    g.prototype._getIntercept = function () {
        if (!this._intercept || !this._interceptions) return null;
        this._intercept = !1;
        var a = this._interceptions.shift();
        if (!a) return null;
        var b = f.fromString(a.item),
            a = a.metadata;
        if (!a || !a.playable && !a.__pid) return null;
        a.uri = b.toURI();
        return {
            item: (b.type ==
                "ad" ? f.adLink(a.__pid) : f.trackLink(a.__pid)).toURI(),
            metadata: a,
            context: this._interceptions
        }
    };
    g.prototype._playIntercepted = function () {
        if (!this._intercepted) return !1;
        var a = this._intercepted;
        delete this._intercepted;
        this._attemptPlay.apply(this, a);
        return !0
    };
    g.prototype.next = function (a, b) {
        var c = this._currentContext;
        if (!this._available && this._repeated) return this.createEndLog("endplay", c), this;
        if (!c) return b && b.call(this, "no-context"), this;
        var d = c.next();
        do if (d) {
            var g = d.item,
                n = d.metadata;
            if (n && (n.playable || n.__pid)) break
        }
        while (d = c.next());
        if (!d) {
            if (d === !1) return b && b.call(this, "forbidden"), this;
            this.createEndLog("endplay", c);
            b && b.call(this, "no-tracks");
            return this.stop()
        }
        n.uri = g;
        g = f.trackLink(n.__pid).toURI();
        d = a ? "trackdone" : "nextbtn";
        this.fireEvent("beforeNext", [g, n, c], !0);
        this.createEndLog(d, c);
        this.fireEvent("next", [g, n, c]);
        this._attemptPlay(d, g, n, c);
        b && b.call(this)
    };
    g.prototype.previous = function (a, b) {
        var c = this._currentContext;
        if (!c) return b && b.call(this, "no-context"), this;
        var d = c.previous();
        do if (d) {
            var g = d.item,
                n = d.metadata;
            if (n && (n.playable || n.__pid)) break
        }
        while (d = c.previous());
        if (!d) {
            if (d === !1) {
                b && b.call(this, "forbidden");
                return
            }
            this.createEndLog("endplay", c);
            b && b.call(this, "no-tracks");
            return this.stop()
        }
        n.uri = g;
        g = f.trackLink(n.__pid).toURI();
        d = a ? "trackdone" : "backbtn";
        this.fireEvent("beforePrevious", [g, n, c], !0);
        this.createEndLog(d, c);
        this.fireEvent("previous", [g, n, c]);
        this._attemptPlay(d, g, n, c);
        b && b.call(this)
    };
    g.prototype.play = function (a, b, c) {
        this._hardStopped = !1;
        a.setRepeat(this._repeated);
        a.setShuffle(this._shuffled);
        a.startFrom(b);
        this._useDuration = b.duration;
        a.resolve(b, this._parseContext.bind(this, a, b, c), (c || function () {}).bind(null, "metadata-error"))
    };
    g.prototype._locatePlayable = function (a) {
        for (var b = 0, c = a.getLength(!0); b < c; b++) {
            var d = a.get(b);
            if (d && (track = d.item, metadata = d.metadata, metadata.playable || metadata.__pid)) return a._context._currentIndex = b, d
        }
        return null
    };
    g.prototype._parseContext = function (a, b, c) {
        var d = !1;
        b.track == -1 && (d = !0);
        var g, n = !d ? a.current() : this._locatePlayable(a);
        if (!n) return c("no-playables");
        var o = function (d, g) {
            g.uri = d;
            var l = f.trackLink(g.__pid);
            this._available = a.getLength(!0);
            this.fireEvent("beforeContextChange", [l, g, a], !0);
            this.createEndLog(b.reason || "clickrow", a);
            this._attemptPlay(b.reason || "clickrow", l, g, a, c, b.ms, b.duration, b.pause);
            this.fireEvent("contextChange", [l, g, a])
        }.bind(this),
            d = n.item;
        g = n.metadata;
        if (!g || !g.playable && !g.__pid) return c("unplayable", n.item);
        o(d, g)
    };
    g.prototype._playTrigger = null;
    g.prototype._attemptPlay = function (a, b, d, g, m, n, o, k) {
        var p = this;
        b instanceof f && (b = b.toURI());
        this.fireEvent("beforePlay", [b, d, g]);
        this.createLog(a, d.uri, g);
        if (this._intercepted) return this._intercepted = c.call(arguments), this.fireEvent("intercepted", [b, d, g]), this;
        var q = this._getIntercept();
        q ? (this._intercepted = c.call(arguments), b = q.item, d = q.metadata, g = q.context) : this._incoming[b] = m;
        this._previous = {
            context: this._currentContext,
            track: this._currentTrack,
            group: this._currentGroup
        };
        this._currentContext = g;
        this._currentTrack = d;
        this.player.pause();
        this._keepPlay = !k;
        n = isNaN(n) || n < 0 ? 0 : n;
        o = this._useDuration;
        o = isNaN(o) || o <= 0 ? -1 : o;
        this._available--;
        this.player.onLoad = function () {
            var a = this.alternate,
                b = a.getPlayerState();
            this._hardStopped ? this._fadeback != null && this._fadeback && a.resume() : this._fade ? (this._fadeback = this._fadeback != null ? this._fadeback : !a.isPaused && !a.isStopped, p._crossfading = !0, this.audioManager.crossfade(this.alternate.id, this.player.id, 800, function () {
                p._hardStopped ? a.setVolume(1) : (a.pause(), a.seek(Math.max(0, Math.floor(b.position - 2E3))), p._crossfading = !1)
            })) : a.pause()
        }.bind(this);
        b = g.mapToId(d.uri, b);
        this._playTrigger ? (clearTimeout(this._playTrigger), this._playTrigger = setTimeout(function () {
            this._uid++;
            this.player.load(b, n, !k, o != -1 && n != -1 ? n + o : o, 1E3);
            delete this._playTrigger
        }.bind(this), 1E3)) : (this._playTrigger = 1, this._uid++, this.player.load(b, n, !k, o != -1 && n != -1 ? n + o : o, 1E3))
    };
    g.prototype.createLog = function (a, b, c) {
        var d = "",
            g = "unknown",
            n = c.getOwner(),
            o = f.fromString(n);
        if (c && o.id != "search" && o.id != "radio") {
            if (c = c.getId()) c = f.fromString(c), d = c.toURI(), g = c.type
        } else if (o.id == "search" || o.id == "radio") d = n, source_end = g = o.id;
        a = {
            display_track: b,
            play_context: d,
            source_start: g,
            reason_start: a,
            referrer: n,
            referrer_version: "0.1.0",
            referrer_vendor: "com.spotify"
        };
        this._started = !0;
        this.logging.setEndSongStartLog(a);
        return a
    };
    g.prototype.createEndLog = function (a, b) {
        if (!this._started) return this;
        var c = "unknown",
            d = b.getOwner(),
            d = f.fromString(d);
        if (b && d.id != "search" && d.id != "radio") {
            if (d = b.getId()) f.fromString(d).toURI(), c = f.fromString(d).type
        } else if (d.id == "search" || d.id == "radio") c = d.id;
        c = {
            source_end: c,
            reason_end: a
        };
        this.logging.setEndSongStopLog(c);
        return c
    };
    g.prototype.reset = function () {
        this._currentGroup = this._currentContext = this._currentTrack = this._keepPlay = null;
        this._playTrigger && clearTimeout(this._playTrigger);
        delete this._playTrigger;
        this.player.stop();
        this.fireEvent("reset")
    }
})();
(function () {
    var g = Spotify.getStorage("app.ns"),
        f = g.retrieve("ContextManager"),
        d = g.retrieve("ContextPlayer"),
        b = g.retrieve("EventEmitter"),
        c = g.retrieve("RequestBuffer"),
        a = g.retrieve("RequestLogger"),
        h = g.retrieve("Responder"),
        i = g.retrieve("WeakMap"),
        l = !1,
        m = [],
        n = new a;
    Spotify.App = new b;
    Spotify.App.getLogger = function () {
        return n
    };
    Spotify.App.onReady = function (a, b) {
        l && a.call(b || this);
        m.push({
            fn: a,
            bound: b
        });
        return this
    };
    Spotify.App.init = function (a, b) {
        l = !0;
        var c, h = a.audioManager,
            g = h.getPlayerAtIndex(0),
            h = h.addPlayer("PreviewPlayer"),
            i;
        if (!a.contextManager) c = a.contextManager = new f, i = a.contextPlayer = new d(a, g, h, !1), a.previewPlayer = new d(a, h, g, !0);
        a.adChooser.initializeContext && a.adChooser.initializeContext(c, i);
        c = 0;
        for (g = m.length; c < g; c++) i = m[c], i.fn.call(i.bound || this, a, b || {
            publisher: {
                subscribe: Spotify.App.noop
            }
        });
        return this
    };
    Spotify.App.noop = function () {};
    Spotify.App.ContextManager = f;
    Spotify.App.ContextPlayer = d;
    Spotify.App.EventEmitter = b;
    Spotify.App.RequestBuffer = c;
    Spotify.App.RequestLogger = a;
    Spotify.App.Responder = h;
    Spotify.App.WeakMap = i;
    Spotify.App.trigger = h.prototype.trigger;
    b = {
        tiny: "https://d3rt1990lpmkn.cloudfront.net/60/",
        normal: "https://d3rt1990lpmkn.cloudfront.net/300/",
        small: "https://d3rt1990lpmkn.cloudfront.net/120/",
        large: "https://d3rt1990lpmkn.cloudfront.net/640/",
        avatar: "https://d3rt1990lpmkn.cloudfront.net/artist_image/"
    };
    Spotify.App.SourceURLs = b;
    g.store("SourceURLs", b);
    Spotify.App.extractAppName = function (a) {
        return (a = a.match(/^https?:\/\/[A-Za-z0-9]{40}-([A-Za-z0-9_-]+).*/)) ? a[1] : null
    }
})();
(function () {
    function g() {
        if (p.length) {
            var a = (new Date).getTime(),
                b = p.first;
            do {
                var c = b.value;
                if (a - c.timestamp < k) break;
                c.timeout();
                c = b.next;
                p.remove(b)
            } while (b = c)
        }
        setTimeout(g, k)
    }
    function f(a) {
        var f = a.data;
        if (typeof f == "string") try {
            f = JSON.parse(f)
        } catch (g) {
            return this
        }
        var k = f.uid = o++,
            w = a.source,
            a = a.origin;
        f.origin = a;
        f.source = w;
        m[k] = {
            origin: a,
            source: w,
            timestamp: (new Date).getTime()
        };
        w = new h(f.uid, f.id);
        w._type = f.name;
        if (f.name == "core_flush") return i.flush(), w.send(!0);
        d && ((a = c(a)) && n.enter(a, k, f.name,
        f.args), w.setLogger(n));
        k = l[f.name];
        if (!k) return w.fail("not-implemented", "API not implemented.");
        p.append(new b.Node(w));
        k.fn.call(k.bound || {}, f, w)
    }
    var d = !1,
        d = !0,
        b = Spotify.LinkedList,
        c = Spotify.App.extractAppName,
        a = Spotify.getStorage("app.ns");
    a.retrieve("RequestLogger");
    var h = a.retrieve("Reply"),
        i = a.retrieve("Responder"),
        a = Spotify.getStorage("app.message.ns"),
        l = a.retrieve("handlers");
    a.retrieve("privateHandlers");
    var m = a.retrieve("callbacks"),
        n = Spotify.App.getLogger(),
        o = 0,
        k = 3E4,
        p = new b;
    g();
    window.attachEvent && !window.addEventListener ? window.attachEvent("onmessage", f) : window.addEventListener("message", f, !1)
})(this);
(function () {
    var g = Spotify.Link,
        f = Spotify.LinkedList,
        d = Spotify.App.WeakMap,
        b = {
            artist: !0,
            album: !0,
            search: !0
        };
    new Spotify.App.Responder({
        _ready: !1,
        _frames: new f,
        _argCache: new d,
        _listeners: new d,
        _waitingQueryReplies: new d,
        _logData: null,
        init: function (b, a) {
            if (!a) return this;
            var h = this.publisher = a.publisher;
            this.logger = b.logging.view;
            this.clientLogger = b.logging.clientEvent;
            h.subscribe("APPLICATION_STATE_CHANGED", this);
            h.subscribe("APPLICATION_DISPOSED", this);
            this.setup()
        },
        setup: function () {
            this._ready = !0;
            this.unqueue()
        },
        log: function (b) {
            var a = this._logData,
                h = (new Date).getTime();
            a && this.logger.log(a.uri, a.version, a.vendor, h - a.timestamp);
            this._logData = {
                uri: b,
                version: "0.1.0",
                vendor: "com.spotify",
                timestamp: h
            }
        },
        onAppStateChange: function (c) {
            var c = c.message,
                a = c.iframe;
            this._frames.append(new f.Node(a));
            var h = c.link,
                c = this._argCache.get(a) || [],
                d = this.transformArgs(h.id, h.args);
            this._argCache.set(a, d);
            this.log(h.toURI());
            var g = this._waitingQueryReplies.get(a);
            if (g) {
                g = g.splice(0);
                c = 0;
                for (d = g.length; c < d; c++) g[c].send(m)
            } else {
                if (b[h.id]) return this;
                g = this._listeners.get(a);
                if (!g) return this;
                var m = {
                    type: "arguments",
                    data: {
                        arguments: this.decodeArgs(d)
                    }
                }, a = d.length;
                if (a != c.length) return g.send(m);
                for (; a--;) if (d[a] != c[a]) return g.send(m)
            }
        },
        onAppDisposed: function (b) {
            for (var a = this._frames, h = a.first, b = b.message.iframe; h;) {
                var d = h.next;
                b == h.value && a.remove(h);
                h = d
            }
            this._argCache.remove(b);
            this._listeners.remove(b);
            this._waitingQueryReplies.remove(b)
        },
        onNotify: function (b) {
            switch (b.messageType) {
                case "APPLICATION_STATE_CHANGED":
                    return this.onAppStateChange(b);
                case "APPLICATION_DISPOSED":
                    return this.onAppDisposed(b)
            }
        },
        associateWindow: function (b) {
            for (var a = this._frames.first; a;) {
                if (a.value && a.value.contentWindow == b) return a.value;
                a = a.next
            }
            return null
        },
        "@application_open_uri": function (b, a) {
            var h;
            try {
                h = g.fromString(b.args[0]).toAppLink()
            } catch (d) {
                return a.fail("invalid-uri", "The URI passed is not a valid Spotify URI.")
            }
            this.publisher.notify("APPLICATION_OPEN_URI", {
                link: h,
                origin: this.associateWindow(b.source),
                replace: !! b.args[1]
            });
            return a.send(!0)
        },
        extractName: function (b) {
            return b.match(/^https?:\/\/[A-Za-z0-9]{40}-([A-Za-z0-9_-]+).*/)
        },
        transformArgs: function (b, a) {
            a = a.slice(0);
            if (b == "user" || b == "playlist") switch (a[1]) {
                case "playlist":
                    a = [a[0], a[2]];
                    break;
                case "starred":
                    a = [a[0], "starred"];
                    break;
                case "toplist":
                    a = [a[0], "toplist"];
                    break;
                case "top":
                    a = [a[0], "top", a[2]]
            }
            for (var h = a.length; h--;) a[h] = encodeURIComponent(a[h]);
            return a
        },
        decodeArgs: function (b) {
            for (var b = b.slice(0), a = b.length; a--;) b[a] = decodeURIComponent(b[a]);
            return b
        },
        "@application_query": function (b, a) {
            var h = this.extractName(b.origin),
                d = h ? g.applicationLink(h[1]).toURI() : null,
                h = h ? h[1] : "";
            a.addPartial({
                uri: d,
                name: h,
                identifier: h
            });
            (h = this._argCache.get(this.associateWindow(b.source))) ? a.send({
                arguments: this.decodeArgs(h)
            }) : (h = this._waitingQueryReplies.get(this.associateWindow(b.source)) || [], h.push(a.persist()), this._waitingQueryReplies.set(this.associateWindow(b.source), h))
        },
        "@application_event_wait": function (b, a) {
            this._listeners.set(this.associateWindow(b.source), a.persist())
        },
        "@application_client_event": function (b, a) {
            var h = this.extractName(b.origin);
            if (!h) return a.fail("invalid-uri",
                "The origin of the request is not a valid application.");
            var h = g.applicationLink(h[1], this._argCache.get(this.associateWindow(b.source)) || []),
                d = b.args;
            try {
                this.clientLogger.log({
                    source: h.toURI(),
                    source_version: "0.1.0",
                    source_vendor: "com.spotify",
                    context: d[0].toString(),
                    event: d[1].toString(),
                    event_version: d[2].toString(),
                    test_version: d[3].toString(),
                    data: JSON.stringify(d[4])
                })
            } catch (f) {
                return a.fail("invalid-request", "Check your logging arguments.")
            }
            return a.send(!0)
        },
        "@application_get_uri": function (b,
        a) {
            var h = this.extractName(b.args[0]);
            if (!h) return a.fail("invalid-uri", "The origin of the request is not a valid application.");
            var h = h[1],
                d = this._argCache.get(this.associateWindow(b.args[1])) || [];
            a.send(g.applicationLink(h, d).toURI())
        },
        "@application_get": function (b, a) {
            var h = this.extractName(b.args[0]);
            if (!h) return a.fail("invalid-uri", "The origin of the request is not a valid application.");
            for (var h = h[1], d = this._argCache.get(this.associateWindow(b.args[1])) || [], f = d.length; f--;) d[f] = decodeURIComponent(d[f]);
            a.send({
                uri: g.applicationLink(h, d).toURI(),
                frame: this.associateWindow(b.args[1])
            })
        },
        "@application_set_preferred_size": function (b, a) {
            var h = parseInt(b.args[0], 10),
                d = parseInt(b.args[1], 10);
            if (isNaN(h) || isNaN(d) || h <= 0 || d <= 0) return a.fail("invalid-request", "Size arguments need to be positive integer values.");
            a.persist();
            this.publisher.notify("APPLICATION_SET_PREFERRED_SIZE", {
                origin: this.associateWindow(b.source),
                width: h,
                height: d,
                callback: function (b, c) {
                    return b <= 0 || c <= 0 ? a.fail("forbidden", "Cannot complete resizing request.") : a.send({
                        width: b,
                        height: c
                    })
                }
            })
        },
        "@application_exit": function (b) {
            var a = b.args[0];
            this.publisher.notify("APPLICATION_EXIT", {
                origin: this.associateWindow(b.source),
                status: a
            })
        },
        "@application_set_title": function (b, a) {
            var h = b.args[0];
            document.title = !h || !h.replace(/^\s+|\s+$/g, "") ? "Spotify" : h + " - Spotify";
            return a.send(!0)
        }
    })
})();
(function () {
    new Spotify.App.Responder({
        _ready: !1,
        init: function (g, f) {
            this.publisher = f.publisher;
            this._ready = !0;
            this.unqueue()
        },
        "@client_features": function (g, f) {
            return f.send({
                features: {
                    followUser: !0,
                    followArtist: !1,
                    autoFollowPlaylistOwners: !1
                }
            })
        },
        "@client_show_share_ui": function (g, f) {
            var d = g.args[0];
            if (!d) return f.fail("invalid-uri", "URI argument is required.");
            var b = parseInt(g.args[2], 10),
                c = parseInt(g.args[3], 10),
                b = isNaN(b) ? 0 : b,
                c = isNaN(c) ? 0 : c;
            this.publisher.notify("CLIENT_SHOW_SHARE_UI", {
                origin: g.source,
                left: b,
                top: c,
                uri: d,
                callback: function (a) {
                    return a ? f.send(!0) : f.fail("forbidden", "Cannot show share UI")
                }
            })
        }
    })
})();
(function () {
    new Spotify.App.Responder({
        _ready: !1,
        init: function (g) {
            this.service = g.hermes;
            this.start()
        },
        start: function () {
            this._ready = !0;
            this.unqueue()
        },
        sendSchemaId: function (g, f) {
            g.send({
                id: f
            })
        },
        handleErrors: function (g, f) {
            return g.fail("hermes", "Hermes error", f)
        },
        "@hermes_register_schema": function (g, f) {
            this.service.loadSchemas(this.resolveSchemas(g.args, g.deps), "proto", this.sendSchemaId.bind(this, f), this.handleErrors.bind(this, f))
        },
        resolveSchemas: function (g, f) {
            if (!f) return g;
            for (var d = f["static"], b = d.replace(/\/([^\/]*)$/, ""), c = [], a = 0, h = g.length; a < h; a++) {
                var i = g[a];
                if (!/^\/static/.test(i)) {
                    var l = i.match(/^\$([a-z\-\_]+)(\/.*)/),
                        m = !1,
                        n, o = !1;
                    l ? (m = l[1], n = l[2]) : /^\//.exec(i) && (o = !0);
                    m && f[m] ? i = f[m] + n : (m ? i = "/" + m + n : o || (i = "/" + i), i = (m ? b : d) + i)
                }
                c.push(i)
            }
            return c
        },
        sendResponse: function (g, f) {
            g.send({
                result: f
            })
        },
        "@hermes_send_request": function (g, f) {
            var d = g.args;
            this.service.send(d[0], d[1], d[3], d[2], d[4], this.sendResponse.bind(this, f), this.handleErrors.bind(this, f))
        }
    })
})();
(function () {
    new Spotify.App.Responder({
        _ready: !1,
        _modifiers: {
            alt: 1,
            meta: 2,
            ctrl: 8
        },
        _keymap: {
            32: 16,
            37: 32,
            38: 64,
            39: 128,
            40: 256,
            83: 512
        },
        _ignore: {
            input: 1,
            button: 1,
            textarea: 1,
            select: 1
        },
        _bindings: {},
        _empty: function () {},
        init: function (g) {
            this.core = g;
            this._setupBindings();
            window.addEventListener("keydown", this.handleOwn.bind(this, !1));
            window.addEventListener("keyup", this.handleOwn.bind(this, !0))
        },
        _setupBindings: function () {
            var g = this._bindings,
                f = this._modifiers,
                d = this._keymap;
            g[d[32]] = "player_play_toggle";
            g[d[37] | f.ctrl | f.alt] = "player_skip_to_prev";
            g[d[39] | f.ctrl | f.alt] = "player_skip_to_next";
            g[d[38] | f.ctrl | f.alt] = "player_volume_up";
            g[d[40] | f.ctrl | f.alt] = "player_volume_down";
            g[d[83] | f.ctrl | f.alt] = "navigation_show_search";
            this._ready = !0;
            this.unqueue()
        },
        handleOwn: function (g, f) {
            if (this._ignore[f.target.tagName.toLowerCase()]) return this;
            var d = this._keymap[f.which || f.keyCode];
            if (!d) return this;
            var b = this._modifiers;
            f.altKey && (d |= b.alt);
            f.metaKey && (d |= b.meta);
            f.ctrlKey && (d |= b.ctrl);
            d = this._bindings[d];
            if (!d) return this;
            f.preventDefault();
            f.stopPropagation();
            g && this.trigger(d, {
                args: [],
                origin: "https://player.spotify.com"
            }, this._empty, this._empty)
        },
        "@keyboard_get_bindings": function (g, f) {
            return f.send({
                _modifiers: this._modifiers,
                _keymap: this._keymap,
                _ignore: this._ignore,
                _bindings: this._bindings
            })
        },
        "@keyboard_trigger_binding": function (g) {
            this.trigger(g.args[0], {
                args: [],
                origin: g.origin
            }, this._empty, this._empty)
        },
        "@navigation_show_search": function () {
            $("nav-search").onmousedown({
                preventDefault: this._empty
            })
        }
    })
})();
(function () {
    var g = window.navigator;
    new Spotify.App.Responder({
        _ready: !1,
        _hasGeo: !1,
        _current: null,
        _error: null,
        _listeners: [],
        init: function () {
            this.setup()
        },
        setup: function () {
            if ("geolocation" in g) this._hasGeo = !0;
            this._ready = !0;
            this.unqueue()
        },
        notifyListeners: function () {
            for (var f = this._listeners.splice(0, this._listeners.length), d = this._error, b = 0, c = f.length; b < c; b++) {
                var a = f[b];
                d ? a.fail(d.code, d.message) : a.send(this._current)
            }
        },
        positionFailed: function (f) {
            var d;
            switch (f.code) {
                case 1:
                    f = "permission-denied";
                    d = "The user has denied access to their location.";
                    break;
                case 3:
                    f = "timeout";
                    d = "The request has timed out";
                    break;
                default:
                    f = "transient", d = "Cannot fetch the location right now"
            }
            this._error = {
                code: f,
                message: d
            };
            this._current = null;
            this.notifyListeners()
        },
        positionFetched: function (f) {
            f = f.coords;
            this._error = null;
            this._current = this.fuzz({
                latitude: f.latitude,
                longitude: f.longitude,
                accuracy: f.accuracy
            });
            this.notifyListeners()
        },
        fuzz: function (f) {
            return {
                latitude: 0.01 * Math.floor(f.latitude * 100),
                longitude: 0.01 * Math.floor(f.longitude * 100),
                accuracy: f.accuracy
            }
        },
        "@location_query": function (f, d) {
            var b = this._error,
                c = this._current;
            if (b) return d.fail(b.code, b.message);
            else if (c) return d.send(c);
            else this._listeners.push(d), g.geolocation.watchPosition(this.positionFetched.bind(this), this.positionFailed.bind(this))
        }
    })
})();
(function () {
    var g = Spotify.Link,
        f = Spotify.Utils,
        d = Spotify.Utils.isArray,
        b = Spotify.App.SourceURLs,
        c = Spotify.App.RequestBuffer;
    new Spotify.App.Responder({
        _ready: !1,
        _requested: {},
        _adRequestBuffer: new c,
        _albumRequestBuffer: new c,
        _artistRequestBuffer: new c,
        _trackRequestBuffer: new c,
        create: function () {
            this.prepareArtist = this.prepare.bind(this, this.parseArtist);
            this.prepareAlbum = this.prepare.bind(this, this.parseAlbum);
            this.prepareTrack = this.prepare.bind(this, this.parseTrack);
            this.prepareAd = this.prepare.bind(this,
            this.parseAd)
        },
        init: function (a) {
            this.use({
                service: a.metadata,
                adchooser: a.adChooser
            })
        },
        start: function () {
            this._ready = !0;
            this.unqueue()
        },
        handleError: function (a, b) {
            var c, d;
            switch (b.code) {
                case 400:
                case 404:
                    c = "not-found";
                    d = "No metadata found for URI.";
                    break;
                default:
                    c = "transient", d = "Possible issues with the metadata service."
            }
            return a.fail(c, d)
        },
        handleMetadataError: function (a, b, c) {
            var d;
            switch (c.code) {
                case 400:
                case 404:
                    c = "not-found";
                    d = "No metadata found for URI.";
                    break;
                default:
                    c = "transient", d = "Possible issues with the metadata service."
            }
            for (var f = 0, g = a.length; f < g; f++) for (var o = b.takeReplies(a[f]), k = o.length; k--;) o[k].fail(c, d)
        },
        flushRequests: function () {
            this.queryService(this._albumRequestBuffer, this.parseAlbum);
            this.queryService(this._artistRequestBuffer, this.parseArtist);
            this.queryService(this._trackRequestBuffer, this.parseTrack);
            this.queryAdService(this._adRequestBuffer, this.parseAd)
        },
        queryService: function (a, b) {
            var c = a.takeIds();
            c.length && this.service.lookup(c, this.format.bind(this, b, a, c), this.handleMetadataError.bind(this, c, a))
        },
        queryAdService: function (a,
        b) {
            var c = a.takeIds();
            c.length && this.adchooser.lookup(c, this.format.bind(this, b, a, c), this.handleMetadataError.bind(this, c, a))
        },
        format: function (a, b, c, f) {
            d(f) || (f = [f]);
            for (var g = 0, n = c.length; g < n; g++) {
                var o = c[g],
                    k = f[g];
                this.store(o, "raw", k);
                k = k ? a.call(this, o, k) : {
                    error: "not-found",
                    message: "Not found."
                };
                this.store(o, "parsed.metadata", k);
                if (a == this.parseTrack && !k.error) this.trigger("starred_track_decorate", [o, k], function (a, c) {
                    for (var d = b.takeReplies(a), f = d.length; f--;) d[f].send(c)
                }.bind(null, o), Spotify.App.noop);
                else for (var o = b.takeReplies(o), p = o.length; p--;) k.error ? o[p].fail(k) : o[p].send(k)
            }
        },
        request: function (a, b, c) {
            this.service.lookup(a.slice(0), c.bind(this, a, b), this.handleError.bind(this, b))
        },
        requestAds: function (a, b, c) {
            this.adchooser.lookup(a.slice(0), c.bind(this, a, b), b.fail.bind(b, "unknown", "Ad server Error"))
        },
        prepare: function (a, b, c, f, g, n) {
            d(f) || (f = [f]);
            g = c.payload || {};
            g.__count = g.__count || f.length;
            for (var o = b.length; o--;) {
                var k = b[o],
                    p = f[o];
                this.store(k, "raw", p);
                p = g[k] = p ? a.call(this, k, p) : null;
                this.store(k,
                    "parsed.metadata", p);
                g.__count--
            }
            if (!n && !g.__count) {
                delete c.payload;
                delete g.__count;
                if (a != this.parseTrack) return c.send(g);
                this.trigger("starred_tracks_decorate", [g], c.send.bind(c), c.fail.bind(c))
            }
        },
        "@artist_metadata": function (a, b) {
            var c = a.args[0];
            try {
                if (c = g.fromString(c), c.type != "artist") throw Error();
            } catch (d) {
                return b.fail("invalid-uri", "Not a valid artist URI.")
            }
            var f = this.retrieve(c, "parsed.metadata");
            if (f) return f.error ? b.fail(f) : b.send(f);
            this._artistRequestBuffer.push(c, b)
        },
        "@artist_profile": "artist_metadata",
        parseArtist: function (a, c) {
            var d, g, m, n = {
                name: c.name,
                popularity: c.popularity,
                image: null,
                genres: c.genre ? c.genre.slice() : [],
                biography: "",
                portraits: []
            };
            if (c.portrait_group && c.portrait_group.image && c.portrait_group.image[0]) g = f.str2hex(c.portrait_group.image[0].file_id), n.image = b.normal + g, n.images = this.createImageSizes(g);
            if (c.biography) {
                var o = n.portraits;
                for (d = c.biography.length; d--;) {
                    var k = c.biography[d];
                    n.biography = k ? k.text || "" : "";
                    if (k.portrait_group) for (g = 0, m = k.portrait_group.length; g < m; g++) {
                        var p = k.portrait_group[g];
                        if (p && p.image) for (var p = p.image, q = p.length; q--;) {
                            var s = p[q];
                            s.size == "DEFAULT" && o.push(b.normal + f.str2hex(s.file_id))
                        }
                    }
                }
            }
            d = c.activity_period || [];
            o = [];
            for (g = 0, m = d.length; g < m; g++) p = d[g], k = p.start_year || p.decade, p = p.end_year || p.decade + 9, isNaN(p) && (p = (new Date).getFullYear()), o.push({
                start: k,
                end: p
            });
            n.years = o.length ? {
                from: o[0].start,
                to: o[o.length - 1].end
            } : null;
            return n
        },
        "@album_metadata": function (a, b) {
            var c = a.args[0];
            try {
                if (c = g.fromString(c), c.type != "album") throw Error();
            } catch (d) {
                return b.fail("invalid-uri",
                    "Not a valid album URI.")
            }
            var f = this.retrieve(c, "parsed.metadata");
            if (f) return f.error ? b.fail(f) : b.send(f);
            this._albumRequestBuffer.push(c, b)
        },
        "@album_profile": "album_metadata",
        parseAlbum: function (a, c) {
            var d = g.fromString(a),
                l = {
                    name: c.name,
                    popularity: c.popularity,
                    type: (c.type || "").toLowerCase(),
                    date: c.date || {},
                    availability: c.availability,
                    playable: c.playable,
                    label: c.label
                }, m, n, o = c.copyright,
                k = l.copyrights = [];
            if (o) for (m = 0, n = o.length; m < n; m++) {
                var p = o[m];
                k[m] = p.text.replace(/^(\([A-Z]+\))?(.*)$/, function (a,
                b, c) {
                    return b ? a : "(" + p.type + ") " + c
                })
            }
            o = l.artists = [];
            for (m = 0, n = c.artist.length; m < n; m++) o.push({
                uri: g.artistLink(c.artist[m].id).toString(),
                name: c.artist[m].name
            });
            o = l.discs = [];
            for (m = 0, n = c.disc.length; m < n; m++) k = m + 1, d.disc = k, o.push({
                uri: d.toString(),
                album: a,
                number: k
            });
            c.cover_group && c.cover_group.image && c.cover_group.image[0] ? (d = f.str2hex(c.cover_group.image[0].file_id), l.image = b.normal + d, l.images = this.createImageSizes(d)) : l.image = null;
            return l
        },
        "@track_metadata": function (a, b) {
            var c = a.args[0];
            try {
                if (c = g.fromString(c), c.type != "track" && c.type != "ad" && c.type != "local") throw Error();
            } catch (d) {
                return b.fail("invalid-uri", "Not a valid album URI.")
            }
            if (c.type == "local") return b.send({
                name: c.track || "",
                duration: isNaN(c.duration) ? -1 : (c.duration || 0) * 1E3,
                cover: "",
                playable: !1,
                album: {
                    uri: "spotify:empty",
                    artists: [{
                        uri: "spotify:empty",
                        name: c.artist || ""
                    }],
                    name: c.album || ""
                },
                artists: [{
                    uri: "spotify:empty",
                    name: c.artist || ""
                }]
            });
            else {
                var f = this.retrieve(c, "parsed.metadata");
                if (f) return f.error ? b.fail(f) : b.send(f);
                c.type ==
                    "ad" ? this._adRequestBuffer.push(c, b) : this._trackRequestBuffer.push(c, b)
            }
        },
        parseTrack: function (a, c) {
            var d = {
                __pid: c.playableId,
                name: c.name,
                disc: c.disc_number,
                duration: c.duration,
                album: {
                    uri: g.albumLink(c.album.id).toString(),
                    name: c.album.name
                },
                number: c.number,
                popularity: c.popularity,
                availability: c.availability,
                playable: c.playable,
                image: null,
                starred: !1,
                explicit: c.explicit,
                advertisement: !! c.ad
            };
            if (c.album.cover_group && c.album.cover_group.image && c.album.cover_group.image[0]) d._imgfid = f.str2hex(c.album.cover_group.image[0].file_id),
            d.image = b.normal + d._imgfid, d.images = this.createImageSizes(d._imgfid);
            for (var l = d.artists = [], m = 0, n = c.artist.length; m < n; m++) l.push({
                uri: g.artistLink(c.artist[m].id).toString(),
                name: c.artist[m].name
            });
            return d
        },
        "@@track_multi_metadata": function (a, b) {
            for (var c = a.args.length, d = {}, f = function (a, f) {
                d[a] = f.error ? null : f;
                c--;
                c || b.send(d)
            }, g = 0, o = a.args.length; g < o; g++) {
                var k = a.args[g].toString(),
                    p = f.bind(null, k);
                this.trigger("track_metadata", [k], p, p)
            }
        },
        parseAd: function (a, c) {
            for (var d = {
                __pid: c.__pid,
                name: c.name,
                disc: c.disc,
                duration: c.duration,
                number: c.number,
                popularity: c.popularity,
                playable: c.playable,
                image: b.normal + c.image,
                starred: !1,
                explicit: c.explicit,
                advertisement: c.advertisement
            }, f = d.artists = [], g = 0, n = c.artist.length; g < n; g++) f.push({
                uri: c.artist[g].uri,
                name: c.artist[g].name
            });
            return d
        },
        "@album_tracks_snapshot": function (a, b) {
            var c = a.args[0],
                d = this.retrieve(c, "parsed.tracks");
            if (d) return this.prepareSnapshot(a, b, d);
            if (d = this.retrieve(c, "raw")) return d = this.parseAlbumTracks(d), this.store(c, "parsed.tracks",
            d), this.prepareSnapshot(a, b, d);
            this.request([c], b, function (b, d, h) {
                this.prepareAlbum(b, d, h, 0, !0);
                b = this.parseAlbumTracks(this.retrieve(c, "raw"));
                this.store(c, "parsed.tracks", b);
                return this.prepareSnapshot(a, d, b)
            })
        },
        "@album_disc_tracks_snapshot": function (a, b) {
            var c = a.args[0],
                d = this.retrieve(c, "parsed.disc.tracks");
            if (d) return this.prepareSnapshot(a, b, d);
            var f = g.fromString(c),
                n = f.disc;
            delete f.disc;
            if (d = this.retrieve(f, "raw")) return d = this.parseDiscTracks(d, n), this.store(c, "parsed.disc.tracks", d), this.prepareSnapshot(a,
            b, d);
            this.request([f], b, function (b, d, h) {
                this.prepareAlbum(b, d, h, 0, !0);
                b = this.parseDiscTracks(this.retrieve(f, "raw"), n);
                this.store(c, "parsed.disc.tracks", b);
                return this.prepareSnapshot(a, d, b)
            })
        },
        prepareSnapshot: function (a, b, c, d, f) {
            if ((!c || !c.length) && f && f.length) for (var c = [], g = f.length; g--;) c[g] = "";
            a = this.createSnapshot(a.args, c, d, f);
            return b.send(a)
        },
        parseAlbumTracks: function (a) {
            for (var a = a.disc, b = [], c = 0, d = a.length; c < d; c++) for (var f = a[c].track, n = 0, o = f.length; n < o; n++) b.push(g.trackLink(f[n].id).toString());
            return b
        },
        parseDiscTracks: function (a, b) {
            b -= 1;
            for (var c = a.disc, c = b < c.length ? c[b] : [], d = [], f = 0, n = c.track.length; f < n; f++) d.push(g.trackLink(c.track[f].id).toString());
            return d
        },
        prepareGroup: function (a, b, c, d, f) {
            this.prepareArtist(b, c, f, 0, !0);
            (c = this.retrieve(b, "raw")) && (c = c[a]);
            c = this.parseGroup(c, b);
            this.store(b, "parsed." + a, c);
            return c
        },
        parseGroup: function (a) {
            var b = [];
            if (!a) return b;
            for (var c = 0, d = a.length; c < d; c++) {
                for (var f = a[c], n = [], o = 0, k = f.length; o < k; o++) {
                    var p = f[o];
                    p.playable && n.push({
                        uri: g.albumLink(p.id).toString()
                    })
                }
                b.push({
                    albums: n
                })
            }
            return b
        },
        "@artist_albums_snapshot": function (a, b) {
            var c = this,
                d = a.args[0],
                f = this.retrieve(d, "parsed.album_group");
            if (f) return this.prepareSnapshot(a, b, [], null, f);
            if (f = this.retrieve(d, "raw")) return f = this.parseGroup(f.album_group), this.store(d, "parsed.album_group", f), this.prepareSnapshot(a, b, [], null, f);
            this.request([d], b, function (b, d, h) {
                b = this.prepareGroup("album_group", b, d, a, h);
                return c.prepareSnapshot(a, d, [], null, b)
            })
        },
        "@artist_appearances_snapshot": function (a, b) {
            var c = this,
                d = a.args[0],
                f = this.retrieve(d, "parsed.appears_on_group");
            if (f) return this.prepareSnapshot(a, b, [], null, f);
            if (f = this.retrieve(d, "raw")) return f = this.parseGroup(f.appears_on_group), this.store(d, "parsed.appears_on_group", f), this.prepareSnapshot(a, b, [], null, f);
            this.request([d], b, function (b, d, h) {
                b = this.prepareGroup("appears_on_group", b, d, a, h);
                return c.prepareSnapshot(a, d, [], null, b)
            })
        },
        "@artist_singles_snapshot": function (a, b) {
            var c = this,
                d = a.args[0],
                f = this.retrieve(d, "parsed.single_group");
            if (f) return this.prepareSnapshot(a, b, [], null, f);
            if (f = this.retrieve(d, "raw")) return f = this.parseGroup(f.single_group), this.store(d, "parsed.single_group", f), this.prepareSnapshot(a, b, [], null, f);
            this.request([d], b, function (b, d, h) {
                b = this.prepareGroup("single_group", b, d, a, h);
                return c.prepareSnapshot(a, d, [], null, b)
            })
        },
        parseTracks: function (a) {
            var b = [];
            if (!a || !a.length) return b;
            for (var c = 0, d = a.length; c < d; c++) b.push(g.trackLink(a[c].id).toString());
            return d == 1 ? b.slice(0) : b.slice(0, Math.min(10, d % 2 ? d - 1 : d))
        },
        "@artist_top_tracks_snapshot": function (a, b) {
            var c = this,
                d = a.args[0],
                f = this.retrieve(d,
                    "parsed.top_tracks");
            if (f) return this.prepareSnapshot(a, b, f);
            if (f = this.retrieve(d, "raw")) return f = this.parseTracks(f.top_track), this.store(d, "parsed.top_tracks", f), this.prepareSnapshot(a, b, f);
            this.request([d], b, function (b, h, f) {
                b = this.parseTracks(f.shift().top_track);
                this.store(d, "parsed.top_tracks", b);
                return c.prepareSnapshot(a, h, b)
            })
        },
        parseArtists: function (a) {
            var c = [],
                d = [],
                l = {
                    array: c,
                    metadata: d
                };
            if (!a) return l;
            for (var m = 0, n = a.length; m < n; m++) {
                var o = a[m];
                c.push(g.artistLink(o.id).toString());
                var k = {};
                d.push(k);
                if (o.name) k.name = o.name;
                if (o.portrait && o.portrait[0]) {
                    var p = f.str2hex(o.portrait[0].file_id);
                    k.image = b.normal + p;
                    k.images = this.createImageSizes(p)
                }
                if (o.activity_period) {
                    for (var o = o.activity_period, p = [], q = 0, s = o.length; q < s; q++) {
                        var t = o[q],
                            y = t.start_year || t.decade,
                            t = t.end_year || t.decade + 9;
                        isNaN(t) && (t = (new Date).getFullYear());
                        p.push({
                            start: y,
                            end: t
                        })
                    }
                    k.years = p.length ? {
                        from: p[0].start,
                        to: p[p.length - 1].end
                    } : null
                }
            }
            return l
        },
        "@artist_related_artists_snapshot": function (a, b) {
            var c = a.args[0],
                d = this.retrieve(c, "parsed.related");
            if (d) return this.prepareSnapshot(a, b, d.array, null, d.metadata);
            if (d = this.retrieve(c, "raw")) return d = this.parseArtists(d.related), this.store(c, "parsed.related", d), this.prepareSnapshot(a, b, d.array, null, d.metadata);
            this.request([c], b, function (b, d, h) {
                this.prepareArtist(b, d, h, 0, !0);
                b = this.parseArtists(this.retrieve(c, "raw").related);
                this.store(c, "parsed.related", b);
                return this.prepareSnapshot(a, d, b.array, null, b.metadata)
            })
        }
    })
})();
(function () {
    var g = Spotify.Link,
        f = window.localStorage;
    new Spotify.App.Responder({
        _user: null,
        _ready: !1,
        _listeners: [],
        _empty: function () {},
        _incomingReferrer: null,
        _referrer: null,
        _identifierMap: {
            preview: {}
        },
        init: function (d, b) {
            this.publisher = b.publisher;
            this.contextManager = d.contextManager;
            var c = typeof b.shouldGetSavedState !== "undefined" ? b.shouldGetSavedState : !0,
                a = this.contextPlayer = d.contextPlayer,
                h = this.previewPlayer = d.previewPlayer,
                f = this.notifyListeners.bind(this, "main"),
                g = this.notifyListeners.bind(this,
                    "preview");
            a.addEvents({
                beforePlay: f,
                play: this.notifyListeners.bind(this, "main", "play"),
                pause: f,
                ended: f,
                reset: f
            });
            h.addEvents({
                beforePlay: g,
                play: this.notifyListeners.bind(this, "preview", "play"),
                pause: g,
                ended: g,
                reset: g
            });
            this.trigger("session_query", [], function (a) {
                this._user = "plcstate:" + Spotify.Utils.Base64.encode(a._username);
                this._uname = a._username;
                c && this._unfreeze();
                this._ready = !0;
                this.unqueue()
            }.bind(this));
            window.addEventListener("beforeunload", this._freeze.bind(this))
        },
        _unfreeze: function () {
            var d = f[this._user];
            delete f[this._user];
            if (!d) return this;
            try {
                d = JSON.parse(d)
            } catch (b) {
                return this
            }
            var c = this.contextPlayer;
            c.setShuffle(d.shuffle);
            c.setRepeat(d.repeat);
            c.setVolume(d.volume);
            c = null;
            if (d.__group) {
                var a = d.__group;
                this.contextManager.getGroup(a.id, !0);
                a.array.unshift(a.id);
                this.trigger("context_group_append", a.array, function () {
                    this.resolveContextGroup({
                        args: ["main", a.id, a.index, d.track.number - 1, d.position]
                    }, {
                        send: this._empty,
                        fail: this._empty
                    }, !0, d.__owner)
                }.bind(this), this._empty)
            } else {
                try {
                    c = g.fromString(d.context.uri)
                } catch (h) {}
                if (c) {
                    if (c.type == "temp-playlist" || c.type == "search") d.__owner = d.context.uri = d.track.album.uri, d.index = d.track.number - 1;
                    this.resolveContext({
                        args: ["main", d.context.uri, d.index, d.position]
                    }, {
                        send: this._empty,
                        fail: this._empty
                    }, !0, d.__owner)
                } else d.track.uri && this.resolveTrack(d.track.uri, {
                    args: ["main", d.track.uri, d.position]
                }, {
                    send: this._empty,
                    fail: this._empty
                }, !0, d.__owner)
            }
        },
        _freeze: function () {
            if (this._user) {
                var d = this.contextPlayer.getState(!0);
                f[this._user] = JSON.stringify(d)
            }
        },
        notifyListeners: function (d, b) {
            var c = this._listeners;
            if (!c.length) return null;
            for (var a = [], c = c.splice(0, c.length), h = {
                type: "change",
                data: (d == "preview" ? this.previewPlayer : this.contextPlayer).getState()
            }, f = 0, g = c.length; f < g; f++) {
                var m = c[f];
                d != "*" && m.player != d ? a.push(m) : m.reply.send(h)
            }
            this._listeners.splice.apply(this._listeners, [0, 0].concat(a));
            if (b == "play") {
                if (this._incomingReferrer == this._referrer) return this;
                c = this._referrer = this._incomingReferrer;
                this._incomingReferrer = null;
                this.publisher.notify("APPLICATION_PLAYBACK_STARTED", {
                    origin: c
                })
            }
        },
        "@player_map_track_identifiers": function (d, b) {
            var c = d.args[1];
            if (d.args[0] !== "preview") return b.send(!0);
            var a = this._identifierMap.preview;
            if (typeof c != "object") return b.fail("invalid-request", "Identifiers parameter should be an object.");
            this.trigger("application_get", [d.origin, d.source], function (d) {
                var d = a[d.uri] || (a[d.uri] = {
                    track: {},
                    alternate: {}
                }),
                    f;
                for (f in c) {
                    if (!c.hasOwnProperty(f)) return;
                    var g = c[f];
                    d.alternate[f] = g;
                    d.track[g] = f
                }
                b.send(!0)
            })
        },
        "@player_event_wait": function (d, b) {
            this._listeners.push({
                player: d.args[0],
                reply: b.persist()
            })
        },
        "@event": "player_event_wait",
        "@player_query": function (d, b) {
            var c = d.args[0] == "preview" ? this.previewPlayer : this.contextPlayer;
            setTimeout(function () {
                b.send(c.getState())
            }.bind(this), 500)
        },
        "@player_set_shuffle": function (d, b) {
            var c = d.args[0];
            (c == "preview" ? this.previewPlayer : this.contextPlayer).setShuffle( !! d.args[1]);
            b.send(!0);
            this.notifyListeners(c)
        },
        "@player_set_repeat": function (d, b) {
            var c = d.args[0];
            (c == "preview" ? this.previewPlayer : this.contextPlayer).setRepeat( !! d.args[1]);
            b.send(!0);
            this.notifyListeners(c)
        },
        "@player_set_volume": function (d, b) {
            var c = d.args[1];
            if (typeof c != "number") return b.fail("invalid-request", "Volume value must be a number.");
            if (this.contextPlayer.getState().volume == c) return b.send(c);
            this.contextPlayer.setVolume(c) ? b.send(c) : b.fail("forbidden", "Cannot seek");
            this.notifyListeners("*")
        },
        "@player_volume_up": function () {
            var d = this.contextPlayer,
                b = d.getState().volume * 100;
            if (b == 100) return this;
            d.setVolume((Math.floor(b / 10) * 10 + 10) / 100);
            this.notifyListeners("*")
        },
        "@player_volume_down": function () {
            var d = this.contextPlayer,
                b = d.getState().volume * 100;
            if (b == 0) return this;
            d.setVolume((Math.floor(b / 10) * 10 - 10) / 100);
            this.notifyListeners("*")
        },
        "@player_play": function (d, b) {
            (d.args[0] == "main" ? this.contextPlayer : this.previewPlayer).resume();
            b.send(!0)
        },
        "@player_pause": function (d, b) {
            (d.args[0] == "preview" ? this.previewPlayer : this.contextPlayer).pause();
            b.send(!0)
        },
        "@player_stop": function (d, b) {
            (d.args[0] == "preview" ? this.previewPlayer : this.contextPlayer).stop();
            b.send(!0)
        },
        "@player_seek": function (d, b) {
            var c = d.args[0] ==
                "preview" ? this.previewPlayer : this.contextPlayer,
                a = d.args[1];
            if (typeof a != "number") return b.fail("invalid-request", "Seek value must be a number.");
            c.seek(a) ? b.send(a) : b.fail("forbidden", "Cannot seek")
        },
        setReferrer: function (d) {
            return function (b) {
                this._incomingReferrer = b.origin;
                return d(b.uri)
            }.bind(this)
        },
        resolveTrack: function (d, b, c, a, h, f) {
            var g = this.contextManager,
                m = g.get(d);
            m || (m = g.create(d), m.append(d.toURI()));
            m.setOwner(h);
            m.setAnonymous(!0);
            var n = this._identifierMap.preview[h];
            if (b.args[0] != "main") m.mapToId = function (a, b) {
                return !n ? b || a : n.alternate[a] || b || a
            }, m.mapToTrack = function (a, b) {
                return !n ? b || a : n.track[a] || b || a
            };
            var o = b.args[0] == "preview" ? this.previewPlayer : this.contextPlayer;
            o.play(m, {
                id: b.args[0],
                track: -1,
                ms: parseInt(b.args[2], 10) || 0,
                duration: parseInt(b.args[3], 10) || -1,
                reason: f,
                pause: a
            }, function (a, b) {
                a ? (o.player.trigger("INVALID_TRACK_URI", {
                    domain: 12,
                    code: 0,
                    description: "Invalid track uri",
                    data: b
                }), c.fail("unplayable", "The track cannot be played.")) : c.send(!0)
            }.bind(this))
        },
        "@player_play_track": function (d,
        b) {
            try {
                var c = g.fromString(d.args[1]);
                if (c.type !== "track") throw Error();
            } catch (a) {
                return b.fail("invalid-request", "Not a track URI.")
            }
            this.trigger("application_get", [d.origin, d.source], this.setReferrer(this.resolveTrack.bind(this, c, d, b, !1)))
        },
        getAlbumContext: function (d, b, c) {
            var a = this.contextManager.get(d.toString(), !0);
            if (a.getLength()) return b(a);
            var h = this.retrieve(d, "parsed.tracks");
            if (h) return a.concat(h), b(a);
            this.trigger("album_tracks_snapshot", [d.toString()], function (c) {
                a.concat(c.array);
                b(a)
            }.bind(this),

            function () {
                c("not-found", "Album not found")
            })
        },
        getPlaylistContext: function (d, b, c, a) {
            var b = b || {
                track: 0
            }, h = this.contextManager,
                f = h.get(d);
            f ? f.resolve(b, function () {
                c(f)
            }, this._empty) : this.trigger("playlist_tracks_snapshot", [d.toString(), 0, -1], function () {
                var a = h.get(d);
                a.resolve(b, function () {
                    c(a)
                }, this._empty)
            }.bind(this), function () {
                a("not-found", "Playlist not found")
            })
        },
        getSearchContext: function (d, b, c) {
            var a = this.contextManager,
                h = a.get(d);
            if (h) return b(h);
            this.trigger("search_tracks_snapshot", [d.query,
            0, -1], function () {
                var c = a.get(d);
                b(c)
            }.bind(this), function () {
                c("not-found", "Search had no results.")
            })
        },
        getUserToplistContext: function (d, b, c) {
            var a = this.contextManager.get(d, !0);
            if (a.getLength()) return b(a);
            if (d.username == "@") d.username = this._uname;
            this.trigger("toplist_user_tracks_snapshot", [g.profileLink(d.username).toURI(), 0, -1], function (c) {
                a.concat(c.array);
                b(a)
            }.bind(this), function () {
                c("not-found", "No toptracks for user.")
            })
        },
        getArtistToplistContext: function (d, b, c) {
            var a = this.contextManager.get(d, !0);
            if (a.getLength()) return b(a);
            this.trigger("artist_top_tracks_snapshot", [g.artistLink(d.id), 0, -1], function (c) {
                a.concat(c.array);
                b(a)
            }.bind(this), function () {
                c("not-found", "No toptracks for artist.")
            })
        },
        "@@get_contexts": function (d, b) {
            var c = d.args;
            if (!c.length) return b.send({});
            for (var a = {
                __wait: c.length
            }, h = function (c, d, h) {
                h || (a[c] = d);
                a.__wait--;
                if (a.__wait) return this;
                delete a.__wait;
                b.send(a)
            }, f = 0, l = c.length; f < l; f++) {
                var m = c[f],
                    n = h.bind(null, m);
                try {
                    var o = g.fromString(m)
                } catch (k) {
                    n(!0, !0);
                    continue
                }
                if (m = this.contextManager.get(o.toString())) n(m);
                else switch (o.type) {
                    case "album":
                        this.getAlbumContext(o, n, n);
                        break;
                    case "starred":
                    case "playlist":
                        this.getPlaylistContext(o, null, n, n);
                        break;
                    case "search":
                        this.getSearchContext(o, n, n);
                        break;
                    case "artist-toplist":
                        this.getArtistToplistContext(o, n, n);
                        break;
                    case "user-top-tracks":
                    case "user-toplist":
                        this.getUserToplistContext(o, n, n);
                        break;
                    default:
                        n(!0, !0)
                }
            }
        },
        playContext: function (d, b, c, a, h) {
            if (!h.getLength(!0)) return c.fail("unplayable", "Context has no tracks.");
            var f = d.id == "main",
                g = this._identifierMap.preview[b];
            h.setOwner(b);
            if (!f) h.mapToId = function (a, b) {
                return !g ? b || a : g.alternate[a] || b || a
            }, h.mapToTrack = function (a, b) {
                return !g ? b || a : g.track[a] || b || a
            };
            d.pause = a;
            var m = d.id == "preview" ? this.previewPlayer : this.contextPlayer;
            m.play(h, d, function (a, b) {
                a ? (m.player.trigger("INVALID_TRACK_URI", {
                    domain: 12,
                    code: 0,
                    description: "Invalid track uri",
                    data: b
                }), c.fail("unplayable", "The track cannot be played.")) : c.send(!0)
            }.bind(this))
        },
        resolveContext: function (d, b, c, a, h) {
            var f = d.args[1],
                d = {
                    id: d.args[0],
                    context: null,
                    track: d.args[2],
                    ms: parseInt(d.args[3], 10) || 0,
                    duration: parseInt(d.args[4], 10) || -1,
                    reason: h
                };
            try {
                var l = g.fromString(f)
            } catch (m) {
                return b.fail("invalid-request", "Not a context URI.")
            }
            c = this.playContext.bind(this, d, a, b, c);
            a = b.fail.bind(b);
            if (f = this.contextManager.get(l.toString())) return c(f);
            switch (l.type) {
                case "album":
                    return this.getAlbumContext(l, c, a);
                case "starred":
                case "playlist":
                    return this.getPlaylistContext(l, d, c, a);
                case "search":
                    return this.getSearchContext(l,
                    c, a);
                case "artist-toplist":
                    return this.getArtistToplistContext(l, c, a);
                case "user-toplist":
                case "user-top-tracks":
                    return this.getUserToplistContext(l, c, a);
                default:
                    return b.fail("invalid-request", "Not a context.")
            }
        },
        "@player_play_context": function (d, b) {
            this.trigger("application_get", [d.origin, d.source], this.setReferrer(this.resolveContext.bind(this, d, b, !1)))
        },
        resolveContextGroup: function (d, b, c, a) {
            var h = this.contextManager,
                f = d.args[1],
                d = {
                    id: d.args[0],
                    context: d.args[2],
                    track: d.args[3],
                    ms: parseInt(d.args[4],
                    10) || 0
                };
            try {
                var l = g.fromString(f)
            } catch (m) {
                return b.fail("invalid-request", "Not a context URI.")
            }
            c = this.playContext.bind(this, d, a, b, c);
            b.fail.bind(b);
            h = h.getGroup(l.toString());
            if (!h) return b.fail("invalid-request", "Not a context.");
            c(h)
        },
        "@player_play_context_group": function (d, b) {
            this.trigger("application_get", [d.origin, d.source], this.setReferrer(this.resolveContextGroup.bind(this, d, b, !1)))
        },
        "@@player_play_toggle": function (d, b) {
            this.contextPlayer.togglePlay();
            return b.send(!0)
        },
        "@player_skip_to_next": function (d,
        b) {
            (d.args[0] == "preview" ? this.previewPlayer : this.contextPlayer).next(null, function (c) {
                c ? b.fail("forbidden", "Action not allowed") : b.send(!0)
            })
        },
        "@player_skip_to_prev": function (d, b) {
            (d.args[0] == "preview" ? this.previewPlayer : this.contextPlayer).previous(null, function (c) {
                c ? b.fail("forbidden", "Action not allowed") : b.send(!0)
            })
        },
        "@context_group_create": function (d, b) {
            var c = d.args[0];
            this.trigger("application_get_uri", [d.origin, d.source], function (a) {
                a = g.fromString(a).id;
                a = g.contextGroupLink(a, c).toString();
                this.contextManager.getGroup(a, !0);
                b.send({
                    uri: a
                })
            }.bind(this))
        },
        "@context_group_snapshot": function (d, b) {
            var c = d.args,
                a = this.contextManager.getGroup(c[0]);
            if (!a) return b.fail("not-found", "Context group does not exist.");
            for (var c = this.createDimensions(c[1], c[2]), h = a.slice(c.start, c.start + c.length), f = h.length; f--;) h[f] = h[f].getId();
            a = {
                range: {
                    offset: c.start,
                    length: h.length
                },
                length: a.unwrap().getContextsLength(),
                array: h
            };
            return b.send(a)
        },
        "@context_group_append": function (d, b) {
            var c = this.contextManager.getGroup(d.args[0]);
            if (!c) return b.fail("not-found", "Context group does not exist.");
            var a = d.args.slice(1);
            this.trigger("get_contexts", a, function (d) {
                for (var f = [], g = 0, m = a.length; g < m; g++) {
                    var n = d[a[g]];
                    n && f.push(n)
                }
                c.concat(f);
                b.send(c.unwrap().getContextsLength() - f.length)
            }, function () {
                b.fail("transient", "Cannot perform operation.")
            })
        },
        "@context_group_insert": function (d, b) {
            var c = d.args,
                a = this.contextManager.getGroup(c[0]);
            if (!a) return b.fail("not-found", "Context group does not exist.");
            var h = d.args[1],
                f = c[3];
            this.trigger("get_contexts", [f, c[1]], function (c) {
                f = c[f];
                h = c[f];
                if (!f || !h) return b.fail("forbidden", "Cannot perform operation.");
                if (a.insert(h, f, h)) return b.send(!0)
            }, function () {
                b.fail("transient", "Cannot perform operation.")
            })
        },
        "@context_group_remove": function (d, b) {
            var c = d.args[1],
                a = d.args[2],
                h = this.contextManager.getGroup(d.args[0]);
            if (!h) return b.fail("not-found", "Context group does not exist.");
            this.trigger("get_contexts", [a], function (d) {
                a = d[a];
                if (!a) return b.fail("not-found", "No such context.");
                if (h.remove(c, a)) return b.send(!0)
            },

            function () {
                b.fail("transient", "Cannot perform operation.")
            })
        },
        "@context_group_trim": function () {},
        "@context_group_clear": function (d, b) {
            var c = this.contextManager.getGroup(d.args[0]);
            if (c) return c.clear(), b.send(!0);
            b.fail("not-found", "Context group does not exist.")
        },
        "@@play_context": function (d, b) {
            this.resolveContext(d, b, !1, d.origin, d.args[4])
        },
        "@@play_track": function (d, b) {
            var c = d.args[2];
            try {
                var a = g.fromString(d.args[1]);
                if (a.type !== "track") throw Error();
            } catch (h) {
                return b.fail("invalid-request", "Not a track URI.")
            }
            this.resolveTrack(a,
            d, b, !1, d.origin, c)
        },
        end: !0
    })
})();
(function () {
    var g = Spotify.Utils,
        f = Spotify.Link,
        d = Spotify.App.SourceURLs;
    new Spotify.App.Responder({
        _ready: !1,
        _user: null,
        _starredFailed: !1,
        _starredTries: 1,
        _starredContext: null,
        _starredMap: {},
        _rootFailed: !1,
        _rootTries: 1,
        _lists: [],
        _subscribed: {},
        _requestBuffer: new Spotify.App.RequestBuffer,
        _requestedTracks: {},
        _requestedMeta: {},
        _requestedPublished: {},
        _listeners: {},
        init: function (b) {
            this.contextManager = b.contextManager;
            this.use({
                service: b.playlist,
                popcount: b.popcount
            })
        },
        start: function () {
            this.trigger("session_query", [], function (b) {
                var a;
                a = this._user = b._username, b = a;
                this._userURI = f.profileLink(b).toURI();
                this._userStarred = f.starredLink(b).toURI();
                this.fetchStarred();
                this.fetchRoot()
            }.bind(this))
        },
        prepareMap: function () {
            for (var b = this._lists, c = this._subscribed, a = b.length; a--;) {
                var d = b[a];
                d && d.type != "empty" && (c[d] = !0)
            }
            this._ready = !0;
            this.unqueue()
        },
        parseRoot: function (b) {
            this._rootFailed = !1;
            if (b.length == 0) return this.prepareMap();
            var c = b.contents.length;
            this._lists = this._lists.concat(b.contents);
            return c == 200 ? this.fetchRoot() : this.prepareMap()
        },
        fetchRoot: function () {
            this.service.rootlist({
                username: this._user,
                offset: this._lists.length,
                total: 200
            }, this.parseRoot.bind(this), function (b) {
                b.code == 404 ? (this._rootFailed = !1, this.prepareMap()) : this._rootFailed = !0;
                this._ready = !0;
                this.unqueue()
            }.bind(this))
        },
        parseStarred: function (b) {
            this._starredFailed = !1;
            for (var c = this._starredMap, a = [], d = b.contents, g = 0, l = d.length; g < l; g++) {
                var m = d[g],
                    m = m.type == "empty" ? "spotify:empty" : m.toURI();
                c[m] = !0;
                a.push(m)
            }
            c = this.contextManager.get(f.starredLink(this._user));
            c.splice(c.getLength(), a);
            if (c.getLength() != b.length) return this.fetchStarred()
        },
        fetchStarred: function () {
            this.service.starredPlaylist({
                username: this._user,
                offset: this.contextManager.get(f.starredLink(this._user), !0).getLength(),
                total: 200
            }, this.parseStarred.bind(this), function () {
                this._starredFailed = !0
            }.bind(this))
        },
        notifyListeners: function (b, c, a, d) {
            var g;
            b != this._user ? (typeof b == "string" && (b = f.fromString(b)), g = b.type == "starred" && b.username == this._user ? [b.toString(), "spotify:starred", "spotify:user:@:starred"] : [b.toString()]) : g = [b];
            if (c == "remove" && "index" in a) for (var l = a.indices = [], b = 0, m = a.length; b < m; b++) l.push(a.index + b);
            for (l = g.length; l--;) {
                b = g[l];
                b = this._listeners[b];
                m = {
                    type: c,
                    data: a,
                    uris: a.array || [],
                    receiver: d || null
                };
                if (typeof a.index === "number") m.index = a.index;
                if (a.indices) m.indices = a.indices;
                if (b && b.length != 0) for (var b = b.splice(0, b.length), n = 0, o = b.length; n < o; n++) b[n].send(m)
            }
            return this
        },
        "@library_event_wait": function (b, c) {
            (this._listeners[this._user] || (this._listeners[this._user] = [])).push(c.persist())
        },
        "@starred_event_wait": function (b, c) {
            var a = b.args[0];
            if (a == null || a == "spotify:starred" || a == "spotify:user:@:starred") a = f.starredLink(this._user);
            else try {
                if (a = f.fromString(a), a.type != "starred") throw Error();
            } catch (d) {
                return c.fail("invalid-uri", "Not a valid starred playlist.")
            }(this._listeners[a] || (this._listeners[a] = [])).push(c.persist())
        },
        "@playlist_event_wait": function (b, c) {
            var a = b.args[0];
            if (a == null || a == "spotify:starred" || a == "spotify:user:@:starred") a = f.starredLink(this._user);
            else try {
                a = f.fromString(a)
            } catch (d) {
                return c.fail("invalid-uri",
                    "Not a valid playlist.")
            }(this._listeners[a] || (this._listeners[a] = [])).push(c.persist())
        },
        resolveURI: function (b, c) {
            var b = encodeURIComponent(b),
                a = c.match(/^https?:\/\/([A-Za-z0-9_-]+).*/),
                a = a ? a[1] : "";
            return f.temporaryPlaylistLink(a, b).toString()
        },
        flushRequests: function () {
            var b = this._requestBuffer.takeIds();
            if (b.length) for (var c = 0, a = b.length; c < a; c++) {
                var d = b[c];
                this.service.metadata(d, this.format.bind(this, d), this.handleMetadataError.bind(this, d))
            }
        },
        format: function (b, c) {
            var a = this._requestBuffer,
                b = f.fromString(b);
            if (!c.uri) c.uri = b.toURI();
            var d = this.parse(b, c);
            this.attachPermissions(b, d);
            this.store(b, "parsed.metadata", d);
            d.subscribed = b in this._subscribed;
            for (var a = a.takeReplies(b), g = a.length; g--;) {
                var l = a[g];
                l.buildMosaic ? this.trigger("playlist_tracks_snapshot", [b.toString(), 0, 200], this.buildMosaic.bind(this, b, l), l.send.bind(l, {
                    image: null
                })) : l.send(d)
            }
        },
        handleMetadataError: function (b, c) {
            var a = this._requestBuffer,
                d, f;
            switch (c.code) {
                case 404:
                    d = "not-found";
                    f = "No metadata found for playlist.";
                    break;
                default:
                    d = "transient", f = "Possible issues with the playlist service."
            }
            for (var a = a.takeReplies(b), g = a.length; g--;) a[g].fail(d, f)
        },
        request: function (b, c, a) {
            var d = this._requestedMeta[b] || (this._requestedMeta[b] = []);
            if (d.length) return d.push({
                reply: c,
                payload: a
            }), this;
            d.push({
                reply: c,
                payload: a
            });
            this.service.metadata(b, this.prepare.bind(this, b, d), function (a) {
                var c;
                switch (a.code) {
                    case 404:
                        a = "not-found";
                        c = "No metadata found for playlist.";
                        break;
                    default:
                        a = "transient", c = "Possible issues with the playlist service."
                }
                for (var f = d.splice(0, d.length), g = f.length; g--;) {
                    var o = f[g];
                    o.payload[b] = {
                        error: a,
                        message: c
                    };
                    o.payload._count--;
                    if (!o.payload._count) {
                        var k = o.payload;
                        this._userStarred in k && (k[null] = k["spotify:starred"] = k["spotify:user:@:starred"] = k[this._userStarred]);
                        o.reply.send(o.payload)
                    }
                }
            }.bind(this))
        },
        prepare: function (b, c, a) {
            b = f.fromString(b);
            if (!a.uri) a.uri = b.toURI();
            a = this.parse(b, a);
            this.attachPermissions(b, a);
            this.store(b, "parsed.metadata", a);
            a.subscribed = b in this._subscribed;
            for (var c = c.splice(0, c.length), d = c.length; d--;) {
                var g = c[d],
                    l = g.reply,
                    g = g.payload;
                l.buildMosaic ? this.trigger("playlist_tracks_snapshot", [b.toString(), 0, 200], this.buildMosaic.bind(this, b, l, g), this.buildMosaicError.bind(this, b, l, g)) : (g[b] = a, g._count--)
            }
            g._count || (this._userStarred in g && (g[null] = g["spotify:starred"] = g["spotify:user:@:starred"] = g[this._userStarred]), l.send(g))
        },
        parse: function (b, c) {
            var a = {
                name: b.type == "starred" ? "Starred" : c.name,
                owner: {
                    uri: f.profileLink(c.owner).toString()
                },
                collaborative: !! c.collaborative,
                description: c.description || ""
            };
            if (c.picture) {
                var h = c.picture;
                try {
                    h = decodeURIComponent(h)
                } catch (i) {}
                h = g.str2hex(h);
                a.image = d.normal + h;
                a.images = this.createImageSizes(h)
            }
            return a
        },
        attachPermissions: function (b, c) {
            typeof b == "string" && (b = f.fromString(b));
            var a = {
                "delete": !1,
                editDescription: !1,
                insertTracks: !1,
                removeTracks: !1,
                rename: !1
            };
            if (c.owner && c.owner.uri == this._userURI) a["delete"] = !0, a.editDescription = !0, a.insertTracks = !0, a.removeTracks = !0, a.rename = !0;
            if (c.collaborative) a.insertTracks = !0, a.removeTracks = !0;
            switch (b.type) {
                case "user-toplist":
                case "user-top-tracks":
                case "starred":
                    a["delete"] = !1, a.editDescription = !1, a.rename = !1
            }
            c.allows = a;
            return this
        },
        "@playlist_metadata": function (b, c) {
            var a = b.args[0];
            if (a == null || a == "spotify:starred" || a == "spotify:user:@:starred") a = f.starredLink(this._user);
            else try {
                a = f.fromString(a)
            } catch (d) {
                return c.fail("invalid-uri", "Not a valid playlist URI")
            }
            var g = this._requestBuffer,
                l;
            switch (a.type) {
                case "temp-playlist":
                    return (l = this.retrieve(a, "parsed.metadata")) || (l = {
                        error: "not-found",
                        message: "Temporary playlist does not exist"
                    }), c.send(l);
                case "user-toplist":
                case "user-top-tracks":
                    if (l = this.retrieve(a, "parsed.metadata")) return l.subscribed = a in this._subscribed, c.send(l);
                    else g.push(a.toURI(), c), this.format(a.toURI(), {
                        name: "Top tracks",
                        owner: a.username,
                        collaborative: !1,
                        description: ""
                    });
                    break;
                case "starred":
                case "playlist":
                    if (l = this.retrieve(a, "parsed.metadata")) return l.subscribed = a in this._subscribed, c.send(l);
                    else g.push(a, c);
                    break;
                default:
                    return c.fail("not-implemented", "This playlist type is not supported.")
            }
        },
        buildMosaicError: function (b, c, a) {
            a[b] = {
                image: null
            };
            a._count--;
            if (!a._count) return this._userStarred in a && (a[null] = a["spotify:starred"] = a["spotify:user:@:starred"] = a[this._userStarred]), c.send(a)
        },
        buildMosaic: function (b, c, a) {
            var h = a.array;
            if (!h.length) return c.send({
                image: null
            });
            this.trigger("track_multi_metadata", h, function (a) {
                for (var f = {}, g = [], n = 0, o = h.length; n < o; n++) {
                    var k = a[h[n]];
                    k && k._imgfid && !f[k._imgfid] && (f[k._imgfid] = 1, g.push(k._imgfid))
                }
                a = "";
                a = g.length < 4 ? g[0] : g.slice(0, 4).join("");
                g = this.retrieve(b, "parsed.metadata");
                g.image = d.normal + a;
                g.images = this.createImageSizes(a, !0);
                c.send({
                    image: g.image,
                    images: g.images
                })
            }.bind(this), c.send.bind(c, {
                image: null
            }))
        },
        "@playlist_profile": function (b, c) {
            c.buildMosaic = !0;
            var a = b.args[0];
            if (a == null || a == "spotify:starred" || a == "spotify:user:@:starred") a = f.starredLink(this._user);
            else try {
                a = f.fromString(a)
            } catch (d) {
                return c.fail("invalid-uri", "Not a valid playlist URI.")
            }
            var g = this._requestBuffer,
                l;
            switch (a.type) {
                case "temp-playlist":
                    if (l = this.retrieve(a, "parsed.metadata")) if (l.image) return c.send({
                        image: l.image,
                        images: l.images
                    });
                    else this.trigger("playlist_tracks_snapshot", [a.toString(), 0, 200], this.buildMosaic.bind(this, a, c), c.send.bind(c, {
                        image: null
                    }));
                    else return c.fail("not-found", "Temporary playlist does not exist.");
                    break;
                case "user-toplist":
                case "user-top-tracks":
                    if (l = this.retrieve(a, "parsed.metadata")) if (l.image) return c.send({
                        image: l.image,
                        images: l.images
                    });
                    else this.trigger("playlist_tracks_snapshot", [a.toString(), 0, 200], this.buildMosaic.bind(this, a, c), c.send.bind(c, {
                        image: null
                    }));
                    else this.trigger("playlist_tracks_snapshot", [a.toString(), 0, 200], this.buildMosaic.bind(this,
                    a, c), c.send.bind(c, {
                        image: null
                    }));
                    break;
                case "starred":
                case "playlist":
                    if (l = this.retrieve(a, "parsed.metadata")) if (l.image) return c.send({
                        image: l.image,
                        images: l.images
                    });
                    else this.trigger("playlist_tracks_snapshot", [a.toString(), 0, 200], this.buildMosaic.bind(this, a, c), c.send.bind(c, {
                        image: null
                    }));
                    else g.push(a, c);
                    break;
                default:
                    return c.fail("not-implemented", "This playlist type is not supported")
            }
        },
        preparePopularity: function (b, c, a) {
            a = Math.round(Math.min(Math.log((a[0].count || 0) + 1) / Math.LN10 * 25, 100));
            this.store(b, "playlist.popularity", a);
            c.send({
                popularity: a
            })
        },
        "@playlist_popularity": function (b, c) {
            var a = b.args[0],
                d, g;
            try {
                d = f.fromString(a), g = d.type
            } catch (l) {}
            if (!d || g != "starred" && g != "playlist" && g != "user-toplist" && g != "user-top-tracks") return c.send({
                popularity: 0
            }), null;
            d = this.retrieve(a, "playlist.popularity");
            if (d != null) return c.send({
                popularity: d
            });
            this.popcount.get(a, 1, !1, 0, this.preparePopularity.bind(this, a, c), this.handleError.bind(this, c))
        },
        "@playlist_restricted": function (b, c) {
            for (var a = b.args.slice(0),
            d = a.length, g = {}; d--;) {
                var l = a[d];
                try {
                    var m = f.fromString(m),
                        n = m.type;
                    if (n != "starred" || n != "playlist" || n != "user-toplist" || n != "user-top-tracks") throw Error();
                } catch (o) {
                    g[l] = {
                        error: "invalid-uri",
                        message: "Not a valid playlist URI."
                    };
                    continue
                }
                g[l] = {
                    ownedByCurrentUser: !! (m.username == "@" || m.username == this._user)
                }
            }
            return c.send(g)
        },
        "@playlist_create": function (b, c) {
            var a = this._lists;
            this.service.createPlaylist(b.args[0] || "New playlist", function (b) {
                a.unshift(f.fromString(b));
                c.send({
                    uri: b
                });
                this.notifyListeners(this._user,
                    "insert", {
                    index: 0,
                    length: 1,
                    array: [b]
                }, "playlists")
            }.bind(this), this.handleError.bind(this, c))
        },
        "@playlist_create_temporary": function (b, c) {
            var a = this.resolveURI(b.args[0], b.origin);
            this.contextManager.get(a, !0);
            var d = {
                uri: a,
                name: b.args[0],
                owner: "",
                collaborative: !1,
                description: "",
                image: null,
                subscribed: !1
            };
            this.attachPermissions(a, d);
            this.store(a, "parsed.metadata", d);
            return c.send(d)
        },
        "@playlist_remove_temporary": function (b, c) {
            var a = this.resolveURI(b.args[0], b.origin);
            this.contextManager.remove(a);
            this.store(a,
                "parsed.metadata", null);
            return c.send(!0)
        },
        handleError: function (b, c) {
            var a, d;
            switch (c.code) {
                case 404:
                    a = "not-found";
                    d = "No playlist found for URI.";
                    break;
                case 401:
                    a = "forbidden";
                    d = "Not allowed.";
                    break;
                default:
                    a = "transient", d = "Possible issues with the playlist service."
            }
            return b.fail(a, d)
        },
        list: function (b, c, a, d, f) {
            for (var g = this._requestedTracks, g = g[b] || (g[b] = []), m = {
                reply: f,
                offset: c,
                length: d
            }, n, o, k = g.length; k--;) if (n = g[k], !(n.start > c && n.end < a)) {
                o = n.replies;
                o.push(m);
                if (!n.done) return this;
                n.done = !1;
                break
            }
            o || (o = [m], n = {
                done: !1,
                start: c,
                end: c + 199,
                replies: o
            }, g.push(n));
            n.done || this.service.list({
                uri: b,
                offset: c,
                total: 200
            }, this.prepareTracks.bind(this, b, c, d, n), this.handleError.bind(this, f))
        },
        prepareTracks: function (b, c, a, d, f) {
            d.done = !0;
            for (var a = d.replies.splice(0, d.replies.length), d = [], g = 0, m = f.contents.length; g < m; g++) {
                var n = f.contents[g];
                n.type == "empty" ? d.push("spotify:empty") : d.push(n.toString())
            }
            b = this.contextManager.get(b, !0);
            b.splice(c, d);
            b.setFullLength(f.length);
            b.setLoader(this.fillContext.bind(this));
            c = 0;
            for (d = a.length; c < d; c++) g = a[c], m = {
                range: {
                    offset: g.offset,
                    length: g.length
                },
                length: f.length,
                array: b.slice(g.offset, g.offset + g.length)
            }, g.reply.send(m)
        },
        fillContext: function (b, c, a) {
            var a = a || function () {}, d = this,
                f = b.getLength(),
                g = b.getFullLength();
            if (f >= g) return a();
            this.trigger("playlist_tracks_snapshot", [b.getId(), f, -1], function () {
                d.fillContext(b, c, a)
            })
        },
        "@playlist_subscribers_snapshot": function (b, c) {
            var a = b.args[0],
                d = b.args[1] || 0,
                f = b.args[2],
                f = f == -1 ? 500 : Math.min(f, 500),
                g = d + f;
            this.popcount.get(a,
            g, !1, null, this.prepareSubscribers.bind(this, a, c, d, f, g), this.handleError.bind(this, c))
        },
        prepareSubscribers: function (b, c, a, d, g, l) {
            b = [];
            if (l[0].user) for (var m = 0, n = l[0].user.length; m < n; m++) b.push(f.profileLink(l[0].user[m]).toURI());
            a = {
                range: {
                    offset: a,
                    length: d
                },
                length: l[0].count,
                array: b.slice(a, g)
            };
            return c.send(a)
        },
        "@playlist_tracks_snapshot": function (b, c) {
            var a = b.args[0],
                a = a == null || a == "spotify:starred" || a == "spotify:user:@:starred" ? f.starredLink(this._user) : f.fromString(b.args[0]);
            if (a.type == "user-toplist" || a.type == "user-top-tracks") return this.trigger("toplist_user_tracks_snapshot", b.args, c.send.bind(c), c.fail.bind(c));
            var d = b.args[1] || 0,
                g = b.args[2],
                g = g == -1 ? 200 : Math.min(g, 200),
                l = d + g,
                m = this.contextManager.get(a);
            if (m) {
                var n = m.getFullLength(),
                    o = Math.min(l, n || Infinity);
                if (m.hasRange(d, o)) return a = {
                    range: {
                        offset: d,
                        length: g
                    },
                    length: n,
                    array: m.slice(d, l)
                }, c.send(a);
                else if (a.type == "temp-playlist") return a = {
                    range: {
                        offset: d,
                        length: m.getLength()
                    },
                    length: n,
                    array: m.slice(d)
                }, c.send(a)
            }
            this.list(a.toURI(), d, l, g,
            c)
        },
        tracksAppended: function (b, c, a) {
            var d = this.contextManager.get(b, !0),
                f = d.getFullLength(),
                g = c.length;
            this.trigger("playlist_tracks_snapshot", [b.toURI(), f, g], function () {
                d.splice(f, c);
                a.send(!0);
                this.notifyListeners(b, "insert", {
                    index: f,
                    length: g,
                    array: c
                })
            }.bind(this), a.send.bind(a, !0))
        },
        "@playlist_tracks_append": function (b, c) {
            var a = b.args[0];
            if (a == null || a == "spotify:starred" || a == "spotify:user:@:starred") a = f.starredLink(this._user);
            else try {
                a = f.fromString(b.args[0])
            } catch (d) {
                return c.fail("invalid-uri",
                    "Not a valid Spotify URI.")
            }
            var g = b.args.slice(1);
            switch (a.type) {
                case "temp-playlist":
                    var l = this.contextManager.get(a);
                    if (!l) return c.fail("not-found", "The playlist was not found.");
                    var m = l.getLength();
                    l.concat(g);
                    c.send(!0);
                    this.notifyListeners(a, "insert", {
                        index: m,
                        length: g.length,
                        array: g
                    });
                    break;
                case "playlist":
                    this.service.addTracksInPlaylist(a.toURI(), g, this.tracksAppended.bind(this, a, g, c), this.handleError.bind(this, c));
                    break;
                case "starred":
                    return this.trigger("starred_tracks_append", b.args, c.send.bind(c),
                    c.fail.bind(c));
                default:
                    return c.fail("invalid-uri", "Not a valid Spotify playlist URI.")
            }
        },
        removeLocal: function (b, c, a, d) {
            if (!this.contextManager.get(b).remove(c, a)) return d.fail("invalid-request", "Cannot perform operation.");
            this.notifyListeners(b, "remove", {
                index: c,
                length: 1,
                array: [a.toString()]
            });
            return this.service.removeFromPlaylist(b.toURI(), c, 1, d.send.bind(d, !0), this.handleError.bind(this, d))
        },
        "@playlist_tracks_remove": function (b, c) {
            var a = b.args[0];
            if (a == null || a == "spotify:starred" || a == "spotify:user:@:starred") a = f.starredLink(this._user);
            else try {
                a = f.fromString(b.args[0])
            } catch (d) {
                return c.fail("invalid-uri", "Not a valid Spotify URI.")
            }
            var g = b.args[1],
                l = b.args[2],
                m = this.contextManager.get(a);
            switch (a.type) {
                case "temp-playlist":
                    if (!m) return c.fail("not-found", "The playlist was not found.");
                    m.remove(g, l) ? (c.send(!0), this.notifyListeners(a, "remove", {
                        index: g,
                        length: 1,
                        array: [l.toString()]
                    })) : c.fail("invalid-request", "Cannot perform operation.");
                    break;
                case "playlist":
                    return this.trigger("playlist_tracks_snapshot", [a.toURI(), g, 1], this.removeLocal.bind(this, a, g, l, c), c.send.bind(c));
                case "starred":
                    return this.trigger("starred_tracks_remove", b.args, c.send.bind(c), c.fail.bind(c));
                default:
                    return c.fail("invalid-uri", "Not a valid Spotify playlist URI.")
            }
        },
        "@playlist_tracks_insert": function (b, c) {
            var a = b.args,
                d = this.contextManager.get(a[0]);
            if (d && d.insert(a[1], a[2], a.slice(3))) return c.send(!0);
            c.fail("not-found", "The playlist was not found.")
        },
        "@playlist_tracks_trim": function (b, c) {
            var a = b.args,
                d = this.contextManager.get(a[0]);
            if (d && d.trim(a[1], a[2])) return c.send(!0);
            c.fail("not-found", "The playlist was not found")
        },
        "@playlist_tracks_clear": function (b, c) {
            var a = this.contextManager.get(b.args[0]);
            if (a) return a.clear(), c.send(!0);
            c.fail("not-found", "The playlist was not found.")
        },
        "@playlist_enforce_rules": function (b, c) {
            var a = this.contextManager.get(b.args[0]);
            return !a ? c.fail("not-found", "Playlist does not exist.") : a.setRule(b.args[1]) ? c.send(!0) : c.fail("forbidden", "Cannot enforce playlist rule")
        },
        preparePlaylists: function (b,
        c, a) {
            for (var d = [], f = 0, g = a.contents.length; f < g; f++) {
                var m = a.contents[f];
                switch (m.type) {
                    case "user-toplist":
                    case "artist-toplist":
                    case "toplist":
                    case "playlist":
                    case "starred":
                    case "user-top-tracks":
                        d.push(m.toString());
                        break;
                    default:
                        d.push("spotify:empty")
                }
            }
            return c.send({
                range: {
                    offset: b[1],
                    length: d.length
                },
                length: a.length,
                array: d
            })
        },
        rootlist: function (b, c) {
            var a = b[1],
                d = b[2],
                d = d == -1 ? 200 : Math.min(d, 200);
            this.preparePlaylists(b, c, {
                length: this._lists.length,
                contents: this._lists.slice(a, a + d)
            })
        },
        "@library_playlists_snapshot": function (b,
        c) {
            var a = b.args[0];
            try {
                if (a = f.fromString(a), a.type != "profile") throw Error();
            } catch (d) {
                return c.fail("invalid-uri", "Not a valid user URI.")
            }
            if (a.username != "@" && a.username != this._user) return c.fail("forbidden", "Cannot fetch playlists of user not logged into the session.");
            this._rootFailed ? setTimeout(this.fetchRoot.bind(this), 10 * this._rootTries++) : this.rootlist(b.args, c)
        },
        preparePublished: function (b, c, a, d, g) {
            d.done = !0;
            for (var a = d.replies.splice(0, d.replies.length), d = [], l = 0, m = g.contents.length; l < m; l++) {
                var n = g.contents[l];
                switch (n.type) {
                    case "user-toplist":
                    case "artist-toplist":
                    case "toplist":
                    case "playlist":
                    case "starred":
                    case "user-top-tracks":
                        d.push(n.toString());
                        break;
                    default:
                        d.push("spotify:empty")
                }
            }
            b = this.contextManager.get(f.profileLink(b), !0);
            b.splice(c, d);
            b.setFullLength(g.length);
            c = 0;
            for (d = a.length; c < d; c++) l = a[c], m = {
                range: {
                    offset: l.offset,
                    length: l.length
                },
                length: g.length,
                array: b.slice(l.offset, l.offset + l.length)
            }, l.reply.send(m)
        },
        requestPublished: function (b, c, a, d, f) {
            for (var g = this._requestedPublished,
            g = g[b] || (g[b] = []), m = {
                reply: f,
                offset: c,
                length: d
            }, n, o, k = g.length; k--;) if (n = g[k], !(n.start > c && n.end < a)) {
                o = n.replies;
                o.push(m);
                if (!n.done) return this;
                n.done = !1;
                break
            }
            o || (o = [m], n = {
                done: !1,
                start: c,
                end: c + 199,
                replies: o
            }, g.push(n));
            n.done || this.service.publishedRootlist({
                username: b,
                offset: c,
                total: 200
            }, this.preparePublished.bind(this, b, c, d, n), this.handleError.bind(this, f))
        },
        "@library_published_snapshot": function (b, c) {
            var a = b.args[0];
            try {
                if (a = f.fromString(a), a.type != "profile") throw Error();
            } catch (d) {
                return c.fail("invalid-uri",
                    "Not a valid user URI.")
            }
            if (a.username == "@") a.username = this._user;
            var g = b.args[1] || 0,
                l = b.args[2],
                l = l == -1 ? 200 : Math.min(l, 200),
                m = g + l,
                n = this.contextManager.get(f.rootlistLink(a.username));
            if (n) {
                var o = n.getFullLength(),
                    k = Math.min(m, o || Infinity);
                if (n.hasRange(g, k)) return a = {
                    range: {
                        offset: g,
                        length: l
                    },
                    length: o,
                    array: n.slice(g, m)
                }, c.send(a);
                else if (uri.type == "temp-rootlist") return a = {
                    range: {
                        offset: g,
                        length: n.getLength()
                    },
                    length: o,
                    array: n.slice(g)
                }, c.send(a)
            }
            this.requestPublished(a.username, g, m, l, c)
        },
        playlistRenamed: function (b,
        c, a) {
            var d = this.retrieve(b, "parsed.metadata");
            if (d) d.name = c;
            a.send(!0);
            this.notifyListeners(b, "change", {
                name: c
            })
        },
        "@playlist_set_name": function (b, c) {
            try {
                var a = f.fromString(b.args[0])
            } catch (d) {
                return c.fail("invalid-uri", "Not a valid Spotify URI.")
            }
            var g = b.args[1] || "New playlist";
            switch (a.type) {
                case "temp-playlist":
                    var l = this.retrieve(a, "parsed.metadata");
                    if (!l) return c.fail("not-found", "Playlist not found.");
                    l.name = g;
                    c.send(!0);
                    this.notifyListeners(a, "change", {
                        name: g
                    });
                    break;
                case "playlist":
                    return this.service.renamePlaylist(a.toURI(),
                    g, this.playlistRenamed.bind(this, a, g, c), this.handleError.bind(this, c));
                default:
                    return c.fail("invalid-uri", "Not a valid Spotify playlist URI.")
            }
        },
        "@@starred_tracks_decorate": function (b, c) {
            var a = b.args[0],
                d;
            for (d in a) if (a[d]) a[d].starred = this._starredFailed ? !1 : d in this._starredMap;
            return c.send(a)
        },
        "@@starred_track_decorate": function (b, c) {
            var a = b.args[0],
                d = b.args[1];
            d.starred = this._starredFailed ? !1 : a in this._starredMap;
            return c.send(d)
        },
        "@starred_request": function (b, c) {
            var a = b.args[0];
            if (a == null || a == "spotify:starred" || a == "spotify:user:@:starred") a = f.starredLink(this._user);
            else try {
                a = f.fromString(a);
                if (a.type != "profile") throw Error();
                a = f.starredLink(a.username)
            } catch (d) {
                return c.fail("invalid-uri", "Not a valid user URI.")
            }
            c.send({
                uri: a.toURI()
            })
        },
        "@starred_tracks_snapshot": function (b, c) {
            var a = b.args[0];
            if (a == null || a == "spotify:starred" || a == "spotify:user:@:starred") a = f.starredLink(this._user);
            else try {
                if (a = f.fromString(a), a.type != "starred") throw Error();
            } catch (d) {
                return c.fail("invalid-uri",
                    "Not a valid starred list URI.")
            }
            b.args[0] = a.toURI();
            this.trigger("playlist_tracks_snapshot", b.args, c.send.bind(c), c.fail.bind(c))
        },
        starredTracksAppended: function (b, c, a) {
            var d = this._starredMap,
                f = this.contextManager.get(b),
                g = f.getLength();
            f.concat(c);
            for (f = c.length; f--;) d[c[f]] = !0;
            a.send(!0);
            this.notifyListeners(b, "insert", {
                index: g,
                length: c.length,
                array: c
            })
        },
        "@starred_tracks_append": function (b, c) {
            var a = b.args[0];
            if (a == null || a == "spotify:starred" || a == "spotify:user:@:starred") a = f.starredLink(this._user);
            else {
                try {
                    if (a = f.fromString(a), a.type != "starred") throw Error();
                } catch (d) {
                    return c.fail("invalid-uri", "Not a valid starred list URI.")
                }
                if (a.username != this._user) return c.fail("forbidden", "Cannot add a track to another user's starred tracks")
            }
            for (var g = this._starredMap, l = [], m = 1, n = b.args.length; m < n; m++) b.args[m] in g || l.push(b.args[m]);
            if (!l.length) return c.send(!0);
            this.service.starTracks(l, this.starredTracksAppended.bind(this, a, l, c), this.handleError.bind(this, c))
        },
        "@track_star": function (b, c) {
            var a = b.args[0];
            try {
                if (a = f.fromString(a), a.type != "track") throw Error();
            } catch (d) {
                return c.fail("invalid-uri", "Not a valid track URI.")
            }
            this.trigger("starred_tracks_append", [null, a.toURI()], c.send.bind(c), c.fail.bind(c))
        },
        "@library_star": function (b, c) {
            b.args.shift();
            this.trigger("track_star", b, c.send.bind(c), c.fail.bind(c))
        },
        starredTracksRemoved: function (b, c, a, d) {
            d.send(!0);
            this.notifyListeners(b, "remove", {
                index: a,
                length: 1,
                array: [c]
            })
        },
        "@starred_tracks_remove": function (b, c) {
            var a = this._starredMap,
                d = b.args[0],
                g = b.args[1],
                l = b.args[2];
            if (d == null || d == "spotify:starred" || d == "spotify:user:@:starred") d = f.starredLink(this._user);
            else {
                try {
                    if (d = f.fromString(d), d.type != "starred") throw Error();
                } catch (m) {
                    return c.fail("invalid-uri", "Not a valid starred list URI.")
                }
                if (d.username != this._user) return c.fail("forbidden", "Cannot remove a track from another user's starred tracks")
            }
            if (!(l in a)) return c.send(!0);
            var n = this.contextManager.get(d);
            g == -1 && (g = n.indexOf(l));
            if (g == -1 || !n.remove(g, l)) return c.fail("invalid-request", "Cannot perform operation.");
            delete a[l];
            this.service.unstarTracks([l], this.starredTracksRemoved.bind(this, d, l, g, c), c.send.bind(c, !0))
        },
        "@track_unstar": function (b, c) {
            var a = b.args[0];
            try {
                if (a = f.fromString(a), a.type != "track") throw Error();
            } catch (d) {
                return c.fail("invalid-uri", "Not a valid track URI.")
            }
            this.trigger("starred_tracks_remove", [null, -1, a.toURI()], c.send.bind(c), c.fail.bind(c))
        },
        "@library_unstar": function (b, c) {
            b.args.shift();
            this.trigger("track_unstar", b, c.send.bind(c), c.fail.bind(c))
        },
        subscribePlaylists: function (b, c,
        a) {
            for (var d = this._lists, f = this._subscribed, g = [], m = c.length; m--;) g[m] = c[m].toURI();
            this.service.subscribe({
                username: b,
                uri: g
            }, function () {
                d.splice.apply(d, [0, 0].concat(c));
                for (var b = c.length; b--;) f[c[b]] = !0;
                a.send(!0);
                this.notifyListeners(this._user, "insert", {
                    index: 0,
                    length: c.length,
                    array: g
                }, "playlists")
            }.bind(this), this.handleError.bind(this, a))
        },
        "@library_subscribe": function (b, c) {
            var a = f.fromString(b.args[0]);
            if (a.username == "@") a.username = this._user;
            for (var d = b.args.slice(1), g = [], l = 0, m = d.length; l < m; l++) {
                try {
                    var n = f.fromString(d[l]);
                    if (n.username == "@") n.username = this._user
                } catch (o) {
                    continue
                }
                switch (n.type) {
                    case "user-toplist":
                    case "user-top-tracks":
                    case "starred":
                    case "playlist":
                        g.push(n)
                }
            }
            g && this.subscribePlaylists(a.username, g, c)
        },
        unsubscribePlaylists: function (b, c, a) {
            for (var d = this._lists, b = f.rootlistLink(b).toURI(), g = c.length, l = []; g--;) {
                for (var m = c[g].toString(), n = -1, o = d.length; o--;) if (d[o].toString() === m) {
                    n = o;
                    break
                }
                n != -1 && l.push(n)
            }
            if (!l.length) return a.send(!0);
            for (g = o = l.length; o--;) this.service.removeFromPlaylist(b,
            l[o], 1, function (b) {
                b = d.splice(b, 1).pop();
                delete this._subscribed[b];
                g--;
                g || a.send(!0);
                this.notifyListeners(this._user, "remove", {
                    index: g,
                    length: 1,
                    array: [b.toString()]
                }, "playlists")
            }.bind(this, l[o]), function () {
                g--;
                g || a.fail("transient", "Something went wrong.")
            })
        },
        "@library_unsubscribe": function (b, c) {
            var a = f.fromString(b.args[0]);
            if (a.username == "@") a.username = this._user;
            for (var d = b.args.slice(1), g = [], l = 0, m = d.length; l < m; l++) {
                try {
                    var n = f.fromString(d[l]);
                    if (n.username == "@") n.username = this._user
                } catch (o) {
                    continue
                }
                switch (n.type) {
                    case "user-toplist":
                    case "user-top-tracks":
                    case "starred":
                    case "playlist":
                        g.push(n)
                }
            }
            g && this.unsubscribePlaylists(a.username, g, c)
        },
        "@user_subscribe_playlist": function (b, c) {
            var a = this._lists,
                d = this._subscribed,
                g = f.fromString(b.args[0]).username,
                l = f.fromString(b.args[1]);
            this.service.subscribe({
                username: g,
                uri: l.toURI()
            }, function () {
                a.unshift(l);
                d[l] = !0;
                c.send(!0);
                this.notifyListeners(this._user, "insert", {
                    index: 0,
                    length: 1,
                    array: [l.toURI()]
                }, "playlists")
            }.bind(this), this.handleError.bind(this, c))
        },
        "@user_unsubscribe_playlist": function (b, c) {
            for (var a = this._lists, d = f.rootlistLink(f.fromString(b.args[0]).username),
            g = f.fromString(b.args[1]), l = g.toString(), m = a.length, n = -1; m--;) a[m].toString() == l && (n = m);
            if (n == -1) return c.fail("not-found", "Not subscribed to this playlist.");
            this.service.removeFromPlaylist(d.toString(), n, 1, function () {
                a.splice(n, 1);
                delete this._subscribed[g];
                c.send(!0);
                this.notifyListeners(this._user, "remove", {
                    index: m,
                    length: 1,
                    array: [g.toURI()]
                }, "playlists")
            }.bind(this), this.handleError.bind(this, c))
        }
    })
})();
(function () {
    var g = Spotify.Link;
    new Spotify.App.Responder({
        _ready: !1,
        _listeners: [],
        _events: new Spotify.Events,
        init: function (f) {
            var a;
            a = this.service = f.socialGraph, f = a;
            f.bind(this._events.RELATIONS_SUBSCRIBE, this.modifyRelations, this, 0);
            f.onReady(this.start, this)
        },
        start: function () {
            this._ready = !0;
            this.unqueue();
            this.service.preloadCurrentUserSubscriptions()
        },
        modifyRelations: function (f) {
            for (var d = f.type === this._events.RELATIONS_SUBSCRIBE ? "add" : "remove", f = f.params.users, b = [], c = 0, a = f.length; c < a; c++) b.push(g.profileLink(f[c]).toString());
            this.notifyListeners(d, b)
        },
        request: function (f, d, b) {
            var c = d.args,
                a = d.args[0] ? g.fromString(c[0]).username : null,
                h = d.args[1],
                d = d.args[2];
            a === "@" && (a = null);
            this.service[f](a, d, h, this.reply.bind(this, b, c), this.handleError.bind(this, b))
        },
        modify: function (f, d, b) {
            for (var d = d.args, c = [], a = 0, h = d.length; a < h; a++) {
                var i = g.fromString(d[a]).username;
                i !== "@" && c.push(i)
            }
            this.service[f](c, this.modifyReply.bind(this, b, d), this.handleError.bind(this, b))
        },
        reply: function (f, d, b) {
            var c = [],
                a = b[0].users,
                b = b[0].length;
            if (a) for (var h = 0, i = a.length; h < i; h++) c.push(g.profileLink(a[h].username).toString());
            d = this.createSnapshot(d, c, b);
            f.send(d)
        },
        modifyReply: function (f) {
            f.send({})
        },
        handleError: function (f, d) {
            var b, c;
            switch (d.code) {
                case 404:
                    b = "not-found";
                    c = "No relation found.";
                    break;
                default:
                    b = "transient", c = "Possible issues with the socialgraph service."
            }
            return f.fail(b, c)
        },
        notifyListeners: function (f, d) {
            for (var b = this._listeners.splice(0, this._listeners.length), c = {
                type: f,
                uris: d,
                receiver: "subscriptions"
            }, a = 0, h = b.length; a < h; a++) b[a].send(c);
            return this
        },
        "@relations_event_wait": function (f, d) {
            this._listeners.push(d.persist())
        },
        "@relations_subscribers_users_snapshot": function (f, d) {
            this.request("getSubscribers", f, d)
        },
        "@relations_subscriptions_users_snapshot": function (f, d) {
            this.request("getSubscriptions", f, d)
        },
        "@relations_blocked_users_snapshot": function (f, d) {
            this.request("getBlocked", f, d)
        },
        "@relations_dismissed_users_snapshot": function (f, d) {
            this.request("getDismissed", f, d)
        },
        "@relations_hidden_users_snapshot": function (f, d) {
            this.request("getHidden",
            f, d)
        },
        "@relations_subscribe": function (f, d) {
            this.modify("subscribeTo", f, d)
        }
    })
})();
(function () {
    var g = Spotify.App.Responder;
    new g({
        _ready: !1,
        init: function (f, d) {
            this.getAppUrl = d.getAppUrl;
            this.start()
        },
        start: function () {
            this._ready = !0;
            this.unqueue()
        },
        "@core_request_lookup": function (f, d) {
            d.send(g.respondsTo(f.args[0]))
        },
        "@application_require": function (f, d) {
            d.send("http://origin.spapps.keeto.d.spotify.net/" + f.args[0] + "/")
        }
    })
})();
(function () {
    var g = Spotify.Utils.isArray,
        f = Spotify.Link,
        d = Spotify.App.SourceURLs;
    new Spotify.App.Responder({
        _ready: !1,
        _requested: {},
        _fuzzy: {},
        create: function () {
            this.prepareAlbums = this.prepare.bind(this, this.parseAlbums);
            this.prepareArtists = this.prepare.bind(this, this.parseArtists);
            this.prepareTracks = this.prepare.bind(this, this.parseTracks);
            this.preparePlaylists = this.prepare.bind(this, this.parsePlaylists)
        },
        init: function (b) {
            this.contextManager = b.contextManager;
            (this.service = b.search).onReady(this.start,
            this)
        },
        start: function () {
            this._ready = !0;
            this.unqueue()
        },
        processReplies: function (b, c, a) {
            if (a.didYouMean) this._fuzzy[b] = a.didYouMean;
            for (b = c.length; b--;) {
                var d = c[b];
                d.parser.call(this, d.args, d.reply, a)
            }
        },
        processFailures: function (b, c) {
            for (var a = c.length; a--;) c[a].reply.fail("transient", "Possible problems with the search service.")
        },
        request: function (b) {
            delete this._requested[b.key];
            this.service.search(b.query, {
                type: b.type,
                offset: b.offset,
                total: b.length
            }, this.processReplies.bind(this, b.key, b.replies), this.processFailures.bind(this,
            b.key, b.replies))
        },
        search: function (b, c, a, d) {
            var f = c[0];
            if (!f) return a.fail("invalid-request", "Invalid query params.");
            var g = c[1],
                m = c[2],
                m = m == -1 ? 50 : Math.min(m, 50),
                n = [f, g, m].join(":"),
                c = {
                    reply: a,
                    parser: d,
                    args: c
                };
            (a = this._requested[n]) ? (a.type |= b, a.replies.push(c)) : (a = this._requested[n] = {
                key: n,
                query: f,
                offset: g,
                length: m,
                type: b,
                replies: [c]
            }, setTimeout(this.request.bind(this, a), 10))
        },
        cache: function (b, c) {
            this._cache[b] = {
                timestamp: (new Date).getTime(),
                value: c
            };
            return this
        },
        retrieve: function (b) {
            var c = this._cache[b];
            if (!c) return null;
            return (new Date).getTime() - c.timestamp >= CACHE_TIME ? (delete this._cache[b], null) : c
        },
        prepare: function (b, c, a, d) {
            b = b.call(this, d, c);
            if (b == null) return a.fail("transient", "No valid search results found.");
            b = this.createSnapshot([null, 0, c[2]], b.array, b.total, b.metadata);
            b.range = {
                offset: c[1],
                length: b.array.length
            };
            a.send(b)
        },
        "@search_albums_snapshot": function (b, c) {
            this.search(this.service.ALBUMS, b.args, c, this.prepareAlbums)
        },
        parseAlbums: function (b) {
            var c = b.total.albums,
                b = b.albums,
                a = [],
                h = [];
            if (b) {
                g(b) || (b = [b]);
                for (var i = 0, l = b.length; i < l; i++) {
                    var m = b[i];
                    if (m.id) {
                        a.push(f.albumLink(m.id).toURI());
                        for (var n = {
                            name: m.name,
                            type: (m.type || "").toLowerCase(),
                            popularity: m.popularity,
                            playable: m.playable,
                            image: null
                        }, o = n.artists = [], k = 0, p = m.artists.length; k < p; ++k) o.push({
                            uri: f.artistLink(m.artists[k].id).toURI(),
                            name: m.artists[k].name
                        });
                        h.push(n);
                        if (m.cover && m.cover[0]) m = m.cover[0].file_id, n.image = d.normal + m, n.images = this.createImageSizes(m)
                    }
                }
            }
            return {
                total: c,
                array: a,
                metadata: h
            }
        },
        "@search_artists_snapshot": function (b,
        c) {
            this.search(this.service.ARTISTS, b.args, c, this.prepareArtists)
        },
        parseArtists: function (b) {
            var c = b.total.artists,
                b = b.artists,
                a = [],
                h = [];
            if (b) {
                g(b) || (b = [b]);
                for (var i = 0, l = b.length; i < l; i++) {
                    var m = b[i];
                    if (m.id) {
                        a.push(f.artistLink(m.id).toURI());
                        var n = {
                            name: g(m.name) ? m.name.join(", ") : m.name,
                            popularity: m.popularity,
                            playable: m.playable,
                            image: null
                        };
                        if (m.portrait && m.portrait[0]) m = m.portrait[0].file_id, n.image = d.normal + m, n.images = this.createImageSizes(m);
                        h.push(n)
                    }
                }
            }
            return {
                total: c,
                array: a,
                metadata: h
            }
        },
        "@search_tracks_snapshot": function (b,
        c) {
            var a = b.args,
                d = this.contextManager.get(f.searchLink(a[0]));
            if (d) {
                var g = d.getFullLength(),
                    a = this.createDimensions(a[1], a[2], 50),
                    l = Math.min(a.end, g || Infinity);
                if (d.hasRange(a.start, l)) return d = {
                    range: {
                        offset: a.start,
                        length: l
                    },
                    length: g,
                    array: d.slice(a.start, l + 1),
                    metadata: d._context.__meta.slice(a.start, l + 1)
                }, c.send(d)
            }
            this.search(this.service.TRACKS, b.args, c, this.prepareTracks)
        },
        parseTracks: function (b, c) {
            var a = b.total.tracks,
                h = b.tracks,
                i = [],
                l = [];
            if (h) {
                g(h) || (h = [h]);
                for (var m = 0, n = h.length; m < n; m++) {
                    var o = h[m];
                    if (o.id) {
                        i.push(f.trackLink(o.id).toURI());
                        for (var k = {
                            starred: !1,
                            name: o.name,
                            album: {
                                uri: f.albumLink(o.album.id).toURI(),
                                name: o.album.name,
                                image: null,
                                artists: [{
                                    uri: f.artistLink(o.album.artist.id).toURI(),
                                    name: g(o.album.artist.name) ? o.album.artist.name.join(", ") : o.album.artist.name
                                }]
                            },
                            duration: o.length,
                            playable: o.playable,
                            popularity: o.popularity,
                            image: null,
                            year: o.year
                        }, p = k.artists = [], q = 0, s = o.artists.length; q < s; ++q) {
                            var t = o.artists[q];
                            typeof t.name == "string" && p.push({
                                uri: f.artistLink(t.id).toURI(),
                                name: t.name
                            })
                        }
                        if (o.album.cover && o.album.cover[0]) o = o.album.cover[0].file_id, k.image = k.album.image = d.normal + o, k.images = k.album.images = this.createImageSizes(o);
                        l.push(k)
                    }
                }
                h = this.contextManager.get(f.searchLink(c[0]), !0, 36E5);
                h.setLoader(this.fillContext.bind(this));
                h.splice(c[1], i);
                h.setFullLength(a);
                h = h._context.__meta || (h._context.__meta = []);
                h.splice.apply(h, [c[1], 0].concat(l))
            }
            return {
                total: a,
                array: i,
                metadata: l
            }
        },
        "@search_playlists_snapshot": function (b, c) {
            this.search(this.service.PLAYLISTS, b.args,
            c, this.preparePlaylists)
        },
        parsePlaylists: function (b) {
            var c = b.total.playlists,
                b = b.playlists,
                a = [],
                f = [];
            if (b) {
                g(b) || (b = [b]);
                for (var i = 0, l = b.length; i < l; i++) {
                    var m = b[i];
                    a.push(m.uri);
                    var n = {
                        image: null,
                        name: m.name,
                        uri: m.uri
                    }, m = m["image-large"] || m.image || null;
                    if (typeof m === "string") m = m.split(":").splice(2, m.length - 1).join(""), n.image = d.normal + m, n.images = this.createImageSizes(m);
                    f.push(n)
                }
            }
            return {
                total: c,
                array: a,
                metadata: f
            }
        },
        fillContext: function (b, c, a) {
            var a = a || function () {}, d = this,
                g = b.getLength();
            if (g > c + 20) return a();
            try {
                var l = f.fromString(b.getId()).query
            } catch (m) {
                return a()
            }
            this.trigger("search_tracks_snapshot", [l, g, -1], function () {
                d.fillContext(b, c, a)
            })
        },
        parseFuzzy: function (b, c, a) {
            b = this._fuzzy[b] = a.didYouMean;
            c.send({
                fuzzyMatch: b
            })
        },
        "@search_fuzzy_match": function (b, c) {
            var a = b.args[0];
            this._fuzzy[a] ? c.send({
                fuzzyMatch: this._fuzzy[a] || null
            }) : this.service.search(a, {
                type: this.service.TRACKS,
                offset: 0,
                total: 20
            }, this.parseFuzzy.bind(this, a, c), function () {
                c.send({
                    fuzzyMatch: null
                })
            })
        }
    })
})();
(function () {
    var g = Spotify.Link;
    new Spotify.App.Responder({
        _ready: !1,
        create: function () {
            this.prepareAlbums = this.prepare.bind(this, this.parseAlbums);
            this.prepareArtists = this.prepare.bind(this, this.parseArtists);
            this.prepareTracks = this.prepare.bind(this, this.parseTracks);
            this.preparePlaylists = this.prepare.bind(this, this.parsePlaylists)
        },
        init: function (f) {
            this.service = f.suggest;
            this.service.onReady(this.start, this)
        },
        start: function () {
            this._ready = !0;
            this.unqueue()
        },
        suggest: function (f, d, b) {
            var c = f[0];
            if (!c) return d.fail("invalid-request",
                "Invalid query param.");
            this.service.suggest(c, b.bind(this, f, d), d.fail.bind(d, "transient", "Possible issues with the suggest service."))
        },
        prepare: function (f, d, b, c) {
            f = f.call(this, c);
            if (f == null) return b.fail("transient", "Cannot parse results.");
            b.send({
                range: {
                    offset: d[1],
                    length: f.array.length
                },
                length: f.total,
                array: f.array,
                metadata: f.metadata
            })
        },
        "@suggest_albums_snapshot": function (f, d) {
            this.suggest(f.args, d, this.prepareAlbums)
        },
        parseAlbums: function (f) {
            var f = f.albums,
                d = [],
                b = [];
            if (f) for (var c = 0, a = f.length; c < a; c++) {
                d.push(g.albumLink(f[c].id).toString());
                var h = [];
                for (j = 0, lj = f[c].artists.length; j < lj; j++) h.push({
                    uri: g.artistLink(f[c].artists[j].id).toString(),
                    name: f[c].artists[j].name
                });
                b.push({
                    name: f[c].name,
                    image: Spotify.App.SourceURLs.small + f[c].image,
                    artists: h,
                    popularity: f[c].popularity
                })
            }
            return {
                total: d.length,
                array: d,
                metadata: b
            }
        },
        "@suggest_artists_snapshot": function (f, d) {
            this.suggest(f.args, d, this.prepareArtists)
        },
        parseArtists: function (f) {
            var f = f.artists,
                d = [],
                b = [];
            if (f) for (var c = 0, a = f.length; c < a; c++) d.push(g.artistLink(f[c].id).toString()),
            b.push({
                name: f[c].name,
                image: Spotify.App.SourceURLs.small + f[c].image,
                popularity: f[c].popularity
            });
            return {
                total: d.length,
                array: d,
                metadata: b
            }
        },
        "@suggest_tracks_snapshot": function (f, d) {
            this.suggest(f.args, d, this.prepareTracks)
        },
        parseTracks: function (f) {
            var f = f.tracks,
                d = [],
                b = [];
            if (f) for (var c = 0, a = f.length; c < a; c++) {
                d.push(g.trackLink(f[c].id).toString());
                var h = [];
                for (j = 0, lj = f[c].artists.length; j < lj; j++) h.push({
                    uri: g.artistLink(f[c].artists[j].id).toString(),
                    name: f[c].artists[j].name
                });
                b.push({
                    name: f[c].name,
                    image: Spotify.App.SourceURLs.small + f[c].image,
                    artists: h,
                    popularity: f[c].popularity
                })
            }
            return {
                total: d.length,
                array: d,
                metadata: b
            }
        },
        "@suggest_playlists_snapshot": function (f, d) {
            this.suggest(f.args, d, this.preparePlaylists)
        },
        parsePlaylists: function (f) {
            var f = f.playlist,
                d = [],
                b = [];
            if (f) for (var c = 0, a = f.length; c < a; c++) {
                var g = f[c];
                d.push(g.uri);
                var i = {
                    image: null,
                    name: g.name,
                    popularity: g.popularity,
                    uri: g.uri
                };
                if (typeof g.image === "string") i.image = Spotify.App.SourceURLs.small + g.image;
                b.push(i)
            }
            return {
                total: d.length,
                array: d,
                metadata: b
            }
        }
    })
})();
(function () {
    var g = Spotify.Link;
    new Spotify.App.Responder({
        _ready: !1,
        init: function (f) {
            (this.service = f.toplist).onReady(this.start, this)
        },
        start: function () {
            this._ready = !0;
            this.unqueue()
        },
        reply: function (f, d, b) {
            for (var c = [], a = 0, g = b.length; a < g; a++) c.push(b[a].toString());
            d = this.createSnapshot(d, c);
            f.send(d)
        },
        handleError: function (f, d) {
            var b, c;
            switch (d.code) {
                case 404:
                    b = "not-found";
                    c = "No toplist found.";
                    break;
                default:
                    b = "transient", c = "Possible issues with the toplist service."
            }
            return f.fail(b, c)
        },
        requestForUser: function (f,
        d, b, c) {
            this.service.lookupForUser(d, f, this.reply.bind(this, c, b), this.handleError.bind(this, c))
        },
        requestForRegion: function (f, d, b, c) {
            this.service.lookupForRegion(d, f, this.reply.bind(this, c, b), this.handleError.bind(this, c))
        },
        "@toplist_user_tracks_snapshot": function (f, d) {
            var b = f.args,
                c = f.args[0] ? g.fromString(b[0]).username : null;
            c == "@" && (c = null);
            this.requestForUser(this.service.TRACK, c, b, d)
        },
        "@toplist_user_albums_snapshot": function (f, d) {
            var b = f.args,
                c = f.args[0] ? g.fromString(b[0]).username : null;
            c == "@" && (c = null);
            this.requestForUser(this.service.ALBUM, c, b, d)
        },
        "@toplist_user_artists_snapshot": function (f, d) {
            var b = f.args,
                c = f.args[0] ? g.fromString(b[0]).username : null;
            c == "@" && (c = null);
            this.requestForUser(this.service.ARTIST, c, b, d)
        },
        "@toplist_user_playlists_snapshot": function (f, d) {
            var b = f.args,
                c = f.args[0] ? g.fromString(b[0]).username : null;
            c == "@" && (c = null);
            this.requestForUser(this.service.PLAYLIST, c, b, d)
        },
        "@toplist_region_tracks_snapshot": function (f, d) {
            var b = f.args;
            this.requestForRegion(this.service.TRACK,
            b[0] || null, b, d)
        },
        "@toplist_region_albums_snapshot": function (f, d) {
            var b = f.args;
            this.requestForRegion(this.service.ALBUM, b[0] || null, b, d)
        },
        "@toplist_region_artists_snapshot": function (f, d) {
            var b = f.args;
            this.requestForRegion(this.service.ARTIST, b[0] || this._country, b, d)
        },
        "@toplist_artist_tracks_snapshot": "artist_top_tracks_snapshot"
    })
})();
(function () {
    var g = Spotify.Link,
        f = Spotify.App.RequestBuffer;
    new Spotify.App.Responder({
        _ready: !1,
        _session: null,
        _requestBuffer: new f,
        _requestBufferMergedProfileUser: new f,
        _requestBufferMergedProfileArtist: new f,
        init: function (d) {
            this.use({
                session: d.user,
                social: d.social,
                socialGraph: d.socialGraph,
                mergedProfile: d.mergedProfile
            })
        },
        start: function () {
            var d = function () {
                this._ready = !0;
                this.unqueue()
            }.bind(this);
            this.getSession({
                send: d,
                fail: d
            })
        },
        flushRequests: function () {
            this.queryService();
            this.queryMergedProfileService("user",
            this._requestBufferMergedProfileUser);
            this.queryMergedProfileService("artist", this._requestBufferMergedProfileArtist)
        },
        "@session_query": function (d, b) {
            if (this._session) return b.send(this._session);
            else this.getSession(b)
        },
        getSession: function (d) {
            this.session.getUserInfo(this.prepareSessionInfo.bind(this, d), d.fail.bind(d, "transient", "Cannot fetch session."))
        },
        prepareSessionInfo: function (d, b) {
            var c = this._session = this.parseSessionInfo(b);
            d.send(c)
        },
        parseSessionInfo: function (d) {
            d = d.response;
            return {
                device: "web",
                online: !0,
                country: d.country,
                product: d.catalogue,
                testGroup: d.ab_test_group,
                _username: d.user
            }
        },
        "@session_event_wait": function (d, b) {
            b.persist()
        },
        queryService: function () {
            var d = this._requestBuffer.takeIds();
            d.length && this.social.getUsers(d, "complete", this.format.bind(this, d), this.handleError.bind(this, d))
        },
        format: function (d, b) {
            for (var c = this._requestBuffer, a = null, f = 0, i = d.length; f < i; f++) {
                var l = d[f];
                (a = b[f]) ? (a = this.parseUser(a), a.currentUser = l == this._session._username) : a = {
                    error: "not-found",
                    message: "The user does not exist."
                };
                this.store(g.profileLink(l).toURI(), "parsed.metadata", a);
                for (var l = c.takeReplies(l), m = l.length; m--;) l[m].send(a)
            }
        },
        handleError: function (d) {
            for (var b = this._requestBuffer, c = 0, a = d.length; c < a; c++) for (var f = b.takeReplies(d[c]), g = f.length; g--;) f[g].fail("transient", "Could not complete request")
        },
        parseUser: function (d) {
            var b = d.image_url,
                c = b.match(/^spotify:image:(.+)/);
            c && (b = Spotify.App.SourceURLs.avatar + c[1]);
            b = {
                username: d.username,
                name: d.full_name || d.username,
                image: b,
                identifier: ""
            };
            b.subscribed = !! this.socialGraph.isSubscribed([d.username])[0];
            return b
        },
        "@user_metadata": function (d, b) {
            var c = this._requestBuffer,
                a = d.args[0];
            try {
                var f = g.fromString(a);
                if (f.type != "profile") throw Error();
            } catch (i) {
                return b.fail({
                    error: "invalid-uri",
                    message: "Not a valid user URI."
                })
            }
            if (f.username == "@") f.username = this._session._username;
            if (a = this.retrieve(f.toString(), "parsed.metadata")) return a.currentUser = f.username == this._session._username, b.send(a);
            else c.push(f.username, b)
        },
        queryMergedProfileService: function (d, b) {
            var c = b.takeIds();
            if (c.length) for (var a = 0, f = c.length; a < f; a++) {
                var g = c[a];
                d === "user" ? this.mergedProfile.forUser(g, this.formatMergedProfile.bind(this, d, b, g), this.handleError.bind(this, g)) : d === "artist" && this.mergedProfile.forArtist(g, this.formatMergedProfile.bind(this, d, b, g), this.handleError.bind(this, g))
            }
        },
        formatMergedProfile: function (d, b, c, a) {
            var a = a[0],
                f;
            d === "user" ? (f = {
                artist: a.artist
            }, this.store(g.profileLink(c).toURI(), "parsed.artist", f)) : d === "artist" && (f = {
                user: a.user
            }, this.store(g.profileLink(c).toURI(), "parsed.user", f));
            d = b.takeReplies(c);
            for (b = d.length; b--;) d[b].send(f)
        },
        "@user_associated_artist": function (d, b) {
            var c = this._requestBufferMergedProfileUser,
                a = d.args[0],
                f;
            try {
                if (f = g.fromString(a), f.type != "profile") throw Error();
            } catch (i) {
                return b.fail({
                    error: "invalid-uri",
                    message: "Not a valid user URI."
                })
            }
            if (f.username == "@") f.username = this._session._username;
            if (a = this.retrieve(f.toString(), "parsed.artist")) return a.currentUser = f.username == this._session._username, b.send(a);
            else c.push(f.username, b)
        },
        "@artist_associated_user": function (d,
        b) {
            var c = this._requestBufferMergedProfileArtist,
                a = d.args[0],
                f;
            try {
                if (f = g.fromString(a), f.type != "artist") throw Error();
            } catch (i) {
                return b.fail({
                    error: "invalid-uri",
                    message: "Not a valid artist URI."
                })
            }
            if (f = this.retrieve(f.toString(), "parsed.user")) return b.send(f);
            else c.push(a.replace("spotify:artist:", ""), b)
        }
    })
})();
Spotify.lockStorage();
Spotify.Web.BrowserDetect = {
    init: function () {
        this.browser = this._searchString(this.dataBrowser) || "An unknown browser";
        this.version = this._searchVersion(navigator.userAgent) || this._searchVersion(navigator.appVersion) || "an unknown version";
        this.OS = this._searchString(this.dataOS) || "an unknown OS"
    },
    _searchString: function (g) {
        for (var f = 0; f < g.length; f++) {
            var d = g[f].string,
                b = g[f].prop;
            this.versionSearchString = g[f].versionSearch || g[f].identity;
            if (d) {
                if (d.indexOf(g[f].subString) != -1) return g[f].identity
            } else if (b) return g[f].identity
        }
    },
    _searchVersion: function (g) {
        var f = g.indexOf(this.versionSearchString);
        return f == -1 ? void 0 : parseFloat(g.substring(f + this.versionSearchString.length + 1))
    },
    dataBrowser: [{
        string: navigator.userAgent,
        subString: "Chrome",
        identity: "Chrome"
    }, {
        string: navigator.userAgent,
        subString: "OmniWeb",
        versionSearch: "OmniWeb/",
        identity: "OmniWeb"
    }, {
        string: navigator.vendor,
        subString: "Apple",
        identity: "Safari",
        versionSearch: "Version"
    }, {
        prop: window.opera,
        identity: "Opera",
        versionSearch: "Version"
    }, {
        string: navigator.vendor,
        subString: "iCab",
        identity: "iCab"
    }, {
        string: navigator.vendor,
        subString: "KDE",
        identity: "Konqueror"
    }, {
        string: navigator.userAgent,
        subString: "Firefox",
        identity: "Firefox"
    }, {
        string: navigator.vendor,
        subString: "Camino",
        identity: "Camino"
    }, {
        string: navigator.userAgent,
        subString: "Netscape",
        identity: "Netscape"
    }, {
        string: navigator.userAgent,
        subString: "MSIE",
        identity: "Explorer",
        versionSearch: "MSIE"
    }, {
        string: navigator.userAgent,
        subString: "Gecko",
        identity: "Mozilla",
        versionSearch: "rv"
    }, {
        string: navigator.userAgent,
        subString: "Mozilla",
        identity: "Netscape",
        versionSearch: "Mozilla"
    }],
    dataOS: [{
        string: navigator.platform,
        subString: "Win",
        identity: "Windows"
    }, {
        string: navigator.platform,
        subString: "Mac",
        identity: "Mac"
    }, {
        string: navigator.userAgent,
        subString: "iPhone",
        identity: "iPhone/iPod"
    }, {
        string: navigator.platform,
        subString: "Linux",
        identity: "Linux"
    }],
    getVendorPrefix: function () {
        if ("result" in arguments.callee) return arguments.callee.result;
        var g = /^(Moz|Webkit|Khtml|O|ms|Icab)(?=[A-Z])/,
            f = document.getElementsByTagName("script")[0],
            d;
        for (d in f.style) if (g.test(d)) return arguments.callee.result = d.match(g)[0];
        return "WebkitOpacity" in f.style ? arguments.callee.result = "Webkit" : "KhtmlOpacity" in f.style ? arguments.callee.result = "Khtml" : arguments.callee.result = ""
    }
};
Spotify.Web.ScrollBlocker = function (g, f) {
    this.publisher = f;
    this.blocker = g
};
Spotify.Web.ScrollBlocker.prototype.init = function () {
    this.publisher.subscribe(Spotify.Web.PublisherMessages.SCROLL_BLOCK, this);
    this.publisher.subscribe(Spotify.Web.PublisherMessages.SCROLL_ALLOW, this);
    this.blocker.addEventListener("mouseover", function (g) {
        g.stopPropagation()
    }, !1)
};
Spotify.Web.ScrollBlocker.prototype.activate = function () {
    this.blocker.style.display = "block"
};
Spotify.Web.ScrollBlocker.prototype.deactivate = function () {
    this.blocker.style.display = "none"
};
Spotify.Web.ScrollBlocker.prototype.onNotify = function (g) {
    switch (g.messageType) {
        case Spotify.Web.PublisherMessages.SCROLL_BLOCK:
            this.activate();
            break;
        case Spotify.Web.PublisherMessages.SCROLL_ALLOW:
            this.deactivate()
    }
};
Spotify.Web.SocialData = function (g, f, d) {
    Spotify.Web.EventTarget.call(this);
    var b = this;
    this._userFirstName = this._userImage = "";
    this._fbComplete = this._apComplete = !1;
    var c = function () {
        g.notify(Spotify.Web.PublisherMessages.SOCIAL_DATA_SUCCESS, {
            name: b._userFirstName,
            image: b._userImage
        })
    }, a = function () {
        d.getUserImage(function (a) {
            d.getUsersName(function (d) {
                var f = a.message[0];
                if (b._userImage === "" && f && f.url !== "") b._userImage = f.url;
                if (b._userFirstName === "" && d.message.first_name && d.message.first_name !== "") b._userFirstName = d.message.first_name;
                b._fbComplete = !0;
                c()
            })
        })
    }, h = function () {
        f.getSocialDataForCurrentUser(function (a) {
            b._apComplete = !0;
            if (a) {
                if (a.image_url !== "") b._userImage = a.image_url;
                if (a.full_name !== "") b._userFirstName = a.full_name.split(" ")[0];
                c()
            }
        })
    };
    this.init = function () {
        h();
        g.subscribe(Spotify.Web.PublisherMessages.FB_APP_CONNECTED, b)
    };
    this.onNotify = function (b) {
        b.messageType === Spotify.Web.PublisherMessages.FB_APP_CONNECTED && (this._userFirstName === "" || this._userImage === "") && a()
    }
};
Spotify.Web.Static = function () {
    this.preloadImage = function (g, f) {
        var d = new Image;
        d.src = g;
        if (typeof f !== "undefined") d.onload = f
    };
    this.loadScript = function (g) {
        var f = document.createElement("script");
        f.type = "text/javascript";
        f.async = !0;
        f.src = g;
        g = document.getElementsByTagName("script")[0];
        g.parentNode.insertBefore(f, g)
    }
};
Spotify.Web.EventTarget = function () {
    var g = {};
    this.bind = function (f, d, b) {
        var c = {
            callback: d,
            context: b
        }, a = !1,
            h;
        g[f] === void 0 && (g[f] = []);
        h = g[f];
        for (var i = 0; i < h.length; i++) if (h[i].callback === d && h[i].context === b) {
            a = !0;
            break
        }
        a === !1 && g[f].push(c)
    };
    this.trigger = function (f, d) {
        var b = g[f],
            c;
        if (typeof b !== "undefined") for (c = 0; c < b.length; c++) {
            var a = b[c];
            a.callback.call(a.context, {
                type: f,
                sender: this,
                params: d
            })
        }
    };
    this.unbind = function (f, d, b) {
        var c, a = g[f];
        if (typeof a !== "undefined") {
            for (var h = 0; h < a.length; h++) if (a[h].callback === d && a[h].context === b) {
                c = h;
                break
            }
            c !== -1 && g[f].splice(c, 1)
        }
    }
};
Spotify.Web.Publisher = function () {
    var g = {}, f = function (d) {
        g[d] === void 0 && (g[d] = []);
        return g[d]
    };
    this.subscribe = function (d, b) {
        if (!d) throw Error("Spotify.Web.Publisher message type must be set");
        if (!b) throw Error("Spotify.Web.Publisher listener object must be set");
        var c = f(d);
        c.indexOf(b) === -1 && c.push(b)
    };
    this.unsubscribe = function (d, b) {
        var c = f(d),
            a = c.indexOf(b);
        a > -1 && c.splice(a, 1)
    };
    this.notify = function (d, b, c) {
        for (var a = f(d), g = 0; g < a.length; g++) a[g].onNotify({
            messageType: d,
            message: b,
            origin: c
        })
    }
};
Spotify.Web.PublisherMessages = {
    ERROR: "ERROR",
    APPLICATION_STATE_CHANGED: "APPLICATION_STATE_CHANGED",
    APPLICATION_STATE_PUSH: "APPLICATION_STATE_PUSH",
    APPLICATION_STATE_REPLACE: "APPLICATION_STATE_REPLACE",
    APPLICATION_OPEN_URI: "APPLICATION_OPEN_URI",
    APPLICATION_POST_MESSAGE: "APPLICATION_POST_MESSAGE",
    APPLICATION_ENABLED: "APPLICATION_ENABLED",
    APPLICATION_VERSION_CHANGED: "APPLICATION_VERSION_CHANGED",
    APPLICATION_CLOSED: "APPLICATION_CLOSED",
    APPLICATION_DISPOSED: "APPLICATION_DISPOSED",
    APPLICATION_SET_PREFERRED_SIZE: "APPLICATION_SET_PREFERRED_SIZE",
    CLIENT_SHOW_SHARE_UI: "CLIENT_SHOW_SHARE_UI",
    CHROME_READY: "CHROME_READY",
    FB_APP_CONNECTED: "FB_APP_CONNECTED",
    FB_APP_NOT_AUTHENTICATED: "FB_APP_NOT_AUTHENTICATED",
    FB_APP_UNKNOWN: "FB_APP_UNKNOWN",
    FB_CONNECTION_FAILURE: "FB_CONNECTION_FAILURE",
    USER_AUTHENTICATED: "USER_AUTHENTICATED",
    USER_AUTHENTICATION_FAILURE: "USER_AUTHENTICATION_FAILURE",
    WINDOW_FOCUS: "WINDOW_FOCUS",
    SCROLL_ALLOW: "SCROLL_ALLOW",
    SCROLL_BLOCK: "SCROLL_BLOCK",
    SUGGEST_SHOW: "SUGGEST_SHOW",
    SUGGEST_HIDE: "SUGGEST_HIDE",
    SUGGEST_SHOWN: "SUGGEST_SHOWN",
    SUGGEST_HIDDEN: "SUGGEST_HIDDEN",
    SOCIAL_DATA_SUCCESS: "SOCIAL_DATA_SUCCESS"
};
Spotify.Web.PopupWindow = function (g, f, d) {
    Spotify.Web.EventTarget.call(this);
    var b = this,
        g = g || {}, c = !1,
        a = null,
        h = g.width || 220,
        i = null,
        l = {
            url: g.url,
            id: g.id || null,
            wrapper: g.wrapper,
            iframe: g.iframe,
            preventScrolling: g.preventScrolling || !1,
            hideOnWindowResize: g.hideOnWindowResize || !1,
            postShowCallback: g.postShowCallback,
            postHideCallback: g.postHideCallback
        }, m = function (a) {
            if (a.source == l.iframe.contentWindow) switch (a = JSON.parse(a.data), a.type) {
                case "POPUP_WINDOW_CLOSE":
                    b.hide();
                    break;
                case "POPUP_WINDOW_RESIZE":
                    b.resize(a.height,
                    a.width)
            }
        }, n = function (a) {
            l.iframe.contentWindow.postMessage(JSON.stringify({
                type: a
            }), "*")
        };
    this.initialize = function () {
        if (!l.url) throw Error("Application URL not specified.");
        if (!l.iframe) {
            var a = document.createElement("iframe");
            a.setAttribute("id", "app-" + l.url);
            a.setAttribute("frameBorder", "no");
            a.style.width = "100%";
            a.style.height = "100%";
            l.iframe = a
        }
        if (!l.wrapper) l.wrapper = document.createElement("div"), l.wrapper.appendChild(l.iframe);
        l.iframe.src = l.url;
        window.addEventListener("message", m, !1);
        if (l.hideOnWindowResize) this.onWindowResize = this.onWindowResize.bind(this), window.addEventListener("resize", this.onWindowResize, !1);
        f.notify(Spotify.Web.PublisherMessages.APPLICATION_STATE_CHANGED, {
            link: Spotify.Link.applicationLink(l.id),
            iframe: l.iframe
        })
    };
    this.getFrame = function () {
        return l.iframe || null
    };
    this.onWindowResize = function () {
        this.hide()
    };
    this.getElement = function () {
        return l.wrapper
    };
    this.getWidth = function () {
        return h
    };
    this.getUrl = function () {
        return l.url
    };
    this.updateSize = function () {
        if (c) l.wrapper.style.width = h + "px", l.wrapper.style.height = a + "px"
    };
    this.resize = function (b, c) {
        a = b;
        if (c && (h = c, i)) l.wrapper.style.left = i - c / 2 + "px";
        this.updateSize()
    };
    this.isVisible = function () {
        return c
    };
    this.show = function (a) {
        if (!c) {
            this.trigger("onBeforeShow");
            try {
                c = !0;
                this.updateSize();
                if (a) l.wrapper.style.left = a.left + "px", a.direction == "top" ? (l.wrapper.style.bottom = "auto", l.wrapper.style.top = a.top + "px") : (l.wrapper.style.top = "auto", l.wrapper.style.bottom = a.bottom + "px"), l.wrapper.className = "popup-area", l.wrapper.addClass(a.direction), l.wrapper.addClass(a.arrow),
                i = a.arrowLeft;
                l.wrapper.addClass("show");
                l.wrapper.id === "suggest-area" && (l.wrapper.addClass("scale-start"), setTimeout(function () {
                    l.wrapper.addClass("scale-end")
                }, 100), Spotify.Web.Utils.addTransitionEndedListener(l.wrapper, function () {
                    l.wrapper.removeClass("scale-start").removeClass("scale-end")
                }, 2E3));
                Browser.firefox && this.getElement().id === g.id + "-area" && document.activeElement.blur();
                g.showMessage && f.notify(g.showMessage);
                l.preventScrolling && f.notify(Spotify.Web.PublisherMessages.SCROLL_BLOCK);
                l.postShowCallback && l.postShowCallback();
                n("WINDOW_FOCUS")
            } finally {
                this.trigger("onAfterShow")
            }
        }
    };
    this.hide = function () {
        if (c) c = !1, l.wrapper.removeClass("show"), l.wrapper.style.height = "", g.hideMessage && f.notify(g.hideMessage), l.postHideCallback && l.postHideCallback();
        window.focus();
        n("WINDOW_CLOSED");
        setTimeout(function () {
            l.preventScrolling && !d.anyPopupVisible() && f.notify(Spotify.Web.PublisherMessages.SCROLL_ALLOW)
        }, 250)
    }
};
Spotify.Web.PopupManager = function (g, f, d) {
    var b = this,
        c = {}, a = {}, h = !1,
        i = function () {
            h = !0
        }, l = function () {
            setTimeout(function () {
                h = !1
            }, 250)
        };
    this.registerPopup = function (h, n) {
        var o = d.ownerDocument.createElement("div");
        o.className = "popup-area";
        o.setAttribute("id", h + "-area");
        var k = d.ownerDocument.createElement("iframe");
        k.setAttribute("id", h);
        k.setAttribute("tabindex", "-1");
        k.setAttribute("frameborder", "0");
        k.setAttribute("scrolling", "no");
        k.setAttribute("allowTransparency", "true");
        o.appendChild(k);
        d.appendChild(o);
        o = new Spotify.Web.PopupWindow({
            url: g.getAppUrl("/" + h + "/"),
            id: h,
            wrapper: o,
            iframe: o.querySelectorAll("iframe")[0],
            hideMessage: n.hideMessage,
            showMessage: n.showMessage,
            preventScrolling: n.preventScrolling,
            hideOnWindowResize: n.hideOnWindowResize,
            width: n.width
        }, f, b);
        o.resize(200);
        c[h] = o;
        a[o.getFrame().id] = o;
        o.bind("onBeforeShow", i);
        o.bind("onAfterShow", l)
    };
    this.anyPopupVisible = function () {
        for (var a in c) if (c[a].isVisible()) return !0;
        return !1
    };
    this.initializePopups = function () {
        for (var a in c) c[a].initialize()
    };
    this.popup = function (a, b) {
        var g = parseInt(a.args[0], 10),
            h = parseInt(a.args[1], 10),
            i = parseInt(a.args[2], 10),
            l = parseInt(a.args[3], 10);
        if (!g || !h) throw Error("popup can only be triggered for popup URIs");
        if (!b) throw Error("unknown origin");
        var s = c[a.id];
        if (!s) throw Error("cannot find popup with id", a.id);
        var t = Spotify.Web.Utils.getWindowPosition(b),
            y, w;
        g += t.left;
        y = h + t.top;
        w = 0;
        var v = "top",
            x = "middle",
            D = d.ownerDocument.body.offsetWidth,
            A = s.getWidth();
        g -= A / 2 - i / 2;
        y += l + 10;
        y + 300 > window.innerHeight && window.innerHeight > 500 && (w = window.innerHeight - (h + t.top) + 10, v = "bottom");
        g + A > D && (g = D - A - 10, x = "right");
        a.args.splice(0, 4);
        f.notify(Spotify.Web.PublisherMessages.APPLICATION_STATE_CHANGED, {
            link: a,
            iframe: s.getFrame()
        });
        s.show({
            left: g,
            top: y,
            bottom: w,
            arrowLeft: g + A / 2,
            direction: v,
            arrow: x
        })
    };
    this.closeAll = function () {
        if (!h) for (var a in c) c[a].isVisible() && c[a].hide()
    };
    this.onNotify = function (b) {
        var c = b.message;
        switch (b.messageType) {
            case Spotify.Web.PublisherMessages.APPLICATION_SET_PREFERRED_SIZE:
                if (b = a[c.origin.id]) b.resize(c.height,
                c.width), c.callback(c.width, c.height)
        }
    };
    f.subscribe(Spotify.Web.PublisherMessages.APPLICATION_SET_PREFERRED_SIZE, b)
};
Spotify.Web.Window = function (g) {
    Spotify.Web.EventTarget.call(this);
    var f = this,
        g = g || {}, d = g.url,
        b = g.iframe,
        c = function (a) {
            d.indexOf(a.origin) === 0 && a.origin !== "" && f.trigger("onMessage", a.data)
        };
    this.initialize = function () {
        if (!d) throw Error("Application URL not specified.");
        if (!b) {
            var a = document.createElement("iframe");
            a.setAttribute("frameBorder", "no");
            a.style.width = "100%";
            a.style.height = "100%";
            b = a
        }
        window.addEventListener("message", c);
        a = "app-" + Spotify.Web.Utils.appNameFromUrl(d);
        b.setAttribute("id", a);
        b.src = d
    };
    this.getElement = function () {
        return b
    };
    this.getUrl = function () {
        return d
    };
    this.show = function () {
        b.style.display = "block"
    };
    this.hide = function () {
        b.style.display = "none"
    }
};
Spotify.Web.URLParser = function () {
    var g = {}, f = /^(?:(\w+):)?(?:\/\/(?:(?:([^:@\/]*):?([^:@\/]*))?@)?([^:\/?#]*)(?::(\d*))?)?(\.\.?$|(?:[^?#\/]*\/)*)([^?#]*)(?:\?([^#]*))?(?:#(.*))?/;
    g.parseURL = function (d, b) {
        var d = b ? d.match(f) : decodeURI(d).match(f),
            c = {
                protocol: d[1] || null,
                user: d[2] || null,
                domain: d[4] || null,
                query: d[8] || null,
                port: d[5] || null,
                hash: d[9] || null,
                path: ((d[6] || "") + (d[7] || "")).replace(/^\/|\/$/g, "") || null,
                url: d[0]
            };
        if (c.path) c.pathSegments = c.path.replace(/^\/|\/$/g, "").split("/");
        if (c.hash) c.hashSegments = c.hash.replace(/^\/|\/$/g, "").split("/");
        if (c.query) {
            c.params = {};
            for (var a = /([^=&]+)\=([^=&]+)/g, g = a.exec(c.query); g;) c.params[g[1]] = g[2], g = a.exec(c.query)
        }
        return c
    };
    g.isRoot = function (d) {
        return (d = g.parseURL(d)) && d.path === null
    };
    return g
}();
Spotify.Web.Notification = function (g) {
    Spotify.Web.EventTarget.call(this);
    var g = g || {}, f = g.message || "",
        d = g.id || null,
        b = g.timeout,
        c = this,
        a = null;
    this.initialize = function () {
        a = document.createElement("div");
        var b = document.createElement("p");
        b.innerHTML = f;
        var d = document.createElement("div");
        d.onclick = function () {
            c.trigger("onclose", {})
        };
        a.appendChild(b);
        a.appendChild(d)
    };
    this.getElement = function () {
        return a
    };
    this.getId = function () {
        return d
    };
    this.getTimeout = function () {
        return b
    };
    this.setWidth = function (b) {
        a.style.width =
            "" + b + "px";
        a.style.position = "relative";
        a.style.left = [300 - b, "px"].join("")
    }
};
Spotify.Web.NotificationArea = function (g) {
    var g = g || {}, f = g.element || {}, d = null,
        b = [],
        c = {}, a = function (a) {
            if (a) return c[a]
        }, h = function (a) {
            var f = b.indexOf(a);
            f > -1 && (b.splice(f, 1), d.removeChild(a.getElement()), a.getId() && delete c[a.getId()])
        }, i = function (a) {
            b.push(a);
            d.appendChild(a.getElement());
            a.getId() && (c[a.getId()] = a);
            a.getTimeout() && setTimeout(function () {
                h(a)
            }, a.getTimeout())
        };
    this.initialize = function () {
        d = f;
        if (d === null) throw Error("Spotify.Web.NotificationArea element not found");
    };
    this.show = function (b) {
        var c;
        c = a(b.id);
        if (!c) return c = new Spotify.Web.Notification(b), c.initialize(), b.width && c.setWidth(b.width), c.bind("onclose", function (a) {
            h(a.sender)
        }), i(c), c
    };
    this.hide = function (b) {
        (b = a(b)) && h(b)
    }
};
Spotify.Web.Dialog = function (g) {
    var g = g || {}, f = g.element,
        d = !1,
        b = function () {
            c()
        }, c;
    this.initialize = function () {
        if (!f) throw Error("Spotify.Web.Dialog element not specified");
        f.querySelector("button").onclick = b
    };
    this.show = function (a) {
        var b = f.querySelector("p");
        b.innerHTML = a.message;
        b.className = a.className;
        var b = f.querySelector("button"),
            g = f.querySelector(".buttonContainer");
        a.button ? (b.innerHTML = a.button, c = a.action, g.style.display = "block") : g.style.display = "none";
        f.style.display = "block";
        d = !0
    };
    this.hide = function () {
        f.style.display = "none";
        d = !1
    };
    this.isVisible = function () {
        return d
    }
};
Spotify.Web.ErrorTypes = {
    SESSION_LOST: "SESSION_LOST",
    TOKEN_LOST: "TOKEN_LOST",
    NO_SOUND_CAPABILITIES: "NO_SOUND_CAPABILITIES",
    AD_BLOCK_DETECTED: "AD_BLOCK_DETECTED",
    CONNECTION_RESTORED: "CONNECTION_RESTORED",
    HEARTBEAT: "HEARTBEAT",
    CONNECTION_LOST: "CONNECTION_LOST",
    CONNECTING: "CONNECTING",
    TRACK_NOT_PLAYABLE: "TRACK_NOT_PLAYABLE",
    WAIT_FOR_COMMERCIAL_TO_FINISH: "WAIT_FOR_COMMERCIAL_TO_FINISH",
    FLASH_NOT_AVAILABLE: "FLASH_NOT_AVAILABLE",
    FB_CONNECTING_TO: "FB_CONNECTING_TO",
    FB_CONNECTION_FAILED: "FB_CONNECTION_FAILED",
    APPLICATION_RELOAD_NEEDED: "APPLICATION_RELOAD_NEEDED",
    UNCAUGHT_EXCEPTION: "UNCAUGHT_EXCEPTION",
    BOOKMARK: "BOOKMARK"
};
Spotify.Web.ErrorMessages = {
    FLASH_NOT_AVAILABLE: {
        message: _("To enjoy Spotify, please install Adobe Flash. It's free."),
        className: "normal",
        button: _("Get Flash"),
        action: function () {
            window.open("http://get.adobe.com/flashplayer/")
        }
    },
    SESSION_LOST: {
        message: _("Session lost. Please login again."),
        className: "normal",
        button: _("Login"),
        action: function () {
            location.href = "/login/"
        }
    },
    NO_SOUND_CAPABILITIES: {
        message: _("Your computer doesn't support audio."),
        className: "normal",
        button: _("Exit"),
        action: function () {
            window.open("/login/")
        }
    },
    APPLICATION_RELOAD_NEEDED: {
        message: _("There's a new version of Spotify available. Please reload the page."),
        className: "normal",
        button: _("Reload"),
        action: function () {
            window.location.reload()
        }
    },
    CONNECTING: {
        message: _('Connecting to Spotify...<br /><span class="indicator"></span>'),
        className: "indicator"
    },
    CONNECTION_LOST: {
        message: _('Can\'t connect to Spotify. Trying again now...<br /><span class="indicator"></span>'),
        className: "indicator"
    },
    FB_CONNECTING_TO: {
        message: _('Connecting to Facebook...<br /><span class="indicator"></span>'),
        className: "indicator"
    },
    FB_CONNECTION_FAILED: {
        message: _('We\'re sorry but connection to Facebook is not working. Please, try to <a href="/">login using main page.</a>'),
        className: "indicator"
    }
};
Spotify.Web.Error = function (g) {
    var g = g || {}, f = g.publisher,
        d = g.element,
        b = g.dialog,
        c = g.timeout,
        a = null,
        h = null;
    this.initialize = function () {
        if (!f) throw Error("Spotify.Web.Error - Publisher instance is missing");
        if (!d) throw Error("Spotify.Web.Error container not specified");
        if (!b) throw Error("Spotify.Web.Error dialog element not specified");
        a = new Spotify.Web.NotificationArea({
            element: d
        });
        a.initialize();
        h = new Spotify.Web.Dialog({
            element: b
        });
        h.initialize();
        f.subscribe(Spotify.Web.PublisherMessages.ERROR, this)
    };
    this.onNotify = function (b) {
        var b = b.message,
            d = Spotify.Web.ErrorTypes,
            f = Spotify.Web.ErrorMessages;
        switch (b.type) {
            case d.TRACK_NOT_PLAYABLE:
                switch (b.response) {
                    case "Rate limit reached":
                        d = _("Sorry, but you've reached your track limit.");
                        break;
                    case "Song only on storage":
                        d = _("Sorry, but this track is not yet available.");
                        break;
                    case "Track restricted":
                        d = _("Sorry, but this track is not yet available in your country.");
                        break;
                    default:
                        d = _("Track is currently not available")
                }
                a.show({
                    message: d,
                    id: b.type + "_" + b.trackUri,
                    timeout: c
                });
                break;
            case d.WAIT_FOR_COMMERCIAL_TO_FINISH:
                d = _("This song will be played after this commercial");
                a.show({
                    message: d,
                    id: b.type,
                    timeout: c
                });
                break;
            case d.SESSION_LOST:
                h.show(f.SESSION_LOST);
                break;
            case d.TOKEN_LOST:
                d = _("Spotify has been paused because your account is in use somewhere else.");
                a.show({
                    message: d,
                    id: "token_lost",
                    timeout: c
                });
                break;
            case d.AD_BLOCK_DETECTED:
                d = _("For the best Spotify experience, please disable adblock.");
                a.show({
                    message: d,
                    id: "adblocker_detected",
                    timeout: c + 1E4
                });
                break;
            case d.BOOKMARK:
                d = _("<strong>Drag this button to your Bookmarks Bar</strong> to easily be able to get back to the Spotify Web Player:");
                d += '<a id="bookmark-btn" href="https://play.spotify.com/?utm_source=spotify&utm_medium=webplayer&utm_campaign=bookmark" onclick="return false;">Spotify Web Player</a>';
                a.show({
                    message: d,
                    id: "bookmark_notification",
                    timeout: c + 2E4,
                    width: 370
                });
                break;
            case d.NO_SOUND_CAPABILITIES:
                h.show(f.NO_SOUND_CAPABILITIES);
                break;
            case d.FLASH_NOT_AVAILABLE:
                h.show(f.FLASH_NOT_AVAILABLE);
                break;
            case d.APPLICATION_RELOAD_NEEDED:
                h.show(f.APPLICATION_RELOAD_NEEDED);
                break;
            case d.CONNECTION_LOST:
                h.show(f.CONNECTION_LOST);
                break;
            case d.CONNECTING:
                h.show(f.CONNECTING);
                break;
            case d.FB_CONNECTING_TO:
                h.show(f.FB_CONNECTING_TO);
                break;
            case d.FB_CONNECTION_FAILED:
                h.hide(f.FB_CONNECTING_TO);
                h.show(f.FB_CONNECTION_FAILED);
                break;
            case d.CONNECTION_RESTORED:
                h.hide(f.CONNECTION_LOST);
                h.hide(f.CONNECTING);
                break;
            default:
                a.hide(b.type)
        }
    }
};
Spotify.Web.FeatureDetect = new function () {
    return {
        testWebSockets: function () {
            return window.WebSocket
        },
        testHTML5Audio: function () {
            var g = document.createElement("audio");
            return !(!g.canPlayType || !g.canPlayType("audio/mpeg;").replace(/no/, ""))
        },
        getFlashVersion: function () {
            return swfobject.getFlashPlayerVersion()
        },
        hasFlashMin: function () {
            return swfobject.hasFlashPlayerVersion("9")
        },
        adBlockCheck: function () {
            var g = document.getElementById("ads");
            if (g) {
                if (g.offsetHeight === 0) return !0
            } else return !0;
            document.body.removeChild(g);
            return !1
        }
    }
};
Spotify.Web.Menu = function (g) {
    Spotify.Web.EventTarget.call(this);
    var f = this,
        g = g || {}, d = g.publisher,
        b = g.elements,
        c = g.defaultId || "",
        a = {}, h = !1,
        i = null,
        l = null,
        m = null,
        n = null,
        o = function (b) {
            b || (b = c);
            for (var d = 0; d < a.length; d++) a[d].className = a[d].getAttribute("id") !== "nav-" + b ? "" : "current"
        }, k = function (a) {
            a.onmousedown = function () {
                if (h) {
                    var b = a.getAttribute("data-href");
                    f.trigger("onAppOpen", {
                        id: b
                    })
                }
            }
        }, p = function () {
            h = !0;
            for (var b = 0; b < a.length; b++) a[b].className = a[b].className.indexOf("current") === -1 ? "" : "current"
        },
        q = function (a) {
            if (!l) return !1;
            if (!n && a.image !== "") {
                var b = new Image;
                b.onload = function () {
                    l.appendChild(this);
                    setTimeout(function () {
                        b.className = "show"
                    }, 10)
                };
                n = b.src = a.image
            }
            if (!m && a.name !== "") m = l.textContent = a.name;
            m && n && (l.parentNode.className += " show")
        };
    this.initialize = function () {
        if (!d) throw Error("Publisher instance not specified.");
        if (!b) throw Error("List of DOMElements not specified.");
        a = b;
        d.subscribe(Spotify.Web.PublisherMessages.APPLICATION_STATE_CHANGED, this);
        d.subscribe(Spotify.Web.PublisherMessages.APPLICATION_ENABLED,
        this);
        d.subscribe(Spotify.Web.PublisherMessages.SUGGEST_SHOWN, this);
        d.subscribe(Spotify.Web.PublisherMessages.SUGGEST_HIDDEN, this);
        d.subscribe(Spotify.Web.PublisherMessages.SOCIAL_DATA_SUCCESS, this);
        for (var c = 0; c < a.length; c++) a[c].id === "nav-profile" ? l = a[c] : k(a[c]);
        g.logo.onmousedown = function () {
            f.trigger("onAppOpen", {
                id: this.getAttribute("data-href")
            })
        }
    };
    this.highlightMenu = function (a) {
        i = a;
        o(a)
    };
    this.onNotify = function (a) {
        switch (a.messageType) {
            case Spotify.Web.PublisherMessages.SUGGEST_SHOWN:
                o("search");
                break;
            case Spotify.Web.PublisherMessages.SUGGEST_HIDDEN:
                o(i);
                break;
            case Spotify.Web.PublisherMessages.APPLICATION_ENABLED:
                p();
                break;
            case Spotify.Web.PublisherMessages.SOCIAL_DATA_SUCCESS:
                q(a.message)
        }
    };
    this.disable = function () {
        h = !1;
        for (var b = 0; b < a.length; b++) a[b].className = "disabled"
    };
    this.enable = function () {
        p()
    }
};
Spotify.Web.SettingsPopup = function (g) {
    Spotify.Web.EventTarget.call(this);
    var f = this;
    this._wrapper = g.wrapper;
    this._trigger = g.trigger;
    this._isOpen = !1;
    this.open = function () {
        if (!f._isOpen) f._wrapper.className += " show", f._trigger.className = "active", f._isOpen = !0, f._wrapper.focus(), f._trigger.removeEventListener("click", b, !1), window.addEventListener("keydown", d, !1)
    };
    this.close = function () {
        if (f._isOpen) f._wrapper.className = f._wrapper.className.replace("show", ""), f._trigger.className = "", f._isOpen = !1, window.removeEventListener("keydown",
        d, !1), setTimeout(function () {
            f._trigger.addEventListener("click", b, !1)
        }, 200)
    };
    var d = function (a) {
        a.keyCode === 27 && f.close()
    }, b = function (a) {
        a.preventDefault();
        f._isOpen ? f.close() : f.open()
    }, c = function () {
        f._trigger.addEventListener("click", b, !1);
        var a = f._wrapper.getElementById("about-link");
        a && a.addEventListener("click", function (a) {
            a.preventDefault();
            f.trigger("onAppOpen", {
                id: this.getAttribute("data-href")
            });
            f._wrapper.blur()
        }, !1);
        f._wrapper.addEventListener("blur", function () {
            setTimeout(function () {
                f.close()
            },
            250)
        }, !1)
    };
    this.initialize = function () {
        c()
    }
};
Spotify.Web.Credentials = function (g) {
    var f = this,
        d = null,
        b = 0;
    this.cache = function (c, a) {
        b = (new Date).getTime() + a * 1E3;
        d = c
    };
    this.get = function (c, a) {
        var h = (new Date).getTime();
        d && b > h ? c(d) : (new Request({
            url: g,
            method: "post",
            onSuccess: function (a) {
                a = JSON.parse(a);
                !a.config || !a.config.credentials ? window.location = "/logout/" : (f.cache(a.config.credentials[0], a.config.credentials[1]), c(a.config.credentials[0]))
            },
            onFailure: a,
            onException: a
        })).send()
    }
};
Spotify.Web.Tracking = function (g, f, d) {
    window._gaq = window._gaq || [];
    var b = this,
        c = function () {
            b.errors({
                type: Spotify.Web.ErrorTypes.HEARTBEAT
            })
        };
    this.initialize = function () {
        if (d.gaId) {
            _gaq.push(["_setAccount", d.gaId]);
            f.loadScript("//ssl.google-analytics.com/ga.js");
            var a = g.subscribe,
                b = Spotify.Web.PublisherMessages;
            a(b.APPLICATION_STATE_PUSH, this);
            a(b.ERROR, this);
            a(b.CHROME_READY, this);
            a(b.WINDOW_FOCUS, this);
            setInterval(c, 12E4)
        }
    };
    this.onNotify = function (a) {
        var b = a.message,
            c = Spotify.Web.PublisherMessages;
        switch (a.messageType) {
            case c.APPLICATION_STATE_PUSH:
                this.pageView(b.url);
                break;
            case c.WINDOW_FOCUS:
                this.event("Window", a.messageType, b.type, 0, !0);
                break;
            case c.CHROME_READY:
                this.xhrLog(a.messageType);
                break;
            case c.ERROR:
                this.errors(b)
        }
    };
    this.pageView = function (a) {
        _gaq.push(["_trackPageview", a])
    };
    this.event = function (a, b, c, d, f) {
        _gaq.push(["_trackEvent", a, b, c, d, f])
    };
    this.handleException = function (a, c, d, f, g) {
        a = "/ga-log/exc/" + a + "/" + escape(c) + "/" + escape(f) + "/" + g + "/";
        b.pageView(a)
    };
    this.xhrLog = function (a) {
        (new Request({
            url: "/xhr/json/log.php",
            method: "get"
        })).send("type=" + a + "&t=" + (new Date).getTime())
    };
    this.errors = function (a) {
        var b = "",
            c = "",
            b = Spotify.Web.ErrorTypes,
            d = a.type;
        switch (d) {
            case b.CONNECTION_LOST:
            case b.FLASH_NOT_AVAILABLE:
            case b.AD_BLOCK_DETECTED:
            case b.FB_CONNECTION_FAILED:
                this.xhrLog(d)
        }
        switch (d) {
            case b.CONNECTING:
            case b.CONNECTION_LOST:
            case b.CONNECTION_RESTORED:
                b = "ap";
                break;
            case b.FLASH_NOT_AVAILABLE:
                b = "browser";
                break;
            case b.APPLICATION_RELOAD_NEEDED:
                b = "server";
                break;
            case b.TRACK_NOT_PLAYABLE:
                b = "playback";
                c = a.trackUri;
                break;
            case b.FB_CONNECTING_TO:
            case b.FB_CONNECTION_FAILED:
                b = "fb";
                break;
            default:
                b = "general"
        }
        this.pageView("/ga-log/err/" + b + "/" + d + "/" + c)
    }
};
Spotify.Web.Logger = function () {
    this.fallbackToAlert = this.enabled = !1;
    this.consoleUnavailable = typeof console === "undefined" || typeof console.log === "undefined"
};
Spotify.Web.Logger.prototype.log = function () {
    this.writeOut("log", arguments)
};
Spotify.Web.Logger.prototype.dir = function () {
    this.writeOut("dir", arguments)
};
Spotify.Web.Logger.prototype.warn = function () {
    this.writeOut("warn", arguments)
};
Spotify.Web.Logger.prototype.error = function () {
    this.writeOut("error", arguments)
};
Spotify.Web.Logger.prototype.info = function () {
    this.writeOut("info", arguments)
};
Spotify.Web.Logger.prototype.writeOut = function (g, f) {
    if (this.enabled) if (this.consoleUnavailable) this.fallbackToAlert && alert(g + ":" + Array.prototype.slice.call(f).join());
    else console[g](Array.prototype.slice.call(f))
};
Spotify.Web.Services = function (g, f, d, b, c) {
    if (!g) throw Error("Service.Metadata instance required");
    if (!f) throw Error("Service.Playlist instance required");
    var a, h = function (a) {
        a = Spotify.Utils.Base62.fromHex(a);
        a.length === 21 && (a = "0" + a);
        return a
    }, i = function (a, b, c, d) {
        if (a === b) d(!0, c);
        else g.onReady(function () {
            try {
                g.lookup(b, function (b) {
                    b = "spotify:track:" + h(b.id);
                    d(a === b, c)
                }, function () {})
            } catch (f) {}
        })
    };
    this.getAlbumForTrack = function (a, b, c) {
        g.onReady(function () {
            try {
                g.lookup(a, function (a) {
                    a = h(a.album.id);
                    b(a)
                }, c)
            } catch (d) {
                c(d)
            }
        })
    };
    this.getTrackIndexInAlbum = function (a, b, c) {
        g.onReady(function () {
            try {
                g.lookup(a, function (a) {
                    for (var d = 0, f = 0; f < a.disc.length; f++) for (var g = a.disc[f], i = 0; i < g.track.length; i++) {
                        if (h(g.track[i].id) === b) {
                            c(d);
                            return
                        }
                        d += 1
                    }
                    c(-1)
                }, function () {
                    c(-1)
                })
            } catch (d) {}
        })
    };
    this.getTrackIndexInPlaylist = function (a, b, c) {
        f.list({
            uri: a
        }, function (a) {
            for (var d = a.contents.length, f = !1, g = 0; g < a.contents.length; g++) if (a.contents[g].id !== void 0) {
                var l = h(a.contents[g].id);
                i("spotify:track:" + b, "spotify:track:" + l, {
                    index: g
                }, function (a, b) {
                    a ? (f = !0, c(b.index)) : (d -= 1, !f && d === 0 && c(-1))
                })
            }
        }, function () {
            c(-1)
        })
    };
    this.getUsername = function (b) {
        if (a) b(a);
        else d.onReady(function () {
            d.getUserInfo(function (c) {
                a = c.response.user;
                b(a)
            }, function () {
                b(null)
            })
        })
    };
    this.getSocialDataForCurrentUser = function (a) {
        this.getUsername(function (c) {
            if (!c) return a(null);
            b.onReady(function () {
                b.getUsers([c], void 0, function (b) {
                    a(b[0])
                }, function () {
                    a(null)
                })
            })
        })
    };
    this.isOwnPlaylist = function (a, b) {
        this.getUsername(function (c) {
            a.type === "application" && a.id === "user" && a.args[0] === c ? b(!0) : a.type === "application" && a.id === "playlist" && a.args[0] === c ? b(!0) : b(!1)
        })
    };
    this.getFacebookUserId = function (a) {
        this.getUsername(function (b) {
            b ? c.loadSchemaData(["message UserRequest {\n  repeated string usernames = 1;\n}\nmessage UserIdentifier {\n  optional string username = 1;\n  optional string facebook_uid = 2;\n  optional bool deleted = 3 [default = false];\n}"], function (d) {
                c.send("hm://username/splookup", "GET", [d + "#UserRequest"], [d + "#UserIdentifier", d + "#UserIdentifier"], [{
                    usernames: [b]
                }], function (b, c) {
                    c === 200 ? a(b[0].facebook_uid) : a(null)
                }, function () {
                    a(null)
                }, !0, !0)
            }, function () {
                a(null)
            }) : a(null)
        })
    }
};
Spotify.Web.AutoPlay = function (g, f, d) {
    var b = [new Spotify.Web.FacebookURLSchema, new Spotify.Web.OpenURLSchema],
        c = new g.Responder({
            playContext: function (a, b) {
                b === void 0 && (b = -1);
                this.trigger("play_context", {
                    origin: Spotify.Web.Utils.spotifyUriToOrigin(a),
                    args: [0, a, b, 0, "autoplay"]
                }, function () {}, function () {})
            },
            pause: function () {
                this.trigger("player_pause", {
                    args: ["main"]
                }, function () {}, function () {})
            },
            resume: function () {
                this.trigger("player_play", {
                    args: ["main"]
                }, function () {}, function () {})
            },
            play: function (a, b, c,
            g) {
                var m = this,
                    n, o;
                try {
                    n = f.fromString(a), o = n.toURI()
                } catch (k) {
                    return null
                }
                switch (n.type) {
                    case "track":
                        d.getAlbumForTrack(o, function (a) {
                            var a = "spotify:album:" + a,
                                b = o.split(":")[2];
                            d.getTrackIndexInAlbum(a, b, function (b) {
                                m.playContext(a, b);
                                c()
                            })
                        }, g);
                        break;
                    case "playlist":
                        b ? d.getTrackIndexInPlaylist(o, b, function (a) {
                            m.playContext(o, a);
                            c()
                        }) : (this.playContext(o), c());
                        break;
                    case "album":
                        b ? d.getTrackIndexInAlbum(o, b, function (a) {
                            m.playContext(o, a);
                            c()
                        }) : (this.playContext(o), c());
                        break;
                    case "artist":
                        this.playContext(o +
                            ":top:tracks");
                        c();
                        break;
                    case "artist-toplist":
                        this.playContext(o), c()
                }
            }
        });
    this.shouldPlay = function (a) {
        for (var c = !1, d = 0; d < b.length; d++) if (b[d].shouldPlay(a)) {
            c = !0;
            break
        }
        return c
    };
    this.play = function (a, b, d, f) {
        c.play(a, b, d, f)
    };
    this.pause = function () {
        c.pause()
    };
    this.resume = function () {
        c.resume()
    };
    this.playUrl = function (a, c, d) {
        for (var f = 0; f < b.length; f++) if (b[f].playUrl(a, this.play, c, d)) break
    };
    this.getUrl = function (a, c) {
        for (var f, g = 0; g < b.length; g++) if (f = b[g].getUrl(a), b[g].shouldPlay(a)) break;
        (g = Spotify.Web.Utils.decodeOpenGraphUrl(f)) && g.context === "track" ? d.getAlbumForTrack("spotify:track:" + g.contextId, function (a) {
            var b = Spotify.Web.URLParser.parseURL(f);
            c(b.protocol + "://" + b.domain + "/album/" + a)
        }) : c(f)
    }
};
Spotify.Web.Exceptions = function () {
    Spotify.EventTarget.call(this);
    var g = this,
        f = [],
        d = function (b, c, a, d, i) {
            for (var l = 0; l < f.length; l++) {
                try {
                    f[l].call(this, b, c, a, d, i)
                } catch (m) {}
                g.trigger(Spotify.Web.ErrorTypes.UNCAUGHT_EXCEPTION, {
                    module: b,
                    message: c + " " + a,
                    url: d,
                    lineNumber: i
                })
            }
            return !0
        };
    this.addHandler = function (b) {
        f.push(b)
    };
    this.bindWindow = function (b, c) {
        b.onerror = function (a, b, f) {
            b === "" && (b = History.getPageUrl());
            b = Spotify.Web.URLParser.parseURL(b).path;
            d(c, a, "", b, f)
        }
    };
    this.logError = function (b, c, a) {
        d(b, c,
        a, "", "")
    }
};
Spotify.Web.Router = function (g, f) {
    Spotify.Web.EventTarget.call(this);
    var d = f.settings.dominoFlags && f.settings.dominoFlags.discover ? "spotify:app:discover" : "spotify:app:home",
        b = this,
        c;
    this.EVENT_TRACK_URI_ROUTED = "TRACK_URI_ROUTED";
    this.setServices = function (a) {
        c = a
    };
    this.openUri = function (a, d, f) {
        var l = a.toURI();
        if (l.indexOf("%40") !== -1 && l.indexOf("spotify:app:search") !== 0) c.getUsername(function (c) {
            a = Spotify.Link.fromString(l.replace("%40", c));
            b.openUri(a, d, f)
        });
        else if (a.type !== "application" && (a = a.toAppLink()),
        f = f || !1, d = d || "", a.type === "application" && a.id === "track") {
            var m = Spotify.Link.fromString("spotify:track:" + a.args[0]);
            this.trigger(this.EVENT_TRACK_URI_ROUTED, {
                link: m
            });
            c.getAlbumForTrack(m.toURI(), function (a) {
                a = ["spotify:album", a].join(":");
                a = Spotify.Link.fromString(a).toAppLink();
                g.openUri(a, d, f)
            }, function () {})
        } else g.openUri(a, d, f)
    };
    this.getAppUrl = function (a) {
        if (!a) a = f.defaultState.url;
        var b = f.settings.apps,
            c = f.settings.apps.versions,
            d = "";
        a.charAt(0) === "/" && (a = a.substr(1, a.length - 1));
        var g = a.split("/"),
            a = g[0];
        if (a === "user" && (g[2] === "playlist" || g[2] === "starred" || g[2] === "toplist")) a = "playlist";
        c[a] !== null && (d = "/" + c[a] + "/");
        c = "";
        f.settings.apps.cacheBuster && (c = "?v=" + f.settings.apps.cacheBuster);
        return b.protocol + "://" + b.prefixes[a] + "-" + a + "." + b.domain + d + c
    };
    this.openInitialUrl = function (a, c, f) {
        var g = Spotify.Web.Utils.openGraphUrlToSpotifyUri(a);
        g === "" && (g = d);
        if (g.indexOf(":app:") === -1 || g.indexOf(":app:search" !== -1)) this.openUri(Spotify.Link.fromString(d).toAppLink(), "", !1), g = Spotify.Link.fromString(g).toAppURI();
        c.init(f.user, g, function () {
            b.openUri(Spotify.Link.fromString(g).toAppLink(), "", !1)
        })
    }
};
Spotify.Web.Router.History = function (g, f) {
    Spotify.Web.EventTarget.call(this);
    var d = ["play", "ap", "websockets"],
        b = this,
        c = 0,
        a = 0,
        h = function () {
            var d = f.getState();
            b.trigger("pageChange", {
                url: d.url
            });
            if (a > 0) a -= 1;
            else {
                var h = d.data.index,
                    d = 0,
                    m = "undo";
                h > c ? (d = h - c, m = "redo") : h < c && (d = -(c - h));
                c = h;
                for (h = 0; h < Math.abs(d); h += 1) m === "undo" ? g.undo() : g.redo()
            }
        };
    this.getAddressBarUrl = function () {
        var a = f.getPageUrl(),
            b = a.indexOf("?"),
            c = b > -1,
            g = !1,
            h;
        for (h in d) if (a.indexOf("?" + d[h] + "=") > -1) {
            g = !0;
            break
        }
        c && !g && (a = a.substr(0, b));
        return a
    };
    this.push = function (b) {
        var d = "/" + b.toURLPath();
        c += 1;
        a += 1;
        f.pushState({
            index: c,
            link: b
        }, "", d)
    };
    this.replace = function (a) {
        url = "/" + a.toURLPath();
        f.replaceState({
            index: c,
            link: a
        }, "", url)
    };
    (function () {
        f.Adapter.bind(window, "statechange", h, this)
    })()
};
Spotify.Web.StateHistory = {};
Spotify.Web.StateHistory.Commands = {};
Spotify.Web.StateHistory.CommandTypes = {
    EMPTY: "EMPTY",
    SHOW_SECTION: "SHOW_SECTION",
    UPDATE_APP_ARGUMENTS: "UPDATE_APP_ARGUMENTS",
    PUSH: "PUSH",
    POP: "POP",
    MOVE_VIEWPORT: "MOVE_VIEWPORT",
    COMPOSED_COMMAND: "COMPOSED_COMMAND",
    UPDATE_VIEWPORT_BEGIN: "UPDATE_VIEWPORT_BEGIN",
    UPDATE_VIEWPORT_END: "UPDATE_VIEWPORT_END",
    BROWSER_HISTORY_PUSH_URL: "BROWSER_HISTORY_PUSH_URL"
};
Spotify.Web.StateHistory.Manager = function (g, f) {
    Spotify.Web.EventTarget.call(this);
    if (typeof g === "undefined") throw Error("No arguments were supplied while initializing the State History Manager class.");
    this.activeSection = null;
    var d = this,
        b = {}, c = f,
        a = new Spotify.Web.StateHistory.Stack,
        h = new Spotify.Web.StateHistory.Stack,
        i = function (a) {
            this.activeSection = b[a.params.id]
        }, l = function (a, b) {
            a.execute(function (a) {
                b && a.type === Spotify.Web.StateHistory.CommandTypes.BROWSER_HISTORY_PUSH_URL && d.trigger("onBrowserHistoryPush", {
                    link: a.link
                });
                d.trigger("doCommand", {
                    command: a
                })
            })
        }, m = function (a) {
            var a = new Spotify.Web.StateHistory.App(d.activeSection.id, d.activeSection.viewport.endsAt, a),
                b = [];
            b.push(new Spotify.Web.StateHistory.Commands.PushApp(d.activeSection, a));
            b.push(new Spotify.Web.StateHistory.Commands.MoveViewport(d.activeSection, 1));
            b.push(new Spotify.Web.StateHistory.Commands.BrowserHistoryPushUrl(a.link));
            a = new Spotify.Web.StateHistory.Commands.ComposedCommand(b);
            d.run(a)
        }, n = function (a, b, c, f) {
            if (!c) c = d.activeSection;
            f || (f = c.getTopApp());
            var g = [];
            g.push(new Spotify.Web.StateHistory.Commands.UpdateAppLink(c, f, a));
            b || g.push(new Spotify.Web.StateHistory.Commands.BrowserHistoryPushUrl(a));
            a = new Spotify.Web.StateHistory.Commands.ComposedCommand(g);
            d.run(a, b)
        }, o = function (a) {
            var b = ["playlist", "starred", "toplist"];
            return a.id === "playlist" || a.id === "user" && b.indexOf(a.args[1]) > -1
        }, k = function () {
            var a = d.activeSection;
            a.persistent && a.viewport.endsAt === 0 && d.trigger("onBrowserHistoryReplace", {
                link: a.apps[0].link
            })
        };
    this.initialize = function () {
        if (typeof g.sections === "undefined") throw Error("No sections were supplied.");
        for (var a = 0, c = g.sections.length, d = g.sections; a < c; a += 1) {
            var f = d[a].link;
            b[f.id] = new Spotify.Web.StateHistory.Section(f, d[a].type, d[a].persistent);
            b[f.id].bind("onActive", i, this)
        }
    };
    this.getCurrentLink = function () {
        return this.activeSection && this.activeSection.getTopApp() ? this.activeSection.getTopApp().link : null
    };
    this.run = function (b, c) {
        c || (h.push(b), a.clear());
        l(b, !c)
    };
    this.undo = function () {
        var b = h.pop().invert();
        l(b);
        a.push(b);
        k();
        return b
    };
    this.redo = function () {
        var b = a.pop().invert();
        l(b);
        h.push(b);
        k();
        return b
    };
    this.openUri = function (a, f, g) {
        if (typeof a === "undefined") throw Error("openUri needs a Spotify.Link as an argument");
        var h = this.getCurrentLink();
        if (!(h && a.toURI() === h.toURI())) {
            this.trigger("beforeOpenUri", {
                link: a
            });
            var i = a.id,
                h = !1,
                k;
            for (k in b) if (k === i && (h = !0, b[k].type === "popup")) {
                this.trigger("onPopup", {
                    link: a,
                    origin: f
                });
                return
            }
            this.activeSection && this.activeSection.getTopApp().id === "welcome" && this.showSection(b.home,
            g);
            if (h && (!a.args || a.args.length === 0)) this.activeSection !== b[i] ? this.showSection(b[i], g) : this.activeSection.viewport.endsAt !== 0 && this.goToRoot();
            else if (g) f = a.id, f === "user" && (f = "playlist"), f === this.activeSection.getTopApp().id ? (this.trigger("onBrowserHistoryReplace", {
                link: a
            }), n(a, !0)) : (f === "radio" || f === "playlist") && n(a, !0, b[f], b[f].apps[0]);
            else if (o(a)) this.activeSection.id === "playlist" && this.activeSection.apps.length === 1 ? n(a, g) : c.isOwnPlaylist(a, function (c) {
                c ? d.goToRoot(b.playlist, a) : m(a, g)
            });
            else if (h) if (a.id ===
                "user" && a.args[0]) {
                var l = a.args[0];
                c.getUsername(function (c) {
                    c === l ? d.goToRoot(b[i], a) : m(a, g)
                })
            } else a.args && a.args.length > 0 && this.goToRoot(b[i], a);
            else m(a, g)
        }
    };
    this.goToRoot = function (a, b) {
        var c = [],
            d = this.activeSection;
        a && this.activeSection !== a && (c.push(new Spotify.Web.StateHistory.Commands.ShowSection(this.activeSection, a)), d = a);
        c.push(new Spotify.Web.StateHistory.Commands.UpdateViewportBegin(d));
        for (var f = d.viewport.endsAt + 1; --f;) {
            var g = d.apps[f];
            c.push(new Spotify.Web.StateHistory.Commands.MoveViewport(d, -1));
            c.push(new Spotify.Web.StateHistory.Commands.PopApp(d, g))
        }
        c.push(new Spotify.Web.StateHistory.Commands.UpdateViewportEnd(d));
        b ? (c.push(new Spotify.Web.StateHistory.Commands.UpdateAppLink(d, d.apps[0], b)), d = b) : d = a ? d.getTopApp().link : d.apps[0].link;
        c.push(new Spotify.Web.StateHistory.Commands.BrowserHistoryPushUrl(d));
        this.run(new Spotify.Web.StateHistory.Commands.ComposedCommand(c))
    };
    this.showSection = function (a) {
        var b = [];
        b.push(new Spotify.Web.StateHistory.Commands.ShowSection(this.activeSection,
        a));
        b.push(new Spotify.Web.StateHistory.Commands.BrowserHistoryPushUrl(a.getTopApp().link));
        this.run(new Spotify.Web.StateHistory.Commands.ComposedCommand(b))
    };
    this.moveViewport = function (a) {
        if (a !== -1) throw Error("not supported");
        this.trigger("beforeOpenUri", {});
        this.run(new Spotify.Web.StateHistory.Commands.ComposedCommand([new Spotify.Web.StateHistory.Commands.MoveViewport(this.activeSection, a), new Spotify.Web.StateHistory.Commands.PopApp(this.activeSection, this.activeSection.getTopApp()), new Spotify.Web.StateHistory.Commands.BrowserHistoryPushUrl(this.activeSection.apps[this.activeSection.apps.length - 1 + a].link)]))
    };
    this.getSection = function (a) {
        return typeof b[a] !== "undefined" ? b[a] : null
    };
    this.isRootActive = function () {
        return this.activeSection.viewport.endsAt === 0
    };
    this.getSections = function () {
        return b
    };
    this.getUndoStack = function () {
        return h
    };
    this.getRedoStack = function () {
        return a
    };
    this.setServices = function (a) {
        c = a
    }
};
Spotify.Web.StateHistory.Stack = function () {
    var g = [];
    this.isEmpty = function () {
        return g.length === 0
    };
    this.clear = function () {
        g = []
    };
    this.getLength = function () {
        return g.length
    };
    this.getItemAtIndex = function (f) {
        return typeof g[f] !== "undefined" ? g[f] : null
    };
    this.push = function (f) {
        g.push(f)
    };
    this.pop = function () {
        return g.pop()
    }
};
Spotify.Web.StateHistory.Section = function (g, f, d) {
    Spotify.Web.EventTarget.call(this);
    if (typeof g === "undefined") throw Error("The link argument is required!");
    this.id = g.id;
    this.type = f;
    this.persistent = d || !1;
    this.apps = [new Spotify.Web.StateHistory.App(this.id, 0, g)];
    this.viewport = new Spotify.Web.StateHistory.Viewport;
    this.clear = function () {
        this.apps = this.apps.slice(0, 1)
    };
    this.setActive = function () {
        this.trigger("onActive", {
            id: this.id
        })
    };
    this.getTopApp = function () {
        return this.apps[this.apps.length - 1]
    }
};
Spotify.Web.StateHistory.App = function (g, f, d) {
    if (typeof d === "undefined") throw Error("Argument missing: link");
    var b = g + "-app-" + d.toAppURI() + "-" + f + "-" + Date.now();
    this.link = d;
    this.id = d.id;
    this.uri = d.toAppURI();
    this.args = d.args || [];
    this.updateLink = function (b) {
        this.link = b;
        this.id = b.id;
        this.uri = b.toAppURI();
        this.args = b.args || []
    };
    this.getUniqueId = function () {
        return b
    }
};
Spotify.Web.StateHistory.Viewport = function () {
    this.length = 2;
    this.endsAt = 0
};
Spotify.Web.StateHistory.Commands.PushApp = function (g, f) {
    this.section = g;
    this.app = f;
    this.type = Spotify.Web.StateHistory.CommandTypes.PUSH;
    this.execute = function (d) {
        g.apps.push(f);
        d(this)
    };
    this.invert = function () {
        return new Spotify.Web.StateHistory.Commands.PopApp(g, f)
    }
};
Spotify.Web.StateHistory.Commands.PopApp = function (g, f) {
    this.section = g;
    this.app = f;
    this.type = Spotify.Web.StateHistory.CommandTypes.POP;
    this.execute = function (d) {
        g.apps.pop();
        d(this)
    };
    this.invert = function () {
        return new Spotify.Web.StateHistory.Commands.PushApp(g, f)
    }
};
Spotify.Web.StateHistory.Commands.MoveViewport = function (g, f) {
    this.section = g;
    this.type = Spotify.Web.StateHistory.CommandTypes.MOVE_VIEWPORT;
    this.execute = function (d) {
        g.viewport.endsAt += f;
        d(this)
    };
    this.getOffset = function () {
        return f
    };
    this.invert = function () {
        return new Spotify.Web.StateHistory.Commands.MoveViewport(g, -1 * f)
    }
};
Spotify.Web.StateHistory.Commands.ShowSection = function (g, f) {
    this.section = f;
    this.app = f.apps[0];
    this.type = Spotify.Web.StateHistory.CommandTypes.SHOW_SECTION;
    this.execute = function (d) {
        this.app = this.section.apps[0];
        this.section.setActive(!0);
        d(this)
    };
    this.invert = function () {
        return new Spotify.Web.StateHistory.Commands.ShowSection(this.section, g)
    }
};
Spotify.Web.StateHistory.Commands.UpdateAppLink = function (g, f, d) {
    var b = f.link;
    this.section = g;
    this.type = Spotify.Web.StateHistory.CommandTypes.UPDATE_APP_ARGUMENTS;
    this.execute = function (b) {
        f.updateLink(d);
        b(this)
    };
    this.invert = function () {
        return this.section.persistent ? new Spotify.Web.StateHistory.Commands.Empty : new Spotify.Web.StateHistory.Commands.UpdateAppLink(g, f, b)
    }
};
Spotify.Web.StateHistory.Commands.Empty = function () {
    this.type = Spotify.Web.StateHistory.CommandTypes.EMPTY;
    this.execute = function (g) {
        g(this)
    };
    this.invert = function () {
        return new Spotify.Web.StateHistory.Commands.Empty
    }
};
Spotify.Web.StateHistory.Commands.UpdateViewportBegin = function (g) {
    this.section = g;
    this.execute = function (f) {
        f(this)
    };
    this.type = Spotify.Web.StateHistory.CommandTypes.UPDATE_VIEWPORT_BEGIN;
    this.invert = function () {
        return new Spotify.Web.StateHistory.Commands.UpdateViewportEnd(g)
    }
};
Spotify.Web.StateHistory.Commands.UpdateViewportEnd = function (g) {
    this.section = g;
    this.type = Spotify.Web.StateHistory.CommandTypes.UPDATE_VIEWPORT_END;
    this.execute = function (f) {
        f(this)
    };
    this.invert = function () {
        return new Spotify.Web.StateHistory.Commands.UpdateViewportBegin(g)
    }
};
Spotify.Web.StateHistory.Commands.BrowserHistoryPushUrl = function (g) {
    this.type = Spotify.Web.StateHistory.CommandTypes.BROWSER_HISTORY_PUSH_URL;
    this.link = g;
    this.execute = function (f) {
        f(this)
    };
    this.invert = function () {
        return this
    }
};
Spotify.Web.StateHistory.Commands.ComposedCommand = function (g) {
    if (!g.length || !(g.length > 0)) throw Error("The ComposedCommand argument must be an array");
    this.type = Spotify.Web.StateHistory.CommandTypes.COMPOSED_COMMAND;
    this.execute = function (f) {
        for (var d = 0; d < g.length; d++) g[d].execute(f)
    };
    this.invert = function () {
        for (var f = [], d = g.length - 1; d >= 0; d--) f.push(g[d].invert());
        return new Spotify.Web.StateHistory.Commands.ComposedCommand(f)
    };
    this.getCommands = function () {
        return g
    };
    this.getCommandAtIndex = function (f) {
        f = g[f];
        return typeof f !== "undefined" ? f : null
    }
};
Spotify.Web.AppManager = function (g, f, d) {
    Spotify.Web.EventTarget.call(this);
    var b = {}, c = [],
        a = this;
    g.bind("doCommand", function (c) {
        c = c.params.command;
        if (c.type === Spotify.Web.StateHistory.CommandTypes.UPDATE_APP_ARGUMENTS) {
            var d = c.section.apps[c.section.viewport.endsAt],
                f = g.getSection(c.section.id).apps[c.section.viewport.endsAt].getUniqueId();
            a.trigger("onFrameUpdated", {
                app: d,
                node: b[c.section.id][f]
            })
        }
    });
    this.getActiveFrame = function () {
        var a = g.activeSection,
            c = a.id,
            a = g.getSection(c).apps[a.viewport.endsAt].getUniqueId();
        return b[c][a]
    };
    this.get = function (a, i) {
        var l = g.getSection(a).apps[i],
            m = l.getUniqueId(),
            n = b[a] || (b[a] = {}),
            o = n[m];
        if (o) return o;
        var k = f(l.link.toURLPath()),
            o = c.length ? c.shift() : d.createElement("iframe");
        o.id = m;
        o.src = k;
        n[m] = o;
        this.trigger("onFrameCreated", {
            app: l,
            node: o
        });
        return o
    };
    this.dispose = function (a, d) {
        if (d !== 0) {
            var f = g.getSection(a).apps[d],
                m = f.getUniqueId(),
                n = b[a],
                o = n[m];
            this.trigger("onFrameDisposed", {
                app: f,
                node: o
            });
            delete n[m];
            c.push(o)
        }
        return this
    };
    this.registerAppWindow = function (a, b) {
        this.trigger("onFrameCreated", {
            app: {
                link: b
            },
            node: a
        })
    };
    this.getIFrameWithWindow = function (a) {
        for (var c in b) for (var d in b[c]) {
            var f = b[c][d];
            if (f.contentWindow === a) return f
        }
        return null
    }
};
Spotify.Web.Queue = function () {
    var g = null;
    this.execute = function (f) {
        g && g.forceFinish();
        g = f;
        g.execute()
    };
    this.forceFinish = function () {
        g && g.forceFinish()
    }
};
Spotify.Web.Queue.TransitionStep = function (g, f) {
    var d = !1,
        b = null,
        c = function () {
            try {
                g()
            } finally {
                d = !0
            }
        };
    this.execute = function () {
        f ? b = setTimeout(c, f) : c()
    };
    this.forceFinish = function () {
        d || (clearTimeout(b), c())
    };
    this.delay = f
};
Spotify.Web.Queue.Transition = function (g) {
    this.execute = function () {
        for (var f = 0; f < g.length; f++) g[f].execute()
    };
    this.forceFinish = function () {
        for (var f = 0; f < g.length; f++) g[f].forceFinish()
    }
};
Spotify.Web.View = function (g, f, d) {
    Spotify.Web.EventTarget.call(this);
    var b = this,
        c = {}, a, h = function (a) {
            var h = g.getSections()[a],
                h = new Spotify.Web.View.Section(h, f, d.ownerDocument);
            c[a] = h;
            d.appendChild(h.getWrapper());
            h.bind("onMoveViewportLeft", function () {
                g.moveViewport(-1)
            }, b);
            h.bind("onFrontPaneUpdate", function (a) {
                this.trigger("onFrontPaneUpdate", a.params)
            }, b)
        }, i = function (b) {
            b = b.params.command;
            switch (b.type) {
                case Spotify.Web.StateHistory.CommandTypes.SHOW_SECTION:
                    b = c[b.section.id];
                    if (!b) throw Error("incorrect section id");
                    a !== b && (a && a.hide(), b.show(), a = b);
                    break;
                case Spotify.Web.StateHistory.CommandTypes.MOVE_VIEWPORT:
                    var d = b.getOffset();
                    c[b.section.id].moveViewport(d);
                    break;
                case Spotify.Web.StateHistory.CommandTypes.UPDATE_VIEWPORT_BEGIN:
                    a.updateViewportBegin();
                    break;
                case Spotify.Web.StateHistory.CommandTypes.UPDATE_VIEWPORT_END:
                    a.updateViewportEnd()
            }
        }, l = function () {
            a && a.forceQueue()
        };
    (function () {
        var a = g.getSections(),
            c;
        for (c in a) a.hasOwnProperty(c) && h(a[c].id);
        g.bind("doCommand", i, b);
        g.bind("beforeOpenUri", l, b)
    })()
};
Spotify.Web.View.Section = function (g, f, d) {
    Spotify.Web.EventTarget.call(this);
    var b = this,
        c, a = Array(3),
        h = new Spotify.Web.Queue,
        i = !1,
        l = function () {
            b.trigger("onFrontPaneUpdate", {
                node: a[a.length - 1].iFrame
            })
        }, m = function (a) {
            a.isRoot() ? a.wrapper.className = "limbo" : c.removeChild(a.wrapper)
        }, n = function (a, b, c, d) {
            a = new Spotify.Web.Queue.Transition([new Spotify.Web.Queue.TransitionStep(a), new Spotify.Web.Queue.TransitionStep(b, 5), new Spotify.Web.Queue.TransitionStep(c, d ? d : 25)]);
            h.execute(a)
        }, o = function (a) {
            var h = a === 0,
                i = new Spotify.Web.View.Pane(h),
                a = f.get(g.id, a);
            i.updateIFrame(a);
            !h || !c.querySelectorAll(".limbo")[0] ? (i.wrapper = d.createElement("div"), i.wrapper.appendChild(i.iFrame), i.wrapper.addEventListener("click", function () {
                b.trigger("onMoveViewportLeft", {})
            }), h = d.createElement("div"), h.className = "overlay", i.wrapper.appendChild(h)) : i.wrapper = c.querySelectorAll(".limbo")[0];
            return i
        }, k = function () {
            var b, d, h;
            n(function () {
                b = a[0];
                for (var f = 0; f < a.length - 1; f++) a[f] = a[f + 1], a[f] && (f === a.length - 2 ? (h = a[f], h.updateViewIndex(a.length - f - 1, "fadeIn")) : a[f].updateViewIndex(a.length - f - 1));
                a[a.length - 1] = o(g.viewport.endsAt);
                d = a[2];
                d.updateViewIndex(0, "fadeIn");
                c.appendChild(d.wrapper)
            }, function () {
                d.updateViewIndex(0)
            }, function () {
                h.updateViewIndex(1);
                b && (m(b), f.dispose(g.id, g.viewport.endsAt - g.viewport.length - 1));
                l()
            })
        };
    this.getWrapper = function () {
        if (!c) {
            var a = d.createElement("div");
            a.setAttribute("id", "section-" + g.id);
            a.className = "hidden";
            c = a
        }
        return c
    };
    this.show = function () {
        if (!a[2]) {
            a[2] = o(0);
            var b = a[2];
            b.updateViewIndex(0);
            c.appendChild(b.wrapper)
        }
        c.className =
            "active"
    };
    this.forceQueue = function () {
        h.forceFinish()
    };
    this.hide = function () {
        c.className = "hidden"
    };
    this.moveViewport = function (b) {
        if (!i) if (b === 1) k();
        else if (b === -1) {
            for (var b = a[2], d = a.length - 1; d > 0; d--) a[d] = a[d - 1], a[d] && a[d].updateViewIndex(a.length - d - 1), a[d - 1] = null;
            d = g.viewport.endsAt - g.viewport.length;
            d >= 0 && (a[0] = o(d), a[0].updateViewIndex(g.viewport.length), d > 0 && c.insertBefore(a[0].wrapper, c.childNodes[1]));
            m(b);
            f.dispose(g.id, g.viewport.endsAt + 1);
            l()
        } else throw Error("not implemented");
    };
    this.updateViewportBegin = function () {
        i = !0;
        for (var b = 0; b < a.length; b++) a[b] && (m(a[b]), f.dispose(g.id, g.viewport.endsAt - a.length + 1 + b), a[b] = null)
    };
    this.updateViewportEnd = function () {
        i = !1;
        for (var b = -1, d = g.viewport.endsAt - 2; d <= g.viewport.endsAt; d++) if (b += 1, !(d < 0)) {
            var f = o(d);
            a[b] = f;
            f.updateViewIndex(2 - b);
            f.wrapper.parentElement !== c && c.appendChild(f.wrapper)
        }
    }
};
Spotify.Web.View.Pane = function (g) {
    this.wrapper = this.iFrame = null;
    this.updateIFrame = function (f) {
        this.iFrame = f
    };
    this.updateViewIndex = function (f, d) {
        this.wrapper.className = "index-" + f;
        g === !0 && (this.wrapper.className += " root");
        d && (this.wrapper.className += " " + d)
    };
    this.isRoot = function () {
        return g
    }
};
window._debug = !1;
Spotify = Spotify || {};
Spotify.Web = Spotify.Web || {};
Spotify.Web.App = function () {
    var g = {
        settings: null,
        defaultState: null,
        spotifyAppId: 134519659678
    }, f = this,
        d = {}, b, c, a, h, i, l, m, n, o, k, p, q, s, t, y, w, v, x, D, A, u, C, J, G, F, H, E, M, N, z = null,
        O = null,
        I = [],
        K, L, P, Q = function () {
            var a = s.getAddressBarUrl(),
                c = !0;
            b.notify(Spotify.Web.PublisherMessages.APPLICATION_ENABLED, {});
            u = new Spotify.Web.Services(h.metadata, h.playlist, h.user, h.social, h.hermes);
            C = new Spotify.Web.AutoPlay(Spotify.App, Spotify.Link, u, q.getAppUrl);
            p.setServices(u);
            q.setServices(u);
            C.shouldPlay(a) && (c = !1);
            Spotify.App.init(h, {
                publisher: b,
                getAppUrl: q.getAppUrl,
                shouldGetSavedState: c
            });
            if (C.shouldPlay(a)) {
                var d = function () {
                    C.getUrl(a, function (a) {
                        q.openInitialUrl(a, G, h)
                    })
                }, i = function () {
                    K.unbind("LOAD", k, f);
                    K.unbind("CANNOT_PLAY_TRACK", l, f);
                    K.unbind("PLAYBACK_FAILED", l, f);
                    K.unbind("INVALID_TRACK_URI", l, f)
                }, k = function () {
                    i();
                    d()
                }, l = function () {
                    i();
                    d()
                };
                K.bind("LOAD", k, f);
                K.bind("CANNOT_PLAY_TRACK", l, f);
                K.bind("PLAYBACK_FAILED", l, f);
                K.bind("INVALID_TRACK_URI", l, f);
                C.playUrl(a, function () {}, l)
            } else q.openInitialUrl(a, G, h);
            z = new Spotify.Web.Ads.PixelTracker(h);
            z.init();
            aa();
            R();
            E = new Spotify.Web.SocialData(b, u, A);
            E.init();
            t.registerAppWindow(document.getElementById("app-player"), Spotify.Link.fromString("spotify:app:player").toAppLink());
            g.settings.dominoFlags.nowPlayingRecs && (B(), t.registerAppWindow(document.getElementById("app-now-playing-recs"), Spotify.Link.fromString("spotify:app:now-playing-recs").toAppLink()));
            L = new Spotify.Web.Storage.Cookie("common", u, Spotify.Utils.Base64, {}, document);
            L.init();
            P = new Spotify.Web.Bookmark(b, L);
            P.init()
        }, B = function () {
            var a = document.getElementById("app-now-playing-recs");
            n = new Spotify.Web.Window({
                url: q.getAppUrl("/now-playing-recs/"),
                iframe: a
            });
            n.initialize()
        }, R = function () {
            var a = document.getElementById("app-player");
            m = new Spotify.Web.Player(h, {
                url: q.getAppUrl("/player/"),
                iframe: a
            });
            m.initialize()
        }, S = function () {
            O && clearTimeout(O);
            ba();
            if (!x) h.audioManager.onReady(function () {
                K = h.audioManager.getPlayerAtIndex(0);
                K.bind("INVALID_TRACK_URI", function (a) {
                    a.params.code !== Spotify.Errors.Codes.TRACK_REQUEST_RATE_LIMITED && a.params.domain !== Spotify.Errors.Domains.TRACK_ERROR && b.notify(Spotify.Web.PublisherMessages.ERROR, {
                        type: Spotify.Web.ErrorTypes.TRACK_NOT_PLAYABLE,
                        trackUri: a.params.data
                    })
                }, f);
                x = !0;
                h.metadata.onReady(function () {
                    h.playlist.onReady(function () {
                        Q();
                        o.initialize();
                        k.initializePopups()
                    })
                });
                window.addEventListener("beforeunload", fa)
            });
            b.notify(Spotify.Web.PublisherMessages.ERROR, {
                type: Spotify.Web.ErrorTypes.CONNECTION_RESTORED
            })
        }, T = function () {
            a.log("disconnect");
            b.notify(Spotify.Web.PublisherMessages.ERROR, {
                type: Spotify.Web.ErrorTypes.CONNECTION_LOST
            })
        },
        U = function () {
            a.log("token lost");
            K.isPaused && b.notify(Spotify.Web.PublisherMessages.ERROR, {
                type: Spotify.Web.ErrorTypes.TOKEN_LOST
            })
        }, ca = function () {
            a.log("error")
        }, V = function () {
            c.get(function (a) {
                a === null ? b.notify(Spotify.Web.PublisherMessages.ERROR, {
                    type: Spotify.Web.ErrorTypes.SESSION_LOST
                }) : h.connectWithToken(a)
            }, function () {
                h.connectWithToken("")
            })
        }, da = function () {
            h.migrateToIndexedDBStorage(function () {}, function () {})
        }, W = function () {
            b.notify(Spotify.Web.PublisherMessages.ERROR, {
                type: Spotify.Web.ErrorTypes.NO_SOUND_CAPABILITIES
            })
        },
        ea = function () {
            b.notify(Spotify.Web.PublisherMessages.ERROR, {
                type: Spotify.Web.ErrorTypes.WAIT_FOR_COMMERCIAL_TO_FINISH
            })
        }, X = function () {
            O = setTimeout(function () {
                b.notify(Spotify.Web.PublisherMessages.ERROR, {
                    type: Spotify.Web.ErrorTypes.CONNECTING
                })
            }, 1500)
        }, fa = function () {
            h && h.dispose()
        }, ga = function (a, b, c) {
            var d;
            try {
                d = JSON.parse(c)
            } catch (f) {}
            switch (b) {
                case "welcome":
                    a = function (a) {
                        return function (b) {
                            G.processFbResponse(a, b)
                        }
                    };
                    if (!d) break;
                    switch (d.name) {
                        case "nux_started":
                            l.disable();
                            break;
                        case "nux_complete":
                            G.setCompleted();
                            l.enable();
                            break;
                        case "get_fb_friends":
                            A.getFriendsUsingApp(a(d.name));
                            break;
                        case "get_fb_friends_without_spotify":
                            A.getFriendsNotUsingApp(a(d.name));
                            break;
                        case "send_fb_inbox_message":
                            A.sendInboxMessages(d.args, a(d.name))
                    }
                    break;
                case "context-actions":
                case "share":
                    d && d.type == "WINDOW_BLUR" && k.closeAll()
            }
        }, Y = !1,
        Z = function () {
            Y || (b.notify(Spotify.Web.PublisherMessages.ERROR, {
                type: Spotify.Web.ErrorTypes.FLASH_NOT_AVAILABLE
            }), Y = !0)
        }, aa = function () {
            A = new Spotify.Web.Fb(b, i, D, u);
            A.connect(g.settings.facebookJSSDKConfig,

            function () {
                music = new Spotify.Web.MusicBridge(b, A, C, h);
                music.start();
                J = new Spotify.Web.OpenGraph(A, h, N);
                J.start();
                F || (F = new Spotify.Web.Upsell({}, h.user, M), F.onFbConnect(A))
            }, function () {
                window.setTimeout(aa, 3E5);
                F || (F = new Spotify.Web.Upsell({}, h.user, M), F.init())
            })
        }, ha = function (a) {
            I.push(a.params);
            ba()
        }, ba = function () {
            try {
                for (var a = 0, b = I.length; a < b; a += 1) h.logging.logger.logJSExceptions(I[a].module, I[a].message, I[a].url, I[a].lineNumber);
                I = []
            } catch (c) {}
        };
    d.initialize = function (d, f) {
        if (d.needsToAcceptEULA === !0) window.location = "/legal/";
        D = f;
        N = new Spotify.Web.Exceptions(window);
        N.bind(Spotify.Web.ErrorTypes.UNCAUGHT_EXCEPTION, ha, this);
        N.bindWindow(window, "global");
        Spotify.Web.BrowserDetect.init();
        if (!d) throw Error("Server-side settings not provided");
        g.settings = d;
        g.defaultState = g.settings.dominoFlags.discover ? {
            url: "discover",
            title: "Discover - Spotify"
        } : {
            url: "home",
            title: "What's new - Spotify"
        };
        a = new Spotify.Web.Logger;
        b = new Spotify.Web.Publisher;
        b.subscribe(Spotify.Web.PublisherMessages.APPLICATION_STATE_PUSH,
        this);
        b.subscribe(Spotify.Web.PublisherMessages.APPLICATION_OPEN_URI, this);
        b.subscribe(Spotify.Web.PublisherMessages.APPLICATION_CLOSED, this);
        b.subscribe(Spotify.Web.PublisherMessages.CLIENT_SHOW_SHARE_UI, this);
        b.subscribe(Spotify.Web.PublisherMessages.FB_APP_UNKNOWN, this);
        b.subscribe(Spotify.Web.PublisherMessages.FB_APP_CONNECTED, this);
        b.subscribe(Spotify.Web.PublisherMessages.FB_APP_NOT_AUTHENTICATED, this);
        b.subscribe(Spotify.Web.PublisherMessages.FB_CONNECTION_FAILURE, this);
        b.subscribe(Spotify.Web.PublisherMessages.USER_AUTHENTICATION_FAILURE,
        this);
        b.subscribe(Spotify.Web.PublisherMessages.APPLICATION_VERSION_CHANGED, this);
        b.subscribe(Spotify.Web.PublisherMessages.APPLICATION_POST_MESSAGE, this);
        b.subscribe(Spotify.Web.PublisherMessages.SUGGEST_SHOW, this);
        b.subscribe(Spotify.Web.PublisherMessages.SUGGEST_HIDE, this);
        window.addEventListener("message", function (a) {
            b.notify(Spotify.Web.PublisherMessages.APPLICATION_POST_MESSAGE, {
                url: Spotify.Web.Utils.appNameFromUrl(a.origin),
                name: Spotify.Web.Utils.appNameFromUrl(a.origin),
                data: a.data
            })
        }, !1);
        c = new Spotify.Web.Credentials("/xhr/json/auth.php");
        g.settings.credentials && c.cache(g.settings.credentials[0], g.settings.credentials[1]);
        var m, n, u = Spotify.Web.FeatureDetect;
        m = u.getFlashVersion();
        n = Spotify.Web.BrowserDetect.browser;
        var x = Spotify.Web.BrowserDetect.version,
            z = Spotify.Web.BrowserDetect.OS;
        m = m.major >= 11 && m.minor >= 3 && n === "Explorer" && x >= 10 || (z === "Windows" || z === "Linux") && n !== "Explorer" || n === "Chrome" && (z === "Windows" || z === "Linux") || n === "Safari" && x >= 6 || z === "Mac" && (navigator.userAgent.indexOf("10.8") > -1 || navigator.userAgent.indexOf("10_8") > -1) || n === "Firefox" && x >= 11 && (z === "Windows" || z === "Linux");
        window.location.href.indexOf("websockets") > -1 || m ? (m = Spotify.GatewayTypes.WEBSOCKETS, n = g.settings.aps.ws) : (m = Spotify.GatewayTypes.FLASH, n = g.settings.aps.rtmp);
        if ((x = Spotify.Web.URLParser.parseURL(location.href)) && x.params) x = x.params, typeof x.ap !== "undefined" && (m = x.ap.indexOf("rtmp") === 0 ? Spotify.GatewayTypes.FLASH : Spotify.GatewayTypes.WEBSOCKETS, n = x.ap.replace(/\\/g, ""));
        g.settings.corejs.connectionUri = n instanceof
        Array ? n.join("|") : n;
        n = Spotify.Web.BrowserDetect.getVendorPrefix() !== "Moz" ? Spotify.PlayerTypes.FLASH_HTTP : Spotify.PlayerTypes.FLASH_RTMPS;
        if (Spotify.Web.BrowserDetect.browser === "Explorer") x = Math.floor(Math.random() * 1E3), g.settings.corejs.SWFUrl += "?rnd=" + x, g.settings.corejs.SWFPlayerUrl += "?rnd=" + x, g.settings.corejs.protoSchemasLocationRandomizer = "?rnd=" + x;
        h = new Spotify.Core(m, n, g.settings.corejs);
        h.onReady = X;
        h.onError = ca;
        h.onConnect = S;
        h.onDisconnect = T;
        h.onTokenLost = U;
        h.bind("ON_TRY_TO_CONNECT", V, this);
        h.bind("NO_SOUND_CAPABILITIES", W, this);
        h.bind("STORAGE_FULL", da, this);
        h.bind("WAIT_FOR_COMMERCIAL_TO_FINISH", ea, this);
        h.bind("FLASH_UNAVAILABLE", Z, this);
        h.initialize();
        p = new Spotify.Web.StateHistory.Manager({
            sections: [{
                link: Spotify.Link.applicationLink("home"),
                type: "section"
            }, {
                link: Spotify.Link.applicationLink("discover"),
                type: "section"
            }, {
                link: Spotify.Link.applicationLink("radio"),
                type: "section",
                persistent: !0
            }, {
                link: Spotify.Link.applicationLink("playlist"),
                type: "section"
            }, {
                link: Spotify.Link.applicationLink("welcome"),
                type: "section"
            }, {
                link: Spotify.Link.applicationLink("user"),
                type: "section"
            }, {
                link: Spotify.Link.applicationLink("suggest"),
                type: "popup"
            }, {
                link: Spotify.Link.applicationLink("context-actions"),
                type: "popup"
            }, {
                link: Spotify.Link.applicationLink("about"),
                type: "section"
            }]
        });
        p.initialize();
        q = new Spotify.Web.Router(p, g);
        q.bind(q.EVENT_TRACK_URI_ROUTED, function (a) {
            a = a.params.link;
            C.play(a.toURI(), a.id, function () {}, function () {})
        });
        t = new Spotify.Web.AppManager(p, q.getAppUrl, document);
        y = new Spotify.Web.View(p, t,
        document.getElementById("main"));
        y.bind("onFrontPaneUpdate", function (a) {
            a.params.node.focus()
        });
        l = new Spotify.Web.Menu({
            publisher: b,
            elements: document.getElementById("main-nav").querySelectorAll("ul span"),
            defaultId: g.defaultState.id,
            logo: document.getElementById("logo")
        });
        l.initialize();
        v = new Spotify.Web.SettingsPopup({
            trigger: document.getElementById("nav-settings"),
            wrapper: document.getElementById("settings")
        });
        v.initialize();
        document.getElementById("main-nav").addEventListener("click", function (a) {
            a.target.id ===
                "main-nav" && (p.isRootActive() || p.moveViewport(-1))
        });
        l.bind("onAppOpen", function (a) {
            q.openUri(Spotify.Link.fromString("spotify:app:" + a.params.id).toAppLink())
        });
        v.bind("onAppOpen", function (a) {
            q.openUri(Spotify.Link.fromString("spotify:app:" + a.params.id).toAppLink())
        });
        t.bind("onFrameCreated", function (a) {
            b.notify(Spotify.Web.PublisherMessages.APPLICATION_STATE_CHANGED, {
                link: a.params.app.link,
                iframe: a.params.node
            })
        });
        t.bind("onFrameUpdated", function (a) {
            b.notify(Spotify.Web.PublisherMessages.APPLICATION_STATE_CHANGED, {
                link: a.params.app.link,
                iframe: a.params.node
            })
        });
        t.bind("onFrameDisposed", function (a) {
            b.notify(Spotify.Web.PublisherMessages.APPLICATION_DISPOSED, {
                link: a.params.app.link,
                iframe: a.params.node
            })
        });
        p.bind("doCommand", function (a) {
            a = a.params.command;
            a.type === Spotify.Web.StateHistory.CommandTypes.SHOW_SECTION && l.highlightMenu(a.section.id)
        });
        p.bind("onPopup", function (a) {
            var c = a.params.link.id,
                d = a.params.origin;
            c === "suggest" && (o.isVisible() ? b.notify(Spotify.Web.PublisherMessages.SUGGEST_HIDE) : b.notify(Spotify.Web.PublisherMessages.SUGGEST_SHOW));
            (c === "context-actions" || c === "share") && k.popup(a.params.link, d)
        });
        s = new Spotify.Web.Router.History(p, History);
        s.bind("pageChange", function (a) {
            M.pageView("/" + Spotify.Web.URLParser.parseURL(a.params.url).path);
            k.closeAll()
        });
        p.bind("onBrowserHistoryPush", function (a) {
            s.push(a.params.link)
        });
        p.bind("onBrowserHistoryReplace", function (a) {
            s.replace(a.params.link)
        });
        w = new Spotify.Web.Error({
            publisher: b,
            element: document.getElementById("notification-area"),
            dialog: document.getElementById("modal-notification-area"),
            timeout: 4E3
        });
        w.initialize();
        H = new Spotify.Web.ScrollBlocker(document.getElementById("sb"), b);
        H.init();
        (n === Spotify.PlayerTypes.FLASH_HTTP || m === Spotify.GatewayTypes.FLASH) && window.addEvent("load", function () {
            Spotify.Web.FeatureDetect.hasFlashMin() || window.setTimeout(function () {
                Z()
            }, 1E3)
        });
        k = new Spotify.Web.PopupManager(q, b, document.getElementById("wrapper"));
        k.registerPopup("context-actions", {
            preventScrolling: !0,
            hideOnWindowResize: !0
        });
        o = new Spotify.Web.PopupWindow({
            url: q.getAppUrl("/suggest/"),
            id: "suggest",
            preventScrolling: !0,
            wrapper: document.getElementById("suggest-area"),
            iframe: document.getElementById("suggest"),
            hideMessage: Spotify.Web.PublisherMessages.SUGGEST_HIDDEN,
            showMessage: Spotify.Web.PublisherMessages.SUGGEST_SHOWN,
            postHideCallback: function () {
                document.activeElement.blur();
                t.getActiveFrame().focus()
            }
        }, b, k);
        i = new Spotify.Web.Static;
        if (g.settings.preload && g.settings.preload.length) for (m = 0; m < g.settings.preload.length; m++) i.preloadImage(g.settings.preload[m]);
        M = new Spotify.Web.Tracking(b, i, g.settings.tracking);
        M.initialize();
        N.addHandler(M.handleException);
        u.adBlockCheck() && b.notify(Spotify.Web.PublisherMessages.ERROR, {
            type: Spotify.Web.ErrorTypes.AD_BLOCK_DETECTED
        });
        b.notify(Spotify.Web.PublisherMessages.CHROME_READY);
        G = new Spotify.Web.NUX(p, t, q.getAppUrl)
    };
    d.onNotify = function (a) {
        var c = a.message,
            d = Spotify.Web.PublisherMessages;
        switch (a.messageType) {
            case d.APPLICATION_POST_MESSAGE:
                ga(c.url, c.name, c.data);
                break;
            case d.APPLICATION_OPEN_URI:
                l.enable();
                q.openUri(c.link, c.origin, c.replace);
                break;
            case d.APPLICATION_VERSION_CHANGED:
                b.notify(d.ERROR, {
                    type: Spotify.Web.ErrorTypes.APPLICATION_RELOAD_NEEDED
                });
                break;
            case d.CLIENT_SHOW_SHARE_UI:
                a = "spotify:share:" + c.left + ":" + (c.top + 10) + ":0:0:" + encodeURIComponent(c.uri);
                a = Spotify.Link.fromString(a);
                d = t.getIFrameWithWindow(c.origin);
                k.popup(a, d);
                c.callback(!0);
                break;
            case d.SUGGEST_SHOW:
                o.show();
                break;
            case d.SUGGEST_HIDE:
                o.hide();
                break;
            case d.APPLICATION_CLOSED:
                c = K.trackUri, c.indexOf("spotify:ad:") > -1 && h.adChooser.recordAdEvent(c, "attempt")
        }
    };
    d.GdpSuccess = function () {};
    d.GdpError = function () {};
    d.GdpDeny = function () {};
    return d
}();
Spotify.Web.GDP = function (g) {
    function f(a) {
        if (a.status === "connected") {
            var c = a.authResponse.userID,
                a = a.authResponse.accessToken;
            b.notify(Spotify.Web.PublisherMessages.FB_APP_CONNECTED, {
                userID: c,
                accessToken: a
            });
            d.hide();
            (new Request({
                url: "/xhr/json/gdp/create.php",
                method: "get",
                data: {
                    fbuid: c,
                    access_token: a
                },
                onSuccess: i
            })).send()
        }
    }
    var d = this,
        b = g.publisher,
        c = g.fbBridge,
        a, h = new Spotify.Web.GDP.View({
            player: g.core.player
        });
    this.initialize = function () {
        a = c.getAPI();
        b.subscribe(Spotify.Web.PublisherMessages.FB_APP_CONNECTED, d);
        b.subscribe(Spotify.Web.PublisherMessages.FB_APP_NOT_AUTHENTICATED, d);
        a.Event.subscribe("auth.statusChange", f)
    };
    this.createDialog = function () {
        h.initialize(null, d.show)
    };
    this.show = function () {
        h.show()
    };
    this.hide = function () {
        h.hide()
    };
    this.error = function () {
        h.render(h.templates.ERROR)
    };
    this.deny = function () {
        h.render(h.templates.CANCEL)
    };
    this.authenticate = function () {
        c.getLoginStatus()
    };
    this.onNotify = function (a) {
        var c = Spotify.Web.PublisherMessages;
        switch (a.messageType) {
            case c.APPLICATION_ENABLED:
                setupTrack();
                break;
            case c.FB_APP_NOT_AUTHENTICATED:
                b.unsubscribe(Spotify.Web.PublisherMessages.FB_APP_CONNECTED, d);
                break;
            case c.FB_APP_CONNECTED:
                window.location.href = "/login/?forward=" + encodeURIComponent("/welcome/")
        }
    };
    var i = function (a) {
        a = JSON.parse(a);
        a.status === "success" ? b.notify(Spotify.Web.PublisherMessages.USER_AUTHENTICATED) : b.notify(Spotify.Web.PublisherMessages.USER_AUTHENTICATION_FAILURE, a)
    }
};
Spotify.Web.GDP = Spotify.Web.GDP || {};
Spotify.Web.GDP.View = function () {
    function g(a, d) {
        var f = c[a];
        f ? (b.node.innerHTML = f, typeof d === "function" && d.call(this, f)) : (new Request({
            url: a,
            method: "get",
            onSuccess: function (f) {
                c[a] = f;
                b.node.innerHTML = f;
                typeof d === "function" && d.call(this, f)
            }
        })).send()
    }
    function f() {
        document.getElementById("retry-button").addEventListener("click", function () {
            b.render(b.templates.MAIN)
        })
    }
    function d() {
        var a = document.createElement("div");
        a.id = "gdp-container";
        a.classList.add("modal-notification");
        document.body.appendChild(a);
        return a
    }
    var b = this,
        c = {};
    this.player = this.node = null;
    this.templates = {
        MAIN: "/static/templates/gdp-main.html",
        ERROR: "/static/templates/gdp-error.html",
        CANCEL: "/static/templates/gdp-cancel.html"
    };
    this.initialize = function (a, c) {
        b.node = b.node || d();
        this.render(this.templates.MAIN, function () {
            typeof c === "function" && c.call(this)
        })
    };
    this.render = function (a, b) {
        var c;
        switch (a) {
            case this.templates.ERROR:
                c = f;
                break;
            case this.templates.CANCEL:
                c = f;
                break;
            default:
                c = b
        }
        g(a, c)
    };
    this.show = function () {
        b.node.style.display = "block"
    };
    this.hide = function () {
        b.node.style.display = "none"
    }
};
Spotify.Web.Utils = function () {
    var g = {}, f = RegExp("(?:user/(.*)/)?(home|discover|starred|welcome|radio|track|artist|album|playlist|search|debug|user|test-runner|pitchfork|rollingstone|songkick|tunigo)/?(.*)?/?");
    g.spotifyUriToOrigin = function (d) {
        var d = d.split(":"),
            b = d[1],
            c = d[2];
        b === "user" && d[3] === "playlist" && (b = "playlist", c += ":" + d[4]);
        return "spotify:app:" + b + ":" + c
    };
    g.spotifyUriToFullAppPath = function (d, b) {
        var c = d.split(":"),
            a = c[1];
        a === "user" && c[3] === "playlist" && (a = "playlist");
        return b(a)
    };
    g.spotifyUriToOpenUrl = function (d, b) {
        if (d) {
            for (var c = d.split(":"), a = b || "http://open.spotify.com", f = 1; f < c.length; f++) {
                if (c[f] === "top") break;
                a += "/" + c[f]
            }
            return a
        } else return ""
    };
    g.decodeOpenGraphUrl = function (d) {
        d = d.replace("#_=_", "");
        if (d = d.match(f)) {
            var b = d[3] || null;
            b !== null && (b = b.replace(/\//g, ":"), b = b[b.length - 1] === ":" ? b.slice(0, -1) : b);
            return {
                user: d[1] || null,
                context: d[2] || null,
                contextId: b
            }
        } else return null
    };
    g.openGraphUrlToSpotifyUri = function (d) {
        if (!d) return null;
        var b = g.decodeOpenGraphUrl(d);
        if (!b) return "";
        b.user ? d = b.contextId ?
            "spotify:user:" + b.user + ":" + b.context + ":" + b.contextId : "spotify:user:" + b.user + ":" + b.context : b.contextId ? b.context === "search" ? (d = d.replace("#_=_", "").replace(/\/$/, "").split("/"), d.splice(0, 3), d.unshift("https://play.spotify.com/app"), d = d.join("/"), d = Spotify.Link.fromString(d).toURI()) : d = "spotify:" + b.context + ":" + b.contextId : d = "spotify:app:" + b.context;
        return d
    };
    g.addTransitionEndedListener = function (d, b, c) {
        var a = !1,
            f = function (c) {
                a = !0;
                b(c);
                g()
            }, g = function () {
                d.removeEventListener("webkitTransitionEnd", f, !1);
                d.removeEventListener("transitionend", f, !1);
                d.removeEventListener("msTransitionEnd", f, !1);
                d.removeEventListener("oTransitionEnd", f, !1)
            };
        d.addEventListener("webkitTransitionEnd", f, !1);
        d.addEventListener("transitionend", f, !1);
        d.addEventListener("msTransitionEnd", f, !1);
        d.addEventListener("oTransitionEnd", f, !1);
        setTimeout(function () {
            a || g()
        }, c || 2E3)
    };
    g.getWindowPosition = function (d) {
        var b = 0,
            c = 0;
        do b += d.offsetLeft, c += d.offsetTop;
        while (d = d.offsetParent);
        return {
            left: b,
            top: c
        }
    };
    g.appNameFromUrl = function (d) {
        return (d = d.match(/^https?:\/\/[A-Za-z0-9]{40}-([A-Za-z0-9_-]+).*/)) ? d[1] : null
    };
    return g
}();
Spotify.Web.Fb = function (g, f, d, b) {
    var c = this,
        a = d || null,
        h = Spotify.Web.PublisherMessages,
        i = 50,
        l = function (b, c, d) {
            a = a || window.FB;
            a.init({
                appId: b.appId,
                music: "music" in b ? b.music : !1,
                cookie: "cookie" in b ? b.cookie : !0,
                logging: "logging" in b ? b.logging : !0,
                status: "status" in b ? b.status : !1,
                xfbml: "xfbml" in b ? b.xfbml : !1,
                oauth: "oauth" in b ? b.oauth : !1
            });
            n(c, d)
        }, m = function (c, d) {
            b.getFacebookUserId(function (b) {
                if (b) {
                    var f = a.getUserID();
                    b === f ? c() : d()
                } else d()
            })
        }, n = function (b, c) {
            a.getLoginStatus(function (a) {
                switch (a.status) {
                    case "connected":
                        m(function () {
                            g.notify(h.FB_APP_CONNECTED);
                            b()
                        }, c);
                        break;
                    case "not_authorized":
                        c();
                        break;
                    default:
                        c()
                }
            }, !0)
        }, o = function (a, b) {
            var d = c.getApi(),
                f = "[" + a.join(",") + "]";
            d.api("/threads", "post", {
                to: f,
                name: "Hey, sign up for a free Spotify account and come check out my music!",
                link: "http://www.spotify.com/start/?ref=linknuxinv"
            }, b)
        }, k = function (a) {
            var b = {
                status: "failure",
                message: ""
            };
            typeof a.error_msg != "undefined" ? b.message = a.error_msg : (b.status = "success", b.message = a);
            return b
        };
    this.connect = function (b, c, d) {
        if (!b || typeof b.appId !== "string") throw Error("AppId required");
        a ? n(c, d) : (f.loadScript("https://connect.facebook.net/en_US/all/vb.js"), window.FB ? l(b, c, d) : window.fbAsyncInit = function () {
            l(b, c, d)
        })
    };
    this.getApi = function () {
        if (a) return a;
        else throw Error("FB API not initialized");
    };
    this.getDevices = function (a) {
        this.getApi().api("/me?fields=devices", function (b) {
            if (typeof a === "function") {
                var c = [];
                if (typeof b.devices !== "undefined" && b.devices.length > 0) for (var b = b.devices, d = b.length, f = 0; f < d; f++) typeof b[f].hardware !== "undefined" ? c.push(b[f].hardware.toLowerCase()) : typeof b[f].os !==
                    "undefined" && c.push(b[f].os.toLowerCase());
                a.call(this, c)
            }
        })
    };
    this.getFriendsUsingApp = function (a) {
        this.getApi().api({
            method: "fql.query",
            query: "SELECT uid, name FROM user WHERE is_app_user = 1 AND uid IN (SELECT uid2 FROM friend WHERE uid1 = me())"
        }, function (b) {
            b = k(b);
            typeof a === "function" && a.call(this, b)
        })
    };
    this.getFriendsNotUsingApp = function (a) {
        this.getApi().api({
            method: "fql.query",
            query: "SELECT uid, name FROM user WHERE is_app_user = 0 AND uid IN (SELECT uid2 FROM friend WHERE uid1 = me())"
        }, function (b) {
            b = k(b);
            typeof a === "function" && a.call(this, b)
        })
    };
    this.getUserImage = function (a) {
        this.getApi().api({
            method: "fql.query",
            query: "select id, width, height, url, is_silhouette, real_width, real_height from profile_pic where id=me()"
        }, function (b) {
            b = k(b);
            typeof a === "function" && a.call(this, b)
        })
    };
    this.getUsersName = function (a) {
        this.getApi().api("/me?fields=name,last_name,first_name", function (b) {
            b = k(b);
            typeof a === "function" && a.call(this, b)
        })
    };
    this.sendInboxMessages = function (a, b) {
        function c(d) {
            a.length > 0 ? o(a.splice(0,
            i), c) : (d = k(d), typeof b === "function" && b.call(this, d))
        }
        a.length > 0 && o(a.splice(0, i), c)
    }
};
Spotify.Web.Context = function (g) {
    this.getState = function () {
        return g.getState()
    };
    this.getContext = function () {
        return g.getState().context
    };
    this.getFacebookContextType = function () {
        var f = this.getContext();
        if (!f || !f.uri) return null;
        var d = null;
        switch (f.uri.split(":")[1]) {
            case "user":
                d = "playlist";
                break;
            case "album":
                d = "album";
                break;
            case "artist":
                d = "musician";
                break;
            case "radio":
                d = "radio_station"
        }
        return d
    };
    this.getContextUrl = function () {
        var f = this.getContext();
        return f ? Spotify.Web.Utils.spotifyUriToOpenUrl(f.uri) : null
    };
    this.addEventListener = function (f, d) {
        g.addEvent(f, d)
    }
};
Spotify.Web.FacebookURLSchema = function () {
    var g = function (f) {
        var d = {};
        if (f.song) d.trackUrl = decodeURIComponent(f.song);
        if (f.musician) d.contextUrl = decodeURIComponent(f.musician);
        else if (f.album) d.contextUrl = decodeURIComponent(f.album);
        else if (f.playlist) d.contextUrl = decodeURIComponent(f.playlist);
        return d
    };
    this.shouldPlay = function (f) {
        f = Spotify.Web.URLParser.parseURL(f).params;
        return !(!f || !f.song && !f.musician && !f.album && !f.playlist)
    };
    this.getUrl = function (f) {
        var d = Spotify.Web.URLParser.parseURL(f, !0);
        if (!d.path) d.path =
            "";
        if (this.shouldPlay(f)) {
            f = Spotify.Web.URLParser.parseURL(f).params;
            f = g(f);
            if (!f.contextUrl && f.trackUrl) f.contextUrl = f.trackUrl, f.trackUrl = void 0;
            if (f.contextUrl) f = Spotify.Web.Utils.decodeOpenGraphUrl(f.contextUrl), d.path = "", f.user && (d.path += "user/" + f.user + "/"), d.path += f.context + "/" + f.contextId
        }
        return d.protocol + "://" + d.domain + "/" + d.path
    };
    this.playUrl = function (f, d, b, c) {
        if (this.shouldPlay(f)) {
            f = Spotify.Web.URLParser.parseURL(f).params;
            f = g(f);
            if (!f.contextUrl && f.trackUrl) f.contextUrl = f.trackUrl, f.trackUrl = void 0;
            if (f.contextUrl) {
                var a = Spotify.Web.Utils.openGraphUrlToSpotifyUri(f.contextUrl),
                    h;
                if (f.trackUrl) h = Spotify.Web.Utils.decodeOpenGraphUrl(f.trackUrl).contextId;
                Spotify.Web.Utils.decodeOpenGraphUrl(f.contextUrl).context === "artist" && h && (a = Spotify.Web.Utils.openGraphUrlToSpotifyUri(f.trackUrl), h = void 0);
                d(a, h, b, c);
                return !0
            }
        } else return !1
    }
};
Spotify.Web.OpenURLSchema = function () {
    var g = RegExp("/(?:user/(\\w*))?/?(playlist|album|artist|track|radio|radio/album|radio/artist|radio/track)/(\\w{22})(?:\\?play=)?(true|\\w{22})?"),
        f = function (d) {
            return (d = d.match(g)) ? {
                user: d[1] || null,
                context: d[2] || null,
                contextId: d[3] || null,
                play: d[4] || null
            } : null
        };
    this.shouldPlay = function (d) {
        d = f(d);
        return !(!d || !d.context || !(d.context === "track" || d.play))
    };
    this.getUrl = function (d) {
        d = Spotify.Web.URLParser.parseURL(d, !0);
        if (!d.path) d.path = "";
        return d.protocol + "://" + d.domain +
            "/" + d.path
    };
    this.playUrl = function (d, b, c, a) {
        if (this.shouldPlay(d)) {
            var d = f(d),
                g = "spotify:";
            d.user && (g += "user:" + d.user + ":");
            g += d.context + ":" + d.contextId;
            var i;
            if (d.play !== "true") i = d.play;
            d.context === "artist" && i && (g = "spotify:track:" + i, i = void 0);
            b(g, i, c, a);
            return !0
        } else return !1
    }
};
Spotify.Web.OpenGraph = function (g, f, d) {
    var b = this,
        c = f.audioManager.getPlayerAtIndex(0),
        a = new Spotify.Web.Context(f.contextPlayer),
        h = g.getApi().getAccessToken(),
        i = new Spotify.Events,
        l, m, n = function (a, b, c) {
            a = "https://graph.facebook.com/me/music.listens?song=" + a;
            b && (a += "&" + b + "=" + c);
            a += "&access_token=" + h;
            (new Request.CORS({
                url: a,
                data: null,
                method: "post",
                onSuccess: function (a) {
                    JSON.parse(a)
                },
                onFailure: function (a) {
                    d.logError("web.fb.opengraph.js", a.statusText, a.responseText)
                }
            })).send()
        }, o = function (a, b, c) {
            l && clearTimeout(l);
            l = setTimeout(function () {
                n(a, b, c);
                clearTimeout(l)
            }, 15E3)
        }, k = function () {
            c.trackUri.indexOf(":ad:") > -1 || b.getPostToOpenGraph(function (b) {
                if (b !== 0) {
                    var b = Spotify.Web.Utils.spotifyUriToOpenUrl(c.trackUri),
                        d = a.getFacebookContextType(),
                        f = a.getContextUrl();
                    o(b, d, f)
                }
            })
        }, p = function () {
            l && clearTimeout(l)
        }, q = function () {
            l && clearTimeout(l)
        };
    this.getPostToOpenGraph = function (a) {
        typeof m !== "undefined" ? a(m) : f.user.getUserInfo(function (b) {
            b.response ? (m = b.response.post_open_graph, typeof m === "undefined" && (m = null), a(m)) : (m = null, a(null))
        }, function () {
            a(null)
        }, !1)
    };
    this.start = function () {
        c.bind(i.PLAYING, k);
        c.bind(i.PAUSED, p);
        c.bind(i.STOPPED, q)
    }
};
Spotify.Web.MusicBridge = function (g, f, d, b) {
    Spotify.Web.Context.call(this, b);
    var c = b.audioManager.getPlayerAtIndex(0),
        a = new Spotify.Web.Context(b.contextPlayer),
        h, i = new Spotify.Events,
        l = function (a) {
            var b;
            if (a.album) b = a.album;
            else if (a.playlist) b = a.playlist;
            else if (a.song) b = a.song;
            else if (a.musician) b = a.musician;
            if (b) {
                b = Spotify.Web.Utils.decodeOpenGraphUrl(b);
                var c;
                c = b.user ? "spotify:user:" + b.user + ":" + b.context + ":" + b.contextId : "spotify:" + b.context + ":" + b.contextId;
                b.context === "artist" && (c += ":top:tracks");
                var f;
                if (b.context !== "track" && a.song) f = Spotify.Web.Utils.decodeOpenGraphUrl(a.song).contextId;
                d.play(c, f, function () {}, function () {})
            }
        }, m = function () {
            d.resume()
        }, n = function () {
            d.pause()
        }, o = function (b) {
            var b = b || c.isPlaying,
                b = {
                    playing: b,
                    song: Spotify.Web.Utils.spotifyUriToOpenUrl(c.trackUri, "https://play.spotify.com"),
                    user_id: h.getUserID()
                }, d = a.getFacebookContextType();
            d && (b[d] = a.getContextUrl());
            h.Music.send("STATUS", b)
        }, k = function () {
            o()
        }, p = function () {
            o(!0)
        }, q = function () {
            o(!1)
        }, s = function () {
            o(!1)
        };
    this.start = function () {
        h = f.getApi();
        h.Event.subscribe("fb.music.PLAY", l);
        h.Event.subscribe("fb.music.RESUME", m);
        h.Event.subscribe("fb.music.PAUSE", n);
        h.Event.subscribe("fb.music.STATUS", k);
        h.Event.subscribe("fb.music.BRIDGE_READY", function () {});
        h.Event.subscribe("fb.music.ALREADY_CONNECTED", function () {});
        h.Event.subscribe("fb.music.USER_MISMATCH", function () {});
        c.bind(i.PLAYING, p);
        c.bind(i.PAUSED, q);
        c.bind(i.STOPPED, s);
        g.subscribe(Spotify.Web.PublisherMessages.APPLICATION_CLOSED, this)
    };
    this.onNotify = function (a) {
        a.messageType === Spotify.Web.PublisherMessages.APPLICATION_CLOSED && (a = {
            offline: !0,
            user_id: h.getUserID()
        }, h.Music.send("STATUS", a))
    }
};
Spotify.Web.Player = function (g, f) {
    var d = g.audioManager.getPlayerAtIndex(0),
        b, c = f.iframe,
        a = f.url,
        h = !1,
        i = new Spotify.Events,
        l = function () {
            if (!h) h = !0, document.body.className = "started", c.tabIndex = "0"
        };
    this.initialize = function () {
        b = new Spotify.Web.Window({
            url: a,
            iframe: c
        });
        b.initialize();
        d.bind(i.LOAD, l);
        d.bind(i.PLAYING, l);
        b.bind("onMessage", function (a) {
            if (a.params.indexOf("ad_clicked") !== -1) g.adChooser.recordAdEvent("spotify:ad:" + d.ad.file_id, "click"), d.ad.clicked = !0
        })
    }
};
Spotify.Web.NUX = function (g, f, d) {
    function b(b) {
        var k;
        b.response || l();
        parseInt(b.response.ab_test_group, 10) > m && b.response.link_tutorial_completed == h ? (b = "", b = Spotify.Web.URLParser.parseURL(redirectTo), k = (b = b.pathSegments && b.pathSegments[0] === a.resourceId ? b.pathSegments.slice(1).join(":") : b.path) ? [b.replace(/\//g, ":")] : "", b = k, g.openUri(Spotify.Link.fromString("spotify:app:" + a.resourceId + ":" + b).toAppLink())) : l()
    }
    function c() {
        l()
    }
    var a = this;
    this.resourceId = "welcome";
    d(this.resourceId);
    var h = "0",
        i, l, m = 1E3;
    this.processFbResponse = function (b, c) {
        c.name = b;
        try {
            var d = JSON.stringify(c)
        } catch (h) {
            return
        }
        var i = f.getActiveFrame();
        g.getCurrentLink().id === a.resourceId && i.contentWindow.postMessage(d, "*")
    };
    this.setCompleted = function () {
        (new Request({
            url: "/xhr/json/nux/complete.php",
            method: "get",
            onSuccess: function () {}
        })).send()
    };
    this.init = function (a, d, f) {
        i = a;
        redirectTo = d;
        l = f;
        i.onReady(function () {
            i.getUserInfo(b, c)
        }, this)
    }
};
Spotify.Web.Ads = {};
Spotify.Web.Ads.PixelTracker = function (g) {
    this.core = g
};
Spotify.Web.Ads.PixelTracker.prototype.init = function () {
    img = document.createElement("img");
    img.id = "tpx";
    document.getElementById("main-nav").appendChild(img);
    context = new Spotify.Web.Context(this.core.contextPlayer);
    context.addEventListener("play", this.onTrackAboutToBePlayed)
};
Spotify.Web.Ads.PixelTracker.prototype.onTrackAboutToBePlayed = function () {
    var g = context.getState().track;
    g && g.advertisement && typeof g.popularity === "string" && g.popularity.match(/^https/) && setTimeout(function () {
        img.src = g.popularity
    }, 10)
};
Spotify.Web.Upsell = function (g, f, d) {
    var b = this,
        g = g || {}, c = g.onBeforeTimeout || 500,
        a = g.loggingEnabled || !0,
        h = g.controlGroup || 166,
        i = null,
        l = !1;
    this.simulation = !1;
    var m = document.getElementById("desktop"),
        n = null,
        o = null,
        k = null;
    this.init = function () {
        var a = this.getDisplayMode();
        a && this.applyDisplayMode(a)
    };
    var g = function (a) {
        window.location = a.downloadLink
    }, p = function () {
        var a = n.querySelector('input[name="phone_number"]'),
            b = n.querySelector('button[class="button"]'),
            c = n.querySelector(".error");
        /^\d{7,}$/.test(a.value.replace(/[\s()+\-\.]|ext/gi,
            "")) ? (a.setAttribute("disabled", "disabled"), b.setAttribute("disabled", "disabled"), c.innerHTML = "", (new Request({
            url: "/xhr/json/sms/send_sms.php",
            method: "get",
            data: {
                phone_number: a.value
            },
            onSuccess: function (d) {
                try {
                    d = JSON.parse(d)
                } catch (f) {
                    d = {}
                }
                if (typeof d.status !== "undefined" && d.status) n.querySelector(".phone-input").style.display = "none", $(n.querySelector(".success-feedback")).addClass("show"), A("send_sms");
                else {
                    var g = "An unexpected error occurred when sending the SMS";
                    if (typeof d.message !== "undefined") g = d.message;
                    c.innerHTML = g;
                    a.removeAttribute("disabled");
                    b.removeAttribute("disabled")
                }
            },
            onError: function () {
                c.innerHTML = "An unexpected error occurred when sending the SMS";
                a.removeAttribute("disabled");
                b.removeAttribute("disabled")
            }
        })).send()) : c.innerHTML = "The phone number is invalid"
    }, q = {
        android: {
            id: "send-sms-android",
            label: "android",
            text: "Get Spotify",
            subText: "on your Android",
            buttonText: "Get Started",
            mainClass: "android",
            options: {
                actions: {
                    ".button": p
                }
            }
        },
        iphone: {
            id: "send-sms-iphone",
            label: "iphone",
            text: "Get Spotify",
            subText: "on your iPhone",
            buttonText: "Get Started",
            mainClass: "iphone",
            options: {
                actions: {
                    ".button": p
                }
            }
        },
        windows: {
            id: "download-dialog-windows",
            label: "windows",
            text: "Install Spotify on Windows",
            subText: "For the full Spotify experience",
            buttonText: "Install Spotify",
            downloadLink: "http://download.spotify.com/Spotify%20Installer.exe",
            mainClass: "desktop-background",
            options: {},
            onBefore: g
        },
        mac: {
            id: "download-dialog-mac",
            label: "mac",
            text: "Install Spotify on Your Mac",
            subText: "For the full Spotify experience",
            buttonText: "Install Spotify",
            downloadLink: "http://download.spotify.com/Spotify.dmg",
            mainClass: "desktop-background",
            options: {},
            onBefore: g
        }
    };
    this.getDisplayMode = function (a, b) {
        var c = null;
        typeof a !== "undefined" ? typeof b !== "undefined" && b.getDevices(function (b) {
            var d;
            if (b.length > 0) {
                if (d = null, b.length > 0) {
                    var f = null;
                    b.indexOf("iphone") >= 0 ? f = "iphone" : b.indexOf("android") >= 0 ? f = "android" : b.indexOf("ipad") >= 0 && (f = "ipad");
                    b = f;
                    b !== null && typeof q[b] !== "undefined" && (d = q[b])
                }
            } else d = x();
            c = d;
            a(c)
        }) : c = x();
        return c
    };
    this.isEnabled = function () {
        return i == null || i >= h || this.simulation
    };
    this.applyDisplayMode = function (a) {
        if (f !== null) f.onReady(function () {
            f.getUserInfo(function (c) {
                c.response && (i = parseInt(c.response.ab_test_group, 10));
                b.setDisplayMode(a)
            })
        }, this)
    };
    this.onFbConnect = function (a) {
        this.getDisplayMode(function (a) {
            b.applyDisplayMode(a)
        }, a)
    };
    this.showPopup = function (a) {
        if (!l) k = document.getElementById("download-spotify"), n = document.getElementById(a.id), n.style.display = "block", o = n.querySelector(".dialog"), v(o, k),
        o.className += " show", l = !0, window.addEventListener("resize", s, !1), window.addEventListener("keydown", t), n.addEventListener("click", D)
    };
    this.hidePopup = function () {
        if (l) {
            var a = n.querySelector(".dialog");
            $(a).removeClass("show");
            n.style.display = "none";
            l = !1;
            window.removeEventListener && (window.removeEventListener("resize", s), window.removeEventListener("keydown", t), n.removeEventListener("click", D))
        }
    };
    this.setDisplayMode = function (a) {
        if (a && this.isEnabled()) {
            m.querySelector(".title").innerHTML = a.text;
            m.querySelector(".subtitle").innerHTML = a.subText;
            m.querySelector("button").innerHTML = a.buttonText;
            if (typeof a.mainClass !== "undefined") {
                var c = m.querySelector(".content");
                c.className = "content";
                $(c).addClass("upsell-background");
                $(c).addClass(a.mainClass)
            }
            y(a);
            w(a);
            this.fixHeight();
            window.addEventListener("resize", b.fixHeight, !1);
            m.querySelector(".content").addClass("show");
            A("show_version", a.label)
        }
    };
    this.simulate = function (a) {
        if (typeof q[a] !== "undefined") this.simulation = !0, this.setDisplayMode(q[a])
    };
    this.fixHeight = function () {
        var a = m.parentNode;
        m.style.height = a.offsetHeight - a.querySelector("#app-player").offsetHeight + "px"
    };
    var s = function () {
        v(o, k)
    }, t = function (a) {
        a.keyCode == 27 && b.hidePopup()
    }, y = function (a) {
        m.querySelector("#download-spotify").onclick = function () {
            typeof a.onBefore !== "undefined" ? (b.showPopup(a), window.setTimeout(function () {
                a.onBefore(a)
            }, c)) : b.showPopup(a);
            A("click_version")
        }
    }, w = function (a) {
        if (typeof a.options.actions !== "undefined") for (action in a.options.actions) if (a.options.actions.hasOwnProperty(action)) document.querySelector("#" + a.id + " " + action).onclick = function () {
            a.options.actions[action]()
        }
    }, v = function (a, b) {
        var c = $(b).getSize().y / 2,
            d = $(b).getPosition(),
            c = {
                x: d.x - (a.getSize().x + 15),
                y: d.y - a.getSize().y * 0.7 + c
            };
        $(a).position(c)
    }, x = function () {
        var a = null,
            b = Spotify.Web.BrowserDetect.OS.toLowerCase();
        typeof q[b] !== "undefined" && (a = q[b]);
        return a
    }, D = function (a) {
        l && (!a.target || !$(a.target).getParents().contains(n)) && b.hidePopup()
    }, A = function (b, c) {
        a && d && d.event("upsell", b, c || "", 1)
    }
};
Spotify.Web.Storage.Cookie = function (g, f, d, b, c) {
    var b = b || {}, a = b.expires || 360,
        h = b.path || "/",
        i, l, m = function (a) {
            k(function (b) {
                var f = null,
                    g = (c.cookie ? c.cookie : "").split(";");
                b += "=";
                for (var h = 0; h < g.length; h++) {
                    for (var i = g[h]; i.charAt(0) === " ";) i = i.substring(1, i.length);
                    i.indexOf(b) === 0 && (f = i.substring(b.length, i.length))
                }
                if (f) try {
                    l = JSON.parse(d.decode(f.replace(/\_/g, "=")))
                } catch (k) {
                    l = {}
                } else l = {};
                typeof a !== "undefined" && a(l)
            })
        }, n = function (b) {
            k(function (f) {
                var g = o(d.encode(l ? JSON.stringify(l) : "")),
                    i = new Date;
                i.setDate(i.getDate() + a);
                f = f + "=" + g + ";";
                f += " expires=" + i.toUTCString() + ";";
                f += " path=" + h + ";";
                f += window.location && window.location.protocol === "https:" ? " secure;" : "";
                c.cookie = f;
                typeof b !== "undefined" && b()
            })
        }, o = function (a) {
            return a.replace(/\=/g, "_")
        }, k = function (a) {
            typeof i !== "undefined" && a(i);
            f.getUsername(function (b) {
                i = o(d.encode(g + b));
                a(i)
            }, function () {})
        };
    this.init = function () {
        m()
    };
    this.get = function (a) {
        return !l ? void 0 : l[a]
    };
    this.set = function (a, b) {
        l || (l = {});
        l[a] = b;
        n()
    };
    this.remove = function (a) {
        return typeof l[a] !==
            "undefined" ? (delete l[a], n(), !0) : !1
    };
    this.destroy = function () {
        l = null;
        n()
    }
};
Spotify.Web.Bookmark = function (g, f) {
    this.STORAGE_KEY = "bookmark_seen";
    this.TIME_UNTIL_SHOWN = 1E4;
    var d = this;
    this.init = function () {
        this.hasBeenShown() || setTimeout(function () {
            d.show();
            d.markAsShown()
        }, this.TIME_UNTIL_SHOWN)
    };
    this.show = function () {
        g.notify(Spotify.Web.PublisherMessages.ERROR, {
            type: Spotify.Web.ErrorTypes.BOOKMARK
        })
    };
    this.markAsShown = function () {
        f.set(this.STORAGE_KEY, !0)
    };
    this.hasBeenShown = function () {
        return f.get(this.STORAGE_KEY)
    }
};
