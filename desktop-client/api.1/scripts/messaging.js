/**
 * @fileoverview Functions for sending messages and listing received messages.
 * @module api/messaging
 */

require(['$api/models'], function(models) {
  /**
   * @typedef {module:api/models~Album|module:api/models~Artist|module:api/models~Playlist|module:api/models~Track}
   */
  var Attachment;

  /**
   * The status of a conversation.
   * @enum {string}
   */
  var State = {
    UNREAD: 'unread',
    SEEN: 'seen',
    REPLIED: 'replied'
  };

  /**
   * Creates an object that represents a single conversation.
   *
   * @class Conversation
   * @classdesc A single conversation with one or more users.
   * @since 1.3.0
   * @private
   *
   * @property {module:api/models~Collection} messages A collection of messages
   *     in this conversation.
   * @property {State} state The state of this conversation.
   * @property {Date} timestamp The timestamp of the most recent message in
   *     this conversation.
   * @property {string} uri The URI of this conversation.
   * @property {Array.<module:api/models~User>} users A list of users that this
   *     conversation is with.
   *
   * @param {string} uri The URI of the conversation.
   */
  function Conversation(uri) {
    models.BridgeLoadable.call(this);

    this.resolve('uri', uri);
    this.resolve('messages', new models.Collection(Message, 'messaging_conversation_messages', null, uri));
  }
  SP.inherit(Conversation, models.BridgeLoadable);

  models.Loadable.define(Conversation, [
    'messages',
    'state',
    'timestamp',
    'uri',
    'users'
  ]);

  Conversation.prototype._make_timestamp = function(value) {
    return new Date(value);
  };

  Conversation.prototype._make_users = function(value) {
    return models.User.fromURIs(value);
  };

  Conversation.fromURI = models.Cache.lookup;
  Conversation._cache = new models.Cache(Conversation);

  /**
   * Adds a message to a conversation.
   *
   * @since 1.3.0
   *
   * @param {string} text The message text.
   * @param {Attachment=} opt_attachment An optional attachment (such as a
   *     track).
   *
   * @return {module:api/models~Promise} A promise.
   */
  Conversation.prototype.send = function(text, opt_attachment) {
    var args = [this.uri, text];
    if (opt_attachment) args.push(opt_attachment.uri);
    return models.promisedRequest(this, 'messaging_conversation_reply', args, true);
  };

  /**
   * Creates an object that represents a single message.
   *
   * @class Message
   * @classdesc A single message from a user. May have an attachment (such as a
   *     track).
   * @since 1.3.0
   * @private
   *
   * @property {Attachment} attachment An optional attachment (such as a
   *     track).
   * @property {State} state The state of this message.
   * @property {string} text The message text.
   * @property {Date} timestamp The timestamp of this message.
   * @property {string} uri The URI of this message.
   * @property {module:api/models~User} user The user who sent this message.
   *
   * @param {string} uri The URI of this message.
   */
  function Message(uri) {
    models.BridgeLoadable.call(this);

    this.resolve('uri', uri);
  }
  SP.inherit(Message, models.BridgeLoadable);

  models.Loadable.define(Message, [
    'attachment',
    'state',
    'text',
    'timestamp',
    'uri',
    'user'
  ]);

  Message.prototype._make_attachment = function(value) {
    return models.fromURI(value);
  };

  Message.prototype._make_timestamp = function(value) {
    return new Date(value);
  };

  Message.prototype._make_user = function(value) {
    return models.User.fromURI(value);
  };

  Message.fromURI = models.Cache.lookup;
  Message._cache = new models.Cache(Message);

  /**
   * Sends a message to one or more users.
   *
   * @since 1.3.0
   *
   * @param {Array.<module:api/models~User>} to One or more users to send the
   *     message to.
   * @param {string} text The message text.
   * @param {Attachment=} opt_attachment An optional attachment (such as a
   *     track).
   *
   * @return {module:api/models~Promise} A promise that resolves when message is sent.
   *
   * TODO: @return promise should resolve to {@link Conversation} instance.
   */
  function send(to, text, opt_attachment) {
    var args = [SP.uris(to), text];
    if (opt_attachment) args.push(opt_attachment.uri);

    var promise = new models.Promise();
    // The current desktop bridge implementation does not return any result from sending a message.
    // SP.request('messaging_send', args, promise, _sendDone, promise.setFail);
    SP.request('messaging_send', args, promise, promise.setDone, promise.setFail);
    return promise;
  }

  /**
   * Sets the object of the send promise to the conversation the message was
   * sent to.
   * @this {module:api/models~Promise}
   * @private
   */
  function _sendDone(result) {
    var convo = Conversation.fromURI(result.uri);
    convo.resolveMany(0, result);
    this.setDone(convo);
  }

  /**
   * A collection of conversations in the user's inbox.
   * @type {module:api/models~Collection}
   */
  var inbox = new models.Collection(Conversation, 'messaging_conversations', null, models.session.user.uri);

  exports.Conversation = Conversation;
  exports.Message = Message;
  exports.State = State;
  exports.inbox = inbox;
  exports.send = send;
});
