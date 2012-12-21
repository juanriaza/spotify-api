'use strict';

/**
 * Countdown calculator.
 *
 * @module countdown
 */

/**
 * Countdown object taking care of counting down from a timestamp to 0.
 *
 * @constructor
 *
 * @param {number}    timeout  Number of seconds to count down from.
 * @param {function=} callback Callback function to be called each second.
 * @param {number=}   interval Number of milliseconds between each tick.
 */
function Countdown (timeout, callback, interval) {

  // Keep the values valid
  timeout = typeof timeout === 'number' ? timeout : 0;
  timeout = timeout < 0 ? 0 : timeout;
  callback = typeof callback === 'function' ? callback : function () {};
  interval = typeof interval === 'number' ? interval : 1000;
  interval = interval < 1 ? 1 : 1000;

  // Set the values
  this.time = timeout;
  this.callback = callback;
  this.interval = interval;

  // Trigger the callback once to notify about initial values
  var time = calculateTime(this.time);
  this.callback(time.hours, time.minutes, time.seconds);

  // Start the timer automatically on creation
  if (this.time > 0) {
    this.start();
  }
}

/**
 * Starts the countdown timer, which will run every second.
 */
Countdown.prototype.start = function () {
  this.timer = setInterval(this.tick.bind(this), this.interval);
};

/**
 * Stops the countdown timer.
 */
Countdown.prototype.stop = function () {
  clearInterval(this.timer);
};

/**
 * The tick function that will run every second.
 */
Countdown.prototype.tick = function() {

  // Avoid running down to negative time
  if (this.time < 1) {
    return;
  }

  // Count down
  this.time--;

  // Stop the timer when the countdown has reached the end
  if (this.time === 0) {
    this.stop();
  }

  var time = calculateTime(this.time);
  this.callback(time.hours, time.minutes, time.seconds);
};

/**
 * Devide time from seconds to hours, minutes and seconds.
 *
 * @param {number} timestamp Number of seconds
 *
 * @return {Object} Object containing properties hours, minutes and seconds.
 *
 * @ignore
 */
function calculateTime (timestamp) {
  var hours, minutes, seconds;
  hours = Math.floor(timestamp / 3600);
  minutes = Math.floor((timestamp % 3600) / 60);
  seconds = Math.ceil((timestamp % 3600) % 60);

  return {
    hours: hours,
    minutes: minutes,
    seconds: seconds
  }
}


/**
 * Set up data that the module needs.
 *
 * @param {Object} app Main app object.
 */
exports.create = function (timeout, callback) {
  return new Countdown(timeout, callback);
};