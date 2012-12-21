/**
 * Copyright (c) 2012 Spotify Ltd
 * @module {util/eventhandler}
 */

// TODO(djlee): delete this, this is only here for backwards compatibility.
// New users should use $util/events directly

'use strict';

sp = getSpotifyApi();

var events = sp.require('$util/events');

exports.EventHandler = events.EventHandler;
