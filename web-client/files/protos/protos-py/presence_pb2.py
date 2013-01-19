# Generated by the protocol buffer compiler.  DO NOT EDIT!

from google.protobuf import descriptor
from google.protobuf import message
from google.protobuf import reflection
from google.protobuf import descriptor_pb2
# @@protoc_insertion_point(imports)



DESCRIPTOR = descriptor.FileDescriptor(
  name='presence.proto',
  package='spotify.presence.proto',
  serialized_pb='\n\x0epresence.proto\x12\x16spotify.presence.proto\"8\n\x16PlaylistPublishedState\x12\x0b\n\x03uri\x18\x01 \x01(\t\x12\x11\n\ttimestamp\x18\x02 \x01(\x03\"U\n\x17PlaylistTrackAddedState\x12\x14\n\x0cplaylist_uri\x18\x01 \x01(\t\x12\x11\n\ttrack_uri\x18\x02 \x01(\t\x12\x11\n\ttimestamp\x18\x03 \x01(\x03\"f\n\x19TrackFinishedPlayingState\x12\x0b\n\x03uri\x18\x01 \x01(\t\x12\x13\n\x0b\x63ontext_uri\x18\x02 \x01(\t\x12\x11\n\ttimestamp\x18\x03 \x01(\x03\x12\x14\n\x0creferrer_uri\x18\x04 \x01(\t\";\n\x15\x46\x61voriteAppAddedState\x12\x0f\n\x07\x61pp_uri\x18\x01 \x01(\t\x12\x11\n\ttimestamp\x18\x02 \x01(\x03\"e\n\x18TrackStartedPlayingState\x12\x0b\n\x03uri\x18\x01 \x01(\t\x12\x13\n\x0b\x63ontext_uri\x18\x02 \x01(\t\x12\x11\n\ttimestamp\x18\x03 \x01(\x03\x12\x14\n\x0creferrer_uri\x18\x04 \x01(\t\"C\n\x0eUriSharedState\x12\x0b\n\x03uri\x18\x01 \x01(\t\x12\x11\n\x07message\x18\x02 \x01(\t:\x00\x12\x11\n\ttimestamp\x18\x03 \x01(\x03\"h\n\x13\x41rtistFollowedState\x12\x0b\n\x03uri\x18\x01 \x01(\t\x12\x15\n\x0b\x61rtist_name\x18\x02 \x01(\t:\x00\x12\x1a\n\x10\x61rtist_cover_uri\x18\x03 \x01(\t:\x00\x12\x11\n\ttimestamp\x18\x04 \x01(\x03\"-\n\x11\x44\x65viceInformation\x12\n\n\x02os\x18\x01 \x01(\t\x12\x0c\n\x04type\x18\x02 \x01(\t\"\xcf\x02\n\x14GenericPresenceState\x12\x0c\n\x04type\x18\x01 \x01(\x05\x12\x11\n\ttimestamp\x18\x02 \x01(\x03\x12\x10\n\x08item_uri\x18\x03 \x01(\t\x12\x11\n\titem_name\x18\x04 \x01(\t\x12\x12\n\nitem_image\x18\x05 \x01(\t\x12\x13\n\x0b\x63ontext_uri\x18\x06 \x01(\t\x12\x14\n\x0c\x63ontext_name\x18\x07 \x01(\t\x12\x15\n\rcontext_image\x18\x08 \x01(\t\x12\x14\n\x0creferrer_uri\x18\t \x01(\t\x12\x15\n\rreferrer_name\x18\n \x01(\t\x12\x16\n\x0ereferrer_image\x18\x0b \x01(\t\x12\x0f\n\x07message\x18\x0c \x01(\t\x12\x45\n\x12\x64\x65vice_information\x18\r \x01(\x0b\x32).spotify.presence.proto.DeviceInformation\"\xe0\x06\n\x05State\x12\x11\n\ttimestamp\x18\x01 \x01(\x03\x12\x30\n\x04type\x18\x02 \x01(\x0e\x32\".spotify.presence.proto.State.Type\x12\x0b\n\x03uri\x18\x03 \x01(\t\x12J\n\x12playlist_published\x18\x04 \x01(\x0b\x32..spotify.presence.proto.PlaylistPublishedState\x12M\n\x14playlist_track_added\x18\x05 \x01(\x0b\x32/.spotify.presence.proto.PlaylistTrackAddedState\x12Q\n\x16track_finished_playing\x18\x06 \x01(\x0b\x32\x31.spotify.presence.proto.TrackFinishedPlayingState\x12I\n\x12\x66\x61vorite_app_added\x18\x07 \x01(\x0b\x32-.spotify.presence.proto.FavoriteAppAddedState\x12O\n\x15track_started_playing\x18\x08 \x01(\x0b\x32\x30.spotify.presence.proto.TrackStartedPlayingState\x12:\n\nuri_shared\x18\t \x01(\x0b\x32&.spotify.presence.proto.UriSharedState\x12\x44\n\x0f\x61rtist_followed\x18\n \x01(\x0b\x32+.spotify.presence.proto.ArtistFollowedState\x12=\n\x07generic\x18\x0b \x01(\x0b\x32,.spotify.presence.proto.GenericPresenceState\"\xb9\x01\n\x04Type\x12\x16\n\x12PLAYLIST_PUBLISHED\x10\x01\x12\x18\n\x14PLAYLIST_TRACK_ADDED\x10\x02\x12\x1a\n\x16TRACK_FINISHED_PLAYING\x10\x03\x12\x16\n\x12\x46\x41VORITE_APP_ADDED\x10\x04\x12\x19\n\x15TRACK_STARTED_PLAYING\x10\x05\x12\x0e\n\nURI_SHARED\x10\x06\x12\x13\n\x0f\x41RTIST_FOLLOWED\x10\x07\x12\x0b\n\x07GENERIC\x10\x0b\":\n\tStateList\x12-\n\x06states\x18\x01 \x03(\x0b\x32\x1d.spotify.presence.proto.State')



