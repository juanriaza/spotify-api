/**
 * Initializes the API data and starts the connection.
 * @private
 */
SpotifyApi.prototype._init = function() {
  this._bi = Math.floor(Math.random() * 10e9);
  this._id = 1;
  this._sr = {};
  this._cc = 0;
  this._connect();
  this.request('bridge_create', []);

  var self = this;
  window.addEventListener('unload', function() {
    self.request('bridge_destroy', []);
    delete self._ws;
  });
};

/**
 * Establishes a WebSockets connection with the request server. This method
 * should be called once early in the bootstrapping process. If the server is
 * not yet running, the connection will be attempted at regular intervals
 * until it succeeds.
 * @private
 */
SpotifyApi.prototype._connect = function() {
  this._ct = null;
  this._cc++;

  var self = this;
  var path = window.location.href.match(/^sp:\/\/([^@]+)/)[1];
  this._ws = new WebSocket('ws://localhost:5563/' + path);
  this._ws.onmessage = function(event) { self._requestReply(event.data); };
  this._ws.onclose = function() { self._disconnected(); };
  this._ws.onopen = function() { self._connected(); };

  // If the WebSockets connection fails immediately, call the disconnected
  // method, to try to re-establish the connection as soon as possible. It is
  // not certain that the onclose method would be called here, since the
  // connection could not be opened.
  if (this._ws.readyState >= 2)
    this._disconnected();
};

/**
 * This callback method is invoked when a WebSockets connection with the request
 * server has been established. It will proceed to resend all of the requests
 * that has not yet been replied to. Note that this can, and will, include
 * requests that have been received by the server, but not yet answered. It is
 * the responsibility of the server to make sure it does not handle the same
 * request more than once, and that it handles the requests in the order they
 * are received.
 * @private
 */
SpotifyApi.prototype._connected = function() {
  this._cc = 0;
  var msg_ids = Object.keys(this._sr).sort(function(a, b) { return a - b; });
  msg_ids.forEach(function(id) { this._ws.send(this._sr[id].m); }, this);
};

/**
 * If the connection with the bridge is lost for some reason, we need to quickly
 * establish a new connection, so that the requests can keep flowing between the
 * JavaScript side and the Spotify client. One occation when this can happen is
 * when the Spotify client is put in the background on the iPhone. If the phone
 * decides to suspend the client, the connection will be broken and not restored
 * upon reanimation. With any luck, the WebSockets server will be brought up
 * quickly, and be there when we try to reconnect. Otherwise, we have to try
 * again in a "little bit". The delay before reconnecting starts at zero, and
 * will slowly increase with the number of attempts, leveling out at a few
 * seconds between each attempt.
 * @private
 */
SpotifyApi.prototype._disconnected = function() {
  if (this._ct) return;
  if (this._ws)
  {
    delete this._ws.onopen;
    delete this._ws.onmessage;
    delete this._ws.onclose;
    delete this._ws.onerror;
    delete this._ws;
  }
  var self = this;
  var time = Math.round(Math.log(this._cc) * 1000);
  this._ct = setTimeout(function() { self._connect(); }, time);
};

/**
 * This method is the heart of the entire bridge system. Whenever the
 * JavaScript side needs to talk to the Spotify client (such as the desktop
 * client or one of the mobile clients) it will make a request by calling the
 * method. The format of the requests is documented elsewhere.
 *
 * @param {string} name The name of the request. This parameter is required
 *     and must be one of the supported requests (see the bridge specification).
 * @param {Array} args An array of arguments for the request. The items in
 *     the array must be trivially decodable to strings, e.g., string, number.
 * @param {Object} caller The object to use as the "this" object when calling
 *     one of the result callback functions.
 * @param {Function} success The callback function to invoke when the request
 *     succeeds.
 * @param {Function} failed The callback function to invoke when the request
 *     does not succeed.
 */
SpotifyApi.prototype.request = function(name, args, caller, success, failed) {
  var id = this._id++;
  var message = JSON.stringify({ id: id, name: name, args: args, bridge: this._bi });
  this._sr[id] = { c: caller, s: success, f: failed, m: message };
  if (this._ws && this._ws.readyState === 1)
    this._ws.send(message);
  this._prepareFlush();
};

/**
 * Called when a message is received from the request server. The message ID
 * will be extracted from the message, and the remainder of the message string
 * is interpreted as JSON formatted data. If there are a callback registered
 * for the extracted ID, the appropriate callback is called (it can either be
 * success or failure). Finally the message is removed from the registry.
 * @param {string} message The result message. It is a string on the format
 * id[+|-]data, where + is used to indicate success, and - to indicate failure.
 * The data is request dependent, but can always be parsed as JSON data (note
 * that a simple string is also valid JSON).
 * @private
 */
SpotifyApi.prototype._requestReply = function(message) {
  var data = JSON.parse(message);
  var fail = data._fail;
  var sr = this._sr[data._id];

  if (sr) {
    delete this._sr[data._id];
    delete data._fail;
    delete data._id;
    var fn = (fail ? sr.f : sr.s);
    if (fn) fn.call(sr.c, data);
  }
};

SpotifyApi.prototype._override_log = function(type) {
  var self = this;
  var console_log = console[type];
  console[type] = function() {
    console_log.apply(console, arguments);
    if (self._no_log) return;
    try {
      self._no_log = true;
      self.request('console_' + type, [].slice.call(arguments));
    } finally {
      self._no_log = false;
    }
  };
};

SpotifyApi.api = new SpotifyApi();
SpotifyApi.api._init();
SpotifyApi.api._override_log('debug');
SpotifyApi.api._override_log('dir');
SpotifyApi.api._override_log('log');
SpotifyApi.api._override_log('info');
SpotifyApi.api._override_log('warn');
SpotifyApi.api._override_log('error');
window.onerror = function(message, url, linenumber) { console.error(message, url, linenumber); };
