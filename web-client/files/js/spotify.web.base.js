var Spotify = Spotify || {};
Spotify.Web = Spotify.Web || {};
Spotify.Web.Screens = Spotify.Web.Screens || {};
Spotify.Web.Storage = Spotify.Web.Storage || {};
var _ = function (c) {
    return "undefined" != typeof spotLang && spotLang[c] ? spotLang[c] : c.replace("_", " ")
};
Spotify.Web.Dotter = function (c, f, a) {
    var e = 0,
        d, b = c.innerHTML;
    this.start = function () {
        d || (d = setInterval(function () {
            e++;
            e > f && (e = 0);
            for (var d = b, a = 0; a < e; a++) d += ".";
            c.innerHTML = d
        }, a))
    };
    this.stop = function () {
        d && clearInterval(d);
        c.innerHTML = b
    }
};
Spotify.Web.Authenticator = function () {
    var c = !1,
        f = function (a, e, d) {
            if (!c) {
                c = !0;
                var b = new XMLHttpRequest;
                b.onreadystatechange = function () {
                    if (b.readyState === 4 && b.status === 200) {
                        setTimeout(function () {
                            c = !1
                        }, 1E3);
                        var a = JSON.parse(b.responseText);
                        a.status === "OK" ? e(a.config) : d(a.error)
                    }
                };
                b.open("POST", "/xhr/json/auth.php", !0);
                b.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                b.send(a)
            }
        };
    this.authenticateWithFacebookCredentials = function (a, e, d, b, c) {
        a = "type=fb&fbuid=" + encodeURIComponent(a) +
            "&token=" + encodeURIComponent(e) + "&secret=" + encodeURIComponent(d);
        f(a, b, c)
    };
    this.authenticateWithUsernameAndPassword = function (a, c, d, b, g) {
        a = "type=sp&username=" + encodeURIComponent(a) + "&password=" + encodeURIComponent(c) + "&secret=" + encodeURIComponent(d);
        f(a, b, g)
    }
};
Spotify.Web.Screens.Intermediate = function (c) {
    var f = new Spotify.Web.Authenticator,
        a = document.getElementById("login-screen"),
        e = document.querySelector("form #secret").value,
        d = !1,
        b = !1,
        g = function (a) {
            document.getElementById("timeout").style.display = "block";
            var b = new XMLHttpRequest;
            b.open("GET", "/xhr/json/log.php?type=FB_CONNECTION_FAILED&error=" + (a || "unknown"), !0);
            b.send()
        }, h = function (a) {
            if (b) return !0;
            return Spotify && Spotify.Web && Spotify.Web.App ? (setTimeout(function () {
                b = !0;
                Spotify.Web.App.initialize(a,
                window.FB)
            }, 1), !0) : !1
        }, i = function (c) {
            d = !0;
            b = h(c);
            if (!b) var e = setInterval(function () {
                h(c) && clearInterval(e)
            }, 2E3);
            a.className = "hidden";
            setTimeout(function () {
                a.style.display = "none"
            }, 1E3)
        }, k = function () {
            g("account_creation_failed")
        }, j = function () {
            FB.init(c);
            FB.getLoginStatus(function (a) {
                a.status === "connected" ? f.authenticateWithFacebookCredentials(a.authResponse.userID, a.authResponse.accessToken, e, i, k) : g("not_connected")
            })
        };
    this.init = function () {
        var a = new XMLHttpRequest;
        a.open("GET", "/xhr/json/log.php?type=INTERMEDIATE_JS_READY", !0);
        a.send();
        setTimeout(function () {
            d || g("timed_out")
        }, 3E4);
        window.fbAsyncInit = j;
        var b = document.getElementsByTagName("script")[0];
        if (!document.getElementById("facebook-jssdk")) a = document.createElement("script"), a.id = "facebook-jssdk", a.async = !0, a.src = "//connect.facebook.net/en_US/all/vb.js", b.parentNode.insertBefore(a, b)
    }
};
Spotify.Web.Screens.Login = function (c, f) {
    var a = {
        invalid_credentials: _("Incorrect username and password"),
        invalid_country: _("Spotify is currently not available in your country"),
        capped: _("You have reached your maximum number of login attempts, please try again later"),
        service_unavailable: _("Service is currently unavailable. Please try again later"),
        fallback: _("Authentication failed. Please try again.")
    }, e = new Spotify.Web.Authenticator,
        d, b = !1,
        g = document.getElementById("fb-login-btn"),
        h = new Spotify.Web.Dotter(g,
        3, 500),
        i = document.getElementById("sp-login-form"),
        k = document.getElementById("login-screen"),
        j = document.getElementById("login-method"),
        q = document.getElementById("bg-wrap"),
        r = document.getElementById("login-spotify"),
        s = document.getElementById("login-usr"),
        t = document.getElementById("login-cancel"),
        o = document.querySelector("#login .error"),
        l = i.querySelector('[name="secret"]').value,
        p = function (a) {
            if (b) return !0;
            return Spotify && Spotify.Web && Spotify.Web.App ? (setTimeout(function () {
                b = !0;
                Spotify.Web.App.initialize(a,
                window.FB)
            }, 1), !0) : !1
        }, m = function (a) {
            b = p(a);
            if (!b) var c = setInterval(function () {
                p(a) && clearInterval(c)
            }, 2E3);
            h.stop();
            k.className = "hidden";
            setTimeout(function () {
                k.style.display = "none"
            }, 1E3)
        }, n = function (b) {
            o.innerHTML = a[b] ? a[b] : a.fallback;
            o.style.display = "block"
        }, u = function () {
            FB.init(c);
            FB.getLoginStatus(function (a) {
                d = a
            })
        }, v = function () {
            i.addEventListener("submit", function (a) {
                a.preventDefault();
                var a = i.querySelector('[name="username"]').value,
                    b = i.querySelector('[name="password"]').value;
                e.authenticateWithUsernameAndPassword(a,
                b, l, m, n)
            });
            j.addEventListener("dragstart", function (a) {
                a.preventDefault()
            });
            r.addEventListener("click", function (a) {
                a.preventDefault();
                j.className = "flip";
                s.focus()
            });
            t.addEventListener("click", function (a) {
                a.preventDefault();
                j.className = "unflip"
            });
            g.addEventListener("click", function (a) {
                a.preventDefault();
                h.start();
                typeof d !== "undefined" && (d.status === "connected" ? e.authenticateWithFacebookCredentials(d.authResponse.userID, d.authResponse.accessToken, l, m, n) : FB.login(function (a) {
                    a.authResponse ? e.authenticateWithFacebookCredentials(a.authResponse.userID,
                    a.authResponse.accessToken, l, m, n) : h.stop()
                }))
            })
        };
    this.init = function () {
        v();
        var a = new Image;
        a.onload = function () {
            q.className = "loaded"
        };
        a.src = f;
        window.fbAsyncInit = u;
        var b = document.getElementsByTagName("script")[0];
        if (!document.getElementById("facebook-jssdk")) a = document.createElement("script"), a.id = "facebook-jssdk", a.async = !0, a.src = "//connect.facebook.net/en_US/all/vb.js", b.parentNode.insertBefore(a, b)
    }
};
