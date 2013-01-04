/**
 * Copyright (c) 2012 Spotify Ltd
 * @author Martin Jönsson <mart@spotify.com>
 * @author Kalle Persson <awkalle@spotify.com>
 *
 * In the search app the MVC-pattern is used.
 * Here, we initiate:
 * the Model (data)
 * the View (view)
 * the Controller (controller)
 */
console.timeEnd('MOOTOOLS');

/*
 * To make testing possible through TC and in desktop.
 * Test-runner requires absolute path to app
 * but this is not supported in link (production).
 */
String.prototype.toPath = function() {
  return (window.location.protocol === 'sp:') ? '$' + window.location.host.split('.')[1] + '/' + this : this;
};

console.time('REQUIRE');
require([
  '$api/models',
  'scripts/data#Data'.toPath(),
  'scripts/controller#Controller'.toPath(),
  'scripts/view#View'.toPath(),
  'scripts/logger#Logger'.toPath()
], function(models, Data, Controller, View, Logger) {
  'use strict';
  console.timeEnd('REQUIRE');
  console.time('TIME BEFORE REQUEST');
  models.session.load('testGroup').done(function(session) {
    var l = new Logger();
    l.setTestGroup(session.testGroup);

    var d = new Data(l);
    var v = new View(l);
    var c = new Controller(d, v, l);

    c.init();
  });
});

