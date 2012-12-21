// Include the test modules we want to run so that the tester can find them.
require([
  '$api/../tests/analytics',
  '$api/../tests/core',
  '$api/../tests/i18n',
  '$api/../tests/location',
  '$api/../tests/messaging',
  '$api/../tests/promise',
  '$api/../tests/user'
], function() {});
