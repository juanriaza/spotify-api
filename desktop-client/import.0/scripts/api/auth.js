/**
 * @module auth
 */

"use strict";

var sp = getSpotifyApi(1);

exports.showAuthenticationDialog = showAuthenticationDialog;
exports.authenticateWithFacebook = authenticateWithFacebook;

/**
 * Shows a popup window which will render the contents of initialUrl. The popup will stay on screen 
 * until the user closes it, or a new resource is loaded that has successURL as its prefix or complete path.
 *
 * Use this function to authenticate against Facebook, etc.
 *
 * @example
 * var sp = getSpotifyApi(1);
 * var auth = sp.require('sp://import/scripts/api/auth');
 * 
 * auth.showAuthenticationDialog('http://www.last.fm/api/auth/?api_key=LAST_FM_API_KEY&cb=sp://my_app_name', 'sp://my_app_name', {
 * 
 * 	onSuccess : function(response) {
 * 		// Response will be something like 'sp://my_app_name?token=xxxxxxx'
 * 		console.log("Success! Here's the response URL: " + response);
 * 	},
 * 
 * 	onFailure : function(error) {
 * 		console.log("Authentication failed with error: " + error);
 * 	},
 * 
 * 	onComplete : function() { }
 * });
 *
 *
 * @param {string} initialUrl The initial URL to load.
 * @param {string} successURL The URL that will be loaded upon successful login.
 * @param {object} callbacks An object containing the following callback functions: <ul><li>onSuccess(response)</li><li>onFailure(error)</li><li>onComplete()</li></ul>
 */
function showAuthenticationDialog (initialUrl, successURL, callbacks) {

	sp.core.showAuthDialog(initialUrl, successURL, {

		// Separating callback structure from the glue layer, even 
		// though it's the same for now.
		onSuccess : function (response) {
			callbacks.onSuccess(response);
		},

		onFailure : function (error) {
			callbacks.onFailure(error);
		},

		onComplete : function () {
			callbacks.onComplete();
		}
	});
}

/**
 * Helper method for authenticating against Facebook Connect using {@link showAuthenticationDialog}.
 *
 * @example
 * var sp = getSpotifyApi(1);
 * var auth = sp.require('sp://import/scripts/api/auth');
 * 
 * auth.authenticateWithFacebook('MY_APP_ID', ['user_about_me', 'user_checkins'], {
 * 
 * 	onSuccess : function(accessToken, ttl) {
 * 		console.log("Success! Here's the access token: " + accessToken);
 * 	},
 * 
 * 	onFailure : function(error) {
 * 		console.log("Authentication failed with error: " + error);
 * 	},
 * 
 * 	onComplete : function() { }
 * });
 *
 * @param {string} appId Your Facebook application ID.
 * @param {array} permissions An array of permission keys, as documented at {@link http://developers.facebook.com/docs/reference/api/permissions/}.
 * @param {object} callbacks An object containing the following callback functions: <ul><li>onSuccess(accessToken, ttl)</li><li>onFailure(error)</li><li>onComplete()</li></ul>
 * @see showAuthenticationDialog
 */
function authenticateWithFacebook (appId, permissions, callbacks) {

	var loginUrl = 'https://www.facebook.com/dialog/oauth?';
	var successUrl = 'https://www.facebook.com/connect/login_success.html';
	
	var queryParams = [
		'client_id=' + appId,
		'redirect_uri=' + successUrl,
		'display=popup',
		'scope=' +  permissions.join(','),
		'response_type=token'
		];
	
	var query = queryParams.join('&');	
	
	showAuthenticationDialog(loginUrl + query, successUrl, {   
					
		onSuccess : function(response) {
			// response is the complete URL we were directed to.
			var parameters = {},
				queryStrings = response.split("#")[1].split("&");
			
			queryStrings.forEach(function(part) {
				var parts = part.split('=');
				parameters[parts[0]] = parts[1];
			});

			var accessToken = parameters.access_token ? parameters.access_token : null;
			var ttl = parameters.expires_in ? parameters.expires_in : null;

			if (accessToken && ttl) {
				callbacks.onSuccess(accessToken, ttl);
			} else {
				callbacks.onFailure('Expected response keys not found.');
			}
		},

		onFailure : function (error) {
			callbacks.onFailure(error);
		},

		onComplete : function () {
			callbacks.onComplete();
		}
	});
}
