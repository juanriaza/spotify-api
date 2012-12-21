'use strict';

var animatedBanner = sp.require('assets/js/animatedbanner');
var ads = sp.require('assets/js/ads');

var ABTest = {
  /**
   * @constructor
   * @this ABTest
   */
  loggingVersion: null,
  testVersion: null,
  layoutTest: null,

  init: function() {
    var self = ABTest;
    // console.log('ABtest', ABTest);
    var mpu = ads.Ads.hasMPU();

    if (this.testVersion === 'base') {
      animatedBanner.AnimatedBanner.testVersion = this.testVersion;
      animatedBanner.AnimatedBanner.loggingVersion = this.loggingVersion;
      animatedBanner.AnimatedBanner.headingsLoc = self.headingsLoc;
      animatedBanner.AnimatedBanner.init();

      if (mpu === true) {
        var topList = document.getElementById('Banners'),
            newAlbums = document.getElementById('NewAlbums'),
            parent = topList.parentNode;
        if ('NewAlbums' !== parent.querySelector('SECTION').id) {
          parent.insertBefore(newAlbums, topList);
        }
      }
    } else {
      // Keep it old school
    }
  }
};

exports.ABTest = ABTest;
