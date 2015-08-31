var config = require('../settings.json');
var c = require('irc-colors').global();
var whitelisted = require('./whitelist.js').whitelisted;
var modlisted = require('./whitelist.js').modlisted;

var enabled = true;
var settings = config.sound
var PREFIX = 'sound';

var soundEvent = function(eventName) {
  this.subscribers = [];
  this.subscribe = function(handler) {
    if(handler) {
      this.subscribers.push(handler);
    }
  }
  this.invoke = function(args) {
    for(s in this.subscribers) {
      var f = this.subscribers[s];
      f(args);
    }
  }
}

exports.handleMessage = function(channel, who, message) {
  return message;
}

exports.status = function() {
  return '';
}

// Expose series published events which can be subscribed to
// and also invoked by subscribers.
var events = {
  'youtubeStart' : new soundEvent('youtubeStart'),
  'youtubeEnd' : new soundEvent('youtubeEnd')
}

exports.subscribe = function(event, handler) {
  var e = events[event];
  if(e) {
    e.subscribe(handler);
  }
  return e;
}