_STATE_TYPE = descriptor.EnumDescriptor(
  name='Type',
  full_name='spotify.presence.proto.State.Type',
  filename=None,
  file=DESCRIPTOR,
  values=[
    descriptor.EnumValueDescriptor(
      name='PLAYLIST_PUBLISHED', index=0, number=1,
      options=None,
      type=None),
    descriptor.EnumValueDescriptor(
      name='PLAYLIST_TRACK_ADDED', index=1, number=2,
      options=None,
      type=None),
    descriptor.EnumValueDescriptor(
      name='TRACK_FINISHED_PLAYING', index=2, number=3,
      options=None,
      type=None),
    descriptor.EnumValueDescriptor(
      name='FAVORITE_APP_ADDED', index=3, number=4,
      options=None,
      type=None),
    descriptor.EnumValueDescriptor(
      name='TRACK_STARTED_PLAYING', index=4, number=5,
      options=None,
      type=None),
    descriptor.EnumValueDescriptor(
      name='URI_SHARED', index=5, number=6,
      options=None,
      type=None),
    descriptor.EnumValueDescriptor(
      name='ARTIST_FOLLOWED', index=6, number=7,
      options=None,
      type=None),
    descriptor.EnumValueDescriptor(
      name='GENERIC', index=7, number=11,
      options=None,
      type=None),
  ],
  containing_type=None,
  options=None,
  serialized_start=1695,
  serialized_end=1880,
)


