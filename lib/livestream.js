var Livestreamer = require('./livestreamer.js')
var c = require('irc-colors').global();
var config = require('../settings.json');
var whitelisted = require('./whitelist.js').whitelisted;
var modlisted = require('./whitelist.js').modlisted;
var soundSystem = require('./sound.js');

var bind = function(func, thisValue) {
  return function() {
    return func.apply(thisValue, arguments);
  }
}

function Livestream(settings) {
  this.settings = settings;
  this.prefix = settings.prefix;
  this.INSTANCE = settings.instance;
  this.display = settings.display;
  this.enabled = true;
  this.livestreamer = null;
  this.queue = [];
  this.youtubeStartEvent = soundSystem.subscribe('youtubeStart', null);
  this.youtubeStopEvent = soundSystem.subscribe('youtubeEnd', null);

  // need to bind up member methods so pass to decorators
  var FILENAME = bind(this.filename, this);
  // var TIME = bind(this.time, this);
  var PAUSE = bind(this.pause, this);
  var UNPAUSE = bind(this.unpause, this);
  var MUTE = bind(this.mute, this);
  var UNMUTE = bind(this.unmute, this);
  var QUIT = bind(this.quit, this);
  var WIPEALL = bind(this.wipeAll, this);
  var ON = bind(this.on, this);
  var OFF = bind(this.off, this);
  // var SUBS = bind(this.subs, this);
  // var SUBTITLETRACK = bind(this.subtitleTrack, this);
  // var AUDIOTRACK = bind(this.audioTrack, this);
  // var SEEK = bind(this.seekSeconds, this);
  var PLAYFILE = bind(this.playFile, this);

  this.handlers = {
    "$" : FILENAME,
    //"y (h|help)$" : help,
    "( )?(f|file|filename)$" : FILENAME,
    // "( )?(t|time)$" : TIME,
    " (pause on|pause)$" : whitelisted(PAUSE),
    " (pause off|unpause)$" : whitelisted(UNPAUSE),
    " (mute on|mute)$" : whitelisted(MUTE),
    " (mute off|unmute)$" : whitelisted(UNMUTE),
    " (q|quit|wipe|next)$" : whitelisted(QUIT),
    " wipe all$" : whitelisted(WIPEALL),
    " on$" : whitelisted(ON),
    " off$" : whitelisted(OFF),
    // " subs (on|off)$" : whitelisted(SUBS),
    // " subs (\\d)$" : whitelisted(SUBTITLETRACK),
    // " audio (\\d)$" : whitelisted(AUDIOTRACK),
    // ' seek ([+-]?[0-9]{1,9})$' : whitelisted(SEEK),
    " (\\S+)$" : whitelisted(PLAYFILE)
  };
}

Livestream.prototype.handleMessage = function(channel, who, message) {

  // first do a general filter to save us a lot of redundant work
  if(!message.match(RegExp(config.delimiter + this.prefix, "i"))) {
    return message;
  }

  for(var h in this.handlers) {
    regex =  RegExp(config.delimiter + this.prefix + h, "i");
    var match = regex.exec(message);
    if(match) {
      return this.handlers[h](channel, who, message, match);
    }
  }
  return message;
}

Livestream.prototype.status = function() {
  if(this.livestreamer) {
    var queueDesc = '';
    if(this.queue.length) {
      queueDesc = ' (' + this.queue.length.toString() + ' queued)';
    }
    var playingDesc = '[' + this.INSTANCE +' PLAYING]' + queueDesc;
    return playingDesc.irc.yellow.bggreen.bold();
  }else if(this.enabled){
    var s = '[' + this.INSTANCE + ' ON]';
    return s.irc.white.bggreen.bold();
  }
  var s = '[' + this.INSTANCE +' OFF]';
  return s.irc.black.bgred();
}

Livestream.prototype.on = function(channel, who, message, match) {
  this.enabled = true;
  return null;
}

Livestream.prototype.off = function(channel, who, message, match) {
  this.enabled = false;
  if(this.livestreamer) {
    this.quit(channel, who, message, match);
  }
  return null;
}

Livestream.prototype.playFile = function(channel, who, message, match) {
  var that = this;
  if(!this.enabled) {
    return message;
  }
  var filename = match[1];
  if(this.livestreamer) {
    this.queue.push(filename);
    return null;
  }else{
    this.livestreamer = new Livestreamer(this.settings, filename, channel);
    if(this.youtubeStartEvent) {
      this.youtubeStartEvent.invoke(null);
    }
    this.livestreamer.onComplete = function X() {
      if(that.queue.length) {
        var f = that.queue.shift();
        that.livestreamer = new Livestreamer(that.settings, f, channel);
        that.livestreamer.onComplete = X;
      }else{
        that.livestreamer=null;
        if(that.youtubeStopEvent) {
          that.youtubeStopEvent.invoke(null);
        }
      }
    };
  }
  return null;
}
Livestream.prototype.quit = function(channel, who, message, match) {
  if(this.livestreamer) {
    this.livestreamer.quit();
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

Livestream.prototype.wipeAll = function(channel, who, message, match) {
  this.queue = [];
  this.quit(channel, who, message, match);
  return null;
}

Livestream.prototype.filename = function(channel, who, message, match) {
  if(this.livestreamer) {
    this.livestreamer.filename(channel);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

Livestream.prototype.time = function(channel, who, message, match) {
  if(this.livestreamer) {
    this.livestreamer.timeRemaining(channel);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

Livestream.prototype.pause = function(channel, who, message, match) {
  var on = true;
  if(this.livestreamer) {
    this.livestreamer.pause(on);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

Livestream.prototype.unpause = function(channel, who, message, match) {
  var on = false;
  if(this.livestreamer) {
    this.livestreamer.pause(on);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

Livestream.prototype.mute = function(channel, who, message, match) {
  var on = true;
  if(this.livestreamer) {
    this.livestreamer.mute(on);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

Livestream.prototype.unmute = function(channel, who, message, match) {
  var on = false;
  if(this.livestreamer) {
    this.livestreamer.mute(on);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

Livestream.prototype.subs = function(channel, who, message, match) {
  var arg = match[1];
  var on = true;
  if(arg=='off'){on=false;}
  if(this.livestreamer) {
    this.livestreamer.subs(on);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

Livestream.prototype.subtitleTrack = function(channel, who, message, match) {
  var id = match[1];
  if(this.livestreamer) {
    this.livestreamer.subtitleTrack(channel, id);
  }
  return null;
}

Livestream.prototype.audioTrack = function(channel, who, message, match) {
  var id = match[1];
  if(this.livestreamer) {
    this.livestreamer.audioTrack(channel, id);
  }
  return null;
}

Livestream.prototype.seekSeconds = function(channel, who, message, match) {
  var s = match[1];
  if(this.livestreamer) {
    this.livestreamer.seekSeconds(channel, s);
  }
  return null;
}


module.exports = Livestream;
