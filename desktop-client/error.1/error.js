var sp = getSpotifyApi();

function _getApp() {
  var arg = sp.core.getArguments();
  return (arg.length != 0 ? arg[0].decodeForText() : null);
}

function _getError() {
  var arg = sp.core.getArguments();
  return (arg.length > 1 ? arg[1].decodeForText() : null);
}

function _getDetail() {
  var arg = sp.core.getArguments();
  return (arg.length > 2 ? arg[2].decodeForText() : null);
}

function _showErrorMessage(application, error, detail) {
  var heading = document.getElementById('heading');
  heading.classList.remove('hidden');
  heading.innerText = 'Failed to load application ' + application;

  var info = document.getElementById('info');
  info.classList.remove('hidden');

  var title = document.getElementById('title');
  title.innerText = error;

  var details = document.getElementById('details');
  details.innerText = detail;
}

exports.init = function() {
  _showErrorMessage(_getApp(), _getError(), _getDetail());
};
