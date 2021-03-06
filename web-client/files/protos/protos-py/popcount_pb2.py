# Generated by the protocol buffer compiler.  DO NOT EDIT!

from google.protobuf import descriptor
from google.protobuf import message
from google.protobuf import reflection
from google.protobuf import descriptor_pb2
# @@protoc_insertion_point(imports)



DESCRIPTOR = descriptor.FileDescriptor(
  name='popcount.proto',
  package='spotify.popcount2.proto',
  serialized_pb='\n\x0epopcount.proto\x12\x17spotify.popcount2.proto\"\x11\n\x0fPopcountRequest\"}\n\x0ePopcountResult\x12\r\n\x05\x63ount\x18\x01 \x01(\x12\x12\x11\n\ttruncated\x18\x02 \x01(\x08\x12\x0c\n\x04user\x18\x03 \x03(\t\x12\x1e\n\x16subscriptionTimestamps\x18\x04 \x03(\x12\x12\x1b\n\x13insertionTimestamps\x18\x05 \x03(\x12')




_POPCOUNTREQUEST = descriptor.Descriptor(
  name='PopcountRequest',
  full_name='spotify.popcount2.proto.PopcountRequest',
  filename=None,
  file=DESCRIPTOR,
  containing_type=None,
  fields=[
  ],
  extensions=[
  ],
  nested_types=[],
  enum_types=[
  ],
  options=None,
  is_extendable=False,
  extension_ranges=[],
  serialized_start=43,
  serialized_end=60,
)


_POPCOUNTRESULT = descriptor.Descriptor(
  name='PopcountResult',
  full_name='spotify.popcount2.proto.PopcountResult',
  filename=None,
  file=DESCRIPTOR,
  containing_type=None,
  fields=[
    descriptor.FieldDescriptor(
      name='count', full_name='spotify.popcount2.proto.PopcountResult.count', index=0,
      number=1, type=18, cpp_type=2, label=1,
      has_default_value=False, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='truncated', full_name='spotify.popcount2.proto.PopcountResult.truncated', index=1,
      number=2, type=8, cpp_type=7, label=1,
      has_default_value=False, default_value=False,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='user', full_name='spotify.popcount2.proto.PopcountResult.user', index=2,
      number=3, type=9, cpp_type=9, label=3,
      has_default_value=False, default_value=[],
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='subscriptionTimestamps', full_name='spotify.popcount2.proto.PopcountResult.subscriptionTimestamps', index=3,
      number=4, type=18, cpp_type=2, label=3,
      has_default_value=False, default_value=[],
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='insertionTimestamps', full_name='spotify.popcount2.proto.PopcountResult.insertionTimestamps', index=4,
      number=5, type=18, cpp_type=2, label=3,
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
  serialized_start=62,
  serialized_end=187,
)

DESCRIPTOR.message_types_by_name['PopcountRequest'] = _POPCOUNTREQUEST
DESCRIPTOR.message_types_by_name['PopcountResult'] = _POPCOUNTRESULT

class PopcountRequest(message.Message):
  __metaclass__ = reflection.GeneratedProtocolMessageType
  DESCRIPTOR = _POPCOUNTREQUEST
  
  # @@protoc_insertion_point(class_scope:spotify.popcount2.proto.PopcountRequest)

class PopcountResult(message.Message):
  __metaclass__ = reflection.GeneratedProtocolMessageType
  DESCRIPTOR = _POPCOUNTRESULT
  
  # @@protoc_insertion_point(class_scope:spotify.popcount2.proto.PopcountResult)

# @@protoc_insertion_point(module_scope)
