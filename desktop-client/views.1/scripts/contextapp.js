/**
 * Context app module
 */

require(['$api/models'], function(models) {

  exports.ContextApp = ContextApp;

  /**
   * Open a context app.
   *
   * @constructor
   */
  function ContextApp() {
  }

  /**
   * Shows the context app
   *
   * @public
   * @param {String} name Name of the app.
   * @param {Array} args Arguments for the app.
   * @param {Node} element DOM element used for positioning.
   * @param {Object=} opt_origin Origin for the request. For example, if it
   *     comes from a list showing a playlist, the playlist uri will be the
   *     origin. Can be used to let the widget know about the context.
   * @return {Promise} A promise.
   */
  ContextApp.show = function(name, args, element, opt_origin) {
    var offset = element.getBoundingClientRect();

    /* Required arguments */
    var appArguments = [
      name,
      offset.left,
      offset.top,
      offset.width,
      offset.height
    ];

    /* Additional app arguments */
    appArguments = appArguments.concat(args);

    // Add origin argument if provided
    if (opt_origin) {
      appArguments.push(opt_origin);
    }

    return models.application.openApp.apply(models.application, appArguments);
  };
});