_PLAYLISTPUBLISHEDSTATE = descriptor.Descriptor(
  name='PlaylistPublishedState',
  full_name='spotify.presence.proto.PlaylistPublishedState',
  filename=None,
  file=DESCRIPTOR,
  containing_type=None,
  fields=[
    descriptor.FieldDescriptor(
      name='uri', full_name='spotify.presence.proto.PlaylistPublishedState.uri', index=0,
      number=1, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=unicode("", "utf-8"),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='timestamp', full_name='spotify.presence.proto.PlaylistPublishedState.timestamp', index=1,
      number=2, type=3, cpp_type=2, label=1,
      has_default_value=False, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
  ],
  extensions=[
  ],
  nested_types=[],
  enum_types=[
  ],
  options=None,
  is_extendable=False,
  extension_ranges=[],
  serialized_start=42,
  serialized_end=98,
)


_PLAYLISTTRACKADDEDSTATE = descriptor.Descriptor(
  name='PlaylistTrackAddedState',
  full_name='spotify.presence.proto.PlaylistTrackAddedState',
  filename=None,
  file=DESCRIPTOR,
  containing_type=None,
  fields=[
    descriptor.FieldDescriptor(
      name='playlist_uri', full_name='spotify.presence.proto.PlaylistTrackAddedState.playlist_uri', index=0,
      number=1, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=unicode("", "utf-8"),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='track_uri', full_name='spotify.presence.proto.PlaylistTrackAddedState.track_uri', index=1,
      number=2, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=unicode("", "utf-8"),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='timestamp', full_name='spotify.presence.proto.PlaylistTrackAddedState.timestamp', index=2,
      number=3, type=3, cpp_type=2, label=1,
      has_default_value=False, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
  ],
  extensions=[
  ],
  nested_types=[],
  enum_types=[
  ],
  options=None,
  is_extendable=False,
  extension_ranges=[],
  serialized_start=100,
  serialized_end=185,
)


_TRACKFINISHEDPLAYINGSTATE = descriptor.Descriptor(
  name='TrackFinishedPlayingState',
  full_name='spotify.presence.proto.TrackFinishedPlayingState',
  filename=None,
  file=DESCRIPTOR,
  containing_type=None,
  fields=[
    descriptor.FieldDescriptor(
      name='uri', full_name='spotify.presence.proto.TrackFinishedPlayingState.uri', index=0,
      number=1, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=unicode("", "utf-8"),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='context_uri', full_name='spotify.presence.proto.TrackFinishedPlayingState.context_uri', index=1,
      number=2, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=unicode("", "utf-8"),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='timestamp', full_name='spotify.presence.proto.TrackFinishedPlayingState.timestamp', index=2,
      number=3, type=3, cpp_type=2, label=1,
      has_default_value=False, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='referrer_uri', full_name='spotify.presence.proto.TrackFinishedPlayingState.referrer_uri', index=3,
      number=4, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=unicode("", "utf-8"),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
  ],
  extensions=[
  ],
  nested_types=[],
  enum_types=[
  ],
  options=None,
  is_extendable=False,
  extension_ranges=[],
  serialized_start=187,
  serialized_end=289,
)


_FAVORITEAPPADDEDSTATE = descriptor.Descriptor(
  name='FavoriteAppAddedState',
  full_name='spotify.presence.proto.FavoriteAppAddedState',
  filename=None,
  file=DESCRIPTOR,
  containing_type=None,
  fields=[
    descriptor.FieldDescriptor(
      name='app_uri', full_name='spotify.presence.proto.FavoriteAppAddedState.app_uri', index=0,
      number=1, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=unicode("", "utf-8"),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='timestamp', full_name='spotify.presence.proto.FavoriteAppAddedState.timestamp', index=1,
      number=2, type=3, cpp_type=2, label=1,
      has_default_value=False, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
  ],
  extensions=[
  ],
  nested_types=[],
  enum_types=[
  ],
  options=None,
  is_extendable=False,
  extension_ranges=[],
  serialized_start=291,
  serialized_end=350,
)


_TRACKSTARTEDPLAYINGSTATE = descriptor.Descriptor(
  name='TrackStartedPlayingState',
  full_name='spotify.presence.proto.TrackStartedPlayingState',
  filename=None,
  file=DESCRIPTOR,
  containing_type=None,
  fields=[
    descriptor.FieldDescriptor(
      name='uri', full_name='spotify.presence.proto.TrackStartedPlayingState.uri', index=0,
      number=1, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=unicode("", "utf-8"),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='context_uri', full_name='spotify.presence.proto.TrackStartedPlayingState.context_uri', index=1,
      number=2, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=unicode("", "utf-8"),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='timestamp', full_name='spotify.presence.proto.TrackStartedPlayingState.timestamp', index=2,
      number=3, type=3, cpp_type=2, label=1,
      has_default_value=False, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='referrer_uri', full_name='spotify.presence.proto.TrackStartedPlayingState.referrer_uri', index=3,
      number=4, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=unicode("", "utf-8"),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
  ],
  extensions=[
  ],
  nested_types=[],
  enum_types=[
  ],
  options=None,
  is_extendable=False,
  extension_ranges=[],
  serialized_start=352,
  serialized_end=453,
)


_URISHAREDSTATE = descriptor.Descriptor(
  name='UriSharedState',
  full_name='spotify.presence.proto.UriSharedState',
  filename=None,
  file=DESCRIPTOR,
  containing_type=None,
  fields=[
    descriptor.FieldDescriptor(
      name='uri', full_name='spotify.presence.proto.UriSharedState.uri', index=0,
      number=1, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=unicode("", "utf-8"),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='message', full_name='spotify.presence.proto.UriSharedState.message', index=1,
      number=2, type=9, cpp_type=9, label=1,
      has_default_value=True, default_value=unicode("", "utf-8"),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='timestamp', full_name='spotify.presence.proto.UriSharedState.timestamp', index=2,
      number=3, type=3, cpp_type=2, label=1,
      has_default_value=False, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
  ],
  extensions=[
  ],
  nested_types=[],
  enum_types=[
  ],
  options=None,
  is_extendable=False,
  extension_ranges=[],
  serialized_start=455,
  serialized_end=522,
)


_ARTISTFOLLOWEDSTATE = descriptor.Descriptor(
  name='ArtistFollowedState',
  full_name='spotify.presence.proto.ArtistFollowedState',
  filename=None,
  file=DESCRIPTOR,
  containing_type=None,
  fields=[
    descriptor.FieldDescriptor(
      name='uri', full_name='spotify.presence.proto.ArtistFollowedState.uri', index=0,
      number=1, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=unicode("", "utf-8"),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='artist_name', full_name='spotify.presence.proto.ArtistFollowedState.artist_name', index=1,
      number=2, type=9, cpp_type=9, label=1,
      has_default_value=True, default_value=unicode("", "utf-8"),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='artist_cover_uri', full_name='spotify.presence.proto.ArtistFollowedState.artist_cover_uri', index=2,
      number=3, type=9, cpp_type=9, label=1,
      has_default_value=True, default_value=unicode("", "utf-8"),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='timestamp', full_name='spotify.presence.proto.ArtistFollowedState.timestamp', index=3,
      number=4, type=3, cpp_type=2, label=1,
      has_default_value=False, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
  ],
  extensions=[
  ],
  nested_types=[],
  enum_types=[
  ],
  options=None,
  is_extendable=False,
  extension_ranges=[],
  serialized_start=524,
  serialized_end=628,
)


_DEVICEINFORMATION = descriptor.Descriptor(
  name='DeviceInformation',
  full_name='spotify.presence.proto.DeviceInformation',
  filename=None,
  file=DESCRIPTOR,
  containing_type=None,
  fields=[
    descriptor.FieldDescriptor(
      name='os', full_name='spotify.presence.proto.DeviceInformation.os', index=0,
      number=1, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=unicode("", "utf-8"),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='type', full_name='spotify.presence.proto.DeviceInformation.type', index=1,
      number=2, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=unicode("", "utf-8"),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
  ],
  extensions=[
  ],
  nested_types=[],
  enum_types=[
  ],
  options=None,
  is_extendable=False,
  extension_ranges=[],
  serialized_start=630,
  serialized_end=675,
)


_GENERICPRESENCESTATE = descriptor.Descriptor(
  name='GenericPresenceState',
  full_name='spotify.presence.proto.GenericPresenceState',
  filename=None,
  file=DESCRIPTOR,
  containing_type=None,
  fields=[
    descriptor.FieldDescriptor(
      name='type', full_name='spotify.presence.proto.GenericPresenceState.type', index=0,
      number=1, type=5, cpp_type=1, label=1,
      has_default_value=False, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='timestamp', full_name='spotify.presence.proto.GenericPresenceState.timestamp', index=1,
      number=2, type=3, cpp_type=2, label=1,
      has_default_value=False, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='item_uri', full_name='spotify.presence.proto.GenericPresenceState.item_uri', index=2,
      number=3, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=unicode("", "utf-8"),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='item_name', full_name='spotify.presence.proto.GenericPresenceState.item_name', index=3,
      number=4, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=unicode("", "utf-8"),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='item_image', full_name='spotify.presence.proto.GenericPresenceState.item_image', index=4,
      number=5, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=unicode("", "utf-8"),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='context_uri', full_name='spotify.presence.proto.GenericPresenceState.context_uri', index=5,
      number=6, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=unicode("", "utf-8"),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='context_name', full_name='spotify.presence.proto.GenericPresenceState.context_name', index=6,
      number=7, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=unicode("", "utf-8"),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='context_image', full_name='spotify.presence.proto.GenericPresenceState.context_image', index=7,
      number=8, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=unicode("", "utf-8"),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='referrer_uri', full_name='spotify.presence.proto.GenericPresenceState.referrer_uri', index=8,
      number=9, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=unicode("", "utf-8"),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='referrer_name', full_name='spotify.presence.proto.GenericPresenceState.referrer_name', index=9,
      number=10, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=unicode("", "utf-8"),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='referrer_image', full_name='spotify.presence.proto.GenericPresenceState.referrer_image', index=10,
      number=11, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=unicode("", "utf-8"),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='message', full_name='spotify.presence.proto.GenericPresenceState.message', index=11,
      number=12, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=unicode("", "utf-8"),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='device_information', full_name='spotify.presence.proto.GenericPresenceState.device_information', index=12,
      number=13, type=11, cpp_type=10, label=1,
      has_default_value=False, default_value=None,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
  ],
  extensions=[
  ],
  nested_types=[],
  enum_types=[
  ],
  options=None,
  is_extendable=False,
  extension_ranges=[],
  serialized_start=678,
  serialized_end=1013,
)


_STATE = descriptor.Descriptor(
  name='State',
  full_name='spotify.presence.proto.State',
  filename=None,
  file=DESCRIPTOR,
  containing_type=None,
  fields=[
    descriptor.FieldDescriptor(
      name='timestamp', full_name='spotify.presence.proto.State.timestamp', index=0,
      number=1, type=3, cpp_type=2, label=1,
      has_default_value=False, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='type', full_name='spotify.presence.proto.State.type', index=1,
      number=2, type=14, cpp_type=8, label=1,
      has_default_value=False, default_value=1,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='uri', full_name='spotify.presence.proto.State.uri', index=2,
      number=3, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=unicode("", "utf-8"),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='playlist_published', full_name='spotify.presence.proto.State.playlist_published', index=3,
      number=4, type=11, cpp_type=10, label=1,
      has_default_value=False, default_value=None,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='playlist_track_added', full_name='spotify.presence.proto.State.playlist_track_added', index=4,
      number=5, type=11, cpp_type=10, label=1,
      has_default_value=False, default_value=None,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='track_finished_playing', full_name='spotify.presence.proto.State.track_finished_playing', index=5,
      number=6, type=11, cpp_type=10, label=1,
      has_default_value=False, default_value=None,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='favorite_app_added', full_name='spotify.presence.proto.State.favorite_app_added', index=6,
      number=7, type=11, cpp_type=10, label=1,
      has_default_value=False, default_value=None,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='track_started_playing', full_name='spotify.presence.proto.State.track_started_playing', index=7,
      number=8, type=11, cpp_type=10, label=1,
      has_default_value=False, default_value=None,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='uri_shared', full_name='spotify.presence.proto.State.uri_shared', index=8,
      number=9, type=11, cpp_type=10, label=1,
      has_default_value=False, default_value=None,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='artist_followed', full_name='spotify.presence.proto.State.artist_followed', index=9,
      number=10, type=11, cpp_type=10, label=1,
      has_default_value=False, default_value=None,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='generic', full_name='spotify.presence.proto.State.generic', index=10,
      number=11, type=11, cpp_type=10, label=1,
      has_default_value=False, default_value=None,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
  ],
  extensions=[
  ],
  nested_types=[],
  enum_types=[
    _STATE_TYPE,
  ],
  options=None,
  is_extendable=False,
  extension_ranges=[],
  serialized_start=1016,
  serialized_end=1880,
)


_STATELIST = descriptor.Descriptor(
  name='StateList',
  full_name='spotify.presence.proto.StateList',
  filename=None,
  file=DESCRIPTOR,
  containing_type=None,
  fields=[
    descriptor.FieldDescriptor(
      name='states', full_name='spotify.presence.proto.StateList.states', index=0,
      number=1, type=11, cpp_type=10, label=3,
      has_default_value=False, default_value=[],
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
  ],
  extensions=[
  ],
  nested_types=[],
  enum_types=[
  ],
  options=None,
  is_extendable=False,
  extension_ranges=[],
  serialized_start=1882,
  serialized_end=1940,
)

_GENERICPRESENCESTATE.fields_by_name['device_information'].message_type = _DEVICEINFORMATION
_STATE.fields_by_name['type'].enum_type = _STATE_TYPE
_STATE.fields_by_name['playlist_published'].message_type = _PLAYLISTPUBLISHEDSTATE
_STATE.fields_by_name['playlist_track_added'].message_type = _PLAYLISTTRACKADDEDSTATE
_STATE.fields_by_name['track_finished_playing'].message_type = _TRACKFINISHEDPLAYINGSTATE
_STATE.fields_by_name['favorite_app_added'].message_type = _FAVORITEAPPADDEDSTATE
_STATE.fields_by_name['track_started_playing'].message_type = _TRACKSTARTEDPLAYINGSTATE
_STATE.fields_by_name['uri_shared'].message_type = _URISHAREDSTATE
_STATE.fields_by_name['artist_followed'].message_type = _ARTISTFOLLOWEDSTATE
_STATE.fields_by_name['generic'].message_type = _GENERICPRESENCESTATE
_STATE_TYPE.containing_type = _STATE;
_STATELIST.fields_by_name['states'].message_type = _STATE
DESCRIPTOR.message_types_by_name['PlaylistPublishedState'] = _PLAYLISTPUBLISHEDSTATE
DESCRIPTOR.message_types_by_name['PlaylistTrackAddedState'] = _PLAYLISTTRACKADDEDSTATE
DESCRIPTOR.message_types_by_name['TrackFinishedPlayingState'] = _TRACKFINISHEDPLAYINGSTATE
DESCRIPTOR.message_types_by_name['FavoriteAppAddedState'] = _FAVORITEAPPADDEDSTATE
DESCRIPTOR.message_types_by_name['TrackStartedPlayingState'] = _TRACKSTARTEDPLAYINGSTATE
DESCRIPTOR.message_types_by_name['UriSharedState'] = _URISHAREDSTATE
DESCRIPTOR.message_types_by_name['ArtistFollowedState'] = _ARTISTFOLLOWEDSTATE
DESCRIPTOR.message_types_by_name['DeviceInformation'] = _DEVICEINFORMATION
DESCRIPTOR.message_types_by_name['GenericPresenceState'] = _GENERICPRESENCESTATE
DESCRIPTOR.message_types_by_name['State'] = _STATE
DESCRIPTOR.message_types_by_name['StateList'] = _STATELIST

class PlaylistPublishedState(message.Message):
  __metaclass__ = reflection.GeneratedProtocolMessageType
  DESCRIPTOR = _PLAYLISTPUBLISHEDSTATE
  
  # @@protoc_insertion_point(class_scope:spotify.presence.proto.PlaylistPublishedState)

class PlaylistTrackAddedState(message.Message):
  __metaclass__ = reflection.GeneratedProtocolMessageType
  DESCRIPTOR = _PLAYLISTTRACKADDEDSTATE
  
  # @@protoc_insertion_point(class_scope:spotify.presence.proto.PlaylistTrackAddedState)

class TrackFinishedPlayingState(message.Message):
  __metaclass__ = reflection.GeneratedProtocolMessageType
  DESCRIPTOR = _TRACKFINISHEDPLAYINGSTATE
  
  # @@protoc_insertion_point(class_scope:spotify.presence.proto.TrackFinishedPlayingState)

class FavoriteAppAddedState(message.Message):
  __metaclass__ = reflection.GeneratedProtocolMessageType
  DESCRIPTOR = _FAVORITEAPPADDEDSTATE
  
  # @@protoc_insertion_point(class_scope:spotify.presence.proto.FavoriteAppAddedState)

class TrackStartedPlayingState(message.Message):
  __metaclass__ = reflection.GeneratedProtocolMessageType
  DESCRIPTOR = _TRACKSTARTEDPLAYINGSTATE
  
  # @@protoc_insertion_point(class_scope:spotify.presence.proto.TrackStartedPlayingState)

class UriSharedState(message.Message):
  __metaclass__ = reflection.GeneratedProtocolMessageType
  DESCRIPTOR = _URISHAREDSTATE
  
  # @@protoc_insertion_point(class_scope:spotify.presence.proto.UriSharedState)

class ArtistFollowedState(message.Message):
  __metaclass__ = reflection.GeneratedProtocolMessageType
  DESCRIPTOR = _ARTISTFOLLOWEDSTATE
  
  # @@protoc_insertion_point(class_scope:spotify.presence.proto.ArtistFollowedState)

class DeviceInformation(message.Message):
  __metaclass__ = reflection.GeneratedProtocolMessageType
  DESCRIPTOR = _DEVICEINFORMATION
  
  # @@protoc_insertion_point(class_scope:spotify.presence.proto.DeviceInformation)

class GenericPresenceState(message.Message):
  __metaclass__ = reflection.GeneratedProtocolMessageType
  DESCRIPTOR = _GENERICPRESENCESTATE
  
  # @@protoc_insertion_point(class_scope:spotify.presence.proto.GenericPresenceState)

class State(message.Message):
  __metaclass__ = reflection.GeneratedProtocolMessageType
  DESCRIPTOR = _STATE
  
  # @@protoc_insertion_point(class_scope:spotify.presence.proto.State)

class StateList(message.Message):
  __metaclass__ = reflection.GeneratedProtocolMessageType
  DESCRIPTOR = _STATELIST
  
  # @@protoc_insertion_point(class_scope:spotify.presence.proto.StateList)

# @@protoc_insertion_point(module_scope)