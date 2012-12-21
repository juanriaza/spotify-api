function _(path) {
  var protocol = window.location.protocol;

  if (protocol === 'sp:') {
    var app = window.location.host.split('.')[1];
    path = '$' + app + '/' + path;
  }

  return path;
}
