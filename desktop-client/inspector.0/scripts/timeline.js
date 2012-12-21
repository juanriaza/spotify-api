require('$api/devtools', function(stats) {
  var panel;

  function createRecord(data, type) {
    var instanceData = data.instance.match(/spotify:instance:(.*?):(\d+)/);
    var appID = instanceData[1];
    var instanceID = instanceData[2];
    var isGlobalInspector = /^sp:/.test(document.location);
    return {
      isGlobalInspector: isGlobalInspector,
      startTime: data.start * 1000,
      endTime: data.end * 1000,
      type: type,
      context: data.context,
      app: {
        id: appID + ':' + instanceID,
        identifier: appID,
        name: appID,
        instance: instanceID
      },
      stackTrace: data.stacktrace,
      data: {
        url: data.stacktrace[0].url,
      }
    };
  }

  function createApiRequestRecord(data) {
    var record = createRecord(data, 'SpotifyAPIRequest');
    record.data.requestName = data.name;
    record.data.arguments = data.args;
    return record;
  }

  function createAppContextRecord(type, data, name, id) {
    data.stacktrace = preprocessAppContextStack(data.stacktrace);
    var record = createRecord(data, type);
    record.data.contextName = name;
    record.data.id = id;
    return record;
  }

  function createAppContextBeginRecord(data, name, id) {
    return createAppContextRecord('SpotifyAppContextBegin', data, name, id)
  }

  function createAppContextEndRecord(data, name, id) {
    return createAppContextRecord('SpotifyAppContextEnd', data, name, id)
  }

  function parseContextData(data) {
    var contextData = JSON.parse(data.args);
    var context = { id: contextData[0], name: contextData[1] };
    context.data = data;
    return context;
  }

  function preprocessAppContextStack(stack) {
    var foundStart = false;
    var result = [];
    for (var i = 0, l = stack.length; i < l; i++) {
      if (foundStart) {
        result.push(stack[i]);
      } else {
        foundStart = (stack[i].functionName == 'SpotifyApi.analyticsContext');
      }
    }
    return result;
  }

  function onProfilingEvent(event) {
    var record;
    var data = event.data;
    if (data.name === 'core_context_begin') {
      var context = parseContextData(data);
      record = createAppContextBeginRecord(data, context.name, context.id);
      if (record.isGlobalInspector) {
        return;
      }
    } else if (data.name === 'core_context_end') {
      var context = parseContextData(data);
      record = createAppContextEndRecord(data, context.name, context.id);
      if (record.isGlobalInspector) {
        return;
      }
    } else {
      record = createApiRequestRecord(data);
    }
    WebInspector.timelineManager._dispatcher.eventRecorded(record);
  }

  function onToggleTimeline() {
    if (panel.toggleTimelineButton.toggled) {
      stats.enableProfiling(onProfilingEvent);
    } else {
      stats.disableProfiling();
    }
  }

  function init() {
    panel = WebInspector.panels.timeline;
    panel.toggleTimelineButton.addEventListener(
      "click", onToggleTimeline, this);
    if (/^sp:/.test(document.location)) {
      var style = document.createElement('style');
      style.innerHTML = '#toolbar, button.dock-status-bar-item,\
        button.console-status-bar-item, button.settings-status-bar-item,\
        button.garbage-collect-status-bar-item {display: none;} #main {top: 0}';
      document.head.appendChild(style);
    }
    WebInspector.toolbar._updateDropdownButtonAndHideDropdown();
    WebInspector.inspectorView.setCurrentPanel(WebInspector.panels.timeline);
  }

  function installInitHook() {
    var hook = InspectorFrontendAPI.loadCompleted;
    if (!hook) {
      throw new Error("Unable to install profiling hook");
    }
    InspectorFrontendAPI.loadCompleted = function() {
      hook();
      init();
    };
  }

  if (WebInspector.panels) {
    init();
  } else {
    installInitHook();
  }

});
