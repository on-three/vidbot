var Mpv = require('./mpv.js')
var c = require('irc-colors').global();
var config = require('../settings.json');
var whitelisted = require('./whitelist.js').whitelisted;
var modlisted = require('./whitelist.js').modlisted;
var soundSystem = require('./sound.js');

var JStream = function() {
  this.mpv = null;
  this.enabled = true;
  this.settings = config.jstream
  this.PREFIX = 'jstream';
  var that = this;
  this.handlers = {
    //"jstream (h|help)$" : help,
    "( start)?$" : whitelisted(this, this.start),
    " (q|quit|wipe|stop)$" : whitelisted(this, this.quit ),
    " (m|mute)$" : whitelisted(this, this.mute ),
    " (u|unmute)$" : whitelisted(this, this.unmute ),
  };

  this.youtubeStartEvent = soundSystem.subscribe('youtubeStart',
    function(){that._mute();}
  );
  this.youtubeStopEvent = soundSystem.subscribe('youtubeEnd',
    function(){that._unmute();}
  );
}

JStream.prototype.handleMessage = function(channel, who, message) {

  // first do a general filter to save us a lot of redundant work
  if(!message.match(RegExp(config.delimiter + this.PREFIX, "i"))) {
    return message;
  }

  for(var h in this.handlers) {
    regex =  RegExp(config.delimiter + this.PREFIX + h, "i");
    var match = regex.exec(message);
    if(match) {
      return this.handlers[h](channel, who, message, match);
    }
  }
  return message;
}

JStream.prototype.status = function() {
  if(this.mpv) {
    return '[JSTREAM PLAYING]'.irc.yellow.bggreen.bold();
  }else if(this.enabled){
    return '[JSTREAM ON]'.irc.white.bggreen.bold();
  }
  return '[JSTREAM OFF]'.irc.black.bgred();
}

JStream.prototype.on = function(channel, who, message, match) {
  this.enabled = true;
  return null;
}

JStream.prototype.off = function(channel, who, message, match) {
  this.enabled = false;
  if(this.mpv) {
    this.quit(channel, who, message, match);
  }
  return null;
}

JStream.prototype.start = function(channel, who, message, match){
  var that = this;
  if(!this.enabled) {
    return message;
  }
  if(this.mpv) {
    return null;
  }else{
    this.mpv = new Mpv(this.settings, this.settings.url, channel);
    this.mpv.onComplete = function X() {
      that.mpv=null;
    };
  }
  return null;
}
JStream.prototype.quit = function(channel, who, message, match){
  if(this.mpv) {
    this.mpv.quit();
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

JStream.prototype._mute = function(args) {
  if(this.mpv) {
    this.mpv.mute(true);
  }
}

JStream.prototype._unmute = function(args) {
  if(this.mpv) {
    this.mpv.mute(false);
  }
}

JStream.prototype.mute = function(channel, who, message, match){
  this._mute();
  return null;
}

JStream.prototype.unmute = function(channel, who, message, match){
  this._unmute();
  return null;
}

JStream.prototype.onYoutubeStart = function(args) {
  this.mute();
}

JStream.prototype.onYoutubeEnd = function(args) {
  this.unmute();
}

module.exports = JStream;
