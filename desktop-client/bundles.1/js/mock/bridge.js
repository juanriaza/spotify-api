if (!window.sp) {
  window.sp = {};
}

var sp = window.sp;
delete sp.bundles;

sp.bundles = {
  get: function (ids) {
    var result, bundle, data;
    result = [];

    if (typeof ids === 'string') {
      for (var id in mock.bundles) {
        bundle = mock.bundles[id];
        isApp = ids === 'apps' && bundle.versions[0].type === 'app';
        isFramework = ids === 'frameworks' && bundle.versions[0].type === 'framework';
        if (isApp || isFramework) {
          if (bundle) {
            result.push(JSON.parse(JSON.stringify(bundle)));
          }
        }
      }
    } else if (ids.length === 0) {
      for (var id in mock.bundles) {
        data = mock.bundles[id];
        if (data) {
          result.push(JSON.parse(JSON.stringify(data)));
        }
      }
    } else {
      ids.forEach(function (id) {
        data = mock.bundles[id];
        if (data) {
          result.push(JSON.parse(JSON.stringify(data)));
        }
      });
    }

    return result;
  },
  update: function (id, version) {

    // Set an artificial delay to emulate server load
    setTimeout(function () {

      var bundle, version, parts, deps, i, l, depBundle, hasDummyNewDep;

      // Get the bundle data
      bundle = mock.bundles[id];

      if (!bundle) {
        return;
      }

      // Copy the current latest version data
      version = JSON.parse(JSON.stringify(bundle.versions[0]));

      // Up the version number and reset status
      parts = version.version.split('.');
      version.version = parts[0] + '.' + (parseInt(parts[1], 10) + 1) + '.' + parts[2];
      version.status = 'on-disk';

      // Change dependencies
      deps = version.dependencies;
      for (i = 0, l = deps.length; i < l; i++) {

        // A bundle that contains JS Extras will upgrade to not use JS Extras
        if (deps[i].id === 'js-extras') {
          deps.splice(i, 1);
          i--; l--;
          continue;
        }

        // A bundle using the JS API will upgrade the JS API dependency
        if (deps[i].id === 'js-api' && deps[i].currentVersion === '1.5.0') {
          deps[i].minimumVersion = '2.6.0';
          deps[i].currentVersion = '2.7.0';
        }

        if (deps[i].id === 'new-framework') {
          hasDummyNewDep = true;
        }
      }

      // Add new dependency
      if (!hasDummyNewDep) {
        deps.push({
          id: 'new-framework',
          name: 'New Framework',
          minimumVersion: '1.0.0',
          currentVersion: '1.1.0'
        });
      }

      // Add new version as latest version
      bundle.versions.unshift(version);

      sp.bundles.triggerEventListeners('installComplete', { data: JSON.parse(JSON.stringify(bundle)), type: 'installComplete' });

      // Add new bundle object (install dependency)
      if (!mock.bundles['new-framework']) {
        depBundle = JSON.parse(JSON.stringify(mock.base));
        depBundle.id = 'new-framework';
        depBundle.versions[0].id = 'new-framework';
        depBundle.versions[0].name = 'New Framework';
        depBundle.versions[0].description = 'This is a new framework.';
        mock.bundles['new-framework'] = depBundle;
      }
      
    }, Math.floor(Math.random() * (3000 - 100 + 1)) + 100);
  },

  remove: function (id) {
    if (mock.bundles[id]) {
      delete mock.bundles[id];
      return true;
    } else {
      return false;
    }
  },
  quit: function (id, doForce) {
    var bundle, i, l, dep, n, len;

    var quit = function (id) {
      bundle = mock.bundles[id];
      if (bundle) {
        bundle.inUse = false;

        // Drill down into the dependencies
        for (i = 0, l = bundle.versions[0].dependencies.length; i < l; i++) {
          dep = mock.bundles[bundle.versions[0].dependencies[i].id];

          if (dep && dep.versions[dep.currentVersion]) {
            dep = dep.versions[dep.currentVersion];

            // Drill down into the apps that are using this dependency
            for (n = 0, len = dep.inUseBy.length; n < len; n++) {
              app = dep.inUseBy[n];

              // Remove this bundle from the inUseBy for this dep
              if (app.id === id) {
                dep.inUseBy.splice(n, 1);
                break;
              }
            }

          }

        }

      }
    };

    if (doForce) {
      
      quit(id);

    } else {
      setTimeout(function () {
        quit(id);
      }, 60000);
    }

    return 3000;
  },

  events: {},

  addEventListener: function (event, handler) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(handler);
  },

  removeEventListener: function (event, handler) {
    var handlers = this.events[event];
    if (handlers) {
      handlers.splice(handlers.indexOf(handler), 1);
    }
  },

  triggerEventListeners: function (event, data) {
    var handlers = this.events[event];

    if (handlers) {
      for (var i = 0, l = handlers.length; i < l; i++) {
        handlers[i](data);
      }
    }
  }
};



var mock = sp.require('js/mock/data').data;