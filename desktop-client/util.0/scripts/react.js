'use strict';

var sp = getSpotifyApi();

var arr = sp.require('$util/array');

// Constructors
exports.EventStream = EventStream;
exports.Subscriber = Subscriber;
exports.Unsubscriber = Unsubscriber;

// EventStream combinators
exports.constant = _constant;
exports.distinct = _distinct;
exports.drop = _drop;
exports.dropFirst = partial(_drop, 1);
exports.filter = _filter;
exports.map = _map;
exports.merge = _merge;
exports.publish = _publish;
exports['switch'] = _switch;
exports.take = _take;
exports.takeFirst = partial(_take, 1);
exports.takeUntil = _takeUntil;
exports.throttle = _throttle;
exports.zip = _zip;

// Functions from various sources to EventStreams
exports.fromDOMEvent = fromDOMEvent;

/**
 * EventStream
 * @constructor
 */
function EventStream() {
  this.subscribers = [];
}

/**
 * @param {function(*):*} f [description].
 * @return {Unsubscriber} [description].
 */
EventStream.prototype.subscribe = function(f) {
  var subscriber = new Subscriber(f);
  this.subscribers.push(subscriber);
  return new Unsubscriber(subscriber, this);
};

/**
 * @param {EventStream} es [description].
 * @param {*} v [description].
 * @return {Array} [description].
 */
function _publish(es, v) {
  return map(function(s) {
    s.notify(v);
  }, es.subscribers);
}

/**
 * Subscriber
 * @param {function(*):*} f [description].
 * @constructor
 */
function Subscriber(f) {
  this.notify = f;
}

/**
 * Unsubscriber
 * @param {Subscriber} s [description].
 * @param {Array.<Subscriber>} ss [description].
 * @constructor
 */
function Unsubscriber(s, ss) {
  this.subscriber = s;
  this.eventStream = ss;
}

Unsubscriber.prototype.unsubscribe = function() {
  this.eventStream.subscribers =
      arr['delete'](this.subscriber,
      this.eventStream.subscribers);
};

/**
 * @param {function(...):*} f [description].
 * @param {number} t [description].
 * @return {function(...):*} [description].
 */
function _delay(f, t) {
  return function(/*args...*/) {
    var args = arguments;
    setTimeout(function() {
      return f.apply(f, args);
    }, t);
  };
}

/**
 * @param {EventStream} esA [description].
 * @param {*} v [description].
 * @return {EventStream} [description].
 */
function _constant(esA, v) {
  var esB = new EventStream();
  esA.subscribe(constant(partial(_publish, esB, v)));
  return esB;
}

/**
 * @param {function(*):*} f [description].
 * @param {EventStream} esA [description].
 * @return {EventStream} [description].
 */
function _map(f, esA) {
  var esB = new EventStream();
  esA.subscribe(function(v) {
    _publish(esB, f(v));
  });
  return esB;
}

/**
 * @param {function(*):*} p [description].
 * @param {EventStream} esA [description].
 * @return {EventStream} [description].
 */
function _filter(p, esA) {
  var esB = new EventStream();
  esA.subscribe(function(v) {
    if (true === p(v)) {
      _publish(esB, v);
    }
  });
  return esB;
}

/**
 * @param {number} n [description].
 * @param {EventStream} esA [description].
 * @return {EventStream} [description].
 */
function _drop(n, esA) {
  var dropped = 0;
  var esB = new EventStream();
  esA.subscribe(function(v) {
    if (n === dropped) {
      _publish(esB, v);
    } else {
      ++dropped;
    }
  });
  return esB;
}

/**
 * @param {number} n [description].
 * @param {EventStream} esA [description].
 * @return {EventStream} [description].
 */
function _take(n, esA) {
  var esB = new EventStream();
  var taken = 0;
  var us = esA.subscribe(function(v) {
    if (n === taken) {
      us.unsubscribe();
    } else {
      ++taken;
      _publish(esB, v);
    }
  });
  return esB;
}

/**
 * @param {EventStream} esA Stop taking when this produces a value.
 * @param {EventStream} esB Take from this.
 * @return {EventStream} [description].
 */
function _takeUntil(esA, esB) {
  var esC = new EventStream();
  var us = esB.subscribe(partial(_publish, esC));
  esA.subscribe(function(x) {
    us.unsubscribe();
  });
  return esC;
}

/**
 * @param {EventStream} esA [description].
 * @param {EventStream} esB [description].
 * @return {EventStream} [description].
 */
function _zip(esA, esB) {
  var esC = new EventStream();
  var esAB = _merge(esA, esB);
  var received = 0;
  var prevVal;
  var subscriber = function(v) {
    if (2 === ++received) {
      received = 0;
      _publish(esC, [prevVal, v]);
    } else {
      prevVal = v;
    }
  };
  esAB.subscribe(subscriber);
  return esC;
}

/**
 * @param {EventStream} esA [description].
 * @param {EventStream} esB [description].
 * @return {EventStream} [description].
 */
function _merge(esA, esB) {
  var esC = new EventStream();
  var subscriber = partial(_publish, esC);
  esA.subscribe(subscriber);
  esB.subscribe(subscriber);
  return esC;
}

/**
 * An EventStream that publishes only when the value has changed from the previous one
 * @param {EventStream} esA [description].
 * @return {EventStream} [description].
 */
function _distinct(esA) {
  var esB = new EventStream();
  var lastVal;
  esA.subscribe(function(v) {
    if (v !== lastVal) {
      _publish(esB, v);
    }
    lastVal = v;
  });
  return esB;
}

/**
 * Switch from one EventStream to another
 * @param {EventStream} esA [description].
 * @param {function(*):EventStream} f [description].
 * @return {EventStream} [description].
 */
function _switch(esA, f) {
  var esB = new EventStream();
  esA.subscribe(function(x) {
    f(x).subscribe(partial(_publish, esB));
  });
  return esB;
}

/**
 * Throttle an EventStream by discarding events
 * @param {EventStream} esA [description].
 * @param {number} t [description].
 * @return {EventStream} [description].
 */
function _throttle(esA, t) {
  var esB = new EventStream();
  var toID = null;
  var prevTs = null;

  esA.subscribe(function(v) {
    var ts = Date.now();
    var elapsed = ts - (prevTs || 0);

    function next() {
      prevTs = ts;
      _publish(esB, v);
    }

    if (toID) clearTimeout(toID), toID = null;
    (elapsed >= t ? next() : toID = setTimeout(next, t - elapsed));
  });
  return esB;
}

/**
 * Transform a DOM event into an EventStream
 * @param {*} target [description].
 * @param {string} eventName [description].
 * @param {boolean} capture [description].
 * @return {EventStream} [description].
 */
function fromDOMEvent(target, eventName, capture) {
  var es = new EventStream();
  var eventListener = partial(_publish, es);
  target.addEventListener(eventName, eventListener, undefined === capture ? false : capture);
  return es;
}
