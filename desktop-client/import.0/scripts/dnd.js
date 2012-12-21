/**
 * Drag and drop.
 */

"use strict";

// Hack to get around some current drag image limitations
window.addEventListener("dragstart", function(e) {
    var dragImage;
    var anchor;
    var parent;
    if (e.target instanceof HTMLAnchorElement) {
        anchor = e.target;
    } else {
        // Check if any ascendant is an anchor
        parent = e.target.parentElement;
        while (parent) {
            if (parent instanceof HTMLAnchorElement) {
                anchor = parent;
                break;
            }
            parent = parent.parentElement;
        }
    }
    if (!anchor) return;

    dragImage = document.createElement("div");
    dragImage.className = "sp-drag-image sp-text-truncate";
    dragImage.textContent = (anchor.title ? anchor.title : anchor.textContent).decodeForText();
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 20);
    e.dataTransfer.setData("uri", anchor.href);
    setTimeout(function() {
        document.body.removeChild(dragImage);
    }, 0);
}, false);
