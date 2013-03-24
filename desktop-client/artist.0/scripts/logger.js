require([
  '$api/models',
  '/scripts/env#Environment'
], function(Models, Environment) {
  function Logger() {
    this.context = 'artist';
    this.testGroup = false;
    this.eventVersion = 1;
    this.testVersion = 'base';
  }

  Logger.prototype.setTestGroup = function(testGroupID) {
    this.testGroup = testGroupID;
  };

  Logger.prototype.setTestVersion = function(version) {
    this.testVersion = version;
  };

  Logger.prototype.getTestVersion = function() {
    return this.testVersion;
  };

  Logger.prototype.isBaseVersion = function() {
    return this.getTestVersion() === 'base';
  }

  Logger.prototype.clientEvent = function(event, data) {
    if (typeof(data) === 'undefined') {
      var data = {};
    }
    data.environment = (Environment.desktop ? 'desktop' : 'web');
    Models.application.clientEvent(this.context, event, this.eventVersion, this.testVersion, data);
  };

  exports.Logger = Logger;
});
