require(['$views/utils/css'], function(css) {
  var appfilter = {

    items: {},
    categories: {},
    overViewPane: WebInspector.panels.timeline._overviewPane,

    isGlobalInspector: /^sp:/.test(document.location),

    init: function() {
      if (!this.isGlobalInspector) return;

      this.createBase();
      this.setupEvents();
    },

    setupEvents: function() {
      var self = this;
      window.addEventListener('app-category-add', function(data) { self.onCategoryAddEvent(data.detail); });
    },

    onCategoryAddEvent: function(data) {
      if (!(data.app.id in this.items)) {
        this.createAppItem(data.app);
        this.categories[data.app.id] = data.category;
        this.setItemColor(data.app);
      }
    },

    createBase: function() {
      var inspectorWrapper = document.getElementById('inspector-wrapper');
      css.addClass(inspectorWrapper, 'global');

      var wrapper = document.createElement('div');
      wrapper.setAttribute('id', 'appfilter');
      document.body.appendChild(wrapper);

      var title = document.createElement('h2');
      title.className = 'sidebar-tree-section';
      title.innerHTML = 'APPS';
      wrapper.appendChild(title);

      var list = document.createElement('ul');
      css.addClass(list, 'applist');
      wrapper.appendChild(list);
      this.list = list;
    },

    createAppItem: function(app) {
      var self = this;

      var element = document.createElement('li');
      element.className = 'checked';
      element.setAttribute('data-app-id', app.id);
      this.items[app.id] = element;

      var checkbox = document.createElement('input');
      checkbox.className = 'checkbox';
      checkbox.type = 'checkbox';
      checkbox.checked = true;
      checkbox.addEventListener('change', function() { self.onCheckboxChange(checkbox.checked, element); });

      var color = document.createElement('div');
      color.className = 'color';

      var name = document.createElement('div');
      name.className = 'appname';
      name.innerHTML = app.name + ' <small>(' + app.instance + ')</small>';
      name.addEventListener('click', function() { self.onNameClick(checkbox, element); });

      element.appendChild(checkbox);
      element.appendChild(color);
      element.appendChild(name);
      this.list.appendChild(element);
    },

    setItemColor: function(app) {
      var element = this.items[app.id];
      var category = this.categories[app.id];
      var color = category.color;
      var colorElement = element.querySelector('.color');
      if (colorElement) {
        colorElement.style.backgroundColor = 'rgb(' + color.red + ', ' + color.green + ', ' + color.blue + ')';
      }
    },

    onCheckboxChange: function(checked, item) {
      css[checked ? 'addClass' : 'removeClass'](item, 'checked');
      var appID = item.getAttribute('data-app-id');
      var category = this.categories[appID];
      this.filterCategory(category, checked);
    },

    onNameClick: function(checkbox, item) {
      checkbox.checked = !checkbox.checked;
      this.onCheckboxChange(checkbox.checked, item);
    },

    filterCategory: function(category, active) {
      category.hidden = !active;

      this.overViewPane._categoryGraphs[category.name].dimmed = !active;
      this.overViewPane.dispatchEventToListeners('filter changed');
    }
  };

  appfilter.init();

});
