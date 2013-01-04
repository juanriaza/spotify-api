// To make testing possible through TC and in desktop.
// Test-runner requires absolute path to app
// but this is not supported in link (production).
String.prototype.toPath = function() {
  return (window.location.protocol === 'sp:') ? '$search/' + this : this;
};

require(['$search/../tests/test.utils'], function() {});
