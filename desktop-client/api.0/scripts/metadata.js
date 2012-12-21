'use strict';

var sp = getSpotifyApi();

exports.getMetadata = getMetadataWithCache;

var SESSION_STORAGE_PREFIX = 'mc-';

/**
 * Fetches metadata for the specified URI(s).
 * @param {string|Array.<string>} uri URI or list of URIs to get metadata for.
 * @param {Function} onSuccess Callback to call when the metadata has been fetched.
 * @param {Function} onError Callback to call if the fetch fails.
 */
function getMetadata(uri, onSuccess, onError) {
  sp.core.getMetadata(uri, {
    onSuccess: compose(onSuccess, partial(cacheMetadata, uri)),
    onFailure: onError
  });
}

/**
 * Fetches metadata for the specified URI(s) from the cache if possible, otherwise does a normal metadata fetch.
 * @param {string|Array.<string>} uri URI or list of URIs to get metadata for.
 * @param {Function} onSuccess Callback to call when the metadata has been fetched.
 * @param {Function=} opt_onError Callback to call if the fetch fails.
 */
function getMetadataWithCache(uri, onSuccess, opt_onError) {
  var md = sessionStorage.getItem(SESSION_STORAGE_PREFIX + uri);
  if (null === md) {
    getMetadata(uri, onSuccess, opt_onError || id);
  } else {
    onSuccess(JSON.parse(md));
  }
}

/**
 * Caches the provided metadata for the specified URI(s).
 * @param {string|Array.<string>} uri The URI to cache the data for.
 * @param {Object} md The metadata to cache.
 * @return {Object} The metadata that was provided.
 */
function cacheMetadata(uri, md) {
  // Don't cache if uninitialized
  if (null !== md) {
    if (typeof uri === 'string') {
      sessionStorage.setItem(SESSION_STORAGE_PREFIX + uri, JSON.stringify(md));
    } else if (uri instanceof Array && uri.length == 1) {
      sessionStorage.setItem(SESSION_STORAGE_PREFIX + uri[0], JSON.stringify(md[0]));
    }
  }
  return md;
}
