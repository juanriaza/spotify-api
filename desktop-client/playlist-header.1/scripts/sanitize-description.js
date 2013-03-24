(function() {

  /**
   * An element used as a wrapper when converting allowed elements
   * to HTMLElements.
   * @type {HTMLElement}
   */
  var el = document.createElement('div');

  /**
   * A RegExp matching allowed tags.
   * BUT!!!1 Aren't you afraid of Cthulu? Well, see line 31.
   * @type {RegExp}
   */
  var rAllowed = /(<([abi])\b(\s+(href|target)=(['"])[^'"]+\5){0,2}>)(.*?)(<\/\2>)/gi;

  /**
   * Takes a playlist description and returns a safe-to-innerHTML string
   * where only <a href>, <b> and <i> aren't escaped.
   * @param  {string} str The playlist description to be sanitized.
   * @return {string}     The sanitized playlist description.
   */
  function sanitizeDescription(str) {
    var matches, lastMatchedIndex, allowedEl, isAllowed, href, i;
    var out = '';

    // Reset the index of the regex to make it start from the beginning.
    rAllowed.lastIndex = lastMatchedIndex = 0;

    while ((matches = rAllowed.exec(str))) {
      // WTF did you just do? Did you match HTML with a regex? Don't you know
      // HTML and regex go together like love, marriage, and ritual infanticide? [1]
      //
      // As a matter of fact, I do. And I don't enjoy ritual infanticide. However,
      // we do need a lightweight way of enabling <a href>, <b> and <i> in the
      // description, and we cannot trust the data from the server just yet. It
      // will give us back free text and as such it might contain all XSS attack
      // vectors known to man, hurray!
      //
      // The approach chosen is to rigidly parse a super-tiny subset of HTML to
      // a depth of exactly 1. So we're extremly picky about what we'll let
      // through to be innerHTML:ed. Only non-self-closed <a>, <b> and <i>
      // elements with a properly quoted href and/or target attribute will pass
      // the regex needle's eye. This (hopefully) means that we never ever let
      // any false positives through, though we might miss some links with eg.
      // extra attributes, unqouted attributes or similar. Tough luck!
      //
      // The goal if this code is to not be needed. In the upcoming service
      // playlist-annotate2 we will not accept any HTML, but rather just a
      // tiny subset of markdown instead, and then this problem will be out
      // of the world. But since Link is already live, we need a working fix
      // for this deployed now, and not in a perfect future.
      //
      // [1] http://stackoverflow.com/questions/1732348/regex-match-open-tags-except-xhtml-self-contained-tags/1732454#1732454


      // Escape and add the non-matched part since last match.
      out += escapeHtml(str.substring(lastMatchedIndex, rAllowed.lastIndex - matches[0].length));

      // Create a node from the start and the end tag.
      el.innerHTML = matches[1] + matches[7];
      if (el.childNodes.length === 1) {
        isAllowed = true;
        allowedEl = el.childNodes[0];

        if (allowedEl.nodeName.toLowerCase() === 'a') {
          // Handle <a> href and target
          href = allowedEl.getAttribute('href') || '';

          if (!(/^(spotify|http)/).test(href)) {
            // Only allow href:s starting with either spotify or http.
            isAllowed = false;
          } else if (href.indexOf('spotify:') === 0) {
            // Convert spotify-URI:s to proper URL:s and intenionally let
            // them specify their own target as they wish.
            allowedEl.setAttribute('href', href.toSpotifyURL());
          } else {
            // Non-spotify-URI:s are forced to open in a new page.
            allowedEl.setAttribute('target', '_blank');
          }
        } else {
          // Remove all attributes to be on the safe side.
          allowedEl.removeAttribute('href');
          allowedEl.removeAttribute('target');
        }

        if (isAllowed) {
          // Set the tag content and append it to the output
          allowedEl.textContent = matches[6];
          out += allowedEl.outerHTML;
        } else {
          out += escapeHtml(matches[0]);
        }
      }

      // Save the lastIndex of the match to know what to consume in the next
      // iteration.
      lastMatchedIndex = rAllowed.lastIndex;
    }
    // Escape and add the remains of the input to the output
    out += escapeHtml(str.substring(lastMatchedIndex));

    return out;
  }

  function escapeHtml(str) {
    el.textContent = str;
    return el.innerHTML;
  }

  exports.sanitizeDescription = sanitizeDescription;

})();
