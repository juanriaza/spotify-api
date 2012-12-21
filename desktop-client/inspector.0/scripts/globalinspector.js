(function() {
	var isGlobalInspector = /^sp:/.test(document.location);

	if (isGlobalInspector) {
		document.body.className += ' globalinspector';
	}
}());
