sp.core.registerSchema([
  {
    name: 'PlaylistSubEventData',
    fields: [
      {id: 1, type: 'string', name: 'uri'},
      {id: 2, type: 'string', name: 'owner_username'},
      {id: 3, type: 'string', name: 'subscriber_username'},
      {id: 4, type: 'string', name: 'profile_username'}
    ]
  },
  {
    name: 'PlaylistUpdateEventData',
    fields: [
      {id: 1, type: 'string', name: 'uri'},
      {id: 2, type: 'string', name: 'owner_username'},
      {id: 3, type: 'int32', name: 'added_tracks_number'},
      {id: 4, type: '*string', name: 'added_tracks'},
      {id: 5, type: 'bool', name: 'no_delay_for_testing'}
    ]
  },
  {
    name: 'SignupEventData',
    fields: [
      {id: 1, type: 'string', name: 'signed_up_username'},
      {id: 2, type: 'int64', name: 'signup_time_ms'},
      {id: 3, type: 'string', name: 'single_recipient_username_for_testing'}
    ]
  },
  {
    name: 'ResetEventData',
    fields: [
      {id: 1, type: 'string', name: 'channel'},
      {id: 2, type: '*string', name: 'reset_usernames'}
    ]
  },
  {
    name: 'NewFollowerEventData',
    fields: [
      {id: 1, type: 'string', name: 'subscriber_username'},
      {id: 2, type: 'string', name: 'subscribing_to'},
      {id: 3, type: 'bool', name: 'playlist_sub'}
    ]
  },
  {
    name: 'NewRadioStationEventData',
    fields: [
      {id: 1, type: 'string', name: 'owner_username'},
      {id: 2, type: 'bool', name: 'mobile_free_radio'},
      {id: 3, type: 'bool', name: 'opengraph_posted'},
      {id: 4, type: 'string', name: 'radio_station_uri'}
    ]
  },
  {
    name: 'Event',
    fields: [
      {id: 1, type: 'int32', name: 'version'},
      {id: 2, type: 'int32', name: 'type'},
      {id: 3, type: 'string', name: 'initiator_username'},
      {id: 4, type: 'PlaylistSubEventData', name: 'playlist_sub_data'},
      {id: 5, type: 'SignupEventData', name: 'signup_data'},
      {id: 6, type: 'ResetEventData', name: 'reset_data'},
      {id: 7, type: 'PlaylistUpdateEventData', name: 'playlist_update_data'},
      {id: 8, type: 'NewFollowerEventData', name: 'new_follower_data'},
      {id: 9, type: 'NewRadioStationEventData', name: 'new_radio_station_data'},
      {id: 10, type: 'bool', name: 'no_delay_for_testing'}
    ]
  },
  {
    name: 'EmailNotificationData',
    fields: [
      {id: 1, type: 'string', name: 'template_category'},
      {id: 2, type: 'string', name: 'template_payload'},
      {id: 3, type: 'string', name: 'template_url_override'},
      {id: 4, type: 'string', name: 'to_address'},
      {id: 5, type: 'string', name: 'to_name'},
      {id: 6, type: 'bool', name: 'dry'}
    ]
  },
  {
    name: 'NotificationUser',
    fields: [
      {id: 1, type: 'string', name: 'canonical_username'},
      {id: 2, type: 'string', name: 'real_name'}
    ]
  },
  {
    name: 'PlaylistSubObject',
    fields: [
      {id: 1, type: 'string', name: 'uri'},
      {id: 2, type: 'NotificationUser', name: 'owner'},
      {id: 4, type: 'NotificationUser', name: 'profile_user'}
    ]
  },
  {
    name: 'TrackAddObject',
    fields: [
      {id: 1, type: 'int32', name: 'track_count'},
      {id: 2, type: 'string', name: 'uri'}
    ]
  },
  {
    name: 'AlbumReleaseObject',
    fields: [
      {id: 1, type: 'string', name: 'album_gid'},
      {id: 2, type: 'string', name: 'artist_gid'},
      {id: 3, type: 'string', name: 'album_name'},
      {id: 4, type: 'string', name: 'artist_name'}
    ]
  },
  {
    name: 'InClientNotificationData',
    fields: [
      {id: 1, type: 'int32', name: 'version'},
      {id: 2, type: 'NotificationState', name: 'state'},
      {id: 4, type: '*NotificationUser', name: 'subject'},
      {id: 5, type: 'int32', name: 'subject_total'},
      {id: 6, type: 'string', name: 'notification_verb'},
      {id: 8, type: '*PlaylistSubObject', name: 'playlist_sub_object'},
      {id: 10, type: '*TrackAddObject', name: 'track_add_object'},
      {id: 11, type: '*AlbumReleaseObject', name: 'album_release_object'}
    ]
  },
  {
    name: 'Notification',
    fields: [
      {id: 1, type: 'int32', name: 'version'},
      {id: 2, type: 'int32', name: 'type'},
      {id: 3, type: 'string', name: 'source_event_id'},
      {id: 4, type: 'EmailNotificationData', name: 'email_data'},
      {id: 5, type: 'InClientNotificationData', name: 'in_client_data'}
    ]
  },
  {
    name: 'NotificationState',
    fields: [
      {id: 1, type: 'string', name: 'notification_id'},
      {id: 2, type: 'bool', name: 'seen'},
      {id: 3, type: 'bool', name: 'dismissed'},
      {id: 4, type: 'bool', name: 'followed_through'},
      {id: 5, type: 'string', name: 'notification_id_hex'},
      {id: 6, type: 'string', name: 'state_id_hex'},
      {id: 7, type: 'string', name: 'state_id'},
      {id: 8, type: 'float', name: 'OBSOLETE_notification_id_ticks'},
      {id: 9, type: 'float', name: 'OBSOLETE_state_id_ticks'},
      {id: 10, type: 'int64', name: 'notification_id_ms'},
      {id: 11, type: 'int64', name: 'state_id_ms'}
    ]
  },
  {
    name: 'NotificationList',
    fields: [
      {id: 1, type: '*Notification', name: 'notification'}
    ]
  },
  {
    name: 'NotificationStateList',
    fields: [
      {id: 1, type: '*NotificationState', name: 'state'}
    ]
  },
  {
    name: 'NotificationCounts',
    fields: [
      {id: 1, type: 'int32', name: 'version'},
      {id: 2, type: 'int32', name: 'active'}
    ]
  }
]);

// enum EventType
var TYPE_UNKNOWN_EVENT = 0;
var TYPE_PLAYLIST_SUB = 4;
var TYPE_SIGNUP = 5;
var TYPE_RESET = 6;
var TYPE_PLAYLIST_UPDATE = 7;
var TYPE_NEW_FOLLOWER = 8;
var TYPE_NEW_RADIO_STATION = 9;
var TYPE_ALBUM_RELEASE = 10;

// enum NotificationType
var TYPE_UNKNOWN_NOTIFICATION = 0;
var TYPE_RESET_NOTIFICATION = 1;
var TYPE_EMAIL_NOTIFICATION = 4;
var TYPE_IN_CLIENT_NOTIFICATION = 5;
var TYPE_STATE_UPDATE_NOTIFICATION = 7;

