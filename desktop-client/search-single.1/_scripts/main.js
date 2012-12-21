/**
 * Copyright (c) 2012 Spotify Ltd
 * @author Gabriel Bonander <gabbon@spotify.com>
 * @author Martin Jönsson <mart@spotify.com>
 * @author Kalle Persson <awkalle@spotify.com>
 */

require([
  'scripts/search#Search',
  'scripts/logger#Logger'
], function(Search, Logger) {
  'use strict';

  var s = new Search(new Logger());
  s.init();

});

