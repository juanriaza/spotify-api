"use strict";

var sp = getSpotifyApi(1);

var SUBSCRIPTION_SCHEMA = [
	{
		name: "Subscription",
		fields: [
			{
				id: 1,
				name: "uri",
				type: "string"
			},
			{
				id: 2,
				name: "expiry",
				type: "int32"
			}
		]
	}
];

var PRESENCE_SCHEMA = [
	{
		name: "PlaylistPublishedState",
		fields: [
			{
				id: 1,
				name: "uri",
				type: "string"
			},
			{
				id: 2,
				name: "timestamp",
				type: "int32"
			}
		]
	},
	{
		name: "PlaylistTrackAddedState",
		fields: [
			{
				id: 1,
				name: "playlist_uri",
				type: "string"
			},
			{
				id: 2,
				name: "track_uri",
				type: "string"
			},
			{
				id: 3,
				name: "timestamp",
				type: "int32"
			}
		]
	},
	{
		name: "TrackFinishedPlayingState",
		fields: [
			{
				id: 1,
				name: "uri",
				type: "string"
			},
			{
				id: 2,
				name: "context_uri",
				type: "string"
			},
			{
				id: 3,
				name: "timestamp",
				type: "int32"
			},
			{
				id: 4,
				name: "referrer_uri",
				type: "string"
			}
		]
	},
	{
		name: "FavoriteAppAddedState",
		fields: [
			{
				id: 1,
				name: "app_uri",
				type: "string"
			},
			{
				id: 2,
				name: "timestamp",
				type: "int32"
			}
		]
	},
	{
		name: "PresenceState",
		fields: [
			{
				id: 1,
				name: "timestamp",
				type: "int32"
			},
			// Deprecated states
			{
				id: 2,
				name: "type",
				type: "int32"
			},
			{
				id: 3,
				name: "uri",
				type: "string"
			},
			// In new times, one of these states are set
			{
				id: 4,
				name: "playlist_published",
				type: "PlaylistPublishedState"
			},
			{
				id: 5,
				name: "playlist_track_added",
				type: "PlaylistTrackAddedState"
			},
			{
				id: 6,
				name: "track_finished_playing",
				type: "TrackFinishedPlayingState"
			},
			{
				id: 7,
				name: "favorite_app_added",
				type: "FavoriteAppAddedState"
			}
		]
	}
];

var SOCIAL_SCHEMA = [
	{
		name: "FacebookMessagePost",
		fields: [
			{
				id: 1,
				name: "fb_uid",
				type: "*string"
			},
			{
				id: 2,
				name: "message",
				type: "string"
			},
			{
				id: 3,
				name: "spotify_uri",
				type: "*string"
			}
		]
	}
];

sp.core.registerSchema(PRESENCE_SCHEMA);
sp.core.registerSchema(SUBSCRIPTION_SCHEMA);
sp.core.registerSchema(SOCIAL_SCHEMA);
