exports.init = init;
var loadTime = Date.now();
var intervalHandler = false;

function _getApp() {
  var args = sp.core.getArguments();
  return (args.length != 0 ? args[0].decodeForText() : null);
}

function _getArg() {
  var arg = sp.core.getArguments().map(function(item) { return item.decodeForLink(); });
  return (arg.length != 0 ? 'spotify:app:' + arg.join(':') : null);
}

function init() {
  sp = getSpotifyApi();
  if (sp.core.developer)
    document.body.classList.add('developer');

  sp.installer.addEventListener('installProgress', _trackProgress);

  _updateLogWithInitialState();
  _updateViewForNewState();
  _installProgressUpdateTimer();
}

function _updateLogWithInitialState() {
  var state = sp.installer.getApplicationState(_getApp());
  _appendToLog(state ? state.step : null, state);
}

function _appendToLog(message, state) {
  if (state) {
    var log = document.getElementById('log');
    var row = document.createElement('div');
    var msg = document.createElement('div');
    var sum = document.createElement('div');
    var url = document.createElement('div');
    var ico = document.createElement('div');
    var err = document.createElement('div');
    row.classList.add(message);
    msg.classList.add('message');
    msg.classList.add(message);
    msg.innerText = message;
    sum.innerText = 'Checksum: ' + state.checksum;
    url.innerText = 'URL: ' + state.url;
    ico.innerText = 'Icon: ' + state.largeIconURL;
    err.innerText = 'Error: ' + state.error;
    row.appendChild(msg);
    if (state.checksum)
      row.appendChild(sum);
    if (state.url)
      row.appendChild(url);
    if (state.largeIconURL)
      row.appendChild(ico);
    if (state.error)
      row.appendChild(err);
    log.appendChild(row);
  }
}

function _trackProgress(event) {
  var state = event.data;
  if (state.appId == _getApp()) {
    _updateViewForCurrentState(state);
    _appendToLog(state.step, state);
  }
}

function _setIndeterminateProgress() {
  var bar = document.getElementById('progress');
  bar.classList.remove('determinate');
  bar.classList.add('indeterminate');
  bar.classList.remove('hidden');
}

function _setDeterminateProgress(progress) {
  var bar = document.getElementById('progress');
  bar.classList.add('determinate');
  bar.classList.remove('indeterminate');
  bar.classList.remove('hidden');

  var val = bar.getElementsByClassName('value')[0];
  val.style.width = (progress * 100) + '%';
}

function _hideProgressBar() {
  var bar = document.getElementById('progress');
  bar.classList.add('hidden');
}

function _hideErrorMessage() {
  var err = document.getElementById('error');
  err.classList.add('hidden');
}

function _showErrorMessage(state) {
  if (_isErrorState(state)) {
    var raw_messages = sp.core.readFile('errors.json');
    var messages = JSON.parse(raw_messages);
    var message = messages[state.step][state.error];

    var err = document.getElementById('error');
    err.classList.remove('hidden');
    err.innerText = message;
  }
}

function _removeThumbnailIcon() {
  var icon = document.getElementById('icon');
  icon.classList.remove('loaded');

  var image = document.getElementById('icon');
  image.src = null;
}

function _updateThumbnailIcon(state) {
  var image = document.getElementById('image');
  image.src = (state.largeIconURL ? state.largeIconURL : null);
}

function _isDoneState(state) {
  return state.step == 'installComplete';
}

function _isErrorState(state) {
  return state.step == 'metadataFailed' ||
      state.step == 'downloadFailed' ||
      state.step == 'verifyFailed' ||
      state.step == 'installDependenciesFailed' ||
      state.step == 'installFailed';
}

function _updateProgressBar(state) {
  if (_isErrorState(state) || _isDoneState(state))
    _hideProgressBar();
  else if (state.progress < 0)
    _setIndeterminateProgress();
  else
    _setDeterminateProgress(state.progress);
}

function _updateViewForCurrentState(state) {
  state = state || sp.installer.getApplicationState(_getApp());
  if (!state)
    return;

  _updateThumbnailIcon(state);
  _updateProgressBar(state);

  if (_isDoneState(state)) {
    clearInterval(intervalHandler);
  } else if (_isErrorState(state)) {
    clearInterval(intervalHandler);
    _showErrorMessage(state);
  }
}

function _installProgressUpdateTimer() {
  intervalHandler = setInterval(_updateViewForCurrentState, 1000);
}

function _updateViewForNewState() {
  _hideErrorMessage();
  _removeThumbnailIcon();
  _setIndeterminateProgress();
  _updateViewForCurrentState();
}
