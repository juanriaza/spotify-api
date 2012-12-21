"use strict";

var sp = getSpotifyApi(1);

var r = sp.require("sp://import/scripts/react");

exports.metaKey = navigator.platform === "MacIntel" ? "metaKey" : "ctrlKey";

exports.whileFocused = whileFocused;

function whileFocused(element, es) {
    return r["switch"](r.fromDOMEvent(element, "focus"), function(_) {
        return r.takeUntil(r.fromDOMEvent(element, "blur"), es);
    });
}