var Peerflix = require('./peerflix.js')
var c = require('irc-colors').global();
var config = require('../settings.json');
var whitelisted = require('./whitelist.js').whitelisted;
var modlisted = require('./whitelist.js').modlisted;
var soundSystem = require('./sound.js');

var bind = function(thisValue, func) {
  return function() {
    return func.apply(thisValue, arguments);
  }
}

function Torrent(settings) {
  this.settings = settings;
  this.prefix = settings.prefix;
  this.INSTANCE = settings.instance;
  this.display = settings.display;
  this.enabled = true;
  this.peerflix = null;
  this.queue = [];
  this.youtubeStartEvent = soundSystem.subscribe('youtubeStart', null);
  this.youtubeStopEvent = soundSystem.subscribe('youtubeEnd', null);

  this.handlers = {
    "$" : bind(this, this.filename),
    //"y (h|help)$" : help,
    "( )?(f|file|filename)$" : bind(this, this.filename),
    "( )?(t|time)$" : bind(this, this.time),
    " (pause on|pause)$" : whitelisted(this, this.pause),
    " (pause off|unpause)$" : whitelisted(this, this.unpause),
    " (mute on|mute)$" : whitelisted(this, this.mute),
    " (mute off|unmute)$" : whitelisted(this, this.unmute),
    " (q|quit|wipe|next)$" : whitelisted(this, this.quit),
    " wipe all$" : whitelisted(this, this.wipeAll),
    " on$" : whitelisted(this, this.on),
    " off$" : whitelisted(this, this.off),
    " subs (on|off)$" : whitelisted(this, this.subs),
    " subs (\\d)$" : whitelisted(this, this.subtitleTrack),
    " audio (\\d)$" : whitelisted(this, this.audioTrack),
    ' seek ([+-]?[0-9]{1,9})$' : whitelisted(this, this.seekSeconds),
    " (\\S+)$" : whitelisted(this, this.playFile)
  };
}

Torrent.prototype.handleMessage = function(channel, who, message) {

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

Torrent.prototype.status = function() {
  if(this.peerflix) {
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

Torrent.prototype.on = function(channel, who, message, match) {
  this.enabled = true;
  return null;
}

Torrent.prototype.off = function(channel, who, message, match) {
  this.enabled = false;
  if(this.peerflix) {
    this.quit(channel, who, message, match);
  }
  return null;
}

Torrent.prototype.playFile = function(channel, who, message, match) {
  var that = this;
  if(!this.enabled) {
    return message;
  }
  var filename = match[1];
  if(this.peerflix) {
    this.queue.push(filename);
    return null;
  }else{
    this.peerflix = new Peerflix(this.settings, filename, channel);
    if(this.youtubeStartEvent) {
      this.youtubeStartEvent.invoke(null);
    }
    this.peerflix.onComplete = function X() {
      console.log("TORRENT ONCOMPELETE INVOKED");
      // if(that.queue.length) {
      //   var f = that.queue.shift();
      //   that.peerflix = new Peerflix(that.settings, f, channel);
      //   that.peerflix.onComplete = X;
      // }else{
        that.peerflix=null;
        if(that.youtubeStopEvent) {
          that.youtubeStopEvent.invoke(null);
        }
      //}
    };
  }
  return null;
}
Torrent.prototype.quit = function(channel, who, message, match) {
  if(this.peerflix) {
    this.peerflix.quit();
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

Torrent.prototype.wipeAll = function(channel, who, message, match) {
  this.queue = [];
  this.quit(channel, who, message, match);
  return null;
}

Torrent.prototype.filename = function(channel, who, message, match) {
  if(this.peerflix) {
    this.peerflix.filename(channel);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

Torrent.prototype.time = function(channel, who, message, match) {
  console.log("time method invoked.");
  if(this.peerflix) {
    this.peerflix.timeRemaining(channel);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

Torrent.prototype.pause = function(channel, who, message, match) {
  var on = true;
  if(this.peerflix) {
    this.peerflix.pause(on);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

Torrent.prototype.unpause = function(channel, who, message, match) {
  var on = false;
  if(this.peerflix) {
    this.peerflix.pause(on);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

Torrent.prototype.mute = function(channel, who, message, match) {
  var on = true;
  if(this.peerflix) {
    this.peerflix.mute(on);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

Torrent.prototype.unmute = function(channel, who, message, match) {
  var on = false;
  if(this.peerflix) {
    this.peerflix.mute(on);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

Torrent.prototype.subs = function(channel, who, message, match) {
  var arg = match[1];
  var on = true;
  if(arg=='off'){on=false;}
  if(this.peerflix) {
    this.peerflix.subs(on);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

Torrent.prototype.subtitleTrack = function(channel, who, message, match) {
  var id = match[1];
  if(this.peerflix) {
    this.peerflix.subtitleTrack(channel, id);
  }
  return null;
}

Torrent.prototype.audioTrack = function(channel, who, message, match) {
  var id = match[1];
  if(this.peerflix) {
    this.peerflix.audioTrack(channel, id);
  }
  return null;
}

Torrent.prototype.seekSeconds = function(channel, who, message, match) {
  var s = match[1];
  if(this.peerflix) {
    this.peerflix.seekSeconds(channel, s);
  }
  return null;
}

module.exports = Torrent;
