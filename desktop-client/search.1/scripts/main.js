/**
 * Copyright (c) 2012 Spotify Ltd
 * @author Martin Jönsson <mart@spotify.com>
 */

require([
  _('scripts/data#Data'),
  _('scripts/controller#Controller'),
  _('scripts/view#View'),
  _('scripts/logger#Logger')
], function(Data, Controller, View, Logger) {
  'use strict';

  console.time('TOTAL');
  console.time('- TIME BEFORE REQUEST -> ');
  var l = new Logger();
  var d = new Data(l);
  var v = new View(l);
  var c = new Controller(d, v, l);

  c.init();

});

